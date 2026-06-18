import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { Execution } from '../model/execution'
import { executionKeys } from './execution-query-keys'
import {
  syncExecutionFromDetailSnapshot,
  syncExecutionsFromListSnapshot,
  syncExecutionStatusReadModelForTarget,
  type ExecutionStatusReadModel,
} from './execution-status-cache'

const targetKey = 'runtime:runtime-1:application:app-1'

const createExecution = (execution: Partial<Execution>): Execution => ({
  _id: 'execution-123456789',
  createdBy: 'user-1',
  project: 'project-a',
  status: 'queued',
  client: 'client-1',
  clinic: 'clinic-1',
  execution: '',
  context: {
    bot: {
      botName: 'Eligibility bot',
      targetUrl: 'https://carrier.example.com',
      username: 'runner',
      password: 'secret',
      otherInformation: {},
    },
    patients: [],
    config: {},
    rv: {},
  },
  createdAt: '2026-05-23T00:00:00.000Z',
  updatedAt: '2026-05-23T00:00:00.000Z',
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

    queryClient.setQueryData(executionKeys.list(undefined, targetKey), [execution])
    queryClient.setQueryData(executionKeys.detail(execution._id, targetKey), execution)

    syncExecutionStatusReadModelForTarget(queryClient, execution._id, 'COMPLETED', targetKey, {
      observedAt: '2026-05-23T00:01:00.000Z',
      source: 'realtime',
    })

    expect(queryClient.getQueryData<ExecutionStatusReadModel>(executionKeys.statuses(targetKey))).toEqual({
      [execution._id]: {
        observedAt: new Date('2026-05-23T00:01:00.000Z').getTime(),
        status: 'completed',
      },
    })
    expect(queryClient.getQueryData<Execution[]>(executionKeys.list(undefined, targetKey))).toEqual([
      createExecution({ status: 'completed' }),
    ])
    expect(queryClient.getQueryData<Execution>(executionKeys.detail(execution._id, targetKey))).toEqual(
      createExecution({ status: 'completed' }),
    )
  })

  it('normalizes detail snapshots and merges them back into all list caches', () => {
    const queryClient = createQueryClient()
    const staleExecution = createExecution({ status: 'running', notes: ['stale'] })
    const otherExecution = createExecution({
      _id: 'execution-2',
      client: 'client-2',
      notes: ['other'],
    })

    queryClient.setQueryData(executionKeys.list(undefined, targetKey), [staleExecution])
    queryClient.setQueryData(executionKeys.list({ client: ['client-1'] }, targetKey), [staleExecution])
    queryClient.setQueryData(executionKeys.list({ client: ['client-2'] }, targetKey), [otherExecution])

    const normalizedExecution = syncExecutionFromDetailSnapshot(
      queryClient,
      createExecution({
        status: 'process',
        notes: ['fresh'],
        finishedAt: '2026-05-23T00:05:00.000Z',
      }),
      targetKey,
    )

    expect(normalizedExecution).toEqual(
      createExecution({
        status: 'running',
        notes: ['fresh'],
        finishedAt: '2026-05-23T00:05:00.000Z',
      }),
    )
    expect(queryClient.getQueryData<ExecutionStatusReadModel>(executionKeys.statuses(targetKey))).toEqual({
      'execution-123456789': {
        observedAt: new Date('2026-05-23T00:00:00.000Z').getTime(),
        status: 'running',
      },
    })
    expect(queryClient.getQueryData<Execution[]>(executionKeys.list(undefined, targetKey))).toEqual([
      createExecution({
        status: 'running',
        notes: ['fresh'],
        finishedAt: '2026-05-23T00:05:00.000Z',
      }),
    ])
    expect(queryClient.getQueryData<Execution[]>(executionKeys.list({ client: ['client-1'] }, targetKey))).toEqual([
      createExecution({
        status: 'running',
        notes: ['fresh'],
        finishedAt: '2026-05-23T00:05:00.000Z',
      }),
    ])
    expect(queryClient.getQueryData<Execution[]>(executionKeys.list({ client: ['client-2'] }, targetKey))).toEqual([
      otherExecution,
    ])
  })

  it('uses list snapshots to repair active detail caches without clobbering existing detail-only fields', () => {
    const queryClient = createQueryClient()
    const execution = createExecution({ logs: 'historical logs', status: 'queued' })

    queryClient.setQueryData(executionKeys.detail(execution._id, targetKey), execution)

    const normalizedExecutions = syncExecutionsFromListSnapshot(
      queryClient,
      [
        createExecution({
          status: 'completed',
          execution: 'Daily eligibility',
        }),
        createExecution({
          _id: 'execution-2',
          status: 'process',
        }),
      ],
      targetKey,
    )

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
    expect(queryClient.getQueryData<ExecutionStatusReadModel>(executionKeys.statuses(targetKey))).toEqual({
      'execution-123456789': {
        observedAt: new Date('2026-05-23T00:00:00.000Z').getTime(),
        status: 'completed',
      },
      'execution-2': {
        observedAt: new Date('2026-05-23T00:00:00.000Z').getTime(),
        status: 'running',
      },
    })
    expect(queryClient.getQueryData<Execution>(executionKeys.detail(execution._id, targetKey))).toEqual(
      createExecution({
        logs: 'historical logs',
        status: 'completed',
        execution: 'Daily eligibility',
      }),
    )
  })

  it('keeps newer realtime status when an older HTTP snapshot arrives later', () => {
    const queryClient = createQueryClient()
    const execution = createExecution({
      status: 'queued',
      updatedAt: '2026-05-23T00:00:00.000Z',
    })

    queryClient.setQueryData(executionKeys.list(undefined, targetKey), [execution])
    queryClient.setQueryData(executionKeys.detail(execution._id, targetKey), execution)

    syncExecutionStatusReadModelForTarget(queryClient, execution._id, 'running', targetKey, {
      observedAt: '2026-05-23T00:02:00.000Z',
      source: 'realtime',
    })

    const normalizedExecutions = syncExecutionsFromListSnapshot(
      queryClient,
      [
        createExecution({
          status: 'queued',
          updatedAt: '2026-05-23T00:01:00.000Z',
        }),
      ],
      targetKey,
    )

    expect(normalizedExecutions).toEqual([
      createExecution({
        status: 'running',
        updatedAt: '2026-05-23T00:01:00.000Z',
      }),
    ])
    expect(queryClient.getQueryData<ExecutionStatusReadModel>(executionKeys.statuses(targetKey))).toEqual({
      'execution-123456789': {
        observedAt: new Date('2026-05-23T00:02:00.000Z').getTime(),
        status: 'running',
      },
    })
    expect(queryClient.getQueryData<Execution[]>(executionKeys.list(undefined, targetKey))).toEqual([
      createExecution({
        status: 'running',
        updatedAt: '2026-05-23T00:00:00.000Z',
      }),
    ])
    expect(queryClient.getQueryData<Execution>(executionKeys.detail(execution._id, targetKey))).toEqual(
      createExecution({
        status: 'running',
        updatedAt: '2026-05-23T00:01:00.000Z',
      }),
    )
  })
})
