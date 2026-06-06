export const executionWizardKeys = {
  all: ['execution-wizard'] as const,
  clinicBots: (clinicId: string) => [...executionWizardKeys.all, 'clinic-bots', clinicId] as const,
  clinicExecutionDays: (clinicId: string) => [...executionWizardKeys.all, 'clinic-execution-days', clinicId] as const,
  customer: (customerId: string) => [...executionWizardKeys.all, 'customer', customerId] as const,
  customers: () => [...executionWizardKeys.all, 'customers'] as const,
  customerSearch: (customerSearch: string, options: { limit?: number } = {}) =>
    [...executionWizardKeys.all, 'customer-search', customerSearch, options] as const,
  playwrightProjects: () => [...executionWizardKeys.all, 'playwright-projects'] as const,
}
