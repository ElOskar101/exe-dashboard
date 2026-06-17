import { describe, expect, it } from 'vitest'
import type { Execution } from '../model/execution'
import {
  getScheduledExecutionCountdownLabel,
  getScheduledExecutionStartDate,
  isScheduledExecution,
  isWaitingScheduledExecution,
} from './scheduled-execution-display'

const createExecution = (overrides: Partial<Execution> = {}): Execution => ({
  _id: 'execution-123456789',
  createdBy: 'user-1',
  project: 'project-a',
  status: 'queued',
  client: 'client-1',
  clinic: 'clinic-1',
  execution: '2026-05-29',
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
  createdAt: '2026-05-29T12:00:00.000Z',
  updatedAt: '2026-05-29T12:00:00.000Z',
  jobId: 'job-1',
  playwrightExecutionId: 'playwright-1',
  ...overrides,
})

describe('scheduled execution display helpers', () => {
  it('recognizes scheduled executions only when scheduledAt is parseable', () => {
    expect(isScheduledExecution(createExecution({ scheduledAt: '2026-05-29T12:15:00.000Z' }))).toBe(true)
    expect(isScheduledExecution(createExecution({ scheduledAt: '' }))).toBe(false)
    expect(isScheduledExecution(createExecution({ scheduledAt: 'not-a-date' }))).toBe(false)
    expect(getScheduledExecutionStartDate(undefined)).toBeNull()
  })

  it('treats a scheduled execution as waiting until current time reaches scheduledAt', () => {
    const scheduledAt = '2026-05-29T12:15:00.000Z'

    expect(isWaitingScheduledExecution(scheduledAt, new Date('2026-05-29T12:14:59.999Z').getTime())).toBe(true)
    expect(isWaitingScheduledExecution(scheduledAt, new Date('2026-05-29T12:15:00.000Z').getTime())).toBe(false)
    expect(isWaitingScheduledExecution('not-a-date', new Date('2026-05-29T12:14:00.000Z').getTime())).toBe(false)
  })

  it('formats natural remaining time until the final minute', () => {
    expect(
      getScheduledExecutionCountdownLabel('2026-05-29T12:15:00.000Z', new Date('2026-05-29T12:13:59.000Z').getTime()),
    ).toBe(new Intl.RelativeTimeFormat(undefined, { numeric: 'always' }).format(1, 'minute'))
  })

  it('formats the final minute as a clock countdown', () => {
    expect(
      getScheduledExecutionCountdownLabel('2026-05-29T12:15:00.000Z', new Date('2026-05-29T12:14:00.000Z').getTime()),
    ).toBe('in 1:00')
    expect(
      getScheduledExecutionCountdownLabel('2026-05-29T12:15:00.000Z', new Date('2026-05-29T12:14:01.000Z').getTime()),
    ).toBe('in 0:59')
  })

  it('returns no countdown once the scheduled start time has elapsed', () => {
    expect(
      getScheduledExecutionCountdownLabel('2026-05-29T12:15:00.000Z', new Date('2026-05-29T12:15:00.000Z').getTime()),
    ).toBeNull()
  })
})
