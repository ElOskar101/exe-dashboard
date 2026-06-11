import { describe, expect, it } from 'vitest'
import { getStatusBadgeClassName } from './execution-detail-styles'

describe('execution detail status styles', () => {
  it('maps execution statuses to badge text colors', () => {
    expect(getStatusBadgeClassName('completed')).toBe('text-success')
    expect(getStatusBadgeClassName('running')).toBe('text-blue-600 dark:text-blue-400')
    expect(getStatusBadgeClassName('process')).toBe('text-blue-600 dark:text-blue-400')
    expect(getStatusBadgeClassName('paused')).toBe('text-amber-600 dark:text-amber-400')
    expect(getStatusBadgeClassName('failed')).toBe('text-destructive')
    expect(getStatusBadgeClassName('cancelled')).toBe('text-slate-600 dark:text-slate-400')
    expect(getStatusBadgeClassName('queued')).toBe('text-muted-foreground')
    expect(getStatusBadgeClassName('something-new')).toBe('text-foreground/70')
  })
})
