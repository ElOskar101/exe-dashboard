import type { TFunction } from 'i18next'
import type {
  ExecutionCreatePayload,
  ExecutionMetadata,
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

const parseJsonObjectString = (value: string): ExecutionMetadata | string => {
  try {
    const parsed = JSON.parse(value)

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return value
    }

    return parsed as ExecutionMetadata
  } catch {
    return value
  }
}

const getReviewPatientRows = (patients: ExecutionPatient[]): ExecutionPatient[] => {
  return patients.length > 0
    ? patients
    : [
        {
          patientName: '',
          patientLastName: '',
          patientMemberId: '',
          patientDob: '',
          policyHolderName: '',
          policyHolderLastName: '',
          policyHolderDob: '',
          relationship: '',
          zipCode: '',
          clinic: '',
          verificationType: '',
          filenames: '',
          otherInformation: '',
        },
      ]
}

export function ReviewStep({ draft, payload, t }: ReviewStepProps) {
  const emptyValue = t('review.emptyValue')
  const patients = getReviewPatientRows(draft.execution.patients)
  const reviewPayload = payload ?? {
    project: draft.context.project.trim(),
    client: draft.context.client.trim(),
    clinic: draft.context.clinic.trim(),
    ...(draft.execution.execution.trim() ? { execution: draft.execution.execution.trim() } : {}),
    botName: draft.bot.botName.trim(),
    meta: {
      bot: {
        botName: draft.bot.botName.trim(),
        targetUrl: draft.bot.url.trim(),
        username: draft.bot.username.trim(),
        password: draft.bot.password,
        otherInformation: draft.bot.otherInformation,
      },
      patients: draft.execution.patients.map((patient) => ({
        patientName: patient.patientName.trim(),
        patientLastName: patient.patientLastName.trim(),
        patientMemberId: patient.patientMemberId.trim(),
        patientDob: patient.patientDob,
        policyHolderName: patient.policyHolderName.trim(),
        policyHolderLastName: patient.policyHolderLastName.trim(),
        policyHolderDob: patient.policyHolderDob,
        relationship: patient.relationship.trim(),
        zipCode: patient.zipCode.trim(),
        clinic: patient.clinic.trim(),
        verificationType: patient.verificationType.toLowerCase(),
        filenames: patient.filenames.trim(),
        otherInformation: patient.otherInformation,
      })),
      config: parseJsonObjectString(draft.execution.config),
      rv: {},
      workers: draft.execution.workers.trim() ? Number(draft.execution.workers) : '',
      retries: draft.execution.retries.trim() ? Number(draft.execution.retries) : '',
    },
  }

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="min-w-0 flex flex-col gap-6">
        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.project')}</dt>
              <dd className="mt-1 font-medium">{getDisplayValue(draft.context.project, emptyValue)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.client')}</dt>
              <dd className="mt-1 font-medium">{getDisplayValue(draft.context.clientName, emptyValue)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.clinic')}</dt>
              <dd className="mt-1 font-medium">{getDisplayValue(draft.context.clinicName, emptyValue)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.botName')}</dt>
              <dd className="mt-1 font-medium">{getDisplayValue(draft.bot.botName, emptyValue)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.username')}</dt>
              <dd className="mt-1 font-medium">{getDisplayValue(draft.bot.username, emptyValue)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">{t('fields.url')}</dt>
              <dd className="mt-1 break-all font-medium">{getDisplayValue(draft.bot.url, emptyValue)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
          <div className="flex flex-col gap-3">
            {patients.map((patient, index) => (
              <div
                key={`${patient.patientMemberId}-${index}`}
                className="grid gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3 sm:grid-cols-3"
              >
                <div>
                  <p className="text-sm text-muted-foreground">{t('fields.patientName')}</p>
                  <p className="mt-1 font-medium">{getDisplayValue(patient.patientName, emptyValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('fields.memberId')}</p>
                  <p className="mt-1 font-medium">{getDisplayValue(patient.patientMemberId, emptyValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('fields.patientDob')}</p>
                  <p className="mt-1 font-medium">{getDisplayValue(patient.patientDob, emptyValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('fields.relationship')}</p>
                  <p className="mt-1 font-medium">{getDisplayValue(patient.relationship, emptyValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('fields.patientClinic')}</p>
                  <p className="mt-1 font-medium">{getDisplayValue(patient.clinic, emptyValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('fields.verificationType')}</p>
                  <p className="mt-1 font-medium">{patient.verificationType || emptyValue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.workers')}</dt>
              <dd className="mt-1 font-medium">{getDisplayValue(draft.execution.workers, emptyValue)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.retries')}</dt>
              <dd className="mt-1 font-medium">{getDisplayValue(draft.execution.retries, emptyValue)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">{t('fields.execution')}</dt>
              <dd className="mt-1 font-medium">
                {getDisplayValue(draft.execution.executionName || draft.execution.execution, emptyValue)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex max-h-[calc(100vh-14rem)] min-h-0 min-w-0 flex-col rounded-3xl border border-border/70 bg-card p-4">
        <pre className="min-h-0 min-w-0 flex-1 overflow-auto whitespace-pre-wrap break-all rounded-2xl bg-muted/70 p-4 text-xs leading-6">
          {JSON.stringify(reviewPayload, null, 2)}
        </pre>
      </div>
    </div>
  )
}
