export type ExecutionLogStream = 'stdout' | 'stderr' | 'system'

export interface ExecutionLogLine {
  id: string
  message: string
  stream?: ExecutionLogStream
  timestamp?: string
}

export interface ExecutionLogBufferState {
  lines: ExecutionLogLine[]
  partial: string
  partialStream?: ExecutionLogStream
  partialTimestamp?: string
}

export interface AppendLogChunkInput {
  state: ExecutionLogBufferState
  message: string
  sourceId: string
  stream?: ExecutionLogStream
  timestamp?: string
}

const normalizeLogContent = (content: string) => content.replace(/\r\n/g, '\n')

const splitLogChunk = (content: string) => {
  const normalizedContent = normalizeLogContent(content)
  const parts = normalizedContent.split('\n')
  const hasTrailingNewline = normalizedContent.endsWith('\n')
  const completedLines = parts.slice(0, -1)
  const partial = hasTrailingNewline ? '' : (parts.at(-1) ?? '')

  return { completedLines, partial }
}

const stringifyExecutionLogBufferState = (state: ExecutionLogBufferState) => {
  if (state.lines.length === 0) {
    return state.partial
  }

  return `${state.lines.map((line) => line.message).join('\n')}\n${state.partial}`
}

const OVERLAP_SEPARATOR_CANDIDATES = ['\u0000', '\u0001', '\uFDD0', '\uFFFF']

const buildPrefixTable = (content: string) => {
  const prefixTable = Array<number>(content.length).fill(0)

  for (let index = 1; index < content.length; index += 1) {
    let matchedLength = prefixTable[index - 1] ?? 0

    while (matchedLength > 0 && content[index] !== content[matchedLength]) {
      matchedLength = prefixTable[matchedLength - 1] ?? 0
    }

    if (content[index] === content[matchedLength]) {
      matchedLength += 1
    }

    prefixTable[index] = matchedLength
  }

  return prefixTable
}

const findExecutionLogContentOverlap = (leftContent: string, rightContent: string) => {
  const separator = OVERLAP_SEPARATOR_CANDIDATES.find(
    (candidate) => !leftContent.includes(candidate) && !rightContent.includes(candidate),
  )

  if (!separator) {
    return 0
  }

  const prefixTable = buildPrefixTable(`${rightContent}${separator}${leftContent}`)

  return Math.min(prefixTable.at(-1) ?? 0, leftContent.length, rightContent.length)
}

const mergeExecutionLogContents = (leftContent: string, rightContent: string) => {
  if (!leftContent) return rightContent
  if (!rightContent) return leftContent
  if (leftContent === rightContent) return leftContent
  if (leftContent.startsWith(rightContent)) return leftContent
  if (rightContent.startsWith(leftContent)) return rightContent

  const leftToRightOverlap = findExecutionLogContentOverlap(leftContent, rightContent)
  const rightToLeftOverlap = findExecutionLogContentOverlap(rightContent, leftContent)

  if (leftToRightOverlap >= rightToLeftOverlap && leftToRightOverlap > 0) {
    return `${leftContent}${rightContent.slice(leftToRightOverlap)}`
  }

  if (rightToLeftOverlap > 0) {
    return `${rightContent}${leftContent.slice(rightToLeftOverlap)}`
  }

  return rightContent.length >= leftContent.length ? rightContent : leftContent
}

export const createExecutionLogBufferState = (): ExecutionLogBufferState => ({
  lines: [],
  partial: '',
})

export const createExecutionLogLinesFromHistory = (content: string): ExecutionLogBufferState => {
  const { completedLines, partial } = splitLogChunk(content)

  return {
    lines: completedLines.map((message, index) => ({
      id: `history-${index}`,
      message,
    })),
    partial,
  }
}

export const appendExecutionLogChunk = ({
  state,
  message,
  sourceId,
  stream,
  timestamp,
}: AppendLogChunkInput): ExecutionLogBufferState => {
  const { completedLines, partial } = splitLogChunk(`${state.partial}${message}`)
  const nextLineStart = state.lines.length

  return {
    lines: [
      ...state.lines,
      ...completedLines.map((line, index) => ({
        id: `${sourceId}-${nextLineStart + index}`,
        message: line,
        stream,
        timestamp,
      })),
    ],
    partial,
    ...(partial
      ? {
          partialStream: stream,
          partialTimestamp: timestamp,
        }
      : {}),
  }
}

export const hydrateExecutionLogBufferState = (
  state: ExecutionLogBufferState,
  content: string,
): ExecutionLogBufferState => {
  const normalizedHistoryContent = normalizeLogContent(content)

  if (!normalizedHistoryContent) {
    return state
  }

  const currentContent = stringifyExecutionLogBufferState(state)

  if (!currentContent) {
    return createExecutionLogLinesFromHistory(normalizedHistoryContent)
  }

  if (currentContent.startsWith(normalizedHistoryContent)) {
    return state
  }

  if (normalizedHistoryContent.startsWith(currentContent)) {
    return createExecutionLogLinesFromHistory(normalizedHistoryContent)
  }

  return createExecutionLogLinesFromHistory(mergeExecutionLogContents(normalizedHistoryContent, currentContent))
}

export const createExecutionLogDisplayLines = (state: ExecutionLogBufferState): ExecutionLogLine[] => {
  if (!state.partial) {
    return state.lines
  }

  return [
    ...state.lines,
    {
      id: `partial-${state.lines.length}`,
      message: state.partial,
      stream: state.partialStream,
      timestamp: state.partialTimestamp,
    },
  ]
}

export const shouldHandleExecutionEvent = (payloadExecutionId: string | undefined, executionId: string) =>
  payloadExecutionId === executionId
