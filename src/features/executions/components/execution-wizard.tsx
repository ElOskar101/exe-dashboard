import { useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { createExecution } from '../api/execution.service'
import type { IExecution } from '../model/execution.interface'
import type {
  ExecutionCreatePayload,
  ExecutionModeOption,
  ExecutionPatient,
  ExecutionVerificationType,
  ExecutionWizardDraft,
} from '../model/execution-create'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconLoader2,
  IconPlus,
  IconRefresh,
  IconRocket,
  IconSend2,
  IconTrash,
} from '@tabler/icons-react'

type StepKey = 'bot' | 'patients' | 'config' | 'review'

type StepErrors = {
  bot: Partial<Record<keyof ExecutionWizardDraft['bot'], string>>
  patients: {
    form?: string
    rows: Array<Partial<Record<keyof ExecutionPatient, string>>>
  }
  config: {
    numberOfThreads?: string
    mode?: string
    verificationType?: string
  }
}

const steps: StepKey[] = ['bot', 'patients', 'config', 'review']

const createEmptyPatient = (): ExecutionPatient => ({
  patientName: '',
  memberId: '',
  dateOfBirth: '',
})

const createEmptyDraft = (): ExecutionWizardDraft => ({
  bot: {
    botName: '',
    url: '',
    username: '',
    password: '',
  },
  execution: {
    patients: [createEmptyPatient()],
    numberOfThreads: '',
    mode: '',
    verificationType: '',
  },
  config: {
    'in-network': false,
    shortForm: false,
    claimsForm: false,
  },
})

const isDateStringValid = (value: string) => {
  if (!value) {
    return false
  }

  return !Number.isNaN(Date.parse(value))
}

const getValidationErrors = (
  draft: ExecutionWizardDraft,
  t: TFunction<'executions'>,
): StepErrors => {
  const bot: StepErrors['bot'] = {}

  if (!draft.bot.botName.trim()) {
    bot.botName = t('validation.required')
  }

  if (!draft.bot.url.trim()) {
    bot.url = t('validation.required')
  } else if (!URL.canParse(draft.bot.url)) {
    bot.url = t('validation.validUrl')
  }

  if (!draft.bot.username.trim()) {
    bot.username = t('validation.required')
  }

  if (!draft.bot.password.trim()) {
    bot.password = t('validation.required')
  }

  const patients = draft.execution.patients.map((patient) => {
    const rowErrors: StepErrors['patients']['rows'][number] = {}

    if (!patient.patientName.trim()) {
      rowErrors.patientName = t('validation.required')
    }

    if (!patient.memberId.trim()) {
      rowErrors.memberId = t('validation.required')
    }

    if (!patient.dateOfBirth.trim()) {
      rowErrors.dateOfBirth = t('validation.required')
    } else if (!isDateStringValid(patient.dateOfBirth)) {
      rowErrors.dateOfBirth = t('validation.validDate')
    }

    return rowErrors
  })

  const config: StepErrors['config'] = {}

  if (!draft.execution.numberOfThreads.trim()) {
    config.numberOfThreads = t('validation.required')
  } else if (
    !Number.isInteger(Number(draft.execution.numberOfThreads)) ||
    Number(draft.execution.numberOfThreads) <= 0
  ) {
    config.numberOfThreads = t('validation.positiveNumber')
  }

  if (!draft.execution.mode) {
    config.mode = t('validation.selectMode')
  }

  if (!draft.execution.verificationType) {
    config.verificationType = t('validation.selectVerificationType')
  }

  return {
    bot,
    patients: {
      form:
        draft.execution.patients.length === 0
          ? t('validation.addPatient')
          : undefined,
      rows: patients,
    },
    config,
  }
}

const hasErrors = (errors: Record<string, string | undefined>) => {
  return Object.values(errors).some(Boolean)
}

const buildPayload = (
  draft: ExecutionWizardDraft,
): ExecutionCreatePayload | null => {
  if (
    !draft.execution.numberOfThreads.trim() ||
    !draft.execution.mode ||
    !draft.execution.verificationType
  ) {
    return null
  }

  return {
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
      numberOfThreads: Number(draft.execution.numberOfThreads),
      mode: draft.execution.mode === 'parallel' ? 'parallel' : '',
      verificationType: draft.execution.verificationType,
    },
    config: draft.config,
  }
}

const formatDateTime = (value?: string) => {
  if (!value) {
    return '—'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

const getRequestErrorMessage = (error: unknown, fallbackMessage: string) => {
  const requestError = error as AxiosError<{ message?: string }>

  return requestError.response?.data?.message || fallbackMessage
}

export default function ExecutionWizard() {
  const { t } = useTranslation('executions')
  const [draft, setDraft] = useState<ExecutionWizardDraft>(() =>
    createEmptyDraft(),
  )
  const [currentStep, setCurrentStep] = useState(0)
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>(
    {},
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdExecution, setCreatedExecution] = useState<IExecution | null>(
    null,
  )

  const validationErrors = useMemo(
    () => getValidationErrors(draft, t),
    [draft, t],
  )
  const payloadPreview = useMemo(() => buildPayload(draft), [draft])

  const stepValidity = [
    !hasErrors(validationErrors.bot),
    !validationErrors.patients.form &&
      validationErrors.patients.rows.every((row) => !hasErrors(row)),
    !hasErrors(validationErrors.config),
    Boolean(payloadPreview),
  ]

  const showBotErrors = Boolean(attemptedSteps[0])
  const showPatientErrors = Boolean(attemptedSteps[1])
  const showConfigErrors = Boolean(attemptedSteps[2])

  const updateBotField = (
    field: keyof ExecutionWizardDraft['bot'],
    value: string,
  ) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      bot: {
        ...previousDraft.bot,
        [field]: value,
      },
    }))
  }

  const updatePatientField = (
    index: number,
    field: keyof ExecutionPatient,
    value: string,
  ) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        patients: previousDraft.execution.patients.map(
          (patient, patientIndex) =>
            patientIndex === index ? { ...patient, [field]: value } : patient,
        ),
      },
    }))
  }

  const addPatient = () => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        patients: [...previousDraft.execution.patients, createEmptyPatient()],
      },
    }))
  }

  const removePatient = (index: number) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        patients:
          previousDraft.execution.patients.length === 1
            ? [createEmptyPatient()]
            : previousDraft.execution.patients.filter(
                (_, patientIndex) => patientIndex !== index,
              ),
      },
    }))
  }

  const updateConfigField = (
    field: keyof ExecutionWizardDraft['config'],
    value: boolean,
  ) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      config: {
        ...previousDraft.config,
        [field]: value,
      },
    }))
  }

  const updateMode = (value: ExecutionModeOption) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        mode: value,
      },
    }))
  }

  const updateVerificationType = (value: ExecutionVerificationType | '') => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        verificationType: value,
      },
    }))
  }

  const handleNextStep = () => {
    if (!stepValidity[currentStep]) {
      setAttemptedSteps((previousAttempts) => ({
        ...previousAttempts,
        [currentStep]: true,
      }))

      return
    }

    setSubmitError(null)
    setCurrentStep((previousStep) =>
      Math.min(previousStep + 1, steps.length - 1),
    )
  }

  const handlePreviousStep = () => {
    setSubmitError(null)
    setCurrentStep((previousStep) => Math.max(previousStep - 1, 0))
  }

  const resetWizard = () => {
    setDraft(createEmptyDraft())
    setCurrentStep(0)
    setAttemptedSteps({})
    setSubmitError(null)
    setCreatedExecution(null)
    setIsSubmitting(false)
  }

  const handleSubmit = async () => {
    setAttemptedSteps((previousAttempts) => ({
      ...previousAttempts,
      3: true,
    }))

    if (!payloadPreview) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await createExecution(payloadPreview)

      setCreatedExecution(response.data)
    } catch (error) {
      setSubmitError(
        getRequestErrorMessage(error, t('submit.errorDescription')),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (createdExecution) {
    return (
      <Card className="mx-auto my-6 w-full max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCheck />
            {t('success.title')}
          </CardTitle>
          <CardDescription>{t('success.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Alert>
            <IconRocket />
            <AlertTitle>{t('success.alertTitle')}</AlertTitle>
            <AlertDescription>{t('success.alertDescription')}</AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                {t('success.executionId')}
              </p>
              <p className="mt-1 text-base font-medium">
                {createdExecution._id}
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                {t('success.status')}
              </p>
              <p className="mt-1 text-base font-medium capitalize">
                {createdExecution.status}
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                {t('success.createdAt')}
              </p>
              <p className="mt-1 text-base font-medium">
                {formatDateTime(createdExecution.createdAt)}
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                {t('success.jobId')}
              </p>
              <p className="mt-1 text-base font-medium">
                {createdExecution.jobId || '—'}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border">
          <Button onClick={resetWizard}>
            <IconRefresh data-icon="inline-start" />
            {t('buttons.startOver')}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="mx-auto my-6 w-full max-w-5xl">
      <CardHeader>
        <CardTitle>{t('page.title')}</CardTitle>
        <CardDescription>{t('page.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ol className="grid gap-3 md:grid-cols-4">
          {steps.map((step, index) => {
            const isActiveStep = currentStep === index

            return (
              <li key={step}>
                <button
                  type="button"
                  aria-current={isActiveStep ? 'step' : undefined}
                  onClick={() => setCurrentStep(index)}
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

        <Separator />

        {submitError ? (
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>{t('submit.errorTitle')}</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-6">
          {currentStep === 0 ? (
            <FieldSet>
              <FieldGroup className="md:grid md:grid-cols-2">
                <Field
                  data-invalid={
                    showBotErrors && Boolean(validationErrors.bot.botName)
                  }
                >
                  <FieldLabel htmlFor="botName">
                    {t('fields.botName')}
                  </FieldLabel>
                  <Input
                    id="botName"
                    value={draft.bot.botName}
                    onChange={(event) =>
                      updateBotField('botName', event.target.value)
                    }
                    aria-invalid={
                      showBotErrors && Boolean(validationErrors.bot.botName)
                    }
                    placeholder={t('placeholders.botName')}
                  />
                  <FieldError>
                    {showBotErrors ? validationErrors.bot.botName : null}
                  </FieldError>
                </Field>

                <Field
                  data-invalid={
                    showBotErrors && Boolean(validationErrors.bot.url)
                  }
                >
                  <FieldLabel htmlFor="botUrl">{t('fields.url')}</FieldLabel>
                  <Input
                    id="botUrl"
                    type="url"
                    value={draft.bot.url}
                    onChange={(event) =>
                      updateBotField('url', event.target.value)
                    }
                    aria-invalid={
                      showBotErrors && Boolean(validationErrors.bot.url)
                    }
                    placeholder={t('placeholders.url')}
                  />
                  <FieldError>
                    {showBotErrors ? validationErrors.bot.url : null}
                  </FieldError>
                </Field>

                <Field
                  data-invalid={
                    showBotErrors && Boolean(validationErrors.bot.username)
                  }
                >
                  <FieldLabel htmlFor="botUsername">
                    {t('fields.username')}
                  </FieldLabel>
                  <Input
                    id="botUsername"
                    value={draft.bot.username}
                    onChange={(event) =>
                      updateBotField('username', event.target.value)
                    }
                    aria-invalid={
                      showBotErrors && Boolean(validationErrors.bot.username)
                    }
                    placeholder={t('placeholders.username')}
                  />
                  <FieldError>
                    {showBotErrors ? validationErrors.bot.username : null}
                  </FieldError>
                </Field>

                <Field
                  data-invalid={
                    showBotErrors && Boolean(validationErrors.bot.password)
                  }
                >
                  <FieldLabel htmlFor="botPassword">
                    {t('fields.password')}
                  </FieldLabel>
                  <Input
                    id="botPassword"
                    type="password"
                    value={draft.bot.password}
                    onChange={(event) =>
                      updateBotField('password', event.target.value)
                    }
                    aria-invalid={
                      showBotErrors && Boolean(validationErrors.bot.password)
                    }
                    placeholder={t('placeholders.password')}
                  />
                  <FieldError>
                    {showBotErrors ? validationErrors.bot.password : null}
                  </FieldError>
                </Field>
              </FieldGroup>
            </FieldSet>
          ) : null}

          {currentStep === 1 ? (
            <FieldSet>
              <FieldGroup>
                {validationErrors.patients.form && showPatientErrors ? (
                  <Alert variant="destructive">
                    <IconAlertCircle />
                    <AlertTitle>{t('validation.patientListTitle')}</AlertTitle>
                    <AlertDescription>
                      {validationErrors.patients.form}
                    </AlertDescription>
                  </Alert>
                ) : null}

                {draft.execution.patients.map((patient, index) => {
                  const rowErrors = validationErrors.patients.rows[index] || {}

                  return (
                    <div
                      key={`patient-${index}`}
                      className="rounded-3xl border border-border/70 bg-muted/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">
                          {t('sections.patients.patientTitle', {
                            index: index + 1,
                          })}
                        </p>
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => removePatient(index)}
                          aria-label={t('buttons.removePatient')}
                        >
                          <IconTrash data-icon="inline-start" />
                          {t('buttons.removePatient')}
                        </Button>
                      </div>

                      <FieldGroup className="mt-4 md:grid md:grid-cols-2">
                        <Field
                          data-invalid={
                            showPatientErrors && Boolean(rowErrors.patientName)
                          }
                        >
                          <FieldLabel htmlFor={`patientName-${index}`}>
                            {t('fields.patientName')}
                          </FieldLabel>
                          <Input
                            id={`patientName-${index}`}
                            value={patient.patientName}
                            onChange={(event) =>
                              updatePatientField(
                                index,
                                'patientName',
                                event.target.value,
                              )
                            }
                            aria-invalid={
                              showPatientErrors &&
                              Boolean(rowErrors.patientName)
                            }
                            placeholder={t('placeholders.patientName')}
                          />
                          <FieldError>
                            {showPatientErrors ? rowErrors.patientName : null}
                          </FieldError>
                        </Field>

                        <Field
                          data-invalid={
                            showPatientErrors && Boolean(rowErrors.memberId)
                          }
                        >
                          <FieldLabel htmlFor={`memberId-${index}`}>
                            {t('fields.memberId')}
                          </FieldLabel>
                          <Input
                            id={`memberId-${index}`}
                            value={patient.memberId}
                            onChange={(event) =>
                              updatePatientField(
                                index,
                                'memberId',
                                event.target.value,
                              )
                            }
                            aria-invalid={
                              showPatientErrors && Boolean(rowErrors.memberId)
                            }
                            placeholder={t('placeholders.memberId')}
                          />
                          <FieldError>
                            {showPatientErrors ? rowErrors.memberId : null}
                          </FieldError>
                        </Field>

                        <Field
                          data-invalid={
                            showPatientErrors && Boolean(rowErrors.dateOfBirth)
                          }
                        >
                          <FieldLabel htmlFor={`dateOfBirth-${index}`}>
                            {t('fields.dateOfBirth')}
                          </FieldLabel>
                          <Input
                            id={`dateOfBirth-${index}`}
                            type="date"
                            value={patient.dateOfBirth}
                            onChange={(event) =>
                              updatePatientField(
                                index,
                                'dateOfBirth',
                                event.target.value,
                              )
                            }
                            aria-invalid={
                              showPatientErrors &&
                              Boolean(rowErrors.dateOfBirth)
                            }
                          />
                          <FieldError>
                            {showPatientErrors ? rowErrors.dateOfBirth : null}
                          </FieldError>
                        </Field>
                      </FieldGroup>
                    </div>
                  )
                })}

                <Button type="button" variant="outline" onClick={addPatient}>
                  <IconPlus data-icon="inline-start" />
                  {t('buttons.addPatient')}
                </Button>
              </FieldGroup>
            </FieldSet>
          ) : null}

          {currentStep === 2 ? (
            <FieldSet>
              <FieldGroup className="grid items-stretch gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]">
                <FieldGroup>
                  <Field
                    data-invalid={
                      showConfigErrors &&
                      Boolean(validationErrors.config.numberOfThreads)
                    }
                    className="sm:max-w-64"
                  >
                    <FieldLabel htmlFor="threads">
                      {t('fields.numberOfThreads')}
                    </FieldLabel>
                    <Input
                      id="threads"
                      type="number"
                      min="1"
                      step="1"
                      value={draft.execution.numberOfThreads}
                      onChange={(event) =>
                        setDraft((previousDraft) => ({
                          ...previousDraft,
                          execution: {
                            ...previousDraft.execution,
                            numberOfThreads: event.target.value,
                          },
                        }))
                      }
                      aria-invalid={
                        showConfigErrors &&
                        Boolean(validationErrors.config.numberOfThreads)
                      }
                      placeholder={t('placeholders.numberOfThreads')}
                    />
                    <FieldError>
                      {showConfigErrors
                        ? validationErrors.config.numberOfThreads
                        : null}
                    </FieldError>
                  </Field>

                  <FieldGroup className="grid gap-5 sm:w-fit sm:grid-cols-[auto_auto]">
                    <Field
                      data-invalid={
                        showConfigErrors &&
                        Boolean(validationErrors.config.verificationType)
                      }
                    >
                      <FieldTitle>{t('fields.verificationType')}</FieldTitle>
                      <ToggleGroup
                        multiple={false}
                        variant="outline"
                        value={
                          draft.execution.verificationType
                            ? [draft.execution.verificationType]
                            : []
                        }
                        onValueChange={(value) =>
                          updateVerificationType(
                            (value[0] ?? '') as ExecutionVerificationType | '',
                          )
                        }
                        aria-label={t('fields.verificationType')}
                      >
                        <ToggleGroupItem value="ELG">
                          {t('options.verificationElg')}
                        </ToggleGroupItem>
                        <ToggleGroupItem value="FBD">
                          {t('options.verificationFbd')}
                        </ToggleGroupItem>
                      </ToggleGroup>
                      <FieldError>
                        {showConfigErrors
                          ? validationErrors.config.verificationType
                          : null}
                      </FieldError>
                    </Field>

                    <Field
                      data-invalid={
                        showConfigErrors &&
                        Boolean(validationErrors.config.mode)
                      }
                    >
                      <FieldTitle>{t('fields.mode')}</FieldTitle>
                      <ToggleGroup
                        multiple={false}
                        variant="outline"
                        value={
                          draft.execution.mode ? [draft.execution.mode] : []
                        }
                        onValueChange={(value) =>
                          updateMode((value[0] ?? '') as ExecutionModeOption)
                        }
                        aria-label={t('fields.mode')}
                      >
                        <ToggleGroupItem value="parallel">
                          {t('options.modeParallel')}
                        </ToggleGroupItem>
                        <ToggleGroupItem value="standard">
                          {t('options.modeStandard')}
                        </ToggleGroupItem>
                      </ToggleGroup>
                      <FieldError>
                        {showConfigErrors ? validationErrors.config.mode : null}
                      </FieldError>
                    </Field>
                  </FieldGroup>
                </FieldGroup>

                <FieldSet className="h-full">
                  <FieldGroup
                    data-slot="checkbox-group"
                    className="h-full justify-between gap-6"
                  >
                    <Field orientation="horizontal">
                      <Checkbox
                        id="inNetwork"
                        checked={draft.config['in-network']}
                        onCheckedChange={(checked) =>
                          updateConfigField('in-network', Boolean(checked))
                        }
                      />
                      <FieldContent>
                        <FieldLabel htmlFor="inNetwork">
                          {t('fields.inNetwork')}
                        </FieldLabel>
                        <FieldDescription>
                          {t('sections.config.inNetworkDescription')}
                        </FieldDescription>
                      </FieldContent>
                    </Field>

                    <Field orientation="horizontal">
                      <Checkbox
                        id="shortForm"
                        checked={draft.config.shortForm}
                        onCheckedChange={(checked) =>
                          updateConfigField('shortForm', Boolean(checked))
                        }
                      />
                      <FieldContent>
                        <FieldLabel htmlFor="shortForm">
                          {t('fields.shortForm')}
                        </FieldLabel>
                        <FieldDescription>
                          {t('sections.config.shortFormDescription')}
                        </FieldDescription>
                      </FieldContent>
                    </Field>

                    <Field orientation="horizontal">
                      <Checkbox
                        id="claimsForm"
                        checked={draft.config.claimsForm}
                        onCheckedChange={(checked) =>
                          updateConfigField('claimsForm', Boolean(checked))
                        }
                      />
                      <FieldContent>
                        <FieldLabel htmlFor="claimsForm">
                          {t('fields.claimsForm')}
                        </FieldLabel>
                        <FieldDescription>
                          {t('sections.config.claimsFormDescription')}
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </FieldGroup>
            </FieldSet>
          ) : null}

          {currentStep === 3 && payloadPreview ? (
            <div className="grid items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col gap-6">
                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {t('fields.botName')}
                      </dt>
                      <dd className="mt-1 font-medium">
                        {payloadPreview.bot.botName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {t('fields.username')}
                      </dt>
                      <dd className="mt-1 font-medium">
                        {payloadPreview.bot.username}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm text-muted-foreground">
                        {t('fields.url')}
                      </dt>
                      <dd className="mt-1 break-all font-medium">
                        {payloadPreview.bot.url}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-col gap-3">
                    {payloadPreview.execution.patients.map((patient, index) => (
                      <div
                        key={`${patient.memberId}-${index}`}
                        className="grid gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3 sm:grid-cols-3"
                      >
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t('fields.patientName')}
                          </p>
                          <p className="mt-1 font-medium">
                            {patient.patientName}
                          </p>
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
                          <p className="mt-1 font-medium">
                            {patient.dateOfBirth}
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
                        {payloadPreview.execution.numberOfThreads}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {t('fields.verificationType')}
                      </dt>
                      <dd className="mt-1 font-medium">
                        {payloadPreview.execution.verificationType}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {t('fields.mode')}
                      </dt>
                      <dd className="mt-1 font-medium">
                        {payloadPreview.execution.mode === 'parallel'
                          ? t('options.modeParallel')
                          : t('options.modeStandard')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {t('review.flagsTitle')}
                      </dt>
                      <dd className="mt-1 font-medium">
                        {[
                          payloadPreview.config['in-network']
                            ? t('fields.inNetwork')
                            : null,
                          payloadPreview.config.shortForm
                            ? t('fields.shortForm')
                            : null,
                          payloadPreview.config.claimsForm
                            ? t('fields.claimsForm')
                            : null,
                        ]
                          .filter(Boolean)
                          .join(', ') || t('review.noFlags')}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="flex max-h-[calc(100vh-14rem)] min-h-0 flex-col rounded-3xl border border-border/70 bg-card p-4">
                <pre className="min-h-0 flex-1 overflow-auto rounded-2xl bg-muted/70 p-4 text-xs leading-6">
                  {JSON.stringify(payloadPreview, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-border">
        {currentStep === 0 ? (
          <span />
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={handlePreviousStep}
            disabled={isSubmitting}
          >
            <IconArrowLeft data-icon="inline-start" />
            {t('buttons.back')}
          </Button>
        )}

        {currentStep < steps.length - 1 ? (
          <Button type="button" onClick={handleNextStep}>
            {t('buttons.next')}
            <IconArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <IconLoader2 data-icon="inline-start" />
            ) : (
              <IconSend2 data-icon="inline-start" />
            )}
            {isSubmitting ? t('buttons.submitting') : t('buttons.submit')}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
