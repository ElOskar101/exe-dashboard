import type { TFunction } from 'i18next'
import { cn } from '@/lib/utils'
import type {
  ExecutionWizardStepKey,
  useExecutionWizard,
} from '../../hooks/use-execution-wizard'

interface ExecutionWizardStepperProps {
  steps: ExecutionWizardStepKey[]
  currentStep: number
  onStepChange: ReturnType<typeof useExecutionWizard>['setCurrentStep']
  t: TFunction<'executions'>
}

export function ExecutionWizardStepper({
  steps,
  currentStep,
  onStepChange,
  t,
}: ExecutionWizardStepperProps) {
  return (
    <ol className="grid gap-3 md:grid-cols-4">
      {steps.map((step, index) => {
        const isActiveStep = currentStep === index

        return (
          <li key={step}>
            <button
              type="button"
              aria-current={isActiveStep ? 'step' : undefined}
              onClick={() => onStepChange(index)}
              className={cn(
                'relative flex h-full w-full flex-col rounded-3xl border border-border/70 bg-muted/20 p-4 text-left transition-[background-color,border-color,box-shadow] outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
                isActiveStep &&
                  'border-primary/50 bg-card shadow-sm ring-2 ring-primary/20 hover:bg-card',
              )}
            >
              {isActiveStep ? (
                <span
                  aria-hidden="true"
                  className="absolute top-4 right-4 size-2.5 rounded-full bg-primary"
                />
              ) : null}
              <span className="pr-5 font-medium">
                {t(`steps.${step}.title`)}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {t('steps.stepCounter', {
                  current: index + 1,
                  total: steps.length,
                })}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
