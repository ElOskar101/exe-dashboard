import { Link } from 'react-router-dom'
import {
  IconAlertCircle,
  IconChevronDown,
  IconListFilled,
  IconLayoutSidebar,
  IconLayoutSidebarFilled,
  IconPlus,
  IconRefresh,
  IconSmartHome,
} from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { ExecutionStatus } from '@/features/executions/shared'
import {
  getSectionProjectKey,
  SCHEDULED_EXECUTIONS_SECTION_ID,
  type SidebarExecutionSection,
  type SidebarExecutionSectionId,
} from '../lib/executions-sidebar-sections'
import { ExecutionSidebarEntry } from './execution-sidebar-entry'

const SKELETON_ROWS = ['one', 'two', 'three', 'four']

interface ExpandedExecutionsSidebarContentProps {
  collapsedSectionProjectKeys: string[]
  currentExecutionId?: string
  currentTime: number
  emptyValueLabel: string
  executionStatusById: Record<string, { status?: ExecutionStatus }>
  executionSections: SidebarExecutionSection[]
  getPathWithExecutionTarget: (path: string) => string
  hasExecutionGroups: boolean
  isDeletePending: boolean
  isExecutionsError: boolean
  isExecutionsFetching: boolean
  isExecutionsLoading: boolean
  isMobile: boolean
  isRefreshSpinning: boolean
  onCloseSidebarOnMobile: () => void
  onDeleteExecution: (executionId: string, executionLabel: string) => void
  onDeleteOpenChange: (executionId: string, open: boolean) => void
  onProjectCollapsedChange: (sectionId: SidebarExecutionSectionId, project: string, collapsed: boolean) => void
  onProjectExecutionsExpandedChange: (sectionId: SidebarExecutionSectionId, project: string, expanded: boolean) => void
  onRefresh: () => void
  onRetry: () => void
  openDeleteId: string | null
  pathname: string
  pendingDeleteId?: string
  sidebarButtonLabel: string
  sidebarState: 'expanded' | 'collapsed'
  t: (key: string, options?: Record<string, unknown>) => string
  toggleSidebar: () => void
}

export function ExpandedExecutionsSidebarContent({
  collapsedSectionProjectKeys,
  currentExecutionId,
  currentTime,
  emptyValueLabel,
  executionStatusById,
  executionSections,
  getPathWithExecutionTarget,
  hasExecutionGroups,
  isDeletePending,
  isExecutionsError,
  isExecutionsFetching,
  isExecutionsLoading,
  isMobile,
  isRefreshSpinning,
  onCloseSidebarOnMobile,
  onDeleteExecution,
  onDeleteOpenChange,
  onProjectCollapsedChange,
  onProjectExecutionsExpandedChange,
  onRefresh,
  onRetry,
  openDeleteId,
  pathname,
  pendingDeleteId,
  sidebarButtonLabel,
  sidebarState,
  t,
  toggleSidebar,
}: ExpandedExecutionsSidebarContentProps) {
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-1">
          <Button
            nativeButton={false}
            render={<Link to={getPathWithExecutionTarget('/')} onClick={onCloseSidebarOnMobile} />}
            variant="ghost"
            aria-label={t('common:project-name')}
            title={t('common:project-name')}
            className="size-9 rounded-lg p-1.5 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <img className="size-6 object-contain" src="/favicon.svg" alt={t('common:project-name')} />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={sidebarButtonLabel}
            title={sidebarButtonLabel}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={toggleSidebar}
          >
            {isMobile || sidebarState === 'expanded' ? (
              <IconLayoutSidebar className="size-4" />
            ) : (
              <IconLayoutSidebarFilled className="size-4" />
            )}
          </Button>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to={getPathWithExecutionTarget('/')} onClick={onCloseSidebarOnMobile} />}
              isActive={pathname === '/'}
              tooltip={t('sidebar.home')}
            >
              <span>{t('sidebar.home')}</span>
              <IconSmartHome className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to={getPathWithExecutionTarget('/executions')} onClick={onCloseSidebarOnMobile} />}
              isActive={pathname === '/executions'}
              tooltip={t('sidebar.allExecutions')}
            >
              <span>{t('sidebar.allExecutions')}</span>
              <IconListFilled className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to={getPathWithExecutionTarget('/create')} onClick={onCloseSidebarOnMobile} />}
              isActive={pathname === '/create'}
              tooltip={t('sidebar.createExecution')}
            >
              <span>{t('sidebar.createExecution')}</span>
              <IconPlus className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {isExecutionsLoading ? (
              <div className="flex flex-col gap-1">
                {SKELETON_ROWS.map((row) => (
                  <SidebarMenuSkeleton key={row} showIcon />
                ))}
              </div>
            ) : null}

            {isExecutionsError ? (
              <Alert className="m-2">
                <IconAlertCircle />
                <AlertTitle>{t('sidebar.loadErrorTitle')}</AlertTitle>
                <AlertDescription>{t('sidebar.loadErrorDescription')}</AlertDescription>
                <Button className="mt-3 w-fit" size="sm" variant="outline" onClick={onRetry}>
                  {t('sidebar.retry')}
                </Button>
              </Alert>
            ) : null}

            {!isExecutionsLoading && !isExecutionsError && !hasExecutionGroups ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">{t('sidebar.empty')}</div>
            ) : null}

            {hasExecutionGroups ? (
              <div className="flex flex-col gap-4">
                {executionSections.map((section, sectionIndex) => (
                  <div key={section.id} className="min-w-0">
                    <div className="sticky top-0 z-30 flex items-center justify-between rounded-none bg-sidebar">
                      <SidebarGroupLabel className="rounded-none bg-transparent px-3">
                        {section.title}
                      </SidebarGroupLabel>
                      {sectionIndex === 0 ? (
                        <Button
                          aria-label={t('sidebar.refreshList')}
                          title={t('sidebar.refreshList')}
                          variant="ghost"
                          size="icon-xs"
                          className="mr-3 size-6 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:not-aria-[haspopup]:translate-y-0"
                          disabled={isExecutionsFetching || isRefreshSpinning}
                          onClick={onRefresh}
                        >
                          <IconRefresh
                            className={cn(
                              'size-3.5',
                              (isExecutionsFetching || isRefreshSpinning) &&
                                'animate-spin [animation-direction:reverse]',
                            )}
                          />
                        </Button>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-3">
                      {section.groups.map((group) => {
                        const sectionProjectKey = getSectionProjectKey(section.id, group.project)
                        const sectionProjectTitle =
                          section.id === SCHEDULED_EXECUTIONS_SECTION_ID
                            ? t('sidebar.sectionProjectTitle', { section: section.title, project: group.project })
                            : group.project
                        const isOpen = !collapsedSectionProjectKeys.includes(sectionProjectKey)

                        return (
                          <Collapsible
                            key={sectionProjectKey}
                            open={isOpen}
                            onOpenChange={(open) => onProjectCollapsedChange(section.id, group.project, !open)}
                            className="min-w-0"
                          >
                            <CollapsibleTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  className="w-full aria-expanded:bg-transparent aria-expanded:text-sidebar-foreground"
                                />
                              }
                            >
                              <IconChevronDown
                                className={cn('size-3.5 shrink-0 transition-transform', !isOpen && '-rotate-90')}
                              />
                              <span className="truncate">{group.project}</span>
                              <span className="ml-auto shrink-0 text-xs text-sidebar-foreground/55">
                                {group.totalCount}
                              </span>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
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
                                      isMobileActionVisible={isMobile}
                                      onCloseSidebar={onCloseSidebarOnMobile}
                                      onDelete={onDeleteExecution}
                                      onDeleteOpenChange={onDeleteOpenChange}
                                      sectionId={section.id}
                                      sectionProjectTitle={sectionProjectTitle}
                                      status={executionStatusById[execution._id]?.status}
                                      tooltipMode="wrapped"
                                    />
                                  )
                                })}
                              </SidebarMenu>
                              {group.isExpandable ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  className="mt-1 w-full justify-start text-xs font-normal"
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
                            </CollapsibleContent>
                          </Collapsible>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  )
}
