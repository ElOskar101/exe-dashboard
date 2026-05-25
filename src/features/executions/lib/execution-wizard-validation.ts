import type { TFunction } from 'i18next'
import type { ExecutionPatient, ExecutionWizardDraft } from '../model/execution-create'

export type StepErrors = {
  context: Partial<Record<keyof ExecutionWizardDraft['context'], string>> & {
    createdBy?: string
  }
  patients: {
    bot?: string
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
  hasSelectedClinicWithoutActiveBots?: boolean
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

      if (!isJsonObjectStringValid(patient.otherInformation)) {
        rowErrors.otherInformation = t('validation.validJsonObject')
      }

      return rowErrors
    }),
  }

  if (draft.context.clinic.trim() && !draft.bot.clinicBotId.trim()) {
    patients.bot = options.hasSelectedClinicWithoutActiveBots
      ? t('validation.noActiveClinicBots')
      : t('validation.required')
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

  if (!isJsonObjectStringValid(draft.execution.config)) {
    config.config = t('validation.validJsonObject')
  }

  return {
    context,
    patients: {
      bot: patients.bot,
      form: draft.execution.patients.length === 0 ? t('validation.addPatient') : undefined,
      rows: patients.rows,
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
