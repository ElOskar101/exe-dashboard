import { describe, expect, it } from 'vitest'
import { shouldInvalidateExecutionsOnConnect } from '../lib/execution-status-updates'

describe('shouldInvalidateExecutionsOnConnect', () => {
  it('skips the initial invalidation when the list was not cached yet', () => {
    expect(
      shouldInvalidateExecutionsOnConnect({
        hadCachedExecutionsAtMount: false,
        isInitialConnect: true,
      }),
    ).toBe(false)
  })

  it('keeps the initial invalidation when cached executions already existed', () => {
    expect(
      shouldInvalidateExecutionsOnConnect({
        hadCachedExecutionsAtMount: true,
        isInitialConnect: true,
      }),
    ).toBe(true)
  })

  it('always invalidates on later reconnects', () => {
    expect(
      shouldInvalidateExecutionsOnConnect({
        hadCachedExecutionsAtMount: false,
        isInitialConnect: false,
      }),
    ).toBe(true)
  })
})
