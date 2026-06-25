import { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Sidebar } from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/sidebar-context'
import { AuthContext } from '@/features/auth'
import {
  executionKeys,
  getExecutionRequestErrorMessage,
  getExecutions,
  isScheduledExecution,
  syncExecutionsFromListSnapshot,
  useDeleteExecutionMutation,
  useExecutionStatusReadModel,
  useExecutionTarget,
  useExecutionTargetNavigation,
  usePlaywrightProjectsQuery,
  type Execution,
  type ExecutionQuery,
} from '@/features/executions/shared'
import { useCurrentTime } from '@/hooks/use-current-time'
import { cn } from '@/lib/utils'
import { useExecutionsSidebarRefresh } from '../hooks/use-executions-sidebar-refresh'
import { useScheduledExecutionStartToasts } from '../hooks/use-scheduled-execution-start-toasts'
import {
  getExecutionSidebarSectionGroups,
  getSectionProjectKey,
  NORMAL_EXECUTIONS_SECTION_ID,
  SCHEDULED_EXECUTIONS_SECTION_ID,
  type SidebarExecutionSection,
  type SidebarExecutionSectionId,
} from '../lib/executions-sidebar-sections'
import { CollapsedExecutionsSidebarContent } from './collapsed-executions-sidebar-content'
import { ExpandedExecutionsSidebarContent } from './expanded-executions-sidebar-content'

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
  const expandedSectionProjectKeysSet = useMemo(() => new Set(expandedSectionProjectKeys), [expandedSectionProjectKeys])
  const executionSidebarSections = useMemo(
    () =>
      getExecutionSidebarSectionGroups({
        availableProjects,
        currentTime,
        executionStatusReadModelData: executionStatusReadModel.data,
        expandedSectionProjectKeys: expandedSectionProjectKeysSet,
        projectExecutionsQueries,
      }),
    [
      availableProjects,
      currentTime,
      expandedSectionProjectKeysSet,
      executionStatusReadModel.data,
      projectExecutionsQueries,
    ],
  )
  const scheduledExecutionsForStartToasts = useMemo(
    () =>
      projectExecutionsQueries
        .flatMap((query) => query.data ?? [])
        .filter((execution) => isScheduledExecution(execution)),
    [projectExecutionsQueries],
  )
  const isExecutionsLoading =
    playwrightProjectsQuery.isLoading || projectExecutionsQueries.some((query) => query.isLoading)
  const isExecutionsFetching =
    playwrightProjectsQuery.isFetching || projectExecutionsQueries.some((query) => query.isFetching)
  const isExecutionsError = playwrightProjectsQuery.isError || projectExecutionsQueries.some((query) => query.isError)
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

  const refetchProjectExecutions = async () => {
    await Promise.all([playwrightProjectsQuery.refetch(), ...projectExecutionsQueries.map((query) => query.refetch())])
  }
  const { handleRefresh, isRefreshSpinning } = useExecutionsSidebarRefresh({
    isFetching: isExecutionsFetching,
    refetch: refetchProjectExecutions,
  })

  useScheduledExecutionStartToasts(scheduledExecutionsForStartToasts, currentTime)

  const isCollapsedDesktop = state === 'collapsed' && !isMobile
  const sidebarButtonLabel = isMobile
    ? openMobile
      ? 'Close executions sidebar'
      : 'Open executions sidebar'
    : state === 'expanded'
      ? 'Minimize executions sidebar'
      : 'Expand executions sidebar'

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

  const handleDeleteOpenChange = (executionId: string, open: boolean) => {
    if (deleteMutation.isPending && pendingDeleteId === executionId) {
      return
    }

    setOpenDeleteId(open ? executionId : null)
  }

  const handleDeleteExecution = async (executionId: string, executionLabel: string) => {
    try {
      await deleteMutation.mutateAsync(executionId)
      toast.success(t('sidebar.deleteSuccessTitle'), {
        description: t('sidebar.deleteSuccessDescription', { execution: executionLabel }),
      })
    } catch (error) {
      toast.error(t('sidebar.deleteErrorTitle'), {
        description: getExecutionRequestErrorMessage(error, t('sidebar.deleteErrorDescription')),
      })
    }
  }

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
          <ExpandedExecutionsSidebarContent
            collapsedSectionProjectKeys={collapsedSectionProjectKeys}
            currentExecutionId={currentExecutionId}
            currentTime={currentTime}
            emptyValueLabel={t('list.emptyValue')}
            executionSections={executionSections}
            executionStatusById={executionStatusReadModel.data}
            getPathWithExecutionTarget={getPathWithExecutionTarget}
            hasExecutionGroups={hasExecutionGroups}
            isDeletePending={deleteMutation.isPending}
            isExecutionsError={isExecutionsError}
            isExecutionsFetching={isExecutionsFetching}
            isExecutionsLoading={isExecutionsLoading}
            isMobile={isMobile}
            isRefreshSpinning={isRefreshSpinning}
            onCloseSidebarOnMobile={closeSidebarOnMobile}
            onDeleteExecution={(executionId, executionLabel) => void handleDeleteExecution(executionId, executionLabel)}
            onDeleteOpenChange={handleDeleteOpenChange}
            onProjectCollapsedChange={setProjectCollapsed}
            onProjectExecutionsExpandedChange={setProjectExecutionsExpanded}
            onRefresh={() => void handleRefresh()}
            onRetry={() => void refetchProjectExecutions()}
            openDeleteId={openDeleteId}
            pathname={pathname}
            pendingDeleteId={pendingDeleteId}
            sidebarButtonLabel={sidebarButtonLabel}
            sidebarState={state}
            t={t}
            toggleSidebar={toggleSidebar}
          />
        </div>
        <div
          aria-hidden={!isCollapsedDesktop}
          inert={!isCollapsedDesktop ? true : undefined}
          className={cn(
            'absolute inset-0 flex flex-col transition-[opacity,transform] duration-200 ease-out',
            isCollapsedDesktop ? 'translate-x-0 opacity-100 delay-75' : 'pointer-events-none translate-x-2 opacity-0',
          )}
        >
          <CollapsedExecutionsSidebarContent
            currentExecutionId={currentExecutionId}
            currentTime={currentTime}
            emptyValueLabel={t('list.emptyValue')}
            executionSections={executionSections}
            executionStatusById={executionStatusReadModel.data}
            getPathWithExecutionTarget={getPathWithExecutionTarget}
            isDeletePending={deleteMutation.isPending}
            onCloseSidebarOnMobile={closeSidebarOnMobile}
            onDeleteExecution={(executionId, executionLabel) => void handleDeleteExecution(executionId, executionLabel)}
            onDeleteOpenChange={handleDeleteOpenChange}
            onProjectExecutionsExpandedChange={setProjectExecutionsExpanded}
            openDeleteId={openDeleteId}
            pathname={pathname}
            pendingDeleteId={pendingDeleteId}
            sidebarButtonLabel={sidebarButtonLabel}
            t={t}
            toggleSidebar={toggleSidebar}
          />
        </div>
      </div>
    </Sidebar>
  )
}
