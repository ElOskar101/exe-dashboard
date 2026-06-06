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

  it('requires a selected Playwright Project', () => {
    const draft = createEmptyDraft()

    const errors = getExecutionWizardValidationErrors(draft, 'user-1', t as never)

    expect(errors.context.project).toBe('validation.required')
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

  it('requires a selected associated bot after a Playwright Project is chosen', () => {
    const draft = createEmptyDraft()

    draft.context.project = 'liberty'

    const errors = getExecutionWizardValidationErrors(draft, 'user-1', t as never)

    expect(errors.bot.clinicBotId).toBe('validation.required')
  })

  it('shows a dedicated associated bot error when the selected Playwright Project has no active associated bots', () => {
    const draft = createEmptyDraft()

    draft.context.project = 'liberty'

    const errors = getExecutionWizardValidationErrors(draft, 'user-1', t as never, {
      hasSelectedProjectWithoutAssociatedBots: true,
    })

    expect(errors.bot.clinicBotId).toBe('validation.noAssociatedBots')
  })

  it('validates editable bot fields after a bot is selected', () => {
    const draft = createEmptyDraft()

    draft.context.client = 'customer-1'
    draft.context.clientName = 'Legacy Dental Care'
    draft.context.clinic = 'clinic-1'
    draft.context.clinicName = 'Downtown Clinic'
    draft.context.project = 'liberty'
    draft.bot.clinicBotId = 'clinic-bot-1'
    draft.bot.targetUrl = 'invalid-url'

    const errors = getExecutionWizardValidationErrors(draft, 'user-1', t as never)

    expect(errors.bot).toMatchObject({
      botName: 'validation.required',
      targetUrl: 'validation.validUrl',
      username: 'validation.required',
      password: 'validation.required',
    })
  })

  it('requires core imported patient fields before allowing submission', () => {
    const draft = createEmptyDraft()

    draft.context.client = 'customer-1'
    draft.context.clientName = 'Legacy Dental Care'
    draft.context.clinic = 'clinic-1'
    draft.context.clinicName = 'Downtown Clinic'
    draft.context.project = 'liberty'
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
