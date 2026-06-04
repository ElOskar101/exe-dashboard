import { useMemo, useState, type Dispatch, type UIEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useQueries } from '@tanstack/react-query'
import { IconAlertCircle, IconChevronDown, IconExternalLink, IconPlus, IconX } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { cn } from '@/lib/utils'
import {
  EXECUTION_STATUSES,
  formatExecutionDate,
  isExecutionRunning,
  getStatusBadgeClassName,
  getStatusBadgeVariant,
  normalizeExecutionStatus,
  useExecutionsQuery,
  useExecutionStatusReadModel,
  type Execution,
  type ExecutionQuery,
  type ExecutionStatus,
} from '@/features/executions/shared'
import {
  executionWizardKeys,
  getCustomerById,
  searchCustomers,
  type CustomerDetailsResponse,
  type CustomerSearchItem,
} from '@/features/executions/creation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExecutionPatientsDialog } from '../components/execution-patients-dialog'
import { getExecutionDayLabel, groupExecutionsByProject } from '../lib/execution-sidebar-display'

const ALL_FILTER_VALUE = 'all'
const CLIENT_FILTER_PAGE_SIZE = 15
const CLIENT_FILTER_SEARCH_DELAY_MS = 300
const EXECUTION_DATE_FIELD = 'createdAt'
const FILTER_SCROLL_BOTTOM_THRESHOLD = 48
const UNKNOWN_PROJECT_LABEL = 'Unknown project'

const getResolvedExecutionStatus = (execution: Execution, executionStatusReadModel: Record<string, ExecutionStatus>) =>
  executionStatusReadModel[execution._id] ?? normalizeExecutionStatus(execution.status)

const getExecutionProjectLabel = (execution: Execution) => execution.playwrightProject || UNKNOWN_PROJECT_LABEL

interface ExecutionDisplayNames {
  client: string
  clinic: string
}

interface ExecutionFilterOption {
  value: string
  label: string
}

const getExecutionDisplayNames = (
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

const compareFilterOptions = (a: ExecutionFilterOption, b: ExecutionFilterOption) =>
  a.label.localeCompare(b.label) || a.value.localeCompare(b.value)

const getClientFilterOptions = (
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

  return Array.from(optionsByValue.values()).sort(compareFilterOptions)
}

const getSelectedClientClinicOptions = (
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

const parseDateInputValue = (value: string, boundary: 'start' | 'end') => {
  if (!value) return undefined

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return undefined

  return boundary === 'start'
    ? new Date(year, month - 1, day, 0, 0, 0, 0)
    : new Date(year, month - 1, day, 23, 59, 59, 999)
}

const matchesDateRange = (execution: Execution, from: Date | undefined, to: Date | undefined) => {
  if (!from && !to) return true

  const createdAtTime = new Date(execution.createdAt).getTime()

  if (Number.isNaN(createdAtTime)) return false
  if (from && createdAtTime < from.getTime()) return false
  if (to && createdAtTime > to.getTime()) return false

  return true
}

interface ExecutionMultiSelectFilterProps {
  clearSelectionLabel?: string
  clearSelectionPlacement?: 'top' | 'bottom'
  disabled?: boolean
  emptyMessage: string
  filterOptionsLocally?: boolean
  hasMoreOptions?: boolean
  id: string
  label: string
  loadingMessage?: string
  loadingMoreMessage?: string
  isLoadingMoreOptions?: boolean
  isLoadingOptions?: boolean
  onLoadMoreOptions?: () => void
  onSearchValueChange?: Dispatch<string>
  onSelectedValuesChange: Dispatch<string[]>
  options: ExecutionFilterOption[]
  placeholder: string
  searchPlaceholder?: string
  selectedCountLabel: string
  selectedValues: string[]
}

function ExecutionMultiSelectFilter({
  clearSelectionLabel,
  clearSelectionPlacement = 'top',
  disabled = false,
  emptyMessage,
  filterOptionsLocally = true,
  hasMoreOptions = false,
  id,
  label,
  loadingMessage,
  loadingMoreMessage,
  isLoadingMoreOptions = false,
  isLoadingOptions = false,
  onLoadMoreOptions,
  onSearchValueChange,
  onSelectedValuesChange,
  options,
  placeholder,
  searchPlaceholder,
  selectedCountLabel,
  selectedValues,
}: ExecutionMultiSelectFilterProps) {
  const [searchValue, setSearchValue] = useState('')
  const filteredOptions = useMemo(() => {
    if (!filterOptionsLocally) return options

    const normalizedSearchValue = searchValue.trim().toLocaleLowerCase()

    if (!normalizedSearchValue) return options

    return options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedSearchValue))
  }, [filterOptionsLocally, options, searchValue])
  const selectedValuesSet = useMemo(() => new Set(selectedValues), [selectedValues])
  const selectedLabel = useMemo(() => {
    if (selectedValues.length === 0) return placeholder

    if (selectedValues.length === 1) {
      return options.find((option) => option.value === selectedValues[0])?.label ?? selectedValues[0]
    }

    return selectedCountLabel
  }, [options, placeholder, selectedCountLabel, selectedValues])

  const setOptionSelected = (value: string, selected: boolean) => {
    onSelectedValuesChange(
      selected
        ? Array.from(new Set([...selectedValues, value])).sort()
        : selectedValues.filter((selectedValue) => selectedValue !== value),
    )
  }
  const clearSelectionButton = selectedValues.length > 0 && (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(clearSelectionPlacement === 'bottom' ? 'w-full justify-start' : 'w-fit')}
      onClick={() => onSelectedValuesChange([])}
    >
      <IconX data-icon="inline-start" />
      {clearSelectionLabel ?? placeholder}
    </Button>
  )
  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
    onSearchValueChange?.(value)
  }
  const handleOptionsScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!onLoadMoreOptions || !hasMoreOptions || isLoadingMoreOptions) return

    const viewport = event.currentTarget
    const distanceToBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight

    if (distanceToBottom <= FILTER_SCROLL_BOTTOM_THRESHOLD) {
      onLoadMoreOptions()
    }
  }

  return (
    <Field className="gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover>
        <PopoverTrigger
          render={
            <Button id={id} type="button" variant="outline" disabled={disabled} className="w-full justify-between" />
          }
        >
          <span className="truncate">{selectedLabel}</span>
          <IconChevronDown data-icon="inline-end" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 gap-3">
          <PopoverHeader>
            <PopoverTitle>{label}</PopoverTitle>
          </PopoverHeader>
          {clearSelectionPlacement === 'top' ? clearSelectionButton : null}
          {searchPlaceholder ? (
            <Input
              type="search"
              value={searchValue}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(event) => handleSearchValueChange(event.target.value)}
            />
          ) : null}
          <ScrollArea
            className="max-h-72"
            viewportProps={{ className: 'flex max-h-72 flex-col gap-1', onScroll: handleOptionsScroll }}
          >
            {isLoadingOptions && filteredOptions.length === 0 ? (
              <div className="flex items-center gap-2 rounded-2xl px-2 py-1.5 text-muted-foreground">
                <Spinner data-icon="inline-start" />
                {loadingMessage ?? emptyMessage}
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Label
                  key={option.value}
                  className="flex min-h-9 cursor-pointer items-center rounded-2xl px-2 py-1.5 hover:bg-muted"
                >
                  <Checkbox
                    checked={selectedValuesSet.has(option.value)}
                    onCheckedChange={(checked) => setOptionSelected(option.value, checked)}
                  />
                  <span className="truncate">{option.label}</span>
                </Label>
              ))
            ) : (
              <div className="rounded-2xl px-2 py-1.5 text-muted-foreground">{emptyMessage}</div>
            )}
            {isLoadingMoreOptions ? (
              <div className="flex items-center gap-2 rounded-2xl px-2 py-1.5 text-muted-foreground">
                <Spinner data-icon="inline-start" />
                {loadingMoreMessage ?? loadingMessage ?? emptyMessage}
              </div>
            ) : null}
          </ScrollArea>
          {clearSelectionPlacement === 'bottom' && clearSelectionButton ? (
            <div className="sticky bottom-0 -mx-4 -mb-4 border-t bg-popover p-3">{clearSelectionButton}</div>
          ) : null}
        </PopoverContent>
      </Popover>
    </Field>
  )
}

function ExecutionStatusBadge({ status }: { status: ExecutionStatus }) {
  const { t } = useTranslation('executions')

  return (
    <Badge variant={getStatusBadgeVariant(status)} className={cn('capitalize', getStatusBadgeClassName(status))}>
      {isExecutionRunning(status) ? <Spinner data-icon="inline-start" /> : null}
      {t(`list.statusOptions.${status}`)}
    </Badge>
  )
}

export default function ExecutionsPage() {
  const { t } = useTranslation('executions')
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>([])
  const [clientSearchValue, setClientSearchValue] = useState('')
  const [dateFromValue, setDateFromValue] = useState('')
  const [dateToValue, setDateToValue] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE)
  const debouncedClientSearchValue = useDebouncedValue(clientSearchValue, CLIENT_FILTER_SEARCH_DELAY_MS)
  const dateFrom = useMemo(() => parseDateInputValue(dateFromValue, 'start'), [dateFromValue])
  const dateTo = useMemo(() => parseDateInputValue(dateToValue, 'end'), [dateToValue])
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
  const clientSearchQuery = useInfiniteQuery({
    queryKey: executionWizardKeys.customerSearch(debouncedClientSearchValue, { limit: CLIENT_FILTER_PAGE_SIZE }),
    queryFn: async ({ pageParam }) => {
      const response = await searchCustomers(debouncedClientSearchValue, {
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
  const searchedCustomers = useMemo(
    () => clientSearchQuery.data?.pages.flatMap((page) => page.customers) ?? [],
    [clientSearchQuery.data],
  )
  const clientOptions = useMemo(
    () => getClientFilterOptions(searchedCustomers, customersById, selectedClientIds),
    [customersById, searchedCustomers, selectedClientIds],
  )
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
  const selectedStatusFilterLabel =
    statusFilter === ALL_FILTER_VALUE ? t('list.filters.allStatuses') : t(`list.statusOptions.${statusFilter}`)
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
    Boolean(dateFromValue) ||
    Boolean(dateToValue) ||
    statusFilter !== ALL_FILTER_VALUE

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold tracking-tight">{t('list.title')}</h1>
          <p className="max-w-3xl text-muted-foreground">{t('list.description')}</p>
        </div>
        <Button nativeButton={false} render={<Link to="/" />}>
          <IconPlus data-icon="inline-start" />
          {t('list.createExecution')}
        </Button>
      </div>

      <Card size="sm">
        <CardContent className="flex flex-col gap-4">
          <FieldGroup className="gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_minmax(8rem,0.65fr)_minmax(8rem,0.65fr)_minmax(10rem,0.75fr)]">
            <ExecutionMultiSelectFilter
              clearSelectionLabel={t('list.filters.removeAllClients')}
              clearSelectionPlacement="bottom"
              filterOptionsLocally={false}
              hasMoreOptions={clientSearchQuery.hasNextPage}
              id="execution-client-filter"
              isLoadingMoreOptions={clientSearchQuery.isFetchingNextPage}
              isLoadingOptions={clientSearchQuery.isLoading}
              label={t('list.filters.clientLabel')}
              loadingMessage={t('list.filters.loadingClients')}
              loadingMoreMessage={t('list.filters.loadingMoreClients')}
              placeholder={t('list.filters.allClients')}
              selectedCountLabel={t('list.filters.selectedClients', { count: selectedClientIds.length })}
              selectedValues={selectedClientIds}
              options={clientOptions}
              emptyMessage={t('list.filters.noClients')}
              searchPlaceholder={t('list.filters.searchClients')}
              onLoadMoreOptions={() => void clientSearchQuery.fetchNextPage()}
              onSearchValueChange={setClientSearchValue}
              onSelectedValuesChange={updateSelectedClientIds}
            />
            <ExecutionMultiSelectFilter
              id="execution-clinic-filter"
              label={t('list.filters.clinicLabel')}
              placeholder={t('list.filters.allClinics')}
              selectedCountLabel={t('list.filters.selectedClinics', { count: selectedClinicIds.length })}
              selectedValues={selectedClinicIds}
              options={clinicOptions}
              emptyMessage={t('list.filters.noClinics')}
              disabled={selectedClientIds.length === 0}
              onSelectedValuesChange={setSelectedClinicIds}
            />
            <Field className="gap-2">
              <FieldLabel htmlFor="execution-date-from-filter">{t('list.filters.fromLabel')}</FieldLabel>
              <Input
                id="execution-date-from-filter"
                type="date"
                value={dateFromValue}
                max={dateToValue || undefined}
                onChange={(event) => setDateFromValue(event.target.value)}
              />
            </Field>
            <Field className="gap-2">
              <FieldLabel htmlFor="execution-date-to-filter">{t('list.filters.toLabel')}</FieldLabel>
              <Input
                id="execution-date-to-filter"
                type="date"
                value={dateToValue}
                min={dateFromValue || undefined}
                onChange={(event) => setDateToValue(event.target.value)}
              />
            </Field>
            <Field className="gap-2">
              <FieldLabel htmlFor="execution-status-filter">{t('list.filters.statusLabel')}</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? ALL_FILTER_VALUE)}>
                <SelectTrigger id="execution-status-filter" className="w-full">
                  <SelectValue placeholder={t('list.filters.allStatuses')}>{selectedStatusFilterLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value={ALL_FILTER_VALUE}>{t('list.filters.allStatuses')}</SelectItem>
                    {EXECUTION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`list.statusOptions.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {executionsQuery.isError ? (
            <Alert variant="destructive">
              <IconAlertCircle />
              <AlertTitle>{t('list.loadErrorTitle')}</AlertTitle>
              <AlertDescription>{t('list.loadErrorDescription')}</AlertDescription>
              <Button className="mt-3 w-fit" size="sm" variant="outline" onClick={() => void executionsQuery.refetch()}>
                {t('list.retry')}
              </Button>
            </Alert>
          ) : null}

          {executionsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          ) : null}

          {!executionsQuery.isLoading && !executionsQuery.isError ? (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28 whitespace-normal">{t('list.columns.execution')}</TableHead>
                  <TableHead className="w-28">{t('list.columns.status')}</TableHead>
                  <TableHead className="hidden w-24 whitespace-nowrap md:table-cell">
                    {t('list.columns.createdAt')}
                  </TableHead>
                  <TableHead className="hidden whitespace-normal lg:table-cell xl:w-36">
                    {t('list.columns.client')}
                  </TableHead>
                  <TableHead className="hidden whitespace-normal lg:table-cell xl:w-36">
                    {t('list.columns.clinic')}
                  </TableHead>
                  <TableHead className="hidden whitespace-normal 2xl:table-cell 2xl:w-28">
                    {t('list.columns.project')}
                  </TableHead>
                  <TableHead className="w-[11rem] whitespace-normal sm:w-[14rem]">
                    {t('list.columns.patients')}
                  </TableHead>
                  <TableHead className="hidden whitespace-normal 2xl:table-cell 2xl:w-36">
                    {t('list.columns.bot')}
                  </TableHead>
                  <TableHead className="w-16 text-right sm:w-28">{t('list.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExecutions.length > 0 ? (
                  filteredExecutions.map((execution) => {
                    const status = getResolvedExecutionStatus(execution, executionStatusReadModel.data)
                    const executionDayLabel = getExecutionDayLabel(execution)
                    const displayNames = getExecutionDisplayNames(execution, customersById)

                    return (
                      <TableRow key={execution._id}>
                        <TableCell className="font-medium whitespace-normal break-words">
                          <Link className="hover:underline" to={`/execution/${execution._id}`}>
                            {executionDayLabel}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <ExecutionStatusBadge status={status} />
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap md:table-cell">
                          {formatExecutionDate(execution.createdAt)}
                        </TableCell>
                        <TableCell className="hidden whitespace-normal break-words lg:table-cell">
                          {displayNames.client || t('list.emptyValue')}
                        </TableCell>
                        <TableCell className="hidden whitespace-normal break-words lg:table-cell">
                          {displayNames.clinic || t('list.emptyValue')}
                        </TableCell>
                        <TableCell className="hidden whitespace-normal break-words 2xl:table-cell">
                          {getExecutionProjectLabel(execution)}
                        </TableCell>
                        <TableCell className="whitespace-normal break-words">
                          <ExecutionPatientsDialog execution={execution} executionLabel={executionDayLabel} />
                        </TableCell>
                        <TableCell className="hidden whitespace-normal break-words 2xl:table-cell">
                          {execution.botName || execution.bot || t('list.emptyValue')}
                        </TableCell>
                        <TableCell className="">
                          <div className="flex justify-end">
                            <Button
                              nativeButton={false}
                              variant="outline"
                              className="text-xs"
                              render={<Link to={`/execution/${execution._id}`} />}
                            >
                              <span className="sr-only sm:not-sr-only">{t('list.viewDetails')}</span>
                              <IconExternalLink data-icon="inline-end" className="not-sr-only sm:sr-only" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell className="h-28 text-center text-muted-foreground" colSpan={9}>
                      {isFiltered ? t('list.noFilteredExecutions') : t('list.noExecutions')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
