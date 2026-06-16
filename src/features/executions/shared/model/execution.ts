import type { ExecutionPayloadContext } from './execution-create-payload'

export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'unknown'
  | 'cancelled'
  | 'failed'
  | 'scheduled'
export type ExecutionRuntimeStatus = ExecutionStatus | 'process'

export const EXECUTION_STATUSES = [
  'queued',
  'running',
  'paused',
  'completed',
  'unknown',
  'cancelled',
  'failed',
  'scheduled',
] as const

export interface Execution {
  _id: string
  createdBy: string
  project: string
  status: ExecutionRuntimeStatus
  notes?: string[]
  attachments?: unknown[]
  client: string
  clinic: string
  execution: string
  bot?: string
  botName?: string
  context: ExecutionPayloadContext
  createdAt: string
  updatedAt: string
  jobId: string
  playwrightExecutionId: string
  pid?: number
  startedAt?: string
  finishedAt?: string
  scheduledAt?: string
  logs?: string
}
