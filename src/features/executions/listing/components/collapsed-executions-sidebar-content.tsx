import { Link } from 'react-router-dom'
import { IconFolder, IconListFilled, IconLayoutSidebar, IconPlus, IconSmartHome } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ExecutionStatus } from '@/features/executions/shared'
import {
  getSectionProjectKey,
  SCHEDULED_EXECUTIONS_SECTION_ID,
  type SidebarExecutionSection,
  type SidebarExecutionSectionId,
} from '../lib/executions-sidebar-sections'
import { ExecutionSidebarEntry } from './execution-sidebar-entry'

interface CollapsedExecutionsSidebarContentProps {
  currentExecutionId?: string
  currentTime: number
  emptyValueLabel: string
  executionStatusById: Record<string, { status?: ExecutionStatus }>
  executionSections: SidebarExecutionSection[]
  getPathWithExecutionTarget: (path: string) => string
  isDeletePending: boolean
  onCloseSidebarOnMobile: () => void
  onDeleteExecution: (executionId: string, executionLabel: string) => void
  onDeleteOpenChange: (executionId: string, open: boolean) => void
  onProjectExecutionsExpandedChange: (sectionId: SidebarExecutionSectionId, project: string, expanded: boolean) => void
  openDeleteId: string | null
  pathname: string
  pendingDeleteId?: string
  sidebarButtonLabel: string
  t: (key: string, options?: Record<string, unknown>) => string
  toggleSidebar: () => void
}

export function CollapsedExecutionsSidebarContent({
  currentExecutionId,
  currentTime,
  emptyValueLabel,
  executionStatusById,
  executionSections,
  getPathWithExecutionTarget,
  isDeletePending,
  onCloseSidebarOnMobile,
  onDeleteExecution,
  onDeleteOpenChange,
  onProjectExecutionsExpandedChange,
  openDeleteId,
  pathname,
  pendingDeleteId,
  sidebarButtonLabel,
  t,
  toggleSidebar,
}: CollapsedExecutionsSidebarContentProps) {
  return (
    <>
      <SidebarHeader className="items-center">
        <SidebarMenu className="items-center">
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={sidebarButtonLabel}
                    title={sidebarButtonLabel}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={toggleSidebar}
                  >
                    <IconLayoutSidebar />
                  </Button>
                }
              />
              <TooltipContent side="right" align="center">
                {sidebarButtonLabel}
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    nativeButton={false}
                    render={<Link to={getPathWithExecutionTarget('/')} onClick={onCloseSidebarOnMobile} />}
                    variant={pathname === '/' ? 'secondary' : 'ghost'}
                    size="icon-sm"
                    aria-label={t('sidebar.home')}
                    title={t('sidebar.home')}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <IconSmartHome />
                  </Button>
                }
              />
              <TooltipContent side="right" align="center">
                {t('sidebar.home')}
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    nativeButton={false}
                    render={<Link to={getPathWithExecutionTarget('/executions')} />}
                    variant={pathname === '/executions' ? 'secondary' : 'ghost'}
                    size="icon-sm"
                    aria-label={t('sidebar.allExecutions')}
                    title={t('sidebar.allExecutions')}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <IconListFilled />
                  </Button>
                }
              />
              <TooltipContent side="right" align="center">
                {t('sidebar.allExecutions')}
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    nativeButton={false}
                    render={<Link to={getPathWithExecutionTarget('/create')} />}
                    variant={pathname === '/create' ? 'secondary' : 'ghost'}
                    size="icon-sm"
                    aria-label={t('sidebar.createExecution')}
                    title={t('sidebar.createExecution')}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <IconPlus />
                  </Button>
                }
              />
              <TooltipContent side="right" align="center">
                {t('sidebar.createExecution')}
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="items-center">
        <SidebarGroup className="items-center px-0">
          <SidebarGroupContent>
            <SidebarMenu className="items-center gap-1">
              {executionSections.flatMap((section) =>
                section.groups.map((group) => {
                  const sectionProjectTitle =
                    section.id === SCHEDULED_EXECUTIONS_SECTION_ID
                      ? t('sidebar.scheduledProjectTitle', { project: group.project })
                      : group.project
                  const projectExecutionsLabel = t('sidebar.projectExecutions', { project: sectionProjectTitle })
                  const hasActiveExecution = group.executions.some((execution) => execution._id === currentExecutionId)

                  return (
                    <SidebarMenuItem key={getSectionProjectKey(section.id, group.project)}>
                      <Tooltip>
                        <Popover>
                          <TooltipTrigger
                            render={
                              <PopoverTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant={hasActiveExecution ? 'secondary' : 'ghost'}
                                    size="icon-sm"
                                    aria-label={projectExecutionsLabel}
                                    title={projectExecutionsLabel}
                                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                  >
                                    <IconFolder />
                                  </Button>
                                }
                              />
                            }
                          />
                          <TooltipContent side="right" align="center">
                            {sectionProjectTitle}
                          </TooltipContent>
                          <PopoverContent
                            side="right"
                            align="start"
                            className="max-h-(--available-height) w-80 gap-3 overflow-y-auto p-3"
                          >
                            <PopoverHeader>
                              <PopoverTitle>{sectionProjectTitle}</PopoverTitle>
                            </PopoverHeader>
                            <SidebarMenu>
                              {group.executions.map((execution) => {
                                const isDeleting = isDeletePending && pendingDeleteId === execution._id

                                return (
                                  <ExecutionSidebarEntry
                                    key={execution._id}
                                    currentExecutionId={currentExecutionId}
                                    currentTime={currentTime}
                                    emptyValueLabel={emptyValueLabel}
                                    execution={execution}
                                    getPathWithExecutionTarget={getPathWithExecutionTarget}
                                    isDeleteOpen={openDeleteId === execution._id}
                                    isDeleting={isDeleting}
                                    isMobileActionVisible
                                    onDelete={onDeleteExecution}
                                    onDeleteOpenChange={onDeleteOpenChange}
                                    sectionId={section.id}
                                    sectionProjectTitle={sectionProjectTitle}
                                    status={executionStatusById[execution._id]?.status}
                                    tooltipMode="menu-button"
                                  />
                                )
                              })}
                            </SidebarMenu>
                            {group.isExpandable ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                className="w-full text-xs font-normal text-sidebar-foreground!"
                                disabled={group.isFetching}
                                onClick={() =>
                                  onProjectExecutionsExpandedChange(section.id, group.project, !group.isExpanded)
                                }
                              >
                                {group.isFetching ? <Spinner data-icon="inline-start" /> : null}
                                {group.isFetching
                                  ? t('sidebar.loadingMore')
                                  : group.isExpanded
                                    ? t('sidebar.showLess')
                                    : t('sidebar.showAll')}
                              </Button>
                            ) : null}
                          </PopoverContent>
                        </Popover>
                      </Tooltip>
                    </SidebarMenuItem>
                  )
                }),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  )
}
