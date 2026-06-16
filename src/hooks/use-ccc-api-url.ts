import { useCallback, useSyncExternalStore } from 'react'
import {
  getCccApiUrl,
  getCccApiUrlServerSnapshot,
  isCccApiUrl,
  setCccApiUrl,
  subscribeToCccApiUrl,
} from '@/lib/ccc-api-url'

export const useCccApiUrl = () => {
  const cccApiUrl = useSyncExternalStore(subscribeToCccApiUrl, getCccApiUrl, getCccApiUrlServerSnapshot)

  const updateCccApiUrl = useCallback((nextApiUrl: string | null) => {
    if (isCccApiUrl(nextApiUrl)) {
      setCccApiUrl(nextApiUrl)
    }
  }, [])

  return {
    cccApiUrl,
    setCccApiUrl: updateCccApiUrl,
  }
}
