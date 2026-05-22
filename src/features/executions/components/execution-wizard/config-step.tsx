import type { TFunction } from 'i18next'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { useExecutionWizard } from '../../hooks/use-execution-wizard'
import type { StepErrors } from '../../lib/execution-wizard-validation'
import type {
  ExecutionModeOption,
  ExecutionVerificationType,
  ExecutionWizardDraft,
} from '../../model/execution-create'

interface ConfigStepProps {
  draft: ExecutionWizardDraft
  errors: StepErrors['config']
  showErrors: boolean
  onThreadCountChange: ReturnType<
    typeof useExecutionWizard
  >['updateThreadCount']
  onConfigFieldChange: ReturnType<
    typeof useExecutionWizard
  >['updateConfigField']
  onModeChange: ReturnType<typeof useExecutionWizard>['updateMode']
  onVerificationTypeChange: ReturnType<
    typeof useExecutionWizard
  >['updateVerificationType']
  t: TFunction<'executions'>
}

export function ConfigStep({
  draft,
  errors,
  showErrors,
  onThreadCountChange,
  onConfigFieldChange,
  onModeChange,
  onVerificationTypeChange,
  t,
}: ConfigStepProps) {
  return (
    <FieldSet>
      <FieldGroup className="grid items-stretch gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]">
        <FieldGroup>
          <Field
            data-invalid={showErrors && Boolean(errors.numberOfThreads)}
            className="sm:max-w-64"
          >
            <FieldLabel htmlFor="threads">
              {t('fields.numberOfThreads')}
            </FieldLabel>
            <Input
              id="threads"
              type="number"
              min="1"
              step="1"
              value={draft.execution.numberOfThreads}
              onChange={(event) => onThreadCountChange(event.target.value)}
              aria-invalid={showErrors && Boolean(errors.numberOfThreads)}
              placeholder={t('placeholders.numberOfThreads')}
            />
            <FieldError>
              {showErrors ? errors.numberOfThreads : null}
            </FieldError>
          </Field>

          <FieldGroup className="grid gap-5 sm:w-fit sm:grid-cols-[auto_auto]">
            <Field
              data-invalid={showErrors && Boolean(errors.verificationType)}
            >
              <FieldTitle>{t('fields.verificationType')}</FieldTitle>
              <ToggleGroup
                multiple={false}
                variant="outline"
                value={
                  draft.execution.verificationType
                    ? [draft.execution.verificationType]
                    : []
                }
                onValueChange={(value) =>
                  onVerificationTypeChange(
                    (value[0] ?? '') as ExecutionVerificationType | '',
                  )
                }
                aria-label={t('fields.verificationType')}
              >
                <ToggleGroupItem value="ELG">
                  {t('options.verificationElg')}
                </ToggleGroupItem>
                <ToggleGroupItem value="FBD">
                  {t('options.verificationFbd')}
                </ToggleGroupItem>
              </ToggleGroup>
              <FieldError>
                {showErrors ? errors.verificationType : null}
              </FieldError>
            </Field>

            <Field data-invalid={showErrors && Boolean(errors.mode)}>
              <FieldTitle>{t('fields.mode')}</FieldTitle>
              <ToggleGroup
                multiple={false}
                variant="outline"
                value={draft.execution.mode ? [draft.execution.mode] : []}
                onValueChange={(value) =>
                  onModeChange((value[0] ?? '') as ExecutionModeOption)
                }
                aria-label={t('fields.mode')}
              >
                <ToggleGroupItem value="parallel">
                  {t('options.modeParallel')}
                </ToggleGroupItem>
                <ToggleGroupItem value="standard">
                  {t('options.modeStandard')}
                </ToggleGroupItem>
              </ToggleGroup>
              <FieldError>{showErrors ? errors.mode : null}</FieldError>
            </Field>
          </FieldGroup>
        </FieldGroup>

        <FieldSet className="h-full">
          <FieldGroup
            data-slot="checkbox-group"
            className="h-full justify-between gap-6"
          >
            <Field orientation="horizontal">
              <Checkbox
                id="inNetwork"
                checked={draft.config['in-network']}
                onCheckedChange={(checked) =>
                  onConfigFieldChange('in-network', Boolean(checked))
                }
              />
              <FieldContent>
                <FieldLabel htmlFor="inNetwork">
                  {t('fields.inNetwork')}
                </FieldLabel>
                <FieldDescription>
                  {t('sections.config.inNetworkDescription')}
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="shortForm"
                checked={draft.config.shortForm}
                onCheckedChange={(checked) =>
                  onConfigFieldChange('shortForm', Boolean(checked))
                }
              />
              <FieldContent>
                <FieldLabel htmlFor="shortForm">
                  {t('fields.shortForm')}
                </FieldLabel>
                <FieldDescription>
                  {t('sections.config.shortFormDescription')}
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="claimsForm"
                checked={draft.config.claimsForm}
                onCheckedChange={(checked) =>
                  onConfigFieldChange('claimsForm', Boolean(checked))
                }
              />
              <FieldContent>
                <FieldLabel htmlFor="claimsForm">
                  {t('fields.claimsForm')}
                </FieldLabel>
                <FieldDescription>
                  {t('sections.config.claimsFormDescription')}
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </FieldSet>
  )
}
