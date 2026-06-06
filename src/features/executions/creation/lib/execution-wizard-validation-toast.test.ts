import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import { getExecutionWizardValidationToastCopy } from './execution-wizard-validation-toast'
import type { StepErrors } from './execution-wizard-validation'

const translations: Record<string, string> = {
  'validation.userRequired': 'Wait for the signed-in user to load before submitting.',
  'validation.customerHasNoClinics': 'The selected client has no clinics available.',
  'validation.noActiveClinicBots': 'The selected clinic has no active bots available.',
  'validation.noAssociatedBots': 'The selected Playwright Project has no active associated bots available.',
  'validation.addPatient': 'Add at least one patient before continuing.',
  'validation.patientRowIncomplete': 'Patient {{index}}: {{fields}}',
  'validation.submitBlockedTitle': 'Complete the required fields first.',
  'validation.submitBlockedDescription': 'Missing or incomplete: {{fields}}.',
  'validation.moreFields': 'and {{count}} more',
  'fields.project': 'Project',
  'fields.client': 'Client',
  'fields.clinic': 'Clinic',
  'fields.patientName': 'Patient name',
  'fields.patientLastName': 'Patient last name',
  'fields.memberId': 'Member ID',
  'fields.patientDob': 'Patient date of birth',
  'fields.patientOtherInformation': 'Patient other information',
  'fields.bot': 'Select bot',
  'fields.botName': 'Bot name',
  'fields.url': 'Portal URL',
  'fields.username': 'Username',
  'fields.password': 'Password',
  'fields.workers': 'Workers',
  'fields.retries': 'Retries',
  'fields.otherConfig': 'Other config',
}

const t = ((key: string, options?: Record<string, string | number>) => {
  const template = translations[key] ?? key

  return template.replace(/\{\{(\w+)\}\}/g, (_, token) => String(options?.[token] ?? ''))
}) as TFunction<'executions'>

const createStepErrors = (): StepErrors => ({
  context: {},
  patients: {
    rows: [],
  },
  bot: {},
  config: {},
})

describe('getExecutionWizardValidationToastCopy', () => {
  it('summarizes missing required fields for the warning toast', () => {
    const errors = createStepErrors()

    errors.context.client = 'This field is required.'
    errors.context.clinic = 'This field is required.'
    errors.patients.form = 'Add at least one patient before continuing.'
    errors.bot.password = 'This field is required.'

    const copy = getExecutionWizardValidationToastCopy(errors, t)

    expect(copy).toEqual({
      title: 'Complete the required fields first.',
      description: 'Missing or incomplete: Client, Clinic, Add at least one patient before continuing., Password.',
    })
  })

  it('includes row-specific patient details and truncates long summaries', () => {
    const errors = createStepErrors()

    errors.context.project = 'This field is required.'
    errors.context.client = 'This field is required.'
    errors.context.clinic = 'This field is required.'
    errors.patients.rows = [
      {
        patientLastName: 'This field is required.',
        patientMemberId: 'This field is required.',
      },
    ]
    errors.bot.botName = 'This field is required.'
    errors.bot.password = 'This field is required.'

    const copy = getExecutionWizardValidationToastCopy(errors, t, 4)

    expect(copy).toEqual({
      title: 'Complete the required fields first.',
      description:
        'Missing or incomplete: Project, Client, Clinic, Patient 1: Patient last name, Member ID, and 2 more.',
    })
  })

  it('passes through specialized validation messages', () => {
    const errors = createStepErrors()

    errors.context.clinic = 'The selected client has no clinics available.'
    errors.bot.clinicBotId = 'The selected Playwright Project has no active associated bots available.'

    const copy = getExecutionWizardValidationToastCopy(errors, t)

    expect(copy).toEqual({
      title: 'Complete the required fields first.',
      description:
        'Missing or incomplete: The selected client has no clinics available., The selected Playwright Project has no active associated bots available..',
    })
  })
})
