import { _base64Decode } from '@/utils/common'

// eslint-disable-next-line no-unused-vars
export const listenForToken = (saveToken: (token: string) => void) => {
  const url = new URL(window.location.href)
  const token = url.searchParams.get('key')

  if (token) {
    saveToken(_base64Decode(token))

    const returnUrl = sessionStorage.getItem('returnUrl') || '/'
    sessionStorage.removeItem('returnUrl')

    url.searchParams.delete('key')
    window.history.replaceState({}, '', url.toString())

    window.location.href = returnUrl
  }
}
