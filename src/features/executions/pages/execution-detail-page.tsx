import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { APP_CONFIG } from '@/app.config'
import { IconAlertCircle } from '@tabler/icons-react'
import { ExecutionLogsCard } from '../components/execution-detail/execution-logs-card'
import { useExecutionRealtimeLogs } from '../hooks/use-execution-realtime-logs'
import { getExecutionById, getExecutionReportHtml, stopExecution } from '../services/execution.service'
import { createExecutionLogDisplayLines, type ExecutionLogBufferState } from '../lib/execution-log-buffer'
import {
  isExecutionFailed,
  isExecutionRunning,
  isExecutionSuccessful,
  normalizeExecutionStatus,
} from '../lib/execution-display'
import type { IExecution } from '../model/execution.interface'

const formatExecutionStatusLabel = (status?: string | null) => {
  if (!status) return status

  const normalizedStatus = normalizeExecutionStatus(status)

  return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
}

function ExecutionDetailPageContent({ executionId }: { executionId: string }) {
  const { t } = useTranslation('executions')
  const queryClient = useQueryClient()
  const executionQuery = useQuery({
    queryKey: ['execution', executionId],
    queryFn: async () => {
      const response = await getExecutionById(executionId)

      return response.data
    },
  })
  const realtimeLogs = useExecutionRealtimeLogs(executionId, {
    historyContent: executionQuery.data?.logs ?? '',
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
  const logState = useMemo<ExecutionLogBufferState>(
    () => ({
      lines: realtimeLogs.lines,
      partial: realtimeLogs.partial,
      partialStream: realtimeLogs.partialStream,
      partialTimestamp: realtimeLogs.partialTimestamp,
    }),
    [realtimeLogs.lines, realtimeLogs.partial, realtimeLogs.partialStream, realtimeLogs.partialTimestamp],
  )
  const rawExecutionJson = useMemo(() => JSON.stringify(executionQuery.data ?? null, null, 2), [executionQuery.data])
  const executionSubtitle = useMemo(() => {
    if (!executionQuery.data) return null

    const botName = executionQuery.data.botName || executionQuery.data.bot || t('detail.subtitleUnknownBot')
    const executionName = executionQuery.data.execution || executionId

    return t('detail.subtitle', {
      botName,
      execution: executionName,
    })
  }, [executionId, executionQuery.data, t])

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
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

      <ExecutionDetailLogsSection
        connectionState={realtimeLogs.connectionState}
        currentStatus={realtimeLogs.status ?? executionQuery.data?.status}
        executionSubtitle={executionSubtitle}
        execution={executionQuery.data}
        executionId={executionId}
        isLoading={executionQuery.isLoading}
        isStopping={stopMutation.isPending}
        logState={logState}
        onStopExecution={() => stopMutation.mutate(executionId)}
        rawExecutionJson={rawExecutionJson}
      />
    </div>
  )
}

interface ExecutionDetailLogsSectionProps {
  connectionState: ReturnType<typeof useExecutionRealtimeLogs>['connectionState']
  currentStatus?: string | null
  execution?: IExecution
  executionId: string
  executionSubtitle: string | null
  isLoading: boolean
  isStopping: boolean
  logState: ExecutionLogBufferState
  onStopExecution: () => void
  rawExecutionJson: string
}

function ExecutionDetailLogsSection({
  connectionState,
  currentStatus,
  execution,
  executionId,
  executionSubtitle,
  isLoading,
  isStopping,
  logState,
  onStopExecution,
  rawExecutionJson,
}: ExecutionDetailLogsSectionProps) {
  const { t } = useTranslation('executions')
  const displayStatus = formatExecutionStatusLabel(currentStatus)
  const canStopExecution = isExecutionRunning(currentStatus)
  const showReport = isExecutionSuccessful(currentStatus) || isExecutionFailed(currentStatus)
  const reportExecutionId = execution?.playwrightExecutionId || executionId
  const reportBasePath = `${APP_CONFIG.exeReportsUrl}/${reportExecutionId}`
  const reportQuery = useQuery({
    queryKey: ['execution-report', reportExecutionId],
    queryFn: async () => {
      const response = await getExecutionReportHtml(reportExecutionId)

      return response.data
    },
    enabled: showReport,
  })
  const logLines = useMemo(() => createExecutionLogDisplayLines(logState), [logState])

  return (
    <ExecutionLogsCard
      key={showReport ? 'finished' : 'unfinished'}
      canStopExecution={canStopExecution}
      connectionState={connectionState}
      currentStatus={displayStatus}
      description={executionSubtitle}
      isLoading={isLoading}
      isReportError={reportQuery.isError}
      isReportLoading={!showReport || reportQuery.isLoading}
      isStopping={isStopping}
      logLines={logLines}
      onStopExecution={onStopExecution}
      rawExecutionJson={rawExecutionJson}
      reportBasePath={reportBasePath}
      reportHtml={reportQuery.data}
      showReport={showReport}
      title={t('detail.title')}
    />
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
