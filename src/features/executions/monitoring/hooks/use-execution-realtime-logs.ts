import { useCallback, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useMountEffect } from '@/hooks/use-mount-effect'
import {
  normalizeExecutionStatus,
  subscribeToExecutionRoom,
  type ExecutionLogPayload,
  type ExecutionLogsHistoryPayload,
  type ExecutionRealtimeConnectionState,
  type ExecutionStatus,
  type ExecutionStatusPayload,
  useExecutionTarget,
} from '@/features/executions/shared'
import {
  appendExecutionLogChunk,
  type ExecutionLogBufferState,
  createExecutionLogLinesFromHistory,
  hydrateExecutionLogBufferState,
} from '../lib/execution-log-buffer'
import { resolveBufferUpdate } from '../lib/execution-realtime-log-utils'

interface UseExecutionRealtimeLogsOptions {
  historyContent?: string
  onStatus?: Dispatch<ExecutionStatus>
}

export const useExecutionRealtimeLogs = (executionId: string, options: UseExecutionRealtimeLogsOptions = {}) => {
  const { historyContent = '' } = options
  const { target } = useExecutionTarget()
  const [buffer, setBuffer] = useState(() => createExecutionLogLinesFromHistory(historyContent))
  const [status, setStatus] = useState<ExecutionStatus | null>(null)
  const [connectionState, setConnectionState] = useState<ExecutionRealtimeConnectionState>('connecting')
  const appliedHistoryContentRef = useRef(historyContent)

  const updateBuffer = useCallback((updater: SetStateAction<ExecutionLogBufferState>) => {
    setBuffer((currentBuffer) => {
      const nextBuffer = resolveBufferUpdate(currentBuffer, updater)

      return nextBuffer
    })
  }, [])

  useLayoutEffect(() => {
    if (historyContent === appliedHistoryContentRef.current) {
      return
    }

    appliedHistoryContentRef.current = historyContent
    updateBuffer((currentBuffer) => hydrateExecutionLogBufferState(currentBuffer, historyContent))
  }, [historyContent, updateBuffer])

  useMountEffect(() => {
    const unsubscribe = subscribeToExecutionRoom({
      executionId,
      onConnect: () => {
        setConnectionState('connected')
      },
      onDisconnect: () => {
        setConnectionState('disconnected')
      },
      onHistory: (payload: ExecutionLogsHistoryPayload) => {
        appliedHistoryContentRef.current = payload.content
        updateBuffer((previousBuffer) => hydrateExecutionLogBufferState(previousBuffer, payload.content))
      },
      onLog: (payload: ExecutionLogPayload) => {
        updateBuffer((previousBuffer) =>
          appendExecutionLogChunk({
            state: previousBuffer,
            message: payload.message,
            sourceId: `${payload.timestamp}-${payload.stream}`,
            stream: payload.stream,
            timestamp: payload.timestamp,
          }),
        )
      },
      onStatus: (payload: ExecutionStatusPayload) => {
        const nextStatus = normalizeExecutionStatus(payload.status)

        setStatus(nextStatus)
        options.onStatus?.(nextStatus)
      },
      socketUrl: target.requestTarget?.socketUrl,
    })

    return () => {
      unsubscribe()
    }
  })

  return {
    connectionState,
    lines: buffer.lines,
    partial: buffer.partial,
    partialStream: buffer.partialStream,
    partialTimestamp: buffer.partialTimestamp,
    status,
  }
}
