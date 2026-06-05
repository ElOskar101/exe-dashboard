import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { IconExternalLink } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatExecutionDate, type Execution, type ExecutionStatus } from '@/features/executions/shared'
import { type CustomerDetailsResponse } from '@/features/executions/creation'

import { ExecutionPatientsDialog } from './execution-patients-dialog'
import { ExecutionStatusLabel } from './execution-status-label'
import {
  getExecutionDisplayNames,
  getExecutionProjectLabel,
  getResolvedExecutionStatus,
} from '../lib/execution-listing-filters'
import { getExecutionDayLabel } from '../lib/execution-sidebar-display'

interface ExecutionsTableProps {
  customersById: Map<string, CustomerDetailsResponse>
  executionStatusReadModel: Record<string, ExecutionStatus>
  executions: Execution[]
  isFiltered: boolean
  loadingCustomerIds: Set<string>
}

export function ExecutionsTable({
  customersById,
  executionStatusReadModel,
  executions,
  isFiltered,
  loadingCustomerIds,
}: ExecutionsTableProps) {
  const { t } = useTranslation('executions')

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-28 whitespace-normal">{t('list.columns.execution')}</TableHead>
          <TableHead className="w-28">{t('list.columns.status')}</TableHead>
          <TableHead className="hidden whitespace-normal lg:table-cell xl:w-36">{t('list.columns.client')}</TableHead>
          <TableHead className="hidden whitespace-normal lg:table-cell xl:w-36">{t('list.columns.clinic')}</TableHead>
          <TableHead className="hidden whitespace-normal 2xl:table-cell 2xl:w-28">
            {t('list.columns.project')}
          </TableHead>
          <TableHead className="w-[11rem] whitespace-normal sm:w-[14rem]">{t('list.columns.patients')}</TableHead>
          <TableHead className="hidden whitespace-normal 2xl:table-cell 2xl:w-36">{t('list.columns.bot')}</TableHead>
          <TableHead className="hidden w-24 whitespace-nowrap md:table-cell">{t('list.columns.createdAt')}</TableHead>
          <TableHead className="w-16 text-right sm:w-28">{t('list.columns.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {executions.length > 0 ? (
          executions.map((execution) => {
            const status = getResolvedExecutionStatus(execution, executionStatusReadModel)
            const executionDayLabel = getExecutionDayLabel(execution)
            const displayNames = getExecutionDisplayNames(execution, customersById)
            const isCustomerLoading = loadingCustomerIds.has(execution.client) && !customersById.has(execution.client)

            return (
              <TableRow key={execution._id}>
                <TableCell className="font-medium whitespace-normal break-words">
                  <Link className="hover:underline" to={`/execution/${execution._id}`}>
                    {executionDayLabel}
                  </Link>
                </TableCell>
                <TableCell>
                  <ExecutionStatusLabel status={status} />
                </TableCell>
                <TableCell className="hidden whitespace-normal break-words lg:table-cell">
                  {isCustomerLoading ? <Skeleton className="h-4 w-20" /> : displayNames.client || t('list.emptyValue')}
                </TableCell>
                <TableCell className="hidden whitespace-normal break-words lg:table-cell">
                  {isCustomerLoading ? <Skeleton className="h-4 w-24" /> : displayNames.clinic || t('list.emptyValue')}
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
                <TableCell className="hidden whitespace-nowrap md:table-cell">
                  {formatExecutionDate(execution.createdAt)}
                </TableCell>
                <TableCell>
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
  )
}
