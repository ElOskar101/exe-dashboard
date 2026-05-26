import { describe, expect, it } from 'vitest'
import { buildExecutionLogRenderItems } from './execution-log-render'

describe('execution log render', () => {
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
})
