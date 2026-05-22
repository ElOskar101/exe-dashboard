import { exeClient } from '@/lib/axios'
import { IExecution } from '../model/execution.interface'
import { ExecutionCreatePayload } from '../model/execution-create'

export const createExecution = (data: ExecutionCreatePayload) => {
  return exeClient.post<IExecution>('/executions', data)
}

export const getExecutionById = (executionId: string) => {
  return exeClient.get<IExecution>(`/executions/${executionId}`)
}
