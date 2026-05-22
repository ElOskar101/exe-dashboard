import type {
  ExecutionCreatePayload,
  ExecutionMetadata,
  ExecutionWizardDraft,
} from '../model/execution-create'

const parseMetadata = (value: string): ExecutionMetadata | null => {
  try {
    const parsed = JSON.parse(value)

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return null
    }

    return parsed as ExecutionMetadata
  } catch {
    return null
  }
}

export const buildExecutionPayload = (
  draft: ExecutionWizardDraft,
  createdBy: string,
): ExecutionCreatePayload | null => {
  if (
    !createdBy ||
    !draft.context.project.trim() ||
    !draft.context.client.trim() ||
    !draft.context.clinic.trim() ||
    !draft.bot.botName.trim() ||
    !draft.bot.url.trim() ||
    !draft.bot.username.trim() ||
    !draft.bot.password.trim() ||
    !draft.execution.workers.trim() ||
    !draft.execution.retries.trim()
  ) {
    return null
  }

  const botOtherInformation = parseMetadata(draft.bot.otherInformation)
  const patientOtherInformation = draft.execution.patients.map((patient) =>
    parseMetadata(patient.otherInformation),
  )
  const configMetadata = parseMetadata(draft.execution.config)

  if (
    !botOtherInformation ||
    patientOtherInformation.some((metadata) => !metadata) ||
    !configMetadata
  ) {
    return null
  }

  return {
    project: draft.context.project.trim(),
    createdBy,
    client: draft.context.client.trim(),
    clinic: draft.context.clinic.trim(),
    botName: draft.bot.botName.trim(),
    meta: {
      bot: {
        botName: draft.bot.botName.trim(),
        targetUrl: draft.bot.url.trim(),
        username: draft.bot.username.trim(),
        password: draft.bot.password,
        otherInformation: botOtherInformation,
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
        clinic: patient.clinic.trim(),
        verificationType: patient.verificationType.toLowerCase() as Lowercase<
          typeof patient.verificationType
        >,
        filenames: patient.filenames.trim(),
        otherInformation: patientOtherInformation[index] ?? {},
      })),
      config: configMetadata,
      rv: {},
      workers: Number(draft.execution.workers),
      retries: Number(draft.execution.retries),
    },
  }
}
