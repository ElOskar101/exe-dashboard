import { useContext, useMemo, useRef, useState, startTransition, type SetStateAction } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AuthContext } from '@/features/auth'
import type { TFunction } from 'i18next'
import { toast } from 'sonner'
import { createExecution } from '../services/execution.service'
import { getExecutionRequestErrorMessage } from '../services/execution-errors'
import { buildExecutionPayload } from '../lib/execution-wizard-payload'
import { getExecutionWizardValidationToastCopy } from '../lib/execution-wizard-validation-toast'
import {
  type ClinicBotPasswordRequestState,
  createIdleClinicBotPasswordRequestState,
  createPendingClinicBotPasswordRequestState,
  failClinicBotPasswordRequestState,
  getClinicBotPasswordRequestStatus,
  resolveClinicBotPasswordRequestState,
} from '../lib/clinic-bot-password-request'
import { getSelectableClinicBots, mapClinicBotToExecutionBot } from '../lib/execution-clinic-bots'
import { createEmptyDraft } from '../lib/execution-wizard-draft'
import { getExecutionWizardValidationErrors, hasErrors } from '../lib/execution-wizard-validation'
import { mapCcExecutionRowsToPatients } from '../lib/cc-execution-patients'
import type { ExecutionWizardDraft } from '../model/execution-create'
import {
  decryptClinicBotPassword,
  getCcExecution,
  getClinicBots,
  getClinicExecutionDays,
  getCustomerById,
  searchCustomers,
  type ClinicBotRecord,
  type CustomerSearchItem,
} from '../services/ccc.service'

export type ExecutionWizardStepKey = 'patients' | 'bot' | 'config' | 'review'

export const executionWizardSteps: ExecutionWizardStepKey[] = ['patients', 'bot', 'config', 'review']

const createEmptyBotSelection = (): ExecutionWizardDraft['bot'] => ({
  clinicBotId: '',
  botName: '',
  targetUrl: '',
  username: '',
  password: '',
  verificationType: '',
})

export const createPendingBotSelection = (clinicBotId: string): ExecutionWizardDraft['bot'] => ({
  ...createEmptyBotSelection(),
  clinicBotId,
})

const createEmptyExecutionSelection = (previousExecution: ExecutionWizardDraft['execution']) => ({
  ...previousExecution,
  execution: '',
  executionName: '',
  patients: [],
})

export const useExecutionWizard = (t: TFunction<'executions'>) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useContext(AuthContext)
  const createdBy = user?._id ?? ''
  const [draft, setDraft] = useState<ExecutionWizardDraft>(() => createEmptyDraft())
  const [currentStep, setCurrentStep] = useState(0)
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [decryptClinicBotPasswordRequest, setDecryptClinicBotPasswordRequestState] = useState(() =>
    createIdleClinicBotPasswordRequestState(),
  )
  const decryptClinicBotPasswordRequestRef = useRef(decryptClinicBotPasswordRequest)
  const setDecryptClinicBotPasswordRequest = (nextRequest: SetStateAction<ClinicBotPasswordRequestState>) => {
    const resolvedRequest =
      typeof nextRequest === 'function' ? nextRequest(decryptClinicBotPasswordRequestRef.current) : nextRequest

    decryptClinicBotPasswordRequestRef.current = resolvedRequest
    setDecryptClinicBotPasswordRequestState(resolvedRequest)
  }
  const customerSearch = draft.context.clientName.trim()
  const customerSearchEnabled = draft.context.client.trim().length === 0 && customerSearch.length >= 2

  const customerSearchQuery = useQuery({
    queryKey: ['execution-customer-search', customerSearch],
    queryFn: async ({ signal }) => {
      await new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(resolve, 300)

        signal.addEventListener(
          'abort',
          () => {
            window.clearTimeout(timeoutId)
            reject(new DOMException('Aborted', 'AbortError'))
          },
          { once: true },
        )
      })

      const response = await searchCustomers(customerSearch)

      return response.data
    },
    enabled: customerSearchEnabled,
  })

  const selectedCustomerQuery = useQuery({
    queryKey: ['execution-customer', draft.context.client],
    queryFn: async () => {
      const response = await getCustomerById(draft.context.client)

      return response.data
    },
    enabled: draft.context.client.trim().length > 0,
  })

  const clinicExecutionDaysQuery = useQuery({
    queryKey: ['clinic-execution-days', draft.context.clinic],
    queryFn: async () => {
      const response = await getClinicExecutionDays(draft.context.clinic)

      return response.data
    },
    enabled: draft.context.clinic.trim().length > 0,
  })

  const clinicBotsQuery = useQuery({
    queryKey: ['clinic-bots', draft.context.clinic],
    queryFn: async () => {
      const response = await getClinicBots(draft.context.clinic)

      return response.data
    },
    enabled: draft.context.clinic.trim().length > 0,
  })

  const importPatientsMutation = useMutation({
    mutationFn: async (executionId: string) => {
      const response = await getCcExecution(executionId)

      return response.data
    },
    onSuccess: (execution) => {
      const patients = mapCcExecutionRowsToPatients(execution.rows)

      setDraft((previousDraft) => ({
        ...previousDraft,
        execution: {
          ...previousDraft.execution,
          patients: previousDraft.execution.execution === execution._id ? patients : previousDraft.execution.patients,
        },
      }))
    },
  })

  interface DecryptClinicBotPasswordMutationVariables {
    clinicBotId: string
    requestId: string
    selectedClinicBot: ClinicBotRecord
  }

  const decryptClinicBotPasswordMutation = useMutation({
    mutationFn: async ({ clinicBotId, requestId, selectedClinicBot }: DecryptClinicBotPasswordMutationVariables) => {
      const response = await decryptClinicBotPassword(clinicBotId)

      return {
        clinicBotId,
        password: response.data,
        requestId,
        selectedClinicBot,
      }
    },
    onSuccess: ({ clinicBotId, password, requestId, selectedClinicBot }) => {
      const currentRequest = decryptClinicBotPasswordRequestRef.current

      if (currentRequest.clinicBotId === clinicBotId && currentRequest.requestId === requestId) {
        setDraft((previousDraft) => ({
          ...previousDraft,
          bot: mapClinicBotToExecutionBot(selectedClinicBot, password),
        }))
      }

      setDecryptClinicBotPasswordRequest((previousRequest) =>
        resolveClinicBotPasswordRequestState(previousRequest, { clinicBotId, requestId }),
      )
    },
    onError: (error, { clinicBotId, requestId }) => {
      setDecryptClinicBotPasswordRequest((previousRequest) =>
        failClinicBotPasswordRequestState(
          previousRequest,
          { clinicBotId, requestId },
          error instanceof Error ? error.message : 'Unable to decrypt clinic bot password',
        ),
      )
    },
  })

  const clinicOptions = selectedCustomerQuery.data?.clinic ?? []
  const clinicBotOptions = useMemo(() => getSelectableClinicBots(clinicBotsQuery.data ?? []), [clinicBotsQuery.data])
  const executionDayOptions = (clinicExecutionDaysQuery.data ?? []).filter((day) => !day.trashed)
  const hasSelectedCustomerWithoutClinics =
    draft.context.client.trim().length > 0 && selectedCustomerQuery.status === 'success' && clinicOptions.length === 0
  const hasSelectedClinicWithoutActiveBots =
    draft.context.clinic.trim().length > 0 && clinicBotsQuery.status === 'success' && clinicBotOptions.length === 0
  const decryptClinicBotPasswordStatus = getClinicBotPasswordRequestStatus(
    decryptClinicBotPasswordRequest,
    draft.bot.clinicBotId,
  )

  const validationErrors = useMemo(
    () =>
      getExecutionWizardValidationErrors(draft, createdBy, t, {
        hasSelectedCustomerWithoutClinics,
        hasSelectedClinicWithoutActiveBots,
      }),
    [createdBy, draft, hasSelectedClinicWithoutActiveBots, hasSelectedCustomerWithoutClinics, t],
  )
  const payloadPreview = useMemo(() => buildExecutionPayload(draft, createdBy), [createdBy, draft])

  const stepValidity = [
    !validationErrors.context.client &&
      !validationErrors.context.clinic &&
      !validationErrors.patients.form &&
      validationErrors.patients.rows.every((row) => !hasErrors(row)),
    !validationErrors.context.client && !validationErrors.context.clinic && !hasErrors(validationErrors.bot),
    !validationErrors.context.createdBy && !validationErrors.context.project && !hasErrors(validationErrors.config),
    true,
  ]

  const showErrors = {
    patients: Boolean(attemptedSteps[0]),
    bot: Boolean(attemptedSteps[1]),
    config: Boolean(attemptedSteps[2]),
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
    importPatientsMutation.reset()
    setDecryptClinicBotPasswordRequest(createIdleClinicBotPasswordRequestState())
    startTransition(() => {
      setDraft((previousDraft) => ({
        ...previousDraft,
        context: {
          ...previousDraft.context,
          client: '',
          clientName: value,
          clinic: '',
          clinicName: '',
        },
        bot: createEmptyBotSelection(),
        execution: createEmptyExecutionSelection(previousDraft.execution),
      }))
    })
  }

  const clearCustomerSelection = () => {
    importPatientsMutation.reset()
    setDecryptClinicBotPasswordRequest(createIdleClinicBotPasswordRequestState())
    setDraft((previousDraft) => ({
      ...previousDraft,
      context: {
        ...previousDraft.context,
        client: '',
        clinic: '',
        clinicName: '',
      },
      bot: createEmptyBotSelection(),
      execution: createEmptyExecutionSelection(previousDraft.execution),
    }))
  }

  const selectCustomer = (customer: CustomerSearchItem) => {
    importPatientsMutation.reset()
    setDecryptClinicBotPasswordRequest(createIdleClinicBotPasswordRequestState())
    setDraft((previousDraft) => {
      if (previousDraft.context.client === customer._id) {
        return {
          ...previousDraft,
          context: {
            ...previousDraft.context,
            client: '',
            clinic: '',
            clinicName: '',
          },
          bot: createEmptyBotSelection(),
          execution: createEmptyExecutionSelection(previousDraft.execution),
        }
      }

      return {
        ...previousDraft,
        context: {
          ...previousDraft.context,
          client: customer._id,
          clientName: customer.clientName,
          clinic: '',
          clinicName: '',
        },
        bot: createEmptyBotSelection(),
        execution: createEmptyExecutionSelection(previousDraft.execution),
      }
    })
  }

  const selectClinic = (clinicId: string) => {
    importPatientsMutation.reset()
    setDecryptClinicBotPasswordRequest(createIdleClinicBotPasswordRequestState())
    const selectedClinic = clinicOptions.find((clinic) => clinic._id === clinicId)

    setDraft((previousDraft) => ({
      ...previousDraft,
      context: {
        ...previousDraft.context,
        clinic: clinicId,
        clinicName: selectedClinic?.clinicName ?? '',
      },
      bot: createEmptyBotSelection(),
      execution: createEmptyExecutionSelection(previousDraft.execution),
    }))
  }

  const selectClinicBot = (clinicBotId: string) => {
    const selectedClinicBot = clinicBotOptions.find((clinicBot) => clinicBot._id === clinicBotId)

    if (!selectedClinicBot) {
      setDecryptClinicBotPasswordRequest(createIdleClinicBotPasswordRequestState())
      setDraft((previousDraft) => ({
        ...previousDraft,
        bot: createEmptyBotSelection(),
      }))

      return
    }

    const requestId = crypto.randomUUID()
    const request = { clinicBotId, requestId, selectedClinicBot }

    setDraft((previousDraft) => ({
      ...previousDraft,
      bot: createPendingBotSelection(clinicBotId),
    }))

    setDecryptClinicBotPasswordRequest(createPendingClinicBotPasswordRequestState(request))
    decryptClinicBotPasswordMutation.mutate(request)
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
    importPatientsMutation.reset()
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
    const executionId = draft.execution.execution.trim()

    if (!executionId) {
      return
    }

    importPatientsMutation.mutate(executionId)
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
    setIsSubmitting(false)
    setDecryptClinicBotPasswordRequest(createIdleClinicBotPasswordRequestState())
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
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await createExecution(payloadPreview)

      await queryClient.invalidateQueries({ queryKey: ['executions'] })
      navigate(`/execution/${response.data._id}`)
    } catch (error) {
      setSubmitError(getExecutionRequestErrorMessage(error, t('submit.errorDescription')))
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
    createdBy,
    customerOptions: customerSearchQuery.data?.customers ?? [],
    isSearchingCustomers: customerSearchQuery.isFetching,
    customerSearchError: customerSearchQuery.error instanceof Error ? customerSearchQuery.error.message : null,
    selectedCustomerError: selectedCustomerQuery.error instanceof Error ? selectedCustomerQuery.error.message : null,
    clinicOptions,
    isLoadingClinics: selectedCustomerQuery.isFetching,
    hasSelectedCustomerWithoutClinics,
    clinicBotOptions,
    isLoadingClinicBots: clinicBotsQuery.isFetching,
    clinicBotsError: clinicBotsQuery.error instanceof Error ? clinicBotsQuery.error.message : null,
    isDecryptingClinicBotPassword: decryptClinicBotPasswordStatus.isPending,
    decryptClinicBotPasswordError: decryptClinicBotPasswordStatus.error,
    hasSelectedClinicWithoutActiveBots,
    executionDayOptions,
    isLoadingExecutionDays: clinicExecutionDaysQuery.isFetching,
    executionDaysError: clinicExecutionDaysQuery.error instanceof Error ? clinicExecutionDaysQuery.error.message : null,
    isImportingPatients: importPatientsMutation.isPending,
    importPatientsError: importPatientsMutation.error instanceof Error ? importPatientsMutation.error.message : null,
    handleStepChange,
    updateContextField,
    updateCustomerSearch,
    clearCustomerSelection,
    selectCustomer,
    selectClinic,
    selectClinicBot,
    updateBotField,
    updateWorkers,
    updateRetries,
    selectExecutionDay,
    importPatients,
    removePatient,
    updateConfig,
    handleNextStep,
    handlePreviousStep,
    handleSubmit,
    resetWizard,
  }
}
