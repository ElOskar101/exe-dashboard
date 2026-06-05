import type { ExecutionPayloadPatient } from '@/features/executions/shared'

const MAX_VISIBLE_PATIENTS = 2

export const getExecutionPatientFullName = (patient: ExecutionPayloadPatient, emptyValue: string) => {
  const fullName = [patient.patientName.trim(), patient.patientLastName.trim()].filter(Boolean).join(' ')

  return fullName || emptyValue
}

export const getExecutionPatientsSummary = (patients: ExecutionPayloadPatient[], emptyValue: string) => {
  const visiblePatientNames = patients
    .slice(0, MAX_VISIBLE_PATIENTS)
    .map((patient) => getExecutionPatientFullName(patient, emptyValue))
  const hiddenPatientsCount = Math.max(0, patients.length - MAX_VISIBLE_PATIENTS)

  if (visiblePatientNames.length === 0) {
    return emptyValue
  }

  if (hiddenPatientsCount === 0) {
    return visiblePatientNames.join(', ')
  }

  return [...visiblePatientNames, `+${hiddenPatientsCount}`].join(', ')
}

export const formatExecutionPatientOtherInformation = (
  otherInformation: ExecutionPayloadPatient['otherInformation'] | null | undefined,
  emptyValue: string,
) => {
  if (!otherInformation || Object.keys(otherInformation).length === 0) {
    return emptyValue
  }

  return JSON.stringify(otherInformation, null, 2)
}
