import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { TFunction } from 'i18next'
import type { ExecutionScheduleMode } from '../model/execution-create'
import type { ExecutionWizardConfigStepState } from '../hooks/use-execution-wizard'

interface ConfigStepProps extends ExecutionWizardConfigStepState {
  t: TFunction<'executions'>
}

export function ConfigStep({
  draft,
  errors,
  maxRetries,
  maxWorkers,
  showErrors,
  onWorkersChange,
  onRetriesChange,
  onConfigChange,
  onScheduleModeChange,
  onScheduledAtChange,
  t,
}: ConfigStepProps) {
  const scheduleMode = draft.execution.scheduleMode

  return (
    <FieldSet>
      <FieldGroup className="md:grid md:grid-cols-2">
        <Field>
          <FieldLabel>{t('fields.scheduleMode')}</FieldLabel>
          <ToggleGroup
            value={[scheduleMode]}
            onValueChange={(value) => {
              const nextMode = value[0]

              if (nextMode === 'instant' || nextMode === 'scheduled') {
                onScheduleModeChange(nextMode as ExecutionScheduleMode)
              }
            }}
            variant="outline"
            spacing={0}
            className="w-full max-w-sm"
          >
            <ToggleGroupItem value="instant" className="flex-1">
              {t('options.scheduleInstant')}
            </ToggleGroupItem>
            <ToggleGroupItem value="scheduled" className="flex-1">
              {t('options.scheduleScheduled')}
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        <Field
          data-disabled={scheduleMode === 'instant' ? true : undefined}
          data-invalid={showErrors && Boolean(errors.scheduledAt)}
        >
          <FieldLabel htmlFor="scheduledAt">{t('fields.scheduledAt')}</FieldLabel>
          <Input
            id="scheduledAt"
            type="datetime-local"
            step="60"
            disabled={scheduleMode === 'instant'}
            value={draft.execution.scheduledAt}
            onChange={(event) => onScheduledAtChange(event.target.value)}
            aria-invalid={showErrors && Boolean(errors.scheduledAt)}
          />
          <FieldError>{showErrors ? errors.scheduledAt : null}</FieldError>
        </Field>

        <Field data-invalid={showErrors && Boolean(errors.workers)}>
          <FieldLabel htmlFor="workers">
            {t('fields.workers')}
            <span className="text-xs font-normal text-muted-foreground">
              {t('help.limitRange', { min: 1, max: maxWorkers })}
            </span>
          </FieldLabel>
          <Input
            id="workers"
            type="number"
            min="1"
            max={maxWorkers}
            step="1"
            value={draft.execution.workers}
            onChange={(event) => onWorkersChange(event.target.value)}
            aria-invalid={showErrors && Boolean(errors.workers)}
            aria-valuemin={1}
            aria-valuemax={maxWorkers}
            placeholder={t('placeholders.workers')}
          />
          <FieldError>{showErrors ? errors.workers : null}</FieldError>
        </Field>

        <Field data-invalid={showErrors && Boolean(errors.retries)}>
          <FieldLabel htmlFor="retries">
            {t('fields.retries')}
            <span className="text-xs font-normal text-muted-foreground">
              {t('help.limitRange', { min: 0, max: maxRetries })}
            </span>
          </FieldLabel>
          <Input
            id="retries"
            type="number"
            min="0"
            max={maxRetries}
            step="1"
            value={draft.execution.retries}
            onChange={(event) => onRetriesChange(event.target.value)}
            aria-invalid={showErrors && Boolean(errors.retries)}
            aria-valuemin={0}
            aria-valuemax={maxRetries}
            placeholder={t('placeholders.retries')}
          />
          <FieldError>{showErrors ? errors.retries : null}</FieldError>
        </Field>

        <Field data-invalid={showErrors && Boolean(errors.config)} className="md:col-span-2">
          <FieldLabel htmlFor="config">{t('fields.otherConfig')}</FieldLabel>
          <textarea
            id="config"
            value={draft.execution.config}
            onChange={(event) => onConfigChange(event.target.value)}
            aria-invalid={showErrors && Boolean(errors.config)}
            className="min-h-32 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
            spellCheck={false}
          />
          <FieldError>{showErrors ? errors.config : null}</FieldError>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
