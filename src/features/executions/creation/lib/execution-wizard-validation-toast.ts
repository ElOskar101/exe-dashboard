import type { TFunction } from 'i18next'
import type { ExecutionPatient } from '../model/execution-create'
import type { StepErrors } from './execution-wizard-validation'

interface ExecutionWizardValidationToastCopy {
  title: string
  description: string
}

const patientFieldLabels: Record<keyof ExecutionPatient, `fields.${string}`> = {
  patientName: 'fields.patientName',
  patientLastName: 'fields.patientLastName',
  patientMemberId: 'fields.memberId',
  patientDob: 'fields.patientDob',
  policyHolderName: 'fields.policyHolderName',
  policyHolderLastName: 'fields.policyHolderLastName',
  policyHolderDob: 'fields.patientDob',
  relationship: 'fields.relationship',
  zipCode: 'fields.zipCode',
  clinic: 'fields.patientClinic',
  verificationType: 'fields.verificationType',
  filenames: 'fields.filenames',
  otherInformation: 'fields.patientOtherInformation',
}

const addFieldSummary = (
  items: Set<string>,
  error: string | undefined,
  fieldLabel: string,
  passthroughErrors: Set<string>,
) => {
  if (!error) {
    return
  }

  if (passthroughErrors.has(error)) {
    items.add(error)
    return
  }

  items.add(fieldLabel)
}

export const getExecutionWizardValidationToastCopy = (
  errors: StepErrors,
  t: TFunction<'executions'>,
  maxItems = 5,
): ExecutionWizardValidationToastCopy | null => {
  const items = new Set<string>()
  const passthroughErrors = new Set([
    t('validation.customerHasNoClinics'),
    t('validation.noActiveClinicBots'),
    t('validation.noAssociatedBots'),
    t('validation.userRequired'),
  ])

  addFieldSummary(items, errors.context.createdBy, t('validation.userRequired'), passthroughErrors)
  addFieldSummary(items, errors.context.project, t('fields.project'), passthroughErrors)
  addFieldSummary(items, errors.context.client, t('fields.client'), passthroughErrors)
  addFieldSummary(items, errors.context.clinic, t('fields.clinic'), passthroughErrors)

  if (errors.patients.form) {
    items.add(errors.patients.form)
  }

  errors.patients.rows.forEach((row, index) => {
    const rowFields = Object.entries(row)
      .filter(([, error]) => Boolean(error))
      .map(([field]) => t(patientFieldLabels[field as keyof ExecutionPatient]))

    if (rowFields.length === 0) {
      return
    }

    items.add(
      t('validation.patientRowIncomplete', {
        index: index + 1,
        fields: rowFields.join(', '),
      }),
    )
  })

  addFieldSummary(items, errors.bot.clinicBotId, t('fields.bot'), passthroughErrors)
  addFieldSummary(items, errors.bot.botName, t('fields.botName'), passthroughErrors)
  addFieldSummary(items, errors.bot.targetUrl, t('fields.url'), passthroughErrors)
  addFieldSummary(items, errors.bot.username, t('fields.username'), passthroughErrors)
  addFieldSummary(items, errors.bot.password, t('fields.password'), passthroughErrors)

  addFieldSummary(items, errors.config.workers, t('fields.workers'), passthroughErrors)
  addFieldSummary(items, errors.config.retries, t('fields.retries'), passthroughErrors)
  addFieldSummary(items, errors.config.config, t('fields.otherConfig'), passthroughErrors)

  const summaries = Array.from(items)

  if (summaries.length === 0) {
    return null
  }

  const visibleSummaries = summaries.slice(0, maxItems)
  const hiddenSummaryCount = summaries.length - visibleSummaries.length
  const fields =
    hiddenSummaryCount > 0
      ? `${visibleSummaries.join(', ')}, ${t('validation.moreFields', { count: hiddenSummaryCount })}`
      : visibleSummaries.join(', ')

  return {
    title: t('validation.submitBlockedTitle'),
    description: t('validation.submitBlockedDescription', { fields }),
  }
}
