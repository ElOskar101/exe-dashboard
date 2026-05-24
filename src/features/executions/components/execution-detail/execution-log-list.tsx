import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { IconCircleDashed, IconLoader2 } from '@tabler/icons-react'
import { formatExecutionDateTime } from '../../lib/format-execution-date'
import type { ExecutionLogLine } from '../../lib/execution-log-buffer'

interface ExecutionLogListProps {
  isLoading: boolean
  logLines: ExecutionLogLine[]
}

export function ExecutionLogList({ isLoading, logLines }: ExecutionLogListProps) {
  const { t } = useTranslation('executions')

  if (logLines.length === 0) {
    return (
      <Item variant="muted">
        <ItemContent>
          <ItemTitle>{t('detail.noLogsTitle')}</ItemTitle>
          <ItemDescription>{t('detail.noLogsDescription')}</ItemDescription>
        </ItemContent>
        <ItemActions>{isLoading ? <IconLoader2 className="animate-spin" /> : <IconCircleDashed />}</ItemActions>
      </Item>
    )
  }

  return (
    <ItemGroup>
      {logLines.map((line) => (
        <Item key={line.id} variant="outline" size="sm">
          <ItemContent>
            <ItemTitle className="line-clamp-none break-all font-mono">
              {line.message || t('detail.emptyLine')}
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
