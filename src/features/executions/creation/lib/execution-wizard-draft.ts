import type { ExecutionWizardDraft } from '../model/execution-create'

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
    scheduleMode: 'instant',
    scheduledAt: '',
  },
})
