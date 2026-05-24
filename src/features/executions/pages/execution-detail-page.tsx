import { useMemo, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  IconAlertCircle,
  IconBug,
  IconCircleDashed,
  IconLoader2,
  IconPlayerStop,
  IconTerminal2,
} from '@tabler/icons-react'
import { getExecutionById, stopExecution } from '../services/execution.service'
import { createExecutionLogLinesFromHistory } from '../lib/execution-log-buffer'
import { formatExecutionDateTime } from '../lib/format-execution-date'
import { useExecutionRealtimeLogs } from '../hooks/use-execution-realtime-logs'
import { isExecutionRunning } from '../lib/execution-display'

type BadgeVariant = ComponentProps<typeof Badge>['variant']

const getStatusBadgeVariant = (status?: string | null): BadgeVariant => {
  const normalizedStatus = status?.toLowerCase()

  if (!normalizedStatus) return 'outline'
  if (['completed', 'complete', 'success', 'succeeded'].includes(normalizedStatus)) {
    return 'default'
  }
  if (['failed', 'error', 'cancelled', 'canceled'].includes(normalizedStatus)) {
    return 'destructive'
  }

  return 'secondary'
}

const getConnectionBadgeVariant = (
  connectionState: ReturnType<typeof useExecutionRealtimeLogs>['connectionState'],
): BadgeVariant => {
  if (connectionState === 'connected') return 'default'
  if (connectionState === 'connecting') return 'secondary'

  return 'outline'
}

function ExecutionDetailPageContent({ executionId }: { executionId: string }) {
  const { t } = useTranslation('executions')
  const queryClient = useQueryClient()
  const realtimeLogs = useExecutionRealtimeLogs(executionId)
  const executionQuery = useQuery({
    queryKey: ['execution', executionId],
    queryFn: async () => {
      const response = await getExecutionById(executionId)

      return response.data
    },
  })
  const stopMutation = useMutation({
    mutationFn: stopExecution,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['execution', executionId] }),
        queryClient.invalidateQueries({ queryKey: ['executions'] }),
      ])
    },
  })
  const executionLogs = executionQuery.data?.logs
  const fallbackLines = useMemo(
    () => (executionLogs ? createExecutionLogLinesFromHistory(executionLogs).lines : []),
    [executionLogs],
  )
  const logLines = realtimeLogs.lines.length > 0 ? realtimeLogs.lines : fallbackLines
  const currentStatus = realtimeLogs.status ?? executionQuery.data?.status
  const canStopExecution = isExecutionRunning(currentStatus)
  const rawExecutionJson = useMemo(() => JSON.stringify(executionQuery.data ?? null, null, 2), [executionQuery.data])

  return (
    <div className="flex flex-col gap-6 py-6">
      {executionQuery.isError ? (
        <Alert>
          <IconAlertCircle />
          <AlertTitle>{t('detail.loadErrorTitle')}</AlertTitle>
          <AlertDescription>{t('detail.loadErrorDescription')}</AlertDescription>
        </Alert>
      ) : null}

      {stopMutation.isError ? (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertTitle>{t('detail.stopErrorTitle')}</AlertTitle>
          <AlertDescription>{t('detail.stopErrorDescription')}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2">
                <IconTerminal2 />
                {t('detail.logsTitle')}
              </CardTitle>
              <CardDescription>{t('detail.logsDescription')}</CardDescription>
              <div>
                <Badge variant={getStatusBadgeVariant(currentStatus)}>
                  {currentStatus ?? t('detail.statusUnknown')}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                      <div className="flex min-w-0 flex-col gap-2 rounded-2xl border bg-muted/30 p-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t('detail.debugFields.status')}
                        </span>
                        <Badge
                          variant={getStatusBadgeVariant(currentStatus)}
                          className="max-w-full justify-center truncate"
                        >
                          {currentStatus ?? t('detail.statusUnknown')}
                        </Badge>
                      </div>
                      <div className="flex min-w-0 flex-col gap-2 rounded-2xl border bg-muted/30 p-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t('detail.debugFields.connection')}
                        </span>
                        <Badge
                          variant={getConnectionBadgeVariant(realtimeLogs.connectionState)}
                          className="max-w-full justify-center truncate"
                        >
                          {t(`detail.connection.${realtimeLogs.connectionState}`)}
                        </Badge>
                      </div>
                      <div className="flex min-w-0 flex-col gap-2 rounded-2xl border bg-muted/30 p-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t('detail.debugFields.logLines')}
                        </span>
                        <Badge variant="outline" className="max-w-full justify-center truncate">
                          {logLines.length}
                        </Badge>
                      </div>
                      <div className="flex min-w-0 flex-col gap-2 rounded-2xl border bg-muted/30 p-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t('detail.debugFields.partialChunk')}
                        </span>
                        <Badge
                          variant={realtimeLogs.partial ? 'secondary' : 'outline'}
                          className="max-w-full justify-center truncate"
                        >
                          {realtimeLogs.partial || t('detail.debugEmptyValue')}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <h3 className="font-medium">{t('detail.rawExecutionTitle')}</h3>
                        <pre className="max-h-96 overflow-auto rounded-2xl bg-muted/70 p-4 text-xs leading-6">
                          {rawExecutionJson}
                        </pre>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              {canStopExecution ? (
                <Button
                  variant="destructive"
                  disabled={stopMutation.isPending}
                  onClick={() => stopMutation.mutate(executionId)}
                >
                  {stopMutation.isPending ? (
                    <IconLoader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <IconPlayerStop data-icon="inline-start" />
                  )}
                  {stopMutation.isPending ? t('detail.stopping') : t('detail.stopExecution')}
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-22rem)] min-h-96 rounded-2xl border border-border">
            <div className="p-4">
              {logLines.length > 0 ? (
                <ItemGroup>
                  {logLines.map((line) => (
                    <Item key={line.id} variant="outline" size="sm">
                      <ItemContent>
                        <ItemTitle className="line-clamp-none break-all font-mono">
                          {line.message || t('detail.emptyLine')}
                        </ItemTitle>
                        {line.timestamp ? (
                          <ItemDescription>{formatExecutionDateTime(line.timestamp)}</ItemDescription>
                        ) : null}
                      </ItemContent>
                      {line.stream ? (
                        <ItemActions>
                          <Badge variant="outline">{line.stream}</Badge>
                        </ItemActions>
                      ) : null}
                    </Item>
                  ))}
                </ItemGroup>
              ) : (
                <Item variant="muted">
                  <ItemContent>
                    <ItemTitle>{t('detail.noLogsTitle')}</ItemTitle>
                    <ItemDescription>{t('detail.noLogsDescription')}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    {executionQuery.isLoading ? <IconLoader2 className="animate-spin" /> : <IconCircleDashed />}
                  </ItemActions>
                </Item>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ExecutionDetailPage() {
  const { id } = useParams()

  if (!id) {
    return (
      <div className="py-6">
        <Alert>
          <IconAlertCircle />
          <AlertTitle>Execution id is required</AlertTitle>
        </Alert>
      </div>
    )
  }

  return <ExecutionDetailPageContent key={id} executionId={id} />
}
