import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  formatExecutionDateTime,
  getStatusBadgeClassName,
  normalizeExecutionStatus,
  type Execution,
} from '@/features/executions/shared'

interface DetailRowProps {
  label: string
  value: string | number | null | undefined
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value ?? '—'}</span>
    </div>
  )
}

interface DetailSectionProps {
  title: string
  children: ReactNode
}

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
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
    <div className="h-[calc(100vh-16rem)] min-h-96 overflow-y-auto rounded-2xl border border-border bg-background p-6">
      <div className="flex min-w-0 flex-col gap-6">
        <DetailSection title={t('detail.detailsGeneralSection')}>
          <DetailRow label={t('detail.detailsFieldExecutionId')} value={execution._id} />
          <DetailRow label={t('fields.project')} value={execution.project} />
          <DetailRow label={t('fields.client')} value={execution.client} />
          <DetailRow label={t('fields.clinic')} value={execution.clinic} />
          <DetailRow label={t('fields.execution')} value={execution.execution} />
          <DetailRow label={t('detail.detailsFieldCreatedBy')} value={execution.createdBy} />
          <div className="grid grid-cols-[180px_1fr] gap-2 text-sm">
            <span className="text-muted-foreground">{t('fields.status')}</span>
            <Badge variant="outline" className={statusClassName}>
              {statusLabel}
            </Badge>
          </div>
        </DetailSection>

        <Separator />

        <DetailSection title={t('detail.detailsBotSection')}>
          <DetailRow label={t('fields.botName')} value={execution.botName} />
          <DetailRow label={t('fields.url')} value={execution.context?.bot?.targetUrl ?? null} />
          <DetailRow label={t('fields.username')} value={execution.context?.bot?.username ?? null} />
        </DetailSection>

        <Separator />

        <DetailSection title={t('detail.detailsPatientsSection')}>
          {execution.context?.patients && execution.context.patients.length > 0 ? (
            <div className="max-h-80 space-y-3 overflow-y-auto">
              {execution.context.patients.map((patient, index) => (
                <div key={index} className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    {t('list.patientsDialogTitle', { execution: execution.execution })} #{index + 1}
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-x-2 gap-y-1">
                    <span className="text-muted-foreground">{t('fields.patientName')}</span>
                    <span>{patient.patientName?.value ?? '—'}</span>
                    <span className="text-muted-foreground">{t('fields.patientLastName')}</span>
                    <span>{patient.patientLastName?.value ?? '—'}</span>
                    <span className="text-muted-foreground">{t('fields.memberId')}</span>
                    <span>{patient.patientMemberId?.value ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('list.noPatients')}</p>
          )}
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

        <Separator />

        <DetailSection title={t('detail.detailsConfigSection')}>
          <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted p-4 text-xs">
            {execution.context?.config
              ? JSON.stringify(execution.context.config, null, 2)
              : t('detail.detailsFieldNoConfig')}
          </pre>
        </DetailSection>
      </div>
    </div>
  )
}
