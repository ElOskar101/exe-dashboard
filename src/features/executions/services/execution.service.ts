import { exeClient } from '@/lib/axios'
import { IExecution } from '../model/execution.interface'
import { ExecutionCreatePayload } from '../model/execution-create'

export type ExecutionUpdatePayload = Partial<Omit<IExecution, '_id'>>

export const getExecutions = () => {
  return exeClient.get<IExecution[]>('/executions')
}

export const createExecution = (data: ExecutionCreatePayload) => {
  return exeClient.post<IExecution>('/executions', data)
}

export const getExecutionById = (executionId: string) => {
  return exeClient.get<IExecution>(`/executions/${executionId}`)
}

export const updateExecution = (
  executionId: string,
  data: ExecutionUpdatePayload,
) => {
  return exeClient.patch<IExecution>(`/executions/${executionId}`, data)
}

export const deleteExecution = (executionId: string) => {
  return exeClient.delete<IExecution>(`/executions/${executionId}`)
}

export const stopExecution = (executionId: string) => {
  return exeClient.post<IExecution>(`/executions/${executionId}/stop`)
}
