import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  getExecutionLabel,
  isExecutionRunning,
  useDeleteExecutionMutation,
  useExecutionTargetNavigation,
} from '@/features/executions/shared'
import { IconAlertCircle, IconTrash } from '@tabler/icons-react'
import { ExecutionLogsCard } from '../components/execution-logs-card'
import { useExecutionDetailSession } from '../hooks/use-execution-detail-session'

function ExecutionDetailPageContent({ executionId }: { executionId: string }) {
  const { t } = useTranslation('executions')
  const navigate = useNavigate()
  const { getPathWithExecutionTarget } = useExecutionTargetNavigation()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const session = useExecutionDetailSession(executionId)
  const deleteMutation = useDeleteExecutionMutation({
    onSuccess: async () => {
      setIsDeleteDialogOpen(false)
      navigate(getPathWithExecutionTarget('/executions'))
    },
  })
  const executionLabel = session.execution ? getExecutionLabel(session.execution) : executionId
  const canDeleteExecution = Boolean(session.execution) && !isExecutionRunning(session.currentStatus)
  const deleteAction = canDeleteExecution ? (
    <AlertDialog
      open={isDeleteDialogOpen}
      onOpenChange={(open) => {
        if (deleteMutation.isPending) return

        setIsDeleteDialogOpen(open)
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="text-destructive hover:text-destructive"
            aria-label={t('sidebar.deleteSelectedAction', { execution: executionLabel })}
            title={t('sidebar.deleteSelectedAction', { execution: executionLabel })}
            disabled={deleteMutation.isPending}
          >
            <IconTrash />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('sidebar.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('sidebar.deleteDescription', {
              execution: executionLabel,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>{t('sidebar.cancelDelete')}</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(executionId)}
          >
            {deleteMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
            {deleteMutation.isPending ? t('sidebar.deleting') : t('sidebar.confirmDelete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null

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

      <ExecutionLogsCard
        key={session.showReport ? 'finished' : 'unfinished'}
        deleteAction={deleteAction}
        {...session}
      />
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
