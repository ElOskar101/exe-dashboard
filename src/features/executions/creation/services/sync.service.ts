import { syncClient } from '@/lib/axios'
import type { ExecutionMetadata } from '../../shared/model/execution-create-payload'

interface ClinicCarriersConfigData extends ExecutionMetadata {
  formConfig?: ExecutionMetadata
}

interface ClinicCarriersConfigResponse {
  data: ClinicCarriersConfigData
}

export const getClinicCarriersConfig = (clinicId: string) =>
  syncClient.get<ClinicCarriersConfigResponse>(`clinics/${clinicId}/carriers-config`)
