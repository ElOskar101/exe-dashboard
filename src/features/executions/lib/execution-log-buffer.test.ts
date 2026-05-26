import { describe, expect, it } from 'vitest'
import {
  appendExecutionLogChunk,
  createExecutionLogDisplayLines,
  createExecutionLogBufferState,
  createExecutionLogLinesFromHistory,
  hydrateExecutionLogBufferState,
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
    expect(firstState.partialStream).toBe('stdout')
    expect(firstState.partialTimestamp).toBe('2026-05-22T14:10:00.000Z')
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
    expect(nextState.partialStream).toBe('stdout')
    expect(nextState.partialTimestamp).toBe('2026-05-22T14:10:01.000Z')
  })

  it('hydrates history without dropping newer live chunks', () => {
    const seededState = createExecutionLogLinesFromHistory('first\nsec')
    const liveState = appendExecutionLogChunk({
      state: seededState,
      message: 'ond\nthird',
      sourceId: 'chunk',
      stream: 'stdout',
      timestamp: '2026-05-22T14:10:01.000Z',
    })

    const hydratedState = hydrateExecutionLogBufferState(liveState, 'first\nsecond\n')

    expect(hydratedState).toEqual(liveState)
  })

  it('hydrates the buffer when history is more complete than the current state', () => {
    const state = appendExecutionLogChunk({
      state: createExecutionLogLinesFromHistory('first\n'),
      message: 'second\n',
      sourceId: 'chunk',
      stream: 'stdout',
      timestamp: '2026-05-22T14:10:01.000Z',
    })

    const hydratedState = hydrateExecutionLogBufferState(state, 'first\nsecond\nthird\npar')

    expect(hydratedState.lines).toEqual([
      { id: 'history-0', message: 'first' },
      { id: 'history-1', message: 'second' },
      { id: 'history-2', message: 'third' },
    ])
    expect(hydratedState.partial).toBe('par')
  })

  it('appends later live chunks onto the hydrated state', () => {
    const initialState = createExecutionLogLinesFromHistory('first\n')
    const hydratedState = hydrateExecutionLogBufferState(initialState, 'first\nsecond\nthird\n')
    const nextState = appendExecutionLogChunk({
      state: hydratedState,
      message: 'fourth\n',
      sourceId: 'chunk',
      stream: 'stdout',
      timestamp: '2026-05-22T14:10:02.000Z',
    })

    expect(nextState.lines).toEqual([
      { id: 'history-0', message: 'first' },
      { id: 'history-1', message: 'second' },
      { id: 'history-2', message: 'third' },
      {
        id: 'chunk-3',
        message: 'fourth',
        stream: 'stdout',
        timestamp: '2026-05-22T14:10:02.000Z',
      },
    ])
    expect(nextState.partial).toBe('')
  })

  it('includes the active partial line in the display output', () => {
    const state = appendExecutionLogChunk({
      state: createExecutionLogLinesFromHistory('first\n'),
      message: 'second',
      sourceId: 'chunk',
      stream: 'stderr',
      timestamp: '2026-05-22T14:10:01.000Z',
    })

    expect(createExecutionLogDisplayLines(state)).toEqual([
      { id: 'history-0', message: 'first' },
      {
        id: 'partial-1',
        message: 'second',
        stream: 'stderr',
        timestamp: '2026-05-22T14:10:01.000Z',
      },
    ])
  })

  it('filters events by execution id', () => {
    expect(shouldHandleExecutionEvent('execution-1', 'execution-1')).toBe(true)
    expect(shouldHandleExecutionEvent('execution-2', 'execution-1')).toBe(false)
    expect(shouldHandleExecutionEvent(undefined, 'execution-1')).toBe(false)
  })
})
