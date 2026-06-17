import type { CustomerDetailsResponse } from '../services/ccc.service'

export const CUSTOMER_EXECUTION_CONFIG_KEYS = [
  'instantPrinter',
  'alerts',
  'statusPrinter',
  'isDiva',
  'plans',
  'twoFA',
] as const

export type CustomerExecutionConfigKey = (typeof CUSTOMER_EXECUTION_CONFIG_KEYS)[number]
export type CustomerExecutionConfig = Pick<CustomerDetailsResponse, CustomerExecutionConfigKey>

export const createCustomerExecutionConfig = (customer: CustomerDetailsResponse): CustomerExecutionConfig => ({
  instantPrinter: customer.instantPrinter,
  alerts: customer.alerts,
  statusPrinter: customer.statusPrinter,
  isDiva: customer.isDiva,
  plans: customer.plans,
  twoFA: customer.twoFA,
})

export const formatCustomerExecutionConfig = (customer: CustomerDetailsResponse) =>
  JSON.stringify(createCustomerExecutionConfig(customer), null, 2)
