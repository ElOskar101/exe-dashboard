import type { ExecutionPatient, ExecutionWizardDraft } from '../model/execution-create'

export const createEmptyPatient = (): ExecutionPatient => ({
  patientName: '',
  patientLastName: '',
  patientMemberId: '',
  patientDob: '',
  policyHolderName: '',
  policyHolderLastName: '',
  policyHolderDob: '',
  relationship: '',
  zipCode: '',
  clinic: '',
  verificationType: '',
  filenames: '',
  otherInformation: '{\n  "plan": ""\n}',
})

export const createEmptyDraft = (): ExecutionWizardDraft => ({
  context: {
    project: '',
    client: '',
    clientName: '',
    clinic: '',
    clinicName: '',
  },
  bot: {
    clinicBotId: '',
    botName: '',
    targetUrl: '',
    username: '',
    password: '',
    verificationType: '',
  },
  execution: {
    execution: '',
    executionName: '',
    patients: [],
    workers: '2',
    retries: '1',
    config: '{}',
    scheduleMode: 'instant',
    scheduledAt: '',
  },
})
