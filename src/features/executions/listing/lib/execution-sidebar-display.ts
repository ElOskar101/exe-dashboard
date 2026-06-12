import { intlFormatDistance, isValid, parseISO } from 'date-fns'

import {
  isExecutionPending,
  isExecutionSuccessful,
  normalizeExecutionStatus,
  type Execution,
  type ExecutionStatus,
} from '@/features/executions/shared'

export const getRelativeCreatedAt = (createdAt: string, currentTime: number) => {
  const createdAtDate = parseISO(createdAt)

  if (!isValid(createdAtDate)) return null

  return intlFormatDistance(createdAtDate, currentTime, { numeric: 'auto' })
}

export const getStatusDotClassName = (status: ExecutionStatus) => {
  if (isExecutionSuccessful(status)) return 'bg-green-500'
  if (normalizeExecutionStatus(status) === 'cancelled') return 'bg-slate-500'
  if (normalizeExecutionStatus(status) === 'paused') return 'bg-amber-500'
  if (normalizeExecutionStatus(status) === 'scheduled') return 'bg-purple-500'
  if (isExecutionPending(status)) return 'bg-blue-500'

  return 'bg-red-500'
}

export interface ExecutionProjectGroup {
  project: string
  executions: Execution[]
}

const getExecutionDaySortValue = (execution: Execution) => {
  const executionDayDate = parseISO(execution.execution)

  if (isValid(executionDayDate)) {
    return executionDayDate.getTime()
  }

  return execution.execution
}

const compareExecutionDaysDescending = (left: Execution, right: Execution) => {
  const leftSortValue = getExecutionDaySortValue(left)
  const rightSortValue = getExecutionDaySortValue(right)

  if (typeof leftSortValue === 'number' && typeof rightSortValue === 'number') {
    return rightSortValue - leftSortValue
  }

  return right.execution.localeCompare(left.execution)
}

export const getExecutionDayLabel = (execution: Execution) => {
  return execution.execution || `${execution._id.slice(0, 8)}...`
}

export const groupExecutionsByProject = (executions: Execution[]): ExecutionProjectGroup[] => {
  const groupsByProject = new Map<string, Execution[]>()

  for (const execution of executions) {
    const project = execution.project || 'Unknown project'
    const projectExecutions = groupsByProject.get(project)

    if (projectExecutions) {
      projectExecutions.push(execution)
    } else {
      groupsByProject.set(project, [execution])
    }
  }

  return Array.from(groupsByProject, ([project, projectExecutions]) => ({
    project,
    executions: [...projectExecutions].sort(compareExecutionDaysDescending),
  })).sort((left, right) => {
    const leftNewestExecution = left.executions[0]
    const rightNewestExecution = right.executions[0]

    if (leftNewestExecution && rightNewestExecution) {
      const executionDayComparison = compareExecutionDaysDescending(leftNewestExecution, rightNewestExecution)

      if (executionDayComparison !== 0) {
        return executionDayComparison
      }
    }

    return left.project.localeCompare(right.project)
  })
}
