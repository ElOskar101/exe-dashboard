import { useState } from 'react'
import type { TFunction } from 'i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconAlertCircle, IconEye, IconEyeOff } from '@tabler/icons-react'
import type { ExecutionWizardBotStepState } from '../hooks/use-execution-wizard'

interface BotStepProps extends ExecutionWizardBotStepState {
  t: TFunction<'executions'>
}

export function BotStep({
  associatedBotOptions,
  bot,
  context,
  errors,
  projectError,
  showErrors,
  playwrightProjectOptions,
  selectedBotId,
  isLoadingPlaywrightProjects,
  playwrightProjectsError,
  hasSelectedProjectWithoutAssociatedBots,
  onProjectSelect,
  onBotSelect,
  onBotFieldChange,
  t,
}: BotStepProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const hasSelectedProject = context.project.trim().length > 0
  const selectedBotName =
    associatedBotOptions.find((associatedBot) => associatedBot._id === selectedBotId)?.botName ?? ''
  const isBotFormEnabled =
    hasSelectedProject &&
    selectedBotId.trim().length > 0 &&
    !hasSelectedProjectWithoutAssociatedBots &&
    !playwrightProjectsError
  const isProjectSelectDisabled = isLoadingPlaywrightProjects || Boolean(playwrightProjectsError)
  const isBotSelectDisabled =
    !hasSelectedProject ||
    isLoadingPlaywrightProjects ||
    hasSelectedProjectWithoutAssociatedBots ||
    Boolean(playwrightProjectsError)

  return (
    <FieldSet>
      <FieldGroup>
        {playwrightProjectsError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.playwrightProjectsTitle')}</AlertTitle>
            <AlertDescription>{playwrightProjectsError}</AlertDescription>
          </Alert>
        ) : null}

        {hasSelectedProjectWithoutAssociatedBots ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.associatedBotsTitle')}</AlertTitle>
            <AlertDescription>{t('help.noAssociatedBots')}</AlertDescription>
          </Alert>
        ) : null}

        {hasSelectedProject &&
        !selectedBotId.trim().length &&
        !isLoadingPlaywrightProjects &&
        !hasSelectedProjectWithoutAssociatedBots &&
        !playwrightProjectsError ? (
          <Alert>
            <IconAlertCircle />
            <AlertDescription>{t('help.selectBotToEdit')}</AlertDescription>
          </Alert>
        ) : null}

        <FieldGroup className="md:grid md:grid-cols-2">
          <Field data-invalid={showErrors && Boolean(projectError)}>
            <FieldLabel htmlFor="playwrightProject">{t('fields.project')}</FieldLabel>
            <Select
              value={context.project}
              onValueChange={(value) => onProjectSelect(value ?? '')}
              disabled={isProjectSelectDisabled}
            >
              <SelectTrigger
                id="playwrightProject"
                aria-invalid={showErrors && Boolean(projectError)}
                className="w-full"
              >
                <SelectValue placeholder={t('placeholders.project')}>{context.project || undefined}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {playwrightProjectOptions.map((project) => (
                    <SelectItem key={project._id} value={project.name}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{showErrors ? projectError : null}</FieldError>
          </Field>

          <Field data-invalid={showErrors && Boolean(errors.clinicBotId)}>
            <FieldLabel htmlFor="associatedBot">{t('fields.bot')}</FieldLabel>
            <Select
              value={selectedBotId}
              onValueChange={(value) => onBotSelect(value ?? '')}
              disabled={isBotSelectDisabled}
            >
              <SelectTrigger
                id="associatedBot"
                aria-invalid={showErrors && Boolean(errors.clinicBotId)}
                className="w-full"
              >
                <SelectValue placeholder={t('placeholders.bot')}>{selectedBotName || undefined}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {associatedBotOptions.map((associatedBot) => (
                    <SelectItem key={associatedBot._id} value={associatedBot._id}>
                      {associatedBot.botName}
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
              disabled={!isBotFormEnabled}
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
              disabled={!isBotFormEnabled}
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
              disabled={!isBotFormEnabled}
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
                disabled={!isBotFormEnabled}
                aria-invalid={showErrors && Boolean(errors.password)}
                placeholder={t('placeholders.password')}
                className="pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                className="absolute top-1/2 right-1 h-7 min-w-7 -translate-y-1/2 rounded-full px-0"
                onClick={() => setIsPasswordVisible((previousValue) => !previousValue)}
                disabled={!isBotFormEnabled}
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
