import type { ExecutionLogLine, ExecutionLogStream } from './execution-log-buffer'

const CODE_FRAME_SOURCE_LINE_PATTERN = /^(?<indent>\s*)(?<marker>>)?\s*(?<lineNumber>\d+)\s*\|(?<content>.*)$/
const CODE_FRAME_CARET_LINE_PATTERN = /^(?<indent>\s*)(?<marker>>)?\s*\|(?<content>.*)$/
const ANSI_ESCAPE_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[ -/]*[@-~]`, 'g')
const ANSI_OSC_ESCAPE_PATTERN = new RegExp(`${String.fromCharCode(27)}\\][^\\u0007]*(?:\\u0007|\\u001b\\\\)`)
const ANSI_SHORT_ESCAPE_PATTERN = new RegExp(`${String.fromCharCode(27)}[ -~]`, 'g')
const ANSI_SGR_ESCAPE_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')
const INVISIBLE_LOG_PREFIX_TOKEN_PATTERN = new RegExp(
  `^(?:${ANSI_ESCAPE_PATTERN.source}|${ANSI_OSC_ESCAPE_PATTERN.source}|${ANSI_SHORT_ESCAPE_PATTERN.source}|[\\u0000-\\u001a\\u001c-\\u001f\\u007f]+)`,
)
const LEADING_LOG_PREFIX_TOKEN_PATTERN = new RegExp(
  `^(?:${ANSI_ESCAPE_PATTERN.source}|${ANSI_OSC_ESCAPE_PATTERN.source}|${ANSI_SHORT_ESCAPE_PATTERN.source}|[\\u0000-\\u001a\\u001c-\\u001f\\u007f]+|\\s+)`,
)
const EXECUTION_LOG_METADATA_PATTERN =
  /^\[(?<timestamp>[^\]]+)\]\s+\[(?<stream>stdout|stderr|system)\](?:\s(?<message>.*))?$/i
const EXECUTION_LOG_METADATA_SEARCH_PATTERN = /\[(?<timestamp>[^\]]+)\]\s+\[(?<stream>stdout|stderr|system)\](?:\s+|$)/i
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
  let prefix = readExecutionLogPrefix(line)

  if (!prefix) {
    return line
  }

  let normalizedLine = {
    ...line,
    message: `${prefix.leadingContent}${prefix.message}`,
    stream: prefix.stream,
    timestamp: prefix.timestamp,
  }

  prefix = readLeadingExecutionLogPrefix(normalizedLine)

  while (prefix && executionLogMetadataMatches(normalizedLine, prefix)) {
    normalizedLine = {
      ...normalizedLine,
      message: `${prefix.leadingContent}${prefix.message}`,
      stream: prefix.stream,
      timestamp: prefix.timestamp,
    }
    prefix = readLeadingExecutionLogPrefix(normalizedLine)
  }

  return normalizedLine
}

function readExecutionLogPrefix(line: ExecutionLogLine) {
  const metadataPrefix = findExecutionLogMetadataPrefix(line)

  if (!metadataPrefix) {
    return null
  }

  return {
    leadingContent: metadataPrefix.leadingContent ?? line.message.slice(0, metadataPrefix.index),
    message: line.message.slice(metadataPrefix.endIndex),
    stream: metadataPrefix.stream,
    timestamp: metadataPrefix.timestamp,
  }
}

function readLeadingExecutionLogPrefix(line: ExecutionLogLine) {
  const metadataPrefix = readLeadingExecutionLogMetadataPrefix(line.message)

  if (!metadataPrefix) {
    return null
  }

  return {
    leadingContent: metadataPrefix.leadingContent ?? line.message.slice(0, metadataPrefix.index),
    message: line.message.slice(metadataPrefix.endIndex),
    stream: metadataPrefix.stream,
    timestamp: metadataPrefix.timestamp,
  }
}

function findExecutionLogMetadataPrefix(line: ExecutionLogLine) {
  const directPrefix = readLeadingExecutionLogMetadataPrefix(line.message)

  if (directPrefix) {
    return directPrefix
  }

  const metadataMatch = line.message.match(EXECUTION_LOG_METADATA_SEARCH_PATTERN)

  if (!metadataMatch?.groups || metadataMatch.index === undefined) {
    return null
  }

  const stream = normalizeExecutionLogStream(metadataMatch.groups.stream)

  if (!stream || !shouldStripEmbeddedExecutionLogMetadata(line, metadataMatch.groups.timestamp, stream)) {
    return null
  }

  return {
    index: metadataMatch.index,
    endIndex: metadataMatch.index + metadataMatch[0].length,
    stream,
    timestamp: metadataMatch.groups.timestamp,
  }
}

function readLeadingExecutionLogMetadataPrefix(message: string) {
  let remainingMessage = message
  let leadingContent = ''
  let tokenMatch = remainingMessage.match(LEADING_LOG_PREFIX_TOKEN_PATTERN)

  while (tokenMatch?.[0]) {
    leadingContent += tokenMatch[0]
    remainingMessage = remainingMessage.slice(tokenMatch[0].length)
    tokenMatch = remainingMessage.match(LEADING_LOG_PREFIX_TOKEN_PATTERN)
  }

  const metadataMatch = remainingMessage.match(EXECUTION_LOG_METADATA_PATTERN)

  if (metadataMatch?.groups) {
    const stream = normalizeExecutionLogStream(metadataMatch.groups.stream)

    if (!stream) {
      return null
    }

    return {
      index: leadingContent.length,
      endIndex: message.length - (metadataMatch.groups.message ?? '').length,
      stream,
      timestamp: metadataMatch.groups.timestamp,
    }
  }

  const visibleMessage = stripAnsiControlSequences(remainingMessage)
  const decoratedMetadataMatch = visibleMessage.match(EXECUTION_LOG_METADATA_PATTERN)

  if (!decoratedMetadataMatch?.groups || visibleMessage === remainingMessage) {
    return null
  }

  const stream = normalizeExecutionLogStream(decoratedMetadataMatch.groups.stream)

  if (!stream) {
    return null
  }

  const visiblePrefixLength = visibleMessage.length - (decoratedMetadataMatch.groups.message ?? '').length
  const rawPrefixLength = findRawIndexAfterVisibleContent(remainingMessage, visiblePrefixLength)

  if (rawPrefixLength === null) {
    return null
  }

  return {
    index: leadingContent.length,
    endIndex: leadingContent.length + rawPrefixLength,
    leadingContent: leadingContent.replace(ANSI_SGR_ESCAPE_PATTERN, ''),
    stream,
    timestamp: decoratedMetadataMatch.groups.timestamp,
  }
}

function findRawIndexAfterVisibleContent(content: string, visibleLength: number) {
  let rawIndex = 0
  let remainingVisibleLength = visibleLength

  while (rawIndex < content.length && remainingVisibleLength > 0) {
    const invisibleToken = content.slice(rawIndex).match(INVISIBLE_LOG_PREFIX_TOKEN_PATTERN)

    if (invisibleToken?.[0]) {
      rawIndex += invisibleToken[0].length
      continue
    }

    rawIndex += 1
    remainingVisibleLength -= 1
  }

  return remainingVisibleLength === 0 ? rawIndex : null
}

function shouldStripEmbeddedExecutionLogMetadata(
  line: Pick<ExecutionLogLine, 'stream' | 'timestamp'>,
  timestamp: string,
  stream: ExecutionLogStream,
) {
  return timestampsMatch(line.timestamp, timestamp) || line.stream === stream
}

function executionLogMetadataMatches(
  line: Pick<ExecutionLogLine, 'stream' | 'timestamp'>,
  prefix: Pick<ExecutionLogLine, 'stream' | 'timestamp'>,
) {
  return line.stream === prefix.stream && timestampsMatch(line.timestamp, prefix.timestamp ?? '')
}

function timestampsMatch(leftTimestamp: string | undefined, rightTimestamp: string) {
  if (!leftTimestamp) {
    return false
  }

  return leftTimestamp === rightTimestamp || Date.parse(leftTimestamp) === Date.parse(rightTimestamp)
}

function normalizeExecutionLogStream(stream: string | undefined): ExecutionLogStream | null {
  switch (stream?.toLowerCase()) {
    case 'stderr':
    case 'stdout':
    case 'system':
      return stream.toLowerCase() as ExecutionLogStream
    default:
      return null
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
  return message
    .replace(ANSI_OSC_ESCAPE_PATTERN, '')
    .replace(ANSI_ESCAPE_PATTERN, '')
    .replace(ANSI_SHORT_ESCAPE_PATTERN, '')
    .split('')
    .filter((character) => !isTerminalControlCharacter(character))
    .join('')
}

function isTerminalControlCharacter(character: string) {
  const characterCode = character.charCodeAt(0)

  return (
    characterCode === 0x7f ||
    (characterCode >= 0x00 && characterCode <= 0x1a) ||
    (characterCode >= 0x1c && characterCode <= 0x1f)
  )
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
