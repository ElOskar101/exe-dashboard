import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { IconBug } from '@tabler/icons-react'
import type { useExecutionRealtimeLogs } from '../../hooks/use-execution-realtime-logs'
import { getConnectionBadgeVariant, getStatusBadgeVariant } from './execution-detail-badges'

interface ExecutionDebugSheetProps {
  connectionState: ReturnType<typeof useExecutionRealtimeLogs>['connectionState']
  currentStatus?: string | null
  rawExecutionJson: string
}

export function ExecutionDebugSheet({ connectionState, currentStatus, rawExecutionJson }: ExecutionDebugSheetProps) {
  const { t } = useTranslation('executions')

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <IconBug data-icon="inline-start" />
        {t('detail.debugButton')}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t('detail.debugTitle')}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <DebugField label={t('detail.debugFields.status')}>
              <Badge variant={getStatusBadgeVariant(currentStatus)} className="max-w-full justify-center truncate">
                {currentStatus ?? t('detail.statusUnknown')}
              </Badge>
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
