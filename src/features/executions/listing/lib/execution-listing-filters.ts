import { endOfDay, isAfter, isBefore, isValid, parseISO, startOfDay } from 'date-fns'

import { type CustomerSearchItem } from '@/features/executions/creation'
import { normalizeExecutionStatus, type Execution, type ExecutionStatusReadModel } from '@/features/executions/shared'

export const ALL_FILTER_VALUE = 'all'
export const EXECUTION_DATE_FIELD = 'createdAt'
export const UNKNOWN_PROJECT_LABEL = 'Unknown project'

export interface ExecutionDisplayNames {
  client: string
  clinic: string
}

export interface ExecutionFilterOption {
  value: string
  label: string
}

const compareFilterOptions = (a: ExecutionFilterOption, b: ExecutionFilterOption) =>
  a.label.localeCompare(b.label) || a.value.localeCompare(b.value)

export const getResolvedExecutionStatus = (execution: Execution, executionStatusReadModel: ExecutionStatusReadModel) =>
  executionStatusReadModel[execution._id]?.status ?? normalizeExecutionStatus(execution.status)

export const getExecutionProjectLabel = (execution: Execution) => execution.project || UNKNOWN_PROJECT_LABEL

export const getExecutionDisplayNames = (execution: Execution): ExecutionDisplayNames => ({
  client: execution.client,
  clinic: execution.clinic,
})

export const getClientFilterOptions = (
  customers: CustomerSearchItem[],
  selectedClientIds: string[],
): ExecutionFilterOption[] => {
  const optionsByValue = new Map<string, ExecutionFilterOption>()

  customers.forEach((customer) => {
    const value = customer.clientName.trim()

    if (!value) return

    optionsByValue.set(value, { value, label: value })
  })

  selectedClientIds.forEach((clientId) => {
    const value = clientId.trim()

    if (!value) return

    const label = optionsByValue.get(value)?.label || value

    optionsByValue.set(value, { value, label })
  })

  return Array.from(optionsByValue.values()).sort(compareFilterOptions)
}

export const getSelectedClientClinicOptions = (
  executions: Execution[],
  selectedClientIds: string[],
): ExecutionFilterOption[] => {
  const optionsByValue = new Map<string, ExecutionFilterOption>()
  const selectedClients = new Set(selectedClientIds)

  executions.forEach((execution) => {
    if (!selectedClients.has(execution.client)) return

    const value = execution.clinic.trim()

    if (!value) return

    optionsByValue.set(value, { value, label: value })
  })

  return Array.from(optionsByValue.values()).sort(compareFilterOptions)
}

export const getDateRangeBoundary = (date: Date | undefined, boundary: 'start' | 'end') => {
  if (!date) return undefined

  return boundary === 'start' ? startOfDay(date) : endOfDay(date)
}

export const matchesDateRange = (execution: Execution, from: Date | undefined, to: Date | undefined) => {
  if (!from && !to) return true

  const createdAt = parseISO(execution.createdAt)

  if (!isValid(createdAt)) return false
  if (from && isBefore(createdAt, from)) return false
  if (to && isAfter(createdAt, to)) return false

  return true
}
