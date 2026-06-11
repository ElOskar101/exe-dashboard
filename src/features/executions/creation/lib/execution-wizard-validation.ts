import type { TFunction } from 'i18next'
import type { ExecutionPatient, ExecutionWizardDraft } from '../model/execution-create'
import { isExecutionMetadataStringValid } from './execution-metadata'

export type StepErrors = {
  context: Partial<Record<keyof ExecutionWizardDraft['context'], string>> & {
    createdBy?: string
  }
  patients: {
    form?: string
    rows: Array<Partial<Record<keyof ExecutionPatient, string>>>
  }
  bot: Partial<Record<'clinicBotId' | 'botName' | 'targetUrl' | 'username' | 'password', string>>
  config: {
    workers?: string
    retries?: string
    config?: string
    scheduledAt?: string
  }
}

interface ExecutionWizardValidationOptions {
  hasSelectedCustomerWithoutClinics?: boolean
  hasSelectedClinicWithoutActiveBots?: boolean
  hasSelectedProjectWithoutAssociatedBots?: boolean
  selectedBotMissingFromClinicBots?: boolean
}

const requiredPatientFields: Array<
  keyof Pick<ExecutionPatient, 'patientName' | 'patientLastName' | 'patientMemberId' | 'patientDob'>
> = ['patientName', 'patientLastName', 'patientMemberId', 'patientDob']

export const hasErrors = (errors: Record<string, string | undefined>) => {
  return Object.values(errors).some(Boolean)
}

export const getExecutionWizardValidationErrors = (
  draft: ExecutionWizardDraft,
  createdBy: string,
  t: TFunction<'executions'>,
  options: ExecutionWizardValidationOptions = {},
): StepErrors => {
  const context: StepErrors['context'] = {}

  if (!createdBy) {
    context.createdBy = t('validation.userRequired')
  }

  if (!draft.context.project.trim()) {
    context.project = t('validation.required')
  }

  if (!draft.context.client.trim()) {
    context.client = t('validation.required')
  }

  if (!draft.context.clinic.trim()) {
    context.clinic = t('validation.required')
  }

  if (options.hasSelectedCustomerWithoutClinics) {
    context.clinic = t('validation.customerHasNoClinics')
  }

  const patients: StepErrors['patients'] = {
    rows: draft.execution.patients.map((patient) => {
      const rowErrors: StepErrors['patients']['rows'][number] = {}

      requiredPatientFields.forEach((field) => {
        if (!patient[field].trim()) {
          rowErrors[field] = t('validation.required')
        }
      })

      if (!isExecutionMetadataStringValid(patient.otherInformation)) {
        rowErrors.otherInformation = t('validation.validJsonObject')
      }

      return rowErrors
    }),
  }

  const bot: StepErrors['bot'] = {}
  const hasSelectedProject = draft.context.project.trim().length > 0
  const hasSelectedBot = draft.bot.clinicBotId.trim().length > 0
  const hasEditableBotValues = [draft.bot.botName, draft.bot.targetUrl, draft.bot.username, draft.bot.password].some(
    (value) => value.trim().length > 0,
  )

  if (hasSelectedProject && !hasSelectedBot) {
    if (options.hasSelectedClinicWithoutActiveBots) {
      bot.clinicBotId = t('validation.noActiveClinicBots')
    } else if (options.hasSelectedProjectWithoutAssociatedBots) {
      bot.clinicBotId = t('validation.noAssociatedBots')
    } else {
      bot.clinicBotId = t('validation.required')
    }
  }

  if (hasSelectedBot && options.selectedBotMissingFromClinicBots) {
    bot.clinicBotId = t('validation.selectedBotNotInClinicBots')
  }

  if (hasSelectedBot || hasEditableBotValues) {
    if (!draft.bot.botName.trim()) {
      bot.botName = t('validation.required')
    }

    if (!draft.bot.targetUrl.trim()) {
      bot.targetUrl = t('validation.required')
    } else if (!isUrlValid(draft.bot.targetUrl)) {
      bot.targetUrl = t('validation.validUrl')
    }

    if (!draft.bot.username.trim()) {
      bot.username = t('validation.required')
    }

    if (!draft.bot.password.trim()) {
      bot.password = t('validation.required')
    }
  }

  const config: StepErrors['config'] = {}

  if (!draft.execution.workers.trim()) {
    config.workers = t('validation.required')
  } else if (!Number.isInteger(Number(draft.execution.workers)) || Number(draft.execution.workers) <= 0) {
    config.workers = t('validation.positiveNumber')
  }

  if (!draft.execution.retries.trim()) {
    config.retries = t('validation.required')
  } else if (!Number.isInteger(Number(draft.execution.retries)) || Number(draft.execution.retries) < 0) {
    config.retries = t('validation.nonNegativeNumber')
  }

  if (!isExecutionMetadataStringValid(draft.execution.config)) {
    config.config = t('validation.validJsonObject')
  }

  if (draft.execution.scheduleMode === 'scheduled') {
    if (!draft.execution.scheduledAt.trim()) {
      config.scheduledAt = t('validation.required')
    } else if (!isFutureDateTimeLocalValue(draft.execution.scheduledAt)) {
      config.scheduledAt = t('validation.futureDateTime')
    }
  }

  return {
    context,
    patients: {
      form: draft.execution.patients.length === 0 ? t('validation.addPatient') : undefined,
      rows: patients.rows,
    },
    bot,
    config,
  }
}

export const isFutureDateTimeLocalValue = (value: string) => {
  const scheduledAt = new Date(value)

  return !Number.isNaN(scheduledAt.getTime()) && scheduledAt.getTime() > Date.now()
}

const isUrlValid = (value: string) => {
  try {
    const parsedUrl = new URL(value)

    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}
