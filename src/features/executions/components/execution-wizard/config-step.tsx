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
  t: TFunction<'executions'>
}

export function ConfigStep({
  draft,
  errors,
  showErrors,
  onWorkersChange,
  onRetriesChange,
  t,
}: ConfigStepProps) {
  return (
    <FieldSet>
      <FieldGroup className="md:grid md:max-w-xl md:grid-cols-2">
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
      </FieldGroup>
    </FieldSet>
  )
}
