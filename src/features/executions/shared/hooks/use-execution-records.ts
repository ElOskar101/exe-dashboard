import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import type { Dispatch } from 'react'
import type { Execution } from '../model/execution'
import type { ExecutionCreatePayload } from '../model/execution-create-payload'
import type { ExecutionQuery } from '../model/execution-query'
import { executionKeys } from '../lib/execution-query-keys'
import { syncExecutionFromDetailSnapshot, syncExecutionsFromListSnapshot } from '../lib/execution-status-cache'
import { useExecutionTarget } from './use-execution-target'
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

const invalidateExecutionList = async (queryClient: ReturnType<typeof useQueryClient>, targetKey: string) => {
  await queryClient.invalidateQueries({ queryKey: executionKeys.list(undefined, targetKey) })
}

const invalidateExecutionDetail = async (
  queryClient: ReturnType<typeof useQueryClient>,
  executionId: string,
  targetKey: string,
) => {
  await queryClient.invalidateQueries({ queryKey: executionKeys.detail(executionId, targetKey) })
}

export const useExecutionsQuery = (query: ExecutionQuery = {}) => {
  const queryClient = useQueryClient()
  const { isResolving, target } = useExecutionTarget()

  return useQuery({
    queryKey: executionKeys.list(query, target.key),
    queryFn: async () => {
      const response = await getExecutions(query, target.requestTarget)

      return syncExecutionsFromListSnapshot(queryClient, response.data, target.key)
    },
    enabled: !isResolving,
  })
}

export const useExecutionQuery = (executionId: string) => {
  const queryClient = useQueryClient()
  const { isResolving, target } = useExecutionTarget()

  return useQuery({
    queryKey: executionKeys.detail(executionId, target.key),
    queryFn: async () => {
      const response = await getExecutionById(executionId, target.requestTarget)

      return syncExecutionFromDetailSnapshot(queryClient, response.data, target.key)
    },
    enabled: !isResolving,
  })
}

export const useExecutionReportQuery = (executionId: string, enabled: boolean) => {
  const { isResolving, target } = useExecutionTarget()

  return useQuery({
    queryKey: executionKeys.report(executionId, target.key),
    queryFn: async () => {
      const response = await getExecutionReportHtml(executionId, target.requestTarget)

      return response.data
    },
    enabled: enabled && !isResolving,
  })
}

export const useCreateExecutionMutation = (
  options: ExecutionMutationOptions<AxiosResponse<Execution>, ExecutionCreatePayload> = {},
) => {
  const queryClient = useQueryClient()
  const { isResolving, target } = useExecutionTarget()

  return useMutation({
    mutationFn: (payload: ExecutionCreatePayload) => {
      if (isResolving) {
        throw new Error('Execution target is still loading.')
      }

      return createExecution(payload, target.requestTarget)
    },
    onSuccess: async (response, variables) => {
      await invalidateExecutionList(queryClient, target.key)
      await options.onSuccess?.([response, variables])
    },
  })
}

export const useDeleteExecutionMutation = (
  options: ExecutionMutationOptions<AxiosResponse<Execution>, string> = {},
) => {
  const queryClient = useQueryClient()
  const { isResolving, target } = useExecutionTarget()

  return useMutation({
    mutationFn: (executionId: string) => {
      if (isResolving) {
        throw new Error('Execution target is still loading.')
      }

      return deleteExecution(executionId, target.requestTarget)
    },
    onSuccess: async (response, executionId) => {
      await invalidateExecutionList(queryClient, target.key)
      await options.onSuccess?.([response, executionId])
    },
  })
}

type ExecutionActionMutationOptions = ExecutionMutationOptions<AxiosResponse<Execution>, string>

const useExecutionActionMutation = (
  mutationFn: typeof pauseExecution,
  executionId: string,
  options: ExecutionActionMutationOptions = {},
) => {
  const queryClient = useQueryClient()
  const { isResolving, target } = useExecutionTarget()

  return useMutation({
    mutationFn: async () => {
      if (isResolving) {
        throw new Error('Execution target is still loading.')
      }

      return mutationFn(executionId, target.requestTarget)
    },
    onSuccess: async (response) => {
      await Promise.all([
        invalidateExecutionDetail(queryClient, executionId, target.key),
        invalidateExecutionList(queryClient, target.key),
      ])
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
