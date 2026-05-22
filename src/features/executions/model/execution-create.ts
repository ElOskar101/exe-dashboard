export interface ExecutionBot {
  botName: string
  url: string
  username: string
  password: string
  otherInformation: string
}

export interface ExecutionPatient {
  patientName: string
  patientLastName: string
  patientMemberId: string
  patientDob: string
  policyHolderName: string
  policyHolderLastName: string
  policyHolderDob: string
  relationship: string
  zipCode: string
  clinic: string
  verificationType: ExecutionVerificationType | ''
  filenames: string
  otherInformation: string
}

export type ExecutionVerificationType = 'ELG' | 'FBD'

export type ExecutionMetadata = Record<string, unknown>

export interface ExecutionCreatePayload {
  project: string
  createdBy: string
  client: string
  clinic: string
  botName: string
  meta: {
    bot: {
      botName: string
      targetUrl: string
      username: string
      password: string
      otherInformation: ExecutionMetadata
    }
    patients: Array<{
      patientName: string
      patientLastName: string
      patientMemberId: string
      patientDob: string
      policyHolderName: string
      policyHolderLastName: string
      policyHolderDob: string
      relationship: string
      zipCode: string
      clinic: string
      verificationType: Lowercase<ExecutionVerificationType> | ''
      filenames: string
      otherInformation: ExecutionMetadata
    }>
    config: Record<string, never>
    rv: Record<string, never>
    workers: number
    retries: number
  }
}

export interface ExecutionWizardDraft {
  context: {
    project: string
    client: string
    clinic: string
  }
  bot: ExecutionBot
  execution: {
    patients: ExecutionPatient[]
    workers: string
    retries: string
  }
}
