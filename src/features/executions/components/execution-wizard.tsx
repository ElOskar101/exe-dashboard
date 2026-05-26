import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { IconArrowLeft, IconArrowRight, IconLoader2, IconSend2 } from '@tabler/icons-react'
import { executionWizardSteps, useExecutionWizard } from '../hooks/use-execution-wizard'
import { BotStep } from './execution-wizard/bot-step'
import { ConfigStep } from './execution-wizard/config-step'
import { ExecutionSubmitErrorAlert } from './execution-wizard/execution-submit-error-alert'
import { ExecutionWizardStepper } from './execution-wizard/execution-wizard-stepper'
import { PatientsStep } from './execution-wizard/patients-step'
import { ReviewStep } from './execution-wizard/review-step'

export default function ExecutionWizard() {
  const { t } = useTranslation('executions')
  const wizard = useExecutionWizard(t)

  return (
    <Card className="mx-auto w-full max-w-5xl">
      <CardHeader>
        <CardTitle>{t('page.title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ExecutionWizardStepper
          steps={executionWizardSteps}
          currentStep={wizard.currentStep}
          stepNeedsAttention={wizard.stepNeedsAttention}
          onStepChange={wizard.handleStepChange}
          t={t}
        />

        <Separator />

        {wizard.submitError ? <ExecutionSubmitErrorAlert message={wizard.submitError} t={t} /> : null}

        <div className="flex flex-col gap-6">
          {wizard.currentStep === 0 ? (
            <PatientsStep
              context={wizard.draft.context}
              execution={wizard.draft.execution.execution}
              executionName={wizard.draft.execution.executionName}
              patients={wizard.draft.execution.patients}
              contextErrors={wizard.validationErrors.context}
              errors={wizard.validationErrors.patients}
              showErrors={wizard.showErrors.patients}
              customerOptions={wizard.customerOptions}
              isSearchingCustomers={wizard.isSearchingCustomers}
              customerSearchError={wizard.customerSearchError}
              selectedCustomerError={wizard.selectedCustomerError}
              clinicOptions={wizard.clinicOptions}
              isLoadingClinics={wizard.isLoadingClinics}
              hasSelectedCustomerWithoutClinics={wizard.hasSelectedCustomerWithoutClinics}
              executionDayOptions={wizard.executionDayOptions}
              isLoadingExecutionDays={wizard.isLoadingExecutionDays}
              executionDaysError={wizard.executionDaysError}
              isImportingPatients={wizard.isImportingPatients}
              importPatientsError={wizard.importPatientsError}
              onCustomerSearchChange={wizard.updateCustomerSearch}
              onCustomerClear={wizard.clearCustomerSelection}
              onCustomerSelect={wizard.selectCustomer}
              onClinicSelect={wizard.selectClinic}
              onExecutionDaySelect={wizard.selectExecutionDay}
              onImportPatients={wizard.importPatients}
              onRemovePatient={wizard.removePatient}
              t={t}
            />
          ) : null}

          {wizard.currentStep === 1 ? (
            <BotStep
              bot={wizard.draft.bot}
              context={wizard.draft.context}
              errors={wizard.validationErrors.bot}
              showErrors={wizard.showErrors.bot}
              clinicBotOptions={wizard.clinicBotOptions}
              selectedClinicBotId={wizard.selectedClinicBotId}
              isLoadingClinicBots={wizard.isLoadingClinicBots}
              clinicBotsError={wizard.clinicBotsError}
              isDecryptingClinicBotPassword={wizard.isDecryptingClinicBotPassword}
              decryptClinicBotPasswordError={wizard.decryptClinicBotPasswordError}
              hasSelectedClinicWithoutActiveBots={wizard.hasSelectedClinicWithoutActiveBots}
              onClinicBotSelect={wizard.selectClinicBot}
              onBotFieldChange={wizard.updateBotField}
              t={t}
            />
          ) : null}

          {wizard.currentStep === 2 ? (
            <ConfigStep
              draft={wizard.draft}
              contextErrors={wizard.validationErrors.context}
              errors={wizard.validationErrors.config}
              showErrors={wizard.showErrors.config}
              onContextFieldChange={wizard.updateContextField}
              onWorkersChange={wizard.updateWorkers}
              onRetriesChange={wizard.updateRetries}
              onConfigChange={wizard.updateConfig}
              t={t}
            />
          ) : null}

          {wizard.currentStep === 3 ? <ReviewStep draft={wizard.draft} payload={wizard.payloadPreview} t={t} /> : null}
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-border">
        {wizard.currentStep === 0 ? (
          <span />
        ) : (
          <Button type="button" variant="ghost" onClick={wizard.handlePreviousStep} disabled={wizard.isSubmitting}>
            <IconArrowLeft data-icon="inline-start" />
            {t('buttons.back')}
          </Button>
        )}

        {wizard.currentStep < executionWizardSteps.length - 1 ? (
          <Button type="button" onClick={wizard.handleNextStep}>
            {t('buttons.next')}
            <IconArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button type="button" onClick={wizard.handleSubmit} disabled={wizard.isSubmitting}>
            {wizard.isSubmitting ? <IconLoader2 data-icon="inline-start" /> : <IconSend2 data-icon="inline-start" />}
            {wizard.isSubmitting ? t('buttons.submitting') : t('buttons.submit')}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
