import { useMemo } from 'react'
import {
  getPlaywrightRuntimeApplications,
  useExecutionTarget,
  usePlaywrightRuntimesQuery,
  type PlaywrightRuntime,
  type PlaywrightRuntimeApplication,
} from '@/features/executions/shared'

export const EXECUTION_APP_DEFAULT_MAX_WORKERS = 10
export const EXECUTION_APP_DEFAULT_MAX_RETRIES = 3

export const getConfiguredApplicationLimit = (value: number | undefined, fallback: number) => value ?? fallback

const findSelectedApplication = (
  runtimes: readonly PlaywrightRuntime[] | undefined,
  runtimeId: string | undefined,
  applicationName: string | undefined,
): PlaywrightRuntimeApplication | undefined => {
  if (!runtimes || !runtimeId || !applicationName) {
    return undefined
  }

  const runtime = runtimes.find((candidate) => candidate._id === runtimeId)

  return getPlaywrightRuntimeApplications(runtime).find((candidate) => candidate.name === applicationName)
}

export const getExecutionAppLimits = (
  runtimes: readonly PlaywrightRuntime[] | undefined,
  runtimeId: string | undefined,
  applicationName: string | undefined,
) => {
  const application = findSelectedApplication(runtimes, runtimeId, applicationName)

  return {
    maxWorkers: getConfiguredApplicationLimit(application?.config?.maxWorkers, EXECUTION_APP_DEFAULT_MAX_WORKERS),
    maxRetries: getConfiguredApplicationLimit(application?.config?.maxRetries, EXECUTION_APP_DEFAULT_MAX_RETRIES),
  }
}

export const useExecutionAppLimits = () => {
  const { target } = useExecutionTarget()
  const runtimesQuery = usePlaywrightRuntimesQuery()
  const limits = useMemo(
    () => getExecutionAppLimits(runtimesQuery.data, target.runtimeId, target.applicationName),
    [runtimesQuery.data, target.runtimeId, target.applicationName],
  )

  return { ...limits, isLoading: runtimesQuery.isPending }
}
