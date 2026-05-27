import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { IconAlertCircle } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { isolateReportHtml, resolveExecutionReportBaseUrl } from './execution-report-html-utils'

interface ExecutionReportPanelProps {
  isError: boolean
  isLoading: boolean
  reportBasePath: string
  reportHtml?: string
}

export function ExecutionReportPanel({ isError, isLoading, reportBasePath, reportHtml }: ExecutionReportPanelProps) {
  const { t } = useTranslation('executions')
  const reportBaseUrl = useMemo(() => resolveExecutionReportBaseUrl(reportBasePath), [reportBasePath])
  const isolatedReportHtml = useMemo(
    () => (reportHtml ? isolateReportHtml(reportHtml, reportBaseUrl) : undefined),
    [reportBaseUrl, reportHtml],
  )

  if (isLoading) {
    return (
      <Skeleton aria-label={t('detail.reportLoading')} className="h-[calc(100vh-16rem)] min-h-96 w-full rounded-2xl" />
    )
  }

  if (isError || !reportHtml) {
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
      referrerPolicy="no-referrer"
      srcDoc={isolatedReportHtml}
      title={t('detail.reportFrameTitle')}
    />
  )
}
