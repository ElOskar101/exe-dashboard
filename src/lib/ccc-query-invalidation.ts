import type { QueryClient, QueryKey } from '@tanstack/react-query'

const CCC_QUERY_KEY_ROOTS = [
  'auth',
  'ccc-users',
  'execution-wizard',
  'playwright-project-catalog',
  'playwright-runtime-catalog',
] as const

const isCccQueryKey = (queryKey: QueryKey) => {
  const [rootKey] = queryKey

  return typeof rootKey === 'string' && CCC_QUERY_KEY_ROOTS.some((cccRootKey) => cccRootKey === rootKey)
}

export const refetchCccEndpointQueries = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({
    predicate: (query) => isCccQueryKey(query.queryKey),
    refetchType: 'active',
  })
