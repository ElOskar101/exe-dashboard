import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconAlertCircle, IconChevronDown, IconLoader2, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react'
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
import { useMountEffect } from '@/hooks/use-mount-effect'
import { cn } from '@/lib/utils'
import {
  deleteExecution,
  getExecutionLabel,
  getExecutions,
  isExecutionRunning,
  normalizeExecutionStatus,
} from '@/features/executions/shared'
import { useExecutionStatusUpdates } from '../hooks/use-execution-status-updates'
import { getExecutionDayLabel, getStatusDotClassName, groupExecutionsByProject } from '../lib/execution-sidebar-display'

const EXECUTIONS_QUERY_KEY = ['executions'] as const
const MIN_REFRESH_SPIN_DURATION_MS = 1000

export function ExecutionsSidebar() {
  const { t } = useTranslation('executions')
  const { id: currentExecutionId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isMobile, setOpenMobile } = useSidebar()
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null)
  const [collapsedProjects, setCollapsedProjects] = useState<string[]>([])
  const [isRefreshSpinning, setIsRefreshSpinning] = useState(false)
  const refreshSpinnerTimeoutId = useRef<number | null>(null)
  useExecutionStatusUpdates()
  const executionsQuery = useQuery({
    queryKey: EXECUTIONS_QUERY_KEY,
    queryFn: async () => {
      const response = await getExecutions()

      return response.data
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteExecution,
    onSuccess: async (_deletedExecution, deletedExecutionId) => {
      setOpenDeleteId((currentOpenId) => (currentOpenId === deletedExecutionId ? null : currentOpenId))
      await queryClient.invalidateQueries({ queryKey: EXECUTIONS_QUERY_KEY })

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

  const toggleProject = (project: string) => {
    setCollapsedProjects((currentProjects) =>
      currentProjects.includes(project)
        ? currentProjects.filter((currentProject) => currentProject !== project)
        : [...currentProjects, project],
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
              isActive={!currentExecutionId}
              tooltip={t('sidebar.createExecution')}
            >
              <span>{t('sidebar.createExecution')}</span>
              <IconPlus className="ml-auto" />
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
                {executionProjectGroups.map((group) => (
                  <div key={group.project} className="min-w-0">
                    <button
                      type="button"
                      className="flex h-7 w-full items-center gap-2 rounded-none px-3 text-left text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      aria-expanded={!collapsedProjects.includes(group.project)}
                      onClick={() => toggleProject(group.project)}
                    >
                      <IconChevronDown
                        className={cn(
                          'size-3.5 shrink-0 transition-transform',
                          collapsedProjects.includes(group.project) && '-rotate-90',
                        )}
                      />
                      <span className="truncate">{group.project}</span>
                      <span className="ml-auto shrink-0 text-[10px] tracking-[0.18em] uppercase text-sidebar-foreground/55">
                        {group.executions.length}
                      </span>
                    </button>
                    {!collapsedProjects.includes(group.project) ? (
                      <SidebarMenu>
                        {group.executions.map((execution) => {
                          const label = getExecutionLabel(execution)
                          const executionDayLabel = getExecutionDayLabel(execution)
                          const status = normalizeExecutionStatus(execution.status)
                          const isDeleting = deleteMutation.isPending && pendingDeleteId === execution._id

                          return (
                            <SidebarMenuItem key={execution._id}>
                              <div className="flex items-center">
                                <SidebarMenuButton
                                  render={<Link to={`/execution/${execution._id}`} onClick={closeSidebarOnMobile} />}
                                  isActive={currentExecutionId === execution._id}
                                  tooltip={`${group.project} ${label}`}
                                >
                                  <span className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                                    {isExecutionRunning(status) ? (
                                      <IconLoader2
                                        aria-label={status}
                                        className="size-3 shrink-0 animate-spin text-blue-500"
                                      />
                                    ) : (
                                      <span
                                        aria-label={status}
                                        className={cn('size-2 shrink-0 rounded-full', getStatusDotClassName(status))}
                                      />
                                    )}
                                    <span className="truncate">{executionDayLabel}</span>
                                  </span>
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
                                        {isDeleting ? (
                                          <IconLoader2 className="animate-spin" data-icon="inline-start" />
                                        ) : null}
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
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
