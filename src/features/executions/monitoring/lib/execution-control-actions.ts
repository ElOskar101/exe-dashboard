import { isExecutionPaused, isExecutionRunning } from '@/features/executions/shared'

export const getExecutionControlAvailability = (status?: string | null) => {
  const canPauseExecution = isExecutionRunning(status)
  const canResumeExecution = isExecutionPaused(status)

  return {
    canPauseExecution,
    canResumeExecution,
    canStopExecution: canPauseExecution,
  }
}
