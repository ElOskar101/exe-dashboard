import { useState } from 'react'
import type { TFunction } from 'i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconAlertCircle, IconEye, IconEyeOff } from '@tabler/icons-react'
import type { useExecutionWizard } from '../hooks/use-execution-wizard'
import type { StepErrors } from '../lib/execution-wizard-validation'
import type { ExecutionWizardDraft } from '../model/execution-create'

interface BotStepProps {
  bot: ExecutionWizardDraft['bot']
  context: ExecutionWizardDraft['context']
  errors: StepErrors['bot']
  showErrors: boolean
  clinicBotOptions: ReturnType<typeof useExecutionWizard>['clinicBotOptions']
  selectedClinicBotId: ReturnType<typeof useExecutionWizard>['selectedClinicBotId']
  isLoadingClinicBots: ReturnType<typeof useExecutionWizard>['isLoadingClinicBots']
  clinicBotsError: ReturnType<typeof useExecutionWizard>['clinicBotsError']
  isDecryptingClinicBotPassword: ReturnType<typeof useExecutionWizard>['isDecryptingClinicBotPassword']
  decryptClinicBotPasswordError: ReturnType<typeof useExecutionWizard>['decryptClinicBotPasswordError']
  hasSelectedClinicWithoutActiveBots: ReturnType<typeof useExecutionWizard>['hasSelectedClinicWithoutActiveBots']
  onClinicBotSelect: ReturnType<typeof useExecutionWizard>['selectClinicBot']
  onBotFieldChange: ReturnType<typeof useExecutionWizard>['updateBotField']
  t: TFunction<'executions'>
}

export function BotStep({
  bot,
  context,
  errors,
  showErrors,
  clinicBotOptions,
  selectedClinicBotId,
  isLoadingClinicBots,
  clinicBotsError,
  isDecryptingClinicBotPassword,
  decryptClinicBotPasswordError,
  hasSelectedClinicWithoutActiveBots,
  onClinicBotSelect,
  onBotFieldChange,
  t,
}: BotStepProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const hasSelectedContext = context.client.trim().length > 0 && context.clinic.trim().length > 0
  const selectedClinicBotName =
    clinicBotOptions.find((clinicBot) => clinicBot._id === selectedClinicBotId)?.bot.botName ?? ''
  const isBotFormEnabled =
    hasSelectedContext &&
    selectedClinicBotId.trim().length > 0 &&
    !hasSelectedClinicWithoutActiveBots &&
    !clinicBotsError
  const isBotFieldInputEnabled = isBotFormEnabled && !isDecryptingClinicBotPassword

  return (
    <FieldSet>
      <FieldGroup>
        {!hasSelectedContext ? (
          <Alert>
            <IconAlertCircle />
            <AlertDescription>{t('help.selectClientAndClinicFirst')}</AlertDescription>
          </Alert>
        ) : null}

        {clinicBotsError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.clinicBotsTitle')}</AlertTitle>
            <AlertDescription>{clinicBotsError}</AlertDescription>
          </Alert>
        ) : null}

        {hasSelectedClinicWithoutActiveBots ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.clinicBotsTitle')}</AlertTitle>
            <AlertDescription>{t('help.noActiveClinicBots')}</AlertDescription>
          </Alert>
        ) : null}

        {decryptClinicBotPasswordError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.decryptClinicBotPasswordTitle')}</AlertTitle>
            <AlertDescription>{decryptClinicBotPasswordError}</AlertDescription>
          </Alert>
        ) : null}

        {hasSelectedContext &&
        !selectedClinicBotId.trim().length &&
        !isLoadingClinicBots &&
        !hasSelectedClinicWithoutActiveBots &&
        !clinicBotsError ? (
          <Alert>
            <IconAlertCircle />
            <AlertDescription>{t('help.selectBotToEdit')}</AlertDescription>
          </Alert>
        ) : null}

        <FieldGroup className="md:grid md:grid-cols-2">
          <Field data-invalid={showErrors && Boolean(errors.clinicBotId)}>
            <FieldLabel htmlFor="clinicBot">{t('fields.bot')}</FieldLabel>
            <Select
              value={selectedClinicBotId}
              onValueChange={(value) => onClinicBotSelect(value ?? '')}
              disabled={
                !hasSelectedContext ||
                isLoadingClinicBots ||
                hasSelectedClinicWithoutActiveBots ||
                Boolean(clinicBotsError)
              }
            >
              <SelectTrigger id="clinicBot" aria-invalid={showErrors && Boolean(errors.clinicBotId)} className="w-full">
                <SelectValue placeholder={t('placeholders.bot')}>{selectedClinicBotName || undefined}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {clinicBotOptions.map((clinicBot) => (
                    <SelectItem key={clinicBot._id} value={clinicBot._id}>
                      {clinicBot.bot.botName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{showErrors ? errors.clinicBotId : null}</FieldError>
          </Field>

          <Field data-invalid={showErrors && Boolean(errors.botName)}>
            <FieldLabel htmlFor="botName">{t('fields.botName')}</FieldLabel>
            <Input
              id="botName"
              value={bot.botName}
              onChange={(event) => onBotFieldChange('botName', event.target.value)}
              disabled={!isBotFieldInputEnabled}
              aria-invalid={showErrors && Boolean(errors.botName)}
              placeholder={t('placeholders.botName')}
            />
            <FieldError>{showErrors ? errors.botName : null}</FieldError>
          </Field>

          <Field data-invalid={showErrors && Boolean(errors.targetUrl)} className="md:col-span-2">
            <FieldLabel htmlFor="targetUrl">{t('fields.url')}</FieldLabel>
            <Input
              id="targetUrl"
              type="url"
              value={bot.targetUrl}
              onChange={(event) => onBotFieldChange('targetUrl', event.target.value)}
              disabled={!isBotFieldInputEnabled}
              aria-invalid={showErrors && Boolean(errors.targetUrl)}
              placeholder={t('placeholders.url')}
            />
            <FieldError>{showErrors ? errors.targetUrl : null}</FieldError>
          </Field>

          <Field data-invalid={showErrors && Boolean(errors.username)}>
            <FieldLabel htmlFor="botUsername">{t('fields.username')}</FieldLabel>
            <Input
              id="botUsername"
              autoComplete="username"
              value={bot.username}
              onChange={(event) => onBotFieldChange('username', event.target.value)}
              disabled={!isBotFieldInputEnabled}
              aria-invalid={showErrors && Boolean(errors.username)}
              placeholder={t('placeholders.username')}
            />
            <FieldError>{showErrors ? errors.username : null}</FieldError>
          </Field>

          <Field data-invalid={showErrors && Boolean(errors.password)}>
            <FieldLabel htmlFor="botPassword">{t('fields.password')}</FieldLabel>
            <div className="relative">
              <Input
                id="botPassword"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                value={bot.password}
                onChange={(event) => onBotFieldChange('password', event.target.value)}
                disabled={!isBotFieldInputEnabled}
                aria-invalid={showErrors && Boolean(errors.password)}
                placeholder={
                  isDecryptingClinicBotPassword
                    ? t('placeholders.decryptingClinicBotPassword')
                    : t('placeholders.password')
                }
                className="pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                className="absolute top-1/2 right-1 h-7 min-w-7 -translate-y-1/2 rounded-full px-0"
                onClick={() => setIsPasswordVisible((previousValue) => !previousValue)}
                disabled={!isBotFieldInputEnabled}
                aria-label={isPasswordVisible ? t('buttons.hidePassword') : t('buttons.showPassword')}
              >
                {isPasswordVisible ? <IconEyeOff /> : <IconEye />}
              </Button>
            </div>
            <FieldError>{showErrors ? errors.password : null}</FieldError>
          </Field>
        </FieldGroup>
      </FieldGroup>
    </FieldSet>
  )
}
