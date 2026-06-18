import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCurrentTime } from '@/hooks/use-current-time'
import {
  getExecutionReportIndexUrl,
  executionKeys,
  isExecutionFailed,
  isExecutionSuccessful,
  useExecutionQuery,
  useExecutionStatusValue,
  usePauseExecutionMutation,
  useResumeExecutionMutation,
  syncExecutionStatusReadModelForTarget,
  useExecutionTarget,
  useStopExecutionMutation,
  type Execution,
} from '@/features/executions/shared'
import { useExecutionRealtimeLogs } from './use-execution-realtime-logs'
import { useExecutionRerun } from './use-execution-rerun'
import { formatExecutionStatusLabel } from '../lib/execution-detail-display'
import { getExecutionControlAvailability } from '../lib/execution-control-actions'
import { createExecutionLogDisplayLines, type ExecutionLogBufferState } from '../lib/execution-log-buffer'
import type { ExecutionRerunSummary } from '../lib/execution-rerun'

export interface ExecutionDetailSession {
  canPauseExecution: boolean
  canResumeExecution: boolean
  canRerunExecution: boolean
  canStopExecution: boolean
  connectionState: ReturnType<typeof useExecutionRealtimeLogs>['connectionState']
  currentStatus?: string | null
  description: string | null
  execution?: Execution
  isLoading: boolean
  isPausing: boolean
  isReportError: boolean
  isReportLoading: boolean
  isResuming: boolean
  isRerunAvailable: boolean
  isRerunning: boolean
  isStopping: boolean
  loadError: boolean
  logLines: ReturnType<typeof createExecutionLogDisplayLines>
  missingRerunFields: string[]
  onPauseExecution: () => void
  onRerunExecution: () => void
  onResumeExecution: () => void
  onStopExecution: () => void
  pauseError: boolean
  rawExecutionJson: string
  reportSource: string
  rerunErrorMessage: string | null
  rerunSummary: ExecutionRerunSummary | null
  resumeError: boolean
  scheduledAt?: string
  showReport: boolean
  stopError: boolean
  title: string | null
}

export const useExecutionDetailSession = (executionId: string): ExecutionDetailSession => {
  const queryClient = useQueryClient()
  const { target } = useExecutionTarget()
  const currentTime = useCurrentTime('second')
  const executionQuery = useExecutionQuery(executionId)
  const realtimeLogs = useExecutionRealtimeLogs(executionId, {
    historyContent: executionQuery.data?.logs ?? '',
    onStatus: (payload) => {
      syncExecutionStatusReadModelForTarget(queryClient, executionId, payload.status, target.key, {
        observedAt: payload.timestamp,
        source: 'realtime',
      })
    },
  })
  const currentStatus = useExecutionStatusValue(executionId, executionQuery.data?.status)
  const stopMutation = useStopExecutionMutation(executionId)
  const pauseMutation = usePauseExecutionMutation(executionId)
  const resumeMutation = useResumeExecutionMutation(executionId)
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
  const rerun = useExecutionRerun(executionQuery.data)
  const showReport = isExecutionSuccessful(currentStatus) || isExecutionFailed(currentStatus)
  const reportSource = getExecutionReportIndexUrl(target.requestTarget.reportsUrl, executionId)
  const reportAvailabilityQuery = useQuery({
    queryKey: [...executionKeys.report(executionId, target.key), 'availability'],
    queryFn: async () => {
      const response = await fetch(reportSource, { method: 'HEAD' })

      if (!response.ok) {
        throw new Error(`Execution report returned ${response.status}.`)
      }

      return true
    },
    enabled: showReport,
    retry: false,
  })
  const logLines = useMemo(() => createExecutionLogDisplayLines(logState), [logState])
  const displayStatus = formatExecutionStatusLabel(currentStatus)
  const { canPauseExecution, canResumeExecution, canStopExecution } = getExecutionControlAvailability(
    currentStatus,
    executionQuery.data?.scheduledAt,
    currentTime,
  )

  return {
    canPauseExecution,
    canResumeExecution,
    canRerunExecution: Boolean(executionQuery.data) && showReport,
    canStopExecution,
    connectionState: realtimeLogs.connectionState,
    currentStatus: displayStatus,
    description: null,
    execution: executionQuery.data,
    isLoading: executionQuery.isPending,
    isPausing: pauseMutation.isPending,
    isReportError: reportAvailabilityQuery.isError,
    isReportLoading: showReport && reportAvailabilityQuery.isLoading,
    isResuming: resumeMutation.isPending,
    isRerunAvailable: rerun.isRerunAvailable,
    isRerunning: rerun.isRerunning,
    isStopping: stopMutation.isPending,
    loadError: executionQuery.isError,
    logLines,
    missingRerunFields: rerun.missingRerunFields,
    onPauseExecution: () => pauseMutation.mutate(),
    onRerunExecution: rerun.triggerRerun,
    onResumeExecution: () => resumeMutation.mutate(),
    onStopExecution: () => stopMutation.mutate(),
    pauseError: pauseMutation.isError,
    rawExecutionJson,
    reportSource,
    rerunErrorMessage: rerun.rerunErrorMessage,
    rerunSummary: rerun.rerunSummary,
    resumeError: resumeMutation.isError,
    scheduledAt: executionQuery.data?.scheduledAt,
    showReport,
    stopError: stopMutation.isError,
    title:
      executionQuery.data?.project && executionQuery.data?.execution
        ? `${executionQuery.data.project} ${executionQuery.data.execution}`
        : null,
  }
}
