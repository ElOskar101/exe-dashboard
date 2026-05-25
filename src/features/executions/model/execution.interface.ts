export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'unknown' | 'cancelled' | 'failed'
export type ExecutionRuntimeStatus = ExecutionStatus | 'process'

export const EXECUTION_STATUSES = ['queued', 'running', 'completed', 'unknown', 'cancelled', 'failed'] as const

export interface IExecution {
  _id: string
  createdBy: string
  playwrightProject: string
  status: ExecutionRuntimeStatus
  notes?: string[]
  note?: string[]
  attachments?: unknown[]
  client: string
  clinic: string
  execution: string
  bot?: string
  botName?: string
  meta?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  jobId: string
  playwrightExecutionId: string
  pid?: number
  startedAt?: string
  finishedAt?: string
  logs?: string
}
