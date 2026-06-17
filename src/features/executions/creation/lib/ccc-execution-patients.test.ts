import { describe, expect, it } from 'vitest'
import { mapCCCExecutionRowsToPatients } from './ccc-execution-patients'

describe('mapCCCExecutionRowsToPatients', () => {
  it('maps known CC cells into execution patients', () => {
    expect(
      mapCCCExecutionRowsToPatients([
        {
          _id: 'row-1',
          cells: [
            { key: 'patient_first_name', value: 'Soledad' },
            { key: 'patient_last_name', value: 'Valdez' },
            { key: 'memberid', value: '44457159' },
            { key: 'patient_dob', value: '03/27/1959' },
            { key: 'subscriber_first_name', value: 'Soledad' },
            { key: 'subscriber_last_name', value: 'Valdez' },
            { key: 'subscriber_dob', value: '03/27/1959' },
            { key: 'relationship_to_subscriber', value: 'Self' },
            { key: 'subscriber_zip_code', value: '77075' },
            { key: 'practice', value: 'HERALDSQ' },
            { key: 'type_of_verification', value: 'FBD' },
            { key: 'files_s_name', value: 'Eligibility_status.pdf' },
          ],
        },
      ]),
    ).toEqual([
      {
        id: 'row-1',
        patientName: 'Soledad',
        patientLastName: 'Valdez',
        patientMemberId: '44457159',
        patientDob: '03/27/1959',
        policyHolderName: 'Soledad',
        policyHolderLastName: 'Valdez',
        policyHolderDob: '03/27/1959',
        relationship: 'Self',
        zipCode: '77075',
        clinic: 'HERALDSQ',
        verificationType: 'FBD',
        filenames: 'Eligibility_status.pdf',
        otherInformation: '{}',
      },
    ])
  })

  it('converts empty placeholders and unsupported verification types to blank values', () => {
    expect(
      mapCCCExecutionRowsToPatients([
        {
          _id: 'row-1',
          cells: [
            { key: 'patient_first_name', value: ' Empty ' },
            { key: 'patient_last_name', value: 'Patient' },
            { key: 'memberid', value: 'EMPTY' },
            { key: 'type_of_verification', value: 'Other' },
          ],
        },
      ]),
    ).toMatchObject([
      {
        patientName: '',
        patientLastName: 'Patient',
        patientMemberId: '',
        verificationType: '',
      },
    ])
  })

  it('skips blank rows after placeholder cleanup', () => {
    expect(
      mapCCCExecutionRowsToPatients([
        {
          _id: 'row-1',
          cells: [
            { key: 'patient_first_name', value: 'EMPTY' },
            { key: 'patient_last_name', value: ' ' },
            { key: 'memberid', value: 'Empty' },
          ],
        },
      ]),
    ).toEqual([])
  })

  it('drops unmapped cells and keeps raw date strings', () => {
    expect(
      mapCCCExecutionRowsToPatients([
        {
          _id: 'row-1',
          cells: [
            { key: 'patient_first_name', value: 'Jessica' },
            { key: 'patient_dob', value: "07/24/2025 00:00 AM'" },
            { key: 'annual_max', value: '$1,500' },
          ],
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        patientName: 'Jessica',
        patientDob: "07/24/2025 00:00 AM'",
        otherInformation: '{}',
      }),
    ])
  })
})
