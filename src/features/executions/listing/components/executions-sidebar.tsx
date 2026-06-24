import { useContext, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import {
  IconAlertCircle,
  IconChevronDown,
  IconFolder,
  IconListFilled,
  IconLayoutSidebar,
  IconLayoutSidebarFilled,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconSmartHome,
} from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/sidebar-context'
import { useCurrentTime } from '@/hooks/use-current-time'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { cn } from '@/lib/utils'
import { AuthContext } from '@/features/auth'
import {
  executionKeys,
  getExecutions,
  useDeleteExecutionMutation,
  useExecutionTarget,
  useExecutionStatusReadModel,
  getExecutionLabel,
  isExecutionRunning,
  isScheduledExecution,
  isWaitingScheduledExecution,
  normalizeExecutionStatus,
  syncExecutionsFromListSnapshot,
  useExecutionTargetNavigation,
  usePlaywrightProjectsQuery,
  type Execution,
  type ExecutionQuery,
} from '@/features/executions/shared'
import { useScheduledExecutionStartToasts } from '../hooks/use-scheduled-execution-start-toasts'
import {
  getExecutionDayLabel,
  getRelativeCreatedAt,
  getStatusDotClassName,
  groupExecutionsByProject,
} from '../lib/execution-sidebar-display'
import { getExecutionBotName } from '../lib/execution-bot-display'
import { UNKNOWN_PROJECT_LABEL } from '../lib/execution-listing-filters'

const MIN_REFRESH_SPIN_DURATION_MS = 1000
const SIDEBAR_PROJECT_EXECUTIONS_LIMIT = 5
const NORMAL_EXECUTIONS_SECTION_ID = 'normal' as const
const SCHEDULED_EXECUTIONS_SECTION_ID = 'scheduled' as const
const WAITING_SCHEDULED_STATUS_DOT_CLASS_NAME = 'bg-purple-500'

type SidebarExecutionSectionId = typeof NORMAL_EXECUTIONS_SECTION_ID | typeof SCHEDULED_EXECUTIONS_SECTION_ID

interface SidebarExecutionProjectGroup {
  executions: Execution[]
  isExpanded: boolean
  isExpandable: boolean
  isFetching: boolean
  project: string
  totalCount: number
}

interface SidebarExecutionSection {
  groups: SidebarExecutionProjectGroup[]
  id: SidebarExecutionSectionId
  title: string
}

const getCreatedAtTime = (execution: Execution) => {
  const createdAtTime = new Date(execution.createdAt).getTime()

  return Number.isNaN(createdAtTime) ? 0 : createdAtTime
}

const sortExecutionsByCreatedAtDescending = (executions: Execution[]) =>
  [...executions].sort(
    (leftExecution, rightExecution) => getCreatedAtTime(rightExecution) - getCreatedAtTime(leftExecution),
  )

const getSectionProjectKey = (sectionId: SidebarExecutionSectionId, project: string) => `${sectionId}:${project}`

const createSidebarExecutionProjectGroup = ({
  executions,
  expandedSectionProjectKeys,
  isFetching,
  project,
  sectionId,
}: {
  executions: Execution[]
  expandedSectionProjectKeys: Set<string>
  isFetching: boolean
  project: string
  sectionId: SidebarExecutionSectionId
}): SidebarExecutionProjectGroup | null => {
  if (executions.length === 0) return null

  const sectionProjectKey = getSectionProjectKey(sectionId, project)
  const isExpanded = expandedSectionProjectKeys.has(sectionProjectKey)
  const sortedExecutions = sortExecutionsByCreatedAtDescending(
    groupExecutionsByProject(executions).flatMap((group) => group.executions),
  )

  return {
    executions: isExpanded ? sortedExecutions : sortedExecutions.slice(0, SIDEBAR_PROJECT_EXECUTIONS_LIMIT),
    isExpanded,
    isExpandable: sortedExecutions.length > SIDEBAR_PROJECT_EXECUTIONS_LIMIT,
    isFetching,
    project,
    totalCount: sortedExecutions.length,
  }
}

export function ExecutionsSidebar() {
  const { t } = useTranslation(['executions', 'common'])
  const { id: currentExecutionId } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isLoadingUser, user } = useContext(AuthContext)
  const { getPathWithExecutionTarget } = useExecutionTargetNavigation()
  const { isMobile, openMobile, setOpenMobile, state, toggleSidebar } = useSidebar()
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null)
  const [collapsedSectionProjectKeys, setCollapsedSectionProjectKeys] = useState<string[]>([])
  const [expandedSectionProjectKeys, setExpandedSectionProjectKeys] = useState<string[]>([])
  const [isRefreshSpinning, setIsRefreshSpinning] = useState(false)
  const refreshSpinnerTimeoutId = useRef<number | null>(null)
  const currentTime = useCurrentTime('second')
  const userFullName = user?.fullName
  const queryClient = useQueryClient()
  const { target } = useExecutionTarget()
  const playwrightProjectsQuery = usePlaywrightProjectsQuery(!isLoadingUser && Boolean(userFullName))
  const availableProjects = useMemo(
    () =>
      [...(playwrightProjectsQuery.data ?? [])]
        .filter((project) => project.name.trim())
        .sort((leftProject, rightProject) => leftProject.name.localeCompare(rightProject.name)),
    [playwrightProjectsQuery.data],
  )
  const expandedSectionProjectKeysSet = useMemo(() => new Set(expandedSectionProjectKeys), [expandedSectionProjectKeys])
  const projectExecutionsQueries = useQueries({
    queries: availableProjects.map((project) => {
      const query: ExecutionQuery = {
        by: userFullName ? [userFullName] : [],
        project: project.name,
      }

      return {
        queryKey: executionKeys.list(query, target.key),
        queryFn: async () => {
          const response = await getExecutions(target.requestTarget, query)

          return syncExecutionsFromListSnapshot(queryClient, response.data, target.key)
        },
        placeholderData: (previousData: Execution[] | undefined) => previousData,
        enabled: !isLoadingUser && Boolean(userFullName) && playwrightProjectsQuery.isSuccess,
      }
    }),
  })
  const executionStatusReadModel = useExecutionStatusReadModel()
  const deleteMutation = useDeleteExecutionMutation({
    onSuccess: async ([, deletedExecutionId]) => {
      setOpenDeleteId((currentOpenId) => (currentOpenId === deletedExecutionId ? null : currentOpenId))

      if (deletedExecutionId === currentExecutionId) {
        navigate(getPathWithExecutionTarget('/executions'))
      }
    },
  })
  const pendingDeleteId = deleteMutation.variables
  const executionSidebarSections = useMemo(() => {
    const unknownNormalExecutionsById = new Map<string, Execution>()
    const unknownScheduledExecutionsById = new Map<string, Execution>()
    const normalProjectGroups: SidebarExecutionProjectGroup[] = []
    const scheduledProjectGroups: SidebarExecutionProjectGroup[] = []

    for (const [index, project] of availableProjects.entries()) {
      const projectNormalExecutions: Execution[] = []
      const projectScheduledExecutions: Execution[] = []

      for (const execution of projectExecutionsQueries[index]?.data ?? []) {
        const executionProject = execution.project?.trim()
        const isScheduled = isScheduledExecution(execution)

        if (!executionProject) {
          const unknownExecutionsById = isScheduled ? unknownScheduledExecutionsById : unknownNormalExecutionsById

          unknownExecutionsById.set(execution._id, execution)
          continue
        }

        if (executionProject !== project.name) {
          continue
        }

        if (isScheduled) {
          projectScheduledExecutions.push(execution)
        } else {
          projectNormalExecutions.push(execution)
        }
      }

      const isFetching = projectExecutionsQueries[index]?.isFetching ?? false
      const normalGroup = createSidebarExecutionProjectGroup({
        executions: projectNormalExecutions,
        expandedSectionProjectKeys: expandedSectionProjectKeysSet,
        isFetching,
        project: project.name,
        sectionId: NORMAL_EXECUTIONS_SECTION_ID,
      })
      const scheduledGroup = createSidebarExecutionProjectGroup({
        executions: projectScheduledExecutions,
        expandedSectionProjectKeys: expandedSectionProjectKeysSet,
        isFetching,
        project: project.name,
        sectionId: SCHEDULED_EXECUTIONS_SECTION_ID,
      })

      if (normalGroup) normalProjectGroups.push(normalGroup)
      if (scheduledGroup) scheduledProjectGroups.push(scheduledGroup)
    }

    const isFetchingUnknownExecutions = projectExecutionsQueries.some((query) => query.isFetching)
    const unknownNormalGroup = createSidebarExecutionProjectGroup({
      executions: Array.from(unknownNormalExecutionsById.values()).map((execution) => ({
        ...execution,
        project: '',
      })),
      expandedSectionProjectKeys: expandedSectionProjectKeysSet,
      isFetching: isFetchingUnknownExecutions,
      project: UNKNOWN_PROJECT_LABEL,
      sectionId: NORMAL_EXECUTIONS_SECTION_ID,
    })
    const unknownScheduledGroup = createSidebarExecutionProjectGroup({
      executions: Array.from(unknownScheduledExecutionsById.values()).map((execution) => ({
        ...execution,
        project: '',
      })),
      expandedSectionProjectKeys: expandedSectionProjectKeysSet,
      isFetching: isFetchingUnknownExecutions,
      project: UNKNOWN_PROJECT_LABEL,
      sectionId: SCHEDULED_EXECUTIONS_SECTION_ID,
    })

    if (unknownNormalGroup) normalProjectGroups.push(unknownNormalGroup)
    if (unknownScheduledGroup) scheduledProjectGroups.push(unknownScheduledGroup)

    return {
      normal: normalProjectGroups,
      scheduled: scheduledProjectGroups,
    }
  }, [availableProjects, expandedSectionProjectKeysSet, projectExecutionsQueries])
  const visibleScheduledExecutions = useMemo(
    () => executionSidebarSections.scheduled.flatMap((group) => group.executions),
    [executionSidebarSections.scheduled],
  )
  useScheduledExecutionStartToasts(visibleScheduledExecutions, currentTime)
  const skeletonRows = useMemo(() => ['one', 'two', 'three', 'four'], [])
  const isCollapsedDesktop = state === 'collapsed' && !isMobile
  const isExecutionsLoading =
    playwrightProjectsQuery.isLoading || projectExecutionsQueries.some((query) => query.isLoading)
  const isExecutionsFetching =
    playwrightProjectsQuery.isFetching || projectExecutionsQueries.some((query) => query.isFetching)
  const isExecutionsError = playwrightProjectsQuery.isError || projectExecutionsQueries.some((query) => query.isError)
  const sidebarButtonLabel = isMobile
    ? openMobile
      ? 'Close executions sidebar'
      : 'Open executions sidebar'
    : state === 'expanded'
      ? 'Minimize executions sidebar'
      : 'Expand executions sidebar'
  const executionSections: SidebarExecutionSection[] = [
    {
      groups: executionSidebarSections.normal,
      id: NORMAL_EXECUTIONS_SECTION_ID,
      title: t('sidebar.title'),
    },
    {
      groups: executionSidebarSections.scheduled,
      id: SCHEDULED_EXECUTIONS_SECTION_ID,
      title: t('sidebar.scheduledTitle'),
    },
  ].filter((section) => section.groups.length > 0)
  const hasExecutionGroups = executionSections.length > 0

  useMountEffect(() => {
    return () => {
      if (refreshSpinnerTimeoutId.current !== null) {
        window.clearTimeout(refreshSpinnerTimeoutId.current)
      }
    }
  })

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const setProjectCollapsed = (sectionId: SidebarExecutionSectionId, project: string, collapsed: boolean) => {
    const sectionProjectKey = getSectionProjectKey(sectionId, project)

    setCollapsedSectionProjectKeys((currentProjectKeys) =>
      collapsed
        ? currentProjectKeys.includes(sectionProjectKey)
          ? currentProjectKeys
          : [...currentProjectKeys, sectionProjectKey]
        : currentProjectKeys.filter((currentProjectKey) => currentProjectKey !== sectionProjectKey),
    )
  }

  const setProjectExecutionsExpanded = (sectionId: SidebarExecutionSectionId, project: string, expanded: boolean) => {
    const sectionProjectKey = getSectionProjectKey(sectionId, project)

    setExpandedSectionProjectKeys((currentProjectKeys) =>
      expanded
        ? currentProjectKeys.includes(sectionProjectKey)
          ? currentProjectKeys
          : [...currentProjectKeys, sectionProjectKey]
        : currentProjectKeys.filter((currentProjectKey) => currentProjectKey !== sectionProjectKey),
    )
  }

  const refetchProjectExecutions = async () => {
    const refetches = [playwrightProjectsQuery.refetch(), ...projectExecutionsQueries.map((query) => query.refetch())]

    await Promise.all(refetches)
  }

  const handleRefresh = async () => {
    if (isExecutionsFetching || isRefreshSpinning) {
      return
    }

    const refreshStartedAt = Date.now()
    setIsRefreshSpinning(true)

    try {
      await refetchProjectExecutions()
    } finally {
      const elapsed = Date.now() - refreshStartedAt
      const remainingDuration = Math.max(MIN_REFRESH_SPIN_DURATION_MS - elapsed, 0)

      if (refreshSpinnerTimeoutId.current !== null) {
        window.clearTimeout(refreshSpinnerTimeoutId.current)
      }

      refreshSpinnerTimeoutId.current = window.setTimeout(() => {
        refreshSpinnerTimeoutId.current = null
        setIsRefreshSpinning(false)
      }, remainingDuration)
    }
  }

  const getExecutionSecondaryLabel = (execution: Execution) => getExecutionBotName(execution, t('list.emptyValue'))

  const getExecutionTriggerTooltip = (execution: Execution, project: string, label: string) => {
    const relativeCreatedAt = getRelativeCreatedAt(execution.createdAt, currentTime)
    const tooltipLabel = t('sidebar.projectExecutionTooltip', { project, label })

    return relativeCreatedAt
      ? t('sidebar.executionRelativeLabel', { relativeCreatedAt, label: tooltipLabel })
      : tooltipLabel
  }

  const renderCollapsedSidebarContent = () => (
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
                    render={<Link to={getPathWithExecutionTarget('/')} onClick={closeSidebarOnMobile} />}
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
                          <PopoverContent side="right" align="start" className="w-80 gap-3 p-3">
                            <PopoverHeader>
                              <PopoverTitle>{sectionProjectTitle}</PopoverTitle>
                            </PopoverHeader>
                            <SidebarMenu>
                              {group.executions.map((execution) => {
                                const label = getExecutionLabel(execution)
                                const executionDayLabel = getExecutionDayLabel(execution)
                                const secondaryLabel = getExecutionSecondaryLabel(execution)
                                const tooltipLabel = getExecutionTriggerTooltip(execution, sectionProjectTitle, label)
                                const status =
                                  executionStatusReadModel.data[execution._id]?.status ??
                                  normalizeExecutionStatus(execution.status)
                                const isWaitingScheduled = isWaitingScheduledExecution(
                                  execution.scheduledAt,
                                  currentTime,
                                )
                                const isDeleting = deleteMutation.isPending && pendingDeleteId === execution._id

                                return (
                                  <SidebarMenuItem key={execution._id}>
                                    <div className="flex items-center">
                                      <SidebarMenuButton
                                        render={<Link to={getPathWithExecutionTarget(`/execution/${execution._id}`)} />}
                                        isActive={currentExecutionId === execution._id}
                                        tooltip={tooltipLabel}
                                        className="h-auto min-h-9 items-start"
                                      >
                                        <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-0.5">
                                          {isExecutionRunning(status) ? (
                                            <Spinner
                                              aria-label={status}
                                              className="mt-0.5 size-3 shrink-0 text-blue-500"
                                            />
                                          ) : (
                                            <span
                                              aria-label={status}
                                              className={cn(
                                                'mt-1 size-2 shrink-0 rounded-full',
                                                isWaitingScheduled
                                                  ? WAITING_SCHEDULED_STATUS_DOT_CLASS_NAME
                                                  : getStatusDotClassName(status),
                                              )}
                                            />
                                          )}
                                          <div className="min-w-0">
                                            <div className="truncate">{executionDayLabel}</div>
                                            <div className="truncate text-xs text-sidebar-foreground/60">
                                              {secondaryLabel}
                                            </div>
                                          </div>
                                        </div>
                                      </SidebarMenuButton>
                                      <AlertDialog
                                        open={openDeleteId === execution._id}
                                        onOpenChange={(open) => {
                                          if (isDeleting) return

                                          setOpenDeleteId(open ? execution._id : null)
                                        }}
                                      >
                                        <AlertDialogTrigger
                                          render={
                                            <SidebarMenuAction
                                              className="right-2 !top-1/2 !-translate-y-1/2 hover:bg-sidebar-accent/60"
                                              aria-label={t('sidebar.deleteAction', {
                                                execution: executionDayLabel,
                                              })}
                                              disabled={isDeleting}
                                            >
                                              <IconTrash />
                                            </SidebarMenuAction>
                                          }
                                        />
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>{t('sidebar.deleteTitle')}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              {t('sidebar.deleteDescription', {
                                                execution: executionDayLabel,
                                              })}
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isDeleting}>
                                              {t('sidebar.cancelDelete')}
                                            </AlertDialogCancel>
                                            <Button
                                              variant="destructive"
                                              disabled={isDeleting}
                                              onClick={() => deleteMutation.mutate(execution._id)}
                                            >
                                              {isDeleting ? <Spinner data-icon="inline-start" /> : null}
                                              {isDeleting ? t('sidebar.deleting') : t('sidebar.confirmDelete')}
                                            </Button>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </SidebarMenuItem>
                                )
                              })}
                            </SidebarMenu>
                            {group.isExpandable ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                disabled={group.isFetching}
                                onClick={() =>
                                  setProjectExecutionsExpanded(section.id, group.project, !group.isExpanded)
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

  const renderExpandedSidebarContent = () => (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-1">
          <Button
            nativeButton={false}
            render={<Link to={getPathWithExecutionTarget('/')} onClick={closeSidebarOnMobile} />}
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
            {isMobile || state === 'expanded' ? (
              <IconLayoutSidebar className="size-4" />
            ) : (
              <IconLayoutSidebarFilled className="size-4" />
            )}
          </Button>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to={getPathWithExecutionTarget('/')} onClick={closeSidebarOnMobile} />}
              isActive={pathname === '/'}
              tooltip={t('sidebar.home')}
            >
              <span>{t('sidebar.home')}</span>
              <IconSmartHome className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to={getPathWithExecutionTarget('/executions')} onClick={closeSidebarOnMobile} />}
              isActive={pathname === '/executions'}
              tooltip={t('sidebar.allExecutions')}
            >
              <span>{t('sidebar.allExecutions')}</span>
              <IconListFilled className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to={getPathWithExecutionTarget('/create')} onClick={closeSidebarOnMobile} />}
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
                {skeletonRows.map((row) => (
                  <SidebarMenuSkeleton key={row} showIcon />
                ))}
              </div>
            ) : null}

            {isExecutionsError ? (
              <Alert className="m-2">
                <IconAlertCircle />
                <AlertTitle>{t('sidebar.loadErrorTitle')}</AlertTitle>
                <AlertDescription>{t('sidebar.loadErrorDescription')}</AlertDescription>
                <Button
                  className="mt-3 w-fit"
                  size="sm"
                  variant="outline"
                  onClick={() => void refetchProjectExecutions()}
                >
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
                          onClick={() => void handleRefresh()}
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
                            onOpenChange={(open) => setProjectCollapsed(section.id, group.project, !open)}
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
                                  const label = getExecutionLabel(execution)
                                  const executionDayLabel = getExecutionDayLabel(execution)
                                  const secondaryLabel = getExecutionSecondaryLabel(execution)
                                  const tooltipLabel = getExecutionTriggerTooltip(execution, sectionProjectTitle, label)
                                  const status =
                                    executionStatusReadModel.data[execution._id]?.status ??
                                    normalizeExecutionStatus(execution.status)
                                  const isWaitingScheduled = isWaitingScheduledExecution(
                                    execution.scheduledAt,
                                    currentTime,
                                  )
                                  const isDeleting = deleteMutation.isPending && pendingDeleteId === execution._id

                                  return (
                                    <SidebarMenuItem key={execution._id}>
                                      <div className="flex items-center">
                                        <Tooltip>
                                          <TooltipTrigger
                                            render={
                                              <SidebarMenuButton
                                                render={
                                                  <Link
                                                    to={getPathWithExecutionTarget(`/execution/${execution._id}`)}
                                                    onClick={closeSidebarOnMobile}
                                                  />
                                                }
                                                isActive={currentExecutionId === execution._id}
                                                className="h-auto min-h-9 items-start"
                                              >
                                                <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-0.5">
                                                  {isExecutionRunning(status) ? (
                                                    <Spinner
                                                      aria-label={status}
                                                      className="mt-0.5 size-3 shrink-0 text-blue-500"
                                                    />
                                                  ) : (
                                                    <span
                                                      aria-label={status}
                                                      className={cn(
                                                        'mt-1 size-2 shrink-0 rounded-full',
                                                        isWaitingScheduled
                                                          ? WAITING_SCHEDULED_STATUS_DOT_CLASS_NAME
                                                          : getStatusDotClassName(status),
                                                      )}
                                                    />
                                                  )}
                                                  <div className="min-w-0">
                                                    <div className="truncate">{executionDayLabel}</div>
                                                    {secondaryLabel ? (
                                                      <div className="truncate text-xs text-sidebar-foreground/60">
                                                        {secondaryLabel}
                                                      </div>
                                                    ) : null}
                                                  </div>
                                                </div>
                                              </SidebarMenuButton>
                                            }
                                          />
                                          <TooltipContent side="right" align="center">
                                            {tooltipLabel}
                                          </TooltipContent>
                                        </Tooltip>
                                        <AlertDialog
                                          open={openDeleteId === execution._id}
                                          onOpenChange={(open) => {
                                            if (isDeleting) return

                                            setOpenDeleteId(open ? execution._id : null)
                                          }}
                                        >
                                          <AlertDialogTrigger
                                            render={
                                              <SidebarMenuAction
                                                className={cn(
                                                  'right-2 !top-1/2 !-translate-y-1/2 hover:bg-sidebar-accent/60',
                                                  isMobile
                                                    ? 'opacity-100'
                                                    : 'opacity-0 hover:opacity-100 aria-expanded:opacity-100 peer-hover/menu-button:opacity-100',
                                                )}
                                                aria-label={t('sidebar.deleteAction', {
                                                  execution: executionDayLabel,
                                                })}
                                                disabled={isDeleting}
                                              >
                                                <IconTrash />
                                              </SidebarMenuAction>
                                            }
                                          />
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>{t('sidebar.deleteTitle')}</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                {t('sidebar.deleteDescription', {
                                                  execution: executionDayLabel,
                                                })}
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel disabled={isDeleting}>
                                                {t('sidebar.cancelDelete')}
                                              </AlertDialogCancel>
                                              <Button
                                                variant="destructive"
                                                disabled={isDeleting}
                                                onClick={() => deleteMutation.mutate(execution._id)}
                                              >
                                                {isDeleting ? <Spinner data-icon="inline-start" /> : null}
                                                {isDeleting ? t('sidebar.deleting') : t('sidebar.confirmDelete')}
                                              </Button>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </SidebarMenuItem>
                                  )
                                })}
                              </SidebarMenu>
                              {group.isExpandable ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="mt-1 w-full justify-start"
                                  disabled={group.isFetching}
                                  onClick={() =>
                                    setProjectExecutionsExpanded(section.id, group.project, !group.isExpanded)
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

  return (
    <Sidebar collapsible="icon">
      <div className="relative size-full overflow-hidden">
        <div
          aria-hidden={isCollapsedDesktop}
          inert={isCollapsedDesktop ? true : undefined}
          className={cn(
            'absolute inset-0 flex flex-col transition-[opacity,transform] duration-200 ease-out',
            isCollapsedDesktop ? 'pointer-events-none -translate-x-2 opacity-0' : 'translate-x-0 opacity-100 delay-75',
          )}
        >
          {renderExpandedSidebarContent()}
        </div>
        <div
          aria-hidden={!isCollapsedDesktop}
          inert={!isCollapsedDesktop ? true : undefined}
          className={cn(
            'absolute inset-0 flex flex-col transition-[opacity,transform] duration-200 ease-out',
            isCollapsedDesktop ? 'translate-x-0 opacity-100 delay-75' : 'pointer-events-none translate-x-2 opacity-0',
          )}
        >
          {renderCollapsedSidebarContent()}
        </div>
      </div>
    </Sidebar>
  )
}
