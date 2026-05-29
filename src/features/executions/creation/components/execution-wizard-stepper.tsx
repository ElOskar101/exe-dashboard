import type { TFunction } from 'i18next'
import { cn } from '@/lib/utils'
import type { ExecutionWizardStepKey, useExecutionWizard } from '../hooks/use-execution-wizard'

interface ExecutionWizardStepperProps {
  steps: ExecutionWizardStepKey[]
  currentStep: number
  stepNeedsAttention: boolean[]
  onStepChange: ReturnType<typeof useExecutionWizard>['handleStepChange']
  t: TFunction<'executions'>
}

export function ExecutionWizardStepper({
  steps,
  currentStep,
  stepNeedsAttention,
  onStepChange,
  t,
}: ExecutionWizardStepperProps) {
  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <ol
        className={cn(
          'flex min-w-full gap-3 px-1 md:grid md:px-0',
          steps.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4',
        )}
      >
        {steps.map((step, index) => {
          const isActiveStep = currentStep === index
          const hasIncompleteStepInfo = stepNeedsAttention[index]

          return (
            <li key={step} className="min-w-[13rem] flex-1 md:min-w-0">
              <button
                type="button"
                aria-current={isActiveStep ? 'step' : undefined}
                onClick={() => onStepChange(index)}
                className={cn(
                  'relative flex h-full w-full flex-col rounded-3xl border border-border/70 bg-muted/20 p-3.5 text-left transition-[background-color,border-color,box-shadow] outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:p-4',
                  isActiveStep && 'bg-card/40 shadow-sm ring-2 ring-secondary hover:bg-card/40',
                )}
              >
                {hasIncompleteStepInfo ? (
                  <span aria-hidden="true" className="absolute top-4 right-4 size-2.5 rounded-full bg-destructive" />
                ) : null}
                <span className="pr-5 font-medium">{t(`steps.${step}.title`)}</span>
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
    </div>
  )
}
