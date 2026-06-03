import { useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { IconAlertCircle, IconExternalLink, IconPlus, IconSearch } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  EXECUTION_STATUSES,
  formatExecutionDateTime,
  isExecutionFailed,
  isExecutionRunning,
  isExecutionSuccessful,
  normalizeExecutionStatus,
  useExecutionsQuery,
  useExecutionStatusReadModel,
  type Execution,
  type ExecutionStatus,
} from '@/features/executions/shared'
import { executionWizardKeys, getCustomerById, type CustomerDetailsResponse } from '@/features/executions/creation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getExecutionDayLabel, groupExecutionsByProject } from '../lib/execution-sidebar-display'

const ALL_FILTER_VALUE = 'all'
const UNKNOWN_PROJECT_LABEL = 'Unknown project'

const getResolvedExecutionStatus = (execution: Execution, executionStatusReadModel: Record<string, ExecutionStatus>) =>
  executionStatusReadModel[execution._id] ?? normalizeExecutionStatus(execution.status)

const getFilterableExecutionText = (execution: Execution, displayNames: ExecutionDisplayNames) =>
  [
    execution._id,
    execution.playwrightProject,
    execution.client,
    execution.clinic,
    displayNames.client,
    displayNames.clinic,
    execution.execution,
    execution.bot,
    execution.botName,
    execution.jobId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

const getExecutionSearchMatch = (execution: Execution, searchTerm: string, displayNames: ExecutionDisplayNames) => {
  if (!searchTerm) return true

  return getFilterableExecutionText(execution, displayNames).includes(searchTerm)
}

const getExecutionProjectLabel = (execution: Execution) => execution.playwrightProject || UNKNOWN_PROJECT_LABEL

interface ExecutionDisplayNames {
  client: string
  clinic: string
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

function ExecutionStatusBadge({ status }: { status: ExecutionStatus }) {
  const { t } = useTranslation('executions')
  const variant = isExecutionSuccessful(status) ? 'success' : isExecutionFailed(status) ? 'destructive' : 'secondary'

  return (
    <Badge variant={variant} className="capitalize">
      {isExecutionRunning(status) ? <Spinner data-icon="inline-start" /> : null}
      {t(`list.statusOptions.${status}`)}
    </Badge>
  )
}

export default function ExecutionsPage() {
  const { t } = useTranslation('executions')
  const [searchValue, setSearchValue] = useState('')
  const [projectFilter, setProjectFilter] = useState(ALL_FILTER_VALUE)
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER_VALUE)
  const deferredSearchValue = useDeferredValue(searchValue)
  const executionsQuery = useExecutionsQuery()
  const executionStatusReadModel = useExecutionStatusReadModel()
  const groupedExecutions = useMemo(() => groupExecutionsByProject(executionsQuery.data ?? []), [executionsQuery.data])
  const sortedExecutions = useMemo(() => groupedExecutions.flatMap((group) => group.executions), [groupedExecutions])
  const customerIds = useMemo(
    () => Array.from(new Set(sortedExecutions.map((execution) => execution.client).filter(Boolean))).sort(),
    [sortedExecutions],
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
  const projectOptions = useMemo(() => groupedExecutions.map((group) => group.project), [groupedExecutions])
  const normalizedSearchValue = deferredSearchValue.trim().toLowerCase()
  const filteredExecutions = useMemo(
    () =>
      sortedExecutions.filter((execution) => {
        const status = getResolvedExecutionStatus(execution, executionStatusReadModel.data)
        const displayNames = getExecutionDisplayNames(execution, customersById)
        const matchesProject =
          projectFilter === ALL_FILTER_VALUE || getExecutionProjectLabel(execution) === projectFilter
        const matchesStatus = statusFilter === ALL_FILTER_VALUE || status === statusFilter

        return (
          matchesProject && matchesStatus && getExecutionSearchMatch(execution, normalizedSearchValue, displayNames)
        )
      }),
    [
      customersById,
      executionStatusReadModel.data,
      normalizedSearchValue,
      projectFilter,
      sortedExecutions,
      statusFilter,
    ],
  )
  const isFiltered =
    Boolean(normalizedSearchValue) || projectFilter !== ALL_FILTER_VALUE || statusFilter !== ALL_FILTER_VALUE

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t('list.title')}</h1>
          <p className="max-w-3xl text-muted-foreground">{t('list.description')}</p>
        </div>
        <Button nativeButton={false} render={<Link to="/" />}>
          <IconPlus data-icon="inline-start" />
          {t('list.createExecution')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('list.tableTitle')}</CardTitle>
          <CardDescription>
            {t('list.tableDescription', {
              count: filteredExecutions.length,
              total: sortedExecutions.length,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FieldGroup className="gap-3 md:grid md:grid-cols-[minmax(0,1fr)_14rem_12rem]">
            <Field>
              <FieldLabel htmlFor="execution-search">{t('list.filters.searchLabel')}</FieldLabel>
              <div className="relative">
                <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="execution-search"
                  value={searchValue}
                  placeholder={t('list.filters.searchPlaceholder')}
                  className="pl-9"
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="execution-project-filter">{t('list.filters.projectLabel')}</FieldLabel>
              <Select value={projectFilter} onValueChange={(value) => setProjectFilter(value ?? ALL_FILTER_VALUE)}>
                <SelectTrigger id="execution-project-filter" className="w-full">
                  <SelectValue placeholder={t('list.filters.allProjects')} />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value={ALL_FILTER_VALUE}>{t('list.filters.allProjects')}</SelectItem>
                    {projectOptions.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="execution-status-filter">{t('list.filters.statusLabel')}</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? ALL_FILTER_VALUE)}>
                <SelectTrigger id="execution-status-filter" className="w-full">
                  <SelectValue placeholder={t('list.filters.allStatuses')} />
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('list.columns.execution')}</TableHead>
                  <TableHead>{t('list.columns.status')}</TableHead>
                  <TableHead>{t('list.columns.project')}</TableHead>
                  <TableHead>{t('list.columns.client')}</TableHead>
                  <TableHead>{t('list.columns.clinic')}</TableHead>
                  <TableHead>{t('list.columns.bot')}</TableHead>
                  <TableHead>{t('list.columns.createdAt')}</TableHead>
                  <TableHead className="text-right">{t('list.columns.actions')}</TableHead>
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
                        <TableCell className="font-medium">
                          <Link className="hover:underline" to={`/execution/${execution._id}`}>
                            {executionDayLabel}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <ExecutionStatusBadge status={status} />
                        </TableCell>
                        <TableCell>{getExecutionProjectLabel(execution)}</TableCell>
                        <TableCell>{displayNames.client || t('list.emptyValue')}</TableCell>
                        <TableCell>{displayNames.clinic || t('list.emptyValue')}</TableCell>
                        <TableCell>{execution.botName || execution.bot || t('list.emptyValue')}</TableCell>
                        <TableCell>{formatExecutionDateTime(execution.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            nativeButton={false}
                            variant="outline"
                            size="sm"
                            render={<Link to={`/execution/${execution._id}`} />}
                          >
                            {t('list.viewDetails')}
                            <IconExternalLink data-icon="inline-end" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell className="h-28 text-center text-muted-foreground" colSpan={8}>
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
