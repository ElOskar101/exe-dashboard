import type { ComponentProps } from 'react'
import { Badge } from '@/components/ui/badge'
export { getStatusTextClassName } from '@/features/executions/shared'
import type { useExecutionRealtimeLogs } from '../hooks/use-execution-realtime-logs'

type BadgeVariant = ComponentProps<typeof Badge>['variant']

export const getConnectionBadgeVariant = (
  connectionState: ReturnType<typeof useExecutionRealtimeLogs>['connectionState'],
): BadgeVariant => {
  if (connectionState === 'connected') return 'default'
  if (connectionState === 'connecting') return 'secondary'

  return 'outline'
}
