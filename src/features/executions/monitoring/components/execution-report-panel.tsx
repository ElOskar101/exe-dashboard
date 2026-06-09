import { useTranslation } from 'react-i18next'
import { IconAlertCircle } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

interface ExecutionReportPanelProps {
  isError: boolean
  isLoading: boolean
  reportSource: string
}

export function ExecutionReportPanel({ isError, isLoading, reportSource }: ExecutionReportPanelProps) {
  const { t } = useTranslation('executions')

  if (isLoading) {
    return (
      <Skeleton aria-label={t('detail.reportLoading')} className="h-[calc(100vh-16rem)] min-h-96 w-full rounded-2xl" />
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <IconAlertCircle />
        <AlertTitle>{t('detail.reportErrorTitle')}</AlertTitle>
        <AlertDescription>{t('detail.reportErrorDescription')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <iframe
      className="h-[calc(100vh-16rem)] min-h-96 w-full rounded-2xl border border-border bg-background"
      loading="lazy"
      referrerPolicy="no-referrer"
      src={reportSource}
      title={t('detail.reportFrameTitle')}
    />
  )
}
