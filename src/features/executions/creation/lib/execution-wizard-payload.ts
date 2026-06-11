import type {
  ExecutionCreatePayload,
  ExecutionMetadata,
  ExecutionSchedulePayload,
  ExecutionWizardDraft,
} from '../model/execution-create'
import { parseExecutionMetadata } from './execution-metadata'
import { isFutureDateTimeLocalValue } from './execution-wizard-validation'

export const createDefaultBotOtherInformation = (): ExecutionMetadata => ({
  specifyPayer: 'None',
})

export const buildExecutionPayload = (
  draft: ExecutionWizardDraft,
  createdBy: string,
): ExecutionCreatePayload | ExecutionSchedulePayload | null => {
  if (
    !createdBy ||
    !draft.context.project.trim() ||
    !draft.context.client.trim() ||
    !draft.context.clientName.trim() ||
    !draft.context.clinic.trim() ||
    !draft.context.clinicName.trim() ||
    !draft.bot.clinicBotId.trim() ||
    !draft.bot.botName.trim() ||
    !draft.bot.targetUrl.trim() ||
    !draft.bot.username.trim() ||
    !draft.bot.password.trim() ||
    !draft.execution.workers.trim() ||
    !draft.execution.retries.trim()
  ) {
    return null
  }

  const patientOtherInformation = draft.execution.patients.map((patient) =>
    parseExecutionMetadata(patient.otherInformation),
  )
  const configMetadata = parseExecutionMetadata(draft.execution.config)

  if (patientOtherInformation.some((metadata) => !metadata) || !configMetadata) {
    return null
  }

  const payload: ExecutionCreatePayload = {
    project: draft.context.project.trim(),
    createdBy: createdBy.trim(),
    client: draft.context.clientName.trim(),
    clinic: draft.context.clinicName.trim(),
    botName: draft.bot.botName.trim(),
    meta: {
      bot: {
        botName: draft.bot.botName.trim(),
        targetUrl: draft.bot.targetUrl.trim(),
        username: draft.bot.username.trim(),
        password: draft.bot.password.trim(),
        otherInformation: createDefaultBotOtherInformation(),
      },
      patients: draft.execution.patients.map((patient, index) => ({
        patientName: patient.patientName.trim(),
        patientLastName: patient.patientLastName.trim(),
        patientMemberId: patient.patientMemberId.trim(),
        patientDob: patient.patientDob,
        policyHolderName: patient.policyHolderName.trim(),
        policyHolderLastName: patient.policyHolderLastName.trim(),
        policyHolderDob: patient.policyHolderDob,
        relationship: patient.relationship.trim(),
        zipCode: patient.zipCode.trim(),
        ...(patient.clinic.trim() ? { clinic: patient.clinic.trim() } : {}),
        verificationType: patient.verificationType.toLowerCase() as Lowercase<typeof patient.verificationType>,
        filenames: patient.filenames.trim(),
        otherInformation: patientOtherInformation[index] ?? {},
      })),
      config: configMetadata,
      rv: {},
      workers: Number(draft.execution.workers),
      retries: Number(draft.execution.retries),
    },
  }

  const execution = draft.execution.executionName.trim() || draft.execution.execution.trim()

  if (execution) {
    payload.execution = execution
  }

  if (draft.execution.scheduleMode === 'scheduled') {
    if (!isFutureDateTimeLocalValue(draft.execution.scheduledAt)) {
      return null
    }

    return {
      ...payload,
      scheduledAt: new Date(draft.execution.scheduledAt).toISOString(),
    }
  }

  return payload
}
