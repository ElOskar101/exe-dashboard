import type { ComponentProps } from 'react'
import { Badge } from '@/components/ui/badge'
import type { useExecutionRealtimeLogs } from '../../hooks/use-execution-realtime-logs'

type BadgeVariant = ComponentProps<typeof Badge>['variant']

export const getStatusBadgeVariant = (status?: string | null): BadgeVariant => {
  const normalizedStatus = status?.toLowerCase()

  if (!normalizedStatus) return 'outline'
  if (['completed', 'complete', 'success', 'succeeded'].includes(normalizedStatus)) {
    return 'default'
  }
  if (['failed', 'error', 'cancelled', 'canceled'].includes(normalizedStatus)) {
    return 'destructive'
  }

  return 'secondary'
}

export const getConnectionBadgeVariant = (
  connectionState: ReturnType<typeof useExecutionRealtimeLogs>['connectionState'],
): BadgeVariant => {
  if (connectionState === 'connected') return 'default'
  if (connectionState === 'connecting') return 'secondary'

  return 'outline'
}
