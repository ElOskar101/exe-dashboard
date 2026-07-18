import { describe, expect, it } from 'vitest'
import type { ExecutionPayloadPatient } from '@/features/executions/shared'
import { getExecutionPatientFullName, getExecutionPatientsSummary } from './execution-patients-display'

const emptyValue = 'None'

const fileNames = {
  fullForm: null,
  shortForm: null,
  claimsForm: null,
  eligibilityPrint: null,
  historyPrint: null,
  claimsPrint: null,
  otherDocuments: [],
}

const createPatient = (overrides: Partial<ExecutionPayloadPatient> = {}): ExecutionPayloadPatient => ({
  patientName: 'Jane',
  patientDob: '01/01/1990',
  patientLastName: 'Doe',
  subscriberDob: '01/01/1980',
  subscriberName: 'Jane Doe',
  fileNames,
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

  it('limits the summary text to the first patient and shows the remaining count', () => {
    expect(
      getExecutionPatientsSummary(
        [
          createPatient(),
          createPatient({ patientName: 'John', patientLastName: 'Smith' }),
          createPatient({ patientName: 'Mary', patientLastName: 'Jones' }),
        ],
        emptyValue,
      ),
    ).toBe('Jane Doe, +2')
  })
})
