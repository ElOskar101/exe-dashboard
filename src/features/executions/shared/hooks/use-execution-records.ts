import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import type { Dispatch } from 'react'
import type { Execution } from '../model/execution'
import type { ExecutionCreatePayload, ExecutionSchedulePayload } from '../model/execution-create-payload'
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
  scheduleExecution,
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

export const useExecutionsQuery = (query: ExecutionQuery = {}, options: ExecutionQueryOptions = {}) => {
  const queryClient = useQueryClient()
  const { target } = useExecutionTarget()
  const isEnabled = options.enabled ?? true

  const executionsQuery = useQuery({
    queryKey: executionKeys.list(query, target.key),
    queryFn: async () => {
      const response = await getExecutions(target.requestTarget, query)

      return syncExecutionsFromListSnapshot(queryClient, response.data, target.key)
    },
    enabled: isEnabled,
  })

  return executionsQuery
}

export const useExecutionQuery = (executionId: string) => {
  const queryClient = useQueryClient()
  const { target } = useExecutionTarget()

  const executionQuery = useQuery({
    queryKey: executionKeys.detail(executionId, target.key),
    queryFn: async () => {
      const response = await getExecutionById(executionId, target.requestTarget)

      return syncExecutionFromDetailSnapshot(queryClient, response.data, target.key)
    },
    enabled: true,
  })

  return executionQuery
}

export const useExecutionReportQuery = (executionId: string, enabled: boolean) => {
  const { target } = useExecutionTarget()

  const reportQuery = useQuery({
    queryKey: executionKeys.report(executionId, target.key),
    queryFn: async () => {
      const response = await getExecutionReportHtml(executionId, target.requestTarget)

      return response.data
    },
    enabled,
  })

  return reportQuery
}

export const useExecutionAppStatsQuery = () => {
  const { target } = useExecutionTarget()

  const appStatsQuery = useQuery({
    queryKey: executionKeys.appStats(target.key),
    queryFn: async () => {
      const response = await getExecutionAppStats(target.requestTarget)

      return response.data
    },
    enabled: true,
  })

  return appStatsQuery
}

const useExecutionCreateMutation = <TPayload extends ExecutionCreatePayload>(
  mutationFn: (
    payload: TPayload,
    target: ReturnType<typeof useExecutionTarget>['target']['requestTarget'],
  ) => Promise<AxiosResponse<Execution>>,
  options: ExecutionMutationOptions<AxiosResponse<Execution>, TPayload> = {},
) => {
  const queryClient = useQueryClient()
  const { target } = useExecutionTarget()

  return useMutation({
    mutationFn: (payload: TPayload) => {
      return mutationFn(payload, target.requestTarget)
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

export const useCreateExecutionMutation = (
  options: ExecutionMutationOptions<AxiosResponse<Execution>, ExecutionCreatePayload> = {},
) => useExecutionCreateMutation(createExecution, options)

export const useScheduleExecutionMutation = (
  options: ExecutionMutationOptions<AxiosResponse<Execution>, ExecutionSchedulePayload> = {},
) => useExecutionCreateMutation(scheduleExecution, options)

export const useDeleteExecutionMutation = (
  options: ExecutionMutationOptions<AxiosResponse<Execution>, string> = {},
) => {
  const queryClient = useQueryClient()
  const { target } = useExecutionTarget()

  return useMutation({
    mutationFn: (executionId: string) => {
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
  const { target } = useExecutionTarget()

  return useMutation({
    mutationFn: async () => {
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
