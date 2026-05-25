import { EXECUTION_STATUSES, type ExecutionStatus, type IExecution } from '../model/execution.interface'

const executionStatusSet = new Set<string>(EXECUTION_STATUSES)
const legacyExecutionStatusMap: Record<string, ExecutionStatus> = {
  process: 'running',
}

export const isExecutionStatus = (status: string): status is ExecutionStatus => {
  return executionStatusSet.has(status)
}

export const getExecutionLabel = (execution: IExecution) => {
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
  executions: IExecution[] | undefined,
  executionId: string,
  status: string,
): IExecution[] | undefined => {
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
