import type { ExecutionLogLine, ExecutionLogStream } from './execution-log-buffer'

const CODE_FRAME_SOURCE_LINE_PATTERN = /^(?<indent>\s*)(?<marker>>)?\s*(?<lineNumber>\d+)\s*\|(?<content>.*)$/
const CODE_FRAME_CARET_LINE_PATTERN = /^(?<indent>\s*)(?<marker>>)?\s*\|(?<content>.*)$/
const EXECUTION_LOG_PREFIX_PATTERN =
  /^\[(?<timestamp>[^\]]+)\]\s+\[(?<stream>stdout|stderr|system)\](?:\s(?<message>.*))?$/
const ANSI_ESCAPE_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[ -/]*[@-~]`, 'g')
const PLAYWRIGHT_DETAIL_LINE_PATTERN = /^\s*\[[^\]]+\]\s+›\s+.+$/
const PLAYWRIGHT_FAILURE_SUMMARY_PATTERN = /^\s*\d+\s+(failed|did not run|interrupted|timed out)\b/i
const PLAYWRIGHT_WARNING_SUMMARY_PATTERN = /^\s*\d+\s+(flaky|skipped)\b/i
const PLAYWRIGHT_SUCCESS_SUMMARY_PATTERN = /^\s*\d+\s+passed\b/i

export type ExecutionLogTone = 'destructive' | 'success' | 'warning'

export interface ExecutionLogTextItem {
  type: 'text'
  line: ExecutionLogLine
  tone?: ExecutionLogTone
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
  let activePlaywrightTone: ExecutionLogTone | undefined

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

  for (const rawLine of logLines) {
    const line = normalizeExecutionLogLine(rawLine)
    const parsedCodeFrameLine = parseExecutionLogCodeFrameLine(line)
    const tone = getExecutionLogTone(line, activePlaywrightTone)

    if (tone.summaryTone) {
      activePlaywrightTone = tone.summaryTone
    } else if (!tone.isPlaywrightDetail) {
      activePlaywrightTone = undefined
    }

    if (!parsedCodeFrameLine) {
      flushCodeFrame()
      items.push({ type: 'text', line, tone: tone.itemTone })
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

export function normalizeExecutionLogLine(line: ExecutionLogLine): ExecutionLogLine {
  const prefixMatch = line.message.match(EXECUTION_LOG_PREFIX_PATTERN)

  if (!prefixMatch?.groups) {
    return line
  }

  return {
    ...line,
    message: prefixMatch.groups.message ?? '',
    stream: prefixMatch.groups.stream as ExecutionLogStream,
    timestamp: prefixMatch.groups.timestamp ?? line.timestamp,
  }
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

function getExecutionLogTone(
  line: Pick<ExecutionLogLine, 'message' | 'stream'>,
  activePlaywrightTone: ExecutionLogTone | undefined,
) {
  const normalizedMessage = stripAnsiControlSequences(line.message)
  const summaryTone = getPlaywrightSummaryTone(normalizedMessage)
  const isPlaywrightDetail =
    activePlaywrightTone !== undefined && PLAYWRIGHT_DETAIL_LINE_PATTERN.test(normalizedMessage)
  const itemTone = summaryTone ?? (isPlaywrightDetail ? activePlaywrightTone : undefined) ?? getStreamTone(line.stream)

  return {
    isPlaywrightDetail,
    itemTone,
    summaryTone,
  }
}

function stripAnsiControlSequences(message: string) {
  return message.replace(ANSI_ESCAPE_PATTERN, '')
}

function getPlaywrightSummaryTone(message: string): ExecutionLogTone | undefined {
  if (PLAYWRIGHT_FAILURE_SUMMARY_PATTERN.test(message)) {
    return 'destructive'
  }

  if (PLAYWRIGHT_WARNING_SUMMARY_PATTERN.test(message)) {
    return 'warning'
  }

  if (PLAYWRIGHT_SUCCESS_SUMMARY_PATTERN.test(message)) {
    return 'success'
  }

  return undefined
}

function getStreamTone(stream: ExecutionLogStream | undefined): ExecutionLogTone | undefined {
  if (stream === 'stderr') {
    return 'destructive'
  }

  return undefined
}
