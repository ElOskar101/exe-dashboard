import { useContext, useMemo, useState, startTransition } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '@/features/auth'
import { useCccApiUrl } from '@/hooks/use-ccc-api-url'
import {
  getExecutionRequestErrorMessage,
  useCreateExecutionMutation,
  useExecutionTargetNavigation,
  useScheduleExecutionMutation,
} from '@/features/executions/shared'
import type { TFunction } from 'i18next'
import { toast } from 'sonner'
import type { PlaywrightProjectBot } from '../../shared'
import { buildExecutionPayload, buildExecutionPayloadPreview } from '../lib/execution-wizard-payload'
import { formatCustomerExecutionConfig } from '../lib/customer-execution-config'
import { useExecutionAppLimits } from '../lib/execution-app-limits'
import { executionWizardKeys } from '../lib/execution-wizard-query-keys'
import { getExecutionWizardSuccessToastCopy } from '../lib/execution-wizard-success-toast'
import { getExecutionWizardValidationToastCopy } from '../lib/execution-wizard-validation-toast'
import {
  findClinicBotForPlaywrightProjectBot,
  mapPlaywrightProjectBotToExecutionBot,
  mapPlaywrightProjectBotWithClinicBotToExecutionBot,
} from '../lib/execution-playwright-projects'
import { createEmptyDraft, DEFAULT_EXECUTION_CONFIG } from '../lib/execution-wizard-draft'
import {
  createEmptyBotSelection,
  createEmptyExecutionSelection,
  isBotStepDirty,
  isConfigStepDirty,
  isPatientsStepDirty,
} from '../lib/execution-wizard-step-state'
import { getExecutionWizardValidationErrors, hasErrors } from '../lib/execution-wizard-validation'
import type { ExecutionScheduleMode, ExecutionSchedulePayload, ExecutionWizardDraft } from '../model/execution-create'
import {
  decryptClinicBotPassword,
  getCustomerById,
  type ClinicBotRecord,
  type CustomerSearchItem,
} from '../services/ccc.service'
import { useExecutionWizardData } from './use-execution-wizard-data'

export type ExecutionWizardStepKey = 'patients' | 'bot' | 'config' | 'review'

export const executionWizardSteps: ExecutionWizardStepKey[] = ['patients', 'bot', 'config', 'review']

interface BotPasswordRequestState {
  error: string | null
  requestId: string
  selectedBotId: string
  status: 'idle' | 'pending' | 'error'
}

interface DecryptSelectedBotPasswordMutationVariables {
  requestId: string
  selectedBot: PlaywrightProjectBot
  selectedClinicBot: ClinicBotRecord
}

const createIdleBotPasswordRequestState = (): BotPasswordRequestState => ({
  error: null,
  requestId: '',
  selectedBotId: '',
  status: 'idle',
})

const resetDraftDependentSelections = (
  draft: ExecutionWizardDraft,
  contextUpdates: Partial<ExecutionWizardDraft['context']>,
  executionUpdates: Partial<ExecutionWizardDraft['execution']> = {},
): ExecutionWizardDraft => ({
  ...draft,
  context: {
    ...draft.context,
    ...contextUpdates,
  },
  bot: createEmptyBotSelection(),
  execution: {
    ...createEmptyExecutionSelection(draft.execution),
    ...executionUpdates,
  },
})

export const useExecutionWizard = (t: TFunction<'executions'>) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { getPathWithExecutionTarget } = useExecutionTargetNavigation()
  const { token, user } = useContext(AuthContext)
  const { cccApiUrl } = useCccApiUrl()
  const createdBy = user?.fullName ?? ''
  const [draft, setDraft] = useState<ExecutionWizardDraft>(() => createEmptyDraft())
  const [currentStep, setCurrentStep] = useState(0)
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [botPasswordRequest, setBotPasswordRequest] = useState<BotPasswordRequestState>(() =>
    createIdleBotPasswordRequestState(),
  )
  const customerSearch = draft.context.clientName.trim()
  const wizardData = useExecutionWizardData({
    cccApiUrl,
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
  const clinicOptions = wizardData.clinicOptions
  const executionDayOptions = wizardData.executionDayOptions
  const selectedBotId = draft.bot.clinicBotId
  const appLimits = useExecutionAppLimits()
  const selectedBotPasswordStatus =
    botPasswordRequest.selectedBotId === selectedBotId
      ? {
          error: botPasswordRequest.status === 'error' ? botPasswordRequest.error : null,
          isPending: botPasswordRequest.status === 'pending',
        }
      : {
          error: null,
          isPending: false,
        }
  const validationErrors = useMemo(() => {
    const selectedAssociatedBot = wizardData.associatedBotOptions.find((bot) => bot._id === draft.bot.clinicBotId)
    const selectedClinicBot = selectedAssociatedBot
      ? findClinicBotForPlaywrightProjectBot(selectedAssociatedBot, wizardData.clinicBotOptions)
      : undefined

    return getExecutionWizardValidationErrors(draft, createdBy, t, {
      hasSelectedCustomerWithoutClinics: wizardData.hasSelectedCustomerWithoutClinics,
      hasSelectedClinicWithoutActiveBots: wizardData.hasSelectedClinicWithoutActiveBots,
      hasSelectedProjectWithoutAssociatedBots: wizardData.hasSelectedProjectWithoutAssociatedBots,
      selectedBotMissingFromClinicBots: draft.bot.clinicBotId.trim().length > 0 && !selectedClinicBot,
      workersLimit: appLimits.maxWorkers,
      retriesLimit: appLimits.maxRetries,
    })
  }, [
    wizardData.associatedBotOptions,
    wizardData.clinicBotOptions,
    createdBy,
    draft,
    t,
    wizardData.hasSelectedClinicWithoutActiveBots,
    wizardData.hasSelectedCustomerWithoutClinics,
    wizardData.hasSelectedProjectWithoutAssociatedBots,
    appLimits.maxWorkers,
    appLimits.maxRetries,
  ])
  const payloadPreview = useMemo(
    () => buildExecutionPayloadPreview(draft, createdBy, token, cccApiUrl, wizardData.runtimeVariablesQuery.data),
    [cccApiUrl, createdBy, draft, token, wizardData.runtimeVariablesQuery.data],
  )
  const submitPayload = useMemo(
    () => buildExecutionPayload(draft, createdBy, token, cccApiUrl, wizardData.runtimeVariablesQuery.data),
    [cccApiUrl, createdBy, draft, token, wizardData.runtimeVariablesQuery.data],
  )
  const stepValidity = [
    !validationErrors.context.client &&
      !validationErrors.context.clinic &&
      !validationErrors.patients.form &&
      validationErrors.patients.rows.every((row) => !hasErrors(row)),
    !validationErrors.context.client &&
      !validationErrors.context.clinic &&
      !hasErrors(validationErrors.bot) &&
      !validationErrors.context.project,
    !validationErrors.context.createdBy && !hasErrors(validationErrors.config),
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
      const successToastCopy = getExecutionWizardSuccessToastCopy(t, response.data.execution, 'instant')

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
  const scheduleExecutionMutation = useScheduleExecutionMutation({
    onSuccess: async ([response, payload]) => {
      const executionId = response.data._id
      const successToastCopy = getExecutionWizardSuccessToastCopy(
        t,
        response.data.execution,
        'scheduled',
        payload.scheduledAt,
      )

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
  const decryptSelectedBotPasswordMutation = useMutation({
    mutationFn: async ({ requestId, selectedBot, selectedClinicBot }: DecryptSelectedBotPasswordMutationVariables) => {
      const response = await decryptClinicBotPassword(selectedClinicBot._id)

      return {
        password: response.data,
        requestId,
        selectedBot,
        selectedClinicBot,
      }
    },
    onSuccess: ({ password, requestId, selectedBot, selectedClinicBot }) => {
      setBotPasswordRequest((previousRequest) =>
        previousRequest.selectedBotId === selectedBot._id && previousRequest.requestId === requestId
          ? createIdleBotPasswordRequestState()
          : previousRequest,
      )
      setDraft((previousDraft) =>
        previousDraft.bot.clinicBotId === selectedBot._id
          ? {
              ...previousDraft,
              bot: mapPlaywrightProjectBotWithClinicBotToExecutionBot(selectedBot, selectedClinicBot, password),
            }
          : previousDraft,
      )
    },
    onError: (error, { requestId, selectedBot, selectedClinicBot }) => {
      setBotPasswordRequest((previousRequest) =>
        previousRequest.selectedBotId === selectedBot._id && previousRequest.requestId === requestId
          ? {
              error: error instanceof Error ? error.message : t('submit.errorDescription'),
              requestId,
              selectedBotId: selectedBot._id,
              status: 'error',
            }
          : previousRequest,
      )
      setDraft((previousDraft) =>
        previousDraft.bot.clinicBotId === selectedBot._id
          ? {
              ...previousDraft,
              bot: mapPlaywrightProjectBotWithClinicBotToExecutionBot(selectedBot, selectedClinicBot, ''),
            }
          : previousDraft,
      )
    },
  })
  const resetWizardRequests = () => {
    setBotPasswordRequest(createIdleBotPasswordRequestState())
    decryptSelectedBotPasswordMutation.reset()
    wizardData.resetImportPatients()
  }

  const loadSelectedCustomerConfig = async (customerId: string) => {
    try {
      const customer = await queryClient.fetchQuery({
        queryKey: executionWizardKeys.customer(customerId),
        queryFn: async () => {
          const response = await getCustomerById(customerId)

          return response.data
        },
      })

      setDraft((previousDraft) =>
        previousDraft.context.client === customer._id
          ? {
              ...previousDraft,
              execution: {
                ...previousDraft.execution,
                config: formatCustomerExecutionConfig(customer),
              },
            }
          : previousDraft,
      )
    } catch {
      return
    }
  }

  const updateCustomerSearch = (value: string) => {
    resetWizardRequests()
    startTransition(() => {
      setDraft((previousDraft) =>
        resetDraftDependentSelections(
          previousDraft,
          {
            client: '',
            clientName: value,
            clinic: '',
            clinicName: '',
          },
          {
            config: DEFAULT_EXECUTION_CONFIG,
          },
        ),
      )
    })
  }

  const clearCustomerSelection = () => {
    resetWizardRequests()
    setDraft((previousDraft) =>
      resetDraftDependentSelections(
        previousDraft,
        {
          client: '',
          clinic: '',
          clinicName: '',
        },
        {
          config: DEFAULT_EXECUTION_CONFIG,
        },
      ),
    )
  }

  const selectCustomer = (customer: CustomerSearchItem) => {
    resetWizardRequests()
    const isDeselectingCustomer = draft.context.client === customer._id

    setDraft((previousDraft) => {
      if (previousDraft.context.client === customer._id) {
        return resetDraftDependentSelections(
          previousDraft,
          {
            client: '',
            clinic: '',
            clinicName: '',
          },
          {
            config: DEFAULT_EXECUTION_CONFIG,
          },
        )
      }

      return resetDraftDependentSelections(
        previousDraft,
        {
          client: customer._id,
          clientName: customer.clientName,
          clinic: '',
          clinicName: '',
        },
        {
          config: DEFAULT_EXECUTION_CONFIG,
        },
      )
    })

    if (!isDeselectingCustomer) {
      void loadSelectedCustomerConfig(customer._id)
    }
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

  const selectProject = (projectName: string) => {
    setBotPasswordRequest(createIdleBotPasswordRequestState())
    decryptSelectedBotPasswordMutation.reset()
    setDraft((previousDraft) => ({
      ...previousDraft,
      context: {
        ...previousDraft.context,
        project: projectName,
      },
      bot: createEmptyBotSelection(),
    }))
  }

  const selectBot = (botId: string) => {
    const selectedBot = wizardData.associatedBotOptions.find((bot) => bot._id === botId)
    const selectedClinicBot = selectedBot
      ? findClinicBotForPlaywrightProjectBot(selectedBot, wizardData.clinicBotOptions)
      : undefined

    if (selectedBot && !selectedClinicBot) {
      toast.error(t('validation.selectedBotNotInClinicBots'), {
        id: 'execution-wizard-selected-bot-missing-from-clinic',
      })
    }

    if (!selectedBot) {
      setBotPasswordRequest(createIdleBotPasswordRequestState())
      decryptSelectedBotPasswordMutation.reset()
      setDraft((previousDraft) => ({
        ...previousDraft,
        bot: createEmptyBotSelection(),
      }))

      return
    }

    if (!selectedClinicBot) {
      setBotPasswordRequest(createIdleBotPasswordRequestState())
      decryptSelectedBotPasswordMutation.reset()
      setDraft((previousDraft) => ({
        ...previousDraft,
        bot: mapPlaywrightProjectBotToExecutionBot(selectedBot),
      }))

      return
    }

    const requestId = crypto.randomUUID()

    setBotPasswordRequest({
      error: null,
      requestId,
      selectedBotId: selectedBot._id,
      status: 'pending',
    })
    setDraft((previousDraft) => ({
      ...previousDraft,
      bot: {
        ...createEmptyBotSelection(),
        clinicBotId: selectedBot._id,
      },
    }))
    decryptSelectedBotPasswordMutation.mutate({
      requestId,
      selectedBot,
      selectedClinicBot,
    })
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

  const updateScheduleMode = (scheduleMode: ExecutionScheduleMode) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        scheduleMode,
      },
    }))
  }

  const updateScheduledAt = (value: string) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        scheduledAt: value,
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

    if (!submitPayload || stepValidity.some((isStepValid) => !isStepValid)) {
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
      if (draft.execution.scheduleMode === 'scheduled') {
        if (!('scheduledAt' in submitPayload)) {
          return
        }

        await scheduleExecutionMutation.mutateAsync(submitPayload as ExecutionSchedulePayload)
        return
      }

      await submitExecutionMutation.mutateAsync(submitPayload)
    } catch (error) {
      setSubmitError(getExecutionRequestErrorMessage(error, t('submit.errorDescription')))
    }
  }

  return {
    botStep: {
      associatedBotOptions: wizardData.associatedBotOptions,
      bot: draft.bot,
      botPasswordError: selectedBotPasswordStatus.error,
      context: draft.context,
      errors: validationErrors.bot,
      clinicBotsError:
        wizardData.clinicBotsQuery.error instanceof Error ? wizardData.clinicBotsQuery.error.message : null,
      hasSelectedClinicWithoutActiveBots: wizardData.hasSelectedClinicWithoutActiveBots,
      hasSelectedProjectWithoutAssociatedBots: wizardData.hasSelectedProjectWithoutAssociatedBots,
      isDecryptingBotPassword: selectedBotPasswordStatus.isPending,
      isLoadingClinicBots: wizardData.clinicBotsQuery.isFetching,
      isLoadingPlaywrightProjects: wizardData.playwrightProjectsQuery.isFetching,
      onBotFieldChange: updateBotField,
      onBotSelect: selectBot,
      onProjectSelect: selectProject,
      projectError: validationErrors.context.project,
      playwrightProjectsError:
        wizardData.playwrightProjectsQuery.error instanceof Error
          ? wizardData.playwrightProjectsQuery.error.message
          : null,
      playwrightProjectOptions: wizardData.playwrightProjectOptions,
      selectedBotId,
      showErrors: showErrors.bot,
    },
    configStep: {
      contextErrors: validationErrors.context,
      draft,
      errors: validationErrors.config,
      maxRetries: appLimits.maxRetries,
      maxWorkers: appLimits.maxWorkers,
      onConfigChange: updateConfig,
      onRetriesChange: updateRetries,
      onScheduleModeChange: updateScheduleMode,
      onScheduledAtChange: updateScheduledAt,
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
      isSubmitting: submitExecutionMutation.isPending || scheduleExecutionMutation.isPending,
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
