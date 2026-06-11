import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  formatExecutionDate,
  normalizeExecutionStatus,
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

type ExecutionsTableVariant = 'list' | 'latest'

interface ExecutionsTableTranslations {
  columns: {
    project: string
    execution: string
    status: string
    client: string
    clinic: string
    patients?: string
    bot?: string
    createdAt: string
  }
  emptyValue: string
  empty: string
  noExecutions?: string
  noFilteredExecutions?: string
  showAll?: string
}

interface ExecutionsTableProps {
  variant: ExecutionsTableVariant
  executionStatusReadModel?: Record<string, ExecutionStatus>
  executions: Execution[]
  translations: ExecutionsTableTranslations
  getStatusLabel?: (status: ExecutionStatus) => string
  isExecutionLimitActive?: boolean
  isFiltered?: boolean
  shouldShowAllExecutions?: boolean
  onShowAllExecutions?: () => void
}

interface ResponsiveTableRowCellProps {
  children: ReactNode
  className: string
}

function ResponsiveTableRowCell({ children, className }: ResponsiveTableRowCellProps) {
  return (
    <>
      <TableCell className={`md:hidden ${className}`} colSpan={3}>
        {children}
      </TableCell>
      <TableCell className={`hidden md:table-cell lg:hidden ${className}`} colSpan={4}>
        {children}
      </TableCell>
      <TableCell className={`hidden lg:table-cell 2xl:hidden ${className}`} colSpan={6}>
        {children}
      </TableCell>
      <TableCell className={`hidden 2xl:table-cell ${className}`} colSpan={8}>
        {children}
      </TableCell>
    </>
  )
}

export function ExecutionsTable({
  variant,
  executionStatusReadModel,
  executions,
  translations,
  getStatusLabel,
  isExecutionLimitActive,
  isFiltered,
  shouldShowAllExecutions,
  onShowAllExecutions,
}: ExecutionsTableProps) {
  const { getPathWithExecutionTarget } = useExecutionTargetNavigation()
  const isList = variant === 'list'
  const isLatest = variant === 'latest'
  const tableClassName = isLatest ? 'table-fixed' : 'table-auto'
  const bodyClassName = isLatest
    ? '[&_td:not(:last-child)]:text-foreground/80'
    : '[&_td:not(:last-child)]:text-white/80'
  const executionHeadClassName = isLatest ? 'w-28 whitespace-normal' : 'whitespace-normal'
  const projectCellClassName = isLatest ? 'font-medium whitespace-normal break-words' : 'whitespace-normal break-words'
  const statusHeadClassName = isLatest ? 'w-28' : ''
  const clientClinicHeadClassName = isLatest
    ? 'hidden whitespace-normal lg:table-cell'
    : 'hidden whitespace-normal lg:table-cell lg:w-32'
  const createdAtHeadClassName = isLatest
    ? 'hidden w-28 whitespace-normal md:table-cell'
    : 'hidden w-24 whitespace-nowrap md:table-cell'

  return (
    <Table className={tableClassName}>
      <TableHeader>
        <TableRow>
          <TableHead className={executionHeadClassName}>{translations.columns.execution}</TableHead>
          <TableHead className="whitespace-normal">{translations.columns.project}</TableHead>
          <TableHead className={statusHeadClassName}>{translations.columns.status}</TableHead>
          <TableHead className={clientClinicHeadClassName}>{translations.columns.client}</TableHead>
          <TableHead className={clientClinicHeadClassName}>{translations.columns.clinic}</TableHead>
          {isList ? <TableHead className="whitespace-normal">{translations.columns.patients}</TableHead> : null}
          {isList ? (
            <TableHead className="hidden whitespace-normal 2xl:table-cell 2xl:w-36">
              {translations.columns.bot}
            </TableHead>
          ) : null}
          <TableHead className={createdAtHeadClassName}>{translations.columns.createdAt}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className={bodyClassName}>
        {executions.length > 0 ? (
          <>
            {executions.map((execution) => {
              const status = executionStatusReadModel
                ? getResolvedExecutionStatus(execution, executionStatusReadModel)
                : normalizeExecutionStatus(execution.status)
              const executionDayLabel = getExecutionDayLabel(execution)
              const displayNames = getExecutionDisplayNames(execution)
              const statusLabel = isLatest && getStatusLabel ? getStatusLabel(status) : undefined

              return (
                <TableRow key={execution._id}>
                  <TableCell className="whitespace-normal break-words">
                    <Link className="hover:underline" to={getPathWithExecutionTarget(`/execution/${execution._id}`)}>
                      {executionDayLabel}
                    </Link>
                  </TableCell>
                  <TableCell className={projectCellClassName}>{getExecutionProjectLabel(execution)}</TableCell>
                  <TableCell>
                    <ExecutionStatusLabel status={status} label={statusLabel} />
                  </TableCell>
                  <TableCell className="hidden whitespace-normal break-words lg:table-cell">
                    {displayNames.client || translations.emptyValue}
                  </TableCell>
                  <TableCell className="hidden whitespace-normal break-words lg:table-cell">
                    {displayNames.clinic || translations.emptyValue}
                  </TableCell>
                  {isList ? (
                    <TableCell className="whitespace-normal break-words">
                      <ExecutionPatientsDialog execution={execution} executionLabel={executionDayLabel} />
                    </TableCell>
                  ) : null}
                  {isList ? (
                    <TableCell className="hidden whitespace-normal break-words 2xl:table-cell">
                      {execution.botName || execution.bot || translations.emptyValue}
                    </TableCell>
                  ) : null}
                  <TableCell className="hidden whitespace-nowrap md:table-cell">
                    {formatExecutionDate(execution.createdAt)}
                  </TableCell>
                </TableRow>
              )
            })}
            {isList && isExecutionLimitActive && shouldShowAllExecutions ? (
              <TableRow>
                <ResponsiveTableRowCell className="h-16 text-center">
                  <Button variant="ghost" onClick={onShowAllExecutions}>
                    {translations.showAll}
                  </Button>
                </ResponsiveTableRowCell>
              </TableRow>
            ) : null}
          </>
        ) : isList ? (
          <TableRow>
            <ResponsiveTableRowCell className="h-28 text-center text-muted-foreground">
              {isFiltered ? translations.noFilteredExecutions : translations.noExecutions}
            </ResponsiveTableRowCell>
          </TableRow>
        ) : (
          <TableRow>
            <TableCell className="h-28 text-center text-muted-foreground" colSpan={6}>
              {translations.empty}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
