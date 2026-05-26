import { _base64Decode } from '@/utils/common'

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

// eslint-disable-next-line no-unused-vars
export const consumeAuthTokenFromUrl = (saveToken: (token: string) => void) => {
  const url = new URL(window.location.href)
  const token = url.searchParams.get('key')

  if (!token) {
    return false
  }

  const returnUrl = getSafeReturnUrl(sessionStorage.getItem('returnUrl'))
  sessionStorage.removeItem('returnUrl')

  url.searchParams.delete('key')
  window.history.replaceState({}, '', url.toString())

  try {
    saveToken(_base64Decode(token))
    window.location.replace(returnUrl)
    return true
  } catch {
    localStorage.removeItem('token')
    window.location.replace('/')
    return false
  }
}
