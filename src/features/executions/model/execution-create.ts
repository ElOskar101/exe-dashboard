export interface ExecutionBot {
  botName: string
  url: string
  username: string
  password: string
}

export interface ExecutionPatient {
  patientName: string
  memberId: string
  dateOfBirth: string
}

export type ExecutionVerificationType = 'ELG' | 'FBD'

export interface ExecutionCreatePayload {
  bot: ExecutionBot
  execution: {
    patients: ExecutionPatient[]
    numberOfThreads: number
    mode: 'parallel' | ''
    verificationType: ExecutionVerificationType
  }
  config: {
    'in-network': boolean
    shortForm: boolean
    claimsForm: boolean
  }
}

export type ExecutionModeOption = 'parallel' | 'standard' | ''

export interface ExecutionWizardDraft {
  bot: ExecutionBot
  execution: {
    patients: ExecutionPatient[]
    numberOfThreads: string
    mode: ExecutionModeOption
    verificationType: ExecutionVerificationType | ''
  }
  config: ExecutionCreatePayload['config']
}
