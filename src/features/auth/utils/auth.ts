import { APP_CONFIG, AUTH_LOGIN_URL } from '@/app.config'
import { _base64Encode } from '@/utils/common'
import { storeAuthReturnUrl } from '../lib/auth-session'

export const redirectToLogin = (customUrl?: string) => {
  const returnUrl = customUrl || window.location.href
  storeAuthReturnUrl(returnUrl)

  window.location.href = `${AUTH_LOGIN_URL}?url=${encodeURIComponent(_base64Encode(returnUrl))}&mode=${APP_CONFIG.authLoginMode}`
}
