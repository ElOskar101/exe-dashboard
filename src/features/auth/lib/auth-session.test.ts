import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { IUser } from '../models/user.interface'
import {
  clearAuthSession,
  consumeStoredAuthReturnUrl,
  getAuthToken,
  getStoredUser,
  getStoredUserSession,
  saveAuthToken,
  saveStoredUser,
  storeAuthReturnUrl,
} from './auth-session'

const CCC_API_URL = 'https://dev-carrier.dentalautomation.ai'

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

const createUser = (): IUser => ({
  twoFactor: {
    isEnabled: false,
    secret: '',
  },
  recovering: {
    code: '',
  },
  recoveringCode: '',
  _id: 'user-1',
  fullName: 'QA Operator',
  username: 'operator',
  studioAccess: true,
  urlImage: '',
  qaEmail: 'qa@example.com',
  email: 'operator@example.com',
  roles: [
    {
      _id: 'role-1',
      name: 'admin',
      permission: [
        {
          _id: 'permission-1',
          name: 'admin',
          description: 'Full access',
        },
      ],
    },
  ],
  devices: [],
  settings: {
    _id: 'settings-1',
    theme: 'light',
    skypeNotification: false,
    emailNotification: true,
    silentNotification: false,
    autoDarkMode: false,
    startAutoMode: '08:00',
    endAutoMode: '17:00',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  area: 'qa',
  pushNotificationsSettings: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  lastLogin: '2026-01-01T00:00:00.000Z',
  loginCounter: 1,
})

describe('auth-session', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persists and reads the auth token through one seam', () => {
    saveAuthToken('token-123')

    expect(getAuthToken()).toBe('token-123')
  })

  it('persists and reads the cached user payload', () => {
    const user = createUser()

    saveStoredUser(user, CCC_API_URL)

    expect(getStoredUser()).toEqual(user)
    expect(getStoredUserSession()).toEqual({ cccApiUrl: CCC_API_URL, user })
  })

  it('clears invalid cached users instead of leaking broken state', () => {
    sessionStorage.setItem('me', 'not-base64')

    expect(getStoredUser()).toBeNull()
    expect(sessionStorage.getItem('me')).toBeNull()
  })

  it('consumes the stored return url exactly once', () => {
    storeAuthReturnUrl('/execution/exe-1')

    expect(consumeStoredAuthReturnUrl()).toBe('/execution/exe-1')
    expect(consumeStoredAuthReturnUrl()).toBeNull()
  })

  it('clears token and cached user together when the session ends', () => {
    saveAuthToken('token-123')
    saveStoredUser(createUser(), CCC_API_URL)

    clearAuthSession()

    expect(getAuthToken()).toBe('')
    expect(getStoredUser()).toBeNull()
  })

  it('treats unavailable storage as missing state instead of throwing', () => {
    vi.stubGlobal('localStorage', createThrowingStorageMock())
    vi.stubGlobal('sessionStorage', createThrowingStorageMock())

    expect(() => saveAuthToken('token-123')).not.toThrow()
    expect(() => saveStoredUser(createUser(), CCC_API_URL)).not.toThrow()
    expect(() => storeAuthReturnUrl('/execution/exe-1')).not.toThrow()
    expect(() => clearAuthSession()).not.toThrow()

    expect(getAuthToken()).toBe('')
    expect(getStoredUser()).toBeNull()
    expect(consumeStoredAuthReturnUrl()).toBeNull()
  })
})
