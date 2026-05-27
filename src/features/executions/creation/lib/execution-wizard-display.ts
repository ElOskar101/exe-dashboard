import type { ExecutionMetadata, ExecutionPatient } from '../model/execution-create'

export const getExecutionWizardDisplayValue = (value: string, emptyValue: string) => value.trim() || emptyValue

export const getExecutionWizardPatientFullName = (patient: ExecutionPatient, emptyValue: string) => {
  const fullName = [patient.patientName.trim(), patient.patientLastName.trim()].filter(Boolean).join(' ')

  return fullName || emptyValue
}

export const parseExecutionMetadataString = (value: string): ExecutionMetadata | string => {
  try {
    const parsed = JSON.parse(value)

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return value
    }

    return parsed as ExecutionMetadata
  } catch {
    return value
  }
}
