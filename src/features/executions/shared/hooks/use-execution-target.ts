import { useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  DEFAULT_EXECUTION_TARGET_KEY,
  EXECUTION_APPLICATION_SEARCH_PARAM,
  EXECUTION_RUNTIME_SEARCH_PARAM,
  defaultExecutionTarget,
  getExecutionTargetSearchSelection,
  getResolvingExecutionTarget,
  resolveExecutionTarget,
  type ExecutionTargetSearchSelection,
} from '../lib/execution-target'
import { executionKeys } from '../lib/execution-query-keys'
import { getPlaywrightRuntimes } from '../services/execution.service'

export const usePlaywrightRuntimesQuery = (enabled = true) =>
  useQuery({
    queryKey: executionKeys.runtimeCatalog(),
    queryFn: async () => {
      const response = await getPlaywrightRuntimes()

      return response.data
    },
    enabled,
  })

export const useExecutionTarget = () => {
  const [searchParams] = useSearchParams()
  const selection = getExecutionTargetSearchSelection(searchParams)
  const runtimesQuery = usePlaywrightRuntimesQuery(Boolean(selection))
  const isResolving = Boolean(selection) && runtimesQuery.isLoading

  const target = useMemo(() => {
    if (!selection) {
      return defaultExecutionTarget
    }

    if (runtimesQuery.isLoading) {
      return getResolvingExecutionTarget(selection.runtimeId, selection.applicationName)
    }

    return resolveExecutionTarget(selection, runtimesQuery.data)
  }, [runtimesQuery.data, runtimesQuery.isLoading, selection])

  return {
    isResolving,
    requestedSelection: selection,
    runtimesQuery,
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
  } else {
    searchParams.delete(EXECUTION_RUNTIME_SEARCH_PARAM)
    searchParams.delete(EXECUTION_APPLICATION_SEARCH_PARAM)
  }

  const nextSearch = searchParams.toString()

  return `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`
}

export const useExecutionTargetNavigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { target } = useExecutionTarget()
  const selectedTarget =
    target.type === 'runtime-application'
      ? {
          runtimeId: target.runtime._id,
          applicationName: target.application.name,
        }
      : null

  const getPathWithExecutionTarget = (to: string) => applyExecutionTargetSearch(to, selectedTarget, location.search)

  const navigateWithExecutionTarget = (to: string) => {
    navigate(getPathWithExecutionTarget(to))
  }

  const getSettingsPath = () => getPathWithExecutionTarget('/settings')

  return {
    getPathWithExecutionTarget,
    getSettingsPath,
    hasSelectedExecutionTarget: target.key !== DEFAULT_EXECUTION_TARGET_KEY,
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
