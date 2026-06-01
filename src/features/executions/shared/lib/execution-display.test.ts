import { describe, expect, it } from 'vitest'
import {
  getExecutionLabel,
  isExecutionPaused,
  isExecutionRunning,
  mergeExecutionIntoList,
  normalizeExecutionStatus,
  updateExecutionStatus,
} from './execution-display'
import type { Execution } from '../model/execution'

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

describe('execution display helpers', () => {
  it('uses the execution name first', () => {
    expect(
      getExecutionLabel(
        createExecution({
          execution: 'Daily eligibility',
          botName: 'Eligibility bot',
        }),
      ),
    ).toBe('Daily eligibility')
  })

  it('falls back to botName, project, then shortened id', () => {
    expect(getExecutionLabel(createExecution({ botName: 'Eligibility bot' }))).toBe('Eligibility bot')

    expect(getExecutionLabel(createExecution({}))).toBe('project-a')

    expect(
      getExecutionLabel(
        createExecution({
          playwrightProject: '',
        }),
      ),
    ).toBe('executio...')
  })

  it('normalizes status and only treats running as stoppable', () => {
    expect(normalizeExecutionStatus('RUNNING')).toBe('running')
    expect(normalizeExecutionStatus('process')).toBe('running')
    expect(normalizeExecutionStatus('PAUSED')).toBe('paused')
    expect(isExecutionRunning('running')).toBe(true)
    expect(isExecutionRunning('RUNNING')).toBe(true)
    expect(isExecutionRunning('process')).toBe(true)
    expect(isExecutionRunning('queued')).toBe(false)
    expect(isExecutionRunning('completed')).toBe(false)
    expect(isExecutionPaused('paused')).toBe(true)
    expect(isExecutionPaused('running')).toBe(false)
    expect(isExecutionRunning(null)).toBe(false)
    expect(normalizeExecutionStatus(null)).toBe('unknown')
    expect(normalizeExecutionStatus('not-real')).toBe('unknown')
  })

  it('applies realtime status updates only to the matching execution', () => {
    const executions = [
      createExecution({ status: 'queued' }),
      createExecution({ _id: 'execution-2', status: 'running' }),
    ]

    expect(updateExecutionStatus(executions, 'execution-123456789', 'COMPLETED')).toEqual([
      createExecution({ status: 'completed' }),
      createExecution({ _id: 'execution-2', status: 'running' }),
    ])
    expect(updateExecutionStatus(executions, 'missing', 'completed')).toBe(executions)
  })

  it('merges execution detail data into the cached list and normalizes the status', () => {
    const executions = [
      createExecution({ status: 'running', notes: ['stale'] }),
      createExecution({ _id: 'execution-2', status: 'queued' }),
    ]

    expect(
      mergeExecutionIntoList(
        executions,
        createExecution({
          status: 'process',
          notes: ['fresh'],
          finishedAt: '2026-05-23T00:05:00.000Z',
        }),
      ),
    ).toEqual([
      createExecution({
        status: 'running',
        notes: ['fresh'],
        finishedAt: '2026-05-23T00:05:00.000Z',
      }),
      createExecution({ _id: 'execution-2', status: 'queued' }),
    ])
  })

  it('adds a missing execution into the cached list', () => {
    const executions = [createExecution({ status: 'queued' })]

    expect(
      mergeExecutionIntoList(
        executions,
        createExecution({
          _id: 'execution-2',
          status: 'process',
        }),
      ),
    ).toEqual([
      createExecution({ status: 'queued' }),
      createExecution({
        _id: 'execution-2',
        status: 'running',
      }),
    ])
  })
})
