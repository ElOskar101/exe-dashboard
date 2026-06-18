import { describe, expect, it } from 'vitest'
import type { Execution } from '@/features/executions/shared'
import { buildExecutionRerunPayload, getExecutionRerunSummary, prepareExecutionRerun } from './execution-rerun'

const patientProperty = (value: string, key = '') => ({ key, value })

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
    bot: {
      botName: 'Eligibility Runner',
      targetUrl: 'https://carrier.example.com',
      username: 'qa.operator',
      password: 'super-secret',
      otherInformation: {},
    },
    patients: [
      {
        patientName: patientProperty('Jane', 'patient_first_name'),
        patientLastName: patientProperty('Doe', 'patient_last_name'),
        patientMemberId: patientProperty('111111'),
        patientDob: patientProperty('01/01/1990'),
        policyHolderName: patientProperty('Jane'),
        policyHolderLastName: patientProperty('Doe'),
        policyHolderDob: patientProperty('01/01/1980'),
        relationship: patientProperty('Self'),
        zipCode: patientProperty('90001'),
        verificationType: 'elg',
        filenames: ['jane-doe.pdf'],
        otherInformation: {},
      },
    ],
    config: {
      parallel: true,
    },
    rv: {},
    workers: 4,
    retries: 2,
  },
  ...overrides,
})

describe('execution rerun helpers', () => {
  it('rebuilds a create execution payload from a finished execution', () => {
    expect(buildExecutionRerunPayload(createExecution())).toEqual({
      project: 'liberty',
      createdBy: 'user-1',
      client: 'client-1',
      clinic: 'clinic-1',
      execution: 'Daily eligibility',
      botName: 'Eligibility Runner',
      context: {
        bot: {
          botName: 'Eligibility Runner',
          targetUrl: 'https://carrier.example.com',
          username: 'qa.operator',
          password: 'super-secret',
          otherInformation: {},
        },
        patients: [
          {
            patientName: patientProperty('Jane', 'patient_first_name'),
            patientLastName: patientProperty('Doe', 'patient_last_name'),
            patientMemberId: patientProperty('111111'),
            patientDob: patientProperty('01/01/1990'),
            policyHolderName: patientProperty('Jane'),
            policyHolderLastName: patientProperty('Doe'),
            policyHolderDob: patientProperty('01/01/1980'),
            relationship: patientProperty('Self'),
            zipCode: patientProperty('90001'),
            verificationType: 'elg',
            filenames: ['jane-doe.pdf'],
            otherInformation: {},
          },
        ],
        config: {
          parallel: true,
        },
        rv: {},
        workers: 4,
        retries: 2,
      },
    })
  })

  it('reports the required top-level fields that are missing', () => {
    expect(
      prepareExecutionRerun(
        createExecution({
          createdBy: '',
        }),
      ).missingFields,
    ).toEqual(['createdBy'])
  })

  it('rebuilds the payload even when rv is not an empty object in the stored execution context', () => {
    expect(
      buildExecutionRerunPayload(
        createExecution({
          context: {
            ...createExecution().context,
            rv: {
              previousAttempt: true,
            },
          },
        }),
      ),
    ).toMatchObject({
      context: {
        rv: {},
      },
    })
  })

  it('builds a summary for the rerun confirmation dialog', () => {
    const execution = createExecution()
    const payload = buildExecutionRerunPayload(execution)

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
