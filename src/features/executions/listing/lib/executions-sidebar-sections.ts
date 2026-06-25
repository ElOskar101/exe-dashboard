import {
  isWaitingScheduledExecution,
  normalizeExecutionStatus,
  type Execution,
  type ExecutionStatus,
} from '@/features/executions/shared'
import { UNKNOWN_PROJECT_LABEL } from './execution-listing-filters'
import { groupExecutionsByProject } from './execution-sidebar-display'

export const SIDEBAR_PROJECT_EXECUTIONS_LIMIT = 5
export const NORMAL_EXECUTIONS_SECTION_ID = 'normal' as const
export const SCHEDULED_EXECUTIONS_SECTION_ID = 'scheduled' as const
export const WAITING_SCHEDULED_STATUS_DOT_CLASS_NAME = 'bg-purple-500'

export type SidebarExecutionSectionId = typeof NORMAL_EXECUTIONS_SECTION_ID | typeof SCHEDULED_EXECUTIONS_SECTION_ID

export interface SidebarExecutionProjectGroup {
  executions: Execution[]
  isExpanded: boolean
  isExpandable: boolean
  isFetching: boolean
  project: string
  totalCount: number
}

export interface SidebarExecutionSection {
  groups: SidebarExecutionProjectGroup[]
  id: SidebarExecutionSectionId
  title: string
}

interface PlaywrightProjectSummary {
  name: string
}

interface ProjectExecutionsQueryResult {
  data?: Execution[]
  isFetching: boolean
}

interface GetExecutionSidebarSectionsInput {
  availableProjects: PlaywrightProjectSummary[]
  currentTime: number
  executionStatusReadModelData: Record<string, { status?: ExecutionStatus }>
  expandedSectionProjectKeys: Set<string>
  projectExecutionsQueries: ProjectExecutionsQueryResult[]
}

const getCreatedAtTime = (execution: Execution) => {
  const createdAtTime = new Date(execution.createdAt).getTime()

  return Number.isNaN(createdAtTime) ? 0 : createdAtTime
}

const sortExecutionsByCreatedAtDescending = (executions: Execution[]) =>
  [...executions].sort(
    (leftExecution, rightExecution) => getCreatedAtTime(rightExecution) - getCreatedAtTime(leftExecution),
  )

export const getSectionProjectKey = (sectionId: SidebarExecutionSectionId, project: string) => `${sectionId}:${project}`

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

export const getExecutionSidebarSectionGroups = ({
  availableProjects,
  currentTime,
  executionStatusReadModelData,
  expandedSectionProjectKeys,
  projectExecutionsQueries,
}: GetExecutionSidebarSectionsInput) => {
  const unknownNormalExecutionsById = new Map<string, Execution>()
  const unknownScheduledExecutionsById = new Map<string, Execution>()
  const normalProjectGroups: SidebarExecutionProjectGroup[] = []
  const scheduledProjectGroups: SidebarExecutionProjectGroup[] = []

  for (const [index, project] of availableProjects.entries()) {
    const projectNormalExecutions: Execution[] = []
    const projectScheduledExecutions: Execution[] = []

    for (const execution of projectExecutionsQueries[index]?.data ?? []) {
      const executionProject = execution.project?.trim()
      const status = executionStatusReadModelData[execution._id]?.status ?? normalizeExecutionStatus(execution.status)
      const isWaitingScheduled = isWaitingScheduledExecution(execution.scheduledAt, currentTime, status)

      if (!executionProject) {
        const unknownExecutionsById = isWaitingScheduled ? unknownScheduledExecutionsById : unknownNormalExecutionsById

        unknownExecutionsById.set(execution._id, execution)
        continue
      }

      if (executionProject !== project.name) {
        continue
      }

      if (isWaitingScheduled) {
        projectScheduledExecutions.push(execution)
      } else {
        projectNormalExecutions.push(execution)
      }
    }

    const isFetching = projectExecutionsQueries[index]?.isFetching ?? false
    const normalGroup = createSidebarExecutionProjectGroup({
      executions: projectNormalExecutions,
      expandedSectionProjectKeys,
      isFetching,
      project: project.name,
      sectionId: NORMAL_EXECUTIONS_SECTION_ID,
    })
    const scheduledGroup = createSidebarExecutionProjectGroup({
      executions: projectScheduledExecutions,
      expandedSectionProjectKeys,
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
    expandedSectionProjectKeys,
    isFetching: isFetchingUnknownExecutions,
    project: UNKNOWN_PROJECT_LABEL,
    sectionId: NORMAL_EXECUTIONS_SECTION_ID,
  })
  const unknownScheduledGroup = createSidebarExecutionProjectGroup({
    executions: Array.from(unknownScheduledExecutionsById.values()).map((execution) => ({
      ...execution,
      project: '',
    })),
    expandedSectionProjectKeys,
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
}
