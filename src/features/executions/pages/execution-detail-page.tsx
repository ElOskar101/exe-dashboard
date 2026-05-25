import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { IconAlertCircle } from '@tabler/icons-react'
import { ExecutionLogsCard } from '../components/execution-detail/execution-logs-card'
import { getExecutionById, stopExecution } from '../services/execution.service'
import { createExecutionLogLinesFromHistory } from '../lib/execution-log-buffer'
import { useExecutionRealtimeLogs } from '../hooks/use-execution-realtime-logs'
import { isExecutionRunning } from '../lib/execution-display'

function ExecutionDetailPageContent({ executionId }: { executionId: string }) {
  const { t } = useTranslation('executions')
  const queryClient = useQueryClient()
  const realtimeLogs = useExecutionRealtimeLogs(executionId)
  const executionQuery = useQuery({
    queryKey: ['execution', executionId],
    queryFn: async () => {
      const response = await getExecutionById(executionId)

      return response.data
    },
  })
  const stopMutation = useMutation({
    mutationFn: stopExecution,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['execution', executionId] }),
        queryClient.invalidateQueries({ queryKey: ['executions'] }),
      ])
    },
  })
  const executionLogs = executionQuery.data?.logs
  const fallbackLines = useMemo(
    () => (executionLogs ? createExecutionLogLinesFromHistory(executionLogs).lines : []),
    [executionLogs],
  )
  const logLines = realtimeLogs.lines.length > 0 ? realtimeLogs.lines : fallbackLines
  const currentStatus = realtimeLogs.status ?? executionQuery.data?.status
  const canStopExecution = isExecutionRunning(currentStatus)
  const rawExecutionJson = useMemo(() => JSON.stringify(executionQuery.data ?? null, null, 2), [executionQuery.data])

  return (
    <div className="flex flex-1 flex-col gap-6">
      {executionQuery.isError ? (
        <Alert>
          <IconAlertCircle />
          <AlertTitle>{t('detail.loadErrorTitle')}</AlertTitle>
          <AlertDescription>{t('detail.loadErrorDescription')}</AlertDescription>
        </Alert>
      ) : null}

      {stopMutation.isError ? (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>{t('detail.stopErrorTitle')}</AlertTitle>
          <AlertDescription>{t('detail.stopErrorDescription')}</AlertDescription>
        </Alert>
      ) : null}

      <ExecutionLogsCard
        canStopExecution={canStopExecution}
        connectionState={realtimeLogs.connectionState}
        currentStatus={currentStatus}
        isLoading={executionQuery.isLoading}
        isStopping={stopMutation.isPending}
        logLines={logLines}
        onStopExecution={() => stopMutation.mutate(executionId)}
        rawExecutionJson={rawExecutionJson}
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
