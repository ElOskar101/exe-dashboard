import type { SetStateAction } from 'react'
import type { ExecutionLogBufferState } from './execution-log-buffer'

export const resolveBufferUpdate = (
  currentBuffer: ExecutionLogBufferState,
  updater: SetStateAction<ExecutionLogBufferState>,
) => (typeof updater === 'function' ? updater(currentBuffer) : updater)
