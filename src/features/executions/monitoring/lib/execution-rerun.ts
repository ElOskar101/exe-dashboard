import type { ExecutionCreatePayload, ExecutionMetadata } from '@/features/executions/creation'
import type { IExecution } from '@/features/executions/shared'

export interface ExecutionRerunSummary {
  botName: string
  client: string
  clinic: string
  execution: string | null
  patientCount: number
  project: string
  retries: number
  workers: number
}

export interface ExecutionRerunPreparation {
  missingFields: string[]
  payload: ExecutionCreatePayload | null
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && !Array.isArray(value) && typeof value === 'object'
}

const getString = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : ''
}

const getMetadataObject = (value: unknown): ExecutionMetadata | null => {
  return isRecord(value) ? (value as ExecutionMetadata) : null
}

const getMetadataObjectOrFallback = (value: unknown, fallback: ExecutionMetadata): ExecutionMetadata => {
  return getMetadataObject(value) ?? fallback
}

const getNumber = (value: unknown) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const pushMissingField = (missingFields: string[], field: string) => {
  if (!missingFields.includes(field)) {
    missingFields.push(field)
  }
}

const getRequiredString = (value: unknown, field: string, missingFields: string[]) => {
  const resolvedValue = getString(value)

  if (!resolvedValue) {
    pushMissingField(missingFields, field)
  }

  return resolvedValue
}

const getRequiredNumber = (value: unknown, field: string, missingFields: string[]) => {
  const resolvedValue = getNumber(value)

  if (resolvedValue === null) {
    pushMissingField(missingFields, field)
  }

  return resolvedValue
}

const normalizeVerificationType = (
  value: unknown,
): ExecutionCreatePayload['meta']['patients'][number]['verificationType'] => {
  return typeof value === 'string'
    ? (value.toLowerCase() as ExecutionCreatePayload['meta']['patients'][number]['verificationType'])
    : ''
}

const getRerunBotPayload = (value: unknown, missingFields: string[]): ExecutionCreatePayload['meta']['bot'] | null => {
  if (!isRecord(value)) {
    pushMissingField(missingFields, 'meta.bot')
    return null
  }

  const botName = getRequiredString(value.botName, 'meta.bot.botName', missingFields)
  const targetUrl = getRequiredString(value.targetUrl, 'meta.bot.targetUrl', missingFields)
  const username = getRequiredString(value.username, 'meta.bot.username', missingFields)
  const password = getRequiredString(value.password, 'meta.bot.password', missingFields)
  const otherInformation = getMetadataObjectOrFallback(value.otherInformation, {})

  if (!botName || !targetUrl || !username || !password) {
    return null
  }

  return {
    botName,
    targetUrl,
    username,
    password,
    otherInformation,
  }
}

const getRerunPatientPayload = (
  value: unknown,
  index: number,
  missingFields: string[],
): ExecutionCreatePayload['meta']['patients'][number] | null => {
  const fieldPrefix = `meta.patients[${index}]`

  if (!isRecord(value)) {
    pushMissingField(missingFields, fieldPrefix)
    return null
  }

  const patientName = getRequiredString(value.patientName, `${fieldPrefix}.patientName`, missingFields)
  const patientLastName = getRequiredString(value.patientLastName, `${fieldPrefix}.patientLastName`, missingFields)
  const patientMemberId = getRequiredString(value.patientMemberId, `${fieldPrefix}.patientMemberId`, missingFields)
  const patientDob = getRequiredString(value.patientDob, `${fieldPrefix}.patientDob`, missingFields)
  const policyHolderName = getRequiredString(value.policyHolderName, `${fieldPrefix}.policyHolderName`, missingFields)
  const policyHolderLastName = getRequiredString(
    value.policyHolderLastName,
    `${fieldPrefix}.policyHolderLastName`,
    missingFields,
  )
  const policyHolderDob = getRequiredString(value.policyHolderDob, `${fieldPrefix}.policyHolderDob`, missingFields)
  const relationship = getRequiredString(value.relationship, `${fieldPrefix}.relationship`, missingFields)
  const zipCode = getRequiredString(value.zipCode, `${fieldPrefix}.zipCode`, missingFields)
  const clinic = getString(value.clinic)
  const verificationType = normalizeVerificationType(value.verificationType)
  const filenames = getRequiredString(value.filenames, `${fieldPrefix}.filenames`, missingFields)
  const otherInformation = getMetadataObjectOrFallback(value.otherInformation, {})

  if (
    !patientName ||
    !patientLastName ||
    !patientMemberId ||
    !patientDob ||
    !policyHolderName ||
    !policyHolderLastName ||
    !policyHolderDob ||
    !relationship ||
    !zipCode ||
    !filenames
  ) {
    return null
  }

  return {
    patientName,
    patientLastName,
    patientMemberId,
    patientDob,
    policyHolderName,
    policyHolderLastName,
    policyHolderDob,
    relationship,
    zipCode,
    ...(clinic ? { clinic } : {}),
    verificationType,
    filenames,
    otherInformation,
  }
}

const getRerunMetaPayload = (meta: unknown, missingFields: string[]): ExecutionCreatePayload['meta'] | null => {
  if (!isRecord(meta)) {
    pushMissingField(missingFields, 'meta')
    return null
  }

  const bot = getRerunBotPayload(meta.bot, missingFields)
  const patientsValue = Array.isArray(meta.patients) ? meta.patients : null
  const patients = patientsValue?.map((patient, index) => getRerunPatientPayload(patient, index, missingFields)) ?? null
  const config = getMetadataObjectOrFallback(meta.config, {})
  const workers = getRequiredNumber(meta.workers, 'meta.workers', missingFields)
  const retries = getRequiredNumber(meta.retries, 'meta.retries', missingFields)

  if (!patientsValue || patientsValue.length === 0) {
    pushMissingField(missingFields, 'meta.patients')
  }

  if (!bot || !patients || patients.some((patient) => !patient) || workers === null || retries === null) {
    return null
  }

  return {
    bot,
    patients: patients.filter((patient): patient is NonNullable<typeof patient> => patient !== null),
    config,
    rv: {},
    workers,
    retries,
  }
}

export const prepareExecutionRerun = (execution: IExecution): ExecutionRerunPreparation => {
  const missingFields: string[] = []
  const project = getRequiredString(execution.playwrightProject, 'project', missingFields)
  const createdBy = getRequiredString(execution.createdBy, 'createdBy', missingFields)
  const client = getRequiredString(execution.client, 'client', missingFields)
  const clinic = getRequiredString(execution.clinic, 'clinic', missingFields)
  const meta = getRerunMetaPayload(execution.meta, missingFields)
  const botName = getString(execution.botName) || getString(meta?.bot.botName) || getString(execution.bot) || ''
  const rerunExecution = execution.execution.trim()

  if (!botName) {
    pushMissingField(missingFields, 'botName')
  }

  return {
    missingFields,
    payload:
      project && createdBy && client && clinic && botName && meta
        ? {
            project,
            createdBy,
            client,
            clinic,
            ...(rerunExecution ? { execution: rerunExecution } : {}),
            botName,
            meta,
          }
        : null,
  }
}

export const buildExecutionRerunPayload = (execution: IExecution): ExecutionCreatePayload | null => {
  return prepareExecutionRerun(execution).payload
}

export const getExecutionRerunSummary = (
  execution: IExecution,
  payload?: ExecutionCreatePayload | null,
): ExecutionRerunSummary => {
  return {
    botName: payload?.botName || execution.botName || execution.bot || '',
    client: execution.client,
    clinic: execution.clinic,
    execution: payload?.execution ?? execution.execution ?? null,
    patientCount: payload?.meta.patients.length ?? 0,
    project: payload?.project || execution.playwrightProject || '',
    retries: payload?.meta.retries ?? 0,
    workers: payload?.meta.workers ?? 0,
  }
}
