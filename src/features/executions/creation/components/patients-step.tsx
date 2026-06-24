import type { TFunction } from 'i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { IconAlertCircle } from '@tabler/icons-react'
import { hasErrors } from '../lib/execution-wizard-validation'
import type { ExecutionWizardPatientsStepState } from '../hooks/use-execution-wizard'
import { CustomerSearchField } from './customer-search-field'
import { ImportedPatientCard } from './imported-patient-card'

interface PatientsStepProps extends ExecutionWizardPatientsStepState {
  t: TFunction<'executions'>
}

const patientErrorFieldKeys = ['patientName', 'patientLastName', 'patientMemberId', 'patientDob'] as const

const patientErrorLabels = {
  patientName: 'fields.patientName',
  patientLastName: 'fields.patientLastName',
  patientMemberId: 'fields.memberId',
  patientDob: 'fields.patientDob',
} as const satisfies Record<(typeof patientErrorFieldKeys)[number], Parameters<TFunction<'executions'>>[0]>

export function PatientsStep({
  context,
  execution,
  executionName,
  patients,
  contextErrors,
  errors,
  showErrors,
  customerOptions,
  isSearchingCustomers,
  customerSearchError,
  selectedCustomerError,
  clinicOptions,
  isLoadingClinics,
  hasSelectedCustomerWithoutClinics,
  executionDayOptions,
  isLoadingExecutionDays,
  executionDaysError,
  isImportingPatients,
  importPatientsError,
  onCustomerSearchChange,
  onCustomerClear,
  onCustomerSelect,
  onClinicSelect,
  onExecutionDaySelect,
  onRemovePatient,
  t,
}: PatientsStepProps) {
  const emptyValue = t('review.emptyValue')

  return (
    <FieldSet>
      <FieldGroup>
        <FieldGroup className="gap-4 md:grid md:grid-cols-3">
          <Field data-invalid={showErrors && Boolean(contextErrors.client)}>
            <FieldLabel htmlFor="client">{t('fields.client')}</FieldLabel>
            <CustomerSearchField
              id="client"
              value={context.clientName}
              selectedCustomerName={context.clientName}
              invalid={showErrors && Boolean(contextErrors.client)}
              placeholder={t('placeholders.client')}
              isLoading={isSearchingCustomers}
              searchError={customerSearchError}
              options={customerOptions}
              noResultsText={t('help.noCustomersFound')}
              searchingText={t('help.searchingCustomers')}
              selectedText={t('help.selected')}
              onValueChange={onCustomerSearchChange}
              onClearSelection={onCustomerClear}
              onSelect={onCustomerSelect}
              selectedCustomerId={context.client}
            />
            <FieldError>{showErrors ? contextErrors.client : null}</FieldError>
          </Field>

          <Field data-invalid={showErrors && Boolean(contextErrors.clinic)}>
            <FieldLabel htmlFor="clinic">{t('fields.clinic')}</FieldLabel>
            <Select
              value={context.clinic}
              onValueChange={(value) => onClinicSelect(value ?? '')}
              disabled={
                !context.client.trim() ||
                isLoadingClinics ||
                hasSelectedCustomerWithoutClinics ||
                Boolean(selectedCustomerError)
              }
            >
              <SelectTrigger id="clinic" aria-invalid={showErrors && Boolean(contextErrors.clinic)} className="w-full">
                <SelectValue placeholder={t('placeholders.clinic')}>{context.clinicName || undefined}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {clinicOptions.map((clinic) => (
                    <SelectItem key={clinic._id} value={clinic._id}>
                      {clinic.clinicName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{showErrors ? contextErrors.clinic : null}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="execution">{t('fields.execution')}</FieldLabel>
            <Select
              value={execution}
              onValueChange={(value) => onExecutionDaySelect(value ?? '')}
              disabled={
                !context.clinic.trim() ||
                isLoadingExecutionDays ||
                Boolean(executionDaysError) ||
                executionDayOptions.length === 0
              }
            >
              <SelectTrigger id="execution" className="w-full">
                <SelectValue placeholder={t('placeholders.execution')}>
                  {executionName || execution || undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {executionDayOptions.map((day) => (
                    <SelectItem key={day._id} value={day._id}>
                      {day.sheetName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {isImportingPatients ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner data-icon="inline-start" />
                {t('buttons.gettingPatients')}
              </p>
            ) : null}
          </Field>
        </FieldGroup>

        {executionDaysError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.executionDaysTitle')}</AlertTitle>
            <AlertDescription>{executionDaysError}</AlertDescription>
          </Alert>
        ) : null}

        {importPatientsError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.importPatientsTitle')}</AlertTitle>
            <AlertDescription>{importPatientsError}</AlertDescription>
          </Alert>
        ) : null}

        {errors.form && showErrors ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.patientListTitle')}</AlertTitle>
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        ) : null}

        {patients.length === 0 ? (
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            {t('help.noImportedPatients')}
          </div>
        ) : null}

        {patients.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('help.importedPatients', {
              count: patients.length,
            })}
          </p>
        ) : null}

        {patients.length > 0 ? (
          <div className="grid max-h-[13rem] gap-4 overflow-y-auto p-1 pr-3 sm:max-h-[16rem] md:grid-cols-2 xl:grid-cols-3">
            {patients.map((patient, index) =>
              (() => {
                const rowErrors = errors.rows[index] ?? {}
                const missingFields = patientErrorFieldKeys
                  .filter((field) => Boolean(rowErrors[field]))
                  .map((field) => t(patientErrorLabels[field]))
                const hasRowErrors = hasErrors(rowErrors)

                return (
                  <ImportedPatientCard
                    key={`${patient.patientMemberId}-${patient.patientName}-${index}`}
                    emptyValue={emptyValue}
                    hasRowErrors={hasRowErrors}
                    index={index}
                    missingFields={missingFields}
                    patient={patient}
                    rowErrorMessage={rowErrors.otherInformation}
                    showErrors={showErrors}
                    onRemovePatient={onRemovePatient}
                    t={t}
                  />
                )
              })(),
            )}
          </div>
        ) : null}
      </FieldGroup>
    </FieldSet>
  )
}
