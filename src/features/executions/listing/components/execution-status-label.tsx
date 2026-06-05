import { useTranslation } from 'react-i18next'

import { Spinner } from '@/components/ui/spinner'
import { getStatusTextClassName, isExecutionRunning, type ExecutionStatus } from '@/features/executions/shared'
import { cn } from '@/lib/utils'

export function ExecutionStatusLabel({ status }: { status: ExecutionStatus }) {
  const { t } = useTranslation('executions')

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-sm font-medium capitalize', getStatusTextClassName(status))}
    >
      {isExecutionRunning(status) ? <Spinner data-icon="inline-start" /> : null}
      {t(`list.statusOptions.${status}`)}
    </span>
  )
}
