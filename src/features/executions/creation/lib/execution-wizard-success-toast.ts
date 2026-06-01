import type { TFunction } from 'i18next'

interface ExecutionWizardSuccessToastCopy {
  title: string
  description: string
  actionLabel: string
}

export const getExecutionWizardSuccessToastCopy = (
  t: TFunction<'executions'>,
  executionDay: string,
): ExecutionWizardSuccessToastCopy => ({
  title: t('success.toastTitle'),
  description: t('success.toastDescription', { executionDay }),
  actionLabel: t('success.viewExecutionAction'),
})
