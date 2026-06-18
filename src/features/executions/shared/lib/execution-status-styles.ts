import { normalizeExecutionStatus } from './execution-display'

export const getStatusBadgeClassName = (status?: string | null) => {
  if (status?.toLowerCase() === 'scheduled') {
    return 'text-purple-600 dark:text-purple-400'
  }

  const normalizedStatus = normalizeExecutionStatus(status)

  if (normalizedStatus === 'completed') {
    return 'text-success'
  }
  if (normalizedStatus === 'running') {
    return 'text-blue-600 dark:text-blue-400'
  }
  if (normalizedStatus === 'paused') {
    return 'text-amber-600 dark:text-amber-400'
  }
  if (normalizedStatus === 'failed') {
    return 'text-destructive'
  }
  if (normalizedStatus === 'cancelled') {
    return 'text-slate-600 dark:text-slate-400'
  }
  if (normalizedStatus === 'queued') {
    return 'text-muted-foreground'
  }
  return 'text-foreground/70'
}
