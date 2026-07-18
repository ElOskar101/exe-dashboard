import type { ExecutionPatient } from '../model/execution-create'
import type { PatientCellValue } from '../../shared/model/execution-create-payload'

export const getExecutionWizardDisplayValue = (value: PatientCellValue, emptyValue: string) =>
  value?.trim() || emptyValue

export const getExecutionWizardPatientFullName = (patient: ExecutionPatient, emptyValue: string) => {
  const fullName = [patient.patientName?.trim(), patient.patientLastName?.trim()].filter(Boolean).join(' ')

  return fullName || emptyValue
}
