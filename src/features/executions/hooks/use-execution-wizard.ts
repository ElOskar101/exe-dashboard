import { useContext, useMemo, useState } from 'react'
import { AuthContext } from '@/features/auth'
import type { TFunction } from 'i18next'
import { createExecution } from '../services/execution.service'
import { getExecutionRequestErrorMessage } from '../services/execution-errors'
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
  const { user } = useContext(AuthContext)
  const createdBy = user?._id ?? ''
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
    () => getExecutionWizardValidationErrors(draft, createdBy, t),
    [createdBy, draft, t],
  )
  const payloadPreview = useMemo(
    () => buildExecutionPayload(draft, createdBy),
    [createdBy, draft],
  )

  const stepValidity = [
    !hasErrors(validationErrors.context) && !hasErrors(validationErrors.bot),
    !validationErrors.patients.form &&
      validationErrors.patients.rows.every((row) => !hasErrors(row)),
    !hasErrors(validationErrors.config),
    true,
  ]

  const showErrors = {
    bot: Boolean(attemptedSteps[0]),
    patients: Boolean(attemptedSteps[1]),
    config: Boolean(attemptedSteps[2]),
  }

  const updateContextField = (
    field: keyof ExecutionWizardDraft['context'],
    value: string,
  ) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      context: {
        ...previousDraft.context,
        [field]: value,
      },
    }))
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

  const updateWorkers = (value: string) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        workers: value,
      },
    }))
  }

  const updateRetries = (value: string) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        retries: value,
      },
    }))
  }

  const updatePatientVerificationType = (
    index: number,
    value: ExecutionVerificationType | '',
  ) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        patients: previousDraft.execution.patients.map(
          (patient, patientIndex) =>
            patientIndex === index
              ? { ...patient, verificationType: value }
              : patient,
        ),
      },
    }))
  }

  const markCurrentStepAttempted = () => {
    setAttemptedSteps((previousAttempts) => ({
      ...previousAttempts,
      [currentStep]: true,
    }))
  }

  const handleStepChange = (step: number) => {
    markCurrentStepAttempted()
    setSubmitError(null)
    setCurrentStep(Math.min(Math.max(step, 0), executionWizardSteps.length - 1))
  }

  const handleNextStep = () => {
    markCurrentStepAttempted()
    setSubmitError(null)
    setCurrentStep((previousStep) =>
      Math.min(previousStep + 1, executionWizardSteps.length - 1),
    )
  }

  const handlePreviousStep = () => {
    markCurrentStepAttempted()
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
    setAttemptedSteps({
      0: true,
      1: true,
      2: true,
      3: true,
    })

    if (!payloadPreview || stepValidity.some((isStepValid) => !isStepValid)) {
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
    stepValidity,
    showErrors,
    isSubmitting,
    submitError,
    createdExecution,
    createdBy,
    handleStepChange,
    updateContextField,
    updateBotField,
    updatePatientField,
    updatePatientVerificationType,
    addPatient,
    removePatient,
    updateWorkers,
    updateRetries,
    handleNextStep,
    handlePreviousStep,
    handleSubmit,
    resetWizard,
  }
}
