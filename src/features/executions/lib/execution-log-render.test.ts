import { describe, expect, it } from 'vitest'
import { buildExecutionLogRenderItems, parseExecutionLogCodeFrameLine } from './execution-log-render'

describe('execution log render', () => {
  it('parses playwright source code frame lines', () => {
    expect(
      parseExecutionLogCodeFrameLine({
        id: 'line-1',
        message: "> 35 | expect(loginResult, 'message').toBe('success');",
      }),
    ).toEqual({
      content: "expect(loginResult, 'message').toBe('success');",
      id: 'line-1',
      indent: '',
      isFocused: true,
      kind: 'source',
      lineNumber: '35',
    })
  })

  it('parses caret indicator lines', () => {
    expect(
      parseExecutionLogCodeFrameLine({
        id: 'line-2',
        message: '   | ^',
      }),
    ).toEqual({
      content: '^',
      id: 'line-2',
      indent: '   ',
      isFocused: false,
      kind: 'caret',
    })
  })

  it('groups consecutive code frame lines into a single render item', () => {
    const items = buildExecutionLogRenderItems([
      { id: 'log-1', message: 'before snippet' },
      { id: 'log-2', message: '34 | console.info(`hello`);' },
      { id: 'log-3', message: "> 35 | expect(result).toBe('ok');", stream: 'stderr' },
      { id: 'log-4', message: '   | ^', stream: 'stderr', timestamp: '2026-05-26T20:00:00.000Z' },
      { id: 'log-5', message: 'after snippet' },
    ])

    expect(items).toEqual([
      {
        line: { id: 'log-1', message: 'before snippet' },
        type: 'text',
      },
      {
        id: 'log-2',
        lines: [
          {
            content: 'console.info(`hello`);',
            id: 'log-2',
            indent: '',
            isFocused: false,
            kind: 'source',
            lineNumber: '34',
          },
          {
            content: "expect(result).toBe('ok');",
            id: 'log-3',
            indent: '',
            isFocused: true,
            kind: 'source',
            lineNumber: '35',
          },
          {
            content: '^',
            id: 'log-4',
            indent: '   ',
            isFocused: false,
            kind: 'caret',
          },
        ],
        stream: undefined,
        timestamp: undefined,
        type: 'code-frame',
      },
      {
        line: { id: 'log-5', message: 'after snippet' },
        type: 'text',
      },
    ])
  })
})
