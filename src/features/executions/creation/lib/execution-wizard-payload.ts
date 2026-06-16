import type {
  ExecutionCreatePayload,
  ExecutionMetadata,
  ExecutionPayloadPatientPropertyDetail,
  ExecutionPayloadVerificationType,
  ExecutionSchedulePayload,
  ExecutionWizardDraft,
} from '../model/execution-create'
import { parseExecutionMetadata } from './execution-metadata'
import { isFutureDateTimeLocalValue } from './execution-wizard-validation'

const PATIENT_SOURCE_KEYS = {
  patientName: 'patient_first_name',
  patientLastName: 'patient_last_name',
  patientMemberId: 'memberid',
  patientDob: 'patient_dob',
  policyHolderName: 'subscriber_first_name',
  policyHolderLastName: 'subscriber_last_name',
  policyHolderDob: 'subscriber_dob',
  relationship: 'relationship_to_subscriber',
  zipCode: 'subscriber_zip_code',
} as const

const DEFAULT_HEADED_MODE = false

export const createDefaultBotOtherInformation = (): ExecutionMetadata => ({
  specifyPayer: 'None',
})

const createPatientProperty = (key: string, value: string): ExecutionPayloadPatientPropertyDetail => ({
  key,
  value: value.trim(),
})

const createPatientFilenames = (value: string) => {
  const filename = value.trim()

  return filename ? [filename] : []
}

export const buildExecutionPayload = (
  draft: ExecutionWizardDraft,
  createdBy: string,
  accessToken: string,
  apiUrl: string,
  rv: ExecutionMetadata | undefined,
): ExecutionCreatePayload | ExecutionSchedulePayload | null => {
  if (
    !createdBy ||
    !accessToken.trim() ||
    !apiUrl.trim() ||
    !rv ||
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
    context: {
      accessToken: accessToken.trim(),
      apiUrl: apiUrl.trim(),
      bot: {
        botName: draft.bot.botName.trim(),
        targetUrl: draft.bot.targetUrl.trim(),
        username: draft.bot.username.trim(),
        password: draft.bot.password.trim(),
        otherInformation: createDefaultBotOtherInformation(),
      },
      executionId: draft.execution.execution.trim(),
      patients: draft.execution.patients.map((patient, index) => ({
        patientName: createPatientProperty(PATIENT_SOURCE_KEYS.patientName, patient.patientName),
        patientLastName: createPatientProperty(PATIENT_SOURCE_KEYS.patientLastName, patient.patientLastName),
        patientMemberId: createPatientProperty(PATIENT_SOURCE_KEYS.patientMemberId, patient.patientMemberId),
        patientDob: createPatientProperty(PATIENT_SOURCE_KEYS.patientDob, patient.patientDob),
        policyHolderName: createPatientProperty(PATIENT_SOURCE_KEYS.policyHolderName, patient.policyHolderName),
        policyHolderLastName: createPatientProperty(
          PATIENT_SOURCE_KEYS.policyHolderLastName,
          patient.policyHolderLastName,
        ),
        policyHolderDob: createPatientProperty(PATIENT_SOURCE_KEYS.policyHolderDob, patient.policyHolderDob),
        relationship: createPatientProperty(PATIENT_SOURCE_KEYS.relationship, patient.relationship),
        zipCode: createPatientProperty(PATIENT_SOURCE_KEYS.zipCode, patient.zipCode),
        verificationType: patient.verificationType.toLowerCase() as ExecutionPayloadVerificationType,
        filenames: createPatientFilenames(patient.filenames),
        otherInformation: patientOtherInformation[index] ?? {},
      })),
      config: configMetadata,
      rv,
      headed: DEFAULT_HEADED_MODE,
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
