import { useSyncExternalStore } from 'react'

const MINUTE_IN_MS = 60_000

let currentTime = Date.now()
let currentTimeIntervalId: number | null = null
let currentTimeTimeoutId: number | null = null

const currentTimeListeners = new Set<() => void>()

const publishCurrentTime = () => {
  currentTime = Date.now()
  currentTimeListeners.forEach((listener) => listener())
}

const clearCurrentTimeTimers = () => {
  if (currentTimeTimeoutId !== null) {
    window.clearTimeout(currentTimeTimeoutId)
    currentTimeTimeoutId = null
  }

  if (currentTimeIntervalId !== null) {
    window.clearInterval(currentTimeIntervalId)
    currentTimeIntervalId = null
  }
}

const startCurrentTimeTicker = () => {
  if (typeof window === 'undefined' || currentTimeTimeoutId !== null || currentTimeIntervalId !== null) {
    return
  }

  const delay = MINUTE_IN_MS - (Date.now() % MINUTE_IN_MS)

  currentTimeTimeoutId = window.setTimeout(() => {
    currentTimeTimeoutId = null
    publishCurrentTime()
    currentTimeIntervalId = window.setInterval(publishCurrentTime, MINUTE_IN_MS)
  }, delay)
}

const subscribeToCurrentTime = (onStoreChange: () => void) => {
  currentTimeListeners.add(onStoreChange)
  startCurrentTimeTicker()

  return () => {
    currentTimeListeners.delete(onStoreChange)

    if (currentTimeListeners.size === 0) {
      clearCurrentTimeTimers()
    }
  }
}

const getCurrentTimeSnapshot = () => currentTime

const getServerSnapshot = () => 0

export const useCurrentTime = () => {
  return useSyncExternalStore(subscribeToCurrentTime, getCurrentTimeSnapshot, getServerSnapshot)
}
