import type { TFunction } from 'i18next'
import type { ExecutionCreatePayload, ExecutionSchedulePayload, ExecutionWizardDraft } from '../model/execution-create'
import { createDefaultBotOtherInformation } from '../lib/execution-wizard-payload'
import {
  getExecutionWizardDisplayValue,
  getExecutionWizardPatientFullName,
  parseExecutionMetadataString,
} from '../lib/execution-wizard-display'

interface ReviewStepProps {
  draft: ExecutionWizardDraft
  payload: ExecutionCreatePayload | ExecutionSchedulePayload | null
  t: TFunction<'executions'>
}

export function ReviewStep({ draft, payload, t }: ReviewStepProps) {
  const emptyValue = t('review.emptyValue')
  const patients = draft.execution.patients
  const selectedExecution = draft.execution.executionName.trim() || draft.execution.execution.trim()
  const reviewPayload = payload ?? {
    project: draft.context.project.trim(),
    client: draft.context.client.trim(),
    clinic: draft.context.clinic.trim(),
    ...(selectedExecution ? { execution: selectedExecution } : {}),
    botName: draft.bot.botName.trim(),
    ...(draft.execution.scheduleMode === 'scheduled' && draft.execution.scheduledAt
      ? { scheduledAt: new Date(draft.execution.scheduledAt).toISOString() }
      : {}),
    meta: {
      bot: {
        botName: draft.bot.botName.trim(),
        targetUrl: draft.bot.targetUrl.trim(),
        username: draft.bot.username.trim(),
        password: draft.bot.password,
        otherInformation: createDefaultBotOtherInformation(),
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
        ...(patient.clinic.trim() ? { clinic: patient.clinic.trim() } : {}),
        verificationType: patient.verificationType.toLowerCase(),
        filenames: patient.filenames.trim(),
        otherInformation: patient.otherInformation,
      })),
      config: parseExecutionMetadataString(draft.execution.config),
      rv: {},
      workers: draft.execution.workers.trim() ? Number(draft.execution.workers) : '',
      retries: draft.execution.retries.trim() ? Number(draft.execution.retries) : '',
    },
  }

  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
      <div className="min-w-0 flex flex-col gap-6">
        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.client')}</dt>
              <dd className="mt-1 font-medium">
                {getExecutionWizardDisplayValue(draft.context.clientName, emptyValue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.clinic')}</dt>
              <dd className="mt-1 font-medium">
                {getExecutionWizardDisplayValue(draft.context.clinicName, emptyValue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.botName')}</dt>
              <dd className="mt-1 font-medium">{getExecutionWizardDisplayValue(draft.bot.botName, emptyValue)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('fields.username')} / {t('fields.password')}
              </dt>
              <dd className="mt-1 font-medium">
                {getExecutionWizardDisplayValue(draft.bot.username, emptyValue)} /{' '}
                {getExecutionWizardDisplayValue(draft.bot.password, emptyValue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.url')}</dt>
              <dd className="mt-1 break-all font-medium">
                {getExecutionWizardDisplayValue(draft.bot.targetUrl, emptyValue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.execution')}</dt>
              <dd className="mt-1 font-medium">
                {getExecutionWizardDisplayValue(draft.execution.executionName || draft.execution.execution, emptyValue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.scheduleMode')}</dt>
              <dd className="mt-1 font-medium">
                {draft.execution.scheduleMode === 'scheduled'
                  ? t('options.scheduleScheduled')
                  : t('options.scheduleInstant')}
              </dd>
            </div>
            {draft.execution.scheduleMode === 'scheduled' ? (
              <div>
                <dt className="text-sm text-muted-foreground">{t('fields.scheduledAt')}</dt>
                <dd className="mt-1 font-medium">
                  {getExecutionWizardDisplayValue(draft.execution.scheduledAt, emptyValue)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="max-h-[26rem] overflow-auto rounded-2xl border border-border/70 bg-muted/40 md:max-h-48">
          {patients.length > 0 ? (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {patients.map((patient, index) => (
                  <div
                    key={`${patient.patientMemberId}-${index}`}
                    className="rounded-2xl border border-border/60 bg-background/60 p-3"
                  >
                    <p className="font-medium">{getExecutionWizardPatientFullName(patient, emptyValue)}</p>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-muted-foreground">{t('fields.patientDob')}</dt>
                        <dd className="mt-1 text-sm font-medium">
                          {getExecutionWizardDisplayValue(patient.patientDob, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">{t('fields.memberId')}</dt>
                        <dd className="mt-1 text-sm font-medium">
                          {getExecutionWizardDisplayValue(patient.patientMemberId, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">{t('fields.relationship')}</dt>
                        <dd className="mt-1 text-sm font-medium">
                          {getExecutionWizardDisplayValue(patient.relationship, emptyValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">{t('fields.verificationType')}</dt>
                        <dd className="mt-1 text-sm font-medium">{patient.verificationType || emptyValue}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="sticky top-0 bg-muted/70">
                    <tr className="border-b border-border/70">
                      <th className="px-3 py-2 font-medium text-muted-foreground">{t('fields.patientName')}</th>
                      <th className="px-3 py-2 font-medium text-muted-foreground">{t('fields.patientDob')}</th>
                      <th className="px-3 py-2 font-medium text-muted-foreground">{t('fields.memberId')}</th>
                      <th className="px-3 py-2 font-medium text-muted-foreground">{t('fields.relationship')}</th>
                      <th className="px-3 py-2 font-medium text-muted-foreground">{t('fields.verificationType')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient, index) => (
                      <tr
                        key={`${patient.patientMemberId}-${index}`}
                        className="border-b border-border/50 last:border-b-0"
                      >
                        <td className="px-3 py-2 font-medium">
                          {getExecutionWizardPatientFullName(patient, emptyValue)}
                        </td>
                        <td className="px-3 py-2">{getExecutionWizardDisplayValue(patient.patientDob, emptyValue)}</td>
                        <td className="px-3 py-2">
                          {getExecutionWizardDisplayValue(patient.patientMemberId, emptyValue)}
                        </td>
                        <td className="px-3 py-2">
                          {getExecutionWizardDisplayValue(patient.relationship, emptyValue)}
                        </td>
                        <td className="px-3 py-2">{patient.verificationType || emptyValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-3">
              <p className="font-medium text-muted-foreground">{t('review.noPatients')}</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.workers')}</dt>
              <dd className="mt-1 font-medium">
                {getExecutionWizardDisplayValue(draft.execution.workers, emptyValue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.retries')}</dt>
              <dd className="mt-1 font-medium">
                {getExecutionWizardDisplayValue(draft.execution.retries, emptyValue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('fields.project')}</dt>
              <dd className="mt-1 font-medium">{getExecutionWizardDisplayValue(draft.context.project, emptyValue)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex max-h-[24rem] min-h-0 min-w-0 flex-col rounded-3xl border border-border/70 bg-card p-4 sm:max-h-96">
        <pre className="min-h-0 min-w-0 flex-1 overflow-auto whitespace-pre-wrap break-all rounded-2xl bg-muted/70 p-4 text-xs leading-6">
          {JSON.stringify(reviewPayload, null, 2)}
        </pre>
      </div>
    </div>
  )
}
