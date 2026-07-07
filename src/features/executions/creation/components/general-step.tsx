import { useState } from 'react'
import type { TFunction } from 'i18next'
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
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { IconAlertCircle, IconEye, IconEyeOff, IconPencil } from '@tabler/icons-react'
import { ExecutionClientFilter } from '@/features/executions/listing'
import { executionPatientFilters, type ExecutionPatientFilter } from '../model/execution-create'
import { hasErrors } from '../lib/execution-wizard-validation'
import type { ExecutionWizardGeneralStepState } from '../hooks/use-execution-wizard'
import { ImportedPatientCard } from './imported-patient-card'

interface GeneralStepProps extends ExecutionWizardGeneralStepState {
  t: TFunction<'executions'>
}

const patientErrorFieldKeys = ['patientName', 'patientLastName', 'patientMemberId', 'patientDob'] as const
const patientCardSkeletonCount = 6
const patientFilterLabels = {
  all: 'filters.patients.all',
  review: 'filters.patients.review',
  empty: 'filters.patients.empty',
  notExecuted: 'filters.patients.notExecuted',
} as const

const patientErrorLabels = {
  patientName: 'fields.patientName',
  patientLastName: 'fields.patientLastName',
  patientMemberId: 'fields.memberId',
  patientDob: 'fields.patientDob',
} as const satisfies Record<(typeof patientErrorFieldKeys)[number], Parameters<TFunction<'executions'>>[0]>

export function GeneralStep({
  associatedBotOptions,
  bot,
  botErrors,
  botPasswordError,
  context,
  execution,
  executionName,
  patients,
  contextErrors,
  errors,
  showErrors,
  selectedCustomerError,
  clinicOptions,
  isLoadingClinics,
  hasSelectedCustomerWithoutClinics,
  executionDayOptions,
  isLoadingExecutionDays,
  executionDaysError,
  isImportingPatients,
  isDecryptingBotPassword,
  isLoadingClinicBots,
  isLoadingPlaywrightProjects,
  clinicBotsError,
  playwrightProjectsError,
  hasSelectedClinicWithoutActiveBots,
  hasSelectedProjectWithoutAssociatedBots,
  importPatientsError,
  playwrightProjectOptions,
  projectError,
  selectedBotId,
  includedPatientIds,
  patientFilter,
  onCustomerClear,
  onCustomerSelect,
  onClinicSelect,
  onProjectSelect,
  onBotSelect,
  onBotFieldChange,
  onExecutionDaySelect,
  onPatientFilterChange,
  onRemovePatient,
  t,
}: GeneralStepProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isBotCredentialsDialogOpen, setIsBotCredentialsDialogOpen] = useState(false)
  const emptyValue = t('review.emptyValue')
  const selectedExecutionLabel = executionName || execution || undefined
  const hasSelectedClinic = context.clinic.trim().length > 0
  const hasSelectedProject = context.project.trim().length > 0
  const hasSelectedBot = selectedBotId.trim().length > 0
  const shouldShowExecutionLoading = isLoadingExecutionDays && !selectedExecutionLabel
  const executionPlaceholder = shouldShowExecutionLoading
    ? t('placeholders.loadingExecutions')
    : t('placeholders.execution')
  const selectedBotName =
    associatedBotOptions.find((associatedBot) => associatedBot._id === selectedBotId)?.botName ?? ''
  const showBotFieldErrors = showErrors && !isDecryptingBotPassword
  const isProjectSelectDisabled = !hasSelectedClinic || isLoadingPlaywrightProjects || Boolean(playwrightProjectsError)
  const isBotSelectDisabled =
    !hasSelectedProject ||
    isLoadingPlaywrightProjects ||
    isLoadingClinicBots ||
    hasSelectedClinicWithoutActiveBots ||
    hasSelectedProjectWithoutAssociatedBots ||
    Boolean(clinicBotsError) ||
    Boolean(playwrightProjectsError)
  const isBotFormEnabled =
    hasSelectedProject &&
    hasSelectedBot &&
    !isDecryptingBotPassword &&
    !hasSelectedClinicWithoutActiveBots &&
    !hasSelectedProjectWithoutAssociatedBots &&
    !clinicBotsError &&
    !playwrightProjectsError
  const isExecutionSelectDisabled =
    !context.client.trim() ||
    !context.clinic.trim() ||
    isLoadingExecutionDays ||
    Boolean(executionDaysError) ||
    executionDayOptions.length === 0
  const isPatientFilterDisabled = isImportingPatients || patients.length === 0
  const hasVisiblePatients = patients.some((patient) => patient.id && includedPatientIds.has(patient.id))

  return (
    <FieldSet>
      <FieldGroup>
        <div className="grid w-full grid-cols-[repeat(5,minmax(10rem,1fr))_2.25rem] items-start gap-y-4 gap-x-2 overflow-x-auto pb-1 [&>[role=group]:not(:nth-of-type(5))]:mr-2">
          <ExecutionClientFilter
            clearSelectionLabel={t('fields.client')}
            emptyMessage={t('help.noCustomersFound')}
            error={showErrors ? contextErrors.client : null}
            fieldClassName="gap-3"
            getOptionValue={(customer) => customer._id}
            id="client"
            invalid={showErrors && Boolean(contextErrors.client)}
            label={t('fields.client')}
            loadingMessage={t('help.searchingCustomers')}
            loadingMoreMessage={t('help.searchingCustomers')}
            placeholder={t('placeholders.client')}
            searchErrorMessage={t('validation.customerSearchTitle')}
            searchPlaceholder={t('placeholders.client')}
            selectedCountLabel={context.clientName || t('fields.client')}
            selectedValueLabels={context.client ? { [context.client]: context.clientName } : undefined}
            selectedValues={context.client ? [context.client] : []}
            selectionMode="single"
            triggerClassName="rounded-3xl border-transparent bg-input/50 hover:bg-input/50 aria-expanded:bg-input/50 dark:bg-input/50 dark:hover:bg-input/50"
            onSelectedCustomersChange={(selectedCustomers) => {
              const selectedCustomer = selectedCustomers[0]

              if (selectedCustomer) {
                onCustomerSelect(selectedCustomer)
              }
            }}
            onSelectedValuesChange={(selectedValues) => {
              if (selectedValues.length === 0) {
                onCustomerClear()
              }
            }}
          />

          <Field data-invalid={showErrors && Boolean(contextErrors.clinic)}>
            <FieldLabel htmlFor="clinic">{t('fields.clinic')}</FieldLabel>
            <Select
              value={context.clinic}
              onValueChange={(value) => onClinicSelect(value ?? '')}
              disabled={
                !context.client.trim() ||
                isLoadingClinics ||
                hasSelectedCustomerWithoutClinics ||
                Boolean(selectedCustomerError)
              }
            >
              <SelectTrigger id="clinic" aria-invalid={showErrors && Boolean(contextErrors.clinic)} className="w-full">
                <SelectValue placeholder={t('placeholders.clinic')}>{context.clinicName || undefined}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {clinicOptions.map((clinic) => (
                    <SelectItem key={clinic._id} value={clinic._id}>
                      {clinic.clinicName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{showErrors ? contextErrors.clinic : null}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="execution">{t('fields.execution')}</FieldLabel>
            <Select
              value={execution}
              onValueChange={(value) => onExecutionDaySelect(value ?? '')}
              disabled={isExecutionSelectDisabled}
            >
              <SelectTrigger id="execution" className="w-full">
                <SelectValue placeholder={executionPlaceholder}>
                  {shouldShowExecutionLoading ? executionPlaceholder : selectedExecutionLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {executionDayOptions.map((day) => (
                    <SelectItem key={day._id} value={day._id}>
                      {day.sheetName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
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

          <Field data-invalid={showErrors && Boolean(botErrors.clinicBotId)}>
            <FieldLabel htmlFor="associatedBot">{t('fields.bot')}</FieldLabel>
            <Select
              value={selectedBotId}
              onValueChange={(value) => onBotSelect(value ?? '')}
              disabled={isBotSelectDisabled}
            >
              <SelectTrigger
                id="associatedBot"
                aria-invalid={showErrors && Boolean(botErrors.clinicBotId)}
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
              aria-invalid={showErrors && Boolean(botErrors.clinicBotId)}
              className="flex h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:hidden"
            >
              <option value="">{t('placeholders.bot')}</option>
              {associatedBotOptions.map((associatedBot) => (
                <option key={associatedBot._id} value={associatedBot._id}>
                  {associatedBot.botName}
                </option>
              ))}
            </select>
            <FieldError>{showErrors ? botErrors.clinicBotId : null}</FieldError>
          </Field>

          <div className="flex items-start pt-8">
            <Dialog open={isBotCredentialsDialogOpen} onOpenChange={setIsBotCredentialsDialogOpen}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <DialogTrigger
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9 shrink-0"
                            disabled={!isBotFormEnabled}
                            aria-label={t('buttons.editBotCredentials')}
                          />
                        }
                      />
                    }
                  >
                    <IconPencil />
                  </TooltipTrigger>
                  <TooltipContent>{t('buttons.editBotCredentials')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('botCredentials.title')}</DialogTitle>
                  <DialogDescription>{t('botCredentials.description')}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                  <Field>
                    <FieldLabel htmlFor="botCredentialsName">{t('fields.botName')}</FieldLabel>
                    <Input id="botCredentialsName" value={bot.botName || emptyValue} readOnly />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="botCredentialsPortalUrl">{t('fields.url')}</FieldLabel>
                    <Input id="botCredentialsPortalUrl" value={bot.targetUrl || emptyValue} readOnly />
                  </Field>

                  <Field data-invalid={showBotFieldErrors && Boolean(botErrors.username)}>
                    <FieldLabel htmlFor="botUsername">{t('fields.username')}</FieldLabel>
                    <Input
                      id="botUsername"
                      autoComplete="username"
                      value={bot.username}
                      onChange={(event) => onBotFieldChange('username', event.target.value)}
                      disabled={!isBotFormEnabled}
                      aria-invalid={showBotFieldErrors && Boolean(botErrors.username)}
                      placeholder={t('placeholders.username')}
                    />
                    <FieldError>{showBotFieldErrors ? botErrors.username : null}</FieldError>
                  </Field>

                  <Field data-invalid={showBotFieldErrors && Boolean(botErrors.password)}>
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
                        aria-invalid={showBotFieldErrors && Boolean(botErrors.password)}
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
                    <FieldError>{showBotFieldErrors ? botErrors.password : null}</FieldError>
                  </Field>
                </div>

                <DialogFooter>
                  <DialogClose render={<Button type="button" variant="outline" />}>
                    {t('botCredentials.close')}
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Field>
          <FieldLabel>{t('fields.patientFilter')}</FieldLabel>
          <RadioGroup
            value={patientFilter}
            disabled={isPatientFilterDisabled}
            className="w-fit grid-flow-col auto-cols-max"
            aria-label={t('fields.patientFilter')}
            onValueChange={(value) => onPatientFilterChange(value as ExecutionPatientFilter)}
          >
            {executionPatientFilters.map((filter) => (
              <Field key={filter} orientation="horizontal" data-disabled={isPatientFilterDisabled}>
                <RadioGroupItem id={`patientFilter-${filter}`} value={filter} />
                <FieldLabel htmlFor={`patientFilter-${filter}`}>{t(patientFilterLabels[filter])}</FieldLabel>
              </Field>
            ))}
          </RadioGroup>
        </Field>

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

        {executionDaysError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.executionDaysTitle')}</AlertTitle>
            <AlertDescription>{executionDaysError}</AlertDescription>
          </Alert>
        ) : null}

        {importPatientsError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.importPatientsTitle')}</AlertTitle>
            <AlertDescription>{importPatientsError}</AlertDescription>
          </Alert>
        ) : null}

        {errors.form && showErrors && !isImportingPatients ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('validation.patientListTitle')}</AlertTitle>
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        ) : null}

        {isImportingPatients ? (
          <div className="grid max-h-[13rem] gap-3 overflow-y-auto p-1 pr-3 sm:max-h-[20rem] md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: patientCardSkeletonCount }).map((_, index) => (
              <div key={index} className="flex min-w-0 flex-col gap-4 rounded-3xl border bg-muted/15 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="size-8 rounded-full" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isImportingPatients && patients.length === 0 ? (
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            {t('help.noImportedPatients')}
          </div>
        ) : null}

        {!isImportingPatients && patients.length > 0 && !hasVisiblePatients ? (
          <div className="rounded-3xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            {t('help.noFilteredPatients')}
          </div>
        ) : null}

        {!isImportingPatients && patients.length > 0 && hasVisiblePatients ? (
          <div className="grid max-h-[13rem] gap-3 overflow-y-auto p-1 pr-3 sm:max-h-[20rem] md:grid-cols-2 lg:grid-cols-4">
            {patients.flatMap((patient, index) => {
              if (!patient.id || !includedPatientIds.has(patient.id)) {
                return []
              }

              const rowErrors = errors.rows[index] ?? {}
              const missingFields = patientErrorFieldKeys
                .filter((field) => Boolean(rowErrors[field]))
                .map((field) => t(patientErrorLabels[field]))
              const hasRowErrors = hasErrors(rowErrors)

              return [
                <ImportedPatientCard
                  key={`${patient.id}-${patient.patientMemberId}-${patient.patientName}`}
                  emptyValue={emptyValue}
                  hasRowErrors={hasRowErrors}
                  index={index}
                  missingFields={missingFields}
                  patient={patient}
                  rowErrorMessage={rowErrors.otherInformation}
                  showErrors={showErrors}
                  onRemovePatient={onRemovePatient}
                  t={t}
                />,
              ]
            })}
          </div>
        ) : null}
      </FieldGroup>
    </FieldSet>
  )
}
