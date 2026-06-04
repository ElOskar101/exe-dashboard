import { useMemo, useState, type Dispatch } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'

import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { executionWizardKeys, searchCustomers, type CustomerDetailsResponse } from '@/features/executions/creation'

import { getClientFilterOptions } from '../lib/execution-listing-filters'
import { ExecutionMultiSelectFilter } from './execution-multi-select-filter'

const CLIENT_FILTER_PAGE_SIZE = 15
const CLIENT_FILTER_SEARCH_DELAY_MS = 300

interface ExecutionClientFilterProps {
  clearSelectionLabel: string
  customersById: Map<string, CustomerDetailsResponse>
  emptyMessage: string
  label: string
  loadingMessage: string
  loadingMoreMessage: string
  onSelectedValuesChange: Dispatch<string[]>
  placeholder: string
  searchPlaceholder: string
  selectedCountLabel: string
  selectedValues: string[]
}

export function ExecutionClientFilter({
  clearSelectionLabel,
  customersById,
  emptyMessage,
  label,
  loadingMessage,
  loadingMoreMessage,
  onSelectedValuesChange,
  placeholder,
  searchPlaceholder,
  selectedCountLabel,
  selectedValues,
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
    () => getClientFilterOptions(searchedCustomers, customersById, selectedValues),
    [customersById, searchedCustomers, selectedValues],
  )

  return (
    <ExecutionMultiSelectFilter
      clearSelectionLabel={clearSelectionLabel}
      clearSelectionPlacement="bottom"
      filterOptionsLocally={false}
      hasMoreOptions={clientSearchQuery.hasNextPage}
      id="execution-client-filter"
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
      onSelectedValuesChange={onSelectedValuesChange}
    />
  )
}
