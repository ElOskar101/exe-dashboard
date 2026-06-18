import { isExecutionPaused, isExecutionRunning, isWaitingScheduledExecution } from '@/features/executions/shared'

export const getExecutionControlAvailability = (
  status: string | null | undefined,
  scheduledAt: string | null | undefined,
  currentTime: number,
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
