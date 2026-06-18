import { useExecutionStatusUpdates } from '../hooks/use-execution-status-updates'

export function ExecutionStatusSubscriber() {
  useExecutionStatusUpdates()

  return null
}
