import { _base64Decode } from '@/utils/common'
import { clearAuthToken, consumeStoredAuthReturnUrl, saveAuthToken } from '../lib/auth-session'

const getSafeReturnUrl = (storedReturnUrl: string | null) => {
  if (!storedReturnUrl) {
    return '/'
  }

  try {
    const returnUrl = new URL(storedReturnUrl, window.location.origin)

    if (returnUrl.origin !== window.location.origin) {
      return '/'
    }

    return `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`
  } catch {
    return '/'
  }
}

export const consumeAuthTokenFromUrl = () => {
  const url = new URL(window.location.href)
  const token = url.searchParams.get('key')

  if (!token) {
    return false
  }

  const returnUrl = getSafeReturnUrl(consumeStoredAuthReturnUrl())

  url.searchParams.delete('key')
  window.history.replaceState({}, '', url.toString())

  try {
    saveAuthToken(_base64Decode(token))
    window.location.replace(returnUrl)
    return true
  } catch {
    clearAuthToken()
    window.location.replace('/')
    return false
  }
}
