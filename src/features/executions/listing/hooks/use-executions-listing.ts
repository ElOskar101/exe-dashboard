import { useMemo, useState } from 'react'
import { type DateRange } from 'react-day-picker'

import {
  useExecutionsQuery,
  useExecutionStatusReadModel,
  type ExecutionQuery,
  type ExecutionStatus,
} from '@/features/executions/shared'

import {
  ALL_FILTER_VALUE,
  EXECUTION_DATE_FIELD,
  getDateRangeBoundary,
  getResolvedExecutionStatus,
  getSelectedClientClinicOptions,
  matchesDateRange,
} from '../lib/execution-listing-filters'

type ExecutionStatusFilter = typeof ALL_FILTER_VALUE | ExecutionStatus

const getCreatedAtSortValue = (createdAt: string) => {
  const time = new Date(createdAt).getTime()

  return Number.isNaN(time) ? 0 : time
}

const sortExecutionsByCreatedAtDescending = <TExecution extends { createdAt: string }>(
  executions: readonly TExecution[],
) =>
  [...executions].sort(
    (leftExecution, rightExecution) =>
      getCreatedAtSortValue(rightExecution.createdAt) - getCreatedAtSortValue(leftExecution.createdAt),
  )

export function useExecutionsListing() {
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [statusFilter, setStatusFilter] = useState<ExecutionStatusFilter>(ALL_FILTER_VALUE)
  const dateFrom = useMemo(() => getDateRangeBoundary(dateRange?.from, 'start'), [dateRange?.from])
  const dateTo = useMemo(() => getDateRangeBoundary(dateRange?.to, 'end'), [dateRange?.to])
  const executionQueryFilters = useMemo(() => {
    const nextFilters: ExecutionQuery = {}

    if (selectedClientIds.length > 0) nextFilters.client = selectedClientIds
    if (selectedClinicIds.length > 0) nextFilters.clinic = selectedClinicIds
    if (dateFrom) nextFilters.from = dateFrom
    if (dateTo) nextFilters.to = dateTo
    if (dateFrom || dateTo) nextFilters.dateField = EXECUTION_DATE_FIELD
    if (statusFilter !== ALL_FILTER_VALUE) nextFilters.status = statusFilter

    return nextFilters
  }, [dateFrom, dateTo, selectedClientIds, selectedClinicIds, statusFilter])
  const executionsQuery = useExecutionsQuery(executionQueryFilters)
  const executionStatusReadModel = useExecutionStatusReadModel()
  const sortedExecutions = useMemo(
    () => sortExecutionsByCreatedAtDescending(executionsQuery.data ?? []),
    [executionsQuery.data],
  )
  const clinicOptions = useMemo(
    () => getSelectedClientClinicOptions(sortedExecutions, selectedClientIds),
    [sortedExecutions, selectedClientIds],
  )
  const updateSelectedClientIds = (nextClientIds: string[]) => {
    setSelectedClientIds(nextClientIds)

    if (nextClientIds.length === 0) {
      setSelectedClinicIds([])
      return
    }

    const nextClientIdsSet = new Set(nextClientIds)
    const nextClinicIds = new Set(
      sortedExecutions
        .filter((execution) => nextClientIdsSet.has(execution.client))
        .map((execution) => execution.clinic)
        .filter(Boolean),
    )

    setSelectedClinicIds((currentClinicIds) => currentClinicIds.filter((clinicId) => nextClinicIds.has(clinicId)))
  }
  const selectedClientIdsSet = useMemo(() => new Set(selectedClientIds), [selectedClientIds])
  const selectedClinicIdsSet = useMemo(() => new Set(selectedClinicIds), [selectedClinicIds])
  const filteredExecutions = useMemo(
    () =>
      sortedExecutions.filter((execution) => {
        const status = getResolvedExecutionStatus(execution, executionStatusReadModel.data)
        const matchesStatus = statusFilter === ALL_FILTER_VALUE || status === statusFilter
        const matchesClient = selectedClientIdsSet.size === 0 || selectedClientIdsSet.has(execution.client)
        const matchesClinic = selectedClinicIdsSet.size === 0 || selectedClinicIdsSet.has(execution.clinic)

        return matchesStatus && matchesClient && matchesClinic && matchesDateRange(execution, dateFrom, dateTo)
      }),
    [
      dateFrom,
      dateTo,
      executionStatusReadModel.data,
      selectedClientIdsSet,
      selectedClinicIdsSet,
      sortedExecutions,
      statusFilter,
    ],
  )
  const isFiltered =
    selectedClientIds.length > 0 ||
    selectedClinicIds.length > 0 ||
    Boolean(dateRange?.from) ||
    Boolean(dateRange?.to) ||
    statusFilter !== ALL_FILTER_VALUE

  return {
    clinicOptions,
    dateRange,
    executionStatusReadModel,
    executionsQuery,
    filteredExecutions,
    isFiltered,
    selectedClientIds,
    selectedClinicIds,
    statusFilter,
    setDateRange,
    setSelectedClinicIds,
    setStatusFilter,
    updateSelectedClientIds,
  }
}
