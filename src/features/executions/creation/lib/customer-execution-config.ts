import type { ClinicDetailsResponse, CustomerDetailsResponse } from '../services/ccc.service'
import { parseExecutionMetadata } from './execution-metadata'

export const CUSTOMER_EXECUTION_CONFIG_KEYS = [
  'instantPrinter',
  'alerts',
  'statusPrinter',
  'isDiva',
  'plans',
  'twoFA',
] as const

export const CLINIC_EXECUTION_CONFIG_KEYS = [
  'networkType',
  'defaultCharacter',
  'activePrint',
  'onlyPrint',
  'onlyElg',
  'onlyForm',
  'shortForm',
  'claimForm',
  'vouchers',
  'planChecker',
  'otherInformation',
  'stateSetter',
  'smartSearch',
  'maxOutForm',
] as const

export type CustomerExecutionConfigKey = (typeof CUSTOMER_EXECUTION_CONFIG_KEYS)[number]
export type CustomerExecutionConfig = Pick<CustomerDetailsResponse, CustomerExecutionConfigKey>
export type ClinicExecutionConfigKey = (typeof CLINIC_EXECUTION_CONFIG_KEYS)[number]
export type ClinicExecutionConfig = Pick<ClinicDetailsResponse, ClinicExecutionConfigKey>

export const createCustomerExecutionConfig = (customer: CustomerDetailsResponse): CustomerExecutionConfig => ({
  instantPrinter: customer.instantPrinter,
  alerts: customer.alerts,
  statusPrinter: customer.statusPrinter,
  isDiva: customer.isDiva,
  plans: customer.plans,
  twoFA: customer.twoFA,
})

export const createClinicExecutionConfig = (clinic: ClinicDetailsResponse): ClinicExecutionConfig => ({
  networkType: clinic.networkType,
  defaultCharacter: clinic.defaultCharacter,
  activePrint: clinic.activePrint,
  onlyPrint: clinic.onlyPrint,
  onlyElg: clinic.onlyElg,
  onlyForm: clinic.onlyForm,
  shortForm: clinic.shortForm,
  claimForm: clinic.claimForm,
  vouchers: clinic.vouchers,
  planChecker: clinic.planChecker,
  otherInformation: clinic.otherInformation,
  stateSetter: clinic.stateSetter,
  smartSearch: clinic.smartSearch,
  maxOutForm: clinic.maxOutForm,
})

export const mergeExecutionConfig = (
  currentConfig: string,
  nextConfig: CustomerExecutionConfig | ClinicExecutionConfig,
) =>
  JSON.stringify(
    {
      ...(parseExecutionMetadata(currentConfig) ?? {}),
      ...nextConfig,
    },
    null,
    2,
  )

export const formatCustomerExecutionConfig = (customer: CustomerDetailsResponse) =>
  JSON.stringify(createCustomerExecutionConfig(customer), null, 2)

export const formatClinicExecutionConfig = (clinic: ClinicDetailsResponse) =>
  JSON.stringify(createClinicExecutionConfig(clinic), null, 2)
