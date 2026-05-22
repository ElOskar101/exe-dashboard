import type { TFunction } from 'i18next'
import type {
  ExecutionCreatePayload,
  ExecutionPatient,
  ExecutionWizardDraft,
} from '../../model/execution-create'

interface ReviewStepProps {
  draft: ExecutionWizardDraft
  payload: ExecutionCreatePayload | null
  t: TFunction<'executions'>
}

const getDisplayValue = (value: string, emptyValue: string) => {
  return value.trim() || emptyValue
}

const getReviewPatientRows = (
  patients: ExecutionPatient[],
): ExecutionPatient[] => {
  return patients.length > 0
    ? patients
    : [{ patientName: '', memberId: '', dateOfBirth: '' }]
}

export function ReviewStep({ draft, payload, t }: ReviewStepProps) {
  const emptyValue = t('review.emptyValue')
  const enabledFlags =
    [
      draft.config['in-network'] ? t('fields.inNetwork') : null,
      draft.config.shortForm ? t('fields.shortForm') : null,
      draft.config.claimsForm ? t('fields.claimsForm') : null,
    ]
      .filter(Boolean)
      .join(', ') || t('review.noFlags')
  const patients = getReviewPatientRows(draft.execution.patients)
  const reviewPayload =
    payload ??
    ({
      bot: {
        botName: draft.bot.botName.trim(),
        url: draft.bot.url.trim(),
        username: draft.bot.username.trim(),
        password: draft.bot.password,
      },
      execution: {
        patients: draft.execution.patients.map((patient) => ({
          patientName: patient.patientName.trim(),
          memberId: patient.memberId.trim(),
          dateOfBirth: patient.dateOfBirth,
        })),
        numberOfThreads: draft.execution.numberOfThreads.trim()
          ? Number(draft.execution.numberOfThreads)
          : '',
        mode: draft.execution.mode === 'parallel' ? 'parallel' : '',
        verificationType: draft.execution.verificationType,
      },
      config: draft.config,
    } as const)

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('fields.botName')}
              </dt>
              <dd className="mt-1 font-medium">
                {getDisplayValue(draft.bot.botName, emptyValue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('fields.username')}
              </dt>
              <dd className="mt-1 font-medium">
                {getDisplayValue(draft.bot.username, emptyValue)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">
                {t('fields.url')}
              </dt>
              <dd className="mt-1 break-all font-medium">
                {getDisplayValue(draft.bot.url, emptyValue)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
          <div className="flex flex-col gap-3">
            {patients.map((patient, index) => (
              <div
                key={`${patient.memberId}-${index}`}
                className="grid gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3 sm:grid-cols-3"
              >
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('fields.patientName')}
                  </p>
                  <p className="mt-1 font-medium">
                    {getDisplayValue(patient.patientName, emptyValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('fields.memberId')}
                  </p>
                  <p className="mt-1 font-medium">
                    {getDisplayValue(patient.memberId, emptyValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('fields.dateOfBirth')}
                  </p>
                  <p className="mt-1 font-medium">
                    {getDisplayValue(patient.dateOfBirth, emptyValue)}
                  </p>
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
                {getDisplayValue(draft.execution.numberOfThreads, emptyValue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('fields.verificationType')}
              </dt>
              <dd className="mt-1 font-medium">
                {draft.execution.verificationType || emptyValue}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('fields.mode')}
              </dt>
              <dd className="mt-1 font-medium">
                {draft.execution.mode
                  ? draft.execution.mode === 'parallel'
                    ? t('options.modeParallel')
                    : t('options.modeStandard')
                  : emptyValue}
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
          {JSON.stringify(reviewPayload, null, 2)}
        </pre>
      </div>
    </div>
  )
}
