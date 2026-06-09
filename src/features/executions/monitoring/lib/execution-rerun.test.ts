import { describe, expect, it } from 'vitest'
import type { Execution } from '@/features/executions/shared'
import { buildExecutionRerunPayload, getExecutionRerunSummary, prepareExecutionRerun } from './execution-rerun'

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
  jobId: 'job-1',
  playwrightExecutionId: 'report-1',
  meta: {
    bot: {
      botName: 'Eligibility Runner',
      targetUrl: 'https://carrier.example.com',
      username: 'qa.operator',
      password: 'super-secret',
      otherInformation: {
        specifyPayer: 'None',
      },
    },
    patients: [
      {
        patientName: 'Jane',
        patientLastName: 'Doe',
        patientMemberId: '111111',
        patientDob: '01/01/1990',
        policyHolderName: 'Jane',
        policyHolderLastName: 'Doe',
        policyHolderDob: '01/01/1980',
        relationship: 'Self',
        zipCode: '90001',
        clinic: 'Downtown Clinic',
        verificationType: 'elg',
        filenames: 'jane-doe.pdf',
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
      meta: {
        bot: {
          botName: 'Eligibility Runner',
          targetUrl: 'https://carrier.example.com',
          username: 'qa.operator',
          password: 'super-secret',
          otherInformation: {
            specifyPayer: 'None',
          },
        },
        patients: [
          {
            patientName: 'Jane',
            patientLastName: 'Doe',
            patientMemberId: '111111',
            patientDob: '01/01/1990',
            policyHolderName: 'Jane',
            policyHolderLastName: 'Doe',
            policyHolderDob: '01/01/1980',
            relationship: 'Self',
            zipCode: '90001',
            clinic: 'Downtown Clinic',
            verificationType: 'elg',
            filenames: 'jane-doe.pdf',
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

  it('returns null when the execution does not include the original payload details', () => {
    expect(
      buildExecutionRerunPayload(
        createExecution({
          meta: undefined,
        }),
      ),
    ).toBeNull()
  })

  it('reports the required top-level fields that are missing', () => {
    expect(
      prepareExecutionRerun(
        createExecution({
          createdBy: '',
          meta: undefined,
        }),
      ).missingFields,
    ).toEqual(['createdBy', 'meta'])
  })

  it('rebuilds the payload even when rv is not an empty object in the stored execution meta', () => {
    expect(
      buildExecutionRerunPayload(
        createExecution({
          meta: {
            ...createExecution().meta!,
            rv: {
              previousAttempt: true,
            },
          } as unknown as NonNullable<Execution['meta']>,
        }),
      ),
    ).toMatchObject({
      meta: {
        rv: {},
      },
    })
  })

  it('does not report patient clinic as missing and omits it from the payload when blank', () => {
    const baseMeta = createExecution().meta!
    const execution = createExecution({
      meta: {
        ...baseMeta,
        patients: [
          {
            ...baseMeta.patients[0],
            clinic: '',
          },
        ],
      },
    })

    expect(prepareExecutionRerun(execution).missingFields).not.toContain('meta.patients[0].clinic')
    expect(buildExecutionRerunPayload(execution)).toEqual({
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
          username: 'qa.operator',
          password: 'super-secret',
          otherInformation: {
            specifyPayer: 'None',
          },
        },
        patients: [
          {
            patientName: 'Jane',
            patientLastName: 'Doe',
            patientMemberId: '111111',
            patientDob: '01/01/1990',
            policyHolderName: 'Jane',
            policyHolderLastName: 'Doe',
            policyHolderDob: '01/01/1980',
            relationship: 'Self',
            zipCode: '90001',
            verificationType: 'elg',
            filenames: 'jane-doe.pdf',
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
    expect(
      getExecutionRerunSummary(
        createExecution({
          meta: undefined,
        }),
        null,
      ),
    ).toEqual({
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
