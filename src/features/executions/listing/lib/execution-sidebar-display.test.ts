import { describe, expect, it } from 'vitest'
import type { Execution } from '@/features/executions/shared'
import { getExecutionDayLabel, getRelativeCreatedAt, groupExecutionsByProject } from './execution-sidebar-display'

const createExecution = (overrides: Partial<Execution> = {}): Execution => ({
  _id: 'execution-123456789',
  createdBy: 'user-1',
  playwrightProject: 'liberty',
  status: 'completed',
  client: 'client-1',
  clinic: 'clinic-1',
  execution: '2026-05-20',
  botName: 'Eligibility Runner',
  createdAt: '2026-05-20T14:00:00.000Z',
  updatedAt: '2026-05-20T14:10:00.000Z',
  jobId: 'job-1',
  playwrightExecutionId: 'report-1',
  ...overrides,
})

describe('execution sidebar display', () => {
  it('groups executions by project and sorts execution days newest first', () => {
    const groups = groupExecutionsByProject([
      createExecution({ _id: 'liberty-old', playwrightProject: 'liberty', execution: '2026-04-27' }),
      createExecution({ _id: 'chromium-new', playwrightProject: 'chromium', execution: '2026-05-29' }),
      createExecution({ _id: 'liberty-new', playwrightProject: 'liberty', execution: '2026-05-28' }),
      createExecution({ _id: 'chromium-old', playwrightProject: 'chromium', execution: '2026-05-21' }),
    ])

    expect(groups).toEqual([
      {
        project: 'chromium',
        executions: [
          expect.objectContaining({ _id: 'chromium-new' }),
          expect.objectContaining({ _id: 'chromium-old' }),
        ],
      },
      {
        project: 'liberty',
        executions: [expect.objectContaining({ _id: 'liberty-new' }), expect.objectContaining({ _id: 'liberty-old' })],
      },
    ])
  })

  it('uses only the execution day for the clickable row label', () => {
    expect(getExecutionDayLabel(createExecution({ execution: '2026-05-29' }))).toBe('2026-05-29')
    expect(getExecutionDayLabel(createExecution({ _id: 'execution-123456789', execution: '' }))).toBe('executio...')
  })

  it('formats the created-at value as relative time', () => {
    const currentTime = new Date('2026-05-29T12:00:00.000Z').getTime()

    expect(getRelativeCreatedAt('2026-05-29T11:45:00.000Z', currentTime)).toBe(
      new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(-15, 'minute'),
    )
    expect(getRelativeCreatedAt('invalid-date', new Date('2026-05-29T12:00:00.000Z').getTime())).toBeNull()
  })
})
