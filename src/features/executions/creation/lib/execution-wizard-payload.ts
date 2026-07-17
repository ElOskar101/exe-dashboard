import type { CccApiEnvironment } from '@/app.config'
import type { ExecutionCreatePayload, ExecutionSchedulePayload } from '../../shared/model/execution-create-payload'
import type { ExecutionWizardDraft } from '../model/execution-create'
import { isFutureDateTimeLocalValue } from './execution-wizard-validation'

type ExecutionPayloadNumericPreviewValue = number | ''

export type ExecutionPayloadPreview = Omit<ExecutionCreatePayload, 'context'> & {
  context: Omit<ExecutionCreatePayload['context'], 'retries' | 'workers'> & {
    retries: ExecutionPayloadNumericPreviewValue
    workers: ExecutionPayloadNumericPreviewValue
  }
  scheduledAt?: string
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
  env: CccApiEnvironment,
): ExecutionPayloadPreview => {
  const botId = draft.bot.clinicBotId.trim()
  const payload: ExecutionPayloadPreview = {
    project: draft.context.project.trim(),
    createdBy: createdBy.trim(),
    client: draft.context.clientName.trim(),
    clinic: draft.context.clinicName.trim(),
    botName: draft.bot.botName.trim(),
    context: {
      env,
      bot: {
        ...(botId ? { id: botId } : {}),
        botName: draft.bot.botName.trim(),
        targetUrl: draft.bot.targetUrl.trim(),
        username: draft.bot.username.trim(),
        password: draft.bot.password.trim(),
        otherInformation: {},
      },
      clinicConfig: {},
      payloadConfigs: [],
      executionId: draft.execution.execution.trim(),
      patients: draft.execution.patients,
      workers: createExecutionPayloadNumberPreview(draft.execution.workers),
      retries: createExecutionPayloadNumberPreview(draft.execution.retries),
    },
  }

  if (draft.execution.scheduleMode === 'scheduled' && draft.execution.scheduledAt.trim()) {
    payload.scheduledAt = createExecutionPayloadScheduledAtPreview(draft.execution.scheduledAt)
  }

  return payload
}

export const buildExecutionPayload = (
  draft: ExecutionWizardDraft,
  createdBy: string,
  env: CccApiEnvironment,
): ExecutionCreatePayload | ExecutionSchedulePayload | null => {
  const payloadPreview = buildExecutionPayloadPreview(draft, createdBy, env)

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

  const payload: ExecutionCreatePayload = {
    ...payloadPreview,
    context: {
      ...payloadPreview.context,
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
