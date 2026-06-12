import { useSyncExternalStore } from 'react'

const SECOND_IN_MS = 1000
const MINUTE_IN_MS = 60_000

type CurrentTimePrecision = 'minute' | 'second'

interface CurrentTimeStore {
  getServerSnapshot: () => number
  getSnapshot: () => number
  subscribe: (onStoreChange: () => void) => () => void
}

const createCurrentTimeStore = (intervalMs: number): CurrentTimeStore => {
  let currentTime = Date.now()
  let currentTimeIntervalId: number | null = null
  let currentTimeTimeoutId: number | null = null
  const currentTimeListeners = new Set<() => void>()

  const publish = () => {
    currentTime = Date.now()
    currentTimeListeners.forEach((listener) => listener())
  }

  const clearTimers = () => {
    if (currentTimeTimeoutId !== null) {
      window.clearTimeout(currentTimeTimeoutId)
      currentTimeTimeoutId = null
    }

    if (currentTimeIntervalId !== null) {
      window.clearInterval(currentTimeIntervalId)
      currentTimeIntervalId = null
    }
  }

  const startTicker = () => {
    if (typeof window === 'undefined' || currentTimeTimeoutId !== null || currentTimeIntervalId !== null) {
      return
    }

    const delay = intervalMs - (Date.now() % intervalMs)

    currentTimeTimeoutId = window.setTimeout(() => {
      currentTimeTimeoutId = null
      publish()
      currentTimeIntervalId = window.setInterval(publish, intervalMs)
    }, delay)
  }

  const subscribe = (onStoreChange: () => void) => {
    currentTimeListeners.add(onStoreChange)
    startTicker()

    return () => {
      currentTimeListeners.delete(onStoreChange)

      if (currentTimeListeners.size === 0) {
        clearTimers()
      }
    }
  }

  return {
    getServerSnapshot: () => 0,
    getSnapshot: () => currentTime,
    subscribe,
  }
}

const currentTimeStores = {
  minute: createCurrentTimeStore(MINUTE_IN_MS),
  second: createCurrentTimeStore(SECOND_IN_MS),
}

export const useCurrentTime = (precision: CurrentTimePrecision = 'minute') => {
  const store = currentTimeStores[precision]

  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
}
