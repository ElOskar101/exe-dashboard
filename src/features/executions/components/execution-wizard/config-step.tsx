import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { TFunction } from 'i18next'
import type { useExecutionWizard } from '../../hooks/use-execution-wizard'
import type { StepErrors } from '../../lib/execution-wizard-validation'
import type { ExecutionWizardDraft } from '../../model/execution-create'

interface ConfigStepProps {
  draft: ExecutionWizardDraft
  errors: StepErrors['config']
  showErrors: boolean
  onWorkersChange: ReturnType<typeof useExecutionWizard>['updateWorkers']
  onRetriesChange: ReturnType<typeof useExecutionWizard>['updateRetries']
  onConfigChange: ReturnType<typeof useExecutionWizard>['updateConfig']
  t: TFunction<'executions'>
}

export function ConfigStep({
  draft,
  errors,
  showErrors,
  onWorkersChange,
  onRetriesChange,
  onConfigChange,
  t,
}: ConfigStepProps) {
  return (
    <FieldSet>
      <FieldGroup className="md:grid md:grid-cols-2">
        <Field data-invalid={showErrors && Boolean(errors.workers)}>
          <FieldLabel htmlFor="workers">{t('fields.workers')}</FieldLabel>
          <Input
            id="workers"
            type="number"
            min="1"
            step="1"
            value={draft.execution.workers}
            onChange={(event) => onWorkersChange(event.target.value)}
            aria-invalid={showErrors && Boolean(errors.workers)}
            placeholder={t('placeholders.workers')}
          />
          <FieldError>{showErrors ? errors.workers : null}</FieldError>
        </Field>

        <Field data-invalid={showErrors && Boolean(errors.retries)}>
          <FieldLabel htmlFor="retries">{t('fields.retries')}</FieldLabel>
          <Input
            id="retries"
            type="number"
            min="0"
            step="1"
            value={draft.execution.retries}
            onChange={(event) => onRetriesChange(event.target.value)}
            aria-invalid={showErrors && Boolean(errors.retries)}
            placeholder={t('placeholders.retries')}
          />
          <FieldError>{showErrors ? errors.retries : null}</FieldError>
        </Field>

        <Field
          data-invalid={showErrors && Boolean(errors.config)}
          className="md:col-span-2"
        >
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
