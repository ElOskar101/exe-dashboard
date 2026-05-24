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
    project: 'liberty',
    client: '',
    clientName: '',
    clinic: '',
    clinicName: '',
  },
  bot: {
    botName: '',
    url: '',
    username: '',
    password: '',
    otherInformation: '{\n  "specifyPayer": "None"\n}',
  },
  execution: {
    patients: [createEmptyPatient()],
    workers: '2',
    retries: '1',
    config: '{}',
  },
})
