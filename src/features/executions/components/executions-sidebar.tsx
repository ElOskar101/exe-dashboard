import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconAlertCircle, IconLoader2, IconPlus, IconTrash } from '@tabler/icons-react'
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
import { cn } from '@/lib/utils'
import { useExecutionStatusUpdates } from '../hooks/use-execution-status-updates'
import { deleteExecution, getExecutions } from '../services/execution.service'
import {
  getExecutionLabel,
  isExecutionPending,
  isExecutionSuccessful,
  normalizeExecutionStatus,
} from '../lib/execution-display'
import type { ExecutionStatus } from '../model/execution.interface'

const EXECUTIONS_QUERY_KEY = ['executions'] as const
const ACTIVE_SIDEBAR_BUTTON_CLASS_NAME =
  'hover:bg-sidebar-primary/10 hover:text-sidebar-foreground data-active:bg-background data-active:text-sidebar-foreground data-active:hover:bg-background data-active:shadow-[inset_0_0_0_1px_var(--sidebar-border),0_1px_2px_rgb(15_23_42_/_0.05)]'

const getStatusDotClassName = (status: ExecutionStatus) => {
  if (isExecutionSuccessful(status)) return 'bg-green-500'
  if (isExecutionPending(status)) return 'bg-blue-500'

  return 'bg-red-500'
}

export function ExecutionsSidebar() {
  const { t } = useTranslation('executions')
  const { id: currentExecutionId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null)
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
  const executions = executionsQuery.data ?? []
  const skeletonRows = useMemo(() => ['one', 'two', 'three', 'four'], [])

  return (
    <Sidebar collapsible="none">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={ACTIVE_SIDEBAR_BUTTON_CLASS_NAME}
              render={<Link to="/" />}
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
          <SidebarGroupLabel>{t('sidebar.title')}</SidebarGroupLabel>
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

            {!executionsQuery.isLoading && !executionsQuery.isError && executions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">{t('sidebar.empty')}</div>
            ) : null}

            {executions.length > 0 ? (
              <SidebarMenu>
                {executions.map((execution) => {
                  const label = getExecutionLabel(execution)
                  const status = normalizeExecutionStatus(execution.status)
                  const isDeleting = deleteMutation.isPending && pendingDeleteId === execution._id

                  return (
                    <SidebarMenuItem key={execution._id}>
                      <SidebarMenuButton
                        className={cn('h-auto min-w-0 py-2', ACTIVE_SIDEBAR_BUTTON_CLASS_NAME)}
                        render={<Link to={`/execution/${execution._id}`} />}
                        isActive={currentExecutionId === execution._id}
                        tooltip={label}
                      >
                        <span className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                          <span
                            aria-label={status}
                            className={cn('size-2 shrink-0 rounded-full', getStatusDotClassName(status))}
                          />
                          <span className="truncate">
                            {execution.playwrightProject} {label}
                          </span>
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
                              className="hover:bg-sidebar-accent/60 right-2 opacity-0 peer-hover/menu-button:opacity-100 hover:opacity-100 aria-expanded:opacity-100"
                              aria-label={t('sidebar.deleteAction', {
                                execution: label,
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
                                execution: label,
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>{t('sidebar.cancelDelete')}</AlertDialogCancel>
                            <Button
                              variant="destructive"
                              disabled={isDeleting}
                              onClick={() => deleteMutation.mutate(execution._id)}
                            >
                              {isDeleting ? <IconLoader2 className="animate-spin" data-icon="inline-start" /> : null}
                              {isDeleting ? t('sidebar.deleting') : t('sidebar.confirmDelete')}
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            ) : null}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
