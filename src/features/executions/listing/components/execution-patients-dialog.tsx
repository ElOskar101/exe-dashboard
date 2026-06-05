import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import type { Execution } from '@/features/executions/shared'
import { formatExecutionPatientOtherInformation, getExecutionPatientsSummary } from '../lib/execution-patients-display'

interface ExecutionPatientsDialogProps {
  execution: Execution
  executionLabel: string
}

export function ExecutionPatientsDialog({ execution, executionLabel }: ExecutionPatientsDialogProps) {
  const { t } = useTranslation('executions')
  const titleRef = useRef<HTMLHeadingElement>(null)
  const emptyValue = t('list.emptyValue')
  const patients = execution.meta?.patients ?? []

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="link"
            type="button"
            aria-label={t('list.patientTriggerAriaLabel', { execution: executionLabel })}
            className="text-foreground h-auto justify-start px-0 py-0 text-left whitespace-normal break-words"
          />
        }
      >
        {getExecutionPatientsSummary(patients, emptyValue)}
      </DialogTrigger>
      <DialogContent initialFocus={titleRef} className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle ref={titleRef} tabIndex={-1}>
            {t('list.patientsDialogTitle')}
          </DialogTitle>
          <DialogDescription>{t('list.patientsDialogDescription', { execution: executionLabel })}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100vh-16rem)]" viewportProps={{ className: 'max-h-[calc(100vh-16rem)]' }}>
          <div className="p-1 pr-3">
            {patients.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {patients.map((patient, index) => (
                  <Card key={`${execution._id}-patient-${index}`} className="bg-muted/15">
                    <CardContent>
                      <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        <PatientField
                          emptyValue={emptyValue}
                          label={t('fields.patientName')}
                          value={patient.patientName}
                        />
                        <PatientField
                          emptyValue={emptyValue}
                          label={t('fields.patientLastName')}
                          value={patient.patientLastName}
                        />
                        <PatientField
                          emptyValue={emptyValue}
                          label={t('fields.memberId')}
                          value={patient.patientMemberId}
                        />
                        <PatientField
                          emptyValue={emptyValue}
                          label={t('fields.patientDob')}
                          value={patient.patientDob}
                        />
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
                        <PatientField
                          emptyValue={emptyValue}
                          label={t('fields.policyHolderDob')}
                          value={patient.policyHolderDob}
                        />
                        <PatientField
                          emptyValue={emptyValue}
                          label={t('fields.relationship')}
                          value={patient.relationship}
                        />
                        <PatientField emptyValue={emptyValue} label={t('fields.zipCode')} value={patient.zipCode} />
                        <PatientField
                          emptyValue={emptyValue}
                          label={t('fields.patientClinic')}
                          value={patient.clinic}
                        />
                        <PatientField
                          emptyValue={emptyValue}
                          label={t('fields.verificationType')}
                          value={patient.verificationType}
                        />
                        <PatientField emptyValue={emptyValue} label={t('fields.filenames')} value={patient.filenames} />
                        <PatientMetadataField
                          emptyValue={emptyValue}
                          label={t('fields.patientOtherInformation')}
                          value={formatExecutionPatientOtherInformation(patient.otherInformation, emptyValue)}
                        />
                      </dl>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                {t('list.noPatients')}
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>{t('list.closePatientsDialog')}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PatientField({ emptyValue, label, value }: { emptyValue: string; label: string; value: string | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-normal break-words font-medium">{value?.trim() || emptyValue}</dd>
    </div>
  )
}

function PatientMetadataField({ emptyValue, label, value }: { emptyValue: string; label: string; value: string }) {
  return (
    <div className="min-w-0 sm:col-span-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1">
        {value === emptyValue ? (
          <span className="font-medium">{emptyValue}</span>
        ) : (
          <pre className="overflow-hidden rounded-3xl bg-background p-3 text-xs whitespace-pre-wrap break-words">
            {value}
          </pre>
        )}
      </dd>
    </div>
  )
}
