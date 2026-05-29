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
    <div className="rounded-[2rem] bg-muted/20 p-1 sm:p-2 shadow-inner shadow-foreground/5">
      <ol
        className={cn(
          'grid min-w-full gap-2 md:grid-cols-4 grid-cols-2',
          steps.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4',
        )}
      >
        {steps.map((step, index) => {
          const isActiveStep = currentStep === index
          const hasIncompleteStepInfo = stepNeedsAttention[index]

          return (
            <li key={step} className="">
              <button
                type="button"
                aria-current={isActiveStep ? 'step' : undefined}
                onClick={() => onStepChange(index)}
                className={cn(
                  'group relative flex h-full w-full items-center gap-2 sm:gap-3 rounded-[1.65rem] border border-transparent bg-card p-2.5 text-left transition-[background-color,border-color,box-shadow,transform] outline-none hover:bg-background/85 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:p-3',
                  isActiveStep &&
                    'border-border/60 bg-background shadow-sm shadow-foreground/5 ring-1 ring-foreground/5 hover:bg-background',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 sm:size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground transition-colors',
                    isActiveStep && 'border-primary bg-primary text-primary-foreground',
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate font-medium', isActiveStep && 'text-foreground')}>
                    {t(`steps.${step}.title`)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {t('steps.stepCounter', {
                      current: index + 1,
                      total: steps.length,
                    })}
                  </span>
                </span>
                {hasIncompleteStepInfo ? (
                  <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-destructive" />
                ) : null}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
