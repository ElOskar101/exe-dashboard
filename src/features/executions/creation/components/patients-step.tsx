import type { TFunction } from 'i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { IconAlertCircle, IconDownload, IconTrash } from '@tabler/icons-react'
import { getExecutionWizardDisplayValue } from '../lib/execution-wizard-display'
import { hasErrors } from '../lib/execution-wizard-validation'
import type { ExecutionWizardPatientsStepState } from '../hooks/use-execution-wizard'
import { CustomerSearchField } from './customer-search-field'

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
  onImportPatients,
  onRemovePatient,
  t,
}: PatientsStepProps) {
  const emptyValue = t('review.emptyValue')

  return (
    <FieldSet>
      <FieldGroup>
        <FieldGroup className="gap-4 md:grid md:grid-cols-4">
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
          </Field>

          <Field>
            <FieldLabel aria-hidden="true" className="invisible">
              {t('buttons.getPatients')}
            </FieldLabel>
            <Button
              type="button"
              variant="outline"
              onClick={onImportPatients}
              disabled={!execution || isImportingPatients}
              className="w-full"
            >
              {isImportingPatients ? <Spinner data-icon="inline-start" /> : <IconDownload data-icon="inline-start" />}
              {isImportingPatients ? t('buttons.gettingPatients') : t('buttons.getPatients')}
            </Button>
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
          <div className="max-h-[28rem] space-y-4 overflow-y-auto sm:max-h-[34rem] sm:pr-1">
            {patients.map((patient, index) =>
              (() => {
                const rowErrors = errors.rows[index] ?? {}
                const missingFields = patientErrorFieldKeys
                  .filter((field) => Boolean(rowErrors[field]))
                  .map((field) => t(patientErrorLabels[field]))
                const hasRowErrors = hasErrors(rowErrors)

                return (
                  <div
                    key={`${patient.patientMemberId}-${patient.patientName}-${index}`}
                    className="rounded-3xl border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium">
                        {t('sections.patients.patientTitle', {
                          index: index + 1,
                        })}
                      </p>
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => onRemovePatient(index)}
                        aria-label={t('buttons.removePatient')}
                        className="w-full sm:w-auto"
                      >
                        <IconTrash data-icon="inline-start" />
                        {t('buttons.removePatient')}
                      </Button>
                    </div>

                    <dl className="mt-4 grid gap-3 md:grid-cols-3">
                      <div>
                        <dt className="text-sm text-muted-foreground">{t('fields.patientName')}</dt>
                        <dd className="mt-1 font-medium">
                          {getExecutionWizardDisplayValue(patient.patientName, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">{t('fields.patientLastName')}</dt>
                        <dd className="mt-1 font-medium">
                          {getExecutionWizardDisplayValue(patient.patientLastName, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">{t('fields.memberId')}</dt>
                        <dd className="mt-1 font-medium">
                          {getExecutionWizardDisplayValue(patient.patientMemberId, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">{t('fields.patientDob')}</dt>
                        <dd className="mt-1 font-medium">
                          {getExecutionWizardDisplayValue(patient.patientDob, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">{t('fields.policyHolderName')}</dt>
                        <dd className="mt-1 font-medium">
                          {getExecutionWizardDisplayValue(patient.policyHolderName, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">{t('fields.policyHolderLastName')}</dt>
                        <dd className="mt-1 font-medium">
                          {getExecutionWizardDisplayValue(patient.policyHolderLastName, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">{t('fields.policyHolderDob')}</dt>
                        <dd className="mt-1 font-medium">
                          {getExecutionWizardDisplayValue(patient.policyHolderDob, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">{t('fields.relationship')}</dt>
                        <dd className="mt-1 font-medium">
                          {getExecutionWizardDisplayValue(patient.relationship, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">{t('fields.zipCode')}</dt>
                        <dd className="mt-1 font-medium">
                          {getExecutionWizardDisplayValue(patient.zipCode, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">{t('fields.patientClinic')}</dt>
                        <dd className="mt-1 font-medium">
                          {getExecutionWizardDisplayValue(patient.clinic, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">{t('fields.verificationType')}</dt>
                        <dd className="mt-1 font-medium">{patient.verificationType || emptyValue}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">{t('fields.filenames')}</dt>
                        <dd className="mt-1 break-words font-medium">
                          {getExecutionWizardDisplayValue(patient.filenames, emptyValue)}
                        </dd>
                      </div>
                    </dl>

                    {showErrors && hasRowErrors ? (
                      <Alert variant="destructive" className="mt-4">
                        <IconAlertCircle />
                        <AlertTitle>{t('validation.patientDetailsTitle')}</AlertTitle>
                        <AlertDescription>
                          {missingFields.length > 0
                            ? t('validation.patientDetailsDescription', {
                                fields: missingFields.join(', '),
                              })
                            : rowErrors.otherInformation}
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                )
              })(),
            )}
          </div>
        ) : null}
      </FieldGroup>
    </FieldSet>
  )
}
