import type { Dispatch } from 'react'
import type { Socket } from 'socket.io-client'
import { getExecutionSocket, getSocketAuth } from '@/lib/socket'

export type ExecutionRealtimeConnectionState = 'connecting' | 'connected' | 'disconnected'

export interface ExecutionLogsHistoryPayload {
  executionId: string
  content: string
}

export type ExecutionLogStream = 'stdout' | 'stderr' | 'system'

export interface ExecutionLogPayload {
  executionId: string
  jobId?: string
  stream: ExecutionLogStream
  message: string
  timestamp: string
}

export interface ExecutionStatusPayload {
  executionId: string
  jobId?: string
  status: string
  pid?: number
  exitCode?: number | null
  error?: string | null
  timestamp?: string
}

interface ExecutionRealtimeSubscriptionOptions {
  handleConnect?: () => void
  cleanup?: () => void
  register: () => void
  socket: Socket
  socketKey: string
  unregister: () => void
}

const executionRealtimeConsumerCounts = new Map<string, number>()

const syncExecutionRealtimeAuth = (socket: Socket) => {
  socket.auth = getSocketAuth()
}

const acquireExecutionRealtimeConnection = (socket: Socket, socketKey: string) => {
  const consumerCount = executionRealtimeConsumerCounts.get(socketKey) ?? 0

  executionRealtimeConsumerCounts.set(socketKey, consumerCount + 1)
  syncExecutionRealtimeAuth(socket)

  if (!socket.connected && !socket.active) {
    socket.connect()
  }
}

const releaseExecutionRealtimeConnection = (socket: Socket, socketKey: string) => {
  const consumerCount = Math.max((executionRealtimeConsumerCounts.get(socketKey) ?? 0) - 1, 0)

  executionRealtimeConsumerCounts.set(socketKey, consumerCount)

  if (consumerCount === 0 && (socket.connected || socket.active)) {
    socket.disconnect()
  }
}

const createExecutionRealtimeSubscription = ({
  handleConnect,
  cleanup,
  register,
  socket,
  socketKey,
  unregister,
}: ExecutionRealtimeSubscriptionOptions) => {
  register()
  acquireExecutionRealtimeConnection(socket, socketKey)

  if (socket.connected) {
    handleConnect?.()
  }

  return () => {
    cleanup?.()
    unregister()
    releaseExecutionRealtimeConnection(socket, socketKey)
  }
}

export const subscribeToExecutionStatus = (options: {
  onConnect?: () => void
  onStatus: Dispatch<ExecutionStatusPayload>
  socketUrl: string
}) => {
  const socket = getExecutionSocket(options.socketUrl)
  const socketKey = options.socketUrl

  return createExecutionRealtimeSubscription({
    handleConnect: options.onConnect,
    socket,
    socketKey,
    register: () => {
      if (options.onConnect) {
        socket.on('connect', options.onConnect)
      }

      socket.on('status', options.onStatus)
    },
    unregister: () => {
      if (options.onConnect) {
        socket.off('connect', options.onConnect)
      }

      socket.off('status', options.onStatus)
    },
  })
}

export const subscribeToExecutionRoom = (options: {
  executionId: string
  onConnect?: () => void
  onDisconnect?: () => void
  onHistory?: Dispatch<ExecutionLogsHistoryPayload>
  onLog?: Dispatch<ExecutionLogPayload>
  onStatus?: Dispatch<ExecutionStatusPayload>
  socketUrl: string
}) => {
  const socket = getExecutionSocket(options.socketUrl)
  const socketKey = options.socketUrl

  const joinExecutionRoom = () => {
    socket.emit('execution:join', { executionId: options.executionId })
    options.onConnect?.()
  }

  const leaveExecutionRoom = () => {
    socket.emit('execution:leave', { executionId: options.executionId })
  }

  const handleHistory = (payload: ExecutionLogsHistoryPayload) => {
    if (payload.executionId !== options.executionId) return

    options.onHistory?.(payload)
  }

  const handleLog = (payload: ExecutionLogPayload) => {
    if (payload.executionId !== options.executionId) return

    options.onLog?.(payload)
  }

  const handleStatus = (payload: ExecutionStatusPayload) => {
    if (payload.executionId !== options.executionId) return

    options.onStatus?.(payload)
  }

  return createExecutionRealtimeSubscription({
    handleConnect: joinExecutionRoom,
    cleanup: leaveExecutionRoom,
    socket,
    socketKey,
    register: () => {
      socket.on('connect', joinExecutionRoom)

      if (options.onDisconnect) {
        socket.on('disconnect', options.onDisconnect)
      }

      socket.on('execution:logs:history', handleHistory)
      socket.on('logs', handleLog)

      if (options.onStatus) {
        socket.on('status', handleStatus)
      }
    },
    unregister: () => {
      socket.off('connect', joinExecutionRoom)

      if (options.onDisconnect) {
        socket.off('disconnect', options.onDisconnect)
      }

      socket.off('execution:logs:history', handleHistory)
      socket.off('logs', handleLog)

      if (options.onStatus) {
        socket.off('status', handleStatus)
      }
    },
  })
}
