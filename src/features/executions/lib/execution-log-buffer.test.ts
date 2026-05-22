import { describe, expect, it } from 'vitest'
import {
  appendExecutionLogChunk,
  createExecutionLogBufferState,
  createExecutionLogLinesFromHistory,
  shouldHandleExecutionEvent,
} from './execution-log-buffer'

describe('execution log buffer', () => {
  it('splits history into completed line items', () => {
    const state = createExecutionLogLinesFromHistory('first\nsecond\n')

    expect(state.lines).toEqual([
      { id: 'history-0', message: 'first' },
      { id: 'history-1', message: 'second' },
    ])
    expect(state.partial).toBe('')
  })

  it('buffers incomplete history lines', () => {
    const state = createExecutionLogLinesFromHistory('first\nsec')

    expect(state.lines).toEqual([{ id: 'history-0', message: 'first' }])
    expect(state.partial).toBe('sec')
  })

  it('appends chunks and keeps partial lines until complete', () => {
    const firstState = appendExecutionLogChunk({
      state: createExecutionLogBufferState(),
      message: 'run pn',
      sourceId: 'chunk',
      stream: 'stdout',
      timestamp: '2026-05-22T14:10:00.000Z',
    })
    const nextState = appendExecutionLogChunk({
      state: firstState,
      message: 'pm\nfinished\npartial',
      sourceId: 'chunk',
      stream: 'stdout',
      timestamp: '2026-05-22T14:10:01.000Z',
    })

    expect(firstState.lines).toEqual([])
    expect(firstState.partial).toBe('run pn')
    expect(nextState.lines).toEqual([
      {
        id: 'chunk-0',
        message: 'run pnpm',
        stream: 'stdout',
        timestamp: '2026-05-22T14:10:01.000Z',
      },
      {
        id: 'chunk-1',
        message: 'finished',
        stream: 'stdout',
        timestamp: '2026-05-22T14:10:01.000Z',
      },
    ])
    expect(nextState.partial).toBe('partial')
  })

  it('filters events by execution id', () => {
    expect(shouldHandleExecutionEvent('execution-1', 'execution-1')).toBe(true)
    expect(shouldHandleExecutionEvent('execution-2', 'execution-1')).toBe(false)
    expect(shouldHandleExecutionEvent(undefined, 'execution-1')).toBe(false)
  })
})
