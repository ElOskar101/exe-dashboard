export const APP_CONFIG = {
  cccApiUrl: import.meta.env.VITE_API_URL ?? 'https://dev-carrier.dentalautomation.ai',
  exeApiUrl: import.meta.env.VITE_EXE_API_URL ?? '/execution-api',
  authLoginMode: 'dev',
} as const
