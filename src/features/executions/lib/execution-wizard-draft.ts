import type {
  ExecutionPatient,
  ExecutionWizardDraft,
} from '../model/execution-create'

export const createEmptyPatient = (): ExecutionPatient => ({
  patientName: '',
  memberId: '',
  dateOfBirth: '',
})

export const createEmptyDraft = (): ExecutionWizardDraft => ({
  bot: {
    botName: '',
    url: '',
    username: '',
    password: '',
  },
  execution: {
    patients: [createEmptyPatient()],
    numberOfThreads: '',
    mode: '',
    verificationType: '',
  },
  config: {
    'in-network': false,
    shortForm: false,
    claimsForm: false,
  },
})
