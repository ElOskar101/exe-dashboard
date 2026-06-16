import { describe, expect, it } from 'vitest'

import { type Execution } from '@/features/executions'

import { TOP_DIMENSION_LIMIT, getTopDimension } from './home-stats'

const createExecution = (execution: Partial<Execution>): Execution => ({
  _id: 'execution-1',
  createdBy: 'user-1',
  project: 'project-a',
  status: 'queued',
  client: 'Acme',
  clinic: 'Downtown',
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
  jobId: 'job-1',
  playwrightExecutionId: 'playwright-1',
  ...execution,
})

const noValueLabel = 'None'

describe('getTopDimension', () => {
  it('returns an empty array when there are no executions', () => {
    expect(getTopDimension([], (execution) => execution.client, noValueLabel)).toEqual([])
  })

  it('groups executions by the picked dimension and counts by status', () => {
    const executions = [
      createExecution({ _id: '1', client: 'Acme', status: 'completed' }),
      createExecution({ _id: '2', client: 'Acme', status: 'failed' }),
      createExecution({ _id: '3', client: 'Beta', status: 'completed' }),
    ]

    const result = getTopDimension(executions, (execution) => execution.client, noValueLabel)

    expect(result).toEqual([
      { name: 'Acme', total: 2, completed: 1, failed: 1 },
      { name: 'Beta', total: 1, completed: 1 },
    ])
  })

  it('sorts by total desc and breaks ties by name asc', () => {
    const executions = [
      createExecution({ _id: '1', client: 'Zeta', status: 'completed' }),
      createExecution({ _id: '2', client: 'Acme', status: 'completed' }),
      createExecution({ _id: '3', client: 'Beta', status: 'completed' }),
    ]

    const result = getTopDimension(executions, (execution) => execution.client, noValueLabel)

    expect(result.map((entry) => entry.name)).toEqual(['Acme', 'Beta', 'Zeta'])
  })

  it('trims whitespace and falls back to the no-value label', () => {
    const executions = [
      createExecution({ _id: '1', client: '  ', status: 'completed' }),
      createExecution({ _id: '2', client: 'Acme', status: 'running' }),
    ]

    const result = getTopDimension(executions, (execution) => execution.client, noValueLabel)

    expect(result).toEqual([
      { name: 'Acme', total: 1, running: 1 },
      { name: noValueLabel, total: 1, completed: 1 },
    ])
  })

  it('limits results to TOP_DIMENSION_LIMIT', () => {
    const executions = Array.from({ length: TOP_DIMENSION_LIMIT + 3 }, (_, index) =>
      createExecution({ _id: String(index), client: `Client ${index}`, status: 'completed' }),
    )

    const result = getTopDimension(executions, (execution) => execution.client, noValueLabel)

    expect(result).toHaveLength(TOP_DIMENSION_LIMIT)
  })

  it('normalizes legacy status values via normalizeExecutionStatus', () => {
    const executions = [createExecution({ _id: '1', client: 'Acme', status: 'process' })]

    const result = getTopDimension(executions, (execution) => execution.client, noValueLabel)

    expect(result).toEqual([{ name: 'Acme', total: 1, running: 1 }])
  })
})
