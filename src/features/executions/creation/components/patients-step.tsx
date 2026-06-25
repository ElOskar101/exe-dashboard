import type { TFunction } from 'i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { IconAlertCircle } from '@tabler/icons-react'
import { ExecutionClientFilter } from '@/features/executions/listing'
import { hasErrors } from '../lib/execution-wizard-validation'
import type { ExecutionWizardPatientsStepState } from '../hooks/use-execution-wizard'
import { ImportedPatientCard } from './imported-patient-card'

interface PatientsStepProps extends ExecutionWizardPatientsStepState {
  t: TFunction<'executions'>
}

const patientErrorFieldKeys = ['patientName', 'patientLastName', 'patientMemberId', 'patientDob'] as const
const patientCardSkeletonCount = 6

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
  selectedCustomerError,
  clinicOptions,
  isLoadingClinics,
  hasSelectedCustomerWithoutClinics,
  executionDayOptions,
  isLoadingExecutionDays,
  executionDaysError,
  isImportingPatients,
  importPatientsError,
  onCustomerClear,
  onCustomerSelect,
  onClinicSelect,
  onExecutionDaySelect,
  onRemovePatient,
  t,
}: PatientsStepProps) {
  const emptyValue = t('review.emptyValue')
  const selectedExecutionLabel = executionName || execution || undefined
  const shouldShowExecutionLoading = isLoadingExecutionDays && !selectedExecutionLabel
  const executionPlaceholder = shouldShowExecutionLoading
    ? t('placeholders.loadingExecutions')
    : t('placeholders.execution')

  return (
    <FieldSet>
      <FieldGroup>
        <FieldGroup className="gap-4 md:grid md:grid-cols-3">
          <ExecutionClientFilter
            clearSelectionLabel={t('fields.client')}
            emptyMessage={t('help.noCustomersFound')}
            error={showErrors ? contextErrors.client : null}
            fieldClassName="gap-3"
            getOptionValue={(customer) => customer._id}
            id="client"
            invalid={showErrors && Boolean(contextErrors.client)}
            label={t('fields.client')}
            loadingMessage={t('help.searchingCustomers')}
            loadingMoreMessage={t('help.searchingCustomers')}
            placeholder={t('placeholders.client')}
            searchErrorMessage={t('validation.customerSearchTitle')}
            searchPlaceholder={t('placeholders.client')}
            selectedCountLabel={context.clientName || t('fields.client')}
            selectedValueLabels={context.client ? { [context.client]: context.clientName } : undefined}
            selectedValues={context.client ? [context.client] : []}
            selectionMode="single"
            triggerClassName="rounded-3xl border-transparent bg-input/50 hover:bg-input/50 aria-expanded:bg-input/50 dark:bg-input/50 dark:hover:bg-input/50"
            onSelectedCustomersChange={(selectedCustomers) => {
              const selectedCustomer = selectedCustomers[0]

              if (selectedCustomer) {
                onCustomerSelect(selectedCustomer)
              }
            }}
            onSelectedValuesChange={(selectedValues) => {
              if (selectedValues.length === 0) {
                onCustomerClear()
              }
            }}
          />

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
                <SelectValue placeholder={executionPlaceholder}>
                  {shouldShowExecutionLoading ? executionPlaceholder : selectedExecutionLabel}
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

        {errors.form && showErrors && !isImportingPatients ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.patientListTitle')}</AlertTitle>
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        ) : null}

        {isImportingPatients ? (
          <div className="grid max-h-[13rem] gap-4 overflow-y-auto p-1 pr-3 sm:max-h-[20rem] md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: patientCardSkeletonCount }).map((_, index) => (
              <div key={index} className="flex min-w-0 flex-col gap-4 rounded-3xl border bg-muted/15 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="size-8 rounded-full" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isImportingPatients && patients.length === 0 ? (
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            {t('help.noImportedPatients')}
          </div>
        ) : null}

        {!isImportingPatients && patients.length > 0 ? (
          <div className="grid max-h-[13rem] gap-4 overflow-y-auto p-1 pr-3 sm:max-h-[20rem] md:grid-cols-2 xl:grid-cols-3">
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
