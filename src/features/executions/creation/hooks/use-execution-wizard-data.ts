import { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { mapCCCExecutionRowsToPatients } from '../lib/ccc-execution-patients'
import { getSelectableClinicBots } from '../lib/execution-clinic-bots'
import { executionWizardKeys } from '../lib/execution-wizard-query-keys'
import type { ExecutionPatient, ExecutionWizardDraft } from '../model/execution-create'
import {
  getCCCExecution,
  getClinicBots,
  getClinicExecutionDays,
  getCustomerById,
  searchCustomers,
} from '../services/ccc.service'

interface UseExecutionWizardDataOptions {
  context: ExecutionWizardDraft['context']
  customerSearch: string
  // eslint-disable-next-line no-unused-vars
  onPatientsImported: (result: { executionId: string; patients: ExecutionPatient[] }) => void
}

export const useExecutionWizardData = ({
  context,
  customerSearch,
  onPatientsImported,
}: UseExecutionWizardDataOptions) => {
  const customerSearchEnabled = context.client.trim().length === 0 && customerSearch.length >= 2

  const customerSearchQuery = useQuery({
    queryKey: executionWizardKeys.customerSearch(customerSearch),
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
    queryKey: executionWizardKeys.customer(context.client),
    queryFn: async () => {
      const response = await getCustomerById(context.client)

      return response.data
    },
    enabled: context.client.trim().length > 0,
  })

  const clinicExecutionDaysQuery = useQuery({
    queryKey: executionWizardKeys.clinicExecutionDays(context.clinic),
    queryFn: async () => {
      const response = await getClinicExecutionDays(context.clinic)

      return response.data
    },
    enabled: context.clinic.trim().length > 0,
  })

  const clinicBotsQuery = useQuery({
    queryKey: executionWizardKeys.clinicBots(context.clinic),
    queryFn: async () => {
      const response = await getClinicBots(context.clinic)

      return response.data
    },
    enabled: context.clinic.trim().length > 0,
  })

  const importPatientsMutation = useMutation({
    mutationFn: async (executionId: string) => {
      const response = await getCCCExecution(executionId)

      return response.data
    },
    onSuccess: (execution) => {
      onPatientsImported({
        executionId: execution._id,
        patients: mapCCCExecutionRowsToPatients(execution.rows),
      })
    },
  })

  const clinicOptions = selectedCustomerQuery.data?.clinic ?? []
  const clinicBotOptions = useMemo(() => getSelectableClinicBots(clinicBotsQuery.data ?? []), [clinicBotsQuery.data])
  const executionDayOptions = useMemo(
    () => (clinicExecutionDaysQuery.data ?? []).filter((day) => !day.trashed),
    [clinicExecutionDaysQuery.data],
  )
  const hasSelectedCustomerWithoutClinics =
    context.client.trim().length > 0 && selectedCustomerQuery.status === 'success' && clinicOptions.length === 0
  const hasSelectedClinicWithoutActiveBots =
    context.clinic.trim().length > 0 && clinicBotsQuery.status === 'success' && clinicBotOptions.length === 0

  const importPatients = (executionId: string) => {
    const trimmedExecutionId = executionId.trim()

    if (!trimmedExecutionId) {
      return
    }

    importPatientsMutation.mutate(trimmedExecutionId)
  }

  return {
    clinicBotOptions,
    clinicBotsQuery,
    clinicExecutionDaysQuery,
    clinicOptions,
    customerSearchQuery,
    executionDayOptions,
    hasSelectedClinicWithoutActiveBots,
    hasSelectedCustomerWithoutClinics,
    importPatients,
    importPatientsMutation,
    resetImportPatients: () => importPatientsMutation.reset(),
    selectedCustomerQuery,
  }
}
