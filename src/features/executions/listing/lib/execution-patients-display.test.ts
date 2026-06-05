import { describe, expect, it } from 'vitest'
import type { ExecutionPayloadPatient } from '@/features/executions/shared'
import {
  formatExecutionPatientOtherInformation,
  getExecutionPatientFullName,
  getExecutionPatientsSummary,
} from './execution-patients-display'

const emptyValue = 'None'

const createPatient = (overrides: Partial<ExecutionPayloadPatient> = {}): ExecutionPayloadPatient => ({
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
  ...overrides,
})

describe('execution patients display', () => {
  it('builds a patient full name from the stored execution payload', () => {
    expect(getExecutionPatientFullName(createPatient(), emptyValue)).toBe('Jane Doe')
  })

  it('falls back when the patient payload has no names', () => {
    expect(getExecutionPatientFullName(createPatient({ patientName: ' ', patientLastName: '' }), emptyValue)).toBe(
      emptyValue,
    )
  })

  it('limits the summary text to the first two patients and shows the remaining count', () => {
    expect(
      getExecutionPatientsSummary(
        [
          createPatient(),
          createPatient({ patientName: 'John', patientLastName: 'Smith' }),
          createPatient({ patientName: 'Mary', patientLastName: 'Jones' }),
        ],
        emptyValue,
      ),
    ).toBe('Jane Doe, John Smith, +1')
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
