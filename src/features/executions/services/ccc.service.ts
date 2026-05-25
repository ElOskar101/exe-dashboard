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

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const isCustomerClinic = (value: unknown): value is CustomerClinic => {
  return isRecord(value) && typeof value._id === 'string' && typeof value.clinicName === 'string'
}

const isClinicExecutionDay = (value: unknown): value is ClinicExecutionDay => {
  return (
    isRecord(value) &&
    typeof value._id === 'string' &&
    typeof value.sheetName === 'string' &&
    typeof value.trashed === 'boolean'
  )
}

const isClinicBotRecord = (value: unknown): value is ClinicBotRecord => {
  return isRecord(value) && typeof value._id === 'string'
}

export const searchCustomers = (clientName: string) => {
  return cccClient.get<CustomerSearchResponse>('v2/customers', {
    params: {
      clientName,
    },
  })
}

export const getCustomerById = async (customerId: string) => {
  const response = await cccClient.get<CustomerDetailsResponse>(`v2/customers/${customerId}`)

  return {
    ...response,
    data: {
      ...response.data,
      clinic: Array.isArray(response.data?.clinic) ? response.data.clinic.filter(isCustomerClinic) : [],
    },
  }
}

export const getClinicExecutionDays = async (clinicId: string) => {
  const response = await cccClient.get<ClinicExecutionDay[]>(`v2/executions/${clinicId}/days`)

  return {
    ...response,
    data: Array.isArray(response.data) ? response.data.filter(isClinicExecutionDay) : [],
  }
}

export const getClinicBots = async (clinicId: string) => {
  const response = await cccClient.get<ClinicBotRecord[]>(`v2/clinics/${clinicId}/clinic-bots`)

  return {
    ...response,
    data: Array.isArray(response.data) ? response.data.filter(isClinicBotRecord) : [],
  }
}

export const decryptClinicBotPassword = async (clinicBotId: string) => {
  const response = await cccClient.get<string>(`clinicbots/decrypt/${clinicBotId}`, {
    responseType: 'text',
  })

  return {
    ...response,
    data: normalizeDecryptedPassword(response.data),
  }
}

export const getCcExecution = (executionId: string) => {
  return cccClient.get<CcExecutionResponse>(`v2/executions/${executionId}`)
}

const normalizeDecryptedPassword = (value: string) => {
  try {
    const parsedValue = JSON.parse(value)

    return typeof parsedValue === 'string' ? parsedValue : value
  } catch {
    return value
  }
}
