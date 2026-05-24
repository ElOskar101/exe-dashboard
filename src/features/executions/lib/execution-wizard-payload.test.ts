import { describe, expect, it } from 'vitest'
import { createEmptyDraft } from './execution-wizard-draft'
import { buildExecutionPayload } from './execution-wizard-payload'

describe('buildExecutionPayload', () => {
  it('builds the new create execution payload shape', () => {
    const draft = createEmptyDraft()

    draft.context.client = 'client-1'
    draft.context.clientName = 'Legacy Dental Care'
    draft.context.clinic = 'clinic-1'
    draft.context.clinicName = 'Legacy Dental Care'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.url = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'
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

    expect(buildExecutionPayload(draft, 'John Carter')).toEqual({
      project: 'liberty',
      createdBy: 'John Carter',
      client: 'Legacy Dental Care',
      clinic: 'Legacy Dental Care',
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
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.url = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'

    expect(buildExecutionPayload(draft, '')).toBeNull()

    draft.bot.otherInformation = '[]'

    expect(buildExecutionPayload(draft, 'John Carter')).toBeNull()

    draft.bot.otherInformation = '{ "specifyPayer": "None" }'
    draft.execution.config = '[]'

    expect(buildExecutionPayload(draft, 'John Carter')).toBeNull()
  })

  it('submits selected names from the chosen customer, clinic, and user', () => {
    const draft = createEmptyDraft()

    draft.context.client = 'customer-id-42'
    draft.context.clientName = 'Sunshine Dental'
    draft.context.clinic = 'clinic-id-9'
    draft.context.clinicName = 'Main Clinic'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.url = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'

    expect(buildExecutionPayload(draft, 'Mia Perez')).toMatchObject({
      createdBy: 'Mia Perez',
      client: 'Sunshine Dental',
      clinic: 'Main Clinic',
    })
  })
})
