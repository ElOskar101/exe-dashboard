import { useCallback, useLayoutEffect, useMemo, useRef, useState, type SetStateAction } from 'react'
import { socket } from '@/lib/socket'
import { useMountEffect } from '@/hooks/use-mount-effect'
import {
  appendExecutionLogChunk,
  type ExecutionLogBufferState,
  createExecutionLogLinesFromHistory,
  hydrateExecutionLogBufferState,
  shouldHandleExecutionEvent,
  type ExecutionLogStream,
} from '../lib/execution-log-buffer'
import { normalizeExecutionStatus } from '../lib/execution-display'
import type { ExecutionStatus } from '../model/execution.interface'

type ConnectionState = 'connecting' | 'connected' | 'disconnected'

interface ExecutionLogsHistoryPayload {
  executionId: string
  content: string
}

interface ExecutionLogPayload {
  executionId: string
  jobId?: string
  stream: ExecutionLogStream
  message: string
  timestamp: string
}

interface ExecutionStatusPayload {
  executionId: string
  jobId?: string
  status: string
  pid?: number
  exitCode?: number | null
  error?: string | null
  timestamp: string
}

const joinExecutionRoom = (executionId: string) => {
  socket.emit('execution:join', { executionId })
}

const leaveExecutionRoom = (executionId: string) => {
  socket.emit('execution:leave', { executionId })
}

interface UseExecutionRealtimeLogsOptions {
  historyContent?: string
}

const resolveBufferUpdate = (
  currentBuffer: ExecutionLogBufferState,
  updater: SetStateAction<ExecutionLogBufferState>,
) => (typeof updater === 'function' ? updater(currentBuffer) : updater)

export const useExecutionRealtimeLogs = (executionId: string, options: UseExecutionRealtimeLogsOptions = {}) => {
  const { historyContent = '' } = options
  const [buffer, setBuffer] = useState(() => createExecutionLogLinesFromHistory(historyContent))
  const [status, setStatus] = useState<ExecutionStatus | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
  const hydratedBuffer = useMemo(() => hydrateExecutionLogBufferState(buffer, historyContent), [buffer, historyContent])
  const bufferRef = useRef(hydratedBuffer)

  useLayoutEffect(() => {
    bufferRef.current = hydratedBuffer
  }, [hydratedBuffer])

  const updateBuffer = useCallback((updater: SetStateAction<ExecutionLogBufferState>) => {
    const nextBuffer = resolveBufferUpdate(bufferRef.current, updater)

    bufferRef.current = nextBuffer
    setBuffer(nextBuffer)
  }, [])

  useMountEffect(() => {
    const handleConnect = () => {
      setConnectionState('connected')
      joinExecutionRoom(executionId)
    }

    const handleDisconnect = () => {
      setConnectionState('disconnected')
    }

    const handleHistory = (payload: ExecutionLogsHistoryPayload) => {
      if (!shouldHandleExecutionEvent(payload.executionId, executionId)) return

      updateBuffer((previousBuffer) => hydrateExecutionLogBufferState(previousBuffer, payload.content))
    }

    const handleLog = (payload: ExecutionLogPayload) => {
      if (!shouldHandleExecutionEvent(payload.executionId, executionId)) return

      updateBuffer((previousBuffer) =>
        appendExecutionLogChunk({
          state: previousBuffer,
          message: payload.message,
          sourceId: `${payload.timestamp}-${payload.stream}`,
          stream: payload.stream,
          timestamp: payload.timestamp,
        }),
      )
    }

    const handleStatus = (payload: ExecutionStatusPayload) => {
      if (!shouldHandleExecutionEvent(payload.executionId, executionId)) return

      setStatus(normalizeExecutionStatus(payload.status))
    }

    socket.auth = {
      token: localStorage.getItem('token'),
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('execution:logs:history', handleHistory)
    socket.on('logs', handleLog)
    socket.on('status', handleStatus)

    if (socket.connected) {
      handleConnect()
    } else {
      socket.connect()
    }

    return () => {
      leaveExecutionRoom(executionId)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('execution:logs:history', handleHistory)
      socket.off('logs', handleLog)
      socket.off('status', handleStatus)
    }
  })

  return {
    connectionState,
    lines: hydratedBuffer.lines,
    partial: hydratedBuffer.partial,
    partialStream: hydratedBuffer.partialStream,
    partialTimestamp: hydratedBuffer.partialTimestamp,
    status,
  }
}
