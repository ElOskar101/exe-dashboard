import type { ExecutionVerificationType } from '../../shared/model/execution-create-payload'

export type ExecutionScheduleMode = 'instant' | 'scheduled'

export interface ExecutionBot {
  clinicBotId: string
  botName: string
  targetUrl: string
  username: string
  password: string
  verificationType: ExecutionVerificationType | ''
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

export interface ExecutionWizardDraft {
  context: {
    project: string
    client: string
    clientName: string
    clinic: string
    clinicName: string
  }
  bot: ExecutionBot
  execution: {
    execution: string
    executionName: string
    patients: ExecutionPatient[]
    workers: string
    retries: string
    config: string
    scheduleMode: ExecutionScheduleMode
    scheduledAt: string
  }
}

export type {
  ExecutionCreatePayload,
  ExecutionMetadata,
  ExecutionPayloadPatientPropertyDetail,
  ExecutionPayloadVerificationType,
  ExecutionSchedulePayload,
  ExecutionVerificationType,
} from '../../shared/model/execution-create-payload'
