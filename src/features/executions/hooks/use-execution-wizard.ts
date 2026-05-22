import { useMemo, useState } from 'react'
import type { TFunction } from 'i18next'
import { createExecution } from '../api/execution.service'
import { getExecutionRequestErrorMessage } from '../api/execution-errors'
import { buildExecutionPayload } from '../lib/execution-wizard-payload'
import {
  createEmptyDraft,
  createEmptyPatient,
} from '../lib/execution-wizard-draft'
import {
  getExecutionWizardValidationErrors,
  hasErrors,
} from '../lib/execution-wizard-validation'
import type { IExecution } from '../model/execution.interface'
import type {
  ExecutionModeOption,
  ExecutionPatient,
  ExecutionVerificationType,
  ExecutionWizardDraft,
} from '../model/execution-create'

export type ExecutionWizardStepKey = 'bot' | 'patients' | 'config' | 'review'

export const executionWizardSteps: ExecutionWizardStepKey[] = [
  'bot',
  'patients',
  'config',
  'review',
]

export const useExecutionWizard = (t: TFunction<'executions'>) => {
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
    () => getExecutionWizardValidationErrors(draft, t),
    [draft, t],
  )
  const payloadPreview = useMemo(() => buildExecutionPayload(draft), [draft])

  const stepValidity = [
    !hasErrors(validationErrors.bot),
    !validationErrors.patients.form &&
      validationErrors.patients.rows.every((row) => !hasErrors(row)),
    !hasErrors(validationErrors.config),
    Boolean(payloadPreview),
  ]

  const showErrors = {
    bot: Boolean(attemptedSteps[0]),
    patients: Boolean(attemptedSteps[1]),
    config: Boolean(attemptedSteps[2]),
  }

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

  const updateThreadCount = (value: string) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        numberOfThreads: value,
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
      Math.min(previousStep + 1, executionWizardSteps.length - 1),
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
        getExecutionRequestErrorMessage(error, t('submit.errorDescription')),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    draft,
    currentStep,
    validationErrors,
    payloadPreview,
    showErrors,
    isSubmitting,
    submitError,
    createdExecution,
    setCurrentStep,
    updateBotField,
    updatePatientField,
    addPatient,
    removePatient,
    updateThreadCount,
    updateConfigField,
    updateMode,
    updateVerificationType,
    handleNextStep,
    handlePreviousStep,
    handleSubmit,
    resetWizard,
  }
}
