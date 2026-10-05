export const CCC_API_URLS = ['https://dev-carrier.dentalautomation.ai', 'https://carriers.dentalautomation.ai'] as const
export type CccApiEnvironment = 'dev' | 'prod'

export const CCC_API_URL_ENVIRONMENTS = {
  'https://dev-carrier.dentalautomation.ai': 'dev',
  'https://carriers.dentalautomation.ai': 'prod',
} as const satisfies Record<CccApiUrl, CccApiEnvironment>

export const DEFAULT_CCC_API_URL = CCC_API_URLS[0]
export const AUTH_LOGIN_URL = 'https://auth.controlcentralcarrier.com/'

export type CccApiUrl = (typeof CCC_API_URLS)[number]

export const getCccApiEnvironment = (apiUrl: CccApiUrl): CccApiEnvironment => CCC_API_URL_ENVIRONMENTS[apiUrl]

export const APP_CONFIG = {
  cccApiUrl: DEFAULT_CCC_API_URL,
  authLoginMode: 'dev',
} as const
