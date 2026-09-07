import { IconCopy } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  formatExecutionDate,
  getExecutionLabel,
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
  const { t: translateCommon } = useTranslation('common')

  const emptyMessage = isFiltered
    ? (translations.noFilteredExecutions ?? translations.empty)
    : (translations.noExecutions ?? translations.empty)

  const handleCopyExecution = async (executionLabel: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      toast.error(translateCommon('executionCopyFailed'))
      return
    }

    try {
      await navigator.clipboard.writeText(executionLabel)
      toast.success(translateCommon('executionCopied'))
    } catch {
      toast.error(translateCommon('executionCopyFailed'))
    }
  }

  return (
    <Table className="table-auto">
      <TableHeader>
        <TableRow>
          <TableHead className="w-40 max-w-40 whitespace-normal">{translations.columns.execution}</TableHead>
          <TableHead className="whitespace-normal">{translations.columns.project}</TableHead>
          <TableHead>{translations.columns.status}</TableHead>
          <TableHead className="hidden w-40 max-w-40 whitespace-normal lg:table-cell">
            {translations.columns.client}
          </TableHead>
          <TableHead className="hidden w-40 max-w-40 whitespace-normal lg:table-cell">
            {translations.columns.clinic}
          </TableHead>
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
              const executionLabel = getExecutionLabel(execution)
              const displayNames = getExecutionDisplayNames(execution)

              return (
                <TableRow key={execution._id}>
                  <TableCell className="w-40 max-w-40">
                    <div className="flex min-w-0 max-w-40 items-center gap-1">
                      <Link
                        className="min-w-0 flex-1 truncate hover:underline"
                        title={executionLabel}
                        to={getPathWithExecutionTarget(`/execution/${execution._id}`)}
                      >
                        {executionLabel}
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0"
                        aria-label={`${translateCommon('copyExecution')}: ${executionLabel}`}
                        title={translateCommon('copyExecution')}
                        onClick={() => void handleCopyExecution(executionLabel)}
                      >
                        <IconCopy />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">{getExecutionProjectLabel(execution)}</TableCell>
                  <TableCell>
                    <ExecutionStatusLabel status={status} />
                  </TableCell>
                  <TableCell className="hidden w-40 max-w-40 whitespace-normal break-words lg:table-cell">
                    {displayNames.client || translations.emptyValue}
                  </TableCell>
                  <TableCell className="hidden w-40 max-w-40 whitespace-normal break-words lg:table-cell">
                    {displayNames.clinic || translations.emptyValue}
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">
                    <ExecutionPatientsDialog execution={execution} executionLabel={executionLabel} />
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">
                    <ExecutionBotDialog
                      execution={execution}
                      executionLabel={executionLabel}
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
