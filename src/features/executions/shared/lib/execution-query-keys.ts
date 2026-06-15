import { normalizeExecutionQuery, type ExecutionQuery } from '../model/execution-query'

export const executionKeys = {
  all: (targetKey: string) => ['executions', targetKey] as const,
  runtimeCatalog: () => ['playwright-runtime-catalog'] as const,
  runtimeApplicationAvailability: (apiUrls: readonly string[]) =>
    ['playwright-runtime-application-availability', apiUrls] as const,
  projectCatalog: () => ['playwright-project-catalog'] as const,
  listRoot: (targetKey: string) => [...executionKeys.all(targetKey), 'list'] as const,
  list: (query: ExecutionQuery | undefined, targetKey: string) => {
    const normalizedQuery = normalizeExecutionQuery(query)

    return Object.keys(normalizedQuery).length > 0
      ? ([...executionKeys.listRoot(targetKey), normalizedQuery] as const)
      : executionKeys.listRoot(targetKey)
  },
  detail: (executionId: string, targetKey: string) => [...executionKeys.all(targetKey), 'detail', executionId] as const,
  appStats: (targetKey: string) => [...executionKeys.all(targetKey), 'app-stats'] as const,
  statuses: (targetKey: string) => [...executionKeys.all(targetKey), 'statuses'] as const,
  report: (executionId: string, targetKey: string) => [...executionKeys.all(targetKey), 'report', executionId] as const,
}
