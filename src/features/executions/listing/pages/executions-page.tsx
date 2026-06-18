import { IconAlertCircle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EXECUTION_STATUSES } from '@/features/executions/shared'

import { ExecutionClientFilter } from '../components/execution-client-filter'
import { ExecutionDateRangeFilter } from '../components/execution-date-range-filter'
import { ExecutionMultiSelectFilter } from '../components/execution-multi-select-filter'
import { ExecutionsTable } from '../components/executions-table'
import { useExecutionsListing } from '../hooks/use-executions-listing'
import { ALL_FILTER_VALUE } from '../lib/execution-listing-filters'

const executionStatusOptionKeys = {
  cancelled: 'list.statusOptions.cancelled',
  completed: 'list.statusOptions.completed',
  failed: 'list.statusOptions.failed',
  paused: 'list.statusOptions.paused',
  queued: 'list.statusOptions.queued',
  running: 'list.statusOptions.running',
  unknown: 'list.statusOptions.unknown',
} as const satisfies Record<
  (typeof EXECUTION_STATUSES)[number],
  Parameters<ReturnType<typeof useTranslation<'executions'>>['t']>[0]
>

export default function ExecutionsPage() {
  const { t } = useTranslation('executions')
  const {
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
  } = useExecutionsListing()
  const selectedStatusFilterLabel =
    statusFilter === ALL_FILTER_VALUE ? t('list.filters.allStatuses') : t(executionStatusOptionKeys[statusFilter])

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="sr-only">
        <h1>{t('list.title')}</h1>
        <p>{t('list.description')}</p>
      </div>

      <Card size="sm">
        <CardContent className="flex flex-col gap-4">
          <FieldGroup className="gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            <ExecutionClientFilter
              clearSelectionLabel={t('list.filters.removeAllClients')}
              label={t('list.filters.clientLabel')}
              loadingMessage={t('list.filters.loadingClients')}
              loadingMoreMessage={t('list.filters.loadingMoreClients')}
              placeholder={t('list.filters.allClients')}
              selectedCountLabel={t('list.filters.selectedClients', { count: selectedClientIds.length })}
              selectedValues={selectedClientIds}
              emptyMessage={t('list.filters.noClients')}
              searchPlaceholder={t('list.filters.searchClients')}
              onSelectedValuesChange={updateSelectedClientIds}
            />
            <ExecutionMultiSelectFilter
              clearSelectionLabel={t('list.filters.removeAllClinics')}
              clearSelectionPlacement="bottom"
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
              <FieldLabel htmlFor="execution-status-filter">{t('list.filters.statusLabel')}</FieldLabel>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? ALL_FILTER_VALUE)}>
                <SelectTrigger
                  id="execution-status-filter"
                  className="w-full rounded-4xl border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-transparent dark:hover:bg-input/30"
                >
                  <SelectValue placeholder={t('list.filters.allStatuses')}>{selectedStatusFilterLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value={ALL_FILTER_VALUE}>{t('list.filters.allStatuses')}</SelectItem>
                    {EXECUTION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(executionStatusOptionKeys[status])}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <ExecutionDateRangeFilter
              dateRange={dateRange}
              label={t('list.filters.dateRangeLabel')}
              placeholder={t('list.filters.pickDateRange')}
              onDateRangeChange={setDateRange}
            />
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
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
          ) : null}

          {!executionsQuery.isLoading && !executionsQuery.isError ? (
            <ExecutionsTable
              executionStatusReadModel={executionStatusReadModel.data}
              executions={filteredExecutions}
              translations={{
                columns: {
                  project: t('list.columns.project'),
                  execution: t('list.columns.execution'),
                  status: t('list.columns.status'),
                  client: t('list.columns.client'),
                  clinic: t('list.columns.clinic'),
                  patients: t('list.columns.patients'),
                  bot: t('list.columns.bot'),
                  createdAt: t('list.columns.createdAt'),
                  creator: t('list.columns.creator'),
                },
                emptyValue: t('list.emptyValue'),
                empty: t('list.noExecutions'),
                noExecutions: t('list.noExecutions'),
                noFilteredExecutions: t('list.noFilteredExecutions'),
                showAll: t('list.showAll'),
              }}
              isFiltered={isFiltered}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
