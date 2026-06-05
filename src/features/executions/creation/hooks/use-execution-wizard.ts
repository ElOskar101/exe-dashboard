import { useContext, useMemo, useState, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '@/features/auth'
import {
  getExecutionRequestErrorMessage,
  useCreateExecutionMutation,
  useExecutionTargetNavigation,
} from '@/features/executions/shared'
import type { TFunction } from 'i18next'
import { toast } from 'sonner'
import { buildExecutionPayload } from '../lib/execution-wizard-payload'
import { getExecutionWizardSuccessToastCopy } from '../lib/execution-wizard-success-toast'
import { getExecutionWizardValidationToastCopy } from '../lib/execution-wizard-validation-toast'
import { mapClinicBotToExecutionBot } from '../lib/execution-clinic-bots'
import { createEmptyDraft } from '../lib/execution-wizard-draft'
import {
  createEmptyBotSelection,
  createEmptyExecutionSelection,
  isBotStepDirty,
  isConfigStepDirty,
  isPatientsStepDirty,
} from '../lib/execution-wizard-step-state'
import { getExecutionWizardValidationErrors, hasErrors } from '../lib/execution-wizard-validation'
import type { ExecutionWizardDraft } from '../model/execution-create'
import type { CustomerSearchItem } from '../services/ccc.service'
import { useClinicBotPasswordRequest } from './use-clinic-bot-password-request'
import { useExecutionWizardData } from './use-execution-wizard-data'

export type ExecutionWizardStepKey = 'patients' | 'bot' | 'config' | 'review'

export const executionWizardSteps: ExecutionWizardStepKey[] = ['patients', 'bot', 'config', 'review']

const resetDraftDependentSelections = (
  draft: ExecutionWizardDraft,
  contextUpdates: Partial<ExecutionWizardDraft['context']>,
): ExecutionWizardDraft => ({
  ...draft,
  context: {
    ...draft.context,
    ...contextUpdates,
  },
  bot: createEmptyBotSelection(),
  execution: createEmptyExecutionSelection(draft.execution),
})

export const useExecutionWizard = (t: TFunction<'executions'>) => {
  const navigate = useNavigate()
  const { getPathWithExecutionTarget } = useExecutionTargetNavigation()
  const { user } = useContext(AuthContext)
  const createdBy = user?._id ?? ''
  const [draft, setDraft] = useState<ExecutionWizardDraft>(() => createEmptyDraft())
  const [currentStep, setCurrentStep] = useState(0)
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const customerSearch = draft.context.clientName.trim()
  const wizardData = useExecutionWizardData({
    context: draft.context,
    customerSearch,
    onPatientsImported: ({ executionId, patients }) => {
      setDraft((previousDraft) => ({
        ...previousDraft,
        execution: {
          ...previousDraft.execution,
          patients: previousDraft.execution.execution === executionId ? patients : previousDraft.execution.patients,
        },
      }))
    },
  })
  const clinicBotPasswordRequest = useClinicBotPasswordRequest({
    clinicBotOptions: wizardData.clinicBotOptions,
    currentClinicBotId: draft.bot.clinicBotId,
    onCleared: () => {
      setDraft((previousDraft) => ({
        ...previousDraft,
        bot: createEmptyBotSelection(),
      }))
    },
    onResolved: (selectedClinicBot, password) => {
      setDraft((previousDraft) => ({
        ...previousDraft,
        bot: mapClinicBotToExecutionBot(selectedClinicBot, password),
      }))
    },
  })
  const clinicOptions = wizardData.clinicOptions
  const executionDayOptions = wizardData.executionDayOptions
  const selectedClinicBotId = clinicBotPasswordRequest.selectedClinicBotId
  const decryptClinicBotPasswordStatus = clinicBotPasswordRequest.status
  const validationErrors = useMemo(
    () =>
      getExecutionWizardValidationErrors(draft, createdBy, t, {
        hasSelectedCustomerWithoutClinics: wizardData.hasSelectedCustomerWithoutClinics,
        hasSelectedClinicWithoutActiveBots: wizardData.hasSelectedClinicWithoutActiveBots,
        selectedClinicBotId,
        isDecryptingClinicBotPassword: decryptClinicBotPasswordStatus.isPending,
      }),
    [
      createdBy,
      decryptClinicBotPasswordStatus.isPending,
      draft,
      selectedClinicBotId,
      t,
      wizardData.hasSelectedClinicWithoutActiveBots,
      wizardData.hasSelectedCustomerWithoutClinics,
    ],
  )
  const payloadPreview = useMemo(() => buildExecutionPayload(draft, createdBy), [createdBy, draft])
  const stepValidity = [
    !validationErrors.context.client &&
      !validationErrors.context.clinic &&
      !validationErrors.patients.form &&
      validationErrors.patients.rows.every((row) => !hasErrors(row)),
    !validationErrors.context.client &&
      !validationErrors.context.clinic &&
      !hasErrors(validationErrors.bot) &&
      !decryptClinicBotPasswordStatus.isPending,
    !validationErrors.context.createdBy && !validationErrors.context.project && !hasErrors(validationErrors.config),
    true,
  ]
  const stepIsDirty = [isPatientsStepDirty(draft), isBotStepDirty(draft), isConfigStepDirty(draft), false]
  const stepNeedsAttention = stepValidity.map(
    (isStepValid, index) =>
      index < executionWizardSteps.length - 1 && !isStepValid && (stepIsDirty[index] || attemptedSteps[index]),
  )

  const showErrors = {
    patients: Boolean(attemptedSteps[0]),
    bot: Boolean(attemptedSteps[1]),
    config: Boolean(attemptedSteps[2]),
  }
  const submitExecutionMutation = useCreateExecutionMutation({
    onSuccess: async ([response]) => {
      const executionId = response.data._id
      const successToastCopy = getExecutionWizardSuccessToastCopy(t, response.data.execution)

      toast.success(successToastCopy.title, {
        description: successToastCopy.description,
        action: {
          label: successToastCopy.actionLabel,
          onClick: () => {
            navigate(getPathWithExecutionTarget(`/execution/${executionId}`))
          },
        },
      })
    },
  })

  const resetWizardRequests = () => {
    wizardData.resetImportPatients()
    clinicBotPasswordRequest.reset()
  }

  const updateContextField = (field: keyof ExecutionWizardDraft['context'], value: string) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      context: {
        ...previousDraft.context,
        [field]: value,
      },
    }))
  }

  const updateCustomerSearch = (value: string) => {
    resetWizardRequests()
    startTransition(() => {
      setDraft((previousDraft) =>
        resetDraftDependentSelections(previousDraft, {
          client: '',
          clientName: value,
          clinic: '',
          clinicName: '',
        }),
      )
    })
  }

  const clearCustomerSelection = () => {
    resetWizardRequests()
    setDraft((previousDraft) =>
      resetDraftDependentSelections(previousDraft, {
        client: '',
        clinic: '',
        clinicName: '',
      }),
    )
  }

  const selectCustomer = (customer: CustomerSearchItem) => {
    resetWizardRequests()
    setDraft((previousDraft) => {
      if (previousDraft.context.client === customer._id) {
        return resetDraftDependentSelections(previousDraft, {
          client: '',
          clinic: '',
          clinicName: '',
        })
      }

      return resetDraftDependentSelections(previousDraft, {
        client: customer._id,
        clientName: customer.clientName,
        clinic: '',
        clinicName: '',
      })
    })
  }

  const selectClinic = (clinicId: string) => {
    resetWizardRequests()
    const selectedClinic = clinicOptions.find((clinic) => clinic._id === clinicId)

    setDraft((previousDraft) =>
      resetDraftDependentSelections(previousDraft, {
        clinic: clinicId,
        clinicName: selectedClinic?.clinicName ?? '',
      }),
    )
  }

  const selectClinicBot = (clinicBotId: string) => {
    clinicBotPasswordRequest.selectClinicBot(clinicBotId)
  }

  const updateBotField = (field: keyof ExecutionWizardDraft['bot'], value: string) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      bot: {
        ...previousDraft.bot,
        [field]: value,
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

  const selectExecutionDay = (executionDayId: string) => {
    wizardData.resetImportPatients()
    const selectedDay = executionDayOptions.find((day) => day._id === executionDayId)

    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        execution: executionDayId,
        executionName: selectedDay?.sheetName ?? '',
        patients: [],
      },
    }))
  }

  const updateConfig = (value: string) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        config: value,
      },
    }))
  }

  const importPatients = () => {
    wizardData.importPatients(draft.execution.execution)
  }

  const removePatient = (index: number) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        patients: previousDraft.execution.patients.filter((_, patientIndex) => patientIndex !== index),
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
    const nextStep = Math.min(Math.max(step, 0), executionWizardSteps.length - 1)

    setCurrentStep(nextStep)
  }

  const handleNextStep = () => {
    markCurrentStepAttempted()
    setSubmitError(null)

    setCurrentStep((previousStep) => Math.min(previousStep + 1, executionWizardSteps.length - 1))
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
    resetWizardRequests()
  }

  const handleSubmit = async () => {
    setAttemptedSteps(
      Object.fromEntries(executionWizardSteps.map((_, index) => [index, true])) as Record<number, boolean>,
    )

    if (!payloadPreview || stepValidity.some((isStepValid) => !isStepValid)) {
      const validationToastCopy = getExecutionWizardValidationToastCopy(validationErrors, t)

      toast.warning(validationToastCopy?.title ?? t('validation.submitBlockedTitle'), {
        id: 'execution-wizard-validation',
        description: validationToastCopy?.description ?? t('validation.submitBlockedFallback'),
      })

      return
    }

    toast.dismiss('execution-wizard-validation')
    setSubmitError(null)

    try {
      await submitExecutionMutation.mutateAsync(payloadPreview)
    } catch (error) {
      setSubmitError(getExecutionRequestErrorMessage(error, t('submit.errorDescription')))
    }
  }

  return {
    botStep: {
      bot: draft.bot,
      clinicBotOptions: wizardData.clinicBotOptions,
      clinicBotsError:
        wizardData.clinicBotsQuery.error instanceof Error ? wizardData.clinicBotsQuery.error.message : null,
      context: draft.context,
      decryptClinicBotPasswordError: decryptClinicBotPasswordStatus.error,
      errors: validationErrors.bot,
      hasSelectedClinicWithoutActiveBots: wizardData.hasSelectedClinicWithoutActiveBots,
      isDecryptingClinicBotPassword: decryptClinicBotPasswordStatus.isPending,
      isLoadingClinicBots: wizardData.clinicBotsQuery.isFetching,
      onBotFieldChange: updateBotField,
      onClinicBotSelect: selectClinicBot,
      selectedClinicBotId,
      showErrors: showErrors.bot,
    },
    configStep: {
      contextErrors: validationErrors.context,
      draft,
      errors: validationErrors.config,
      onConfigChange: updateConfig,
      onContextFieldChange: updateContextField,
      onRetriesChange: updateRetries,
      onWorkersChange: updateWorkers,
      showErrors: showErrors.config,
    },
    patientsStep: {
      clinicOptions,
      context: draft.context,
      contextErrors: validationErrors.context,
      customerOptions: wizardData.customerSearchQuery.data?.customers ?? [],
      customerSearchError:
        wizardData.customerSearchQuery.error instanceof Error ? wizardData.customerSearchQuery.error.message : null,
      errors: validationErrors.patients,
      execution: draft.execution.execution,
      executionDayOptions,
      executionDaysError:
        wizardData.clinicExecutionDaysQuery.error instanceof Error
          ? wizardData.clinicExecutionDaysQuery.error.message
          : null,
      executionName: draft.execution.executionName,
      hasSelectedCustomerWithoutClinics: wizardData.hasSelectedCustomerWithoutClinics,
      importPatientsError:
        wizardData.importPatientsMutation.error instanceof Error
          ? wizardData.importPatientsMutation.error.message
          : null,
      isImportingPatients: wizardData.importPatientsMutation.isPending,
      isLoadingClinics: wizardData.selectedCustomerQuery.isFetching,
      isLoadingExecutionDays: wizardData.clinicExecutionDaysQuery.isFetching,
      isSearchingCustomers: wizardData.customerSearchQuery.isFetching,
      onClinicSelect: selectClinic,
      onCustomerClear: clearCustomerSelection,
      onCustomerSearchChange: updateCustomerSearch,
      onCustomerSelect: selectCustomer,
      onExecutionDaySelect: selectExecutionDay,
      onImportPatients: importPatients,
      onRemovePatient: removePatient,
      patients: draft.execution.patients,
      selectedCustomerError:
        wizardData.selectedCustomerQuery.error instanceof Error ? wizardData.selectedCustomerQuery.error.message : null,
      showErrors: showErrors.patients,
    },
    reviewStep: {
      draft,
      payload: payloadPreview,
    },
    stepper: {
      currentStep,
      onNextStep: handleNextStep,
      onPreviousStep: handlePreviousStep,
      onStepChange: handleStepChange,
      stepNeedsAttention,
      steps: executionWizardSteps,
    },
    submission: {
      isSubmitting: submitExecutionMutation.isPending,
      onReset: resetWizard,
      onSubmit: handleSubmit,
      submitError,
    },
  }
}

export type UseExecutionWizardResult = ReturnType<typeof useExecutionWizard>
export type ExecutionWizardStepperState = UseExecutionWizardResult['stepper']
export type ExecutionWizardPatientsStepState = UseExecutionWizardResult['patientsStep']
export type ExecutionWizardBotStepState = UseExecutionWizardResult['botStep']
export type ExecutionWizardConfigStepState = UseExecutionWizardResult['configStep']
export type ExecutionWizardReviewStepState = UseExecutionWizardResult['reviewStep']
export type ExecutionWizardSubmissionState = UseExecutionWizardResult['submission']
