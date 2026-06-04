import { exeClient, exeReportsClient } from '@/lib/axios'
import type { Execution } from '../model/execution'
import type { ExecutionCreatePayload } from '../model/execution-create-payload'
import { EXECUTION_ARRAY_QUERY_KEYS, normalizeExecutionQuery, type ExecutionQuery } from '../model/execution-query'

export type ExecutionUpdatePayload = Partial<Omit<Execution, '_id'>>

const buildExecutionSearchParams = (query: ExecutionQuery) => {
  const normalizedQuery = normalizeExecutionQuery(query)
  const searchParams = new URLSearchParams()

  for (const key of EXECUTION_ARRAY_QUERY_KEYS) {
    normalizedQuery[key]?.forEach((value) => searchParams.append(key, value))
  }

  if (normalizedQuery.from) searchParams.set('from', normalizedQuery.from)
  if (normalizedQuery.to) searchParams.set('to', normalizedQuery.to)
  if (normalizedQuery.dateField) searchParams.set('dateField', normalizedQuery.dateField)
  if (normalizedQuery.status) searchParams.set('status', normalizedQuery.status)

  return searchParams
}

export const getExecutions = (query: ExecutionQuery = {}) => {
  const params = buildExecutionSearchParams(query)

  if (params.size === 0) {
    return exeClient.get<Execution[]>('executions')
  }

  return exeClient.get<Execution[]>('executions', { params })
}

export const createExecution = (data: ExecutionCreatePayload) => {
  return exeClient.post<Execution>('executions', data)
}

export const getExecutionById = (executionId: string) => {
  return exeClient.get<Execution>(`executions/${executionId}`)
}

export const getExecutionReportHtml = (executionId: string) => {
  return exeReportsClient.get<string>(`${executionId}/index.html`)
}

export const updateExecution = (executionId: string, data: ExecutionUpdatePayload) => {
  return exeClient.patch<Execution>(`executions/${executionId}`, data)
}

export const deleteExecution = (executionId: string) => {
  return exeClient.delete<Execution>(`executions/${executionId}`)
}

export const stopExecution = (executionId: string) => {
  return exeClient.post<Execution>(`executions/${executionId}/stop`)
}

export const pauseExecution = (executionId: string) => {
  return exeClient.post<Execution>(`executions/${executionId}/pause`)
}

export const resumeExecution = (executionId: string) => {
  return exeClient.post<Execution>(`executions/${executionId}/resume`)
}
