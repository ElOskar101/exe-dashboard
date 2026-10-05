import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { getCccApiEnvironment } from '@/app.config'
import { useCccApiUrl } from '@/hooks/use-ccc-api-url'
import { getExecutionRequestErrorMessage } from '@/features/executions/shared'
import { useExecutionAppLimits } from '../lib/execution-app-limits'
import {
  buildGeneratedExecutionContext,
  clearGenerateExecutionContextClinicDependents,
  createEmptyGenerateExecutionContextForm,
  getGenerateExecutionContextFieldErrors,
  hasGenerateExecutionContextFieldErrors,
  type GenerateExecutionContextBot,
  type GenerateExecutionContextForm,
} from '../lib/generate-execution-context'
import { getSelectableClinicBots, type SelectableClinicBotRecord } from '../lib/execution-clinic-bots'
import { executionWizardKeys } from '../lib/execution-wizard-query-keys'
import { useClinicBotPasswordRequest } from './use-clinic-bot-password-request'
import {
  getCCCExecution,
  getClinicBots,
  getClinicCarriersConfig,
  getClinicExecutionDays,
  getCustomerById,
  type CustomerSearchItem,
} from '../services/ccc.service'

const mapSelectedClinicBot = (clinicBot: SelectableClinicBotRecord): GenerateExecutionContextBot => ({
  clinicBotRecordId: clinicBot._id,
  id: clinicBot.bot._id,
  botName: clinicBot.bot.botName,
  targetUrl: clinicBot.bot.urlLogin,
  username: clinicBot.username,
  password: '',
  verificationType: clinicBot.bot.type,
})

export const useGenerateExecutionContext = (t: TFunction<'executions'>) => {
  const { cccApiUrl } = useCccApiUrl()
  const env = getCccApiEnvironment(cccApiUrl)
  const appLimits = useExecutionAppLimits()
  const [form, setForm] = useState<GenerateExecutionContextForm>(() => createEmptyGenerateExecutionContextForm())
  const [didGenerate, setDidGenerate] = useState(false)
  const selectedCustomerQuery = useQuery({
    queryKey: executionWizardKeys.customer(form.clientId),
    queryFn: async () => {
      const response = await getCustomerById(form.clientId)

      return response.data
    },
    enabled: form.clientId.trim().length > 0,
  })
  const clinicExecutionDaysQuery = useQuery({
    queryKey: executionWizardKeys.clinicExecutionDays(form.clinicId),
    queryFn: async () => {
      const response = await getClinicExecutionDays(form.clinicId)

      return response.data
    },
    enabled: form.clinicId.trim().length > 0,
  })
  const clinicBotsQuery = useQuery({
    queryKey: executionWizardKeys.clinicBots(form.clinicId),
    queryFn: async () => {
      const response = await getClinicBots(form.clinicId)

      return response.data
    },
    enabled: form.clinicId.trim().length > 0,
  })
  const clinicConfigQuery = useQuery({
    queryKey: executionWizardKeys.clinicCarriersConfig(form.clinicId),
    queryFn: async () => {
      const response = await getClinicCarriersConfig(form.clinicId)

      return response.data
    },
    enabled: form.clinicId.trim().length > 0,
  })
  const importPatientsMutation = useMutation({
    mutationFn: async (executionId: string) => {
      const response = await getCCCExecution(executionId)

      return response.data
    },
    onSuccess: (execution) => {
      setForm((previousForm) =>
        previousForm.executionId === execution._id
          ? {
              ...previousForm,
              sheetName: execution.sheetName,
              patients: execution.rows.map(({ _id, cells, fileNames }) => ({ id: _id, ...cells, fileNames })),
            }
          : previousForm,
      )
    },
  })
  const clinicBotOptions = useMemo(() => getSelectableClinicBots(clinicBotsQuery.data ?? []), [clinicBotsQuery.data])
  const clinicBotPassword = useClinicBotPasswordRequest({
    clinicBotOptions,
    currentClinicBotId: form.bot.clinicBotRecordId,
    onCleared: () => {
      setForm((previousForm) => ({
        ...previousForm,
        bot: {
          ...previousForm.bot,
          password: '',
        },
      }))
    },
    onResolved: (clinicBot, password) => {
      setForm((previousForm) =>
        previousForm.bot.clinicBotRecordId === clinicBot._id
          ? {
              ...previousForm,
              bot: {
                ...previousForm.bot,
                password,
              },
            }
          : previousForm,
      )
    },
  })
  const clinicOptions = selectedCustomerQuery.data?.clinic ?? []
  const executionDayOptions = useMemo(
    () => (clinicExecutionDaysQuery.data ?? []).filter((day) => !day.trashed),
    [clinicExecutionDaysQuery.data],
  )
  const contextInput = {
    env,
    form,
    clinicConfigData: clinicConfigQuery.isSuccess ? clinicConfigQuery.data : undefined,
    workersLimit: appLimits.maxWorkers,
    retriesLimit: appLimits.maxRetries,
  }
  const errors = getGenerateExecutionContextFieldErrors(contextInput, t)

  const updateForm = (updater: (previousForm: GenerateExecutionContextForm) => GenerateExecutionContextForm) => {
    setForm(updater)
  }

  const selectCustomer = (customer: CustomerSearchItem) => {
    importPatientsMutation.reset()
    clinicBotPassword.reset()
    updateForm((previousForm) => {
      if (previousForm.clientId === customer._id) {
        return clearGenerateExecutionContextClinicDependents({
          ...previousForm,
          clientId: '',
          clientName: '',
        })
      }

      return clearGenerateExecutionContextClinicDependents({
        ...previousForm,
        clientId: customer._id,
        clientName: customer.clientName,
      })
    })
  }

  const clearCustomer = () => {
    importPatientsMutation.reset()
    clinicBotPassword.reset()
    updateForm((previousForm) =>
      clearGenerateExecutionContextClinicDependents({
        ...previousForm,
        clientId: '',
        clientName: '',
      }),
    )
  }

  const selectClinic = (clinicId: string) => {
    importPatientsMutation.reset()
    clinicBotPassword.reset()
    const selectedClinic = clinicOptions.find((clinic) => clinic._id === clinicId)

    updateForm((previousForm) => {
      const isClearingClinic = previousForm.clinicId === clinicId

      return {
        ...clearGenerateExecutionContextClinicDependents(previousForm),
        clientId: previousForm.clientId,
        clientName: previousForm.clientName,
        clinicId: isClearingClinic ? '' : clinicId,
        clinicName: isClearingClinic ? '' : (selectedClinic?.clinicName ?? ''),
      }
    })
  }

  const selectExecutionDay = (executionId: string) => {
    const selectedDay = executionDayOptions.find((day) => day._id === executionId)

    importPatientsMutation.reset()
    updateForm((previousForm) => ({
      ...previousForm,
      executionId,
      sheetName: selectedDay?.sheetName ?? '',
      patients: [],
    }))

    if (executionId.trim()) {
      importPatientsMutation.mutate(executionId)
    }
  }

  const selectClinicBot = (clinicBotRecordId: string) => {
    const selectedClinicBot = clinicBotOptions.find((clinicBot) => clinicBot._id === clinicBotRecordId)

    updateForm((previousForm) => ({
      ...previousForm,
      bot: selectedClinicBot
        ? mapSelectedClinicBot(selectedClinicBot)
        : {
            ...previousForm.bot,
            clinicBotRecordId: '',
            id: '',
            verificationType: '',
          },
    }))
    clinicBotPassword.selectClinicBot(clinicBotRecordId)
  }

  const updateBotField = (field: 'botName' | 'targetUrl' | 'username' | 'password', value: string) => {
    updateForm((previousForm) => ({
      ...previousForm,
      bot: {
        ...previousForm.bot,
        [field]: value,
      },
    }))
  }

  return {
    botPasswordError: clinicBotPassword.status.error,
    clinicBotOptions,
    clinicBotsError: clinicBotsQuery.isError
      ? getExecutionRequestErrorMessage(clinicBotsQuery.error, t('validation.clinicBotsTitle'))
      : null,
    clinicConfigError: clinicConfigQuery.isError
      ? getExecutionRequestErrorMessage(clinicConfigQuery.error, t('validation.macroConfigRequired'))
      : null,
    clinicOptions,
    errors,
    executionDayOptions,
    executionDaysError: clinicExecutionDaysQuery.isError
      ? getExecutionRequestErrorMessage(clinicExecutionDaysQuery.error, t('validation.executionDaysTitle'))
      : null,
    form,
    hasSelectedCustomerWithoutClinics:
      form.clientId.trim().length > 0 && selectedCustomerQuery.isSuccess && clinicOptions.length === 0,
    importPatientsError: importPatientsMutation.isError
      ? getExecutionRequestErrorMessage(importPatientsMutation.error, t('validation.importPatientsTitle'))
      : null,
    isDecryptingBotPassword: clinicBotPassword.status.isPending,
    isImportingPatients: importPatientsMutation.isPending,
    isLoadingClinicBots: clinicBotsQuery.isFetching,
    isLoadingClinicConfig: form.clinicId.trim().length > 0 && clinicConfigQuery.isFetching,
    isLoadingClinics: selectedCustomerQuery.isFetching,
    isLoadingExecutionDays: clinicExecutionDaysQuery.isFetching,
    maxRetries: appLimits.maxRetries,
    maxWorkers: appLimits.maxWorkers,
    selectedCustomerError: selectedCustomerQuery.isError
      ? getExecutionRequestErrorMessage(selectedCustomerQuery.error, t('validation.customerSearchTitle'))
      : null,
    showErrors: didGenerate,
    onBotFieldChange: updateBotField,
    onClearCustomer: clearCustomer,
    onClinicBotSelect: selectClinicBot,
    onClinicSelect: selectClinic,
    onCustomerSelect: selectCustomer,
    onExecutionDaySelect: selectExecutionDay,
    onGenerate: () => {
      setDidGenerate(true)

      if (hasGenerateExecutionContextFieldErrors(errors)) {
        return null
      }

      return JSON.stringify(buildGeneratedExecutionContext(contextInput), null, 2)
    },
    onRetriesChange: (retries: string) => {
      updateForm((previousForm) => ({ ...previousForm, retries }))
    },
    onWorkersChange: (workers: string) => {
      updateForm((previousForm) => ({ ...previousForm, workers }))
    },
  }
}
