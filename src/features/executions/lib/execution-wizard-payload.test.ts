import { describe, expect, it } from 'vitest'
import { createEmptyDraft } from './execution-wizard-draft'
import { buildExecutionPayload } from './execution-wizard-payload'

describe('buildExecutionPayload', () => {
  it('builds the new create execution payload shape', () => {
    const draft = createEmptyDraft()

    draft.context.client = 'client-1'
    draft.context.clinic = 'clinic-1'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.url = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'
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
        config: {},
        rv: {},
        workers: 2,
        retries: 1,
      },
    })
  })

  it('returns null when metadata JSON is invalid or createdBy is missing', () => {
    const draft = createEmptyDraft()

    draft.context.client = 'client-1'
    draft.context.clinic = 'clinic-1'
    draft.bot.botName = 'Eligibility Runner'
    draft.bot.url = 'https://carrier.example.com'
    draft.bot.username = 'operator'
    draft.bot.password = 'secret'

    expect(buildExecutionPayload(draft, '')).toBeNull()

    draft.bot.otherInformation = '[]'

    expect(buildExecutionPayload(draft, 'user-1')).toBeNull()
  })
})
