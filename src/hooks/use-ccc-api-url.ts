import { useCallback, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  getCccApiUrl,
  getCccApiUrlServerSnapshot,
  isCccApiUrl,
  setCccApiUrl,
  subscribeToCccApiUrl,
} from '@/lib/ccc-api-url'
import { refetchCccEndpointQueries } from '@/lib/ccc-query-invalidation'

export const useCccApiUrl = () => {
  const queryClient = useQueryClient()
  const cccApiUrl = useSyncExternalStore(subscribeToCccApiUrl, getCccApiUrl, getCccApiUrlServerSnapshot)

  const updateCccApiUrl = useCallback(
    (nextApiUrl: string | null) => {
      if (isCccApiUrl(nextApiUrl) && nextApiUrl !== getCccApiUrl()) {
        setCccApiUrl(nextApiUrl)
        void refetchCccEndpointQueries(queryClient)
      }
    },
    [queryClient],
  )

  return {
    cccApiUrl,
    setCccApiUrl: updateCccApiUrl,
  }
}
