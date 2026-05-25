import { _base64Encode } from '@/utils/common'
import { APP_CONFIG } from '@/app.config'

export const redirectToLogin = (customUrl?: string) => {
  const loginUrl = import.meta.env.VITE_URL_LOGIN

  const returnUrl = customUrl || window.location.href
  sessionStorage.setItem('returnUrl', returnUrl)

  window.location.href = `${loginUrl}?url=${_base64Encode(returnUrl)}&mode=${APP_CONFIG.authLoginMode}`
}
