import { ensurePathSuffix, stripTrailingSlash } from '@/lib/axios'
import {
  getPlaywrightRuntimeApplications,
  type PlaywrightRuntime,
  type PlaywrightRuntimeApplication,
} from '../model/playwright-runtime'

export const EXECUTION_RUNTIME_SEARCH_PARAM = 'runtime'
export const EXECUTION_APPLICATION_SEARCH_PARAM = 'app'
export const EXECUTION_TARGET_URL_SEARCH_PARAM = 'targetUrl'

export interface ExecutionApiRequestTarget {
  apiUrl: string
  reportsUrl: string
  socketUrl: string
}

export interface ExecutionTarget {
  key: string
  label: string
  requestTarget: ExecutionApiRequestTarget
  runtime?: PlaywrightRuntime
  application?: PlaywrightRuntimeApplication
  runtimeId: string
  applicationName: string
}

export interface ExecutionTargetSearchSelection {
  runtimeId: string
  applicationName: string
  targetUrl: string
}

const EXECUTION_TARGET_VALUE_SEPARATOR = '\u001f'
const URL_PROTOCOL_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i

export const getExecutionTargetKey = (runtimeId: string, applicationName: string) =>
  `runtime:${runtimeId}:application:${applicationName}`

export const encodeExecutionTargetValue = (selection: ExecutionTargetSearchSelection) =>
  `${selection.runtimeId}${EXECUTION_TARGET_VALUE_SEPARATOR}${selection.applicationName}${EXECUTION_TARGET_VALUE_SEPARATOR}${selection.targetUrl}`

export const decodeExecutionTargetValue = (value: string): ExecutionTargetSearchSelection | null => {
  const [runtimeId, applicationName, targetUrl, ...rest] = value.split(EXECUTION_TARGET_VALUE_SEPARATOR)

  if (!runtimeId || !applicationName || !targetUrl || rest.length > 0) {
    return null
  }

  return { runtimeId, applicationName, targetUrl }
}

export const getExecutionTargetSearchSelection = (searchParams: URLSearchParams) => {
  const runtimeId = searchParams.get(EXECUTION_RUNTIME_SEARCH_PARAM)?.trim()
  const applicationName = searchParams.get(EXECUTION_APPLICATION_SEARCH_PARAM)?.trim()
  const targetUrl = searchParams.get(EXECUTION_TARGET_URL_SEARCH_PARAM)?.trim()

  if (!runtimeId || !applicationName || !targetUrl) {
    return null
  }

  return { runtimeId, applicationName, targetUrl }
}

export const hasPartialExecutionTargetSearchSelection = (searchParams: URLSearchParams) => {
  const values = [
    searchParams.get(EXECUTION_RUNTIME_SEARCH_PARAM)?.trim(),
    searchParams.get(EXECUTION_APPLICATION_SEARCH_PARAM)?.trim(),
    searchParams.get(EXECUTION_TARGET_URL_SEARCH_PARAM)?.trim(),
  ]
  const presentCount = values.filter(Boolean).length

  return presentCount > 0 && presentCount < values.length
}

const getSocketUrlFromApiUrl = (apiUrl: string) => {
  try {
    const baseUrl = typeof window === 'undefined' ? 'http://localhost' : window.location.origin

    return new URL(apiUrl, baseUrl).origin
  } catch {
    return stripTrailingSlash(apiUrl) ?? apiUrl
  }
}

const getReportsUrlFromApiUrl = (apiUrl: string) => `${getSocketUrlFromApiUrl(apiUrl)}/reports`

export const normalizeSelectedExecutionApiUrl = (apiUrl?: string) => {
  const trimmedApiUrl = apiUrl?.trim()

  if (!trimmedApiUrl) {
    return ''
  }

  const absoluteApiUrl = URL_PROTOCOL_PATTERN.test(trimmedApiUrl) ? trimmedApiUrl : `https://${trimmedApiUrl}`

  return ensurePathSuffix(absoluteApiUrl, '/api/v1') ?? ''
}

export const getSelectedExecutionRequestTarget = (
  applicationOrTargetUrl: PlaywrightRuntimeApplication | string,
): ExecutionApiRequestTarget => {
  const apiUrl = normalizeSelectedExecutionApiUrl(
    typeof applicationOrTargetUrl === 'string' ? applicationOrTargetUrl : applicationOrTargetUrl.apiUrl,
  )

  return {
    apiUrl,
    reportsUrl: getReportsUrlFromApiUrl(apiUrl),
    socketUrl: getSocketUrlFromApiUrl(apiUrl),
  }
}

export const resolveExecutionTarget = (
  selection: ExecutionTargetSearchSelection,
  runtimes: readonly PlaywrightRuntime[] | undefined,
): ExecutionTarget => {
  const runtime = runtimes?.find((candidate) => candidate._id === selection.runtimeId)
  const application = getPlaywrightRuntimeApplications(runtime).find(
    (candidate) =>
      candidate.name === selection.applicationName && candidate.active !== false && Boolean(candidate.apiUrl?.trim()),
  )

  return {
    key: getExecutionTargetKey(selection.runtimeId, selection.applicationName),
    label: application?.name ?? selection.applicationName,
    requestTarget: getSelectedExecutionRequestTarget(selection.targetUrl),
    runtime,
    application,
    runtimeId: selection.runtimeId,
    applicationName: selection.applicationName,
  }
}

export const getExecutionReportUrl = (reportsUrl: string, executionId: string) =>
  `${stripTrailingSlash(reportsUrl)}/${executionId}`

export const getExecutionReportIndexUrl = (reportsUrl: string, executionId: string) =>
  `${getExecutionReportUrl(reportsUrl, executionId)}/index.html`
