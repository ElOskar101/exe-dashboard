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

export const searchCustomers = (clientName: string) => {
  return cccClient.get<CustomerSearchResponse>('/api/v2/customers', {
    params: {
      clientName,
    },
  })
}

export const getCustomerById = (customerId: string) => {
  return cccClient.get<CustomerDetailsResponse>(
    `/api/v2/customers/${customerId}`,
  )
}
