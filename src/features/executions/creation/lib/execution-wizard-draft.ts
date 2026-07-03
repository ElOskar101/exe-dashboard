import type { ExecutionPatient, ExecutionWizardDraft } from '../model/execution-create'

export const createEmptyPatient = (): ExecutionPatient => ({
  carrierName: '',
  executed: false,
  review: false,
  insuranceVerificationProcessResults: '',
  insuranceVerificationStatus: '',
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
    config: null,
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
    patientFilter: 'all',
    patients: [],
    workers: '2',
    retries: '1',
    scheduleMode: 'instant',
    scheduledAt: '',
  },
})
