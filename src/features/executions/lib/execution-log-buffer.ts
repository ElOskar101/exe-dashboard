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
}

export interface AppendLogChunkInput {
  state: ExecutionLogBufferState
  message: string
  sourceId: string
  stream?: ExecutionLogStream
  timestamp?: string
}

const splitLogChunk = (content: string) => {
  const normalizedContent = content.replace(/\r\n/g, '\n')
  const parts = normalizedContent.split('\n')
  const hasTrailingNewline = normalizedContent.endsWith('\n')
  const completedLines = hasTrailingNewline
    ? parts.slice(0, -1)
    : parts.slice(0, -1)
  const partial = hasTrailingNewline ? '' : (parts.at(-1) ?? '')

  return { completedLines, partial }
}

export const createExecutionLogBufferState = (): ExecutionLogBufferState => ({
  lines: [],
  partial: '',
})

export const createExecutionLogLinesFromHistory = (
  content: string,
): ExecutionLogBufferState => {
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
  const { completedLines, partial } = splitLogChunk(
    `${state.partial}${message}`,
  )
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
  }
}

export const shouldHandleExecutionEvent = (
  payloadExecutionId: string | undefined,
  executionId: string,
) => payloadExecutionId === executionId
