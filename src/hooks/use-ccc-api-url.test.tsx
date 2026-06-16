import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
let queryClient: QueryClient

function TestComponent() {
  const { cccApiUrl, setCccApiUrl } = useCccApiUrl()

  capturedSetters.push(setCccApiUrl)

  return <div>{cccApiUrl}</div>
}

function renderTestComponent() {
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <TestComponent />
    </QueryClientProvider>,
  )
}

describe('useCccApiUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('window', new EventTarget())
    queryClient = new QueryClient()
    capturedSetters.length = 0
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the default API URL during server render', () => {
    const html = renderTestComponent()

    expect(html).toContain(DEFAULT_CCC_API_URL)
  })

  it('persists a valid URL through the exposed setter', () => {
    renderTestComponent()

    capturedSetters[0](CCC_API_URLS[1])

    expect(localStorage.getItem('cccApiUrl')).toBe(CCC_API_URLS[1])
  })

  it('ignores invalid URLs passed to the setter', () => {
    renderTestComponent()

    capturedSetters[0]('https://evil.example.com')

    expect(localStorage.getItem('cccApiUrl')).toBeNull()
  })
})
