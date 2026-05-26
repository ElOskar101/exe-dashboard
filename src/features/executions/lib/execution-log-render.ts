import type { ExecutionLogLine, ExecutionLogStream } from './execution-log-buffer'

const CODE_FRAME_SOURCE_LINE_PATTERN = /^(?<indent>\s*)(?<marker>>)?\s*(?<lineNumber>\d+)\s*\|(?<content>.*)$/
const CODE_FRAME_CARET_LINE_PATTERN = /^(?<indent>\s*)(?<marker>>)?\s*\|(?<content>.*)$/

export interface ExecutionLogTextItem {
  type: 'text'
  line: ExecutionLogLine
}

export interface ExecutionLogCodeFrameParsedLine {
  content: string
  id: string
  indent: string
  isFocused: boolean
  kind: 'caret' | 'source'
  lineNumber?: string
}

export interface ExecutionLogCodeFrameItem {
  type: 'code-frame'
  id: string
  lines: ExecutionLogCodeFrameParsedLine[]
  stream?: ExecutionLogStream
  timestamp?: string
}

export type ExecutionLogRenderItem = ExecutionLogCodeFrameItem | ExecutionLogTextItem

export function buildExecutionLogRenderItems(logLines: ExecutionLogLine[]): ExecutionLogRenderItem[] {
  const items: ExecutionLogRenderItem[] = []
  let currentCodeFrameLines: ExecutionLogCodeFrameParsedLine[] = []
  let currentCodeFrameStream: ExecutionLogStream | undefined
  let currentCodeFrameTimestamp: string | undefined
  let currentCodeFrameId: string | undefined

  const flushCodeFrame = () => {
    if (currentCodeFrameLines.length === 0 || !currentCodeFrameId) {
      currentCodeFrameLines = []
      currentCodeFrameStream = undefined
      currentCodeFrameTimestamp = undefined
      currentCodeFrameId = undefined
      return
    }

    items.push({
      type: 'code-frame',
      id: currentCodeFrameId,
      lines: currentCodeFrameLines,
      stream: currentCodeFrameStream,
      timestamp: currentCodeFrameTimestamp,
    })

    currentCodeFrameLines = []
    currentCodeFrameStream = undefined
    currentCodeFrameTimestamp = undefined
    currentCodeFrameId = undefined
  }

  for (const line of logLines) {
    const parsedCodeFrameLine = parseExecutionLogCodeFrameLine(line)

    if (!parsedCodeFrameLine) {
      flushCodeFrame()
      items.push({ type: 'text', line })
      continue
    }

    if (!currentCodeFrameId) {
      currentCodeFrameId = line.id
      currentCodeFrameStream = line.stream
      currentCodeFrameTimestamp = line.timestamp
    }

    currentCodeFrameLines.push(parsedCodeFrameLine)
  }

  flushCodeFrame()

  return items
}

export function parseExecutionLogCodeFrameLine(
  line: Pick<ExecutionLogLine, 'id' | 'message'>,
): ExecutionLogCodeFrameParsedLine | null {
  const sourceMatch = line.message.match(CODE_FRAME_SOURCE_LINE_PATTERN)

  if (sourceMatch?.groups) {
    return {
      content: sourceMatch.groups.content ?? '',
      id: line.id,
      indent: sourceMatch.groups.indent ?? '',
      isFocused: sourceMatch.groups.marker === '>',
      kind: 'source',
      lineNumber: sourceMatch.groups.lineNumber,
    }
  }

  const caretMatch = line.message.match(CODE_FRAME_CARET_LINE_PATTERN)

  if (caretMatch?.groups && (caretMatch.groups.content ?? '').trimStart().startsWith('^')) {
    return {
      content: caretMatch.groups.content ?? '',
      id: line.id,
      indent: caretMatch.groups.indent ?? '',
      isFocused: caretMatch.groups.marker === '>',
      kind: 'caret',
    }
  }

  return null
}
