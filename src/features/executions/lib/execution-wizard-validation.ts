import type { TFunction } from 'i18next'
import type {
  ExecutionPatient,
  ExecutionWizardDraft,
} from '../model/execution-create'

export type StepErrors = {
  bot: Partial<Record<keyof ExecutionWizardDraft['bot'], string>>
  patients: {
    form?: string
    rows: Array<Partial<Record<keyof ExecutionPatient, string>>>
  }
  config: {
    numberOfThreads?: string
    mode?: string
    verificationType?: string
  }
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
  t: TFunction<'executions'>,
): StepErrors => {
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

  const patients = draft.execution.patients.map((patient) => {
    const rowErrors: StepErrors['patients']['rows'][number] = {}

    if (!patient.patientName.trim()) {
      rowErrors.patientName = t('validation.required')
    }

    if (!patient.memberId.trim()) {
      rowErrors.memberId = t('validation.required')
    }

    if (!patient.dateOfBirth.trim()) {
      rowErrors.dateOfBirth = t('validation.required')
    } else if (!isDateStringValid(patient.dateOfBirth)) {
      rowErrors.dateOfBirth = t('validation.validDate')
    }

    return rowErrors
  })

  const config: StepErrors['config'] = {}

  if (!draft.execution.numberOfThreads.trim()) {
    config.numberOfThreads = t('validation.required')
  } else if (
    !Number.isInteger(Number(draft.execution.numberOfThreads)) ||
    Number(draft.execution.numberOfThreads) <= 0
  ) {
    config.numberOfThreads = t('validation.positiveNumber')
  }

  if (!draft.execution.mode) {
    config.mode = t('validation.selectMode')
  }

  if (!draft.execution.verificationType) {
    config.verificationType = t('validation.selectVerificationType')
  }

  return {
    bot,
    patients: {
      form:
        draft.execution.patients.length === 0
          ? t('validation.addPatient')
          : undefined,
      rows: patients,
    },
    config,
  }
}
