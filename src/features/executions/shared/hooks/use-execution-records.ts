import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import type { Dispatch } from 'react'
import type { ExecutionCreatePayload } from '@/features/executions/creation'
import type { Execution } from '../model/execution'
import { executionKeys } from '../lib/execution-query-keys'
import { mergeExecutionIntoList } from '../lib/execution-display'
import {
  createExecution,
  deleteExecution,
  getExecutionById,
  getExecutionReportHtml,
  getExecutions,
  pauseExecution,
  resumeExecution,
  stopExecution,
} from '../services/execution.service'

interface ExecutionMutationOptions<TResponse, TVariables> {
  onSuccess?: Dispatch<readonly [TResponse, TVariables]>
}

const invalidateExecutionList = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await queryClient.invalidateQueries({ queryKey: executionKeys.list() })
}

const invalidateExecutionDetail = async (queryClient: ReturnType<typeof useQueryClient>, executionId: string) => {
  await queryClient.invalidateQueries({ queryKey: executionKeys.detail(executionId) })
}

export const useExecutionsQuery = () =>
  useQuery({
    queryKey: executionKeys.list(),
    queryFn: async () => {
      const response = await getExecutions()

      return response.data
    },
  })

export const useExecutionQuery = (executionId: string) => {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: executionKeys.detail(executionId),
    queryFn: async () => {
      const response = await getExecutionById(executionId)

      queryClient.setQueryData<Execution[]>(executionKeys.list(), (executions) =>
        mergeExecutionIntoList(executions, response.data),
      )

      return response.data
    },
  })
}

export const useExecutionReportQuery = (executionId: string, enabled: boolean) =>
  useQuery({
    queryKey: executionKeys.report(executionId),
    queryFn: async () => {
      const response = await getExecutionReportHtml(executionId)

      return response.data
    },
    enabled,
  })

export const useCreateExecutionMutation = (
  options: ExecutionMutationOptions<AxiosResponse<Execution>, ExecutionCreatePayload> = {},
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createExecution,
    onSuccess: async (response, variables) => {
      await invalidateExecutionList(queryClient)
      await options.onSuccess?.([response, variables])
    },
  })
}

export const useDeleteExecutionMutation = (
  options: ExecutionMutationOptions<AxiosResponse<Execution>, string> = {},
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteExecution,
    onSuccess: async (response, executionId) => {
      await invalidateExecutionList(queryClient)
      await options.onSuccess?.([response, executionId])
    },
  })
}

interface ExecutionActionMutationOptions extends ExecutionMutationOptions<AxiosResponse<Execution>, string> {
  syncDetailCache?: boolean
}

const useExecutionActionMutation = (
  mutationFn: typeof pauseExecution,
  executionId: string,
  options: ExecutionActionMutationOptions = {},
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => mutationFn(executionId),
    onSuccess: async (response) => {
      if (options.syncDetailCache ?? true) {
        queryClient.setQueryData(executionKeys.detail(executionId), response.data)
      }

      await Promise.all([invalidateExecutionDetail(queryClient, executionId), invalidateExecutionList(queryClient)])
      await options.onSuccess?.([response, executionId])
    },
  })
}

export const usePauseExecutionMutation = (executionId: string, options: ExecutionActionMutationOptions = {}) =>
  useExecutionActionMutation(pauseExecution, executionId, options)

export const useResumeExecutionMutation = (executionId: string, options: ExecutionActionMutationOptions = {}) =>
  useExecutionActionMutation(resumeExecution, executionId, options)

export const useStopExecutionMutation = (executionId: string, options: ExecutionActionMutationOptions = {}) =>
  useExecutionActionMutation(stopExecution, executionId, options)
