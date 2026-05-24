import type { TFunction } from 'i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { IconAlertCircle, IconPlus, IconTrash } from '@tabler/icons-react'
import type { useExecutionWizard } from '../../hooks/use-execution-wizard'
import type { StepErrors } from '../../lib/execution-wizard-validation'
import type { ExecutionPatient, ExecutionVerificationType } from '../../model/execution-create'

interface PatientsStepProps {
  patients: ExecutionPatient[]
  errors: StepErrors['patients']
  showErrors: boolean
  onPatientChange: ReturnType<typeof useExecutionWizard>['updatePatientField']
  onVerificationTypeChange: ReturnType<typeof useExecutionWizard>['updatePatientVerificationType']
  onAddPatient: ReturnType<typeof useExecutionWizard>['addPatient']
  onRemovePatient: ReturnType<typeof useExecutionWizard>['removePatient']
  t: TFunction<'executions'>
}

export function PatientsStep({
  patients,
  errors,
  showErrors,
  onPatientChange,
  onVerificationTypeChange,
  onAddPatient,
  onRemovePatient,
  t,
}: PatientsStepProps) {
  return (
    <FieldSet>
      <FieldGroup>
        {errors.form && showErrors ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.patientListTitle')}</AlertTitle>
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        ) : null}

        {patients.map((patient, index) => {
          const rowErrors = errors.rows[index] || {}

          return (
            <div key={`patient-${index}`} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
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
                >
                  <IconTrash data-icon="inline-start" />
                  {t('buttons.removePatient')}
                </Button>
              </div>

              <FieldGroup className="mt-4 md:grid md:grid-cols-3">
                <Field data-invalid={showErrors && Boolean(rowErrors.patientName)}>
                  <FieldLabel htmlFor={`patientName-${index}`}>{t('fields.patientName')}</FieldLabel>
                  <Input
                    id={`patientName-${index}`}
                    value={patient.patientName}
                    onChange={(event) => onPatientChange(index, 'patientName', event.target.value)}
                    aria-invalid={showErrors && Boolean(rowErrors.patientName)}
                    placeholder={t('placeholders.patientName')}
                  />
                  <FieldError>{showErrors ? rowErrors.patientName : null}</FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.patientLastName)}>
                  <FieldLabel htmlFor={`patientLastName-${index}`}>{t('fields.patientLastName')}</FieldLabel>
                  <Input
                    id={`patientLastName-${index}`}
                    value={patient.patientLastName}
                    onChange={(event) => onPatientChange(index, 'patientLastName', event.target.value)}
                    aria-invalid={showErrors && Boolean(rowErrors.patientLastName)}
                    placeholder={t('placeholders.patientLastName')}
                  />
                  <FieldError>{showErrors ? rowErrors.patientLastName : null}</FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.patientMemberId)}>
                  <FieldLabel htmlFor={`patientMemberId-${index}`}>{t('fields.memberId')}</FieldLabel>
                  <Input
                    id={`patientMemberId-${index}`}
                    value={patient.patientMemberId}
                    onChange={(event) => onPatientChange(index, 'patientMemberId', event.target.value)}
                    aria-invalid={showErrors && Boolean(rowErrors.patientMemberId)}
                    placeholder={t('placeholders.memberId')}
                  />
                  <FieldError>{showErrors ? rowErrors.patientMemberId : null}</FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.patientDob)}>
                  <FieldLabel htmlFor={`patientDob-${index}`}>{t('fields.patientDob')}</FieldLabel>
                  <Input
                    id={`patientDob-${index}`}
                    type="date"
                    value={patient.patientDob}
                    onChange={(event) => onPatientChange(index, 'patientDob', event.target.value)}
                    aria-invalid={showErrors && Boolean(rowErrors.patientDob)}
                  />
                  <FieldError>{showErrors ? rowErrors.patientDob : null}</FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.policyHolderName)}>
                  <FieldLabel htmlFor={`policyHolderName-${index}`}>{t('fields.policyHolderName')}</FieldLabel>
                  <Input
                    id={`policyHolderName-${index}`}
                    value={patient.policyHolderName}
                    onChange={(event) => onPatientChange(index, 'policyHolderName', event.target.value)}
                    aria-invalid={showErrors && Boolean(rowErrors.policyHolderName)}
                    placeholder={t('placeholders.policyHolderName')}
                  />
                  <FieldError>{showErrors ? rowErrors.policyHolderName : null}</FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.policyHolderLastName)}>
                  <FieldLabel htmlFor={`policyHolderLastName-${index}`}>{t('fields.policyHolderLastName')}</FieldLabel>
                  <Input
                    id={`policyHolderLastName-${index}`}
                    value={patient.policyHolderLastName}
                    onChange={(event) => onPatientChange(index, 'policyHolderLastName', event.target.value)}
                    aria-invalid={showErrors && Boolean(rowErrors.policyHolderLastName)}
                    placeholder={t('placeholders.policyHolderLastName')}
                  />
                  <FieldError>{showErrors ? rowErrors.policyHolderLastName : null}</FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.policyHolderDob)}>
                  <FieldLabel htmlFor={`policyHolderDob-${index}`}>{t('fields.policyHolderDob')}</FieldLabel>
                  <Input
                    id={`policyHolderDob-${index}`}
                    type="date"
                    value={patient.policyHolderDob}
                    onChange={(event) => onPatientChange(index, 'policyHolderDob', event.target.value)}
                    aria-invalid={showErrors && Boolean(rowErrors.policyHolderDob)}
                  />
                  <FieldError>{showErrors ? rowErrors.policyHolderDob : null}</FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.relationship)}>
                  <FieldLabel htmlFor={`relationship-${index}`}>{t('fields.relationship')}</FieldLabel>
                  <Input
                    id={`relationship-${index}`}
                    value={patient.relationship}
                    onChange={(event) => onPatientChange(index, 'relationship', event.target.value)}
                    aria-invalid={showErrors && Boolean(rowErrors.relationship)}
                    placeholder={t('placeholders.relationship')}
                  />
                  <FieldError>{showErrors ? rowErrors.relationship : null}</FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.zipCode)}>
                  <FieldLabel htmlFor={`zipCode-${index}`}>{t('fields.zipCode')}</FieldLabel>
                  <Input
                    id={`zipCode-${index}`}
                    value={patient.zipCode}
                    onChange={(event) => onPatientChange(index, 'zipCode', event.target.value)}
                    aria-invalid={showErrors && Boolean(rowErrors.zipCode)}
                    placeholder={t('placeholders.zipCode')}
                  />
                  <FieldError>{showErrors ? rowErrors.zipCode : null}</FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.clinic)}>
                  <FieldLabel htmlFor={`patientClinic-${index}`}>{t('fields.patientClinic')}</FieldLabel>
                  <Input
                    id={`patientClinic-${index}`}
                    value={patient.clinic}
                    onChange={(event) => onPatientChange(index, 'clinic', event.target.value)}
                    aria-invalid={showErrors && Boolean(rowErrors.clinic)}
                    placeholder={t('placeholders.patientClinic')}
                  />
                  <FieldError>{showErrors ? rowErrors.clinic : null}</FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.filenames)}>
                  <FieldLabel htmlFor={`filenames-${index}`}>{t('fields.filenames')}</FieldLabel>
                  <Input
                    id={`filenames-${index}`}
                    value={patient.filenames}
                    onChange={(event) => onPatientChange(index, 'filenames', event.target.value)}
                    aria-invalid={showErrors && Boolean(rowErrors.filenames)}
                    placeholder={t('placeholders.filenames')}
                  />
                  <FieldError>{showErrors ? rowErrors.filenames : null}</FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.verificationType)}>
                  <FieldLabel>{t('fields.verificationType')}</FieldLabel>
                  <ToggleGroup
                    multiple={false}
                    variant="outline"
                    value={patient.verificationType ? [patient.verificationType] : []}
                    onValueChange={(value) =>
                      onVerificationTypeChange(index, (value[0] ?? '') as ExecutionVerificationType | '')
                    }
                    aria-label={t('fields.verificationType')}
                  >
                    <ToggleGroupItem value="ELG">{t('options.verificationElg')}</ToggleGroupItem>
                    <ToggleGroupItem value="FBD">{t('options.verificationFbd')}</ToggleGroupItem>
                  </ToggleGroup>
                  <FieldError>{showErrors ? rowErrors.verificationType : null}</FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.otherInformation)} className="md:col-span-3">
                  <FieldLabel htmlFor={`patientOtherInformation-${index}`}>
                    {t('fields.patientOtherInformation')}
                  </FieldLabel>
                  <textarea
                    id={`patientOtherInformation-${index}`}
                    value={patient.otherInformation}
                    onChange={(event) => onPatientChange(index, 'otherInformation', event.target.value)}
                    aria-invalid={showErrors && Boolean(rowErrors.otherInformation)}
                    className="min-h-28 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                    spellCheck={false}
                  />
                  <FieldError>{showErrors ? rowErrors.otherInformation : null}</FieldError>
                </Field>
              </FieldGroup>
            </div>
          )
        })}

        <Button type="button" variant="outline" onClick={onAddPatient}>
          <IconPlus data-icon="inline-start" />
          {t('buttons.addPatient')}
        </Button>
      </FieldGroup>
    </FieldSet>
  )
}
