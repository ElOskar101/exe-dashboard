import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  formatExecutionDateTime,
  getStatusBadgeClassName,
  normalizeExecutionStatus,
  type Execution,
  type ExecutionPayloadPatient,
} from '@/features/executions/shared'

interface DetailRowProps {
  label: string
  value: string | number | null | undefined
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-2 text-sm">
      <span className="text-foreground">{label}</span>
      <span className="text-muted-foreground">{value ?? '—'}</span>
    </div>
  )
}

interface DetailSectionProps {
  title: string
  children: ReactNode
}

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <div className="flex min-w-0 flex-col gap-2">{children}</div>
    </div>
  )
}

interface ExecutionDetailPanelProps {
  execution: Execution
}

export function ExecutionDetailPanel({ execution }: ExecutionDetailPanelProps) {
  const { t } = useTranslation('executions')

  const normalizedStatus = normalizeExecutionStatus(execution.status)
  const statusLabel = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
  const statusClassName = getStatusBadgeClassName(execution.status)

  return (
    <div className="h-[calc(100vh-16rem)] min-h-96 overflow-y-auto">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <DetailSection title={t('detail.detailsGeneralSection')}>
            <DetailRow label={t('detail.detailsFieldExecutionId')} value={execution._id} />
            <DetailRow label={t('fields.project')} value={execution.project} />
            <DetailRow label={t('fields.client')} value={execution.client} />
            <DetailRow label={t('fields.clinic')} value={execution.clinic} />
            <DetailRow label={t('fields.execution')} value={execution.execution} />
            <DetailRow label={t('detail.detailsFieldCreatedBy')} value={execution.createdBy} />
            <div className="grid grid-cols-[180px_1fr] gap-2 text-sm">
              <span className="text-foreground">{t('fields.status')}</span>
              <Badge variant="outline" className={statusClassName}>
                {statusLabel}
              </Badge>
            </div>
          </DetailSection>

          <DetailSection title={t('detail.detailsBotSection')}>
            <DetailRow label={t('fields.botName')} value={execution.botName} />
            <DetailRow label={t('fields.url')} value={execution.context?.bot?.targetUrl ?? null} />
            <DetailRow label={t('fields.username')} value={execution.context?.bot?.username ?? null} />
            <DetailRow label={t('fields.password')} value={execution.context?.bot?.password ?? null} />
          </DetailSection>
        </div>

        <Separator />

        <DetailSection title={t('detail.detailsPatientsSection')}>
          {execution.context?.patients && execution.context.patients.length > 0 ? (
            <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
              {execution.context.patients.map((patient, index) => (
                <PatientCard key={index} index={index} patient={patient} executionName={execution.execution} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('list.noPatients')}</p>
          )}
        </DetailSection>

        <Separator />

        <DetailSection title={t('detail.detailsConfigSection')}>
          <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/30 p-4 text-xs">
            {execution.context?.config
              ? JSON.stringify(execution.context.config, null, 2)
              : t('detail.detailsFieldNoConfig')}
          </pre>
        </DetailSection>

        <Separator />

        <DetailSection title={t('detail.detailsTimingSection')}>
          <DetailRow label={t('detail.detailsFieldStartedAt')} value={formatExecutionDateTime(execution.startedAt)} />
          <DetailRow label={t('detail.detailsFieldFinishedAt')} value={formatExecutionDateTime(execution.finishedAt)} />
          <DetailRow label={t('detail.detailsFieldUpdatedAt')} value={formatExecutionDateTime(execution.updatedAt)} />
          <DetailRow
            label={t('fields.scheduledAt')}
            value={execution.scheduledAt ? formatExecutionDateTime(execution.scheduledAt) : null}
          />
        </DetailSection>
      </div>
    </div>
  )
}

function PatientFieldGridItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-foreground">{label}</dt>
      <dd className="mt-1 truncate text-muted-foreground">{value ?? '—'}</dd>
    </div>
  )
}

function PatientCard({
  executionName,
  index,
  patient,
}: {
  executionName: string
  index: number
  patient: ExecutionPayloadPatient
}) {
  const { t } = useTranslation('executions')

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
      <div className="mb-3 text-xs font-medium text-muted-foreground">
        {t('list.patientsDialogTitle', { execution: executionName })} #{index + 1}
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <PatientFieldGridItem label={t('fields.patientName')} value={patient.patientName?.value} />
        <PatientFieldGridItem label={t('fields.patientLastName')} value={patient.patientLastName?.value} />
        <PatientFieldGridItem label={t('fields.memberId')} value={patient.patientMemberId?.value} />
        <PatientFieldGridItem label={t('fields.patientDob')} value={patient.patientDob?.value} />
        <PatientFieldGridItem label={t('fields.policyHolderName')} value={patient.policyHolderName?.value} />
        <PatientFieldGridItem label={t('fields.policyHolderLastName')} value={patient.policyHolderLastName?.value} />
        <PatientFieldGridItem label={t('fields.policyHolderDob')} value={patient.policyHolderDob?.value} />
        <PatientFieldGridItem label={t('fields.relationship')} value={patient.relationship?.value} />
        <PatientFieldGridItem label={t('fields.zipCode')} value={patient.zipCode?.value} />
        {patient.clinic ? (
          <PatientFieldGridItem label={t('fields.patientClinic')} value={patient.clinic.value} />
        ) : null}
        <PatientFieldGridItem label={t('fields.verificationType')} value={patient.verificationType} />
        <PatientFieldGridItem
          label={t('fields.filenames')}
          value={patient.filenames.length > 0 ? patient.filenames.join(', ') : null}
        />
        <PatientFieldGridItem
          label={t('fields.patientOtherInformation')}
          value={
            patient.otherInformation && Object.keys(patient.otherInformation).length > 0
              ? JSON.stringify(patient.otherInformation)
              : null
          }
        />
      </dl>
    </div>
  )
}
