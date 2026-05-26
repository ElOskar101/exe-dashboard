import { describe, expect, it } from 'vitest'
import { buildExecutionLogRenderItems } from './execution-log-render'

describe('execution log render', () => {
  it('extracts timestamp and stream metadata from prefixed log lines', () => {
    const items = buildExecutionLogRenderItems([
      {
        id: 'line-1',
        message: '[2026-05-26T18:27:28.473Z] [system] Running: npx playwright test --project=liberty',
      },
    ])

    expect(items).toEqual([
      {
        type: 'text',
        line: {
          id: 'line-1',
          message: 'Running: npx playwright test --project=liberty',
          stream: 'system',
          timestamp: '2026-05-26T18:27:28.473Z',
        },
      },
    ])
  })

  it('applies destructive tones to failed Playwright summaries and their detail lines', () => {
    const items = buildExecutionLogRenderItems([
      {
        id: 'line-1',
        message: '\u001b[1A\u001b[2K1 failed',
      },
      {
        id: 'line-2',
        message:
          '    [liberty-setup] › tests/carriers/Liberty-Dental-Plan/setup/auth.setup.spec.ts:8:5 › liberty login setup',
      },
      {
        id: 'line-3',
        message: '1 did not run',
      },
    ])

    expect(items).toEqual([
      {
        type: 'text',
        line: {
          id: 'line-1',
          message: '\u001b[1A\u001b[2K1 failed',
        },
        tone: 'destructive',
      },
      {
        type: 'text',
        line: {
          id: 'line-2',
          message:
            '    [liberty-setup] › tests/carriers/Liberty-Dental-Plan/setup/auth.setup.spec.ts:8:5 › liberty login setup',
        },
        tone: 'destructive',
      },
      {
        type: 'text',
        line: {
          id: 'line-3',
          message: '1 did not run',
        },
        tone: 'destructive',
      },
    ])
  })

  it('applies warning and success tones to Playwright summaries', () => {
    const items = buildExecutionLogRenderItems([
      {
        id: 'line-1',
        message: '\u001b[1A\u001b[2K  1 flaky',
      },
      {
        id: 'line-2',
        message:
          '    [liberty] › tests/carriers/Liberty-Dental-Plan/main.spec.ts:19:9 › Liberty-Dental-Plan › Search 2 - Ana Lopez',
      },
      {
        id: 'line-3',
        message: '  2 passed (45.9s)',
      },
    ])

    expect(items).toEqual([
      {
        type: 'text',
        line: {
          id: 'line-1',
          message: '\u001b[1A\u001b[2K  1 flaky',
        },
        tone: 'warning',
      },
      {
        type: 'text',
        line: {
          id: 'line-2',
          message:
            '    [liberty] › tests/carriers/Liberty-Dental-Plan/main.spec.ts:19:9 › Liberty-Dental-Plan › Search 2 - Ana Lopez',
        },
        tone: 'warning',
      },
      {
        type: 'text',
        line: {
          id: 'line-3',
          message: '  2 passed (45.9s)',
        },
        tone: 'success',
      },
    ])
  })

  it('falls back to destructive tone for plain stderr lines', () => {
    const items = buildExecutionLogRenderItems([
      {
        id: 'line-1',
        message: 'Error: process exited unexpectedly',
        stream: 'stderr',
      },
    ])

    expect(items).toEqual([
      {
        type: 'text',
        line: {
          id: 'line-1',
          message: 'Error: process exited unexpectedly',
          stream: 'stderr',
        },
        tone: 'destructive',
      },
    ])
  })

  it('uses prefixed stream metadata when deciding line tone', () => {
    const items = buildExecutionLogRenderItems([
      {
        id: 'line-1',
        message: '[2026-05-26T18:27:28.473Z] [stderr] Error: process exited unexpectedly',
      },
    ])

    expect(items).toEqual([
      {
        type: 'text',
        line: {
          id: 'line-1',
          message: 'Error: process exited unexpectedly',
          stream: 'stderr',
          timestamp: '2026-05-26T18:27:28.473Z',
        },
        tone: 'destructive',
      },
    ])
  })

  it('removes prefixed metadata after leading ANSI controls', () => {
    const items = buildExecutionLogRenderItems([
      {
        id: 'line-1',
        message: '\u001b[1A\u001b[2K[2026-05-26T20:11:26.668Z] [stdout] 1 failed',
        stream: 'stdout',
        timestamp: '2026-05-26T20:11:26.668Z',
      },
    ])

    expect(items).toEqual([
      {
        type: 'text',
        line: {
          id: 'line-1',
          message: '\u001b[1A\u001b[2K1 failed',
          stream: 'stdout',
          timestamp: '2026-05-26T20:11:26.668Z',
        },
        tone: 'destructive',
      },
    ])
  })

  it('removes prefixed metadata after terminal control and spacing tokens', () => {
    const items = buildExecutionLogRenderItems([
      {
        id: 'line-1',
        message: '\r  \u001b7\u001b]0;playwright\u0007\u001b[1A\u001b[2K [2026-05-26T20:07:14.455Z] [stdout] 1 failed',
        stream: 'stdout',
        timestamp: '2026-05-26T20:07:14.455Z',
      },
    ])

    expect(items).toEqual([
      {
        type: 'text',
        line: {
          id: 'line-1',
          message: '\r  \u001b7\u001b]0;playwright\u0007\u001b[1A\u001b[2K 1 failed',
          stream: 'stdout',
          timestamp: '2026-05-26T20:07:14.455Z',
        },
        tone: 'destructive',
      },
    ])
  })

  it('removes repeated leading metadata wrappers from a single log line', () => {
    const items = buildExecutionLogRenderItems([
      {
        id: 'line-1',
        message: '[2026-05-26T20:07:14.455Z] [stdout] [2026-05-26T20:07:14.455Z] [stdout] completed',
      },
    ])

    expect(items).toEqual([
      {
        type: 'text',
        line: {
          id: 'line-1',
          message: 'completed',
          stream: 'stdout',
          timestamp: '2026-05-26T20:07:14.455Z',
        },
      },
    ])
  })

  it('preserves log payloads that start with different metadata', () => {
    const items = buildExecutionLogRenderItems([
      {
        id: 'line-1',
        message:
          '[2026-05-26T20:07:14.455Z] [stdout] [2026-05-26T20:08:14.455Z] [stderr] app emitted structured metadata',
      },
    ])

    expect(items).toEqual([
      {
        type: 'text',
        line: {
          id: 'line-1',
          message: '[2026-05-26T20:08:14.455Z] [stderr] app emitted structured metadata',
          stream: 'stdout',
          timestamp: '2026-05-26T20:07:14.455Z',
        },
      },
    ])
  })

  it('keeps metadata-like content inside a normalized history message', () => {
    const items = buildExecutionLogRenderItems([
      {
        id: 'line-1',
        message: '[2026-05-26T20:07:14.455Z] [stdout] debug payload [2026-05-26T20:07:14.455Z] [stdout] should stay',
      },
    ])

    expect(items).toEqual([
      {
        type: 'text',
        line: {
          id: 'line-1',
          message: 'debug payload [2026-05-26T20:07:14.455Z] [stdout] should stay',
          stream: 'stdout',
          timestamp: '2026-05-26T20:07:14.455Z',
        },
      },
    ])
  })

  it('removes metadata wrappers decorated with ANSI styles', () => {
    const items = buildExecutionLogRenderItems([
      {
        id: 'line-1',
        message: '\u001b[90m[2026-05-26T20:07:14.455Z]\u001b[0m \u001b[36m[stdout]\u001b[0m completed',
        stream: 'stdout',
        timestamp: '2026-05-26T20:07:14.455Z',
      },
    ])

    expect(items).toEqual([
      {
        type: 'text',
        line: {
          id: 'line-1',
          message: 'completed',
          stream: 'stdout',
          timestamp: '2026-05-26T20:07:14.455Z',
        },
      },
    ])
  })

  it('removes embedded metadata when it duplicates the line metadata', () => {
    const items = buildExecutionLogRenderItems([
      {
        id: 'line-1',
        message: 'unrecognized terminal prefix [2026-05-26T20:07:14.455Z] [stdout] 1 failed',
        stream: 'stdout',
        timestamp: '2026-05-26T20:07:14.455Z',
      },
      {
        id: 'line-2',
        message: 'debug payload [2026-05-26T20:07:14.455Z] [stdout] should stay',
        stream: 'stderr',
        timestamp: '2026-05-26T20:08:14.455Z',
      },
    ])

    expect(items).toEqual([
      {
        type: 'text',
        line: {
          id: 'line-1',
          message: 'unrecognized terminal prefix 1 failed',
          stream: 'stdout',
          timestamp: '2026-05-26T20:07:14.455Z',
        },
      },
      {
        type: 'text',
        line: {
          id: 'line-2',
          message: 'debug payload [2026-05-26T20:07:14.455Z] [stdout] should stay',
          stream: 'stderr',
          timestamp: '2026-05-26T20:08:14.455Z',
        },
        tone: 'destructive',
      },
    ])
  })
})
