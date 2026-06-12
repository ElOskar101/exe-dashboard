import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getExecutionLabel, getScheduledExecutionStartTime, type Execution } from '@/features/executions/shared'

export const useScheduledExecutionStartToasts = (executions: Execution[], currentTime: number) => {
  const { t } = useTranslation('executions')
  const previousWaitingByExecutionId = useRef(new Map<string, boolean>())
  const notifiedExecutionIds = useRef(new Set<string>())

  useEffect(() => {
    const nextWaitingByExecutionId = new Map<string, boolean>()

    for (const execution of executions) {
      const scheduledStartTime = getScheduledExecutionStartTime(execution.scheduledAt)

      if (scheduledStartTime === null) {
        continue
      }

      const isWaiting = currentTime < scheduledStartTime
      const wasWaiting = previousWaitingByExecutionId.current.get(execution._id)

      if (wasWaiting === true && !isWaiting && !notifiedExecutionIds.current.has(execution._id)) {
        notifiedExecutionIds.current.add(execution._id)
        toast.success(t('sidebar.scheduledStartedToastTitle'), {
          id: `scheduled-execution-started-${execution._id}`,
          description: t('sidebar.scheduledStartedToastDescription', {
            execution: getExecutionLabel(execution),
          }),
        })
      }

      nextWaitingByExecutionId.set(execution._id, isWaiting)
    }

    previousWaitingByExecutionId.current = nextWaitingByExecutionId
  }, [currentTime, executions, t])
}
