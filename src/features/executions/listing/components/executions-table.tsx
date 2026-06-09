import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { IconExternalLink } from '@tabler/icons-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  formatExecutionDate,
  useExecutionTargetNavigation,
  type Execution,
  type ExecutionStatus,
} from '@/features/executions/shared'

import { ExecutionPatientsDialog } from './execution-patients-dialog'
import { ExecutionStatusLabel } from './execution-status-label'
import {
  getExecutionDisplayNames,
  getExecutionProjectLabel,
  getResolvedExecutionStatus,
} from '../lib/execution-listing-filters'
import { getExecutionDayLabel } from '../lib/execution-sidebar-display'

interface ExecutionsTableProps {
  executionStatusReadModel: Record<string, ExecutionStatus>
  executions: Execution[]
  isExecutionLimitActive: boolean
  isFiltered: boolean
  shouldShowAllExecutions: boolean
  onShowAllExecutions: () => void
}

interface ResponsiveTableRowCellProps {
  children: ReactNode
  className: string
}

function ResponsiveTableRowCell({ children, className }: ResponsiveTableRowCellProps) {
  return (
    <>
      <TableCell className={`md:hidden ${className}`} colSpan={4}>
        {children}
      </TableCell>
      <TableCell className={`hidden md:table-cell lg:hidden ${className}`} colSpan={5}>
        {children}
      </TableCell>
      <TableCell className={`hidden lg:table-cell 2xl:hidden ${className}`} colSpan={7}>
        {children}
      </TableCell>
      <TableCell className={`hidden 2xl:table-cell ${className}`} colSpan={9}>
        {children}
      </TableCell>
    </>
  )
}

export function ExecutionsTable({
  executionStatusReadModel,
  executions,
  isExecutionLimitActive,
  isFiltered,
  shouldShowAllExecutions,
  onShowAllExecutions,
}: ExecutionsTableProps) {
  const { t } = useTranslation('executions')
  const { getPathWithExecutionTarget } = useExecutionTargetNavigation()

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
          <>
            {executions.map((execution) => {
              const status = getResolvedExecutionStatus(execution, executionStatusReadModel)
              const executionDayLabel = getExecutionDayLabel(execution)
              const displayNames = getExecutionDisplayNames(execution)

              return (
                <TableRow key={execution._id}>
                  <TableCell className="font-medium whitespace-normal break-words">
                    <Link className="hover:underline" to={getPathWithExecutionTarget(`/execution/${execution._id}`)}>
                      {executionDayLabel}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ExecutionStatusLabel status={status} />
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
                  <TableCell className="hidden whitespace-nowrap md:table-cell">
                    {formatExecutionDate(execution.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        nativeButton={false}
                        variant="outline"
                        className="text-xs"
                        render={<Link to={getPathWithExecutionTarget(`/execution/${execution._id}`)} />}
                      >
                        <span className="sr-only sm:not-sr-only">{t('list.viewDetails')}</span>
                        <IconExternalLink data-icon="inline-end" className="not-sr-only sm:sr-only" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {isExecutionLimitActive && shouldShowAllExecutions ? (
              <TableRow>
                <ResponsiveTableRowCell className="h-16 text-center">
                  <Button variant="ghost" onClick={onShowAllExecutions}>
                    {t('list.showAll')}
                  </Button>
                </ResponsiveTableRowCell>
              </TableRow>
            ) : null}
          </>
        ) : (
          <TableRow>
            <ResponsiveTableRowCell className="h-28 text-center text-muted-foreground">
              {isFiltered ? t('list.noFilteredExecutions') : t('list.noExecutions')}
            </ResponsiveTableRowCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
