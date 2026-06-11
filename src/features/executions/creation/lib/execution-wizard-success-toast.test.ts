import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import { getExecutionWizardSuccessToastCopy } from './execution-wizard-success-toast'

const translations: Record<string, string> = {
  'success.toastTitle': 'Execution created',
  'success.toastDescription': 'Execution {{executionDay}} was created successfully.',
  'success.scheduledToastTitle': 'Execution scheduled',
  'success.scheduledToastDescription': 'Execution {{executionDay}} was scheduled for {{scheduledAt}}.',
  'success.viewExecutionAction': 'View execution',
}

const t = ((key: string, options?: Record<string, string | number>) => {
  const template = translations[key] ?? key

  return template.replace(/\{\{(\w+)\}\}/g, (_, token) => String(options?.[token] ?? ''))
}) as TFunction<'executions'>

describe('getExecutionWizardSuccessToastCopy', () => {
  it('builds the success toast copy for a created execution', () => {
    expect(getExecutionWizardSuccessToastCopy(t, 'Monday Intake')).toEqual({
      title: 'Execution created',
      description: 'Execution Monday Intake was created successfully.',
      actionLabel: 'View execution',
    })
  })

  it('builds the success toast copy for a scheduled execution', () => {
    expect(getExecutionWizardSuccessToastCopy(t, 'Monday Intake', 'scheduled', '2026-06-03T15:52:00.000Z')).toEqual({
      title: 'Execution scheduled',
      description: `Execution Monday Intake was scheduled for ${new Date('2026-06-03T15:52:00.000Z').toLocaleString()}.`,
      actionLabel: 'View execution',
    })
  })
})
