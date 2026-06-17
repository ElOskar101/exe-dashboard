import { describe, expect, it } from 'vitest'
import type { ExecutionPayloadPatient } from '@/features/executions/shared'
import {
  formatExecutionPatientOtherInformation,
  getExecutionPatientFullName,
  getExecutionPatientsSummary,
} from './execution-patients-display'

const emptyValue = 'None'

const patientProperty = (value: string, key = '') => ({ key, value })

const createPatient = (overrides: Partial<ExecutionPayloadPatient> = {}): ExecutionPayloadPatient => ({
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
  ...overrides,
})

describe('execution patients display', () => {
  it('builds a patient full name from the stored execution payload', () => {
    expect(getExecutionPatientFullName(createPatient(), emptyValue)).toBe('Jane Doe')
  })

  it('falls back when the patient payload has no names', () => {
    expect(
      getExecutionPatientFullName(
        createPatient({ patientName: patientProperty(' '), patientLastName: patientProperty('') }),
        emptyValue,
      ),
    ).toBe(emptyValue)
  })

  it('limits the summary text to the first patient and shows the remaining count', () => {
    expect(
      getExecutionPatientsSummary(
        [
          createPatient(),
          createPatient({ patientName: patientProperty('John'), patientLastName: patientProperty('Smith') }),
          createPatient({ patientName: patientProperty('Mary'), patientLastName: patientProperty('Jones') }),
        ],
        emptyValue,
      ),
    ).toBe('Jane Doe, +2')
  })

  it('formats patient other information as readable JSON', () => {
    expect(
      formatExecutionPatientOtherInformation(
        {
          payer: 'Acme',
          groupNumber: '12345',
        },
        emptyValue,
      ),
    ).toBe('{\n  "payer": "Acme",\n  "groupNumber": "12345"\n}')
  })

  it('falls back when patient other information is missing', () => {
    expect(formatExecutionPatientOtherInformation(undefined, emptyValue)).toBe(emptyValue)
  })
})
