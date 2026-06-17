import type { ExecutionPatient, ExecutionVerificationType } from '../model/execution-create'
import type { CCCExecutionRow } from '../services/ccc.service'

const placeholderValues = new Set(['empty'])

const normalizeCellValue = (value: string | undefined) => {
  const trimmedValue = value?.trim() ?? ''

  return placeholderValues.has(trimmedValue.toLowerCase()) ? '' : trimmedValue
}

const getCellValue = (cellsByKey: Map<string, string>, key: string) => normalizeCellValue(cellsByKey.get(key))

const getVerificationType = (value: string): ExecutionVerificationType | '' => {
  return value === 'ELG' || value === 'FBD' ? value : ''
}

const hasImportablePatientData = (patient: ExecutionPatient) => {
  return Object.entries(patient).some(
    ([key, value]) => key !== 'id' && key !== 'otherInformation' && value.trim().length > 0,
  )
}

export const mapCCCExecutionRowsToPatients = (rows: CCCExecutionRow[]): ExecutionPatient[] => {
  return rows.flatMap((row) => {
    const cellsByKey = new Map(row.cells.map((cell) => [cell.key, cell.value]))
    const patient: ExecutionPatient = {
      id: row._id,
      patientName: getCellValue(cellsByKey, 'patient_first_name'),
      patientLastName: getCellValue(cellsByKey, 'patient_last_name'),
      patientMemberId: getCellValue(cellsByKey, 'memberid'),
      patientDob: getCellValue(cellsByKey, 'patient_dob'),
      policyHolderName: getCellValue(cellsByKey, 'subscriber_first_name'),
      policyHolderLastName: getCellValue(cellsByKey, 'subscriber_last_name'),
      policyHolderDob: getCellValue(cellsByKey, 'subscriber_dob'),
      relationship: getCellValue(cellsByKey, 'relationship_to_subscriber'),
      zipCode: getCellValue(cellsByKey, 'subscriber_zip_code'),
      clinic: getCellValue(cellsByKey, 'practice'),
      verificationType: getVerificationType(getCellValue(cellsByKey, 'type_of_verification')),
      filenames: getCellValue(cellsByKey, 'files_s_name'),
      otherInformation: '{}',
    }

    return hasImportablePatientData(patient) ? [patient] : []
  })
}
