import type { CccApiEnvironment } from '@/app.config'

export type ExecutionVerificationType = 'ELG' | 'FBD'
export type ExecutionPayloadVerificationType = Lowercase<ExecutionVerificationType>

export type ExecutionMetadata = Record<string, unknown>

export interface PatientFileNames {
  fullForm: string | null
  shortForm: string | null
  claimsForm: string | null
  eligibilityPrint: string | null
  historyPrint: string | null
  claimsPrint: string | null
  otherDocuments: string[]
}

export type PatientCellValue = string | undefined

export interface PatientCells {
  patientName?: PatientCellValue
  patientDob?: PatientCellValue
  patientLastName?: PatientCellValue
  subscriberDob?: PatientCellValue
  subscriberName?: PatientCellValue
}

export interface Patient extends PatientCells {
  id?: string
  fileNames: PatientFileNames
}

export interface ExecutionPayloadBot {
  id?: string
  botName: string
  targetUrl: string
  username: string
  password: string
  verificationType?: ExecutionPayloadVerificationType
  otherInformation: ExecutionMetadata
}

export type ExecutionPayloadPatient = Patient

export interface ExecutionPayloadContext {
  executionId?: string
  sheetName?: string
  env: CccApiEnvironment
  bot: ExecutionPayloadBot
  clinicConfig: ExecutionMetadata
  formConfigs?: ExecutionMetadata
  payloadConfigs: Array<ExecutionMetadata>
  accessToken: string
  workers: number
  retries: number
  patients: Patient[]
}

export interface ExecutionCreatePayload {
  project: string
  createdBy: string
  client: string
  clinic: string
  execution: string
  botName: string
  context: ExecutionPayloadContext
}

export interface ExecutionSchedulePayload extends ExecutionCreatePayload {
  scheduledAt: string
}
