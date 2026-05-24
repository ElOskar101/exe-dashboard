import { describe, expect, it } from 'vitest'
import { createEmptyDraft } from './execution-wizard-draft'
import { getExecutionWizardValidationErrors } from './execution-wizard-validation'

const t = (key: string) => key

describe('getExecutionWizardValidationErrors', () => {
  it('requires a selected customer and clinic', () => {
    const draft = createEmptyDraft()

    const errors = getExecutionWizardValidationErrors(draft, 'user-1', t as never)

    expect(errors.context.client).toBe('validation.required')
    expect(errors.context.clinic).toBe('validation.required')
  })

  it('shows a dedicated clinic error when the selected customer has no clinics', () => {
    const draft = createEmptyDraft()

    draft.context.client = 'customer-1'
    draft.context.clientName = 'Legacy Dental Care'

    const errors = getExecutionWizardValidationErrors(draft, 'user-1', t as never, {
      hasSelectedCustomerWithoutClinics: true,
    })

    expect(errors.context.clinic).toBe('validation.customerHasNoClinics')
  })

  it('validates execution config as a JSON object', () => {
    const draft = createEmptyDraft()

    draft.execution.config = '[]'

    const errors = getExecutionWizardValidationErrors(draft, 'user-1', t as never)

    expect(errors.config.config).toBe('validation.validJsonObject')
  })
})
