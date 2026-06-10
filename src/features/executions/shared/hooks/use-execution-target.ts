import { useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  EXECUTION_APPLICATION_SEARCH_PARAM,
  EXECUTION_RUNTIME_SEARCH_PARAM,
  EXECUTION_TARGET_URL_SEARCH_PARAM,
  getExecutionTargetSearchSelection,
  resolveExecutionTarget,
  type ExecutionTargetSearchSelection,
} from '../lib/execution-target'
import { executionKeys } from '../lib/execution-query-keys'
import { getPlaywrightProjects, getPlaywrightRuntimes } from '../services/execution.service'

export const usePlaywrightRuntimesQuery = (enabled = true) =>
  useQuery({
    queryKey: executionKeys.runtimeCatalog(),
    queryFn: async () => {
      const response = await getPlaywrightRuntimes()

      return response.data
    },
    enabled,
  })

export const usePlaywrightProjectsQuery = (enabled = true) =>
  useQuery({
    queryKey: executionKeys.projectCatalog(),
    queryFn: async () => {
      const response = await getPlaywrightProjects()

      return response.data
    },
    enabled,
  })

export const useExecutionTarget = () => {
  const [searchParams] = useSearchParams()
  const selection = getExecutionTargetSearchSelection(searchParams)

  const target = useMemo(() => {
    if (!selection) {
      throw new Error('Execution target URL params are required before loading execution data.')
    }

    return resolveExecutionTarget(selection, undefined)
  }, [selection])

  return {
    requestedSelection: selection,
    target,
  }
}

const applyExecutionTargetSearch = (
  to: string,
  selection: ExecutionTargetSearchSelection | null,
  currentSearch: string,
  preserveCurrentSearch = false,
) => {
  const url = new URL(to, window.location.origin)
  const searchParams = new URLSearchParams(url.search || (preserveCurrentSearch ? currentSearch : ''))

  if (selection) {
    searchParams.set(EXECUTION_RUNTIME_SEARCH_PARAM, selection.runtimeId)
    searchParams.set(EXECUTION_APPLICATION_SEARCH_PARAM, selection.applicationName)
    searchParams.set(EXECUTION_TARGET_URL_SEARCH_PARAM, selection.targetUrl)
  } else {
    searchParams.delete(EXECUTION_RUNTIME_SEARCH_PARAM)
    searchParams.delete(EXECUTION_APPLICATION_SEARCH_PARAM)
    searchParams.delete(EXECUTION_TARGET_URL_SEARCH_PARAM)
  }

  const nextSearch = searchParams.toString()

  return `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`
}

export const useExecutionTargetNavigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { target } = useExecutionTarget()
  const selectedTarget = {
    runtimeId: target.runtimeId,
    applicationName: target.applicationName,
    targetUrl: target.requestTarget.apiUrl,
  }

  const getPathWithExecutionTarget = (to: string) => applyExecutionTargetSearch(to, selectedTarget, location.search)

  const navigateWithExecutionTarget = (to: string) => {
    navigate(getPathWithExecutionTarget(to))
  }

  const getSettingsPath = () => getPathWithExecutionTarget('/settings')

  return {
    getPathWithExecutionTarget,
    getSettingsPath,
    hasSelectedExecutionTarget: true,
    navigateWithExecutionTarget,
  }
}

export const useExecutionTargetSetter = () => {
  const location = useLocation()
  const navigate = useNavigate()

  return (selection: ExecutionTargetSearchSelection | null) => {
    navigate(applyExecutionTargetSearch(location.pathname, selection, location.search, true))
  }
}
