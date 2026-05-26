import { memo, useMemo, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { IconCircleDashed } from '@tabler/icons-react'
import Anser from 'anser'
import Prism from 'prismjs'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import { Highlight, themes as prismThemes } from 'prism-react-renderer'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/use-theme'
import { formatExecutionDateTime } from '../../lib/format-execution-date'
import type { ExecutionLogLine, ExecutionLogStream } from '../../lib/execution-log-buffer'
import {
  buildExecutionLogRenderItems,
  type ExecutionLogCodeFrameItem,
  type ExecutionLogTone,
} from '../../lib/execution-log-render'

interface ExecutionLogListProps {
  isLoading: boolean
  logLines: ExecutionLogLine[]
}

export function ExecutionLogList({ isLoading, logLines }: ExecutionLogListProps) {
  const { t } = useTranslation('executions')
  const { theme } = useTheme()
  const renderItems = useMemo(() => buildExecutionLogRenderItems(logLines), [logLines])
  const codeTheme = theme === 'dark' ? prismThemes.oneDark : prismThemes.github

  if (isLoading && logLines.length === 0) {
    return <ExecutionLogListSkeleton />
  }

  if (logLines.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center">
        <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
          <IconCircleDashed />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">{t('detail.noLogsTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('detail.noLogsDescription')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-full w-max font-mono text-[13px] text-foreground">
      {renderItems.map((item) =>
        item.type === 'code-frame' ? (
          <ExecutionCodeFrame key={item.id} item={item} codeTheme={codeTheme} />
        ) : (
          <ExecutionTextLine key={item.line.id} line={item.line} tone={item.tone} />
        ),
      )}
    </div>
  )
}

function ExecutionTextLine({ line, tone }: { line: ExecutionLogLine; tone?: ExecutionLogTone }) {
  return (
    <div className="flex min-h-6 items-start gap-2 rounded-lg px-2 py-0.5 transition-colors hover:bg-muted/40">
      <ExecutionLogMeta stream={line.stream} timestamp={line.timestamp} />
      <span className={cn('pr-3 whitespace-pre text-[13px] leading-6', getToneClassName(tone))} style={{ tabSize: 2 }}>
        <AnsiLogMessage message={line.message} />
      </span>
    </div>
  )
}

function ExecutionCodeFrame({
  item,
  codeTheme,
}: {
  item: ExecutionLogCodeFrameItem
  codeTheme: (typeof prismThemes)['github']
}) {
  const lineNumberWidth = `${Math.max(...item.lines.map((line) => line.lineNumber?.length ?? 0), 1)}ch`

  return (
    <div className="rounded-xl border border-border/80 bg-muted/30 px-2 py-2">
      <div className="flex items-start gap-2">
        <ExecutionLogMeta stream={item.stream} timestamp={item.timestamp} />
        <div className="overflow-x-auto">
          <div className="min-w-full whitespace-pre text-[13px] leading-6" style={{ tabSize: 2 }}>
            {item.lines.map((line) => (
              <div key={line.id} className="flex items-start">
                <span
                  className={cn(
                    'mr-2 w-[1ch] shrink-0 text-center text-muted-foreground',
                    line.isFocused && 'text-amber-600 dark:text-amber-300',
                  )}
                >
                  {line.isFocused ? '>' : ''}
                </span>
                <span className="shrink-0 text-right text-muted-foreground" style={{ width: lineNumberWidth }}>
                  {line.lineNumber ?? ''}
                </span>
                <span className="mx-2 shrink-0 text-muted-foreground">|</span>
                <span
                  className={cn(
                    'pr-3',
                    line.kind === 'caret' && 'text-rose-600 dark:text-rose-300',
                    line.isFocused && line.kind === 'source' && 'bg-amber-500/10',
                  )}
                >
                  {line.kind === 'caret' ? (
                    <span className="text-rose-600 dark:text-rose-300">{line.content}</span>
                  ) : (
                    <HighlightedCodeLine code={line.content} codeTheme={codeTheme} />
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ExecutionLogMeta({ stream, timestamp }: { stream?: ExecutionLogStream; timestamp?: string }) {
  if (!timestamp && !stream) {
    return null
  }

  return (
    <>
      {timestamp ? (
        <span className="shrink-0 select-none pt-0.5 text-[11px] text-muted-foreground">
          {formatExecutionDateTime(timestamp)}
        </span>
      ) : null}
      {stream ? (
        <span
          className={cn(
            'shrink-0 pt-0.5 text-[10px] font-semibold tracking-[0.18em] uppercase',
            getStreamClassName(stream),
          )}
        >
          {stream}
        </span>
      ) : null}
    </>
  )
}

function getStreamClassName(stream: ExecutionLogStream | undefined) {
  switch (stream) {
    case 'stderr':
      return 'text-rose-600 dark:text-rose-300'
    case 'system':
      return 'text-sky-700 dark:text-sky-300'
    case 'stdout':
      return 'text-emerald-700 dark:text-emerald-300'
    default:
      return ''
  }
}

function getToneClassName(tone: ExecutionLogTone | undefined) {
  switch (tone) {
    case 'destructive':
      return 'text-rose-600 dark:text-rose-300'
    case 'success':
      return 'text-emerald-700 dark:text-emerald-300'
    case 'warning':
      return 'text-amber-700 dark:text-amber-300'
    default:
      return ''
  }
}

const AnsiLogMessage = memo(function AnsiLogMessage({ message }: { message: string }) {
  const parts = Anser.ansiToJson(message, { remove_empty: true })

  return (
    <>
      {parts.map((part, index) => {
        const foreground = part.fg_truecolor || part.fg
        const background = part.bg_truecolor || part.bg
        const style: CSSProperties = {
          backgroundColor: background ? `rgb(${background})` : undefined,
          color: foreground ? `rgb(${foreground})` : undefined,
          fontStyle: part.decorations.includes('italic') ? 'italic' : undefined,
          fontWeight: part.decorations.includes('bold') ? 700 : undefined,
          textDecorationLine: getTextDecorationLine(part.decorations),
        }

        return (
          <span key={index} style={style}>
            {part.content}
          </span>
        )
      })}
    </>
  )
})

function HighlightedCodeLine({ code, codeTheme }: { code: string; codeTheme: (typeof prismThemes)['github'] }) {
  return (
    <Highlight code={code} language="typescript" prism={Prism} theme={codeTheme}>
      {({ tokens, getTokenProps }) => (
        <>
          {tokens[0]?.map((token, index) => {
            const tokenProps = getTokenProps({ token })

            return (
              <span key={`${token.content}-${index}`} style={tokenProps.style}>
                {tokenProps.children}
              </span>
            )
          }) ?? code}
        </>
      )}
    </Highlight>
  )
}

function getTextDecorationLine(decorations: string[]): CSSProperties['textDecorationLine'] {
  const textDecorations = decorations.filter(
    (decoration) => decoration === 'underline' || decoration === 'strikethrough',
  )

  if (textDecorations.length === 0) {
    return undefined
  }

  return textDecorations.join(' ') as CSSProperties['textDecorationLine']
}

const LOG_SKELETON_ROWS = [
  { messageWidth: 'w-72', timestampWidth: 'w-32', streamWidth: 'w-16' },
  { messageWidth: 'w-96', timestampWidth: 'w-28', streamWidth: 'w-20' },
  { messageWidth: 'w-80', timestampWidth: 'w-36', streamWidth: 'w-14' },
  { messageWidth: 'w-64', timestampWidth: 'w-24', streamWidth: 'w-16' },
] as const

function ExecutionLogListSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-2 font-mono">
      {LOG_SKELETON_ROWS.map((row, index) => (
        <div key={index} className="flex min-h-6 items-center gap-4 rounded-lg px-3 py-2">
          <Skeleton className={cn('h-3 rounded-full', row.timestampWidth)} />
          <Skeleton className={cn('h-3 rounded-full', row.streamWidth)} />
          <Skeleton className={cn('h-3 rounded-full', row.messageWidth)} />
        </div>
      ))}
    </div>
  )
}
