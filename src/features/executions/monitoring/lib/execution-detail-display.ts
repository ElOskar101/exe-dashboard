import { normalizeExecutionStatus } from '@/features/executions/shared'

export const formatExecutionStatusLabel = (status?: string | null) => {
  if (!status) return status

  const normalizedStatus = normalizeExecutionStatus(status)

  return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
}
