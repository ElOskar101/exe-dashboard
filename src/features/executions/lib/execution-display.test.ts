import { describe, expect, it } from 'vitest'
import {
  getExecutionLabel,
  isExecutionRunning,
  normalizeExecutionStatus,
} from './execution-display'
import { IExecution } from '../model/execution.interface'

const createExecution = (execution: Partial<IExecution>): IExecution => ({
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
    expect(
      getExecutionLabel(createExecution({ botName: 'Eligibility bot' })),
    ).toBe('Eligibility bot')

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
    expect(isExecutionRunning('running')).toBe(true)
    expect(isExecutionRunning('RUNNING')).toBe(true)
    expect(isExecutionRunning('queued')).toBe(false)
    expect(isExecutionRunning('completed')).toBe(false)
    expect(isExecutionRunning(null)).toBe(false)
  })
})
