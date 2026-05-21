import fetcher, { fetcherExe } from '@/lib/axios'
import { IAdminCustomer, IAPIV2Res } from '../model/customer-v2.interface'
import { IExecution } from '../model/execution.interface'
import { IExectionPost } from '../model/execution-post'

export const getExecutions = () => {
  return fetcherExe<IExecution[]>('/executions')
}
export const getExecution = (id: string) => {
  return fetcherExe.get<IExecution>('/executions/' + id)
}
export const stopExecution = (id: string) => {
  return fetcherExe.post<IExecution>('/executions/' + id + '/stop')
}
export const updateExecution = (id: string, data: Partial<IExectionPost>) => {
  return fetcherExe.patch<IExecution>('/executions/' + id, data)
}
export const deleteExecution = (id: string) => {
  return fetcherExe.delete<string>('/executions/' + id)
}
export const postExecutions = (data: IExectionPost) => {
  return fetcherExe.post<IExecution>('/executions', data)
}

export const getCustomers = (params: {
  isActive?: boolean
  area?: string
  by?: string
  user?: string
  page: number
  limit: number
  clientName?: string
}) => {
  return fetcher.get<IAPIV2Res>('/v2/customers', {
    params,
  })
}

export const getCustomer = (customerId: string) => {
  return fetcher.get<IAdminCustomer>('/v2/customers/' + customerId)
}
