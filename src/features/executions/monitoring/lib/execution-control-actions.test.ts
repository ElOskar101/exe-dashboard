import { describe, expect, it } from 'vitest'
import { getExecutionControlAvailability } from './execution-control-actions'

const NOW = new Date('2026-05-23T00:00:00.000Z').getTime()

describe('execution control actions', () => {
  it('allows running executions to be paused and stopped', () => {
    expect(getExecutionControlAvailability('running', null, NOW)).toEqual({
      canPauseExecution: true,
      canResumeExecution: false,
      canStopExecution: true,
    })
    expect(getExecutionControlAvailability('process', null, NOW)).toEqual({
      canPauseExecution: true,
      canResumeExecution: false,
      canStopExecution: true,
    })
  })

  it('allows paused executions to be resumed and stopped', () => {
    expect(getExecutionControlAvailability('paused', null, NOW)).toEqual({
      canPauseExecution: false,
      canResumeExecution: true,
      canStopExecution: true,
    })
  })

  it('hides pause, resume, and stop for terminal executions', () => {
    expect(getExecutionControlAvailability('completed', null, NOW)).toEqual({
      canPauseExecution: false,
      canResumeExecution: false,
      canStopExecution: false,
    })
    expect(getExecutionControlAvailability('failed', null, NOW)).toEqual({
      canPauseExecution: false,
      canResumeExecution: false,
      canStopExecution: false,
    })
  })

  it('hides pause, resume, and stop for waiting scheduled executions', () => {
    expect(
      getExecutionControlAvailability(
        'running',
        '2026-05-23T00:05:00.000Z',
        new Date('2026-05-23T00:04:59.999Z').getTime(),
      ),
    ).toEqual({
      canPauseExecution: false,
      canResumeExecution: false,
      canStopExecution: false,
    })
  })
})
