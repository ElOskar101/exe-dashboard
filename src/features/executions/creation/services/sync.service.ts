import { syncClient } from '@/lib/axios'
import type { ExecutionMetadata } from '../../shared/model/execution-create-payload'

export interface ClinicMacroConfig {
  shortConfig: ExecutionMetadata
}

export interface ClinicMacroConfigResponse {
  code: number
  data: ClinicMacroConfig[]
  message: string
}

export const getClinicMacroConfig = (clinicId: string) =>
  syncClient.get<ClinicMacroConfigResponse>(`clinics/${clinicId}/macro-config`)
