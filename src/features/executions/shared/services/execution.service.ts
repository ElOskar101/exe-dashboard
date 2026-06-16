import cccClient, { exeClient, exeReportsClient } from '@/lib/axios'
import type { Execution } from '../model/execution'
import type { ExecutionCreatePayload, ExecutionSchedulePayload } from '../model/execution-create-payload'
import { EXECUTION_ARRAY_QUERY_KEYS, normalizeExecutionQuery, type ExecutionQuery } from '../model/execution-query'
import type { ExecutionAppStats } from '../model/app-stats'
import type { PlaywrightProject } from '../model/playwright-project'
import type {
  PlaywrightRuntime,
  PlaywrightRuntimeApplication,
  PlaywrightRuntimeCreatePayload,
  PlaywrightRuntimeShareMembersPayload,
  PlaywrightRuntimeShareMembersResult,
  PlaywrightRuntimeSharedMember,
  PlaywrightRuntimeUpdatePayload,
} from '../model/playwright-runtime'
import type { ExecutionApiRequestTarget } from '../lib/execution-target'

export type ExecutionUpdatePayload = Partial<Omit<Execution, '_id'>>

export interface PlaywrightRuntimeApiResponse<TData> {
  data: TData
  error?: string
  message?: string
  success: boolean
}

interface PlaywrightRuntimeAccessInfoResponse {
  createdBy?: string
  sharedWith: PlaywrightRuntimeSharedMember[]
  type: PlaywrightRuntime['accessInfo']['type']
}

interface PlaywrightRuntimeApplicationResponse extends Omit<PlaywrightRuntimeApplication, 'accessInfo'> {
  accessInfo: PlaywrightRuntimeAccessInfoResponse
}

interface PlaywrightRuntimeResponse extends Omit<PlaywrightRuntime, 'accessInfo' | 'applications'> {
  accessInfo: PlaywrightRuntimeAccessInfoResponse
  applications?: PlaywrightRuntimeApplicationResponse[]
}

type PlaywrightRuntimeResponseData = PlaywrightRuntimeResponse | PlaywrightRuntimeResponse[]

type NormalizedPlaywrightRuntimeResponseData<TData extends PlaywrightRuntimeResponseData> =
  TData extends PlaywrightRuntimeResponse[] ? PlaywrightRuntime[] : PlaywrightRuntime

const isPlaywrightRuntimeApiResponse = <TData>(
  value: PlaywrightRuntimeApiResponse<TData> | TData,
): value is PlaywrightRuntimeApiResponse<TData> =>
  typeof value === 'object' && value !== null && 'success' in value && 'data' in value

const normalizePlaywrightRuntimeAccessInfo = (
  accessInfo: PlaywrightRuntimeAccessInfoResponse,
): PlaywrightRuntime['accessInfo'] => ({
  ...accessInfo,
  sharedWith: accessInfo.sharedWith,
})

const normalizePlaywrightRuntimeApplication = (
  application: PlaywrightRuntimeApplicationResponse,
): PlaywrightRuntimeApplication => ({
  ...application,
  accessInfo: normalizePlaywrightRuntimeAccessInfo(application.accessInfo),
})

const normalizePlaywrightRuntime = (runtime: PlaywrightRuntimeResponse): PlaywrightRuntime => ({
  ...runtime,
  accessInfo: normalizePlaywrightRuntimeAccessInfo(runtime.accessInfo),
  applications: runtime.applications?.map(normalizePlaywrightRuntimeApplication),
})

export const getPlaywrightRuntimeResponseData = <TData extends PlaywrightRuntimeResponseData>(
  value: PlaywrightRuntimeApiResponse<TData> | TData,
): NormalizedPlaywrightRuntimeResponseData<TData> => {
  const data = isPlaywrightRuntimeApiResponse(value) ? value.data : value

  return (
    Array.isArray(data) ? data.map(normalizePlaywrightRuntime) : normalizePlaywrightRuntime(data)
  ) as NormalizedPlaywrightRuntimeResponseData<TData>
}

const getExecutionRequestConfig = (target: ExecutionApiRequestTarget) => ({
  baseURL: target.apiUrl,
})

const getExecutionReportsRequestConfig = (target: ExecutionApiRequestTarget) => ({
  baseURL: target.reportsUrl,
})

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

export const getExecutions = (target: ExecutionApiRequestTarget, query: ExecutionQuery = {}) => {
  const params = buildExecutionSearchParams(query)
  const config = getExecutionRequestConfig(target)

  if (params.size === 0) {
    return exeClient.get<Execution[]>('executions', config)
  }

  return exeClient.get<Execution[]>('executions', { ...config, params })
}

export const getExecutionAppStats = (target: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return exeClient.get<ExecutionAppStats>('stats', config)
}

export const createExecution = (data: ExecutionCreatePayload, target: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return exeClient.post<Execution>('executions', data, config)
}

export const scheduleExecution = (data: ExecutionSchedulePayload, target: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return exeClient.post<Execution>('executions/schedule', data, config)
}

export const getExecutionById = (executionId: string, target: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return exeClient.get<Execution>(`executions/${executionId}`, config)
}

export const getPlaywrightProjects = () => cccClient.get<PlaywrightProject[]>('v2/playwright-projects')

export const getPlaywrightProjectById = (playwrightProjectId: string) =>
  cccClient.get<PlaywrightProject>(`v2/playwright-projects/${playwrightProjectId}`)

export const getPlaywrightRuntimes = () =>
  cccClient.get<PlaywrightRuntimeApiResponse<PlaywrightRuntimeResponse[]> | PlaywrightRuntimeResponse[]>(
    'v2/playwright-runtimes',
  )

export const getPlaywrightRuntimeById = (playwrightRuntimeId: string) =>
  cccClient.get<PlaywrightRuntimeApiResponse<PlaywrightRuntimeResponse> | PlaywrightRuntimeResponse>(
    `v2/playwright-runtimes/${playwrightRuntimeId}`,
  )

export const createPlaywrightRuntime = (data: PlaywrightRuntimeCreatePayload) =>
  cccClient.post<PlaywrightRuntimeApiResponse<PlaywrightRuntime>>('v2/playwright-runtimes', data)

export const updatePlaywrightRuntime = (playwrightRuntimeId: string, data: PlaywrightRuntimeUpdatePayload) =>
  cccClient.put<PlaywrightRuntimeApiResponse<PlaywrightRuntime>>(`v2/playwright-runtimes/${playwrightRuntimeId}`, data)

export const deletePlaywrightRuntime = (playwrightRuntimeId: string) =>
  cccClient.delete<PlaywrightRuntimeApiResponse<undefined>>(`v2/playwright-runtimes/${playwrightRuntimeId}`)

export const addPlaywrightRuntimeShareMembers = (
  playwrightRuntimeId: string,
  data: PlaywrightRuntimeShareMembersPayload,
) =>
  cccClient.post<PlaywrightRuntimeApiResponse<PlaywrightRuntimeShareMembersResult>>(
    `v2/playwright-runtimes/${playwrightRuntimeId}/share`,
    data,
  )

export const removePlaywrightRuntimeShareMembers = (
  playwrightRuntimeId: string,
  data: PlaywrightRuntimeShareMembersPayload,
) =>
  cccClient.delete<PlaywrightRuntimeApiResponse<PlaywrightRuntimeShareMembersResult>>(
    `v2/playwright-runtimes/${playwrightRuntimeId}/share`,
    { data },
  )

export const getExecutionReportHtml = (executionId: string, target: ExecutionApiRequestTarget) => {
  const config = getExecutionReportsRequestConfig(target)

  return exeReportsClient.get<string>(`${executionId}/index.html`, config)
}

export const updateExecution = (
  executionId: string,
  data: ExecutionUpdatePayload,
  target: ExecutionApiRequestTarget,
) => {
  const config = getExecutionRequestConfig(target)

  return exeClient.patch<Execution>(`executions/${executionId}`, data, config)
}

export const deleteExecution = (executionId: string, target: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return exeClient.delete<Execution>(`executions/${executionId}`, config)
}

export const stopExecution = (executionId: string, target: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return exeClient.post<Execution>(`executions/${executionId}/stop`, undefined, config)
}

export const pauseExecution = (executionId: string, target: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return exeClient.post<Execution>(`executions/${executionId}/pause`, undefined, config)
}

export const resumeExecution = (executionId: string, target: ExecutionApiRequestTarget) => {
  const config = getExecutionRequestConfig(target)

  return exeClient.post<Execution>(`executions/${executionId}/resume`, undefined, config)
}
