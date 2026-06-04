import { useMemo, useState, type Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
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
import { cn } from '@/lib/utils'
import {
  EXECUTION_STATUSES,
  formatExecutionDateTime,
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
import { executionWizardKeys, getCustomerById, type CustomerDetailsResponse } from '@/features/executions/creation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExecutionPatientsDialog } from '../components/execution-patients-dialog'
import { getExecutionDayLabel, groupExecutionsByProject } from '../lib/execution-sidebar-display'

const ALL_FILTER_VALUE = 'all'
const EXECUTION_DATE_FIELD = 'createdAt'
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

const getUniqueClientOptions = (
  executions: Execution[],
  customersById: Map<string, CustomerDetailsResponse>,
): ExecutionFilterOption[] => {
  const optionsByValue = new Map<string, ExecutionFilterOption>()

  executions.forEach((execution) => {
    const value = execution.client.trim()

    if (!value) return

    const label = customersById.get(value)?.clientName || value
    optionsByValue.set(value, { value, label })
  })

  return Array.from(optionsByValue.values()).sort(compareFilterOptions)
}

const getUniqueClinicOptions = (
  executions: Execution[],
  customersById: Map<string, CustomerDetailsResponse>,
): ExecutionFilterOption[] => {
  const optionsByValue = new Map<string, ExecutionFilterOption>()

  executions.forEach((execution) => {
    const value = execution.clinic.trim()

    if (!value) return

    const { clinic } = getExecutionDisplayNames(execution, customersById)
    optionsByValue.set(value, { value, label: clinic || value })
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
  emptyMessage: string
  id: string
  label: string
  onSelectedValuesChange: Dispatch<string[]>
  options: ExecutionFilterOption[]
  placeholder: string
  selectedCountLabel: string
  selectedValues: string[]
}

function ExecutionMultiSelectFilter({
  emptyMessage,
  id,
  label,
  onSelectedValuesChange,
  options,
  placeholder,
  selectedCountLabel,
  selectedValues,
}: ExecutionMultiSelectFilterProps) {
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

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover>
        <PopoverTrigger render={<Button id={id} type="button" variant="outline" className="w-full justify-between" />}>
          <span className="truncate">{selectedLabel}</span>
          <IconChevronDown data-icon="inline-end" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 gap-3">
          <PopoverHeader>
            <PopoverTitle>{label}</PopoverTitle>
          </PopoverHeader>
          {selectedValues.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={() => onSelectedValuesChange([])}
            >
              <IconX data-icon="inline-start" />
              {placeholder}
            </Button>
          ) : null}
          <ScrollArea className="max-h-72" viewportProps={{ className: 'flex max-h-72 flex-col gap-1' }}>
            {options.length > 0 ? (
              options.map((option) => (
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
          </ScrollArea>
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
  const [dateFromValue, setDateFromValue] = useState('')
  const [dateToValue, setDateToValue] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE)
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
        new Set([...optionExecutions, ...sortedExecutions].map((execution) => execution.client).filter(Boolean)),
      ).sort(),
    [optionExecutions, sortedExecutions],
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
  const clientOptions = useMemo(
    () => getUniqueClientOptions(optionExecutions, customersById),
    [customersById, optionExecutions],
  )
  const clinicOptions = useMemo(
    () => getUniqueClinicOptions(optionExecutions, customersById),
    [customersById, optionExecutions],
  )
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

      <Card>
        <CardContent className="flex flex-col gap-5">
          <FieldGroup className="gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem_10rem_12rem]">
            <ExecutionMultiSelectFilter
              id="execution-client-filter"
              label={t('list.filters.clientLabel')}
              placeholder={t('list.filters.allClients')}
              selectedCountLabel={t('list.filters.selectedClients', { count: selectedClientIds.length })}
              selectedValues={selectedClientIds}
              options={clientOptions}
              emptyMessage={t('list.filters.noClients')}
              onSelectedValuesChange={setSelectedClientIds}
            />
            <ExecutionMultiSelectFilter
              id="execution-clinic-filter"
              label={t('list.filters.clinicLabel')}
              placeholder={t('list.filters.allClinics')}
              selectedCountLabel={t('list.filters.selectedClinics', { count: selectedClinicIds.length })}
              selectedValues={selectedClinicIds}
              options={clinicOptions}
              emptyMessage={t('list.filters.noClinics')}
              onSelectedValuesChange={setSelectedClinicIds}
            />
            <Field>
              <FieldLabel htmlFor="execution-date-from-filter">{t('list.filters.fromLabel')}</FieldLabel>
              <Input
                id="execution-date-from-filter"
                type="date"
                value={dateFromValue}
                max={dateToValue || undefined}
                onChange={(event) => setDateFromValue(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="execution-date-to-filter">{t('list.filters.toLabel')}</FieldLabel>
              <Input
                id="execution-date-to-filter"
                type="date"
                value={dateToValue}
                min={dateFromValue || undefined}
                onChange={(event) => setDateToValue(event.target.value)}
              />
            </Field>
            <Field>
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
                  <TableHead className="hidden 2xl:table-cell 2xl:w-36">{t('list.columns.createdAt')}</TableHead>
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
                        <TableCell className="hidden whitespace-nowrap 2xl:table-cell">
                          {formatExecutionDateTime(execution.createdAt)}
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
