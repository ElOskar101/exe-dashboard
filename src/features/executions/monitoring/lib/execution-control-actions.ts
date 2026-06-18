import { isExecutionPaused, isExecutionRunning, isWaitingScheduledExecution } from '@/features/executions/shared'

export const getExecutionControlAvailability = (
  status?: string | null,
  scheduledAt?: string | null,
  currentTime = Date.now(),
) => {
  if (isWaitingScheduledExecution(scheduledAt, currentTime)) {
    return {
      canPauseExecution: false,
      canResumeExecution: false,
      canStopExecution: false,
    }
  }

  const canPauseExecution = isExecutionRunning(status)
  const canResumeExecution = isExecutionPaused(status)

  return {
    canPauseExecution,
    canResumeExecution,
    canStopExecution: canPauseExecution || canResumeExecution,
  }
}
