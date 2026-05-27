import type { ComponentProps } from 'react'
import { Badge } from '@/components/ui/badge'
import { isExecutionFailed, isExecutionSuccessful, normalizeExecutionStatus } from '@/features/executions/shared'
import type { useExecutionRealtimeLogs } from '../../hooks/use-execution-realtime-logs'

type BadgeVariant = ComponentProps<typeof Badge>['variant']

export const getStatusBadgeVariant = (status?: string | null): BadgeVariant => {
  const normalizedStatus = normalizeExecutionStatus(status)

  if (isExecutionSuccessful(normalizedStatus)) {
    return 'success'
  }
  if (normalizedStatus === 'cancelled') {
    return 'secondary'
  }
  if (isExecutionFailed(normalizedStatus)) {
    return 'destructive'
  }
  if (normalizedStatus === 'unknown') return 'outline'

  return 'secondary'
}

export const getStatusBadgeClassName = (status?: string | null) => {
  const normalizedStatus = normalizeExecutionStatus(status)

  if (normalizedStatus === 'running') {
    return 'bg-blue-500 text-white dark:bg-blue-400 dark:text-slate-950'
  }
  if (normalizedStatus === 'paused') {
    return 'bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950'
  }
  if (normalizedStatus === 'cancelled') {
    return 'bg-slate-500 text-white dark:bg-slate-400 dark:text-slate-950'
  }

  return undefined
}

export const getConnectionBadgeVariant = (
  connectionState: ReturnType<typeof useExecutionRealtimeLogs>['connectionState'],
): BadgeVariant => {
  if (connectionState === 'connected') return 'default'
  if (connectionState === 'connecting') return 'secondary'

  return 'outline'
}
