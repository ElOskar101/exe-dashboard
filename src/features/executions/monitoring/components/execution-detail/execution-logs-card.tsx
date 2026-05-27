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
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEventHandler,
  type TouchEventHandler,
  type UIEventHandler,
  type WheelEventHandler,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isExecutionRunning } from '@/features/executions/shared'
import { IconArrowDown, IconLoader2, IconPlayerStop, IconTerminal2 } from '@tabler/icons-react'
import type { useExecutionRealtimeLogs } from '../../hooks/use-execution-realtime-logs'
import type { ExecutionLogLine } from '../../lib/execution-log-buffer'
import type { ExecutionRerunSummary } from '../../lib/execution-rerun'
import { getStatusBadgeClassName, getStatusBadgeVariant } from './execution-badge-styles'
import { ExecutionDebugSheet } from './execution-debug-sheet'
import { ExecutionLogList } from './execution-log-list'
import { ExecutionRerunDialog } from './execution-rerun-dialog'
import { ExecutionReportPanel } from './execution-report-panel'

const LOG_SCROLL_BOTTOM_THRESHOLD = 24

const getCanScrollToBottom = (viewport: HTMLDivElement) =>
  viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > LOG_SCROLL_BOTTOM_THRESHOLD

const getIsScrolledToBottom = (viewport: HTMLDivElement) =>
  viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= LOG_SCROLL_BOTTOM_THRESHOLD

type LogScrollBehavior = 'auto' | 'smooth'

interface UpdateLogScrollStateOptions {
  syncPinnedToViewport?: boolean
}

const useExecutionLogScroll = (contentVersion: string) => {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const isPinnedToBottomRef = useRef(true)
  const isUserScrollIntentRef = useRef(false)
  const userScrollIntentAnimationFrameRef = useRef<number | null>(null)
  const lastScrollTopRef = useRef(0)
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null)
  const [canScrollToBottom, setCanScrollToBottom] = useState(false)

  const updateCanScrollToBottom = useCallback((nextValue: boolean) => {
    setCanScrollToBottom((previousValue) => (previousValue === nextValue ? previousValue : nextValue))
  }, [])

  const updateScrollState = useCallback(
    (nextViewport = viewportRef.current, options: UpdateLogScrollStateOptions = {}) => {
      if (!nextViewport) {
        updateCanScrollToBottom(false)
        return
      }

      const isScrolledToBottom = getIsScrolledToBottom(nextViewport)

      if (options.syncPinnedToViewport ?? true) {
        isPinnedToBottomRef.current = isScrolledToBottom
      }

      updateCanScrollToBottom(isPinnedToBottomRef.current ? false : getCanScrollToBottom(nextViewport))
      lastScrollTopRef.current = nextViewport.scrollTop
    },
    [updateCanScrollToBottom],
  )

  const scrollToBottom = useCallback(
    (behavior: LogScrollBehavior = 'smooth') => {
      const nextViewport = viewportRef.current

      if (!nextViewport) return

      isPinnedToBottomRef.current = true
      updateCanScrollToBottom(false)
      nextViewport.scrollTo({ top: nextViewport.scrollHeight, behavior })
      window.requestAnimationFrame(() => updateScrollState(nextViewport))
    },
    [updateCanScrollToBottom, updateScrollState],
  )

  const clearUserScrollIntent = useCallback(() => {
    if (userScrollIntentAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(userScrollIntentAnimationFrameRef.current)
      userScrollIntentAnimationFrameRef.current = null
    }

    isUserScrollIntentRef.current = false
  }, [])

  const markUserScrollIntent = useCallback(() => {
    isUserScrollIntentRef.current = true

    if (userScrollIntentAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(userScrollIntentAnimationFrameRef.current)
    }

    userScrollIntentAnimationFrameRef.current = window.requestAnimationFrame(() => {
      isUserScrollIntentRef.current = false
      userScrollIntentAnimationFrameRef.current = null
    })
  }, [])

  const handleViewportRef = useCallback(
    (nextViewport: HTMLDivElement | null) => {
      viewportRef.current = nextViewport
      setViewport(nextViewport)

      if (!nextViewport) return

      window.requestAnimationFrame(() => {
        scrollToBottom('auto')
      })
    },
    [scrollToBottom],
  )

  const handleScroll: UIEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      const nextViewport = event.currentTarget
      const isScrolledToBottom = getIsScrolledToBottom(nextViewport)
      const didScrollUp = nextViewport.scrollTop < lastScrollTopRef.current
      const shouldSyncPinnedToViewport = isUserScrollIntentRef.current || didScrollUp || isScrolledToBottom

      if (shouldSyncPinnedToViewport) {
        isPinnedToBottomRef.current = isScrolledToBottom
      }

      clearUserScrollIntent()
      updateCanScrollToBottom(isPinnedToBottomRef.current ? false : getCanScrollToBottom(nextViewport))
      lastScrollTopRef.current = nextViewport.scrollTop
    },
    [clearUserScrollIntent, updateCanScrollToBottom],
  )

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', 'Space'].includes(event.key)) {
        markUserScrollIntent()
      }
    },
    [markUserScrollIntent],
  )

  const handleTouchMove: TouchEventHandler<HTMLDivElement> = useCallback(() => {
    markUserScrollIntent()
  }, [markUserScrollIntent])

  const handleWheel: WheelEventHandler<HTMLDivElement> = useCallback(() => {
    markUserScrollIntent()
  }, [markUserScrollIntent])

  useLayoutEffect(() => {
    const nextViewport = viewportRef.current

    if (!nextViewport) return

    if (isPinnedToBottomRef.current) {
      nextViewport.scrollTo({ top: nextViewport.scrollHeight, behavior: 'auto' })
      updateScrollState(nextViewport)

      const animationFrame = window.requestAnimationFrame(() => {
        nextViewport.scrollTo({ top: nextViewport.scrollHeight, behavior: 'auto' })
        updateScrollState(nextViewport)
      })

      return () => window.cancelAnimationFrame(animationFrame)
    }

    updateScrollState(nextViewport, { syncPinnedToViewport: false })
  }, [contentVersion, updateScrollState])

  useEffect(() => {
    if (!viewport) return

    const syncScrollPosition = () => {
      if (!isPinnedToBottomRef.current) {
        updateScrollState(viewport, { syncPinnedToViewport: false })
        return
      }

      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'auto' })
      updateScrollState(viewport)
    }

    const resizeObserver = new ResizeObserver(syncScrollPosition)
    const contentElement = viewport.firstElementChild

    resizeObserver.observe(viewport)

    if (contentElement instanceof HTMLElement) {
      resizeObserver.observe(contentElement)
    }

    syncScrollPosition()

    return () => resizeObserver.disconnect()
  }, [updateScrollState, viewport])

  useEffect(() => {
    return () => clearUserScrollIntent()
  }, [clearUserScrollIntent])

  return {
    canScrollToBottom,
    scrollToBottom,
    viewportProps: {
      ref: handleViewportRef,
      onKeyDown: handleKeyDown,
      onScroll: handleScroll,
      onTouchMove: handleTouchMove,
      onWheel: handleWheel,
      tabIndex: 0,
    },
  }
}

interface ExecutionLogsCardProps {
  canRerunExecution: boolean
  canStopExecution: boolean
  connectionState: ReturnType<typeof useExecutionRealtimeLogs>['connectionState']
  currentStatus?: string | null
  description: string | null
  isLoading: boolean
  missingRerunFields: string[]
  isReportError: boolean
  isReportLoading: boolean
  isRerunning: boolean
  isRerunAvailable: boolean
  isStopping: boolean
  logLines: ExecutionLogLine[]
  onRerunExecution: () => void
  onStopExecution: () => void
  rawExecutionJson: string
  reportBasePath: string
  reportHtml?: string
  rerunSummary: ExecutionRerunSummary | null
  showReport: boolean
  title: string
}

export function ExecutionLogsCard({
  canRerunExecution,
  canStopExecution,
  connectionState,
  currentStatus,
  description,
  isLoading,
  missingRerunFields,
  isReportError,
  isReportLoading,
  isRerunning,
  isRerunAvailable,
  isStopping,
  logLines,
  onRerunExecution,
  onStopExecution,
  rawExecutionJson,
  reportBasePath,
  reportHtml,
  rerunSummary,
  showReport,
  title,
}: ExecutionLogsCardProps) {
  const { t } = useTranslation('executions')
  const isStatusLoading = isLoading && currentStatus == null
  const isCurrentExecutionRunning = isExecutionRunning(currentStatus)
  const latestLogId = logLines.at(-1)?.id ?? 'empty'
  const latestLogLength = logLines.at(-1)?.message.length ?? 0
  const logScroll = useExecutionLogScroll(`${logLines.length}:${latestLogId}:${latestLogLength}`)

  return (
    <Card className="min-h-0 min-w-0 flex-1 gap-2">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <IconTerminal2 className="text-muted-foreground" />
              {title}
              {isStatusLoading ? (
                <Skeleton aria-hidden="true" className="h-6 w-24 rounded-full" />
              ) : (
                <Badge
                  variant={getStatusBadgeVariant(currentStatus)}
                  className={getStatusBadgeClassName(currentStatus)}
                >
                  {currentStatus ?? t('detail.statusUnknown')}
                  {isCurrentExecutionRunning ? (
                    <IconLoader2 aria-hidden="true" className="animate-spin" data-icon="inline-end" />
                  ) : null}
                </Badge>
              )}
            </CardTitle>
            {isLoading ? (
              <Skeleton aria-hidden="true" className="h-5 w-56 rounded-md" />
            ) : description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExecutionDebugSheet
              connectionState={connectionState}
              currentStatus={currentStatus}
              rawExecutionJson={rawExecutionJson}
            />
            {canRerunExecution && rerunSummary ? (
              <ExecutionRerunDialog
                currentStatus={currentStatus}
                isRerunAvailable={isRerunAvailable}
                isRerunning={isRerunning}
                missingRerunFields={missingRerunFields}
                onConfirm={onRerunExecution}
                rerunSummary={rerunSummary}
              />
            ) : null}
            {canStopExecution ? (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      disabled={isStopping}
                      type="button"
                    >
                      {isStopping ? (
                        <IconLoader2 className="animate-spin" data-icon="inline-start" />
                      ) : (
                        <IconPlayerStop data-icon="inline-start" />
                      )}
                      {isStopping ? t('detail.stopping') : t('detail.stopExecution')}
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('detail.stopTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('detail.stopDescription')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isStopping}>{t('detail.cancelStop')}</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" disabled={isStopping} onClick={onStopExecution}>
                      {isStopping ? <IconLoader2 className="animate-spin" data-icon="inline-start" /> : null}
                      {isStopping ? t('detail.stopping') : t('detail.confirmStop')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Tabs defaultValue="logs" className="min-h-0 min-w-0 flex-1">
          <TabsList variant="line" aria-label={t('detail.contentTabsLabel')}>
            <TabsTrigger value="logs">{t('detail.historyTab')}</TabsTrigger>
            <TabsTrigger value="report" disabled={!showReport}>
              {t('detail.reportTab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent keepMounted value="logs" className="min-h-0 min-w-0">
            <div className="relative min-w-0">
              <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background">
                <ScrollArea
                  className="h-[calc(100vh-16rem)] min-h-96 min-w-0 bg-background"
                  viewportProps={{
                    ...logScroll.viewportProps,
                    className: 'bg-background',
                  }}
                >
                  <div className="max-w-full p-4">
                    <ExecutionLogList isLoading={isLoading} logLines={logLines} />
                  </div>
                </ScrollArea>
              </div>
              {logScroll.canScrollToBottom ? (
                <Button
                  className="absolute right-4 bottom-4 font-normal text-xs shadow-lg"
                  onClick={() => logScroll.scrollToBottom()}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {t('detail.scrollToBottom')}
                  <IconArrowDown data-icon="inline-end" />
                </Button>
              ) : null}
            </div>
          </TabsContent>
          <TabsContent value="report" className="min-h-0 min-w-0">
            <ExecutionReportPanel
              isError={isReportError}
              isLoading={isReportLoading}
              reportBasePath={reportBasePath}
              reportHtml={reportHtml}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
