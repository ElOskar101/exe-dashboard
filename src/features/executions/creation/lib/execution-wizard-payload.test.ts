import { describe, expect, it } from 'vitest'
import { buildExecutionPayload, buildExecutionPayloadPreview } from './execution-wizard-payload'
import { createEmptyDraft } from './execution-wizard-draft'

const ACCESS_TOKEN = 'token-123'

const createValidDraft = () => {
  const draft = createEmptyDraft()

  draft.context = {
    project: 'liberty',
    client: 'client-1',
    clientName: 'Legacy Dental Care',
    clinic: 'clinic-1',
    clinicName: 'Downtown Clinic',
  }
  draft.bot = {
    clinicBotId: 'clinic-bot-1',
    botName: 'Eligibility Runner',
    targetUrl: 'https://carrier.example.com/login',
    username: 'operator',
    password: 'secret',
    verificationType: 'ELG',
  }
  draft.execution.execution = 'execution-1'
  draft.execution.executionName = 'Daily eligibility'
  draft.execution.patients = [
    {
      patientName: 'Ana',
      patientDob: '1985-03-10',
      patientLastName: 'Lopez',
      subscriberDob: '1985-03-10',
      subscriberName: 'Ana',
      fileNames: {
        fullForm: null,
        shortForm: null,
        claimsForm: null,
        eligibilityPrint: 'eligibility.pdf',
        historyPrint: null,
        claimsPrint: null,
        otherDocuments: ['consent.pdf'],
      },
    },
  ]

  return draft
}

describe('buildExecutionPayload', () => {
  it('builds the new context shape without transforming patients', () => {
    const draft = createValidDraft()
    const patient = draft.execution.patients[0]

    expect(buildExecutionPayload(draft, 'Operator One', ACCESS_TOKEN, 'dev')).toEqual({
      project: 'liberty',
      createdBy: 'Operator One',
      client: 'Legacy Dental Care',
      clinic: 'Downtown Clinic',
      execution: 'Daily eligibility',
      botName: 'Eligibility Runner',
      context: {
        env: 'dev',
        executionId: 'execution-1',
        bot: {
          id: 'clinic-bot-1',
          botName: 'Eligibility Runner',
          targetUrl: 'https://carrier.example.com/login',
          username: 'operator',
          password: 'secret',
          otherInformation: {},
        },
        clinicConfig: {},
        payloadConfigs: [],
        accessToken: ACCESS_TOKEN,
        workers: 2,
        retries: 1,
        patients: [patient],
      },
    })
  })

  it('uses empty config collections in the preview', () => {
    const preview = buildExecutionPayloadPreview(createValidDraft(), 'Operator One', ACCESS_TOKEN, 'prod')

    expect(preview.context).toMatchObject({
      env: 'prod',
      clinicConfig: {},
      payloadConfigs: [],
    })
  })

  it('returns null when required execution fields are missing', () => {
    const draft = createValidDraft()

    expect(buildExecutionPayload(draft, '', ACCESS_TOKEN, 'dev')).toBeNull()
  })

  it('builds a scheduled payload with an ISO scheduled time', () => {
    const draft = createValidDraft()
    draft.execution.scheduleMode = 'scheduled'
    draft.execution.scheduledAt = '2099-01-01T12:00'

    expect(buildExecutionPayload(draft, 'Operator One', ACCESS_TOKEN, 'dev')).toMatchObject({
      scheduledAt: new Date('2099-01-01T12:00').toISOString(),
    })
  })
})
