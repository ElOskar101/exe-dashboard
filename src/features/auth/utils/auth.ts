import { APP_CONFIG } from '@/app.config'
import { _base64Encode } from '@/utils/common'
import { storeAuthReturnUrl } from '../lib/auth-session'

export const redirectToLogin = (customUrl?: string) => {
  const loginUrl = import.meta.env.VITE_URL_LOGIN

  const returnUrl = customUrl || window.location.href
  storeAuthReturnUrl(returnUrl)

  window.location.href = `${loginUrl}?url=${encodeURIComponent(_base64Encode(returnUrl))}&mode=${APP_CONFIG.authLoginMode}`
}
