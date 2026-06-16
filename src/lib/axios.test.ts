import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import cccClient, { ensurePathSuffix, exeClient, exeReportsClient, stripTrailingSlash } from './axios'

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

describe('axios URL helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('strips trailing slashes from configured URLs', () => {
    expect(stripTrailingSlash('https://carrier.dentalautomation.ai///')).toBe('https://carrier.dentalautomation.ai')
  })

  it('adds the api suffix when the base URL points to the host root', () => {
    expect(ensurePathSuffix('https://dev-carrier.dentalautomation.ai/', '/api')).toBe(
      'https://dev-carrier.dentalautomation.ai/api',
    )
  })

  it('does not duplicate the api suffix when it is already present', () => {
    expect(ensurePathSuffix('https://carrier.dentalautomation.ai/api', '/api')).toBe(
      'https://carrier.dentalautomation.ai/api',
    )
  })

  it('uses the selected Carrier API URL for CCC client requests', async () => {
    localStorage.setItem('cccApiUrl', 'https://carriers.dentalautomation.ai')

    await cccClient.get('users/me', {
      adapter: async (config): Promise<AxiosResponse> => {
        expect(config.baseURL).toBe('https://carriers.dentalautomation.ai/api')

        return {
          config,
          data: {},
          headers: {},
          status: 200,
          statusText: 'OK',
        }
      },
    } satisfies AxiosRequestConfig)
  })

  it('does not configure a fallback base URL for the EXE client', () => {
    expect(exeClient.defaults.baseURL).toBeUndefined()
  })

  it('does not configure a fallback base URL for the reports client', () => {
    expect(exeReportsClient.defaults.baseURL).toBeUndefined()
  })

  it('keeps auth headers while opting out of the fetch adapter User-Agent header', async () => {
    localStorage.setItem('token', 'token-123')

    await cccClient.get('users/me', {
      adapter: async (config): Promise<AxiosResponse> => {
        expect(config.headers.get('x-access-token')).toBe('token-123')
        expect(config.headers.get('User-Agent')).toBe(false)

        return {
          config,
          data: {},
          headers: {},
          status: 200,
          statusText: 'OK',
        }
      },
    } satisfies AxiosRequestConfig)
  })
})
