import type { ExecutionCreatePayload } from '@/features/executions/creation'
import type { Execution } from '@/features/executions/shared'

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

const pushMissingField = (missingFields: string[], field: string) => {
  if (!missingFields.includes(field)) {
    missingFields.push(field)
  }
}

const getRequiredString = (value: string | undefined, field: string, missingFields: string[]) => {
  const resolvedValue = value?.trim() ?? ''

  if (!resolvedValue) {
    pushMissingField(missingFields, field)
  }

  return resolvedValue
}

const normalizeRerunPatients = (patients: ExecutionCreatePayload['meta']['patients']) => {
  return patients.map(({ clinic, ...patient }) => ({
    ...patient,
    ...(clinic?.trim() ? { clinic: clinic.trim() } : {}),
  }))
}

export const prepareExecutionRerun = (execution: Execution): ExecutionRerunPreparation => {
  const missingFields: string[] = []
  const project = getRequiredString(execution.playwrightProject, 'project', missingFields)
  const createdBy = getRequiredString(execution.createdBy, 'createdBy', missingFields)
  const client = getRequiredString(execution.client, 'client', missingFields)
  const clinic = getRequiredString(execution.clinic, 'clinic', missingFields)

  if (!execution.meta) {
    pushMissingField(missingFields, 'meta')
  }

  const botName = getRequiredString(
    execution.botName ?? execution.meta?.bot.botName ?? execution.bot,
    'botName',
    missingFields,
  )
  const rerunExecution = execution.execution.trim()

  if (!execution.meta || missingFields.length > 0) {
    return {
      missingFields,
      payload: null,
    }
  }

  return {
    missingFields,
    payload: {
      project,
      createdBy,
      client,
      clinic,
      ...(rerunExecution ? { execution: rerunExecution } : {}),
      botName,
      meta: {
        ...execution.meta,
        bot: {
          ...execution.meta.bot,
          botName,
        },
        patients: normalizeRerunPatients(execution.meta.patients),
        rv: {},
      },
    },
  }
}

export const buildExecutionRerunPayload = (execution: Execution): ExecutionCreatePayload | null => {
  return prepareExecutionRerun(execution).payload
}

export const getExecutionRerunSummary = (
  execution: Execution,
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
