import type { ExecutionMetadata, ExecutionPatient } from '../model/execution-create'
import { parseExecutionMetadata } from './execution-metadata'

export const getExecutionWizardDisplayValue = (value: string, emptyValue: string) => value.trim() || emptyValue

export const getExecutionWizardPatientFullName = (patient: ExecutionPatient, emptyValue: string) => {
  const fullName = [patient.patientName.trim(), patient.patientLastName.trim()].filter(Boolean).join(' ')

  return fullName || emptyValue
}

export const parseExecutionMetadataString = (value: string): ExecutionMetadata | string => {
  return parseExecutionMetadata(value) ?? value
}
