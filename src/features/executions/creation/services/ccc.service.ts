import cccClient from '@/lib/axios'
import type { ExecutionVerificationType } from '../model/execution-create'

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

export interface ClinicBotStatus {
  _id: string
  description: string
}

export interface ClinicBotDefinition {
  _id: string
  botName: string
  isActive: boolean
  status: ClinicBotStatus
  type: ExecutionVerificationType
  urlLogin: string
}

export interface ClinicBotRecord {
  _id: string
  status: ClinicBotStatus
  username: string
  password: string
  bot: ClinicBotDefinition
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

export interface CCCExecutionCell {
  key: string
  value: string
}

export interface CCCExecutionRow {
  _id: string
  cells: CCCExecutionCell[]
}

export interface CCCExecutionResponse {
  _id: string
  sheetName: string
  rows: CCCExecutionRow[]
  trashed: boolean
}

export const searchCustomers = (clientName: string) => {
  return cccClient.get<CustomerSearchResponse>('v2/customers', {
    params: {
      clientName,
    },
  })
}

export const getCustomerById = (customerId: string) =>
  cccClient.get<CustomerDetailsResponse>(`v2/customers/${customerId}`)

export const getClinicExecutionDays = (clinicId: string) =>
  cccClient.get<ClinicExecutionDay[]>(`v2/executions/${clinicId}/days`)

export const getClinicBots = (clinicId: string) =>
  cccClient.get<ClinicBotRecord[]>(`v2/clinics/${clinicId}/clinic-bots`)

export const decryptClinicBotPassword = async (clinicBotId: string) => {
  const response = await cccClient.get<string>(`clinicbots/decrypt/${clinicBotId}`, {
    responseType: 'text',
  })

  return {
    ...response,
    data: normalizeDecryptedPassword(response.data),
  }
}

export const getCCCExecution = (executionId: string) => {
  return cccClient.get<CCCExecutionResponse>(`v2/executions/${executionId}`)
}

const normalizeDecryptedPassword = (value: string) => {
  try {
    const parsedValue = JSON.parse(value)

    return typeof parsedValue === 'string' ? parsedValue : value
  } catch {
    return value
  }
}
