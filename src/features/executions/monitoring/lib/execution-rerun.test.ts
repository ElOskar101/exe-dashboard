import { describe, expect, it } from 'vitest'
import type { Execution } from '@/features/executions/shared'
import { buildExecutionRerunPayload, getExecutionRerunSummary, prepareExecutionRerun } from './execution-rerun'

const ACCESS_TOKEN = 'token-123'

const createExecution = (overrides: Partial<Execution> = {}): Execution => ({
  _id: 'execution-1',
  createdBy: 'user-1',
  project: 'liberty',
  status: 'completed',
  client: 'client-1',
  clinic: 'clinic-1',
  execution: 'Daily eligibility',
  botName: 'Eligibility Runner',
  createdAt: '2026-05-27T12:00:00.000Z',
  updatedAt: '2026-05-27T12:10:00.000Z',
  context: {
    env: 'dev',
    bot: {
      botName: 'Eligibility Runner',
      targetUrl: 'https://carrier.example.com',
      username: 'qa.operator',
      password: 'super-secret',
      otherInformation: {},
    },
    patients: [
      {
        patientName: 'Jane',
        patientDob: '01/01/1990',
        patientLastName: 'Doe',
        subscriberDob: '01/01/1980',
        subscriberName: 'Jane Doe',
        fileNames: {
          fullForm: null,
          shortForm: null,
          claimsForm: null,
          eligibilityPrint: 'jane-doe.pdf',
          historyPrint: null,
          claimsPrint: null,
          otherDocuments: [],
        },
      },
    ],
    clinicConfig: {},
    payloadConfigs: [],
    workers: 4,
    retries: 2,
  },
  ...overrides,
})

describe('execution rerun helpers', () => {
  it('rebuilds a create execution payload from a finished execution', () => {
    expect(buildExecutionRerunPayload(createExecution(), ACCESS_TOKEN)).toEqual({
      project: 'liberty',
      createdBy: 'user-1',
      client: 'client-1',
      clinic: 'clinic-1',
      execution: 'Daily eligibility',
      accessToken: ACCESS_TOKEN,
      botName: 'Eligibility Runner',
      context: {
        env: 'dev',
        bot: {
          botName: 'Eligibility Runner',
          targetUrl: 'https://carrier.example.com',
          username: 'qa.operator',
          password: 'super-secret',
          otherInformation: {},
        },
        patients: [
          {
            patientName: 'Jane',
            patientDob: '01/01/1990',
            patientLastName: 'Doe',
            subscriberDob: '01/01/1980',
            subscriberName: 'Jane Doe',
            fileNames: {
              fullForm: null,
              shortForm: null,
              claimsForm: null,
              eligibilityPrint: 'jane-doe.pdf',
              historyPrint: null,
              claimsPrint: null,
              otherDocuments: [],
            },
          },
        ],
        clinicConfig: {},
        payloadConfigs: [],
        workers: 4,
        retries: 2,
      },
    })
  })

  it('does not rebuild a rerun without an execution day', () => {
    const rerunPreparation = prepareExecutionRerun(createExecution({ execution: undefined }), ACCESS_TOKEN)

    expect(rerunPreparation.missingFields).toEqual(['execution'])
    expect(rerunPreparation.payload).toBeNull()
  })

  it('reports the required top-level fields that are missing', () => {
    expect(
      prepareExecutionRerun(
        createExecution({
          createdBy: '',
        }),
        ACCESS_TOKEN,
      ).missingFields,
    ).toEqual(['createdBy'])
  })

  it('preserves the new context configuration fields during reruns', () => {
    expect(
      buildExecutionRerunPayload(
        createExecution({
          context: {
            ...createExecution().context,
            clinicConfig: { previousAttempt: true },
          },
        }),
        ACCESS_TOKEN,
      ),
    ).toMatchObject({
      context: {
        clinicConfig: { previousAttempt: true },
      },
    })
  })

  it('builds a summary for the rerun confirmation dialog', () => {
    const execution = createExecution()
    const payload = buildExecutionRerunPayload(execution, ACCESS_TOKEN)

    expect(payload).not.toBeNull()
    expect(getExecutionRerunSummary(execution, payload!)).toEqual({
      botName: 'Eligibility Runner',
      client: 'client-1',
      clinic: 'clinic-1',
      execution: 'Daily eligibility',
      patientCount: 1,
      project: 'liberty',
      retries: 2,
      workers: 4,
    })
  })

  it('builds a fallback summary even when the payload cannot be recreated yet', () => {
    expect(getExecutionRerunSummary(createExecution(), null)).toEqual({
      botName: 'Eligibility Runner',
      client: 'client-1',
      clinic: 'clinic-1',
      execution: 'Daily eligibility',
      patientCount: 0,
      project: 'liberty',
      retries: 0,
      workers: 0,
    })
  })
})
