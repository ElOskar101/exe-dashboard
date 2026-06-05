import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  getStatusBadgeClassName,
  getStatusBadgeVariant,
  isExecutionRunning,
  type ExecutionStatus,
} from '@/features/executions/shared'
import { cn } from '@/lib/utils'

export function ExecutionStatusBadge({ status }: { status: ExecutionStatus }) {
  const { t } = useTranslation('executions')

  return (
    <Badge variant={getStatusBadgeVariant(status)} className={cn('capitalize', getStatusBadgeClassName(status))}>
      {isExecutionRunning(status) ? <Spinner data-icon="inline-start" /> : null}
      {t(`list.statusOptions.${status}`)}
    </Badge>
  )
}
