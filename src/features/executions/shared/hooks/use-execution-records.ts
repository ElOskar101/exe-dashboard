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
  getExecutionAppStats,
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

interface ExecutionQueryOptions {
  enabled?: boolean
}

const invalidateExecutionList = async (queryClient: ReturnType<typeof useQueryClient>, targetKey: string) => {
  await queryClient.invalidateQueries({ queryKey: executionKeys.listRoot(targetKey) })
}

const invalidateExecutionAppStats = async (queryClient: ReturnType<typeof useQueryClient>, targetKey: string) => {
  await queryClient.invalidateQueries({ queryKey: executionKeys.appStats(targetKey) })
}

const invalidateExecutionDetail = async (
  queryClient: ReturnType<typeof useQueryClient>,
  executionId: string,
  targetKey: string,
) => {
  await queryClient.invalidateQueries({ queryKey: executionKeys.detail(executionId, targetKey) })
}

const isExecutionTargetReady = (
  target: ReturnType<typeof useExecutionTarget>['target'],
): target is Extract<ReturnType<typeof useExecutionTarget>['target'], { type: 'runtime-application' }> =>
  target.type === 'runtime-application'

export const useExecutionsQuery = (query: ExecutionQuery = {}, options: ExecutionQueryOptions = {}) => {
  const queryClient = useQueryClient()
  const { isResolving, target } = useExecutionTarget()
  const isEnabled = options.enabled ?? true
  const isTargetReady = isExecutionTargetReady(target)
  const isTargetResolutionBlocking = isEnabled && (isResolving || !isTargetReady)

  const executionsQuery = useQuery({
    queryKey: executionKeys.list(query, target.key),
    queryFn: async () => {
      if (!isTargetReady) {
        throw new Error('Choose a runtime application before loading executions.')
      }

      const response = await getExecutions(target.requestTarget, query)

      return syncExecutionsFromListSnapshot(queryClient, response.data, target.key)
    },
    enabled: isEnabled && !isTargetResolutionBlocking,
  })

  return {
    ...executionsQuery,
    isLoading: isTargetResolutionBlocking || executionsQuery.isLoading,
    isPending: isTargetResolutionBlocking || executionsQuery.isPending,
  }
}

export const useExecutionQuery = (executionId: string) => {
  const queryClient = useQueryClient()
  const { isResolving, target } = useExecutionTarget()
  const isTargetReady = isExecutionTargetReady(target)

  const executionQuery = useQuery({
    queryKey: executionKeys.detail(executionId, target.key),
    queryFn: async () => {
      if (!isTargetReady) {
        throw new Error('Choose a runtime application before loading execution details.')
      }

      const response = await getExecutionById(executionId, target.requestTarget)

      return syncExecutionFromDetailSnapshot(queryClient, response.data, target.key)
    },
    enabled: !isResolving && isTargetReady,
  })

  return {
    ...executionQuery,
    isLoading: isResolving || executionQuery.isLoading,
    isPending: isResolving || executionQuery.isPending,
  }
}

export const useExecutionReportQuery = (executionId: string, enabled: boolean) => {
  const { isResolving, target } = useExecutionTarget()
  const isTargetReady = isExecutionTargetReady(target)
  const isTargetResolutionBlocking = enabled && (isResolving || !isTargetReady)

  const reportQuery = useQuery({
    queryKey: executionKeys.report(executionId, target.key),
    queryFn: async () => {
      if (!isTargetReady) {
        throw new Error('Choose a runtime application before loading execution reports.')
      }

      const response = await getExecutionReportHtml(executionId, target.requestTarget)

      return response.data
    },
    enabled: enabled && !isTargetResolutionBlocking,
  })

  return {
    ...reportQuery,
    isLoading: isTargetResolutionBlocking || reportQuery.isLoading,
    isPending: isTargetResolutionBlocking || reportQuery.isPending,
  }
}

export const useExecutionAppStatsQuery = () => {
  const { isResolving, target } = useExecutionTarget()
  const isTargetReady = isExecutionTargetReady(target)

  const appStatsQuery = useQuery({
    queryKey: executionKeys.appStats(target.key),
    queryFn: async () => {
      if (!isTargetReady) {
        throw new Error('Choose a runtime application before loading app stats.')
      }

      const response = await getExecutionAppStats(target.requestTarget)

      return response.data
    },
    enabled: !isResolving && isTargetReady,
  })

  return {
    ...appStatsQuery,
    isLoading: isResolving || appStatsQuery.isLoading,
    isPending: isResolving || appStatsQuery.isPending,
  }
}

export const useCreateExecutionMutation = (
  options: ExecutionMutationOptions<AxiosResponse<Execution>, ExecutionCreatePayload> = {},
) => {
  const queryClient = useQueryClient()
  const { isResolving, target } = useExecutionTarget()

  return useMutation({
    mutationFn: (payload: ExecutionCreatePayload) => {
      if (isResolving || !isExecutionTargetReady(target)) {
        throw new Error('Choose a runtime application before creating an execution.')
      }

      return createExecution(payload, target.requestTarget)
    },
    onSuccess: async (response, variables) => {
      await Promise.all([
        invalidateExecutionList(queryClient, target.key),
        invalidateExecutionAppStats(queryClient, target.key),
      ])
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
      if (isResolving || !isExecutionTargetReady(target)) {
        throw new Error('Choose a runtime application before deleting an execution.')
      }

      return deleteExecution(executionId, target.requestTarget)
    },
    onSuccess: async (response, executionId) => {
      await Promise.all([
        invalidateExecutionList(queryClient, target.key),
        invalidateExecutionAppStats(queryClient, target.key),
      ])
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
      if (isResolving || !isExecutionTargetReady(target)) {
        throw new Error('Choose a runtime application before changing an execution.')
      }

      return mutationFn(executionId, target.requestTarget)
    },
    onSuccess: async (response) => {
      await Promise.all([
        invalidateExecutionDetail(queryClient, executionId, target.key),
        invalidateExecutionList(queryClient, target.key),
        invalidateExecutionAppStats(queryClient, target.key),
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
