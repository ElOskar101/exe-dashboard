import { normalizeExecutionQuery, type ExecutionQuery } from '../model/execution-query'
import { MISSING_EXECUTION_TARGET_KEY } from './execution-target'

export const executionKeys = {
  all: (targetKey = MISSING_EXECUTION_TARGET_KEY) => ['executions', targetKey] as const,
  runtimeCatalog: () => ['playwright-runtime-catalog'] as const,
  projectCatalog: () => ['playwright-project-catalog'] as const,
  listRoot: (targetKey = MISSING_EXECUTION_TARGET_KEY) => [...executionKeys.all(targetKey), 'list'] as const,
  list: (query?: ExecutionQuery, targetKey = MISSING_EXECUTION_TARGET_KEY) => {
    const normalizedQuery = normalizeExecutionQuery(query)

    return Object.keys(normalizedQuery).length > 0
      ? ([...executionKeys.listRoot(targetKey), normalizedQuery] as const)
      : executionKeys.listRoot(targetKey)
  },
  detail: (executionId: string, targetKey = MISSING_EXECUTION_TARGET_KEY) =>
    [...executionKeys.all(targetKey), 'detail', executionId] as const,
  appStats: (targetKey = MISSING_EXECUTION_TARGET_KEY) => [...executionKeys.all(targetKey), 'app-stats'] as const,
  statuses: (targetKey = MISSING_EXECUTION_TARGET_KEY) => [...executionKeys.all(targetKey), 'statuses'] as const,
  report: (executionId: string, targetKey = MISSING_EXECUTION_TARGET_KEY) =>
    [...executionKeys.all(targetKey), 'report', executionId] as const,
}
