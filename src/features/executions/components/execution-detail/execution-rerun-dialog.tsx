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
import { IconLoader2, IconPlayerPlay } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import type { ExecutionRerunSummary } from '../../lib/execution-rerun'

interface ExecutionRerunDialogProps {
  currentStatus?: string | null
  isRerunAvailable: boolean
  isRerunning: boolean
  missingRerunFields: string[]
  onConfirm: () => void
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

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" disabled={isRerunning} type="button" />}>
        {isRerunning ? (
          <IconLoader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <IconPlayerPlay data-icon="inline-start" />
        )}
        {isRerunning ? t('detail.rerunning') : t('detail.rerunExecution')}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('detail.rerunTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {isRerunAvailable ? t('detail.rerunDescription') : t('detail.rerunUnavailableDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4">
          <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
            <p className="text-sm font-medium">{t('detail.rerunSummaryTitle')}</p>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
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
              <SummaryField emptyValue={emptyValue} label={t('fields.workers')} value={String(rerunSummary.workers)} />
              <SummaryField emptyValue={emptyValue} label={t('fields.retries')} value={String(rerunSummary.retries)} />
            </dl>
          </div>
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
          <AlertDialogAction disabled={isRerunning || !isRerunAvailable} onClick={onConfirm}>
            {isRerunning ? <IconLoader2 className="animate-spin" data-icon="inline-start" /> : null}
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
