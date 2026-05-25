import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from './protected-route'
import { AuthContext, type IAuthContext } from '../contexts/context'

vi.mock('../utils/auth', () => ({
  redirectToLogin: vi.fn(),
}))

const baseAuthContext: IAuthContext = {
  token: 'token',
  saveToken: vi.fn(),
  clearToken: vi.fn(),
  logout: vi.fn(),
  isLoadingUser: false,
  permissions: { admin: true },
  user: {
    _id: 'user-1',
    username: 'operator',
    fullName: 'Operator One',
    roles: [],
  } as unknown as IAuthContext['user'],
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    })
  })

  it('shows a loading status while user data is being resolved', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={{ ...baseAuthContext, isLoadingUser: true, user: null }}>
        <ProtectedRoute>
          <div>secret content</div>
        </ProtectedRoute>
      </AuthContext.Provider>,
    )

    expect(html).toContain('Checking access...')
    expect(html).not.toContain('secret content')
  })

  it('renders protected children after the user is available', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={baseAuthContext}>
        <ProtectedRoute>
          <div>secret content</div>
        </ProtectedRoute>
      </AuthContext.Provider>,
    )

    expect(html).toContain('secret content')
  })
})
