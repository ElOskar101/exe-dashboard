import { syncClient } from '@/lib/axios'
import type { ExecutionWizardMacroConfig } from '../model/execution-create'

export interface ClinicMacroConfig {
  shortConfig: ExecutionWizardMacroConfig
}

export interface ClinicMacroConfigResponse {
  code: number
  data: ClinicMacroConfig[]
  message: string
}

export const getClinicMacroConfig = (clinicId: string) =>
  syncClient.get<ClinicMacroConfigResponse>(`clinics/${clinicId}/macro-config`)
