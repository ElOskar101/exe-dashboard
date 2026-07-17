import type { ExecutionPatient } from '../model/execution-create'

export const getExecutionWizardDisplayValue = (value: string | undefined, emptyValue: string) =>
  value?.trim() || emptyValue

export const getExecutionWizardPatientFullName = (patient: ExecutionPatient, emptyValue: string) => {
  const fullName = [patient.patientName?.trim(), patient.patientLastName?.trim()].filter(Boolean).join(' ')

  return fullName || emptyValue
}
