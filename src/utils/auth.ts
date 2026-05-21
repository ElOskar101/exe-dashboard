import { _base64Encode } from './common'

export const redirectToLogin = (customUrl?: string) => {
  const loginUrl = import.meta.env.VITE_URL_LOGIN
  const mode = import.meta.env.VITE_ENV || 'prod'

  const returnUrl = customUrl || window.location.href
  sessionStorage.setItem('returnUrl', returnUrl)

  window.location.href = `${loginUrl}?url=${_base64Encode(returnUrl)}&mode=${mode}`
}
