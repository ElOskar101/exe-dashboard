import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { getStatusBadgeClassName, isExecutionRunning, type ExecutionStatus } from '@/features/executions/shared'

export function ExecutionStatusLabel({ status, label }: { status: ExecutionStatus; label?: string }) {
  const { t } = useTranslation('executions')
  const resolvedLabel = label ?? t(`list.statusOptions.${status}`)

  return (
    <Badge variant="outline" className={getStatusBadgeClassName(status)}>
      {isExecutionRunning(status) ? <Spinner data-icon="inline-start" /> : null}
      {resolvedLabel}
    </Badge>
  )
}
