import { syncClient } from '@/lib/axios'
import type { ExecutionMetadata } from '../../shared/model/execution-create-payload'

interface ClinicCarriersConfigResponse {
  data: ExecutionMetadata
}

export const getClinicCarriersConfig = (clinicId: string) =>
  syncClient.get<ClinicCarriersConfigResponse>(`clinics/${clinicId}/carriers-config`)
