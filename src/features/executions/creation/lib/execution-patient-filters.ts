import type { ExecutionPatient, ExecutionPatientFilter } from '../model/execution-create'

const INSURANCE_EMPTY_VALUE = 'Empty'

const hasInsuranceValues = (patient: ExecutionPatient, value: string) => {
  return (
    patient.insuranceVerificationProcessResults.toLowerCase() === value.toLowerCase() &&
    patient.insuranceVerificationStatus.toLowerCase() === value.toLowerCase()
  )
}

export const getPatientsMatchingFilter = (
  patients: ExecutionPatient[],
  patientFilter: ExecutionPatientFilter,
): ExecutionPatient[] => {
  switch (patientFilter) {
    case 'review':
      return patients.filter((patient) => patient.review)
    case 'empty':
      return patients.filter((patient) => hasInsuranceValues(patient, INSURANCE_EMPTY_VALUE))
    case 'notExecuted':
      return patients.filter((patient) => !patient.executed)
    case 'all':
      return patients
  }
}
