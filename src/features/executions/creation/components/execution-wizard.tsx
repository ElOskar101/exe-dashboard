import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { IconArrowLeft, IconArrowRight, IconSend2 } from '@tabler/icons-react'
import { executionWizardSteps, useExecutionWizard } from '../hooks/use-execution-wizard'
import { BotStep } from './bot-step'
import { ConfigStep } from './config-step'
import { ExecutionSubmitErrorAlert } from './execution-submit-error-alert'
import { ExecutionWizardStepper } from './execution-wizard-stepper'
import { PatientsStep } from './patients-step'
import { ReviewStep } from './review-step'

export default function ExecutionWizard() {
  const { t } = useTranslation('executions')
  const wizard = useExecutionWizard(t)

  return (
    <Card className="min-h-0 w-full flex-1">
      <CardContent className="flex min-h-0 flex-1 flex-col gap-5 px-4 pb-5 sm:gap-6 sm:px-6 sm:pb-6">
        <ExecutionWizardStepper
          steps={wizard.stepper.steps}
          currentStep={wizard.stepper.currentStep}
          stepNeedsAttention={wizard.stepper.stepNeedsAttention}
          onStepChange={wizard.stepper.onStepChange}
          t={t}
        />

        <Separator />

        {wizard.submission.submitError ? (
          <ExecutionSubmitErrorAlert message={wizard.submission.submitError} t={t} />
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col gap-6">
          {wizard.stepper.currentStep === 0 ? <PatientsStep {...wizard.patientsStep} t={t} /> : null}

          {wizard.stepper.currentStep === 1 ? <BotStep {...wizard.botStep} t={t} /> : null}

          {wizard.stepper.currentStep === 2 ? <ConfigStep {...wizard.configStep} t={t} /> : null}

          {wizard.stepper.currentStep === 3 ? (
            <ReviewStep draft={wizard.reviewStep.draft} payload={wizard.reviewStep.payload} t={t} />
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col-reverse gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        {wizard.stepper.currentStep === 0 ? (
          <span className="hidden sm:block" />
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={wizard.stepper.onPreviousStep}
            disabled={wizard.submission.isSubmitting}
            className="w-full sm:w-auto"
          >
            <IconArrowLeft data-icon="inline-start" />
            {t('buttons.back')}
          </Button>
        )}

        {wizard.stepper.currentStep < executionWizardSteps.length - 1 ? (
          <Button type="button" onClick={wizard.stepper.onNextStep} className="w-full sm:w-auto">
            {t('buttons.next')}
            <IconArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void wizard.submission.onSubmit()}
            disabled={wizard.submission.isSubmitting}
            className="w-full sm:w-auto"
          >
            {wizard.submission.isSubmitting ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <IconSend2 data-icon="inline-start" />
            )}
            {wizard.submission.isSubmitting ? t('buttons.submitting') : t('buttons.submit')}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
