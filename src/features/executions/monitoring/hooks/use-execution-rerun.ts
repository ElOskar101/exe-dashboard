import { useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  getExecutionRequestErrorMessage,
  useCreateExecutionMutation,
  useExecutionTargetNavigation,
  useScheduleExecutionMutation,
  type Execution,
  type ExecutionSchedulePayload,
} from '@/features/executions/shared'
import { AuthContext } from '@/features/auth'
import { getExecutionRerunSummary, prepareExecutionRerun } from '../lib/execution-rerun'

export interface ExecutionRerunScheduleInput {
  scheduledAt: string
}

export const useExecutionRerun = (execution?: Execution) => {
  const { t } = useTranslation('executions')
  const navigate = useNavigate()
  const { getPathWithExecutionTarget } = useExecutionTargetNavigation()
  const { token } = useContext(AuthContext)
  const rerunPreparation = useMemo(
    () => (execution ? prepareExecutionRerun(execution, token) : null),
    [execution, token],
  )
  const rerunPayload = rerunPreparation?.payload ?? null
  const rerunSummary = useMemo(
    () => (execution ? getExecutionRerunSummary(execution, rerunPayload) : null),
    [execution, rerunPayload],
  )
  const createMutation = useCreateExecutionMutation({
    onSuccess: async ([response]) => {
      navigate(getPathWithExecutionTarget(`/execution/${response.data._id}`))
    },
  })
  const scheduleMutation = useScheduleExecutionMutation({
    onSuccess: async ([response]) => {
      navigate(getPathWithExecutionTarget(`/execution/${response.data._id}`))
    },
  })
  const rerunError = createMutation.error ?? scheduleMutation.error

  return {
    isRerunAvailable: Boolean(rerunPayload),
    isRerunning: createMutation.isPending || scheduleMutation.isPending,
    missingRerunFields: rerunPreparation?.missingFields ?? [],
    rerunErrorMessage: rerunError
      ? getExecutionRequestErrorMessage(rerunError, t('detail.rerunErrorDescription'))
      : null,
    rerunSummary,
    triggerRerun: (scheduleInput?: ExecutionRerunScheduleInput) => {
      if (!rerunPayload) return

      if (scheduleInput) {
        const scheduledAt = new Date(scheduleInput.scheduledAt)

        if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
          return
        }

        scheduleMutation.mutate({
          ...(rerunPayload as ExecutionSchedulePayload),
          scheduledAt: scheduledAt.toISOString(),
        })

        return
      }

      createMutation.mutate(rerunPayload)
    },
  }
}
