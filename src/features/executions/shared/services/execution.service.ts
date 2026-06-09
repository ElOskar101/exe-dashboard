import cccClient, { exeClient, exeReportsClient } from '@/lib/axios'
import type { Execution } from '../model/execution'
import type { ExecutionCreatePayload } from '../model/execution-create-payload'
import { EXECUTION_ARRAY_QUERY_KEYS, normalizeExecutionQuery, type ExecutionQuery } from '../model/execution-query'
import type { ExecutionAppStats } from '../model/app-stats'
import type { PlaywrightProject } from '../model/playwright-project'
import type { PlaywrightRuntime } from '../model/playwright-runtime'
import type { ExecutionApiRequestTarget } from '../lib/execution-target'

export type ExecutionUpdatePayload = Partial<Omit<Execution, '_id'>>

const getExecutionRequestConfig = (target?: ExecutionApiRequestTarget) =>
  target
    ? {
        baseURL: target.apiUrl,
      }
    : undefined

const getExecutionReportsRequestConfig = (target?: ExecutionApiRequestTarget) =>
  target
    ? {
        baseURL: target.reportsUrl,
      }
    : undefined

const buildExecutionSearchParams = (query: ExecutionQuery) => {
  const normalizedQuery = normalizeExecutionQuery(query)
  const searchParams = new URLSearchParams()

  for (const key of EXECUTION_ARRAY_QUERY_KEYS) {
    normalizedQuery[key]?.forEach((value) => searchParams.append(key, value))
  }

  if (normalizedQuery.from) searchParams.set('from', normalizedQuery.from)
  if (normalizedQuery.to) searchParams.set('to', normalizedQuery.to)
  if (normalizedQuery.project) searchParams.set('project', normalizedQuery.project)
  if (normalizedQuery.dateField) searchParams.set('dateField', normalizedQuery.dateField)
  if (normalizedQuery.status) searchParams.set('status', normalizedQuery.status)
  if (normalizedQuery.limit) searchParams.set('limit', normalizedQuery.limit.toString())

  return searchParams
}

export const getExecutions = (query: ExecutionQuery = {}, target?: ExecutionApiRequestTarget) => {
  const params = buildExecutionSearchParams(query)
  const config = getExecutionRequestConfig(target)

  if (params.size === 0) {
    return config ? exeClient.get<Execution[]>('executions', config) : exeClient.get<Execution[]>('executions')
  }

  return exeClient.get<Execution[]>('executions', { ...config, params })
}

export const getExecutionAppStats = (target?: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return config ? exeClient.get<ExecutionAppStats>('stats', config) : exeClient.get<ExecutionAppStats>('stats')
}

export const createExecution = (data: ExecutionCreatePayload, target?: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return config ? exeClient.post<Execution>('executions', data, config) : exeClient.post<Execution>('executions', data)
}

export const getExecutionById = (executionId: string, target?: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return config
    ? exeClient.get<Execution>(`executions/${executionId}`, config)
    : exeClient.get<Execution>(`executions/${executionId}`)
}

export const getPlaywrightProjects = () => cccClient.get<PlaywrightProject[]>('v2/playwright-projects')

export const getPlaywrightProjectById = (playwrightProjectId: string) =>
  cccClient.get<PlaywrightProject>(`v2/playwright-projects/${playwrightProjectId}`)

export const getPlaywrightRuntimes = () => cccClient.get<PlaywrightRuntime[]>('v2/playwright-runtimes')

export const getPlaywrightRuntimeById = (playwrightRuntimeId: string) =>
  cccClient.get<PlaywrightRuntime>(`v2/playwright-runtimes/${playwrightRuntimeId}`)

export const getExecutionReportHtml = (executionId: string, target?: ExecutionApiRequestTarget) => {
  const config = getExecutionReportsRequestConfig(target)

  return config
    ? exeReportsClient.get<string>(`${executionId}/index.html`, config)
    : exeReportsClient.get<string>(`${executionId}/index.html`)
}

export const updateExecution = (
  executionId: string,
  data: ExecutionUpdatePayload,
  target?: ExecutionApiRequestTarget,
) => {
  const config = getExecutionRequestConfig(target)

  return config
    ? exeClient.patch<Execution>(`executions/${executionId}`, data, config)
    : exeClient.patch<Execution>(`executions/${executionId}`, data)
}

export const deleteExecution = (executionId: string, target?: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return config
    ? exeClient.delete<Execution>(`executions/${executionId}`, config)
    : exeClient.delete<Execution>(`executions/${executionId}`)
}

export const stopExecution = (executionId: string, target?: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return config
    ? exeClient.post<Execution>(`executions/${executionId}/stop`, undefined, config)
    : exeClient.post<Execution>(`executions/${executionId}/stop`)
}

export const pauseExecution = (executionId: string, target?: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return config
    ? exeClient.post<Execution>(`executions/${executionId}/pause`, undefined, config)
    : exeClient.post<Execution>(`executions/${executionId}/pause`)
}

export const resumeExecution = (executionId: string, target?: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return config
    ? exeClient.post<Execution>(`executions/${executionId}/resume`, undefined, config)
    : exeClient.post<Execution>(`executions/${executionId}/resume`)
}
