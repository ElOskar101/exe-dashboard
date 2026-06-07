import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useExecutionAppStatsQuery, useExecutionsQuery } from './use-execution-records'

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
    useExecutionsQuery({ by: ['user-1'] }, { enabled: false })

    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryKey: ['executions', 'default', 'list', { by: ['user-1'] }],
      }),
    )
  })

  it('keeps the query disabled while the execution target is resolving', () => {
    mocks.useExecutionTarget.mockReturnValue({
      isResolving: true,
      target: { key: 'runtime-1', requestTarget: undefined },
    })

    useExecutionsQuery({ by: ['user-1'] }, { enabled: true })

    expect(mocks.useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryKey: ['executions', 'runtime-1', 'list', { by: ['user-1'] }],
      }),
    )
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
})
