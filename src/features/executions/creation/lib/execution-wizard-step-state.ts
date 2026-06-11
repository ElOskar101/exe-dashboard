import type { ExecutionWizardDraft } from '../model/execution-create'
import { createEmptyDraft } from './execution-wizard-draft'

const emptyDraft = createEmptyDraft()

export const createEmptyBotSelection = (): ExecutionWizardDraft['bot'] => ({
  clinicBotId: '',
  botName: '',
  targetUrl: '',
  username: '',
  password: '',
  verificationType: '',
})

export const createEmptyExecutionSelection = (previousExecution: ExecutionWizardDraft['execution']) => ({
  ...previousExecution,
  execution: '',
  executionName: '',
  patients: [],
})

export const isPatientsStepDirty = (draft: ExecutionWizardDraft) => {
  return (
    draft.context.clientName !== emptyDraft.context.clientName ||
    draft.context.client !== emptyDraft.context.client ||
    draft.context.clinic !== emptyDraft.context.clinic ||
    draft.execution.execution !== emptyDraft.execution.execution ||
    draft.execution.patients.length !== emptyDraft.execution.patients.length
  )
}

export const isBotStepDirty = (draft: ExecutionWizardDraft) => {
  return (
    draft.context.project !== emptyDraft.context.project ||
    draft.bot.clinicBotId !== emptyDraft.bot.clinicBotId ||
    draft.bot.botName !== emptyDraft.bot.botName ||
    draft.bot.targetUrl !== emptyDraft.bot.targetUrl ||
    draft.bot.username !== emptyDraft.bot.username ||
    draft.bot.password !== emptyDraft.bot.password
  )
}

export const isConfigStepDirty = (draft: ExecutionWizardDraft) => {
  return (
    draft.execution.workers !== emptyDraft.execution.workers ||
    draft.execution.retries !== emptyDraft.execution.retries ||
    draft.execution.config !== emptyDraft.execution.config ||
    draft.execution.scheduleMode !== emptyDraft.execution.scheduleMode ||
    draft.execution.scheduledAt !== emptyDraft.execution.scheduledAt
  )
}
