import cccClient from '@/lib/axios'

export interface CustomerSearchItem {
  _id: string
  clientName: string
  isActive: boolean
  createdAt: string
}

export interface CustomerSearchResponse {
  totalDocs: number
  totalPages: number
  query: Record<string, unknown>
  customers: CustomerSearchItem[]
}

export interface CustomerClinic {
  _id: string
  clinicName: string
}

export interface CustomerDetailsResponse {
  _id: string
  clientName: string
  isActive: boolean
  clinic: CustomerClinic[]
}

export interface ClinicExecutionDay {
  _id: string
  sheetName: string
  trashed: boolean
}

export interface CcExecutionCell {
  key: string
  value: string
}

export interface CcExecutionRow {
  _id: string
  cells: CcExecutionCell[]
}

export interface CcExecutionResponse {
  _id: string
  sheetName: string
  rows: CcExecutionRow[]
  trashed: boolean
}

export const searchCustomers = (clientName: string) => {
  return cccClient.get<CustomerSearchResponse>('/api/v2/customers', {
    params: {
      clientName,
    },
  })
}

export const getCustomerById = (customerId: string) => {
  return cccClient.get<CustomerDetailsResponse>(`/api/v2/customers/${customerId}`)
}

export const getClinicExecutionDays = (clinicId: string) => {
  return cccClient.get<ClinicExecutionDay[]>(`/api/v2/executions/${clinicId}/days`)
}

export const getCcExecution = (executionId: string) => {
  return cccClient.get<CcExecutionResponse>(`/api/v2/executions/${executionId}`)
}
