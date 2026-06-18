import type { QueryClient } from '@tanstack/react-query'
import type { Execution, ExecutionStatus } from '../model/execution'
import { executionKeys } from './execution-query-keys'
import { mergeExecutionIntoList, normalizeExecutionStatus, updateExecutionStatus } from './execution-display'

type ExecutionStatusObservationSource = 'http' | 'realtime'

interface ExecutionStatusObservation {
  observedAt?: string | null
  receivedAt?: number
  source: ExecutionStatusObservationSource
}

export interface ExecutionStatusReadModelEntry {
  observedAt: number | null
  status: ExecutionStatus
}

export type ExecutionStatusReadModel = Record<string, ExecutionStatusReadModelEntry>

export const normalizeExecutionRecord = (execution: Execution): Execution => ({
  ...execution,
  status: normalizeExecutionStatus(execution.status),
})

const parseObservationTime = (value?: string | null) => {
  if (!value?.trim()) return null

  const observedAt = new Date(value).getTime()

  return Number.isNaN(observedAt) ? null : observedAt
}

const getObservationTime = (observation: ExecutionStatusObservation) => {
  const observedAt = parseObservationTime(observation.observedAt)

  if (observedAt !== null) return observedAt
  if (observation.source === 'realtime') return observation.receivedAt ?? Date.now()

  return null
}

const shouldPreserveExistingStatus = (
  currentEntry: ExecutionStatusReadModelEntry | undefined,
  nextObservedAt: number | null,
) => {
  if (!currentEntry) return false
  if (nextObservedAt === null) return currentEntry.observedAt !== null
  if (currentEntry.observedAt === null) return false

  return nextObservedAt < currentEntry.observedAt
}

const createExecutionStatusReadModelEntry = (
  currentEntry: ExecutionStatusReadModelEntry | undefined,
  status: string,
  observation: ExecutionStatusObservation,
): ExecutionStatusReadModelEntry => {
  const nextObservedAt = getObservationTime(observation)

  if (currentEntry && shouldPreserveExistingStatus(currentEntry, nextObservedAt)) {
    return currentEntry
  }

  const normalizedStatus = normalizeExecutionStatus(status)

  if (currentEntry && currentEntry.status === normalizedStatus && currentEntry.observedAt === nextObservedAt) {
    return currentEntry
  }

  return {
    observedAt: nextObservedAt,
    status: normalizedStatus,
  }
}

const getFreshExecutionStatus = (
  statusReadModel: ExecutionStatusReadModel | undefined,
  executionId: string,
  status: string,
  observation: ExecutionStatusObservation,
) => createExecutionStatusReadModelEntry(statusReadModel?.[executionId], status, observation).status

const mergeExecutionStatusReadModelEntry = (
  statusReadModel: ExecutionStatusReadModel | undefined,
  executionId: string,
  status: string,
  observation: ExecutionStatusObservation,
) => {
  const nextEntry = createExecutionStatusReadModelEntry(statusReadModel?.[executionId], status, observation)

  if (statusReadModel?.[executionId] === nextEntry) {
    return statusReadModel
  }

  return {
    ...(statusReadModel ?? {}),
    [executionId]: nextEntry,
  }
}

const mergeExecutionStatusReadModelSnapshot = (
  statusReadModel: ExecutionStatusReadModel | undefined,
  executions: readonly Execution[],
) => {
  if (executions.length === 0) {
    return statusReadModel ?? {}
  }

  let updated = !statusReadModel
  const nextStatusReadModel = { ...(statusReadModel ?? {}) }

  executions.forEach((execution) => {
    const nextEntry = createExecutionStatusReadModelEntry(nextStatusReadModel[execution._id], execution.status, {
      observedAt: execution.updatedAt,
      source: 'http',
    })

    if (nextStatusReadModel[execution._id] === nextEntry) {
      return
    }

    nextStatusReadModel[execution._id] = nextEntry
    updated = true
  })

  return updated ? nextStatusReadModel : statusReadModel
}

const mergeExecutionIntoDetail = (currentExecution: Execution | undefined, nextExecution: Execution) => {
  if (!currentExecution) return currentExecution

  return {
    ...currentExecution,
    ...nextExecution,
  }
}

const mergeExecutionIntoCachedList = (
  executions: Execution[] | undefined,
  nextExecution: Execution,
): Execution[] | undefined => {
  if (!executions) return executions

  const existingExecutionIndex = executions.findIndex((execution) => execution._id === nextExecution._id)

  if (existingExecutionIndex === -1) {
    return executions
  }

  return mergeExecutionIntoList(executions, nextExecution)
}

const updateDetailExecutionStatus = (
  currentExecution: Execution | undefined,
  status: string,
): Execution | undefined => {
  if (!currentExecution) return currentExecution

  const normalizedStatus = normalizeExecutionStatus(status)

  if (currentExecution.status === normalizedStatus) {
    return currentExecution
  }

  return {
    ...currentExecution,
    status: normalizedStatus,
  }
}

export const syncExecutionStatusReadModelForTarget = (
  queryClient: QueryClient,
  executionId: string,
  status: string,
  targetKey: string,
  observation: Partial<ExecutionStatusObservation> = {},
) => {
  const statusObservation: ExecutionStatusObservation = {
    source: observation.source ?? 'realtime',
    observedAt: observation.observedAt,
    receivedAt: observation.receivedAt,
  }
  const statusReadModel = queryClient.getQueryData<ExecutionStatusReadModel>(executionKeys.statuses(targetKey))
  const freshStatus = getFreshExecutionStatus(statusReadModel, executionId, status, statusObservation)

  queryClient.setQueryData<ExecutionStatusReadModel>(executionKeys.statuses(targetKey), (statusReadModel) =>
    mergeExecutionStatusReadModelEntry(statusReadModel, executionId, status, statusObservation),
  )
  queryClient.setQueriesData<Execution[]>({ queryKey: executionKeys.listRoot(targetKey) }, (executions) =>
    updateExecutionStatus(executions, executionId, freshStatus),
  )
  queryClient.setQueryData<Execution>(executionKeys.detail(executionId, targetKey), (execution) =>
    updateDetailExecutionStatus(execution, freshStatus),
  )
}

export const syncExecutionFromDetailSnapshot = (queryClient: QueryClient, execution: Execution, targetKey: string) => {
  const statusReadModel = queryClient.getQueryData<ExecutionStatusReadModel>(executionKeys.statuses(targetKey))
  const normalizedExecution = {
    ...normalizeExecutionRecord(execution),
    status: getFreshExecutionStatus(statusReadModel, execution._id, execution.status, {
      observedAt: execution.updatedAt,
      source: 'http',
    }),
  }
  const listRootKey = executionKeys.listRoot(targetKey)

  queryClient.setQueryData<ExecutionStatusReadModel>(executionKeys.statuses(targetKey), (statusReadModel) =>
    mergeExecutionStatusReadModelEntry(statusReadModel, execution._id, execution.status, {
      observedAt: execution.updatedAt,
      source: 'http',
    }),
  )
  queryClient.getQueriesData<Execution[]>({ queryKey: listRootKey }).forEach(([queryKey, executions]) => {
    const nextExecutions =
      queryKey.length === listRootKey.length
        ? mergeExecutionIntoList(executions, normalizedExecution)
        : mergeExecutionIntoCachedList(executions, normalizedExecution)

    queryClient.setQueryData<Execution[]>(queryKey, nextExecutions)
  })

  return normalizedExecution
}

export const syncExecutionsFromListSnapshot = (
  queryClient: QueryClient,
  executions: Execution[],
  targetKey: string,
) => {
  const statusReadModel = queryClient.getQueryData<ExecutionStatusReadModel>(executionKeys.statuses(targetKey))
  const normalizedExecutions = executions.map((execution) => ({
    ...normalizeExecutionRecord(execution),
    status: getFreshExecutionStatus(statusReadModel, execution._id, execution.status, {
      observedAt: execution.updatedAt,
      source: 'http',
    }),
  }))

  queryClient.setQueryData<ExecutionStatusReadModel>(executionKeys.statuses(targetKey), (statusReadModel) =>
    mergeExecutionStatusReadModelSnapshot(statusReadModel, executions),
  )

  normalizedExecutions.forEach((execution) => {
    queryClient.setQueryData<Execution>(executionKeys.detail(execution._id, targetKey), (currentExecution) =>
      mergeExecutionIntoDetail(currentExecution, execution),
    )
  })

  return normalizedExecutions
}
