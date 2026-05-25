import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IconLoader2, IconPlayerStop, IconTerminal2 } from '@tabler/icons-react'
import type { useExecutionRealtimeLogs } from '../../hooks/use-execution-realtime-logs'
import type { ExecutionLogLine } from '../../lib/execution-log-buffer'
import { getStatusBadgeVariant } from './execution-detail-badges'
import { ExecutionDebugSheet } from './execution-debug-sheet'
import { ExecutionLogList } from './execution-log-list'
import { ExecutionReportPanel } from './execution-report-panel'

interface ExecutionLogsCardProps {
  canStopExecution: boolean
  connectionState: ReturnType<typeof useExecutionRealtimeLogs>['connectionState']
  currentStatus?: string | null
  isLoading: boolean
  isReportError: boolean
  isReportLoading: boolean
  isStopping: boolean
  logLines: ExecutionLogLine[]
  onStopExecution: () => void
  rawExecutionJson: string
  reportHtml?: string
  showReport: boolean
}

export function ExecutionLogsCard({
  canStopExecution,
  connectionState,
  currentStatus,
  isLoading,
  isReportError,
  isReportLoading,
  isStopping,
  logLines,
  onStopExecution,
  rawExecutionJson,
  reportHtml,
  showReport,
}: ExecutionLogsCardProps) {
  const { t } = useTranslation('executions')
  const isStatusLoading = isLoading && currentStatus == null

  return (
    <Card className="min-h-0 flex-1">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2">
              <IconTerminal2 />
              {t('detail.logsTitle')}
              {isStatusLoading ? (
                <Skeleton aria-hidden="true" className="h-6 w-24 rounded-full" />
              ) : (
                <Badge variant={getStatusBadgeVariant(currentStatus)}>
                  {currentStatus ?? t('detail.statusUnknown')}
                </Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExecutionDebugSheet
              connectionState={connectionState}
              currentStatus={currentStatus}
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
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <Tabs defaultValue="logs" className="min-h-0 flex-1">
          <TabsList variant="line" aria-label={t('detail.contentTabsLabel')}>
            <TabsTrigger value="logs">{t('detail.historyTab')}</TabsTrigger>
            <TabsTrigger value="report" disabled={!showReport}>
              {t('detail.reportTab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="logs" className="min-h-0">
            <ScrollArea className="h-[calc(100vh-16rem)] min-h-96 rounded-2xl border border-border">
              <div className="p-4">
                <ExecutionLogList isLoading={isLoading} logLines={logLines} />
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="report" className="min-h-0">
            <ExecutionReportPanel isError={isReportError} isLoading={isReportLoading} reportHtml={reportHtml} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
