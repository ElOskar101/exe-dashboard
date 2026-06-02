import { useQuery } from '@tanstack/react-query'
import { executionKeys } from '../lib/execution-query-keys'
import { normalizeExecutionStatus } from '../lib/execution-display'
import type { ExecutionStatusReadModel } from '../lib/execution-status-cache'

const EMPTY_EXECUTION_STATUS_READ_MODEL: ExecutionStatusReadModel = {}

export const useExecutionStatusReadModel = () =>
  useQuery({
    queryKey: executionKeys.statuses(),
    queryFn: async () => EMPTY_EXECUTION_STATUS_READ_MODEL,
    initialData: EMPTY_EXECUTION_STATUS_READ_MODEL,
    enabled: false,
  })

export const useExecutionStatusValue = (executionId: string, fallbackStatus?: string | null) => {
  const executionStatusReadModel = useExecutionStatusReadModel()

  return executionStatusReadModel.data[executionId] ?? normalizeExecutionStatus(fallbackStatus)
}
