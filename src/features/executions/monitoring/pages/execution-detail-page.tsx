import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { IconAlertCircle } from '@tabler/icons-react'
import { ExecutionLogsCard } from '../components/execution-logs-card'
import { useExecutionDetailSession } from '../hooks/use-execution-detail-session'

function ExecutionDetailPageContent({ executionId }: { executionId: string }) {
  const { t } = useTranslation('executions')
  const session = useExecutionDetailSession(executionId)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      {session.loadError ? (
        <Alert>
          <IconAlertCircle />
          <AlertTitle>{t('detail.loadErrorTitle')}</AlertTitle>
          <AlertDescription>{t('detail.loadErrorDescription')}</AlertDescription>
        </Alert>
      ) : null}

      {session.stopError ? (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>{t('detail.stopErrorTitle')}</AlertTitle>
          <AlertDescription>{t('detail.stopErrorDescription')}</AlertDescription>
        </Alert>
      ) : null}

      {session.pauseError ? (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>{t('detail.pauseErrorTitle')}</AlertTitle>
          <AlertDescription>{t('detail.pauseErrorDescription')}</AlertDescription>
        </Alert>
      ) : null}

      {session.resumeError ? (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>{t('detail.resumeErrorTitle')}</AlertTitle>
          <AlertDescription>{t('detail.resumeErrorDescription')}</AlertDescription>
        </Alert>
      ) : null}

      {session.rerunErrorMessage ? (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>{t('detail.rerunErrorTitle')}</AlertTitle>
          <AlertDescription>{session.rerunErrorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <ExecutionLogsCard key={session.showReport ? 'finished' : 'unfinished'} {...session} />
    </div>
  )
}

export default function ExecutionDetailPage() {
  const { t } = useTranslation('executions')
  const { id } = useParams()

  if (!id) {
    return (
      <div className="py-6">
        <Alert>
          <IconAlertCircle />
          <AlertTitle>{t('detail.missingIdTitle')}</AlertTitle>
        </Alert>
      </div>
    )
  }

  return <ExecutionDetailPageContent key={id} executionId={id} />
}
