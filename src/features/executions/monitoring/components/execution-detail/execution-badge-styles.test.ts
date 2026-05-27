import { describe, expect, it } from 'vitest'
import { getStatusBadgeClassName, getStatusBadgeVariant } from './execution-badge-styles'

describe('execution detail badge variants', () => {
  it('renders running executions with the blue badge override', () => {
    expect(getStatusBadgeClassName('running')).toBe('bg-blue-500 text-white dark:bg-blue-400 dark:text-slate-950')
    expect(getStatusBadgeClassName('RUNNING')).toBe('bg-blue-500 text-white dark:bg-blue-400 dark:text-slate-950')
    expect(getStatusBadgeClassName('process')).toBe('bg-blue-500 text-white dark:bg-blue-400 dark:text-slate-950')
  })

  it('renders cancelled executions with a gray badge override', () => {
    expect(getStatusBadgeVariant('cancelled')).toBe('secondary')
    expect(getStatusBadgeClassName('cancelled')).toBe('bg-slate-500 text-white dark:bg-slate-400 dark:text-slate-950')
  })

  it('keeps queued executions on the secondary variant', () => {
    expect(getStatusBadgeVariant('queued')).toBe('secondary')
    expect(getStatusBadgeClassName('queued')).toBeUndefined()
  })
})
