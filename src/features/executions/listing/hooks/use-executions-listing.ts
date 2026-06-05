import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { type DateRange } from 'react-day-picker'

import { executionWizardKeys, getCustomerById, type CustomerDetailsResponse } from '@/features/executions/creation'
import { useExecutionsQuery, useExecutionStatusReadModel, type ExecutionQuery } from '@/features/executions/shared'

import {
  ALL_FILTER_VALUE,
  EXECUTION_DATE_FIELD,
  getDateRangeBoundary,
  getResolvedExecutionStatus,
  getSelectedClientClinicOptions,
  matchesDateRange,
} from '../lib/execution-listing-filters'
import { groupExecutionsByProject } from '../lib/execution-sidebar-display'

export function useExecutionsListing() {
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE)
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
  const allExecutionsQuery = useExecutionsQuery()
  const executionsQuery = useExecutionsQuery(executionQueryFilters)
  const executionStatusReadModel = useExecutionStatusReadModel()
  const groupedExecutions = useMemo(() => groupExecutionsByProject(executionsQuery.data ?? []), [executionsQuery.data])
  const sortedExecutions = useMemo(() => groupedExecutions.flatMap((group) => group.executions), [groupedExecutions])
  const optionExecutions = useMemo(
    () => allExecutionsQuery.data ?? sortedExecutions,
    [allExecutionsQuery.data, sortedExecutions],
  )
  const customerIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...optionExecutions.map((execution) => execution.client).filter(Boolean),
          ...sortedExecutions.map((execution) => execution.client).filter(Boolean),
          ...selectedClientIds,
        ]),
      ).sort(),
    [optionExecutions, selectedClientIds, sortedExecutions],
  )
  const customerQueries = useQueries({
    queries: customerIds.map((customerId) => ({
      queryKey: executionWizardKeys.customer(customerId),
      queryFn: async () => {
        const response = await getCustomerById(customerId)

        return response.data
      },
    })),
  })
  const customersById = useMemo(() => {
    const nextCustomersById = new Map<string, CustomerDetailsResponse>()

    customerQueries.forEach((customerQuery) => {
      if (customerQuery.data) {
        nextCustomersById.set(customerQuery.data._id, customerQuery.data)
      }
    })

    return nextCustomersById
  }, [customerQueries])
  const loadingCustomerIds = useMemo(() => {
    const nextLoadingCustomerIds = new Set<string>()

    customerQueries.forEach((customerQuery, index) => {
      const customerId = customerIds[index]

      if (customerId && customerQuery.isLoading) {
        nextLoadingCustomerIds.add(customerId)
      }
    })

    return nextLoadingCustomerIds
  }, [customerIds, customerQueries])
  const clinicOptions = useMemo(
    () => getSelectedClientClinicOptions(customersById, selectedClientIds),
    [customersById, selectedClientIds],
  )
  const updateSelectedClientIds = (nextClientIds: string[]) => {
    setSelectedClientIds(nextClientIds)

    if (nextClientIds.length === 0) {
      setSelectedClinicIds([])
      return
    }

    const nextClinicIds = new Set(
      nextClientIds.flatMap((clientId) => customersById.get(clientId)?.clinic.map((clinic) => clinic._id) ?? []),
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
    customersById,
    dateRange,
    executionStatusReadModel,
    executionsQuery,
    filteredExecutions,
    isFiltered,
    loadingCustomerIds,
    selectedClientIds,
    selectedClinicIds,
    statusFilter,
    setDateRange,
    setSelectedClinicIds,
    setStatusFilter,
    updateSelectedClientIds,
  }
}
