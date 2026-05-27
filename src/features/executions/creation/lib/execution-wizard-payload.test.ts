import { describe, expect, it } from 'vitest'
import { createEmptyDraft } from './execution-wizard-draft'
import { buildExecutionPayload } from './execution-wizard-payload'

describe('buildExecutionPayload', () => {
  it('builds the new create execution payload shape using the selected sheet name for execution', () => {
    const draft = createEmptyDraft()

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

    expect(buildExecutionPayload(draft, 'user-1')).toEqual({
      project: 'liberty',
      createdBy: 'user-1',
      client: 'client-1',
      clinic: 'clinic-1',
      execution: 'Daily eligibility',
      botName: 'Eligibility Runner',
      meta: {
        bot: {
          botName: 'Eligibility Runner',
          targetUrl: 'https://carrier.example.com',
          username: 'operator',
          password: 'secret',
          otherInformation: {
            specifyPayer: 'None',
          },
        },
        patients: [
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
            clinic: 'Downtown Clinic',
            verificationType: 'elg',
            filenames: 'ana-lopez.pdf',
            otherInformation: {
              plan: 'Gold',
            },
          },
        ],
        config: {
          parallel: true,
        },
        rv: {},
        workers: 2,
        retries: 1,
      },
    })
  })

  it('returns null when metadata JSON is invalid or createdBy is missing', () => {
    const draft = createEmptyDraft()

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

    expect(buildExecutionPayload(draft, '')).toBeNull()

    draft.execution.config = '[]'

    expect(buildExecutionPayload(draft, 'user-1')).toBeNull()
  })

  it('submits selected ids from the chosen customer, clinic, and user', () => {
    const draft = createEmptyDraft()

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

    expect(buildExecutionPayload(draft, 'user-id-7')).toMatchObject({
      createdBy: 'user-id-7',
      client: 'customer-id-42',
      clinic: 'clinic-id-9',
    })
  })

  it('omits the optional execution name when it is empty', () => {
    const draft = createEmptyDraft()

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

    expect(buildExecutionPayload(draft, 'user-id-7')).not.toHaveProperty('execution')
  })

  it('falls back to the raw execution field when no execution name is available', () => {
    const draft = createEmptyDraft()

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

    expect(buildExecutionPayload(draft, 'user-id-7')).toMatchObject({
      execution: 'legacy-execution-value',
    })
  })

  it('omits patient clinic from the payload when it is blank', () => {
    const draft = createEmptyDraft()

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

    expect(buildExecutionPayload(draft, 'user-1')).toMatchObject({
      meta: {
        patients: [
          {
            patientName: 'Ana',
          },
        ],
      },
    })
    expect(buildExecutionPayload(draft, 'user-1')?.meta.patients[0]).not.toHaveProperty('clinic')
  })
})
