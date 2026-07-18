import type { ExecutionVerificationType, Patient } from '../../shared/model/execution-create-payload'

export type ExecutionPatient = Patient

export type ExecutionScheduleMode = 'instant' | 'scheduled'

export interface ExecutionBot {
  clinicBotId: string
  botName: string
  targetUrl: string
  username: string
  password: string
  verificationType: ExecutionVerificationType | ''
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
    scheduleMode: ExecutionScheduleMode
    scheduledAt: string
  }
}

export type {
  ExecutionSchedulePayload,
  ExecutionVerificationType,
  Patient,
} from '../../shared/model/execution-create-payload'
