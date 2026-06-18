import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  formatExecutionDate,
  normalizeExecutionStatus,
  useExecutionTargetNavigation,
  type Execution,
  type ExecutionStatusReadModel,
} from '@/features/executions/shared'

import { ExecutionBotDialog } from './execution-bot-dialog'
import { ExecutionPatientsDialog } from './execution-patients-dialog'
import { ExecutionStatusLabel } from './execution-status-label'
import {
  getExecutionDisplayNames,
  getExecutionProjectLabel,
  getResolvedExecutionStatus,
} from '../lib/execution-listing-filters'
import { getExecutionDayLabel } from '../lib/execution-sidebar-display'

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
    creator: string
  }
  emptyValue: string
  empty: string
  noExecutions?: string
  noFilteredExecutions?: string
  showAll?: string
}

interface ExecutionsTableProps {
  executionStatusReadModel?: ExecutionStatusReadModel
  executions: Execution[]
  translations: ExecutionsTableTranslations
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
      <TableCell className={`md:hidden ${className}`} colSpan={8}>
        {children}
      </TableCell>
      <TableCell className={`hidden md:table-cell lg:hidden ${className}`} colSpan={8}>
        {children}
      </TableCell>
      <TableCell className={`hidden lg:table-cell 2xl:hidden ${className}`} colSpan={8}>
        {children}
      </TableCell>
      <TableCell className={`hidden 2xl:table-cell ${className}`} colSpan={8}>
        {children}
      </TableCell>
    </>
  )
}

export function ExecutionsTable({
  executionStatusReadModel,
  executions,
  translations,
  isExecutionLimitActive,
  isFiltered,
  shouldShowAllExecutions,
  onShowAllExecutions,
}: ExecutionsTableProps) {
  const { getPathWithExecutionTarget } = useExecutionTargetNavigation()

  const emptyMessage = isFiltered
    ? (translations.noFilteredExecutions ?? translations.empty)
    : (translations.noExecutions ?? translations.empty)

  return (
    <Table className="table-auto">
      <TableHeader>
        <TableRow>
          <TableHead className="whitespace-normal">{translations.columns.execution}</TableHead>
          <TableHead className="whitespace-normal">{translations.columns.project}</TableHead>
          <TableHead>{translations.columns.status}</TableHead>
          <TableHead className="hidden whitespace-normal lg:table-cell">{translations.columns.client}</TableHead>
          <TableHead className="hidden whitespace-normal lg:table-cell">{translations.columns.clinic}</TableHead>
          <TableHead className="whitespace-normal">{translations.columns.patients}</TableHead>
          <TableHead className="whitespace-normal">{translations.columns.bot}</TableHead>
          <TableHead className="hidden whitespace-nowrap md:table-cell">{translations.columns.creator}</TableHead>
          <TableHead className="hidden whitespace-nowrap md:table-cell">{translations.columns.createdAt}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_td:not(:last-child)]:text-foreground/80">
        {executions.length > 0 ? (
          <>
            {executions.map((execution) => {
              const status = executionStatusReadModel
                ? getResolvedExecutionStatus(execution, executionStatusReadModel)
                : normalizeExecutionStatus(execution.status)
              const executionDayLabel = getExecutionDayLabel(execution)
              const displayNames = getExecutionDisplayNames(execution)

              return (
                <TableRow key={execution._id}>
                  <TableCell className="whitespace-normal break-words">
                    <Link className="hover:underline" to={getPathWithExecutionTarget(`/execution/${execution._id}`)}>
                      {executionDayLabel}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">{getExecutionProjectLabel(execution)}</TableCell>
                  <TableCell>
                    <ExecutionStatusLabel status={status} />
                  </TableCell>
                  <TableCell className="hidden whitespace-normal break-words lg:table-cell">
                    {displayNames.client || translations.emptyValue}
                  </TableCell>
                  <TableCell className="hidden whitespace-normal break-words lg:table-cell">
                    {displayNames.clinic || translations.emptyValue}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">
                    <ExecutionPatientsDialog execution={execution} executionLabel={executionDayLabel} />
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">
                    <ExecutionBotDialog
                      execution={execution}
                      executionLabel={executionDayLabel}
                      emptyValue={translations.emptyValue}
                    />
                  </TableCell>
                  <TableCell className="hidden whitespace-normal break-words md:table-cell">
                    {execution.createdBy || translations.emptyValue}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap md:table-cell">
                    {formatExecutionDate(execution.createdAt)}
                  </TableCell>
                </TableRow>
              )
            })}
            {isExecutionLimitActive && shouldShowAllExecutions ? (
              <TableRow>
                <ResponsiveTableRowCell className="h-16 text-center">
                  <Button variant="ghost" onClick={onShowAllExecutions}>
                    {translations.showAll}
                  </Button>
                </ResponsiveTableRowCell>
              </TableRow>
            ) : null}
          </>
        ) : (
          <TableRow>
            <TableCell className="h-28 text-center text-muted-foreground" colSpan={9}>
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
