import type {
  ExecutionCreatePayload,
  ExecutionWizardDraft,
} from '../model/execution-create'

export const buildExecutionPayload = (
  draft: ExecutionWizardDraft,
): ExecutionCreatePayload | null => {
  if (
    !draft.execution.numberOfThreads.trim() ||
    !draft.execution.mode ||
    !draft.execution.verificationType
  ) {
    return null
  }

  return {
    bot: {
      botName: draft.bot.botName.trim(),
      url: draft.bot.url.trim(),
      username: draft.bot.username.trim(),
      password: draft.bot.password,
    },
    execution: {
      patients: draft.execution.patients.map((patient) => ({
        patientName: patient.patientName.trim(),
        memberId: patient.memberId.trim(),
        dateOfBirth: patient.dateOfBirth,
      })),
      numberOfThreads: Number(draft.execution.numberOfThreads),
      mode: draft.execution.mode === 'parallel' ? 'parallel' : '',
      verificationType: draft.execution.verificationType,
    },
    config: draft.config,
  }
}
