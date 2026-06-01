import { EXECUTION_STATUSES, type Execution, type ExecutionStatus } from '../model/execution'

const executionStatusSet = new Set<string>(EXECUTION_STATUSES)
const legacyExecutionStatusMap: Record<string, ExecutionStatus> = {
  process: 'running',
}

export const isExecutionStatus = (status: string): status is ExecutionStatus => {
  return executionStatusSet.has(status)
}

export const getExecutionLabel = (execution: Execution) => {
  return execution.execution || execution.botName || execution.playwrightProject || `${execution._id.slice(0, 8)}...`
}

export const normalizeExecutionStatus = (status?: string | null): ExecutionStatus => {
  const normalizedStatus = status?.toLowerCase()

  if (normalizedStatus && normalizedStatus in legacyExecutionStatusMap) {
    return legacyExecutionStatusMap[normalizedStatus]
  }

  return normalizedStatus && isExecutionStatus(normalizedStatus) ? normalizedStatus : 'unknown'
}

export const isExecutionRunning = (status?: string | null) => {
  return normalizeExecutionStatus(status) === 'running'
}

export const isExecutionPaused = (status?: string | null) => {
  return normalizeExecutionStatus(status) === 'paused'
}

export const isExecutionSuccessful = (status?: string | null) => {
  return normalizeExecutionStatus(status) === 'completed'
}

export const isExecutionFailed = (status?: string | null) => {
  const normalizedStatus = normalizeExecutionStatus(status)

  return normalizedStatus === 'failed' || normalizedStatus === 'cancelled'
}

export const isExecutionPending = (status?: string | null) => {
  const normalizedStatus = normalizeExecutionStatus(status)

  return normalizedStatus === 'queued' || normalizedStatus === 'running'
}

export const updateExecutionStatus = (
  executions: Execution[] | undefined,
  executionId: string,
  status: string,
): Execution[] | undefined => {
  if (!executions) return executions

  const normalizedStatus = normalizeExecutionStatus(status)
  let updated = false
  const nextExecutions = executions.map((execution) => {
    if (execution._id !== executionId || execution.status === normalizedStatus) return execution

    updated = true

    return {
      ...execution,
      status: normalizedStatus,
    }
  })

  return updated ? nextExecutions : executions
}

export const mergeExecutionIntoList = (
  executions: Execution[] | undefined,
  nextExecution: Execution,
): Execution[] | undefined => {
  if (!executions) return executions

  const normalizedExecution = {
    ...nextExecution,
    status: normalizeExecutionStatus(nextExecution.status),
  }
  const existingExecutionIndex = executions.findIndex((execution) => execution._id === normalizedExecution._id)

  if (existingExecutionIndex === -1) {
    return [...executions, normalizedExecution]
  }

  const nextExecutions = [...executions]
  nextExecutions[existingExecutionIndex] = {
    ...nextExecutions[existingExecutionIndex],
    ...normalizedExecution,
  }

  return nextExecutions
}
