import type { SetStateAction } from 'react'
import { socket } from '@/lib/socket'
import type { ExecutionLogBufferState } from './execution-log-buffer'

export const joinExecutionRoom = (executionId: string) => {
  socket.emit('execution:join', { executionId })
}

export const leaveExecutionRoom = (executionId: string) => {
  socket.emit('execution:leave', { executionId })
}

export const resolveBufferUpdate = (
  currentBuffer: ExecutionLogBufferState,
  updater: SetStateAction<ExecutionLogBufferState>,
) => (typeof updater === 'function' ? updater(currentBuffer) : updater)
