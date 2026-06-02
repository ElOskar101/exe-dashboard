export const executionWizardKeys = {
  all: ['execution-wizard'] as const,
  clinicBots: (clinicId: string) => [...executionWizardKeys.all, 'clinic-bots', clinicId] as const,
  clinicExecutionDays: (clinicId: string) => [...executionWizardKeys.all, 'clinic-execution-days', clinicId] as const,
  customer: (customerId: string) => [...executionWizardKeys.all, 'customer', customerId] as const,
  customerSearch: (customerSearch: string) => [...executionWizardKeys.all, 'customer-search', customerSearch] as const,
}
