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
  const completedLines = hasTrailingNewline ? parts.slice(0, -1) : parts.slice(0, -1)
  const partial = hasTrailingNewline ? '' : (parts.at(-1) ?? '')

  return { completedLines, partial }
}

const stringifyExecutionLogBufferState = (state: ExecutionLogBufferState) => {
  if (state.lines.length === 0) {
    return state.partial
  }

  return `${state.lines.map((line) => line.message).join('\n')}\n${state.partial}`
}

const mergeExecutionLogContents = (leftContent: string, rightContent: string) => {
  if (!leftContent) return rightContent
  if (!rightContent) return leftContent
  if (leftContent === rightContent) return leftContent
  if (leftContent.startsWith(rightContent)) return leftContent
  if (rightContent.startsWith(leftContent)) return rightContent

  const maxOverlap = Math.min(leftContent.length, rightContent.length)

  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    if (leftContent.endsWith(rightContent.slice(0, overlap))) {
      return `${leftContent}${rightContent.slice(overlap)}`
    }

    if (rightContent.endsWith(leftContent.slice(0, overlap))) {
      return `${rightContent}${leftContent.slice(overlap)}`
    }
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
