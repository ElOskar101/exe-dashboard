import type { MouseEvent, ReactNode } from 'react'
import type { TFunction } from 'i18next'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { IconTrash } from '@tabler/icons-react'
import { getExecutionWizardDisplayValue } from '../lib/execution-wizard-display'
import type { ExecutionPatient } from '../model/execution-create'

interface ImportedPatientCardProps {
  emptyValue: string
  hasRowErrors: boolean
  index: number
  missingFields: string[]
  patient: ExecutionPatient
  rowErrorMessage?: string
  showErrors: boolean
  onRemovePatient: (index: number) => void
  t: TFunction<'executions'>
}

export function ImportedPatientCard({
  emptyValue,
  hasRowErrors,
  index,
  missingFields,
  patient,
  rowErrorMessage,
  showErrors,
  onRemovePatient,
  t,
}: ImportedPatientCardProps) {
  const fallbackPatientLabel = t('sections.patients.patientTitle', { index: index + 1 })
  const patientLabel = [patient.patientName, patient.patientLastName].filter(Boolean).join(' ') || fallbackPatientLabel
  const verificationDescription = [
    getExecutionWizardDisplayValue(patient.insuranceVerificationStatus, emptyValue),
    getExecutionWizardDisplayValue(patient.insuranceVerificationProcessResults, emptyValue),
  ].join(' - ')
  const removePatient = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    onRemovePatient(index)
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Dialog>
        <DialogTrigger
          render={
            <Card
              size="sm"
              className="h-full cursor-pointer gap-0 rounded-3xl bg-muted/15 py-2 text-left shadow-sm data-[size=sm]:gap-0 data-[size=sm]:py-2"
              aria-label={t('detail.patientDetailsActionLabel', { patient: patientLabel })}
            />
          }
        >
          <CardHeader className="px-4">
            <CardTitle className="min-w-0 truncate text-sm">
              {patientLabel}
              <span className="ml-2">{getExecutionWizardDisplayValue(patient.patientDob, emptyValue)}</span>
            </CardTitle>
            {showErrors && hasRowErrors ? (
              <CardDescription role="alert" className="col-start-1 text-destructive">
                <span className="flex flex-col gap-1">
                  <span className="font-medium">{t('validation.patientDetailsTitle')}</span>
                  <span>
                    {missingFields.length > 0
                      ? t('validation.patientDetailsDescription', {
                          fields: missingFields.join(', '),
                        })
                      : rowErrorMessage}
                  </span>
                </span>
              </CardDescription>
            ) : null}
            <CardAction>
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                onClick={removePatient}
                aria-label={t('buttons.removePatient')}
              >
                <IconTrash />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="-mt-1 px-4">
            <div className="min-w-0 truncate text-sm leading-tight text-muted-foreground">
              {verificationDescription}
            </div>
          </CardContent>
        </DialogTrigger>
        <PatientDetailsDialog emptyValue={emptyValue} patient={patient} patientLabel={patientLabel} t={t} />
      </Dialog>
    </div>
  )
}

function PatientDetailsDialog({
  emptyValue,
  patient,
  patientLabel,
  t,
}: {
  emptyValue: string
  patient: ExecutionPatient
  patientLabel: string
  t: TFunction<'executions'>
}) {
  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{t('detail.patientDetailsTitle', { patient: patientLabel })}</DialogTitle>
        <DialogDescription>{t('detail.patientDetailsDescription')}</DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[calc(100vh-16rem)]" viewportProps={{ className: 'max-h-[calc(100vh-16rem)]' }}>
        <div className="flex flex-col gap-6 p-1 pr-3">
          <PatientDetailGroup title={t('detail.patientDetailsPatientSection')}>
            <PatientField emptyValue={emptyValue} label={t('fields.patientName')} value={patient.patientName} />
            <PatientField emptyValue={emptyValue} label={t('fields.patientLastName')} value={patient.patientLastName} />
            <PatientField emptyValue={emptyValue} label={t('fields.patientDob')} value={patient.patientDob} />
            <PatientField emptyValue={emptyValue} label={t('fields.memberId')} value={patient.patientMemberId} />
          </PatientDetailGroup>
          <PatientDetailGroup title={t('detail.patientDetailsPolicyHolderSection')}>
            <PatientField
              emptyValue={emptyValue}
              label={t('fields.policyHolderName')}
              value={patient.policyHolderName}
            />
            <PatientField
              emptyValue={emptyValue}
              label={t('fields.policyHolderLastName')}
              value={patient.policyHolderLastName}
            />
            <PatientField emptyValue={emptyValue} label={t('fields.policyHolderDob')} value={patient.policyHolderDob} />
            <PatientField emptyValue={emptyValue} label={t('fields.relationship')} value={patient.relationship} />
          </PatientDetailGroup>
          <PatientDetailGroup title={t('detail.patientDetailsCoverageSection')}>
            <PatientField emptyValue={emptyValue} label={t('fields.zipCode')} value={patient.zipCode} />
            <PatientField emptyValue={emptyValue} label={t('fields.carrierName')} value={patient.carrierName} />
            <PatientField
              emptyValue={emptyValue}
              label={t('fields.insuranceVerificationProcessResults')}
              value={patient.insuranceVerificationProcessResults}
            />
            <PatientField
              emptyValue={emptyValue}
              label={t('fields.insuranceVerificationStatus')}
              value={patient.insuranceVerificationStatus}
            />
            <PatientField
              emptyValue={emptyValue}
              label={t('fields.executed')}
              value={patient.executed ? t('options.enabled') : t('options.disabled')}
            />
            <PatientField emptyValue={emptyValue} label={t('fields.patientClinic')} value={patient.clinic} />
            <PatientField
              emptyValue={emptyValue}
              label={t('fields.verificationType')}
              value={patient.verificationType}
            />
          </PatientDetailGroup>
          <PatientDetailGroup title={t('detail.patientDetailsFilesSection')}>
            <PatientField emptyValue={emptyValue} label={t('fields.filenames')} value={patient.filenames} isWide />
            <PatientField
              emptyValue={emptyValue}
              label={t('fields.patientOtherInformation')}
              value={patient.otherInformation}
              isWide
            />
          </PatientDetailGroup>
        </div>
      </ScrollArea>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>{t('detail.closePatientDetails')}</DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}

function PatientDetailGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
    </section>
  )
}

function PatientField({
  emptyValue,
  isWide,
  label,
  value,
}: {
  emptyValue: string
  isWide?: boolean
  label: string
  value: string
}) {
  return (
    <div className={cn('min-w-0', isWide && 'sm:col-span-2')}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words font-medium">
        {getExecutionWizardDisplayValue(value, emptyValue)}
      </dd>
    </div>
  )
}
