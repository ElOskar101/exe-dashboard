import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useExecutionAppStatsQuery,
  useExecutionQuery,
  useExecutionReportQuery,
  useExecutionsQuery,
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
  beforeEach(() => {
    mocks.useExecutionTarget.mockReturnValue({
      isResolving: false,
      target: { key: 'default', requestTarget: undefined },
    })
    mocks.useQuery.mockImplementation((options) => options)
    mocks.useQueryClient.mockReturnValue({})
  })

  it('allows callers to disable the query until prerequisites are ready', () => {
    const query = useExecutionsQuery({ by: ['user-1'] }, { enabled: false })

    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryKey: ['executions', 'default', 'list', { by: ['user-1'] }],
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
      target: {
        key: 'runtime:runtime-1:application:app-1',
        requestTarget: { apiUrl: 'https://runtime.example.com/api/v1' },
      },
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
})
