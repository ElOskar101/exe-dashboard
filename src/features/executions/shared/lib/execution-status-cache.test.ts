import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { Execution } from '../model/execution'
import { executionKeys } from './execution-query-keys'
import {
  syncExecutionFromDetailSnapshot,
  syncExecutionStatusReadModel,
  syncExecutionsFromListSnapshot,
  type ExecutionStatusReadModel,
} from './execution-status-cache'

const createExecution = (execution: Partial<Execution>): Execution => ({
  _id: 'execution-123456789',
  createdBy: 'user-1',
  playwrightProject: 'project-a',
  status: 'queued',
  client: 'client-1',
  clinic: 'clinic-1',
  execution: '',
  createdAt: '2026-05-23T00:00:00.000Z',
  updatedAt: '2026-05-23T00:00:00.000Z',
  jobId: 'job-1',
  playwrightExecutionId: 'playwright-1',
  ...execution,
})

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

describe('execution status cache', () => {
  it('updates the shared read model, list cache, and detail cache from realtime status events', () => {
    const queryClient = createQueryClient()
    const execution = createExecution({ status: 'queued' })

    queryClient.setQueryData(executionKeys.list(), [execution])
    queryClient.setQueryData(executionKeys.detail(execution._id), execution)

    syncExecutionStatusReadModel(queryClient, execution._id, 'COMPLETED')

    expect(queryClient.getQueryData<ExecutionStatusReadModel>(executionKeys.statuses())).toEqual({
      [execution._id]: 'completed',
    })
    expect(queryClient.getQueryData<Execution[]>(executionKeys.list())).toEqual([
      createExecution({ status: 'completed' }),
    ])
    expect(queryClient.getQueryData<Execution>(executionKeys.detail(execution._id))).toEqual(
      createExecution({ status: 'completed' }),
    )
  })

  it('normalizes detail snapshots and merges them back into the list cache', () => {
    const queryClient = createQueryClient()
    const staleExecution = createExecution({ status: 'running', notes: ['stale'] })

    queryClient.setQueryData(executionKeys.list(), [staleExecution])

    const normalizedExecution = syncExecutionFromDetailSnapshot(
      queryClient,
      createExecution({
        status: 'process',
        notes: ['fresh'],
        finishedAt: '2026-05-23T00:05:00.000Z',
      }),
    )

    expect(normalizedExecution).toEqual(
      createExecution({
        status: 'running',
        notes: ['fresh'],
        finishedAt: '2026-05-23T00:05:00.000Z',
      }),
    )
    expect(queryClient.getQueryData<ExecutionStatusReadModel>(executionKeys.statuses())).toEqual({
      'execution-123456789': 'running',
    })
    expect(queryClient.getQueryData<Execution[]>(executionKeys.list())).toEqual([
      createExecution({
        status: 'running',
        notes: ['fresh'],
        finishedAt: '2026-05-23T00:05:00.000Z',
      }),
    ])
  })

  it('uses list snapshots to repair active detail caches without clobbering existing detail-only fields', () => {
    const queryClient = createQueryClient()
    const execution = createExecution({ logs: 'historical logs', status: 'queued' })

    queryClient.setQueryData(executionKeys.detail(execution._id), execution)

    const normalizedExecutions = syncExecutionsFromListSnapshot(queryClient, [
      createExecution({
        status: 'completed',
        execution: 'Daily eligibility',
      }),
      createExecution({
        _id: 'execution-2',
        status: 'process',
      }),
    ])

    expect(normalizedExecutions).toEqual([
      createExecution({
        status: 'completed',
        execution: 'Daily eligibility',
      }),
      createExecution({
        _id: 'execution-2',
        status: 'running',
      }),
    ])
    expect(queryClient.getQueryData<ExecutionStatusReadModel>(executionKeys.statuses())).toEqual({
      'execution-123456789': 'completed',
      'execution-2': 'running',
    })
    expect(queryClient.getQueryData<Execution>(executionKeys.detail(execution._id))).toEqual(
      createExecution({
        logs: 'historical logs',
        status: 'completed',
        execution: 'Daily eligibility',
      }),
    )
  })
})
