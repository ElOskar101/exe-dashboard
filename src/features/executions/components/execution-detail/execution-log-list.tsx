import { memo, useMemo, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Skeleton } from '@/components/ui/skeleton'
import { IconCircleDashed } from '@tabler/icons-react'
import Anser from 'anser'
import { cn } from '@/lib/utils'
import { formatExecutionDateTime } from '../../lib/format-execution-date'
import type { ExecutionLogLine } from '../../lib/execution-log-buffer'

interface ExecutionLogListProps {
  isLoading: boolean
  logLines: ExecutionLogLine[]
}

export function ExecutionLogList({ isLoading, logLines }: ExecutionLogListProps) {
  const { t } = useTranslation('executions')
  const visibleLogLines = useMemo(() => logLines.filter(hasVisibleLogMessage), [logLines])

  if (isLoading && visibleLogLines.length === 0) {
    return <ExecutionLogListSkeleton />
  }

  if (visibleLogLines.length === 0) {
    return (
      <Item variant="muted">
        <ItemContent>
          <ItemTitle>{t('detail.noLogsTitle')}</ItemTitle>
          <ItemDescription>{t('detail.noLogsDescription')}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <IconCircleDashed />
        </ItemActions>
      </Item>
    )
  }

  return (
    <ItemGroup>
      {visibleLogLines.map((line) => (
        <Item key={line.id} variant="outline" size="sm">
          <ItemContent>
            <ItemTitle className="line-clamp-none break-all font-mono">
              <AnsiLogMessage message={line.message} />
            </ItemTitle>
            {line.timestamp ? <ItemDescription>{formatExecutionDateTime(line.timestamp)}</ItemDescription> : null}
          </ItemContent>
          {line.stream ? (
            <ItemActions>
              <Badge variant="outline">{line.stream}</Badge>
            </ItemActions>
          ) : null}
        </Item>
      ))}
    </ItemGroup>
  )
}

function hasVisibleLogMessage(line: ExecutionLogLine) {
  return Anser.ansiToText(line.message).trim().length > 0
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
  { messageWidth: 'w-2/3', timestampWidth: 'w-28', streamWidth: 'w-16' },
  { messageWidth: 'w-3/5', timestampWidth: 'w-24', streamWidth: 'w-20' },
  { messageWidth: 'w-4/5', timestampWidth: 'w-32', streamWidth: 'w-14' },
  { messageWidth: 'w-1/2', timestampWidth: 'w-20', streamWidth: 'w-16' },
] as const

function ExecutionLogListSkeleton() {
  return (
    <ItemGroup aria-hidden="true">
      {LOG_SKELETON_ROWS.map((row, index) => (
        <Item key={index} variant="outline" size="sm">
          <ItemContent>
            <Skeleton className={cn('h-4', row.messageWidth)} />
            <Skeleton className={cn('h-4', row.timestampWidth)} />
          </ItemContent>
          <ItemActions>
            <Skeleton className={cn('h-6 rounded-full', row.streamWidth)} />
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  )
}
