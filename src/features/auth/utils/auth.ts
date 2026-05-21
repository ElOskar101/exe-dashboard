import { _base64Encode } from '@/utils/common'

const getLoginMode = () => {
  return import.meta.env.MODE === 'development' ? 'dev' : 'prod'
}

export const redirectToLogin = (customUrl?: string) => {
  const loginUrl = import.meta.env.VITE_URL_LOGIN
  const mode = getLoginMode()

  const returnUrl = customUrl || window.location.href
  sessionStorage.setItem('returnUrl', returnUrl)

  window.location.href = `${loginUrl}?url=${_base64Encode(returnUrl)}&mode=${mode}`
}
