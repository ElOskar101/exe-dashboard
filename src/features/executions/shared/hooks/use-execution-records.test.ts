import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useCreateExecutionMutation,
  useDeleteExecutionMutation,
  useExecutionAppStatsQuery,
  useExecutionsQuery,
  usePauseExecutionMutation,
  useScheduleExecutionMutation,
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
  runExecutionNow: vi.fn(),
  scheduleExecution: vi.fn(),
  stopExecution: vi.fn(),
}))

describe('useExecutionsQuery', () => {
  const invalidateQueries = vi.fn()
  const selectedTarget = {
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
      target: selectedTarget,
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
        queryKey: ['executions', 'runtime:runtime-1:application:app-1', 'list', { by: ['user-1'] }],
      }),
    )
    expect(query.isLoading).toBeUndefined()
    expect(query.isPending).toBeUndefined()
  })

  it('uses the selected execution target for app stats queries', () => {
    useExecutionAppStatsQuery()

    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        queryKey: ['executions', 'runtime:runtime-1:application:app-1', 'app-stats'],
      }),
    )
  })

  it('invalidates execution list and app stats after creating an execution', async () => {
    useCreateExecutionMutation()

    await getLastMutationSuccessHandler()({ data: {} }, {})

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['executions', 'runtime:runtime-1:application:app-1', 'list'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['executions', 'runtime:runtime-1:application:app-1', 'app-stats'],
    })
  })

  it('invalidates execution list and app stats after scheduling an execution', async () => {
    useScheduleExecutionMutation()

    await getLastMutationSuccessHandler()({ data: {} }, { scheduledAt: '2026-06-03T15:52:00.000Z' })

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['executions', 'runtime:runtime-1:application:app-1', 'list'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['executions', 'runtime:runtime-1:application:app-1', 'app-stats'],
    })
  })

  it('invalidates execution list and app stats after deleting an execution', async () => {
    useDeleteExecutionMutation()

    await getLastMutationSuccessHandler()({ data: {} }, 'execution-1')

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['executions', 'runtime:runtime-1:application:app-1', 'list'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['executions', 'runtime:runtime-1:application:app-1', 'app-stats'],
    })
  })

  it('invalidates execution detail, list, and app stats after modifying an execution', async () => {
    usePauseExecutionMutation('execution-1')

    await getLastMutationSuccessHandler()({ data: {} })

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['executions', 'runtime:runtime-1:application:app-1', 'detail', 'execution-1'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['executions', 'runtime:runtime-1:application:app-1', 'list'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['executions', 'runtime:runtime-1:application:app-1', 'app-stats'],
    })
  })
})
