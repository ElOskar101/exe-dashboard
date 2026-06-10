import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCreateExecutionMutation,
  useDeleteExecutionMutation,
  useExecutionAppStatsQuery,
  useExecutionQuery,
  useExecutionReportQuery,
  useExecutionsQuery,
  usePauseExecutionMutation,
} from './use-execution-records'

const mocks = vi.hoisted(() => ({
  useExecutionTarget: vi.fn(),
  useMutation: vi.fn(),
  useQuery: vi.fn(),
  useQueryClient: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: mocks.useMutation,
  useQuery: mocks.useQuery,
  useQueryClient: mocks.useQueryClient,
}))

vi.mock('./use-execution-target', () => ({
  useExecutionTarget: mocks.useExecutionTarget,
}))

vi.mock('../lib/execution-status-cache', () => ({
  syncExecutionFromDetailSnapshot: vi.fn(),
  syncExecutionsFromListSnapshot: vi.fn(),
}))

vi.mock('../services/execution.service', () => ({
  createExecution: vi.fn(),
  deleteExecution: vi.fn(),
  getExecutionById: vi.fn(),
  getExecutionAppStats: vi.fn(),
  getExecutionReportHtml: vi.fn(),
  getExecutions: vi.fn(),
  pauseExecution: vi.fn(),
  resumeExecution: vi.fn(),
  stopExecution: vi.fn(),
}))

describe('useExecutionsQuery', () => {
  const invalidateQueries = vi.fn()
  const selectedTarget = {
    type: 'runtime-application',
    key: 'runtime:runtime-1:application:app-1',
    runtimeId: 'runtime-1',
    applicationName: 'app-1',
    label: 'app-1',
    requestTarget: {
      apiUrl: 'https://runtime.example.com/api/v1',
      reportsUrl: 'https://runtime.example.com/reports',
      socketUrl: 'https://runtime.example.com',
    },
  } as const

  const getLastMutationSuccessHandler = () => {
    const mutationOptions = mocks.useMutation.mock.lastCall?.[0] as { onSuccess?: unknown }

    if (typeof mutationOptions.onSuccess !== 'function') {
      throw new Error('Expected useMutation to receive an onSuccess handler.')
    }

    return mutationOptions.onSuccess
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useExecutionTarget.mockReturnValue({
      isResolving: false,
      target: { type: 'missing', key: 'missing', label: 'Choose app', requestTarget: undefined },
    })
    mocks.useMutation.mockImplementation((options) => options)
    mocks.useQuery.mockImplementation((options) => options)
    mocks.useQueryClient.mockReturnValue({ invalidateQueries })
  })

  it('allows callers to disable the query until prerequisites are ready', () => {
    const query = useExecutionsQuery({ by: ['user-1'] }, { enabled: false })

    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryKey: ['executions', 'missing', 'list', { by: ['user-1'] }],
      }),
    )
    expect(query.isLoading).toBeUndefined()
    expect(query.isPending).toBeUndefined()
  })

  it('keeps the query disabled while the execution target is resolving', () => {
    mocks.useExecutionTarget.mockReturnValue({
      isResolving: true,
      target: { key: 'runtime-1', requestTarget: undefined },
    })

    const query = useExecutionsQuery({ by: ['user-1'] }, { enabled: true })

    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryKey: ['executions', 'runtime-1', 'list', { by: ['user-1'] }],
      }),
    )
    expect(query.isLoading).toBe(true)
    expect(query.isPending).toBe(true)
  })

  it('uses the selected execution target for app stats queries', () => {
    mocks.useExecutionTarget.mockReturnValue({
      isResolving: false,
      target: selectedTarget,
    })

    useExecutionAppStatsQuery()

    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        queryKey: ['executions', 'runtime:runtime-1:application:app-1', 'app-stats'],
      }),
    )
  })

  it('reports app stats as loading while the execution target is resolving', () => {
    mocks.useExecutionTarget.mockReturnValue({
      isResolving: true,
      target: { key: 'runtime-1', requestTarget: undefined },
    })

    const query = useExecutionAppStatsQuery()

    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryKey: ['executions', 'runtime-1', 'app-stats'],
      }),
    )
    expect(query.isLoading).toBe(true)
    expect(query.isPending).toBe(true)
  })

  it('reports execution details as loading while the execution target is resolving', () => {
    mocks.useExecutionTarget.mockReturnValue({
      isResolving: true,
      target: { key: 'runtime-1', requestTarget: undefined },
    })

    const query = useExecutionQuery('execution-1')

    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryKey: ['executions', 'runtime-1', 'detail', 'execution-1'],
      }),
    )
    expect(query.isLoading).toBe(true)
    expect(query.isPending).toBe(true)
  })

  it('reports execution reports as loading while the execution target is resolving and reports are enabled', () => {
    mocks.useExecutionTarget.mockReturnValue({
      isResolving: true,
      target: { key: 'runtime-1', requestTarget: undefined },
    })

    const query = useExecutionReportQuery('execution-1', true)

    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryKey: ['executions', 'runtime-1', 'report', 'execution-1'],
      }),
    )
    expect(query.isLoading).toBe(true)
    expect(query.isPending).toBe(true)
  })

  it('does not report execution reports as loading when reports are disabled by the caller', () => {
    mocks.useExecutionTarget.mockReturnValue({
      isResolving: true,
      target: { key: 'runtime-1', requestTarget: undefined },
    })

    const query = useExecutionReportQuery('execution-1', false)

    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryKey: ['executions', 'runtime-1', 'report', 'execution-1'],
      }),
    )
    expect(query.isLoading).toBeUndefined()
    expect(query.isPending).toBeUndefined()
  })

  it('invalidates execution list and app stats after creating an execution', async () => {
    useCreateExecutionMutation()

    await getLastMutationSuccessHandler()({ data: {} }, {})

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['executions', 'missing', 'list'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['executions', 'missing', 'app-stats'] })
  })

  it('invalidates execution list and app stats after deleting an execution', async () => {
    useDeleteExecutionMutation()

    await getLastMutationSuccessHandler()({ data: {} }, 'execution-1')

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['executions', 'missing', 'list'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['executions', 'missing', 'app-stats'] })
  })

  it('invalidates execution detail, list, and app stats after modifying an execution', async () => {
    usePauseExecutionMutation('execution-1')

    await getLastMutationSuccessHandler()({ data: {} })

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['executions', 'missing', 'detail', 'execution-1'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['executions', 'missing', 'list'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['executions', 'missing', 'app-stats'] })
  })
})
