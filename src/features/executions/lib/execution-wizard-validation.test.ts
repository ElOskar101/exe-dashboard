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

  it('requires a selected clinic bot after a clinic is chosen', () => {
    const draft = createEmptyDraft()

    draft.context.client = 'customer-1'
    draft.context.clientName = 'Legacy Dental Care'
    draft.context.clinic = 'clinic-1'
    draft.context.clinicName = 'Downtown Clinic'

    const errors = getExecutionWizardValidationErrors(draft, 'user-1', t as never)

    expect(errors.patients.bot).toBe('validation.required')
  })

  it('shows a dedicated clinic bot error when the selected clinic has no active bots', () => {
    const draft = createEmptyDraft()

    draft.context.client = 'customer-1'
    draft.context.clientName = 'Legacy Dental Care'
    draft.context.clinic = 'clinic-1'
    draft.context.clinicName = 'Downtown Clinic'

    const errors = getExecutionWizardValidationErrors(draft, 'user-1', t as never, {
      hasSelectedClinicWithoutActiveBots: true,
    })

    expect(errors.patients.bot).toBe('validation.noActiveClinicBots')
  })

  it('requires core imported patient fields before allowing submission', () => {
    const draft = createEmptyDraft()

    draft.context.client = 'customer-1'
    draft.context.clientName = 'Legacy Dental Care'
    draft.context.clinic = 'clinic-1'
    draft.context.clinicName = 'Downtown Clinic'
    draft.bot.clinicBotId = 'clinic-bot-1'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.targetUrl = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'
    draft.bot.verificationType = 'ELG'
    draft.execution.patients = [
      {
        patientName: 'Jane',
        patientLastName: '',
        patientMemberId: '',
        patientDob: '',
        policyHolderName: '',
        policyHolderLastName: '',
        policyHolderDob: '',
        relationship: '',
        zipCode: '',
        clinic: '',
        verificationType: 'ELG',
        filenames: '',
        otherInformation: '{}',
      },
    ]

    const errors = getExecutionWizardValidationErrors(draft, 'user-1', t as never)

    expect(errors.patients.rows[0]).toMatchObject({
      patientLastName: 'validation.required',
      patientMemberId: 'validation.required',
      patientDob: 'validation.required',
    })
  })
})
