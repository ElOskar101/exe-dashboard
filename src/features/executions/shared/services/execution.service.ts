import { exeClient, exeReportsClient } from '@/lib/axios'
import type { ExecutionCreatePayload } from '@/features/executions/creation'
import type { Execution } from '../model/execution'

export type ExecutionUpdatePayload = Partial<Omit<Execution, '_id'>>

export const getExecutions = () => {
  return exeClient.get<Execution[]>('executions')
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
