export const APP_CONFIG = {
  cccApiUrl: 'https://dev-carrier.dentalautomation.ai',
  exeApiUrl: import.meta.env.VITE_EXE_API_URL ?? 'https://api.controlcentralcarrier.com/api/v1',
  authLoginMode: 'dev',
} as const
