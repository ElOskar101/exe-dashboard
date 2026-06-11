import type { TFunction } from 'i18next'

interface ExecutionWizardSuccessToastCopy {
  title: string
  description: string
  actionLabel: string
}

export const getExecutionWizardSuccessToastCopy = (
  t: TFunction<'executions'>,
  executionDay: string,
  scheduleMode: 'instant' | 'scheduled' = 'instant',
  scheduledAt?: string,
): ExecutionWizardSuccessToastCopy => ({
  title: scheduleMode === 'scheduled' ? t('success.scheduledToastTitle') : t('success.toastTitle'),
  description:
    scheduleMode === 'scheduled'
      ? t('success.scheduledToastDescription', {
          executionDay,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toLocaleString() : '',
        })
      : t('success.toastDescription', { executionDay }),
  actionLabel: t('success.viewExecutionAction'),
})
