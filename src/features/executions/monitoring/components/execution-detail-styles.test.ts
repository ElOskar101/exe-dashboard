import { describe, expect, it } from 'vitest'
import { getStatusTextClassName } from './execution-detail-styles'

describe('execution detail status styles', () => {
  it('maps execution statuses to text colors', () => {
    expect(getStatusTextClassName('completed')).toBe('text-success')
    expect(getStatusTextClassName('running')).toBe('text-blue-600 dark:text-blue-400')
    expect(getStatusTextClassName('process')).toBe('text-blue-600 dark:text-blue-400')
    expect(getStatusTextClassName('paused')).toBe('text-amber-600 dark:text-amber-400')
    expect(getStatusTextClassName('failed')).toBe('text-destructive')
    expect(getStatusTextClassName('cancelled')).toBe('text-slate-600 dark:text-slate-400')
    expect(getStatusTextClassName('queued')).toBe('text-muted-foreground')
    expect(getStatusTextClassName('something-new')).toBe('text-foreground/70')
  })
})
