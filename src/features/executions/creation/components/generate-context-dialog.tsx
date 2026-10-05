import { useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { IconAlertCircle, IconBraces, IconCopy, IconDownload, IconEye, IconEyeOff } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExecutionClientFilter } from '@/features/executions/listing'
import { useGenerateExecutionContext } from '../hooks/use-generate-execution-context'

const optionalLabelClassName = 'text-xs font-normal text-muted-foreground'
const GENERATED_CONTEXT_FILE_NAME = 'execution-context.json'
const GENERATED_CONTEXT_FILE_TYPE = 'application/json'

export function GenerateContextDialog() {
  const { t } = useTranslation('executions')
  const [isOpen, setIsOpen] = useState(false)
  const [session, setSession] = useState(0)
  const [generatedContextText, setGeneratedContextText] = useState<string | null>(null)

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setSession((currentSession) => currentSession + 1)
          }

          setIsOpen(nextOpen)
        }}
      >
        <DialogTrigger render={<Button type="button" variant="outline" />}>
          <IconBraces data-icon="inline-start" />
          {t('generateContext.trigger')}
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('generateContext.title')}</DialogTitle>
            <DialogDescription>{t('generateContext.description')}</DialogDescription>
          </DialogHeader>
          <GenerateContextForm key={session} t={t} onContextGenerated={setGeneratedContextText} />
        </DialogContent>
      </Dialog>
      <GeneratedContextResultDialog
        contextText={generatedContextText}
        open={generatedContextText !== null}
        t={t}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setGeneratedContextText(null)
          }
        }}
      />
    </>
  )
}

function GenerateContextForm({
  onContextGenerated,
  t,
}: {
  onContextGenerated: (contextText: string) => void
  t: TFunction<'executions'>
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const generateContext = useGenerateExecutionContext(t)
  const { errors, form, showErrors } = generateContext
  const hasSelectedClient = form.clientId.trim().length > 0
  const hasSelectedClinic = form.clinicId.trim().length > 0
  const isClinicSelectDisabled =
    !hasSelectedClient ||
    generateContext.isLoadingClinics ||
    generateContext.hasSelectedCustomerWithoutClinics ||
    Boolean(generateContext.selectedCustomerError)
  const isExecutionSelectDisabled =
    !hasSelectedClinic || generateContext.isLoadingExecutionDays || Boolean(generateContext.executionDaysError)
  const isBotSelectDisabled = !hasSelectedClinic || generateContext.isLoadingClinicBots
  const isGenerateDisabled = generateContext.isLoadingClinicConfig || generateContext.isImportingPatients
  const hasContextNotes =
    generateContext.isLoadingClinicConfig ||
    Boolean(generateContext.selectedCustomerError) ||
    Boolean(generateContext.clinicConfigError) ||
    Boolean(generateContext.clinicBotsError) ||
    Boolean(generateContext.botPasswordError) ||
    Boolean(generateContext.executionDaysError) ||
    Boolean(generateContext.importPatientsError)
  const selectedExecutionLabel = form.sheetName || form.executionId || undefined
  const selectedBotName =
    generateContext.clinicBotOptions.find((clinicBot) => clinicBot._id === form.bot.clinicBotRecordId)?.bot.botName ??
    ''

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <FieldSet>
          <FieldGroup className="md:grid md:grid-cols-2">
            <ExecutionClientFilter
              clearSelectionLabel={t('fields.client')}
              emptyMessage={t('help.noCustomersFound')}
              fieldClassName="gap-3 md:col-span-2"
              getOptionValue={(customer) => customer._id}
              id="generate-context-client"
              label={`${t('fields.client')} (${t('generateContext.optional')})`}
              loadingMessage={t('help.searchingCustomers')}
              loadingMoreMessage={t('help.searchingCustomers')}
              placeholder={t('placeholders.client')}
              searchErrorMessage={t('validation.customerSearchTitle')}
              searchPlaceholder={t('placeholders.client')}
              selectedCountLabel={form.clientName || t('fields.client')}
              selectedValueLabels={form.clientId ? { [form.clientId]: form.clientName } : undefined}
              selectedValues={form.clientId ? [form.clientId] : []}
              selectionMode="single"
              triggerClassName="w-full"
              onSelectedCustomersChange={(selectedCustomers) => {
                const selectedCustomer = selectedCustomers[0]

                if (selectedCustomer) {
                  generateContext.onCustomerSelect(selectedCustomer)
                }
              }}
              onSelectedValuesChange={(selectedValues) => {
                if (selectedValues.length === 0) {
                  generateContext.onClearCustomer()
                }
              }}
            />

            <Field data-invalid={generateContext.hasSelectedCustomerWithoutClinics}>
              <FieldLabel htmlFor="generate-context-clinic">
                {t('fields.clinic')}
                <span className={optionalLabelClassName}>{t('generateContext.optional')}</span>
              </FieldLabel>
              <Select
                value={form.clinicId}
                onValueChange={(value) => generateContext.onClinicSelect(value ?? '')}
                disabled={isClinicSelectDisabled}
              >
                <SelectTrigger id="generate-context-clinic" className="w-full">
                  <SelectValue placeholder={t('placeholders.clinic')}>{form.clinicName || undefined}</SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    {generateContext.clinicOptions.map((clinic) => (
                      <SelectItem key={clinic._id} value={clinic._id}>
                        {clinic.clinicName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {generateContext.hasSelectedCustomerWithoutClinics ? (
                <FieldError>{t('validation.customerHasNoClinics')}</FieldError>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="generate-context-execution">
                {t('fields.execution')}
                <span className={optionalLabelClassName}>{t('generateContext.optional')}</span>
              </FieldLabel>
              <Select
                value={form.executionId}
                onValueChange={(value) => generateContext.onExecutionDaySelect(value ?? '')}
                disabled={isExecutionSelectDisabled}
              >
                <SelectTrigger id="generate-context-execution" className="w-full">
                  <SelectValue
                    placeholder={
                      generateContext.isLoadingExecutionDays
                        ? t('placeholders.loadingExecutions')
                        : t('placeholders.execution')
                    }
                  >
                    {selectedExecutionLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    {generateContext.executionDayOptions.map((day) => (
                      <SelectItem key={day._id} value={day._id}>
                        {day.sheetName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                {form.patients.length > 0
                  ? t('help.importedPatients', { count: form.patients.length })
                  : t('generateContext.noPatients')}
              </FieldDescription>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="generate-context-bot">
                {t('fields.bot')}
                <span className={optionalLabelClassName}>{t('generateContext.optional')}</span>
              </FieldLabel>
              <Select
                value={form.bot.clinicBotRecordId}
                onValueChange={(value) => generateContext.onClinicBotSelect(value ?? '')}
                disabled={isBotSelectDisabled}
              >
                <SelectTrigger id="generate-context-bot" className="w-full">
                  <SelectValue placeholder={t('placeholders.bot')}>{selectedBotName || undefined}</SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    {generateContext.clinicBotOptions.map((clinicBot) => (
                      <SelectItem key={clinicBot._id} value={clinicBot._id}>
                        {clinicBot.bot.botName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{t('generateContext.botHelp')}</FieldDescription>
            </Field>

            <Field data-invalid={showErrors && Boolean(errors.botName)}>
              <FieldLabel htmlFor="generate-context-bot-name">{t('fields.botName')}</FieldLabel>
              <Input
                id="generate-context-bot-name"
                value={form.bot.botName}
                onChange={(event) => generateContext.onBotFieldChange('botName', event.target.value)}
                aria-invalid={showErrors && Boolean(errors.botName)}
                placeholder={t('placeholders.botName')}
              />
              <FieldError>{showErrors ? errors.botName : null}</FieldError>
            </Field>

            <Field data-invalid={showErrors && Boolean(errors.targetUrl)}>
              <FieldLabel htmlFor="generate-context-url">{t('fields.url')}</FieldLabel>
              <Input
                id="generate-context-url"
                value={form.bot.targetUrl}
                onChange={(event) => generateContext.onBotFieldChange('targetUrl', event.target.value)}
                aria-invalid={showErrors && Boolean(errors.targetUrl)}
                placeholder={t('placeholders.url')}
              />
              <FieldError>{showErrors ? errors.targetUrl : null}</FieldError>
            </Field>

            <Field data-invalid={showErrors && Boolean(errors.username)}>
              <FieldLabel htmlFor="generate-context-username">{t('fields.username')}</FieldLabel>
              <Input
                id="generate-context-username"
                autoComplete="username"
                value={form.bot.username}
                onChange={(event) => generateContext.onBotFieldChange('username', event.target.value)}
                aria-invalid={showErrors && Boolean(errors.username)}
                placeholder={t('placeholders.username')}
              />
              <FieldError>{showErrors ? errors.username : null}</FieldError>
            </Field>

            <Field data-invalid={showErrors && Boolean(errors.password)}>
              <FieldLabel htmlFor="generate-context-password">
                {t('fields.password')}
                {generateContext.isDecryptingBotPassword ? (
                  <span className={optionalLabelClassName}>{t('placeholders.decryptingClinicBotPassword')}</span>
                ) : null}
              </FieldLabel>
              <div className="relative">
                <Input
                  id="generate-context-password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.bot.password}
                  onChange={(event) => generateContext.onBotFieldChange('password', event.target.value)}
                  aria-invalid={showErrors && Boolean(errors.password)}
                  placeholder={t('placeholders.password')}
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute top-1/2 right-1 h-7 min-w-7 -translate-y-1/2 rounded-full px-0"
                  onClick={() => setIsPasswordVisible((previousValue) => !previousValue)}
                  aria-label={isPasswordVisible ? t('buttons.hidePassword') : t('buttons.showPassword')}
                >
                  {isPasswordVisible ? <IconEyeOff /> : <IconEye />}
                </Button>
              </div>
              <FieldError>{showErrors ? errors.password : null}</FieldError>
            </Field>

            <Field data-invalid={showErrors && Boolean(errors.workers)}>
              <FieldLabel htmlFor="generate-context-workers">
                {t('fields.workers')}
                <span className={optionalLabelClassName}>
                  {t('generateContext.optional')} {t('help.limitRange', { min: 1, max: generateContext.maxWorkers })}
                </span>
              </FieldLabel>
              <Input
                id="generate-context-workers"
                type="number"
                min="1"
                max={generateContext.maxWorkers}
                step="1"
                value={form.workers}
                onChange={(event) => generateContext.onWorkersChange(event.target.value)}
                aria-invalid={showErrors && Boolean(errors.workers)}
                placeholder={t('placeholders.workers')}
              />
              <FieldError>{showErrors ? errors.workers : null}</FieldError>
            </Field>

            <Field data-invalid={showErrors && Boolean(errors.retries)}>
              <FieldLabel htmlFor="generate-context-retries">
                {t('fields.retries')}
                <span className={optionalLabelClassName}>
                  {t('generateContext.optional')} {t('help.limitRange', { min: 0, max: generateContext.maxRetries })}
                </span>
              </FieldLabel>
              <Input
                id="generate-context-retries"
                type="number"
                min="0"
                max={generateContext.maxRetries}
                step="1"
                value={form.retries}
                onChange={(event) => generateContext.onRetriesChange(event.target.value)}
                aria-invalid={showErrors && Boolean(errors.retries)}
                placeholder={t('placeholders.retries')}
              />
              <FieldError>{showErrors ? errors.retries : null}</FieldError>
            </Field>
          </FieldGroup>
        </FieldSet>

        {hasContextNotes ? (
          <div className="flex flex-col gap-4">
            {generateContext.isLoadingClinicConfig ? (
              <p className="text-sm text-muted-foreground">{t('generateContext.loadingClinicConfig')}</p>
            ) : null}

            {generateContext.selectedCustomerError ? (
              <Alert variant="destructive">
                <IconAlertCircle />
                <AlertTitle>{t('validation.customerSearchTitle')}</AlertTitle>
                <AlertDescription>{generateContext.selectedCustomerError}</AlertDescription>
              </Alert>
            ) : null}

            {generateContext.clinicConfigError ? (
              <Alert variant="destructive">
                <IconAlertCircle />
                <AlertTitle>{t('validation.macroConfigRequired')}</AlertTitle>
                <AlertDescription>{generateContext.clinicConfigError}</AlertDescription>
              </Alert>
            ) : null}

            {generateContext.clinicBotsError ? (
              <Alert variant="destructive">
                <IconAlertCircle />
                <AlertTitle>{t('validation.clinicBotsTitle')}</AlertTitle>
                <AlertDescription>{generateContext.clinicBotsError}</AlertDescription>
              </Alert>
            ) : null}

            {generateContext.botPasswordError ? (
              <Alert variant="destructive">
                <IconAlertCircle />
                <AlertTitle>{t('validation.decryptClinicBotPasswordTitle')}</AlertTitle>
                <AlertDescription>{generateContext.botPasswordError}</AlertDescription>
              </Alert>
            ) : null}

            {generateContext.executionDaysError ? (
              <Alert variant="destructive">
                <IconAlertCircle />
                <AlertTitle>{t('validation.executionDaysTitle')}</AlertTitle>
                <AlertDescription>{generateContext.executionDaysError}</AlertDescription>
              </Alert>
            ) : null}

            {generateContext.importPatientsError ? (
              <Alert variant="destructive">
                <IconAlertCircle />
                <AlertTitle>{t('validation.importPatientsTitle')}</AlertTitle>
                <AlertDescription>{generateContext.importPatientsError}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : null}
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>{t('generateContext.close')}</DialogClose>
        <Button
          type="button"
          onClick={() => {
            const contextText = generateContext.onGenerate()

            if (contextText) {
              onContextGenerated(contextText)
            }
          }}
          disabled={isGenerateDisabled}
        >
          {t('generateContext.generate')}
        </Button>
      </DialogFooter>
    </>
  )
}

function GeneratedContextResultDialog({
  contextText,
  open,
  onOpenChange,
  t,
}: {
  contextText: string | null
  open: boolean
  onOpenChange: (nextOpen: boolean) => void
  t: TFunction<'executions'>
}) {
  const handleCopyContext = async () => {
    if (!contextText || !navigator.clipboard?.writeText) {
      toast.error(t('generateContext.copyFailed'))
      return
    }

    try {
      await navigator.clipboard.writeText(contextText)
      toast.success(t('generateContext.copied'))
    } catch {
      toast.error(t('generateContext.copyFailed'))
    }
  }

  const handleDownloadContext = () => {
    if (!contextText) {
      return
    }

    const fileUrl = URL.createObjectURL(new Blob([contextText], { type: GENERATED_CONTEXT_FILE_TYPE }))
    const downloadLink = document.createElement('a')

    downloadLink.href = fileUrl
    downloadLink.download = GENERATED_CONTEXT_FILE_NAME
    downloadLink.click()
    URL.revokeObjectURL(fileUrl)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('generateContext.resultTitle')}</DialogTitle>
          <DialogDescription>{t('generateContext.resultDescription')}</DialogDescription>
        </DialogHeader>
        <pre className="min-h-0 flex-1 overflow-auto rounded-3xl bg-muted/70 p-4 text-xs leading-6">{contextText}</pre>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>{t('generateContext.close')}</DialogClose>
          <Button type="button" variant="outline" onClick={() => void handleCopyContext()} disabled={!contextText}>
            <IconCopy data-icon="inline-start" />
            {t('generateContext.copy')}
          </Button>
          <Button type="button" onClick={handleDownloadContext} disabled={!contextText}>
            <IconDownload data-icon="inline-start" />
            {t('generateContext.download')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
