export const CCC_API_URLS = ['https://dev-carrier.dentalautomation.ai', 'https://carriers.dentalautomation.ai'] as const

export const DEFAULT_CCC_API_URL = CCC_API_URLS[0]

export type CccApiUrl = (typeof CCC_API_URLS)[number]

export const APP_CONFIG = {
  cccApiUrl: DEFAULT_CCC_API_URL,
  syncApiUrl: 'https://carriersync.dentalautomation.ai/',
  authLoginMode: 'dev',
} as const
