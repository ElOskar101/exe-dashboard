import { endOfDay, isAfter, isBefore, isValid, parseISO, startOfDay } from 'date-fns'

import { type CustomerDetailsResponse, type CustomerSearchItem } from '@/features/executions/creation'
import { normalizeExecutionStatus, type Execution, type ExecutionStatus } from '@/features/executions/shared'

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

export const getResolvedExecutionStatus = (
  execution: Execution,
  executionStatusReadModel: Record<string, ExecutionStatus>,
) => executionStatusReadModel[execution._id] ?? normalizeExecutionStatus(execution.status)

export const getExecutionProjectLabel = (execution: Execution) => execution.project || UNKNOWN_PROJECT_LABEL

export const getExecutionDisplayNames = (
  execution: Execution,
  customersById: Map<string, CustomerDetailsResponse>,
): ExecutionDisplayNames => {
  const customer = customersById.get(execution.client)
  const clinic = customer?.clinic.find((customerClinic) => customerClinic._id === execution.clinic)

  return {
    client: customer?.clientName || execution.client,
    clinic: clinic?.clinicName || execution.clinic,
  }
}

export const getClientFilterOptions = (
  customers: CustomerSearchItem[],
  customersById: Map<string, CustomerDetailsResponse>,
  selectedClientIds: string[],
): ExecutionFilterOption[] => {
  const optionsByValue = new Map<string, ExecutionFilterOption>()

  customers.forEach((customer) => {
    const value = customer._id.trim()

    if (!value) return

    optionsByValue.set(value, { value, label: customer.clientName || value })
  })

  selectedClientIds.forEach((clientId) => {
    const value = clientId.trim()

    if (!value) return

    const existingOption = optionsByValue.get(value)
    const label = customersById.get(value)?.clientName || existingOption?.label || value

    optionsByValue.set(value, { value, label })
  })

  return Array.from(optionsByValue.values())
}

export const getSelectedClientClinicOptions = (
  customersById: Map<string, CustomerDetailsResponse>,
  selectedClientIds: string[],
): ExecutionFilterOption[] => {
  const optionsByValue = new Map<string, ExecutionFilterOption>()

  selectedClientIds.forEach((clientId) => {
    const customer = customersById.get(clientId)

    customer?.clinic.forEach((clinic) => {
      const value = clinic._id.trim()

      if (!value) return

      optionsByValue.set(value, { value, label: clinic.clinicName || value })
    })
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
