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

type ExecutionPayloadNumericPreviewValue = number | ''

export type ExecutionPayloadPreview = Omit<ExecutionCreatePayload, 'context'> & {
  context: Omit<ExecutionCreatePayload['context'], 'retries' | 'workers'> & {
    retries: ExecutionPayloadNumericPreviewValue
    workers: ExecutionPayloadNumericPreviewValue
  }
  scheduledAt?: string
}

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
  clinic: 'practice',
} as const

const DEFAULT_HEADED_MODE = false
const CLIENT_NAME_CONFIG_KEY = 'clientName'
const CLINIC_NAME_CONFIG_KEY = 'clinicName'

export const createDefaultBotOtherInformation = (): ExecutionMetadata => ({})

const createPatientProperty = (key: string, value: string): ExecutionPayloadPatientPropertyDetail => ({
  key,
  value: value.trim(),
})

const createPatientFilenames = (value: string) => {
  const filename = value.trim()

  return filename ? [filename] : []
}

const createExecutionPayloadNumberPreview = (value: string): ExecutionPayloadNumericPreviewValue => {
  const trimmedValue = value.trim()

  return trimmedValue ? Number(trimmedValue) : ''
}

const createExecutionPayloadScheduledAtPreview = (value: string) => {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  const scheduledAt = new Date(trimmedValue)

  return Number.isNaN(scheduledAt.getTime()) ? trimmedValue : scheduledAt.toISOString()
}

export const buildExecutionPayloadPreview = (
  draft: ExecutionWizardDraft,
  createdBy: string,
  accessToken: string,
  apiUrl: string,
  rv: ExecutionMetadata | undefined,
): ExecutionPayloadPreview => {
  const patientOtherInformation = draft.execution.patients.map((patient) =>
    parseExecutionMetadata(patient.otherInformation),
  )
  const configMetadata = parseExecutionMetadata(draft.execution.config)
  const configWithSelectedNames = {
    ...(configMetadata ?? {}),
    [CLIENT_NAME_CONFIG_KEY]: draft.context.clientName.trim(),
    [CLINIC_NAME_CONFIG_KEY]: draft.context.clinicName.trim(),
  }
  const execution = draft.execution.executionName.trim() || draft.execution.execution.trim()
  const payload: ExecutionPayloadPreview = {
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
        ...(patient.id?.trim() ? { id: patient.id.trim() } : {}),
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
        ...(patient.clinic.trim() ? { clinic: createPatientProperty(PATIENT_SOURCE_KEYS.clinic, patient.clinic) } : {}),
        verificationType: patient.verificationType.toLowerCase() as ExecutionPayloadVerificationType,
        filenames: createPatientFilenames(patient.filenames),
        otherInformation: patientOtherInformation[index] ?? {},
      })),
      config: configWithSelectedNames,
      rv: rv ?? {},
      headed: DEFAULT_HEADED_MODE,
      workers: createExecutionPayloadNumberPreview(draft.execution.workers),
      retries: createExecutionPayloadNumberPreview(draft.execution.retries),
    },
  }

  if (execution) {
    payload.execution = execution
  }

  if (draft.execution.scheduleMode === 'scheduled' && draft.execution.scheduledAt.trim()) {
    payload.scheduledAt = createExecutionPayloadScheduledAtPreview(draft.execution.scheduledAt)
  }

  return payload
}

export const buildExecutionPayload = (
  draft: ExecutionWizardDraft,
  createdBy: string,
  accessToken: string,
  apiUrl: string,
  rv: ExecutionMetadata | undefined,
): ExecutionCreatePayload | ExecutionSchedulePayload | null => {
  const payloadPreview = buildExecutionPayloadPreview(draft, createdBy, accessToken, apiUrl, rv)

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
    ...payloadPreview,
    context: {
      ...payloadPreview.context,
      config: payloadPreview.context.config,
      rv,
      workers: Number(draft.execution.workers),
      retries: Number(draft.execution.retries),
    },
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
