import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUTH_LOGIN_URL, CCC_API_URLS, getCccApiEnvironment } from '@/app.config'
import { setCccApiUrl } from '@/lib/ccc-api-url'
import { redirectToLogin } from './auth'

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

const getLoginMode = () => new URL(window.location.href).searchParams.get('mode')

describe('redirectToLogin', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
    vi.stubGlobal('window', Object.assign(new EventTarget(), { location: { href: 'http://localhost:5173/' } }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the user to the login page', () => {
    redirectToLogin()

    expect(window.location.href.startsWith(AUTH_LOGIN_URL)).toBe(true)
  })

  it.each(CCC_API_URLS)('requests a token for the environment of the selected API (%s)', (apiUrl) => {
    setCccApiUrl(apiUrl)

    redirectToLogin()

    expect(getLoginMode()).toBe(getCccApiEnvironment(apiUrl))
  })
})
