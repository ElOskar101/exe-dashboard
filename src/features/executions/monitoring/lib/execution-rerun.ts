import type { Execution, ExecutionCreatePayload, ExecutionPayloadPatient } from '@/features/executions/shared'

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

const normalizeRerunPatients = (patients: ExecutionPayloadPatient[]) => patients

export const prepareExecutionRerun = (execution: Execution): ExecutionRerunPreparation => {
  const missingFields: string[] = []
  const project = getRequiredString(execution.project, 'project', missingFields)
  const createdBy = getRequiredString(execution.createdBy, 'createdBy', missingFields)
  const client = getRequiredString(execution.client, 'client', missingFields)
  const clinic = getRequiredString(execution.clinic, 'clinic', missingFields)

  const context = execution.context

  const botName = getRequiredString(execution.botName ?? context.bot.botName ?? execution.bot, 'botName', missingFields)
  const rerunExecution = execution.execution.trim()

  if (missingFields.length > 0) {
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
      context: {
        ...context,
        bot: {
          ...context.bot,
          botName,
        },
        patients: normalizeRerunPatients(context.patients),
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
    patientCount: payload?.context.patients.length ?? 0,
    project: payload?.project || execution.project || '',
    retries: payload?.context.retries ?? 0,
    workers: payload?.context.workers ?? 0,
  }
}
