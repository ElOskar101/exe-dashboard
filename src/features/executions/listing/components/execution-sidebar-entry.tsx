import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  getExecutionLabel,
  getScheduledExecutionCountdownLabel,
  isExecutionRunning,
  isWaitingScheduledExecution,
  normalizeExecutionStatus,
  type Execution,
  type ExecutionStatus,
} from '@/features/executions/shared'
import { getExecutionBotName } from '../lib/execution-bot-display'
import { getExecutionDayLabel, getRelativeCreatedAt, getStatusDotClassName } from '../lib/execution-sidebar-display'
import {
  SCHEDULED_EXECUTIONS_SECTION_ID,
  WAITING_SCHEDULED_STATUS_DOT_CLASS_NAME,
  type SidebarExecutionSectionId,
} from '../lib/executions-sidebar-sections'
import { ExecutionSidebarDeleteDialog } from './execution-sidebar-delete-dialog'

interface ExecutionSidebarEntryProps {
  currentExecutionId?: string
  currentTime: number
  emptyValueLabel: string
  execution: Execution
  getPathWithExecutionTarget: (path: string) => string
  isDeleteOpen: boolean
  isDeleting: boolean
  isMobileActionVisible: boolean
  onCloseSidebar?: () => void
  onDelete: (executionId: string, executionLabel: string) => void
  onDeleteOpenChange: (executionId: string, open: boolean) => void
  sectionId: SidebarExecutionSectionId
  sectionProjectTitle: string
  status?: ExecutionStatus
  tooltipMode: 'menu-button' | 'wrapped'
}

export function ExecutionSidebarEntry({
  currentExecutionId,
  currentTime,
  emptyValueLabel,
  execution,
  getPathWithExecutionTarget,
  isDeleteOpen,
  isDeleting,
  isMobileActionVisible,
  onCloseSidebar,
  onDelete,
  onDeleteOpenChange,
  sectionId,
  sectionProjectTitle,
  status: statusOverride,
  tooltipMode,
}: ExecutionSidebarEntryProps) {
  const { t } = useTranslation('executions')
  const label = getExecutionLabel(execution)
  const executionDayLabel = getExecutionDayLabel(execution)
  const secondaryLabel = getExecutionBotName(execution, emptyValueLabel)
  const relativeCreatedAt = getRelativeCreatedAt(execution.createdAt, currentTime)
  const projectTooltipLabel = t('sidebar.projectExecutionTooltip', { project: sectionProjectTitle, label })
  const tooltipLabel = relativeCreatedAt
    ? t('sidebar.executionRelativeLabel', { relativeCreatedAt, label: projectTooltipLabel })
    : projectTooltipLabel
  const status = statusOverride ?? normalizeExecutionStatus(execution.status)
  const isWaitingScheduled = isWaitingScheduledExecution(execution.scheduledAt, currentTime, status)
  const scheduledCountdownLabel =
    sectionId === SCHEDULED_EXECUTIONS_SECTION_ID
      ? getScheduledExecutionCountdownLabel(execution.scheduledAt, currentTime)
      : null

  const menuButton = (
    <SidebarMenuButton
      render={<Link to={getPathWithExecutionTarget(`/execution/${execution._id}`)} onClick={onCloseSidebar} />}
      isActive={currentExecutionId === execution._id}
      tooltip={tooltipMode === 'menu-button' ? tooltipLabel : undefined}
      className="h-auto min-h-9 items-start"
    >
      <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-0.5">
        <span
          aria-label={status}
          className={cn(
            'mt-1 size-2 shrink-0 rounded-full',
            isExecutionRunning(status)
              ? 'bg-blue-500'
              : isWaitingScheduled
                ? WAITING_SCHEDULED_STATUS_DOT_CLASS_NAME
                : getStatusDotClassName(status),
          )}
        />
        <div className="min-w-0">
          <div className="flex min-w-0 items-baseline gap-1">
            <span className="truncate">{executionDayLabel}</span>
            {scheduledCountdownLabel ? (
              <span className="shrink-0 text-xs text-sidebar-foreground/60">
                {t('sidebar.scheduledCountdown', { countdown: scheduledCountdownLabel })}
              </span>
            ) : null}
          </div>
          {secondaryLabel ? <div className="truncate text-xs text-sidebar-foreground/60">{secondaryLabel}</div> : null}
        </div>
      </div>
    </SidebarMenuButton>
  )

  return (
    <SidebarMenuItem>
      <div className="flex items-center">
        {tooltipMode === 'wrapped' ? (
          <Tooltip>
            <TooltipTrigger render={menuButton} />
            <TooltipContent side="right" align="center">
              {tooltipLabel}
            </TooltipContent>
          </Tooltip>
        ) : (
          menuButton
        )}
        <ExecutionSidebarDeleteDialog
          executionLabel={executionDayLabel}
          isDeleting={isDeleting}
          isMobileActionVisible={isMobileActionVisible}
          isOpen={isDeleteOpen}
          onDelete={() => onDelete(execution._id, executionDayLabel)}
          onOpenChange={(open) => onDeleteOpenChange(execution._id, open)}
        />
      </div>
    </SidebarMenuItem>
  )
}
