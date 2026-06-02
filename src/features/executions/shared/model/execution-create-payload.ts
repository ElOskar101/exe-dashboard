export type ExecutionVerificationType = 'ELG' | 'FBD'

export type ExecutionMetadata = Record<string, unknown>

export interface ExecutionPayloadBot {
  botName: string
  targetUrl: string
  username: string
  password: string
  otherInformation: ExecutionMetadata
}

export interface ExecutionPayloadPatient {
  patientName: string
  patientLastName: string
  patientMemberId: string
  patientDob: string
  policyHolderName: string
  policyHolderLastName: string
  policyHolderDob: string
  relationship: string
  zipCode: string
  clinic?: string
  verificationType: Lowercase<ExecutionVerificationType> | ''
  filenames: string
  otherInformation: ExecutionMetadata
}

export interface ExecutionPayloadMeta {
  bot: ExecutionPayloadBot
  patients: ExecutionPayloadPatient[]
  config: ExecutionMetadata
  rv: Record<string, never>
  workers: number
  retries: number
}

export interface ExecutionCreatePayload {
  project: string
  createdBy: string
  client: string
  clinic: string
  execution?: string
  botName: string
  meta: ExecutionPayloadMeta
}
