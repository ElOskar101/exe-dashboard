import { normalizeExecutionQuery, type ExecutionQuery } from '../model/execution-query'

export const executionKeys = {
  all: ['executions'] as const,
  listRoot: () => [...executionKeys.all, 'list'] as const,
  list: (query?: ExecutionQuery) => {
    const normalizedQuery = normalizeExecutionQuery(query)

    return Object.keys(normalizedQuery).length > 0
      ? ([...executionKeys.listRoot(), normalizedQuery] as const)
      : executionKeys.listRoot()
  },
  detail: (executionId: string) => ['execution', executionId] as const,
  statuses: () => ['execution-statuses'] as const,
  report: (executionId: string) => ['execution-report', executionId] as const,
}
