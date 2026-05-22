import type { TFunction } from 'i18next'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { useExecutionWizard } from '../../hooks/use-execution-wizard'
import type { StepErrors } from '../../lib/execution-wizard-validation'
import type { ExecutionWizardDraft } from '../../model/execution-create'

interface BotStepProps {
  bot: ExecutionWizardDraft['bot']
  errors: StepErrors['bot']
  showErrors: boolean
  onFieldChange: ReturnType<typeof useExecutionWizard>['updateBotField']
  t: TFunction<'executions'>
}

export function BotStep({
  bot,
  errors,
  showErrors,
  onFieldChange,
  t,
}: BotStepProps) {
  return (
    <FieldSet>
      <FieldGroup className="md:grid md:grid-cols-2">
        <Field data-invalid={showErrors && Boolean(errors.botName)}>
          <FieldLabel htmlFor="botName">{t('fields.botName')}</FieldLabel>
          <Input
            id="botName"
            value={bot.botName}
            onChange={(event) => onFieldChange('botName', event.target.value)}
            aria-invalid={showErrors && Boolean(errors.botName)}
            placeholder={t('placeholders.botName')}
          />
          <FieldError>{showErrors ? errors.botName : null}</FieldError>
        </Field>

        <Field data-invalid={showErrors && Boolean(errors.url)}>
          <FieldLabel htmlFor="botUrl">{t('fields.url')}</FieldLabel>
          <Input
            id="botUrl"
            type="url"
            value={bot.url}
            onChange={(event) => onFieldChange('url', event.target.value)}
            aria-invalid={showErrors && Boolean(errors.url)}
            placeholder={t('placeholders.url')}
          />
          <FieldError>{showErrors ? errors.url : null}</FieldError>
        </Field>

        <Field data-invalid={showErrors && Boolean(errors.username)}>
          <FieldLabel htmlFor="botUsername">{t('fields.username')}</FieldLabel>
          <Input
            id="botUsername"
            value={bot.username}
            onChange={(event) => onFieldChange('username', event.target.value)}
            aria-invalid={showErrors && Boolean(errors.username)}
            placeholder={t('placeholders.username')}
          />
          <FieldError>{showErrors ? errors.username : null}</FieldError>
        </Field>

        <Field data-invalid={showErrors && Boolean(errors.password)}>
          <FieldLabel htmlFor="botPassword">{t('fields.password')}</FieldLabel>
          <Input
            id="botPassword"
            type="password"
            value={bot.password}
            onChange={(event) => onFieldChange('password', event.target.value)}
            aria-invalid={showErrors && Boolean(errors.password)}
            placeholder={t('placeholders.password')}
          />
          <FieldError>{showErrors ? errors.password : null}</FieldError>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
