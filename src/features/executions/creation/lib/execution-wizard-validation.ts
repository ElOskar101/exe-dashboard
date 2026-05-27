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
  }
}

interface ExecutionWizardValidationOptions {
  hasSelectedCustomerWithoutClinics?: boolean
  hasSelectedClinicWithoutActiveBots?: boolean
  selectedClinicBotId?: string
  isDecryptingClinicBotPassword?: boolean
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
  const hasSelectedClinic = draft.context.clinic.trim().length > 0
  const selectedClinicBotId = options.selectedClinicBotId ?? draft.bot.clinicBotId
  const hasSelectedClinicBot = selectedClinicBotId.trim().length > 0
  const hasEditableBotValues = [draft.bot.botName, draft.bot.targetUrl, draft.bot.username, draft.bot.password].some(
    (value) => value.trim().length > 0,
  )

  if (hasSelectedClinic && !hasSelectedClinicBot) {
    bot.clinicBotId = options.hasSelectedClinicWithoutActiveBots
      ? t('validation.noActiveClinicBots')
      : t('validation.required')
  }

  if (!options.isDecryptingClinicBotPassword && (hasSelectedClinicBot || hasEditableBotValues)) {
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

const isUrlValid = (value: string) => {
  try {
    const parsedUrl = new URL(value)

    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}
