import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  IconAlertCircle,
  IconChevronDown,
  IconListDetails,
  IconPlus,
  IconRefresh,
  IconTrash,
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
import { Spinner } from '@/components/ui/spinner'
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
} from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/sidebar-context'
import { useCurrentTime } from '@/hooks/use-current-time'
import { useMountEffect } from '@/hooks/use-mount-effect'
import { cn } from '@/lib/utils'
import {
  useDeleteExecutionMutation,
  useExecutionsQuery,
  useExecutionStatusReadModel,
  getExecutionLabel,
  isExecutionRunning,
  normalizeExecutionStatus,
} from '@/features/executions/shared'
import { useExecutionStatusUpdates } from '../hooks/use-execution-status-updates'
import {
  getExecutionDayLabel,
  getRelativeCreatedAt,
  getStatusDotClassName,
  groupExecutionsByProject,
} from '../lib/execution-sidebar-display'

const MIN_REFRESH_SPIN_DURATION_MS = 1000

export function ExecutionsSidebar() {
  const { t } = useTranslation('executions')
  const { id: currentExecutionId } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isMobile, setOpenMobile } = useSidebar()
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null)
  const [collapsedProjects, setCollapsedProjects] = useState<string[]>([])
  const [isRefreshSpinning, setIsRefreshSpinning] = useState(false)
  const refreshSpinnerTimeoutId = useRef<number | null>(null)
  const currentTime = useCurrentTime()
  useExecutionStatusUpdates()
  const executionsQuery = useExecutionsQuery()
  const executionStatusReadModel = useExecutionStatusReadModel()
  const deleteMutation = useDeleteExecutionMutation({
    onSuccess: async ([, deletedExecutionId]) => {
      setOpenDeleteId((currentOpenId) => (currentOpenId === deletedExecutionId ? null : currentOpenId))

      if (deletedExecutionId === currentExecutionId) {
        navigate('/')
      }
    },
  })
  const pendingDeleteId = deleteMutation.variables
  const executions = executionsQuery.data
  const executionProjectGroups = useMemo(() => groupExecutionsByProject(executions ?? []), [executions])
  const skeletonRows = useMemo(() => ['one', 'two', 'three', 'four'], [])

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

  const setProjectCollapsed = (project: string, collapsed: boolean) => {
    setCollapsedProjects((currentProjects) =>
      collapsed
        ? currentProjects.includes(project)
          ? currentProjects
          : [...currentProjects, project]
        : currentProjects.filter((currentProject) => currentProject !== project),
    )
  }

  const handleRefresh = async () => {
    if (executionsQuery.isFetching || isRefreshSpinning) {
      return
    }

    const refreshStartedAt = Date.now()
    setIsRefreshSpinning(true)

    try {
      await executionsQuery.refetch()
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

  return (
    <Sidebar collapsible="none">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to="/" onClick={closeSidebarOnMobile} />}
              isActive={pathname === '/'}
              tooltip={t('sidebar.createExecution')}
            >
              <span>{t('sidebar.createExecution')}</span>
              <IconPlus className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to="/executions" onClick={closeSidebarOnMobile} />}
              isActive={pathname === '/executions'}
              tooltip={t('sidebar.allExecutions')}
            >
              <span>{t('sidebar.allExecutions')}</span>
              <IconListDetails className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="sticky top-0 z-30 flex items-center justify-between rounded-none bg-sidebar">
            <SidebarGroupLabel className="rounded-none bg-transparent px-3">{t('sidebar.title')}</SidebarGroupLabel>
            <Button
              aria-label={t('sidebar.refreshList')}
              title={t('sidebar.refreshList')}
              variant="ghost"
              size="icon-xs"
              className="mr-3 size-6 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:not-aria-[haspopup]:translate-y-0"
              disabled={executionsQuery.isFetching || isRefreshSpinning}
              onClick={() => void handleRefresh()}
            >
              <IconRefresh
                className={cn(
                  'size-3.5',
                  (executionsQuery.isFetching || isRefreshSpinning) && 'animate-spin [animation-direction:reverse]',
                )}
              />
            </Button>
          </div>
          <SidebarGroupContent>
            {executionsQuery.isLoading ? (
              <div className="flex flex-col gap-1">
                {skeletonRows.map((row) => (
                  <SidebarMenuSkeleton key={row} showIcon />
                ))}
              </div>
            ) : null}

            {executionsQuery.isError ? (
              <Alert className="m-2">
                <IconAlertCircle />
                <AlertTitle>{t('sidebar.loadErrorTitle')}</AlertTitle>
                <AlertDescription>{t('sidebar.loadErrorDescription')}</AlertDescription>
                <Button
                  className="mt-3 w-fit"
                  size="sm"
                  variant="outline"
                  onClick={() => void executionsQuery.refetch()}
                >
                  {t('sidebar.retry')}
                </Button>
              </Alert>
            ) : null}

            {!executionsQuery.isLoading && !executionsQuery.isError && executionProjectGroups.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">{t('sidebar.empty')}</div>
            ) : null}

            {executionProjectGroups.length > 0 ? (
              <div className="flex flex-col gap-3">
                {executionProjectGroups.map((group) => {
                  const isOpen = !collapsedProjects.includes(group.project)

                  return (
                    <Collapsible
                      key={group.project}
                      open={isOpen}
                      onOpenChange={(open) => setProjectCollapsed(group.project, !open)}
                      className="min-w-0"
                    >
                      <CollapsibleTrigger render={<Button variant="ghost" className="w-full" />}>
                        <IconChevronDown
                          className={cn('size-3.5 shrink-0 transition-transform', !isOpen && '-rotate-90')}
                        />
                        <span className="truncate">{group.project}</span>
                        <span className="ml-auto shrink-0 text-[10px] tracking-[0.18em] uppercase text-sidebar-foreground/55">
                          {group.executions.length}
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenu>
                          {group.executions.map((execution) => {
                            const label = getExecutionLabel(execution)
                            const executionDayLabel = getExecutionDayLabel(execution)
                            const relativeCreatedAt = getRelativeCreatedAt(execution.createdAt, currentTime)
                            const status =
                              executionStatusReadModel.data[execution._id] ?? normalizeExecutionStatus(execution.status)
                            const isDeleting = deleteMutation.isPending && pendingDeleteId === execution._id

                            return (
                              <SidebarMenuItem key={execution._id}>
                                <div className="flex items-center">
                                  <SidebarMenuButton
                                    render={<Link to={`/execution/${execution._id}`} onClick={closeSidebarOnMobile} />}
                                    isActive={currentExecutionId === execution._id}
                                    tooltip={`${group.project} ${label}`}
                                    className="h-auto min-h-9 items-start"
                                  >
                                    <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-0.5">
                                      {isExecutionRunning(status) ? (
                                        <Spinner aria-label={status} className="mt-0.5 size-3 shrink-0 text-blue-500" />
                                      ) : (
                                        <span
                                          aria-label={status}
                                          className={cn(
                                            'mt-1 size-2 shrink-0 rounded-full',
                                            getStatusDotClassName(status),
                                          )}
                                        />
                                      )}
                                      <div className="min-w-0">
                                        <div className="truncate">{executionDayLabel}</div>
                                        {relativeCreatedAt ? (
                                          <div className="truncate text-xs text-sidebar-foreground/60">
                                            {relativeCreatedAt}
                                          </div>
                                        ) : null}
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
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            ) : null}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
