import { useContext, useMemo, useState, startTransition } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import {
  getCustomerById,
  searchCustomers,
  type CustomerSearchItem,
} from '../services/ccc.service'
import { useDebouncedValue } from './use-debounced-value'

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
  const debouncedCustomerSearch = useDebouncedValue(
    draft.context.clientName.trim(),
    300,
  )
  const customerSearchEnabled =
    draft.context.client.trim().length === 0 &&
    debouncedCustomerSearch.length >= 2

  const customerSearchQuery = useQuery({
    queryKey: ['execution-customer-search', debouncedCustomerSearch],
    queryFn: async () => {
      const response = await searchCustomers(debouncedCustomerSearch)

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

  const clinicOptions = selectedCustomerQuery.data?.clinic ?? []
  const hasSelectedCustomerWithoutClinics =
    draft.context.client.trim().length > 0 &&
    selectedCustomerQuery.status === 'success' &&
    clinicOptions.length === 0

  const validationErrors = useMemo(
    () =>
      getExecutionWizardValidationErrors(draft, createdBy, t, {
        hasSelectedCustomerWithoutClinics,
      }),
    [createdBy, draft, hasSelectedCustomerWithoutClinics, t],
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

  const updateCustomerSearch = (value: string) => {
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
      }))
    })
  }

  const clearCustomerSelection = () => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      context: {
        ...previousDraft.context,
        client: '',
        clinic: '',
        clinicName: '',
      },
    }))
  }

  const selectCustomer = (customer: CustomerSearchItem) => {
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
      }
    })
  }

  const selectClinic = (clinicId: string) => {
    const selectedClinic = clinicOptions.find(
      (clinic) => clinic._id === clinicId,
    )

    setDraft((previousDraft) => ({
      ...previousDraft,
      context: {
        ...previousDraft.context,
        clinic: clinicId,
        clinicName: selectedClinic?.clinicName ?? '',
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

  const updateConfig = (value: string) => {
    setDraft((previousDraft) => ({
      ...previousDraft,
      execution: {
        ...previousDraft.execution,
        config: value,
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
    customerOptions: customerSearchQuery.data?.customers ?? [],
    isSearchingCustomers: customerSearchQuery.isFetching,
    customerSearchError:
      customerSearchQuery.error instanceof Error
        ? customerSearchQuery.error.message
        : null,
    selectedCustomerError:
      selectedCustomerQuery.error instanceof Error
        ? selectedCustomerQuery.error.message
        : null,
    clinicOptions,
    isLoadingClinics: selectedCustomerQuery.isFetching,
    hasSelectedCustomerWithoutClinics,
    handleStepChange,
    updateContextField,
    updateCustomerSearch,
    clearCustomerSelection,
    selectCustomer,
    selectClinic,
    updateBotField,
    updatePatientField,
    updatePatientVerificationType,
    addPatient,
    removePatient,
    updateWorkers,
    updateRetries,
    updateConfig,
    handleNextStep,
    handlePreviousStep,
    handleSubmit,
    resetWizard,
  }
}
