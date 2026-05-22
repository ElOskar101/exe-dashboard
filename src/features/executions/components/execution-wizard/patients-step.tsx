import type { TFunction } from 'i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { IconAlertCircle, IconPlus, IconTrash } from '@tabler/icons-react'
import type { useExecutionWizard } from '../../hooks/use-execution-wizard'
import type { StepErrors } from '../../lib/execution-wizard-validation'
import type { ExecutionPatient } from '../../model/execution-create'

interface PatientsStepProps {
  patients: ExecutionPatient[]
  errors: StepErrors['patients']
  showErrors: boolean
  onPatientChange: ReturnType<typeof useExecutionWizard>['updatePatientField']
  onAddPatient: ReturnType<typeof useExecutionWizard>['addPatient']
  onRemovePatient: ReturnType<typeof useExecutionWizard>['removePatient']
  t: TFunction<'executions'>
}

export function PatientsStep({
  patients,
  errors,
  showErrors,
  onPatientChange,
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
            <div
              key={`patient-${index}`}
              className="rounded-3xl border border-border/70 bg-muted/20 p-4"
            >
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

              <FieldGroup className="mt-4 md:grid md:grid-cols-2">
                <Field
                  data-invalid={showErrors && Boolean(rowErrors.patientName)}
                >
                  <FieldLabel htmlFor={`patientName-${index}`}>
                    {t('fields.patientName')}
                  </FieldLabel>
                  <Input
                    id={`patientName-${index}`}
                    value={patient.patientName}
                    onChange={(event) =>
                      onPatientChange(index, 'patientName', event.target.value)
                    }
                    aria-invalid={showErrors && Boolean(rowErrors.patientName)}
                    placeholder={t('placeholders.patientName')}
                  />
                  <FieldError>
                    {showErrors ? rowErrors.patientName : null}
                  </FieldError>
                </Field>

                <Field data-invalid={showErrors && Boolean(rowErrors.memberId)}>
                  <FieldLabel htmlFor={`memberId-${index}`}>
                    {t('fields.memberId')}
                  </FieldLabel>
                  <Input
                    id={`memberId-${index}`}
                    value={patient.memberId}
                    onChange={(event) =>
                      onPatientChange(index, 'memberId', event.target.value)
                    }
                    aria-invalid={showErrors && Boolean(rowErrors.memberId)}
                    placeholder={t('placeholders.memberId')}
                  />
                  <FieldError>
                    {showErrors ? rowErrors.memberId : null}
                  </FieldError>
                </Field>

                <Field
                  data-invalid={showErrors && Boolean(rowErrors.dateOfBirth)}
                >
                  <FieldLabel htmlFor={`dateOfBirth-${index}`}>
                    {t('fields.dateOfBirth')}
                  </FieldLabel>
                  <Input
                    id={`dateOfBirth-${index}`}
                    type="date"
                    value={patient.dateOfBirth}
                    onChange={(event) =>
                      onPatientChange(index, 'dateOfBirth', event.target.value)
                    }
                    aria-invalid={showErrors && Boolean(rowErrors.dateOfBirth)}
                  />
                  <FieldError>
                    {showErrors ? rowErrors.dateOfBirth : null}
                  </FieldError>
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
