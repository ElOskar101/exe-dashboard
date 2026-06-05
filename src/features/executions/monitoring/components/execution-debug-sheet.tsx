import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { IconBug } from '@tabler/icons-react'
import type { useExecutionRealtimeLogs } from '../hooks/use-execution-realtime-logs'
import { getConnectionBadgeVariant, getStatusTextClassName } from './execution-detail-styles'

interface ExecutionDebugSheetProps {
  connectionState: ReturnType<typeof useExecutionRealtimeLogs>['connectionState']
  currentStatus?: string | null
  rawExecutionJson: string
}

export function ExecutionDebugSheet({ connectionState, currentStatus, rawExecutionJson }: ExecutionDebugSheetProps) {
  const { t } = useTranslation('executions')
  const debugButtonLabel = t('detail.debugButton')

  return (
    <Sheet>
      <SheetTrigger
        aria-label={debugButtonLabel}
        render={<Button type="button" variant="outline" size="icon" title={debugButtonLabel} />}
      >
        <IconBug aria-hidden="true" />
        <span className="sr-only">{debugButtonLabel}</span>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t('detail.debugTitle')}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <DebugField label={t('detail.debugFields.status')}>
              <span
                className={cn(
                  'inline-flex max-w-full items-center truncate text-sm font-medium',
                  getStatusTextClassName(currentStatus),
                )}
              >
                {currentStatus ?? t('detail.statusUnknown')}
              </span>
            </DebugField>
            <DebugField label={t('detail.debugFields.connection')}>
              <Badge
                variant={getConnectionBadgeVariant(connectionState)}
                className="max-w-full justify-center truncate"
              >
                {t(`detail.connection.${connectionState}`)}
              </Badge>
            </DebugField>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">{t('detail.rawExecutionTitle')}</h3>
              <pre className="max-h-[20lh] overflow-auto rounded-2xl bg-muted/70 p-4 text-xs leading-6">
                {rawExecutionJson}
              </pre>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DebugField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-2xl border bg-muted/30 p-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
