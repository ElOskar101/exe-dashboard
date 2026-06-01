import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import { getExecutionWizardSuccessToastCopy } from './execution-wizard-success-toast'

const translations: Record<string, string> = {
  'success.toastTitle': 'Execution created',
  'success.toastDescription': 'Execution {{executionDay}} was created successfully.',
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
})
