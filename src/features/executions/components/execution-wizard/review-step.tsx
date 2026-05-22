import type { TFunction } from 'i18next'
import type { ExecutionCreatePayload } from '../../model/execution-create'

interface ReviewStepProps {
  payload: ExecutionCreatePayload
  t: TFunction<'executions'>
}

export function ReviewStep({ payload, t }: ReviewStepProps) {
  const enabledFlags =
    [
      payload.config['in-network'] ? t('fields.inNetwork') : null,
      payload.config.shortForm ? t('fields.shortForm') : null,
      payload.config.claimsForm ? t('fields.claimsForm') : null,
    ]
      .filter(Boolean)
      .join(', ') || t('review.noFlags')

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('fields.botName')}
              </dt>
              <dd className="mt-1 font-medium">{payload.bot.botName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('fields.username')}
              </dt>
              <dd className="mt-1 font-medium">{payload.bot.username}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">
                {t('fields.url')}
              </dt>
              <dd className="mt-1 break-all font-medium">{payload.bot.url}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
          <div className="flex flex-col gap-3">
            {payload.execution.patients.map((patient, index) => (
              <div
                key={`${patient.memberId}-${index}`}
                className="grid gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3 sm:grid-cols-3"
              >
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('fields.patientName')}
                  </p>
                  <p className="mt-1 font-medium">{patient.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('fields.memberId')}
                  </p>
                  <p className="mt-1 font-medium">{patient.memberId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('fields.dateOfBirth')}
                  </p>
                  <p className="mt-1 font-medium">{patient.dateOfBirth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('fields.numberOfThreads')}
              </dt>
              <dd className="mt-1 font-medium">
                {payload.execution.numberOfThreads}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('fields.verificationType')}
              </dt>
              <dd className="mt-1 font-medium">
                {payload.execution.verificationType}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('fields.mode')}
              </dt>
              <dd className="mt-1 font-medium">
                {payload.execution.mode === 'parallel'
                  ? t('options.modeParallel')
                  : t('options.modeStandard')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('review.flagsTitle')}
              </dt>
              <dd className="mt-1 font-medium">{enabledFlags}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex max-h-[calc(100vh-14rem)] min-h-0 flex-col rounded-3xl border border-border/70 bg-card p-4">
        <pre className="min-h-0 flex-1 overflow-auto rounded-2xl bg-muted/70 p-4 text-xs leading-6">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>
    </div>
  )
}
