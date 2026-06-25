import { useState } from 'react'
import type { TFunction } from 'i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconAlertCircle, IconEye, IconEyeOff, IconLock } from '@tabler/icons-react'
import type { ExecutionWizardBotStepState } from '../hooks/use-execution-wizard'

interface BotStepProps extends ExecutionWizardBotStepState {
  t: TFunction<'executions'>
}

export function BotStep({
  associatedBotOptions,
  bot,
  botPasswordError,
  context,
  errors,
  projectError,
  showErrors,
  playwrightProjectOptions,
  selectedBotId,
  isDecryptingBotPassword,
  isLoadingClinicBots,
  isLoadingPlaywrightProjects,
  clinicBotsError,
  playwrightProjectsError,
  hasSelectedClinicWithoutActiveBots,
  hasSelectedProjectWithoutAssociatedBots,
  onProjectSelect,
  onBotSelect,
  onBotFieldChange,
  t,
}: BotStepProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const hasSelectedProject = context.project.trim().length > 0
  const hasSelectedClinic = context.clinic.trim().length > 0
  const showBotFieldErrors = showErrors && !isDecryptingBotPassword
  const selectedBotName =
    associatedBotOptions.find((associatedBot) => associatedBot._id === selectedBotId)?.botName ?? ''
  const isBotFormEnabled =
    hasSelectedProject &&
    hasSelectedClinic &&
    selectedBotId.trim().length > 0 &&
    !isDecryptingBotPassword &&
    !hasSelectedClinicWithoutActiveBots &&
    !hasSelectedProjectWithoutAssociatedBots &&
    !clinicBotsError &&
    !playwrightProjectsError
  const isProjectSelectDisabled = isLoadingPlaywrightProjects || Boolean(playwrightProjectsError)
  const isBotSelectDisabled =
    !hasSelectedProject ||
    !hasSelectedClinic ||
    isLoadingPlaywrightProjects ||
    isLoadingClinicBots ||
    hasSelectedClinicWithoutActiveBots ||
    hasSelectedProjectWithoutAssociatedBots ||
    Boolean(clinicBotsError) ||
    Boolean(playwrightProjectsError)

  return (
    <FieldSet>
      <FieldGroup>
        <FieldGroup className="md:grid md:grid-cols-2">
          <Field data-invalid={showErrors && Boolean(projectError)}>
            <FieldLabel htmlFor="project">{t('fields.project')}</FieldLabel>
            <Select
              value={context.project}
              onValueChange={(value) => onProjectSelect(value ?? '')}
              disabled={isProjectSelectDisabled}
            >
              <SelectTrigger id="project" aria-invalid={showErrors && Boolean(projectError)} className="w-full">
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
            <FieldLabel htmlFor="associatedBot">
              <span className="flex items-center gap-2">
                {t('fields.bot')}
                {!hasSelectedClinic ? (
                  <span className="text-xs font-normal text-muted-foreground">{t('help.selectClinicFirst')}</span>
                ) : null}
              </span>
            </FieldLabel>
            <Select
              value={selectedBotId}
              onValueChange={(value) => onBotSelect(value ?? '')}
              disabled={isBotSelectDisabled}
            >
              <SelectTrigger
                id="associatedBot"
                aria-invalid={showErrors && Boolean(errors.clinicBotId)}
                className="hidden w-full md:flex"
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
            <select
              id="associatedBotMobile"
              value={selectedBotId}
              onChange={(event) => onBotSelect(event.target.value)}
              disabled={isBotSelectDisabled}
              aria-invalid={showErrors && Boolean(errors.clinicBotId)}
              className="flex h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:hidden"
            >
              <option value="">{t('placeholders.bot')}</option>
              {associatedBotOptions.map((associatedBot) => (
                <option key={associatedBot._id} value={associatedBot._id}>
                  {associatedBot.botName}
                </option>
              ))}
            </select>
            <FieldError>{showErrors ? errors.clinicBotId : null}</FieldError>
          </Field>

          <Field data-invalid={showBotFieldErrors && Boolean(errors.botName)} data-readonly={isBotFormEnabled}>
            <FieldLabel htmlFor="botName">
              <span className="flex items-center gap-2">
                {t('fields.botName')}
                {isBotFormEnabled ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-xs font-normal text-muted-foreground"
                    title={t('help.readonlyFieldTooltip')}
                  >
                    <IconLock className="size-3" aria-hidden="true" />
                    {t('help.readonlyFieldBadge')}
                  </span>
                ) : null}
              </span>
            </FieldLabel>
            <Input
              id="botName"
              value={bot.botName}
              disabled={!isBotFormEnabled}
              readOnly={isBotFormEnabled}
              aria-invalid={showBotFieldErrors && Boolean(errors.botName)}
              aria-readonly={isBotFormEnabled}
              placeholder={t('placeholders.botName')}
              className={isBotFormEnabled ? 'bg-muted/40 text-muted-foreground' : undefined}
            />
            <FieldError>{showBotFieldErrors ? errors.botName : null}</FieldError>
          </Field>

          <Field data-invalid={showBotFieldErrors && Boolean(errors.targetUrl)} data-readonly={isBotFormEnabled}>
            <FieldLabel htmlFor="targetUrl">
              <span className="flex items-center gap-2">
                {t('fields.url')}
                {isBotFormEnabled ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-xs font-normal text-muted-foreground"
                    title={t('help.readonlyFieldTooltip')}
                  >
                    <IconLock className="size-3" aria-hidden="true" />
                    {t('help.readonlyFieldBadge')}
                  </span>
                ) : null}
              </span>
            </FieldLabel>
            <Input
              id="targetUrl"
              type="url"
              value={bot.targetUrl}
              disabled={!isBotFormEnabled}
              readOnly={isBotFormEnabled}
              aria-invalid={showBotFieldErrors && Boolean(errors.targetUrl)}
              aria-readonly={isBotFormEnabled}
              placeholder={t('placeholders.url')}
              className={isBotFormEnabled ? 'bg-muted/40 text-muted-foreground' : undefined}
            />
            <FieldError>{showBotFieldErrors ? errors.targetUrl : null}</FieldError>
          </Field>

          <Field data-invalid={showBotFieldErrors && Boolean(errors.username)}>
            <FieldLabel htmlFor="botUsername">{t('fields.username')}</FieldLabel>
            <Input
              id="botUsername"
              autoComplete="username"
              value={bot.username}
              onChange={(event) => onBotFieldChange('username', event.target.value)}
              disabled={!isBotFormEnabled}
              aria-invalid={showBotFieldErrors && Boolean(errors.username)}
              placeholder={t('placeholders.username')}
            />
            <FieldError>{showBotFieldErrors ? errors.username : null}</FieldError>
          </Field>

          <Field data-invalid={showBotFieldErrors && Boolean(errors.password)}>
            <FieldLabel htmlFor="botPassword">
              <span className="flex items-center gap-2">
                {t('fields.password')}
                {isDecryptingBotPassword ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    {t('placeholders.decryptingClinicBotPassword')}
                  </span>
                ) : null}
              </span>
            </FieldLabel>
            <div className="relative">
              <Input
                id="botPassword"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                value={bot.password}
                onChange={(event) => onBotFieldChange('password', event.target.value)}
                disabled={!isBotFormEnabled}
                aria-invalid={showBotFieldErrors && Boolean(errors.password)}
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
            <FieldError>{showBotFieldErrors ? errors.password : null}</FieldError>
          </Field>
        </FieldGroup>

        {playwrightProjectsError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.playwrightProjectsTitle')}</AlertTitle>
            <AlertDescription>{playwrightProjectsError}</AlertDescription>
          </Alert>
        ) : null}

        {clinicBotsError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.clinicBotsTitle')}</AlertTitle>
            <AlertDescription>{clinicBotsError}</AlertDescription>
          </Alert>
        ) : null}

        {botPasswordError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.decryptClinicBotPasswordTitle')}</AlertTitle>
            <AlertDescription>{botPasswordError}</AlertDescription>
          </Alert>
        ) : null}

        {hasSelectedClinicWithoutActiveBots ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.clinicBotsTitle')}</AlertTitle>
            <AlertDescription>{t('help.noActiveClinicBots')}</AlertDescription>
          </Alert>
        ) : null}

        {hasSelectedProjectWithoutAssociatedBots ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.associatedBotsTitle')}</AlertTitle>
            <AlertDescription>{t('help.noAssociatedBots')}</AlertDescription>
          </Alert>
        ) : null}
      </FieldGroup>
    </FieldSet>
  )
}
