import { IExecution } from '../model/execution.interface'

export const getExecutionLabel = (execution: IExecution) => {
  return execution.execution || execution.botName || execution.playwrightProject || `${execution._id.slice(0, 8)}...`
}

export const normalizeExecutionStatus = (status?: string | null) => {
  return status?.toLowerCase() ?? ''
}

export const isExecutionRunning = (status?: string | null) => {
  return normalizeExecutionStatus(status) === 'running'
}
