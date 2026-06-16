import { CCC_API_URLS, DEFAULT_CCC_API_URL, type CccApiUrl } from '@/app.config'

const CCC_API_URL_STORAGE_KEY = 'cccApiUrl'
const CCC_API_URL_CHANGE_EVENT = 'cccapiurlchange'

export const isCccApiUrl = (value: string | null): value is CccApiUrl => CCC_API_URLS.some((apiUrl) => apiUrl === value)

const getStorage = () => globalThis.localStorage

const getStoredCccApiUrl = (): CccApiUrl | null => {
  try {
    const storedApiUrl = getStorage().getItem(CCC_API_URL_STORAGE_KEY)

    return isCccApiUrl(storedApiUrl) ? storedApiUrl : null
  } catch {
    return null
  }
}

export const getCccApiUrl = (): CccApiUrl => getStoredCccApiUrl() ?? DEFAULT_CCC_API_URL

export const getCccApiUrlServerSnapshot = (): CccApiUrl => DEFAULT_CCC_API_URL

export const setCccApiUrl = (nextApiUrl: CccApiUrl) => {
  try {
    getStorage().setItem(CCC_API_URL_STORAGE_KEY, nextApiUrl)
  } catch {
    // Requests still use the default API URL when storage is unavailable.
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CCC_API_URL_CHANGE_EVENT))
  }
}

export const subscribeToCccApiUrl = (onStoreChange: () => void) => {
  const handleCccApiUrlChange = () => onStoreChange()

  window.addEventListener(CCC_API_URL_CHANGE_EVENT, handleCccApiUrlChange)
  window.addEventListener('storage', handleCccApiUrlChange)

  return () => {
    window.removeEventListener(CCC_API_URL_CHANGE_EVENT, handleCccApiUrlChange)
    window.removeEventListener('storage', handleCccApiUrlChange)
  }
}
