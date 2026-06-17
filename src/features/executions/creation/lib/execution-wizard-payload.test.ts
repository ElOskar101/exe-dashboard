import { describe, expect, it } from 'vitest'
import { createEmptyDraft } from './execution-wizard-draft'
import { buildExecutionPayload } from './execution-wizard-payload'

const ACCESS_TOKEN = 'token-123'
const CCC_API_URL = 'https://dev-carrier.dentalautomation.ai'
const RUNTIME_VARIABLES = { carrierDomain: 'dev-carrier' }

const buildPayload = (draft: ReturnType<typeof createEmptyDraft>, createdBy: string) =>
  buildExecutionPayload(draft, createdBy, ACCESS_TOKEN, CCC_API_URL, RUNTIME_VARIABLES)

const toDateTimeLocalValue = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`
}

describe('buildExecutionPayload', () => {
  it('builds the new create execution payload shape using the selected sheet name for execution', () => {
    const draft = createEmptyDraft()

    draft.context.project = 'liberty'
    draft.context.client = 'client-1'
    draft.context.clientName = 'Legacy Dental Care'
    draft.context.clinic = 'clinic-1'
    draft.context.clinicName = 'Legacy Dental Care'
    draft.bot.clinicBotId = 'clinic-bot-1'
    draft.execution.execution = 'execution-day-id-1'
    draft.execution.executionName = 'Daily eligibility'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.targetUrl = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = '  secret  '
    draft.bot.verificationType = 'FBD'
    draft.execution.config = '{ "parallel": true }'
    draft.execution.patients = [
      {
        id: 'row-1',
        patientName: 'Ana',
        patientLastName: 'Lopez',
        patientMemberId: 'A10001',
        patientDob: '1985-03-10',
        policyHolderName: 'Ana',
        policyHolderLastName: 'Lopez',
        policyHolderDob: '1985-03-10',
        relationship: 'self',
        zipCode: '90001',
        clinic: 'Downtown Clinic',
        verificationType: 'ELG',
        filenames: 'ana-lopez.pdf',
        otherInformation: '{ "plan": "Gold" }',
      },
    ]

    expect(buildPayload(draft, 'user-1')).toEqual({
      project: 'liberty',
      createdBy: 'user-1',
      client: 'Legacy Dental Care',
      clinic: 'Legacy Dental Care',
      execution: 'Daily eligibility',
      botName: 'Eligibility Runner',
      context: {
        accessToken: ACCESS_TOKEN,
        apiUrl: CCC_API_URL,
        bot: {
          botName: 'Eligibility Runner',
          targetUrl: 'https://carrier.example.com',
          username: 'operator',
          password: 'secret',
          otherInformation: {},
        },
        executionId: 'execution-day-id-1',
        patients: [
          {
            id: 'row-1',
            patientName: { key: 'patient_first_name', value: 'Ana' },
            patientLastName: { key: 'patient_last_name', value: 'Lopez' },
            patientMemberId: { key: 'memberid', value: 'A10001' },
            patientDob: { key: 'patient_dob', value: '1985-03-10' },
            policyHolderName: { key: 'subscriber_first_name', value: 'Ana' },
            policyHolderLastName: { key: 'subscriber_last_name', value: 'Lopez' },
            policyHolderDob: { key: 'subscriber_dob', value: '1985-03-10' },
            relationship: { key: 'relationship_to_subscriber', value: 'self' },
            zipCode: { key: 'subscriber_zip_code', value: '90001' },
            verificationType: 'elg',
            filenames: ['ana-lopez.pdf'],
            otherInformation: {
              plan: 'Gold',
            },
          },
        ],
        config: {
          parallel: true,
        },
        rv: RUNTIME_VARIABLES,
        headed: false,
        workers: 2,
        retries: 1,
      },
    })
  })

  it('returns null when metadata JSON is invalid or createdBy is missing', () => {
    const draft = createEmptyDraft()

    draft.context.project = 'liberty'
    draft.context.client = 'client-1'
    draft.context.clientName = 'Legacy Dental Care'
    draft.context.clinic = 'clinic-1'
    draft.context.clinicName = 'Legacy Dental Care'
    draft.bot.clinicBotId = 'clinic-bot-1'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.targetUrl = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'
    draft.bot.verificationType = 'ELG'

    expect(buildPayload(draft, '')).toBeNull()

    draft.execution.config = '[]'

    expect(buildPayload(draft, 'user-1')).toBeNull()
  })

  it('returns null while runtime variables are unavailable', () => {
    const draft = createEmptyDraft()

    draft.context.project = 'liberty'
    draft.context.client = 'client-1'
    draft.context.clientName = 'Legacy Dental Care'
    draft.context.clinic = 'clinic-1'
    draft.context.clinicName = 'Legacy Dental Care'
    draft.bot.clinicBotId = 'clinic-bot-1'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.targetUrl = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'
    draft.bot.verificationType = 'ELG'

    expect(buildExecutionPayload(draft, 'user-1', ACCESS_TOKEN, CCC_API_URL, undefined)).toBeNull()
  })

  it('submits selected display names from the chosen customer, clinic, and user', () => {
    const draft = createEmptyDraft()

    draft.context.project = 'liberty'
    draft.context.client = 'customer-id-42'
    draft.context.clientName = 'Sunshine Dental'
    draft.context.clinic = 'clinic-id-9'
    draft.context.clinicName = 'Main Clinic'
    draft.bot.clinicBotId = 'clinic-bot-1'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.targetUrl = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'
    draft.bot.verificationType = 'ELG'

    expect(buildPayload(draft, 'Operator One')).toMatchObject({
      createdBy: 'Operator One',
      client: 'Sunshine Dental',
      clinic: 'Main Clinic',
    })
  })

  it('returns null when bot username or password is empty', () => {
    const draft = createEmptyDraft()

    draft.context.project = 'liberty'
    draft.context.client = 'customer-id-42'
    draft.context.clientName = 'Sunshine Dental'
    draft.context.clinic = 'clinic-id-9'
    draft.context.clinicName = 'Main Clinic'
    draft.bot.clinicBotId = 'clinic-bot-1'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.targetUrl = 'https://carrier.example.com'
    draft.bot.verificationType = 'ELG'

    expect(buildPayload(draft, 'user-id-7')).toBeNull()

    draft.bot.username = 'operator'

    expect(buildPayload(draft, 'user-id-7')).toBeNull()
  })

  it('omits the optional execution name when it is empty', () => {
    const draft = createEmptyDraft()

    draft.context.project = 'liberty'
    draft.context.client = 'customer-id-42'
    draft.context.clientName = 'Sunshine Dental'
    draft.context.clinic = 'clinic-id-9'
    draft.context.clinicName = 'Main Clinic'
    draft.bot.clinicBotId = 'clinic-bot-1'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.targetUrl = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'
    draft.bot.verificationType = 'ELG'

    expect(buildPayload(draft, 'user-id-7')).not.toHaveProperty('execution')
  })

  it('falls back to the raw execution field when no execution name is available', () => {
    const draft = createEmptyDraft()

    draft.context.project = 'liberty'
    draft.context.client = 'customer-id-42'
    draft.context.clientName = 'Sunshine Dental'
    draft.context.clinic = 'clinic-id-9'
    draft.context.clinicName = 'Main Clinic'
    draft.execution.execution = 'legacy-execution-value'
    draft.bot.clinicBotId = 'clinic-bot-1'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.targetUrl = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'
    draft.bot.verificationType = 'ELG'

    expect(buildPayload(draft, 'user-id-7')).toMatchObject({
      execution: 'legacy-execution-value',
    })
  })

  it('omits patient clinic from the payload when it is blank', () => {
    const draft = createEmptyDraft()

    draft.context.project = 'liberty'
    draft.context.client = 'client-1'
    draft.context.clientName = 'Legacy Dental Care'
    draft.context.clinic = 'clinic-1'
    draft.context.clinicName = 'Legacy Dental Care'
    draft.bot.clinicBotId = 'clinic-bot-1'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.targetUrl = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'
    draft.bot.verificationType = 'ELG'
    draft.execution.patients = [
      {
        patientName: 'Ana',
        patientLastName: 'Lopez',
        patientMemberId: 'A10001',
        patientDob: '1985-03-10',
        policyHolderName: 'Ana',
        policyHolderLastName: 'Lopez',
        policyHolderDob: '1985-03-10',
        relationship: 'self',
        zipCode: '90001',
        clinic: '',
        verificationType: 'ELG',
        filenames: 'ana-lopez.pdf',
        otherInformation: '{}',
      },
    ]

    expect(buildPayload(draft, 'user-1')).toMatchObject({
      context: {
        patients: [
          {
            patientName: { key: 'patient_first_name', value: 'Ana' },
          },
        ],
      },
    })
    expect(buildPayload(draft, 'user-1')?.context.patients[0]).not.toHaveProperty('clinic')
  })

  it('adds scheduledAt when the execution is scheduled', () => {
    const draft = createEmptyDraft()
    const scheduledAt = toDateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000))

    draft.context.project = 'liberty'
    draft.context.client = 'customer-id-42'
    draft.context.clientName = 'Sunshine Dental'
    draft.context.clinic = 'clinic-id-9'
    draft.context.clinicName = 'Main Clinic'
    draft.bot.clinicBotId = 'clinic-bot-1'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.targetUrl = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'
    draft.bot.verificationType = 'ELG'
    draft.execution.scheduleMode = 'scheduled'
    draft.execution.scheduledAt = scheduledAt

    expect(buildPayload(draft, 'user-id-7')).toMatchObject({
      scheduledAt: new Date(scheduledAt).toISOString(),
    })
  })

  it('returns null when a scheduled execution has a past scheduledAt value', () => {
    const draft = createEmptyDraft()

    draft.context.project = 'liberty'
    draft.context.client = 'customer-id-42'
    draft.context.clientName = 'Sunshine Dental'
    draft.context.clinic = 'clinic-id-9'
    draft.context.clinicName = 'Main Clinic'
    draft.bot.clinicBotId = 'clinic-bot-1'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.targetUrl = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'
    draft.bot.verificationType = 'ELG'
    draft.execution.scheduleMode = 'scheduled'
    draft.execution.scheduledAt = '2020-01-01T09:00'

    expect(buildPayload(draft, 'user-id-7')).toBeNull()
  })
})
