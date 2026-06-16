import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CCC_API_URLS, DEFAULT_CCC_API_URL } from '@/app.config'
import { useCccApiUrl } from './use-ccc-api-url'

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

const capturedSetters: Array<(url: string | null) => void> = []

function TestComponent() {
  const { cccApiUrl, setCccApiUrl } = useCccApiUrl()

  capturedSetters.push(setCccApiUrl)

  return <div>{cccApiUrl}</div>
}

describe('useCccApiUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('window', new EventTarget())
    capturedSetters.length = 0
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the default API URL during server render', () => {
    const html = renderToStaticMarkup(<TestComponent />)

    expect(html).toContain(DEFAULT_CCC_API_URL)
  })

  it('persists a valid URL through the exposed setter', () => {
    renderToStaticMarkup(<TestComponent />)

    capturedSetters[0](CCC_API_URLS[1])

    expect(localStorage.getItem('cccApiUrl')).toBe(CCC_API_URLS[1])
  })

  it('ignores invalid URLs passed to the setter', () => {
    renderToStaticMarkup(<TestComponent />)

    capturedSetters[0]('https://evil.example.com')

    expect(localStorage.getItem('cccApiUrl')).toBeNull()
  })
})
