import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { IconLoader2, IconPlayerStop, IconTerminal2 } from '@tabler/icons-react'
import type { useExecutionRealtimeLogs } from '../../hooks/use-execution-realtime-logs'
import type { ExecutionLogLine } from '../../lib/execution-log-buffer'
import { getStatusBadgeVariant } from './execution-detail-badges'
import { ExecutionDebugSheet } from './execution-debug-sheet'
import { ExecutionLogList } from './execution-log-list'

interface ExecutionLogsCardProps {
  canStopExecution: boolean
  connectionState: ReturnType<typeof useExecutionRealtimeLogs>['connectionState']
  currentStatus?: string | null
  isLoading: boolean
  isStopping: boolean
  logLines: ExecutionLogLine[]
  onStopExecution: () => void
  partial: string
  rawExecutionJson: string
}

export function ExecutionLogsCard({
  canStopExecution,
  connectionState,
  currentStatus,
  isLoading,
  isStopping,
  logLines,
  onStopExecution,
  partial,
  rawExecutionJson,
}: ExecutionLogsCardProps) {
  const { t } = useTranslation('executions')

  return (
    <Card className="min-h-0 flex-1">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2">
              <IconTerminal2 />
              {t('detail.logsTitle')}
              <div>
                <Badge variant={getStatusBadgeVariant(currentStatus)}>
                  {currentStatus ?? t('detail.statusUnknown')}
                </Badge>
              </div>
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExecutionDebugSheet
              connectionState={connectionState}
              currentStatus={currentStatus}
              logLineCount={logLines.length}
              partial={partial}
              rawExecutionJson={rawExecutionJson}
            />
            {canStopExecution ? (
              <Button variant="destructive" disabled={isStopping} onClick={onStopExecution}>
                {isStopping ? (
                  <IconLoader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <IconPlayerStop data-icon="inline-start" />
                )}
                {isStopping ? t('detail.stopping') : t('detail.stopExecution')}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        <ScrollArea className="h-full min-h-96 rounded-2xl border border-border">
          <div className="p-4">
            <ExecutionLogList isLoading={isLoading} logLines={logLines} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
