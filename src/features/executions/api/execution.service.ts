import { fetcherExe } from '@/lib/axios'
import { IExecution } from '../model/execution.interface'
import { ExecutionCreatePayload } from '../model/execution-create'

export const createExecution = (data: ExecutionCreatePayload) => {
  return fetcherExe.post<IExecution>('/executions', data)
}
