import { describe, expect, it } from 'vitest'
import { formatExecutionDate, formatExecutionDateTime } from './format-execution-date-time'

describe('execution date formatting', () => {
  it('formats a brief execution date without time', () => {
    expect(formatExecutionDate('2026-05-08T14:00:00.000Z')).toBe('May 8')
  })

  it('keeps the fallback value for invalid dates', () => {
    expect(formatExecutionDate('not-a-date')).toBe('not-a-date')
    expect(formatExecutionDateTime('not-a-date')).toBe('not-a-date')
  })
})
