import type { ComponentProps } from 'react'
import { Badge } from '@/components/ui/badge'
import type { useExecutionRealtimeLogs } from '../../hooks/use-execution-realtime-logs'
import { isExecutionFailed, isExecutionSuccessful, normalizeExecutionStatus } from '../../lib/execution-display'

type BadgeVariant = ComponentProps<typeof Badge>['variant']

export const getStatusBadgeVariant = (status?: string | null): BadgeVariant => {
  const normalizedStatus = normalizeExecutionStatus(status)

  if (isExecutionSuccessful(normalizedStatus)) {
    return 'success'
  }
  if (isExecutionFailed(normalizedStatus)) {
    return 'destructive'
  }
  if (normalizedStatus === 'unknown') return 'outline'

  return 'secondary'
}

export const getStatusBadgeClassName = (status?: string | null) => {
  return normalizeExecutionStatus(status) === 'running'
    ? 'bg-blue-500 text-white dark:bg-blue-400 dark:text-slate-950'
    : undefined
}

export const getConnectionBadgeVariant = (
  connectionState: ReturnType<typeof useExecutionRealtimeLogs>['connectionState'],
): BadgeVariant => {
  if (connectionState === 'connected') return 'default'
  if (connectionState === 'connecting') return 'secondary'

  return 'outline'
}
