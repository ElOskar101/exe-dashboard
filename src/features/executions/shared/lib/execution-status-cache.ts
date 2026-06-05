import type { QueryClient } from '@tanstack/react-query'
import type { Execution, ExecutionStatus } from '../model/execution'
import { executionKeys } from './execution-query-keys'
import { mergeExecutionIntoList, normalizeExecutionStatus, updateExecutionStatus } from './execution-display'

export type ExecutionStatusReadModel = Record<string, ExecutionStatus>

export const normalizeExecutionRecord = (execution: Execution): Execution => ({
  ...execution,
  status: normalizeExecutionStatus(execution.status),
})

const mergeExecutionStatusReadModelEntry = (
  statusReadModel: ExecutionStatusReadModel | undefined,
  executionId: string,
  status: string,
) => {
  const normalizedStatus = normalizeExecutionStatus(status)

  if (statusReadModel?.[executionId] === normalizedStatus) {
    return statusReadModel
  }

  return {
    ...(statusReadModel ?? {}),
    [executionId]: normalizedStatus,
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
    const normalizedStatus = normalizeExecutionStatus(execution.status)

    if (nextStatusReadModel[execution._id] === normalizedStatus) {
      return
    }

    nextStatusReadModel[execution._id] = normalizedStatus
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

export const syncExecutionStatusReadModel = (queryClient: QueryClient, executionId: string, status: string) => {
  queryClient.setQueryData<ExecutionStatusReadModel>(executionKeys.statuses(), (statusReadModel) =>
    mergeExecutionStatusReadModelEntry(statusReadModel, executionId, status),
  )
  queryClient.setQueriesData<Execution[]>({ queryKey: executionKeys.listRoot() }, (executions) =>
    updateExecutionStatus(executions, executionId, status),
  )
  queryClient.setQueryData<Execution>(executionKeys.detail(executionId), (execution) =>
    updateDetailExecutionStatus(execution, status),
  )
}

export const syncExecutionFromDetailSnapshot = (queryClient: QueryClient, execution: Execution) => {
  const normalizedExecution = normalizeExecutionRecord(execution)
  const listRootKey = executionKeys.listRoot()

  queryClient.setQueryData<ExecutionStatusReadModel>(executionKeys.statuses(), (statusReadModel) =>
    mergeExecutionStatusReadModelEntry(statusReadModel, normalizedExecution._id, normalizedExecution.status),
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

export const syncExecutionsFromListSnapshot = (queryClient: QueryClient, executions: Execution[]) => {
  const normalizedExecutions = executions.map(normalizeExecutionRecord)

  queryClient.setQueryData<ExecutionStatusReadModel>(executionKeys.statuses(), (statusReadModel) =>
    mergeExecutionStatusReadModelSnapshot(statusReadModel, normalizedExecutions),
  )

  normalizedExecutions.forEach((execution) => {
    queryClient.setQueryData<Execution>(executionKeys.detail(execution._id), (currentExecution) =>
      mergeExecutionIntoDetail(currentExecution, execution),
    )
  })

  return normalizedExecutions
}
