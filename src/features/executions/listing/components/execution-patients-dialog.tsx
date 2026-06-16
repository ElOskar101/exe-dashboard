import { IconEye } from '@tabler/icons-react'
import { Fragment, useRef, useState } from 'react'
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

const FILENAME_PREVIEW_MAX_LENGTH = 40
const VISIBLE_PATIENT_DETAILS_COUNT = 4

type ExecutionPatient = Execution['context']['patients'][number]

interface ExecutionPatientsDialogProps {
  execution: Execution
  executionLabel: string
}

export function ExecutionPatientsDialog({ execution, executionLabel }: ExecutionPatientsDialogProps) {
  const { t } = useTranslation('executions')
  const titleRef = useRef<HTMLHeadingElement>(null)
  const emptyValue = t('list.emptyValue')
  const patients = execution.context.patients

  return (
    <Dialog>
      <div className="flex items-center gap-2">
        <span className="min-w-0 whitespace-normal break-words">
          {getExecutionPatientsSummary(patients, emptyValue)}
        </span>
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              aria-label={t('list.patientTriggerAriaLabel', { execution: executionLabel })}
              className="text-foreground"
            />
          }
        >
          <IconEye />
        </DialogTrigger>
      </div>
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
                  <PatientCard
                    key={`${execution._id}-patient-${index}`}
                    emptyValue={emptyValue}
                    expandLabel={t('list.expandFilename')}
                    minimizeLabel={t('list.minimizeFilename')}
                    patient={patient}
                  />
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

function PatientCard({
  emptyValue,
  expandLabel,
  minimizeLabel,
  patient,
}: {
  emptyValue: string
  expandLabel: string
  minimizeLabel: string
  patient: ExecutionPatient
}) {
  const { t } = useTranslation('executions')
  const [isExpanded, setIsExpanded] = useState(false)
  const patientDetails = [
    {
      id: 'patientName',
      field: <PatientField emptyValue={emptyValue} label={t('fields.patientName')} value={patient.patientName.value} />,
    },
    {
      id: 'patientLastName',
      field: (
        <PatientField
          emptyValue={emptyValue}
          label={t('fields.patientLastName')}
          value={patient.patientLastName.value}
        />
      ),
    },
    {
      id: 'memberId',
      field: (
        <PatientField emptyValue={emptyValue} label={t('fields.memberId')} value={patient.patientMemberId.value} />
      ),
    },
    {
      id: 'patientDob',
      field: <PatientField emptyValue={emptyValue} label={t('fields.patientDob')} value={patient.patientDob.value} />,
    },
    {
      id: 'policyHolderName',
      field: (
        <PatientField
          emptyValue={emptyValue}
          label={t('fields.policyHolderName')}
          value={patient.policyHolderName.value}
        />
      ),
    },
    {
      id: 'policyHolderLastName',
      field: (
        <PatientField
          emptyValue={emptyValue}
          label={t('fields.policyHolderLastName')}
          value={patient.policyHolderLastName.value}
        />
      ),
    },
    {
      id: 'policyHolderDob',
      field: (
        <PatientField
          emptyValue={emptyValue}
          label={t('fields.policyHolderDob')}
          value={patient.policyHolderDob.value}
        />
      ),
    },
    {
      id: 'relationship',
      field: (
        <PatientField emptyValue={emptyValue} label={t('fields.relationship')} value={patient.relationship.value} />
      ),
    },
    {
      id: 'zipCode',
      field: <PatientField emptyValue={emptyValue} label={t('fields.zipCode')} value={patient.zipCode.value} />,
    },
    {
      id: 'verificationType',
      field: (
        <PatientField emptyValue={emptyValue} label={t('fields.verificationType')} value={patient.verificationType} />
      ),
    },
    {
      id: 'filenames',
      field: (
        <PatientFilenamesField
          emptyValue={emptyValue}
          expandLabel={expandLabel}
          label={t('fields.filenames')}
          minimizeLabel={minimizeLabel}
          value={patient.filenames}
        />
      ),
    },
    {
      id: 'patientOtherInformation',
      field: (
        <PatientMetadataField
          emptyValue={emptyValue}
          label={t('fields.patientOtherInformation')}
          value={formatExecutionPatientOtherInformation(patient.otherInformation, emptyValue)}
        />
      ),
    },
  ]
  const visiblePatientDetails = isExpanded ? patientDetails : patientDetails.slice(0, VISIBLE_PATIENT_DETAILS_COUNT)
  const canToggle = patientDetails.length > VISIBLE_PATIENT_DETAILS_COUNT

  return (
    <Card className="bg-muted/15">
      <CardContent>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {visiblePatientDetails.map(({ field, id }) => (
            <Fragment key={id}>{field}</Fragment>
          ))}
        </dl>
        {canToggle ? (
          <Button
            type="button"
            variant="link"
            size="xs"
            className="mt-4 h-auto px-0 py-0"
            onClick={() => setIsExpanded((currentValue) => !currentValue)}
          >
            {isExpanded ? minimizeLabel : expandLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

function PatientField({ emptyValue, label, value }: { emptyValue: string; label: string; value: string | undefined }) {
  return (
    <div className="min-w-0">
      <dt>{label}</dt>
      <dd className="mt-1 whitespace-normal break-words font-medium text-muted-foreground">
        {value?.trim() || emptyValue}
      </dd>
    </div>
  )
}

function PatientFilenamesField({
  emptyValue,
  expandLabel,
  label,
  minimizeLabel,
  value,
}: {
  emptyValue: string
  expandLabel: string
  label: string
  minimizeLabel: string
  value: string[] | undefined
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const filenames = value?.join(', ').trim() || emptyValue
  const canToggle = filenames !== emptyValue && filenames.length > FILENAME_PREVIEW_MAX_LENGTH
  const visibleFilenames =
    canToggle && !isExpanded ? `${filenames.slice(0, FILENAME_PREVIEW_MAX_LENGTH).trimEnd()}...` : filenames

  return (
    <div className="min-w-0">
      <dt>{label}</dt>
      <dd className="mt-1">
        <span className="whitespace-normal break-words font-medium text-muted-foreground">{visibleFilenames}</span>
        {canToggle ? (
          <Button
            type="button"
            variant="link"
            size="xs"
            className="mt-1 h-auto px-0 py-0"
            onClick={() => setIsExpanded((currentValue) => !currentValue)}
          >
            {isExpanded ? minimizeLabel : expandLabel}
          </Button>
        ) : null}
      </dd>
    </div>
  )
}

function PatientMetadataField({ emptyValue, label, value }: { emptyValue: string; label: string; value: string }) {
  return (
    <div className="min-w-0 sm:col-span-2">
      <dt>{label}</dt>
      <dd className="mt-1">
        {value === emptyValue ? (
          <span className="font-medium text-muted-foreground">{emptyValue}</span>
        ) : (
          <pre className="overflow-hidden rounded-3xl bg-background p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words">
            {value}
          </pre>
        )}
      </dd>
    </div>
  )
}
