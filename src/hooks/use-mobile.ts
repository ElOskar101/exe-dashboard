import { useSyncExternalStore } from 'react'

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

const subscribeToMobile = (onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia(MOBILE_QUERY)

  mediaQuery.addEventListener('change', onStoreChange)

  return () => mediaQuery.removeEventListener('change', onStoreChange)
}

const getMobileSnapshot = () => {
  return window.matchMedia(MOBILE_QUERY).matches
}

const getServerMobileSnapshot = () => false

export function useIsMobile() {
  return useSyncExternalStore(subscribeToMobile, getMobileSnapshot, getServerMobileSnapshot)
}
