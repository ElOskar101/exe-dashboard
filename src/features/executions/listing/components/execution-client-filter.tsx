import { useMemo, useState, type Dispatch } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'

import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { executionWizardKeys } from '@/features/executions/creation/lib/execution-wizard-query-keys'
import { searchCustomers, type CustomerSearchItem } from '@/features/executions/creation/services/ccc.service'

import { getClientFilterOptions } from '../lib/execution-listing-filters'
import { ExecutionMultiSelectFilter } from './execution-multi-select-filter'

const CLIENT_FILTER_PAGE_SIZE = 15
const CLIENT_FILTER_SEARCH_DELAY_MS = 300

const getCustomerClientName = (customer: CustomerSearchItem) => customer.clientName

interface ExecutionClientFilterProps {
  clearSelectionLabel: string
  emptyMessage: string
  error?: string | null
  fieldClassName?: string
  getOptionValue?: (customer: CustomerSearchItem) => string
  id?: string
  invalid?: boolean
  label: string
  loadingMessage: string
  loadingMoreMessage: string
  onSelectedCustomersChange?: Dispatch<CustomerSearchItem[]>
  onSelectedValuesChange: Dispatch<string[]>
  placeholder: string
  searchPlaceholder: string
  selectedCountLabel: string
  selectedValueLabels?: Record<string, string>
  selectedValues: string[]
  selectionMode?: 'multiple' | 'single'
  triggerClassName?: string
}

export function ExecutionClientFilter({
  clearSelectionLabel,
  emptyMessage,
  error,
  fieldClassName,
  getOptionValue = getCustomerClientName,
  id = 'execution-client-filter',
  invalid = false,
  label,
  loadingMessage,
  loadingMoreMessage,
  onSelectedCustomersChange,
  onSelectedValuesChange,
  placeholder,
  searchPlaceholder,
  selectedCountLabel,
  selectedValueLabels = {},
  selectedValues,
  selectionMode = 'multiple',
  triggerClassName,
}: ExecutionClientFilterProps) {
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearchValue = useDebouncedValue(searchValue, CLIENT_FILTER_SEARCH_DELAY_MS)
  const clientSearchQuery = useInfiniteQuery({
    queryKey: executionWizardKeys.customerSearch(debouncedSearchValue, { limit: CLIENT_FILTER_PAGE_SIZE }),
    queryFn: async ({ pageParam }) => {
      const response = await searchCustomers(debouncedSearchValue, {
        limit: CLIENT_FILTER_PAGE_SIZE,
        page: pageParam,
      })

      return response.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      const nextPage = pages.length + 1
      const totalPages = Math.max(lastPage.totalPages, 1)

      return nextPage <= totalPages ? nextPage : undefined
    },
  })
  const searchedCustomers = useMemo(
    () => clientSearchQuery.data?.pages.flatMap((page) => page.customers) ?? [],
    [clientSearchQuery.data],
  )
  const clientOptions = useMemo(
    () =>
      getClientFilterOptions(searchedCustomers, selectedValues, {
        getOptionValue,
        selectedValueLabels,
      }),
    [getOptionValue, searchedCustomers, selectedValueLabels, selectedValues],
  )
  const handleSelectedValuesChange = (nextSelectedValues: string[]) => {
    onSelectedValuesChange(nextSelectedValues)

    if (onSelectedCustomersChange) {
      const selectedValuesSet = new Set(nextSelectedValues)

      onSelectedCustomersChange(searchedCustomers.filter((customer) => selectedValuesSet.has(getOptionValue(customer))))
    }
  }

  return (
    <ExecutionMultiSelectFilter
      clearSelectionLabel={clearSelectionLabel}
      clearSelectionPlacement="bottom"
      error={error}
      fieldClassName={fieldClassName}
      filterOptionsLocally={false}
      hasMoreOptions={clientSearchQuery.hasNextPage}
      id={id}
      invalid={invalid}
      isLoadingMoreOptions={clientSearchQuery.isFetchingNextPage}
      isLoadingOptions={clientSearchQuery.isLoading}
      label={label}
      loadingMessage={loadingMessage}
      loadingMoreMessage={loadingMoreMessage}
      placeholder={placeholder}
      selectedCountLabel={selectedCountLabel}
      selectedValues={selectedValues}
      options={clientOptions}
      emptyMessage={emptyMessage}
      searchPlaceholder={searchPlaceholder}
      onLoadMoreOptions={() => void clientSearchQuery.fetchNextPage()}
      onSearchValueChange={setSearchValue}
      onSelectedValuesChange={handleSelectedValuesChange}
      selectionMode={selectionMode}
      triggerClassName={triggerClassName}
    />
  )
}
