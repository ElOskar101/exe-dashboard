import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconAlertCircle, IconLoader2, IconPlayerPlay, IconTrash } from '@tabler/icons-react'
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { deleteExecution, getExecutions } from '../services/execution.service'
import {
  getExecutionLabel,
  isExecutionPending,
  isExecutionSuccessful,
  normalizeExecutionStatus,
} from '../lib/execution-display'
import type { ExecutionStatus } from '../model/execution.interface'

const EXECUTIONS_QUERY_KEY = ['executions'] as const

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
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to="/" />}
              isActive={!currentExecutionId}
              tooltip={t('sidebar.createExecution')}
            >
              <IconPlayerPlay />
              <span>{t('sidebar.createExecution')}</span>
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
                    <SidebarMenuItem
                      key={execution._id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1"
                    >
                      <SidebarMenuButton
                        className="h-auto min-w-0 items-start py-2 pr-2"
                        render={<Link to={`/execution/${execution._id}`} />}
                        isActive={currentExecutionId === execution._id}
                        tooltip={label}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span>{label}</span>
                          <span
                            aria-label={status}
                            className={cn('size-2 shrink-0 rounded-full', getStatusDotClassName(status))}
                          />
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
                            <Button
                              className="opacity-0 transition-opacity group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100"
                              size="icon-sm"
                              variant="ghost"
                              aria-label={t('sidebar.deleteAction', {
                                execution: label,
                              })}
                              disabled={isDeleting}
                            >
                              <IconTrash />
                            </Button>
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
