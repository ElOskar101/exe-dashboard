import { AUTH_LOGIN_URL, getCccApiEnvironment } from '@/app.config'
import { getCccApiUrl } from '@/lib/ccc-api-url'
import { _base64Encode } from '@/utils/common'
import { storeAuthReturnUrl } from '../lib/auth-session'

export const redirectToLogin = (customUrl?: string) => {
  const returnUrl = customUrl || window.location.href
  const loginMode = getCccApiEnvironment(getCccApiUrl())
  storeAuthReturnUrl(returnUrl)

  window.location.href = `${AUTH_LOGIN_URL}?url=${encodeURIComponent(_base64Encode(returnUrl))}&mode=${loginMode}`
}
