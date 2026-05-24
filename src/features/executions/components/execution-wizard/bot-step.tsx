import type { TFunction } from 'i18next'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { useExecutionWizard } from '../../hooks/use-execution-wizard'
import type { StepErrors } from '../../lib/execution-wizard-validation'
import type { ExecutionWizardDraft } from '../../model/execution-create'
import { CustomerSearchField } from './customer-search-field'

interface BotStepProps {
  context: ExecutionWizardDraft['context']
  bot: ExecutionWizardDraft['bot']
  contextErrors: StepErrors['context']
  errors: StepErrors['bot']
  showErrors: boolean
  onContextFieldChange: ReturnType<typeof useExecutionWizard>['updateContextField']
  customerOptions: ReturnType<typeof useExecutionWizard>['customerOptions']
  isSearchingCustomers: ReturnType<typeof useExecutionWizard>['isSearchingCustomers']
  customerSearchError: ReturnType<typeof useExecutionWizard>['customerSearchError']
  selectedCustomerError: ReturnType<typeof useExecutionWizard>['selectedCustomerError']
  clinicOptions: ReturnType<typeof useExecutionWizard>['clinicOptions']
  isLoadingClinics: ReturnType<typeof useExecutionWizard>['isLoadingClinics']
  hasSelectedCustomerWithoutClinics: ReturnType<typeof useExecutionWizard>['hasSelectedCustomerWithoutClinics']
  onCustomerSearchChange: ReturnType<typeof useExecutionWizard>['updateCustomerSearch']
  onCustomerClear: ReturnType<typeof useExecutionWizard>['clearCustomerSelection']
  onCustomerSelect: ReturnType<typeof useExecutionWizard>['selectCustomer']
  onClinicSelect: ReturnType<typeof useExecutionWizard>['selectClinic']
  onFieldChange: ReturnType<typeof useExecutionWizard>['updateBotField']
  t: TFunction<'executions'>
}

export function BotStep({
  context,
  bot,
  contextErrors,
  errors,
  showErrors,
  onContextFieldChange,
  customerOptions,
  isSearchingCustomers,
  customerSearchError,
  selectedCustomerError,
  clinicOptions,
  isLoadingClinics,
  hasSelectedCustomerWithoutClinics,
  onCustomerSearchChange,
  onCustomerClear,
  onCustomerSelect,
  onClinicSelect,
  onFieldChange,
  t,
}: BotStepProps) {
  return (
    <FieldSet>
      <FieldGroup className="md:grid md:grid-cols-3">
        <Field data-invalid={showErrors && Boolean(contextErrors.project)}>
          <FieldLabel htmlFor="project">{t('fields.project')}</FieldLabel>
          <Input
            id="project"
            value={context.project}
            onChange={(event) => onContextFieldChange('project', event.target.value)}
            aria-invalid={showErrors && Boolean(contextErrors.project)}
            placeholder={t('placeholders.project')}
          />
          <FieldError>{showErrors ? contextErrors.project : null}</FieldError>
        </Field>

        <Field data-invalid={showErrors && Boolean(contextErrors.client)}>
          <FieldLabel htmlFor="client">{t('fields.client')}</FieldLabel>
          <CustomerSearchField
            id="client"
            value={context.clientName}
            selectedCustomerName={context.clientName}
            invalid={showErrors && Boolean(contextErrors.client)}
            placeholder={t('placeholders.client')}
            isLoading={isSearchingCustomers}
            searchError={customerSearchError}
            options={customerOptions}
            noResultsText={t('help.noCustomersFound')}
            searchingText={t('help.searchingCustomers')}
            selectedText={t('help.selected')}
            onValueChange={onCustomerSearchChange}
            onClearSelection={onCustomerClear}
            onSelect={onCustomerSelect}
            selectedCustomerId={context.client}
          />
          <FieldError>{showErrors ? contextErrors.client : null}</FieldError>
        </Field>

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
              {clinicOptions.map((clinic) => (
                <SelectItem key={clinic._id} value={clinic._id}>
                  {clinic.clinicName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{showErrors ? contextErrors.clinic : null}</FieldError>
        </Field>
      </FieldGroup>

      <FieldGroup className="mt-6 md:grid md:grid-cols-2">
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

        <Field data-invalid={showErrors && Boolean(errors.otherInformation)} className="md:col-span-2">
          <FieldLabel htmlFor="botOtherInformation">{t('fields.botOtherInformation')}</FieldLabel>
          <textarea
            id="botOtherInformation"
            value={bot.otherInformation}
            onChange={(event) => onFieldChange('otherInformation', event.target.value)}
            aria-invalid={showErrors && Boolean(errors.otherInformation)}
            className="min-h-32 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
            spellCheck={false}
          />
          <FieldError>{showErrors ? errors.otherInformation : null}</FieldError>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
