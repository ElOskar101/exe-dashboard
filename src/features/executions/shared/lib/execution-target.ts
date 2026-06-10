import { APP_CONFIG } from '@/app.config'
import { ensurePathSuffix, stripTrailingSlash } from '@/lib/axios'
import type { PlaywrightRuntime, PlaywrightRuntimeApplication } from '../model/playwright-runtime'

export const EXECUTION_RUNTIME_SEARCH_PARAM = 'runtimeId'
export const EXECUTION_APPLICATION_SEARCH_PARAM = 'applicationName'
export const DEFAULT_EXECUTION_TARGET_KEY = 'default'
export const DEFAULT_EXECUTION_TARGET_LABEL = 'Default App'

export interface ExecutionApiRequestTarget {
  apiUrl: string
  reportsUrl: string
  socketUrl: string
}

export type ExecutionTarget =
  | {
      type: 'default'
      key: typeof DEFAULT_EXECUTION_TARGET_KEY
      label: typeof DEFAULT_EXECUTION_TARGET_LABEL
      requestTarget?: undefined
      runtime?: undefined
      application?: undefined
    }
  | {
      type: 'runtime-application'
      key: string
      label: string
      requestTarget: ExecutionApiRequestTarget
      runtime: PlaywrightRuntime
      application: PlaywrightRuntimeApplication
    }
  | {
      type: 'resolving'
      key: string
      label: string
      requestTarget?: undefined
      runtime?: undefined
      application?: undefined
    }

export interface ExecutionTargetSearchSelection {
  runtimeId: string
  applicationName: string
}

const EXECUTION_TARGET_VALUE_SEPARATOR = '\u001f'
const URL_PROTOCOL_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i

export const defaultExecutionTarget: ExecutionTarget = {
  type: 'default',
  key: DEFAULT_EXECUTION_TARGET_KEY,
  label: DEFAULT_EXECUTION_TARGET_LABEL,
}

export const getExecutionTargetKey = (runtimeId: string, applicationName: string) =>
  `runtime:${runtimeId}:application:${applicationName}`

export const getResolvingExecutionTarget = (runtimeId: string, applicationName: string): ExecutionTarget => ({
  type: 'resolving',
  key: `resolving:${getExecutionTargetKey(runtimeId, applicationName)}`,
  label: 'Loading app...',
})

export const encodeExecutionTargetValue = (selection: ExecutionTargetSearchSelection) =>
  `${selection.runtimeId}${EXECUTION_TARGET_VALUE_SEPARATOR}${selection.applicationName}`

export const decodeExecutionTargetValue = (value: string): ExecutionTargetSearchSelection | null => {
  const [runtimeId, applicationName, ...rest] = value.split(EXECUTION_TARGET_VALUE_SEPARATOR)

  if (!runtimeId || !applicationName || rest.length > 0) {
    return null
  }

  return { runtimeId, applicationName }
}

export const getExecutionTargetSearchSelection = (searchParams: URLSearchParams) => {
  const runtimeId = searchParams.get(EXECUTION_RUNTIME_SEARCH_PARAM)?.trim()
  const applicationName = searchParams.get(EXECUTION_APPLICATION_SEARCH_PARAM)?.trim()

  if (!runtimeId || !applicationName) {
    return null
  }

  return { runtimeId, applicationName }
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
  application: PlaywrightRuntimeApplication,
): ExecutionApiRequestTarget => {
  const apiUrl = normalizeSelectedExecutionApiUrl(application.apiUrl)

  return {
    apiUrl,
    reportsUrl: getReportsUrlFromApiUrl(apiUrl),
    socketUrl: getSocketUrlFromApiUrl(apiUrl),
  }
}

export const resolveExecutionTarget = (
  selection: ExecutionTargetSearchSelection | null,
  runtimes: readonly PlaywrightRuntime[] | undefined,
): ExecutionTarget => {
  if (!selection) {
    return defaultExecutionTarget
  }

  const runtime = runtimes?.find((candidate) => candidate._id === selection.runtimeId)
  const application = runtime?.applications.find(
    (candidate) =>
      candidate.name === selection.applicationName && candidate.active !== false && Boolean(candidate.apiUrl?.trim()),
  )

  if (!runtime || !application) {
    return defaultExecutionTarget
  }

  return {
    type: 'runtime-application',
    key: getExecutionTargetKey(runtime._id, application.name),
    label: application.name,
    requestTarget: getSelectedExecutionRequestTarget(application),
    runtime,
    application,
  }
}

export const getDefaultExecutionApiUrl = () => APP_CONFIG.exeApiUrl
export const getDefaultExecutionReportsUrl = () => APP_CONFIG.exeReportsUrl

export const getExecutionReportUrl = (reportsUrl: string, executionId: string) =>
  `${stripTrailingSlash(reportsUrl)}/${executionId}`

export const getExecutionReportIndexUrl = (reportsUrl: string, executionId: string) =>
  `${getExecutionReportUrl(reportsUrl, executionId)}/index.html`
