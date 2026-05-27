import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createExecution, getExecutionRequestErrorMessage, type Execution } from '@/features/executions/shared'
import { getExecutionRerunSummary, prepareExecutionRerun } from '../lib/execution-rerun'

export const useExecutionRerun = (execution?: Execution) => {
  const { t } = useTranslation('executions')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const rerunPreparation = useMemo(() => (execution ? prepareExecutionRerun(execution) : null), [execution])
  const rerunPayload = rerunPreparation?.payload ?? null
  const rerunSummary = useMemo(
    () => (execution ? getExecutionRerunSummary(execution, rerunPayload) : null),
    [execution, rerunPayload],
  )
  const rerunMutation = useMutation({
    mutationFn: createExecution,
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['executions'] })
      navigate(`/execution/${response.data._id}`)
    },
  })

  return {
    isRerunAvailable: Boolean(rerunPayload),
    isRerunning: rerunMutation.isPending,
    missingRerunFields: rerunPreparation?.missingFields ?? [],
    rerunErrorMessage: rerunMutation.isError
      ? getExecutionRequestErrorMessage(rerunMutation.error, t('detail.rerunErrorDescription'))
      : null,
    rerunSummary,
    triggerRerun: () => {
      if (!rerunPayload) return

      rerunMutation.mutate(rerunPayload)
    },
  }
}
