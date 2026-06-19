import { useMemo, useState, type MouseEvent } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { IconPlayerPlay } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import type { ExecutionScheduleMode } from '@/features/executions/creation/model/execution-create'
import type { ExecutionRerunSummary } from '../lib/execution-rerun'

interface ExecutionRerunScheduleOption {
  scheduledAt: string
}

interface ExecutionRerunDialogProps {
  currentStatus?: string | null
  isRerunAvailable: boolean
  isRerunning: boolean
  missingRerunFields: string[]
  onConfirm: (scheduleOption?: ExecutionRerunScheduleOption) => void
  rerunSummary: ExecutionRerunSummary
}

export function ExecutionRerunDialog({
  currentStatus,
  isRerunAvailable,
  isRerunning,
  missingRerunFields,
  onConfirm,
  rerunSummary,
}: ExecutionRerunDialogProps) {
  const { t } = useTranslation('executions')
  const emptyValue = t('detail.debugEmptyValue')
  const [scheduleMode, setScheduleMode] = useState<ExecutionScheduleMode>('instant')
  const [scheduledAt, setScheduledAt] = useState('')
  const scheduledAtError = useMemo(() => {
    if (scheduleMode !== 'scheduled') return null
    if (!scheduledAt.trim()) return t('validation.required')
    if (!isFutureDateTimeLocalValue(scheduledAt)) return t('validation.futureDateTime')

    return null
  }, [scheduleMode, scheduledAt, t])
  const isConfirmDisabled =
    isRerunning || !isRerunAvailable || (scheduleMode === 'scheduled' && Boolean(scheduledAtError))
  const [isOpen, setIsOpen] = useState(false)
  const handleOpenChange = (open: boolean) => {
    if (!open && isRerunning) return

    setIsOpen(open)
  }
  const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isRerunning) {
      event.preventDefault()
      return
    }

    setScheduleMode('instant')
    setScheduledAt('')
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        onClick={handleTriggerClick}
        render={<Button variant="outline" disabled={isRerunning} type="button" />}
      >
        {isRerunning ? <Spinner data-icon="inline-start" /> : <IconPlayerPlay data-icon="inline-start" />}
        {isRerunning ? t('detail.rerunning') : t('detail.rerunExecution')}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:!max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('detail.rerunTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {isRerunAvailable ? t('detail.rerunDescription') : t('detail.rerunUnavailableDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4">
          <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
            <p className="text-sm font-medium">{t('detail.rerunSummaryTitle')}</p>
            <div className="mt-3 max-h-[18rem] overflow-auto pr-2">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <SummaryField emptyValue={emptyValue} label={t('fields.project')} value={rerunSummary.project} />
                <SummaryField emptyValue={emptyValue} label={t('fields.botName')} value={rerunSummary.botName} />
                <SummaryField emptyValue={emptyValue} label={t('fields.client')} value={rerunSummary.client} />
                <SummaryField emptyValue={emptyValue} label={t('fields.clinic')} value={rerunSummary.clinic} />
                <SummaryField emptyValue={emptyValue} label={t('fields.execution')} value={rerunSummary.execution} />
                <SummaryField
                  emptyValue={emptyValue}
                  label={t('detail.rerunSummaryFields.status')}
                  value={currentStatus}
                />
                <SummaryField
                  emptyValue={emptyValue}
                  label={t('detail.rerunSummaryFields.patientCount')}
                  value={String(rerunSummary.patientCount)}
                />
                <SummaryField
                  emptyValue={emptyValue}
                  label={t('fields.workers')}
                  value={String(rerunSummary.workers)}
                />
                <SummaryField
                  emptyValue={emptyValue}
                  label={t('fields.retries')}
                  value={String(rerunSummary.retries)}
                />
              </dl>
            </div>
          </div>
          <FieldSet>
            <FieldGroup className="md:grid md:grid-cols-2">
              <Field>
                <FieldLabel>{t('fields.scheduleMode')}</FieldLabel>
                <ToggleGroup
                  value={[scheduleMode]}
                  onValueChange={(value) => {
                    const nextMode = value[0]

                    if (nextMode === 'instant' || nextMode === 'scheduled') {
                      setScheduleMode(nextMode)
                    }
                  }}
                  variant="outline"
                  spacing={0}
                  className="w-full max-w-sm"
                >
                  <ToggleGroupItem value="instant" className="flex-1">
                    {t('options.scheduleInstant')}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="scheduled" className="flex-1">
                    {t('options.scheduleScheduled')}
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>
              <Field
                data-disabled={scheduleMode === 'instant' ? true : undefined}
                data-invalid={Boolean(scheduledAtError)}
              >
                <FieldLabel htmlFor="rerunScheduledAt">{t('fields.scheduledAt')}</FieldLabel>
                <Input
                  id="rerunScheduledAt"
                  type="datetime-local"
                  step="60"
                  disabled={scheduleMode === 'instant'}
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  aria-invalid={Boolean(scheduledAtError)}
                />
                <FieldError>{scheduledAtError}</FieldError>
              </Field>
            </FieldGroup>
          </FieldSet>
          {!isRerunAvailable && missingRerunFields.length > 0 ? (
            <Alert variant="destructive">
              <AlertTitle>{t('detail.rerunMissingFieldsTitle')}</AlertTitle>
              <AlertDescription>
                <p>{t('detail.rerunMissingFieldsDescription')}</p>
                <ul className="mt-2 list-disc pl-5">
                  {missingRerunFields.map((field) => (
                    <li key={field}>
                      <code>{field}</code>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRerunning}>{t('detail.cancelRerun')}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isConfirmDisabled}
            onClick={() => {
              if (scheduleMode === 'scheduled') {
                onConfirm({ scheduledAt })
                return
              }

              onConfirm()
            }}
          >
            {isRerunning ? <Spinner data-icon="inline-start" /> : null}
            {isRerunning ? t('detail.rerunning') : t('detail.confirmRerun')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function SummaryField({
  emptyValue,
  label,
  value,
}: {
  emptyValue: string
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate font-medium">{value || emptyValue}</dd>
    </div>
  )
}

const isFutureDateTimeLocalValue = (value: string) => {
  const scheduledAt = new Date(value)

  return !Number.isNaN(scheduledAt.getTime()) && scheduledAt.getTime() > Date.now()
}
