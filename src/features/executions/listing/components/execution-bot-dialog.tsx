import { IconEye } from '@tabler/icons-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Execution } from '@/features/executions/shared'

import { formatExecutionBotOtherInformation, getExecutionBotName } from '../lib/execution-bot-display'

interface ExecutionBotDialogProps {
  execution: Execution
  executionLabel: string
  emptyValue: string
}

export function ExecutionBotDialog({ execution, executionLabel, emptyValue }: ExecutionBotDialogProps) {
  const { t } = useTranslation('executions')
  const titleRef = useRef<HTMLHeadingElement>(null)
  const bot = execution.meta?.bot
  const botName = getExecutionBotName(execution, emptyValue)

  return (
    <Dialog>
      <div className="flex items-center gap-2">
        <span className="min-w-0 whitespace-normal break-words">{botName}</span>
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              type="button"
              aria-label={t('list.botTriggerAriaLabel', { execution: executionLabel })}
              className="text-foreground"
            />
          }
        >
          <IconEye />
        </DialogTrigger>
      </div>
      <DialogContent initialFocus={titleRef}>
        <DialogHeader>
          <DialogTitle ref={titleRef} tabIndex={-1}>
            {t('list.botDialogTitle')}
          </DialogTitle>
          <DialogDescription>{t('list.botDialogDescription', { execution: executionLabel })}</DialogDescription>
        </DialogHeader>
        {bot ? (
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <BotField emptyValue={emptyValue} label={t('fields.botName')} value={bot.botName} />
            <BotField emptyValue={emptyValue} label={t('fields.url')} value={bot.targetUrl} />
            <BotField emptyValue={emptyValue} label={t('fields.username')} value={bot.username} />
            <BotField emptyValue={emptyValue} label={t('fields.password')} value={bot.password} />
            <BotMetadataField
              emptyValue={emptyValue}
              label={t('fields.botOtherInformation')}
              value={formatExecutionBotOtherInformation(bot.otherInformation, emptyValue)}
            />
          </dl>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
            {t('list.noBot')}
          </div>
        )}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>{t('list.closeBotDialog')}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BotField({ emptyValue, label, value }: { emptyValue: string; label: string; value: string | undefined }) {
  return (
    <div className="min-w-0">
      <dt>{label}</dt>
      <dd className="mt-1 whitespace-normal break-words font-medium text-muted-foreground">
        {value?.trim() || emptyValue}
      </dd>
    </div>
  )
}

function BotMetadataField({
  emptyValue,
  label,
  value,
}: {
  emptyValue: string
  label: string
  value: ReturnType<typeof formatExecutionBotOtherInformation>
}) {
  return (
    <div className="min-w-0 sm:col-span-2">
      <dt>{label}</dt>
      <dd className="mt-1">
        {value === emptyValue ? (
          <span className="font-medium text-muted-foreground">{emptyValue}</span>
        ) : (
          <pre className="overflow-hidden rounded-3xl bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words">
            {value}
          </pre>
        )}
      </dd>
    </div>
  )
}
