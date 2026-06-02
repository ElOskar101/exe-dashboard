export const executionKeys = {
  all: ['executions'] as const,
  list: () => executionKeys.all,
  detail: (executionId: string) => ['execution', executionId] as const,
  statuses: () => ['execution-statuses'] as const,
  report: (executionId: string) => ['execution-report', executionId] as const,
}
