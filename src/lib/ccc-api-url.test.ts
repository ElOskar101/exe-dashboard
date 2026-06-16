import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CCC_API_URLS, DEFAULT_CCC_API_URL } from '@/app.config'
import {
  getCccApiUrl,
  getCccApiUrlServerSnapshot,
  isCccApiUrl,
  setCccApiUrl,
  subscribeToCccApiUrl,
} from './ccc-api-url'

const createStorageMock = (): Storage => {
  const storage = new Map<string, string>()

  return {
    clear() {
      storage.clear()
    },
    getItem(key) {
      return storage.get(key) ?? null
    },
    key(index) {
      return Array.from(storage.keys())[index] ?? null
    },
    get length() {
      return storage.size
    },
    removeItem(key) {
      storage.delete(key)
    },
    setItem(key, value) {
      storage.set(key, value)
    },
  }
}

const createThrowingStorageMock = (): Storage => ({
  clear() {},
  getItem() {
    throw new Error('Storage unavailable')
  },
  key() {
    return null
  },
  get length() {
    return 0
  },
  removeItem() {
    throw new Error('Storage unavailable')
  },
  setItem() {
    throw new Error('Storage unavailable')
  },
})

const createWindowMock = () => new EventTarget()

describe('ccc-api-url', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('window', createWindowMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the default API URL when nothing is stored', () => {
    expect(getCccApiUrl()).toBe(DEFAULT_CCC_API_URL)
  })

  it('returns the stored API URL after it is set', () => {
    const url = CCC_API_URLS[1]

    setCccApiUrl(url)

    expect(getCccApiUrl()).toBe(url)
  })

  it('persists the selected URL to localStorage', () => {
    const url = CCC_API_URLS[1]

    setCccApiUrl(url)

    expect(localStorage.getItem('cccApiUrl')).toBe(url)
  })

  it('dispatches a change event when the URL is updated', () => {
    const handler = vi.fn()

    window.addEventListener('cccapiurlchange', handler)
    setCccApiUrl(CCC_API_URLS[1])

    expect(handler).toHaveBeenCalledTimes(1)

    window.removeEventListener('cccapiurlchange', handler)
  })

  it('treats unavailable storage as missing state instead of throwing', () => {
    vi.stubGlobal('localStorage', createThrowingStorageMock())

    expect(() => setCccApiUrl(CCC_API_URLS[1])).not.toThrow()
    expect(getCccApiUrl()).toBe(DEFAULT_CCC_API_URL)
  })

  it('provides a stable server snapshot matching the default', () => {
    expect(getCccApiUrlServerSnapshot()).toBe(DEFAULT_CCC_API_URL)
  })

  describe('isCccApiUrl', () => {
    it('accepts URLs from the allowlist', () => {
      for (const url of CCC_API_URLS) {
        expect(isCccApiUrl(url)).toBe(true)
      }
    })

    it('rejects unknown URLs', () => {
      expect(isCccApiUrl('https://evil.example.com')).toBe(false)
    })

    it('rejects null', () => {
      expect(isCccApiUrl(null)).toBe(false)
    })
  })

  describe('subscribeToCccApiUrl', () => {
    it('calls the callback when a change event fires', () => {
      const callback = vi.fn()
      const unsubscribe = subscribeToCccApiUrl(callback)

      window.dispatchEvent(new Event('cccapiurlchange'))

      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()
    })

    it('calls the callback when a storage event fires', () => {
      const callback = vi.fn()
      const unsubscribe = subscribeToCccApiUrl(callback)

      window.dispatchEvent(new Event('storage'))

      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()
    })

    it('stops calling the callback after unsubscribe', () => {
      const callback = vi.fn()
      const unsubscribe = subscribeToCccApiUrl(callback)

      unsubscribe()
      window.dispatchEvent(new Event('cccapiurlchange'))

      expect(callback).not.toHaveBeenCalled()
    })
  })
})
