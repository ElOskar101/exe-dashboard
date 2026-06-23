import { Fragment, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  formatExecutionDateTime,
  getStatusBadgeClassName,
  normalizeExecutionStatus,
  type Execution,
  type ExecutionPayloadPatient,
} from '@/features/executions/shared'
import { cn } from '@/lib/utils'
import { IconEye } from '@tabler/icons-react'

const DETAILS_PANEL_HEIGHT_CLASS_NAME = 'h-[calc(100vh-16rem)] min-h-96'

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
  title?: string
  children: ReactNode
}

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {title ? <h3 className="text-sm font-medium text-foreground">{title}</h3> : null}
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
    <div className={cn(DETAILS_PANEL_HEIGHT_CLASS_NAME, 'min-w-0')}>
      <Tabs defaultValue="overview" className="min-h-0 min-w-0">
        <TabsList variant="line" aria-label={t('detail.detailsTabsLabel')} className="max-w-full overflow-x-auto">
          <TabsTrigger value="overview">{t('detail.detailsOverviewTab')}</TabsTrigger>
          <TabsTrigger value="patients">{t('detail.detailsPatientsSection')}</TabsTrigger>
          <TabsTrigger value="config">{t('detail.detailsConfigSection')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="min-h-0 min-w-0">
          <div className="grid min-w-0 gap-6 overflow-y-auto py-1 lg:grid-cols-2">
            <DetailSection>
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

            <div className="flex min-w-0 flex-col gap-6">
              <DetailSection>
                <DetailRow label={t('fields.botName')} value={execution.botName} />
                <DetailRow label={t('fields.url')} value={execution.context?.bot?.targetUrl ?? null} />
                <DetailRow label={t('fields.username')} value={execution.context?.bot?.username ?? null} />
                <DetailRow label={t('fields.password')} value={execution.context?.bot?.password ?? null} />
              </DetailSection>

              <DetailSection>
                <DetailRow
                  label={t('detail.detailsFieldStartedAt')}
                  value={formatExecutionDateTime(execution.startedAt)}
                />
                <DetailRow
                  label={t('detail.detailsFieldFinishedAt')}
                  value={formatExecutionDateTime(execution.finishedAt)}
                />
                <DetailRow
                  label={t('detail.detailsFieldUpdatedAt')}
                  value={formatExecutionDateTime(execution.updatedAt)}
                />
                <DetailRow
                  label={t('fields.scheduledAt')}
                  value={execution.scheduledAt ? formatExecutionDateTime(execution.scheduledAt) : null}
                />
              </DetailSection>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="patients" className="min-h-0 min-w-0">
          <PatientsTable execution={execution} />
        </TabsContent>

        <TabsContent value="config" className="min-h-0 min-w-0">
          <pre className="max-h-[calc(100vh-20rem)] overflow-auto rounded-lg border border-border bg-muted/30 p-4 text-xs">
            {execution.context?.config
              ? JSON.stringify(execution.context.config, null, 2)
              : t('detail.detailsFieldNoConfig')}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PatientFieldGridItem({
  isWide,
  label,
  value,
}: {
  isWide?: boolean
  label: string
  value: string | null | undefined
}) {
  return (
    <div className={cn('min-w-0', isWide && 'sm:col-span-2')}>
      <dt className="text-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{value ?? '—'}</dd>
    </div>
  )
}

function PatientsTable({ execution }: { execution: Execution }) {
  const { t } = useTranslation('executions')
  const patients = execution.context?.patients ?? []

  if (patients.length === 0) {
    return (
      <div
        className={cn(
          DETAILS_PANEL_HEIGHT_CLASS_NAME,
          'flex items-center justify-center rounded-lg border border-dashed',
        )}
      >
        <p className="text-sm text-muted-foreground">{t('list.noPatients')}</p>
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-lg border border-border">
      <Table className="table-auto">
        <TableHeader>
          <TableRow>
            <TableHead>{t('detail.patientColumns.patient')}</TableHead>
            <TableHead>{t('detail.patientColumns.dob')}</TableHead>
            <TableHead>{t('detail.patientColumns.memberId')}</TableHead>
            <TableHead>{t('detail.patientColumns.policyHolder')}</TableHead>
            <TableHead>{t('detail.patientColumns.policyHolderDob')}</TableHead>
            <TableHead>{t('detail.patientColumns.verificationType')}</TableHead>
            <TableHead>{t('detail.patientColumns.relationship')}</TableHead>
            <TableHead className="w-12 text-right">{t('detail.patientColumns.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient, index) => (
            <TableRow key={patient.id ?? `${execution._id}-patient-${index}`}>
              <TableCell className="whitespace-normal break-words">
                {[patient.patientName.value, patient.patientLastName.value].filter(Boolean).join(' ') ||
                  t('list.emptyValue')}
              </TableCell>
              <TableCell className="whitespace-nowrap">{patient.patientDob.value || t('list.emptyValue')}</TableCell>
              <TableCell className="whitespace-normal break-words">
                {patient.patientMemberId.value || t('list.emptyValue')}
              </TableCell>
              <TableCell className="whitespace-normal break-words">
                {[patient.policyHolderName.value, patient.policyHolderLastName.value].filter(Boolean).join(' ') ||
                  t('list.emptyValue')}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {patient.policyHolderDob.value || t('list.emptyValue')}
              </TableCell>
              <TableCell className="whitespace-nowrap">{patient.verificationType || t('list.emptyValue')}</TableCell>
              <TableCell className="whitespace-normal break-words">
                {patient.relationship.value || t('list.emptyValue')}
              </TableCell>
              <TableCell className="text-right">
                <PatientDetailsDialog patient={patient} patientIndex={index} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PatientDetailsDialog({ patient, patientIndex }: { patient: ExecutionPayloadPatient; patientIndex: number }) {
  const { t } = useTranslation('executions')
  const titleRef = useRef<HTMLHeadingElement>(null)
  const patientLabel =
    [patient.patientName.value, patient.patientLastName.value].filter(Boolean).join(' ') ||
    t('detail.patientFallbackName', { index: patientIndex + 1 })
  const patientOtherInformation = patient.otherInformation ?? {}

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label={t('detail.patientDetailsActionLabel', { patient: patientLabel })}
          />
        }
      >
        <IconEye />
      </DialogTrigger>
      <DialogContent initialFocus={titleRef} className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle ref={titleRef} tabIndex={-1}>
            {t('detail.patientDetailsTitle', { patient: patientLabel })}
          </DialogTitle>
          <DialogDescription>{t('detail.patientDetailsDescription')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100vh-16rem)]" viewportProps={{ className: 'max-h-[calc(100vh-16rem)]' }}>
          <div className="flex flex-col gap-6 p-1 pr-3">
            <PatientDetailGroup title={t('detail.patientDetailsPatientSection')}>
              <PatientFieldGridItem label={t('fields.patientName')} value={patient.patientName.value} />
              <PatientFieldGridItem label={t('fields.patientLastName')} value={patient.patientLastName.value} />
              <PatientFieldGridItem label={t('fields.patientDob')} value={patient.patientDob.value} />
              <PatientFieldGridItem label={t('fields.memberId')} value={patient.patientMemberId.value} />
            </PatientDetailGroup>
            <PatientDetailGroup title={t('detail.patientDetailsPolicyHolderSection')}>
              <PatientFieldGridItem label={t('fields.policyHolderName')} value={patient.policyHolderName.value} />
              <PatientFieldGridItem
                label={t('fields.policyHolderLastName')}
                value={patient.policyHolderLastName.value}
              />
              <PatientFieldGridItem label={t('fields.policyHolderDob')} value={patient.policyHolderDob.value} />
              <PatientFieldGridItem label={t('fields.relationship')} value={patient.relationship.value} />
            </PatientDetailGroup>
            <PatientDetailGroup title={t('detail.patientDetailsCoverageSection')}>
              <PatientFieldGridItem label={t('fields.zipCode')} value={patient.zipCode.value} />
              {patient.clinic ? (
                <PatientFieldGridItem label={t('fields.patientClinic')} value={patient.clinic.value} />
              ) : null}
              <PatientFieldGridItem label={t('fields.verificationType')} value={patient.verificationType} />
            </PatientDetailGroup>
            <PatientDetailGroup title={t('detail.patientDetailsFilesSection')}>
              <PatientFieldGridItem
                label={t('fields.filenames')}
                value={patient.filenames.length > 0 ? patient.filenames.join(', ') : null}
              />
              <PatientFieldGridItem
                label={t('fields.patientOtherInformation')}
                value={
                  Object.keys(patientOtherInformation).length > 0
                    ? JSON.stringify(patientOtherInformation, null, 2)
                    : null
                }
                isWide
              />
            </PatientDetailGroup>
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {t('detail.closePatientDetails')}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PatientDetailGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <dl className="grid gap-3 sm:grid-cols-2">
        {Array.isArray(children) ? children.map((child, index) => <Fragment key={index}>{child}</Fragment>) : children}
      </dl>
    </section>
  )
}
