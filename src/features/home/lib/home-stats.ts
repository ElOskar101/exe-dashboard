import {
  EXECUTION_STATUSES,
  type Execution,
  type ExecutionStatus,
  normalizeExecutionStatus,
} from '@/features/executions'

export const TOP_DIMENSION_LIMIT = 5

export type TopDimensionEntry = {
  name: string
  total: number
} & Partial<Record<ExecutionStatus, number>>

const buildEntries = (
  totalsByDimension: Map<string, { name: string; totals: Partial<Record<ExecutionStatus, number>> }>,
): TopDimensionEntry[] =>
  Array.from(totalsByDimension.values())
    .map((entry) => ({
      name: entry.name,
      total: 0,
      ...entry.totals,
    }))
    .map((entry) => ({
      ...entry,
      total: EXECUTION_STATUSES.reduce((sum, status) => sum + (entry[status] ?? 0), 0),
    }))

const sortEntries = (leftEntry: TopDimensionEntry, rightEntry: TopDimensionEntry) =>
  rightEntry.total - leftEntry.total || leftEntry.name.localeCompare(rightEntry.name)

export const getTopDimension = (
  executions: Execution[],
  pickValue: (execution: Execution) => string,
  noValueLabel: string,
): TopDimensionEntry[] => {
  const totalsByDimension = new Map<string, { name: string; totals: Partial<Record<ExecutionStatus, number>> }>()

  executions.forEach((execution) => {
    const rawValue = pickValue(execution).trim() || noValueLabel
    const status = normalizeExecutionStatus(execution.status)
    const current = totalsByDimension.get(rawValue) ?? { name: rawValue, totals: {} }

    current.totals[status] = (current.totals[status] ?? 0) + 1

    totalsByDimension.set(rawValue, current)
  })

  return buildEntries(totalsByDimension).sort(sortEntries).slice(0, TOP_DIMENSION_LIMIT)
}
