import type { TFunction } from 'i18next'
import type { ExecutionPatient, ExecutionWizardDraft } from '../model/execution-create'

export type StepErrors = {
  context: Partial<Record<keyof ExecutionWizardDraft['context'], string>> & {
    createdBy?: string
  }
  bot: Partial<Record<keyof ExecutionWizardDraft['bot'], string>>
  patients: {
    form?: string
    rows: Array<Partial<Record<keyof ExecutionPatient, string>>>
  }
  config: {
    workers?: string
    retries?: string
    config?: string
  }
}

interface ExecutionWizardValidationOptions {
  hasSelectedCustomerWithoutClinics?: boolean
}

const isDateStringValid = (value: string) => {
  if (!value) {
    return false
  }

  return !Number.isNaN(Date.parse(value))
}

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

  const bot: StepErrors['bot'] = {}

  if (!draft.bot.botName.trim()) {
    bot.botName = t('validation.required')
  }

  if (!draft.bot.url.trim()) {
    bot.url = t('validation.required')
  } else if (!URL.canParse(draft.bot.url)) {
    bot.url = t('validation.validUrl')
  }

  if (!draft.bot.username.trim()) {
    bot.username = t('validation.required')
  }

  if (!draft.bot.password.trim()) {
    bot.password = t('validation.required')
  }

  if (!isJsonObjectStringValid(draft.bot.otherInformation)) {
    bot.otherInformation = t('validation.validJsonObject')
  }

  const patients = draft.execution.patients.map((patient) => {
    const rowErrors: StepErrors['patients']['rows'][number] = {}

    if (patient.patientDob.trim() && !isDateStringValid(patient.patientDob)) {
      rowErrors.patientDob = t('validation.validDate')
    }

    if (patient.policyHolderDob.trim() && !isDateStringValid(patient.policyHolderDob)) {
      rowErrors.policyHolderDob = t('validation.validDate')
    }

    if (!isJsonObjectStringValid(patient.otherInformation)) {
      rowErrors.otherInformation = t('validation.validJsonObject')
    }

    return rowErrors
  })

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

  if (!isJsonObjectStringValid(draft.execution.config)) {
    config.config = t('validation.validJsonObject')
  }

  return {
    context,
    bot,
    patients: {
      form: draft.execution.patients.length === 0 ? t('validation.addPatient') : undefined,
      rows: patients,
    },
    config,
  }
}

const isJsonObjectStringValid = (value: string) => {
  try {
    const parsed = JSON.parse(value)

    return Boolean(parsed) && !Array.isArray(parsed) && typeof parsed === 'object'
  } catch {
    return false
  }
}
