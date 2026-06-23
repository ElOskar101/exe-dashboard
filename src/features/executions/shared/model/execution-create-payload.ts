export type ExecutionVerificationType = 'ELG' | 'FBD'
export type ExecutionPayloadVerificationType = Lowercase<ExecutionVerificationType>

export type ExecutionMetadata = Record<string, unknown>

export interface ExecutionPayloadPatientPropertyDetail {
  key: string
  value: string
}

export interface ExecutionPayloadBot {
  botName: string
  targetUrl: string
  username: string
  password: string
  otherInformation?: ExecutionMetadata
}

export interface ExecutionPayloadPatient {
  id?: string
  patientName: ExecutionPayloadPatientPropertyDetail
  patientLastName: ExecutionPayloadPatientPropertyDetail
  patientMemberId: ExecutionPayloadPatientPropertyDetail
  patientDob: ExecutionPayloadPatientPropertyDetail
  policyHolderName: ExecutionPayloadPatientPropertyDetail
  policyHolderLastName: ExecutionPayloadPatientPropertyDetail
  policyHolderDob: ExecutionPayloadPatientPropertyDetail
  relationship: ExecutionPayloadPatientPropertyDetail
  zipCode: ExecutionPayloadPatientPropertyDetail
  clinic?: ExecutionPayloadPatientPropertyDetail
  verificationType: ExecutionPayloadVerificationType
  filenames: string[]
  otherInformation: ExecutionMetadata
}

export interface ExecutionPayloadContext {
  accessToken?: string
  apiUrl?: string
  bot: ExecutionPayloadBot
  config: ExecutionMetadata
  executionId?: string
  headed?: boolean
  logsPath?: string
  outputPath?: string
  patients: ExecutionPayloadPatient[]
  retries?: number
  rv: ExecutionMetadata
  workers?: number
}

export interface ExecutionCreatePayload {
  project: string
  createdBy: string
  client: string
  clinic: string
  execution?: string
  botName: string
  context: ExecutionPayloadContext
}

export interface ExecutionSchedulePayload extends ExecutionCreatePayload {
  scheduledAt: string
}
