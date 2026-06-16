import cccClient from '@/lib/axios'
import type { ExecutionMetadata, ExecutionVerificationType } from '../../shared/model/execution-create-payload'

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

interface CustomerSearchOptions {
  limit?: number
  page?: number
}

export interface CCCUserRole {
  _id: string
  name: string
}

export interface CCCUserArea {
  _id: string
  name: string
}

export interface CCCUser {
  _id: string
  fullName: string
  username: string
  urlImage: string
  roles: CCCUserRole[]
  area: CCCUserArea | null
}

export interface CCCUserSearchResponse {
  totalDocs: number
  totalPages: number
  query: Record<string, unknown>
  users: CCCUser[]
}

interface CCCUserSearchOptions {
  limit?: number
  page?: number
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
  status: ClinicBotStatus | null
  username: string
  password: string
  bot: ClinicBotDefinition | null
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

export const searchCustomers = (clientName: string, options: CustomerSearchOptions = {}) => {
  return cccClient.get<CustomerSearchResponse>('v2/customers', {
    params: {
      clientName,
      ...(options.limit ? { limit: options.limit } : {}),
      ...(options.page ? { page: options.page } : {}),
    },
  })
}

export const searchCCCUsers = (fullName: string, options: CCCUserSearchOptions = {}) => {
  return cccClient.get<CCCUserSearchResponse>('v2/users', {
    params: {
      fullName,
      ...(options.limit ? { limit: options.limit } : {}),
      ...(options.page ? { page: options.page } : {}),
    },
  })
}

export const getAllCustomers = async () => {
  const firstResponse = await searchCustomers('')
  const totalPages = Math.max(firstResponse.data.totalPages, 1)

  if (totalPages === 1) {
    return firstResponse
  }

  const remainingResponses = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => searchCustomers('', { page: index + 2 })),
  )
  const customersById = new Map<string, CustomerSearchItem>()

  ;[firstResponse, ...remainingResponses].forEach((response) => {
    response.data.customers.forEach((customer) => {
      customersById.set(customer._id, customer)
    })
  })

  return {
    ...firstResponse,
    data: {
      ...firstResponse.data,
      customers: Array.from(customersById.values()),
    },
  }
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

export const getRuntimeVariables = () => {
  return cccClient.get<ExecutionMetadata>('rv')
}

const normalizeDecryptedPassword = (value: string) => {
  try {
    const parsedValue = JSON.parse(value)

    return typeof parsedValue === 'string' ? parsedValue : value
  } catch {
    return value
  }
}
