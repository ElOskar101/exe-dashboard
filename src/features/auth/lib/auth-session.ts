import { _base64Decode, _base64Encode } from '@/utils/common'
import { userSchema, type IUser } from '../models/user.interface'

const AUTH_TOKEN_STORAGE_KEY = 'token'
const AUTH_USER_STORAGE_KEY = 'me'
const AUTH_USER_CCC_API_URL_STORAGE_KEY = 'meCccApiUrl'
const AUTH_RETURN_URL_STORAGE_KEY = 'returnUrl'

const getStorage = (storageKey: 'localStorage' | 'sessionStorage') => {
  try {
    const storage = globalThis[storageKey]

    return typeof storage === 'undefined' ? null : storage
  } catch {
    return null
  }
}

const getLocalStorage = () => getStorage('localStorage')
const getSessionStorage = () => getStorage('sessionStorage')

const readStorageValue = (storage: Storage | null, key: string) => {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

const writeStorageValue = (storage: Storage | null, key: string, value: string) => {
  try {
    storage?.setItem(key, value)
  } catch {
    return
  }
}

const removeStorageValue = (storage: Storage | null, key: string) => {
  try {
    storage?.removeItem(key)
  } catch {
    return
  }
}

export const getAuthToken = () => readStorageValue(getLocalStorage(), AUTH_TOKEN_STORAGE_KEY) ?? ''

export const saveAuthToken = (token: string) => {
  writeStorageValue(getLocalStorage(), AUTH_TOKEN_STORAGE_KEY, token)
}

export const clearAuthToken = () => {
  removeStorageValue(getLocalStorage(), AUTH_TOKEN_STORAGE_KEY)
}

export const getStoredUserSession = () => {
  const sessionStorage = getSessionStorage()
  const savedUserData = readStorageValue(sessionStorage, AUTH_USER_STORAGE_KEY)

  if (!savedUserData) {
    return null
  }

  try {
    const parsedUser = userSchema.safeParse(JSON.parse(_base64Decode(savedUserData)))

    if (parsedUser.success) {
      return {
        cccApiUrl: readStorageValue(sessionStorage, AUTH_USER_CCC_API_URL_STORAGE_KEY) ?? '',
        user: parsedUser.data,
      }
    }

    removeStorageValue(sessionStorage, AUTH_USER_STORAGE_KEY)
    return null
  } catch {
    removeStorageValue(sessionStorage, AUTH_USER_STORAGE_KEY)
    return null
  }
}

export const getStoredUser = () => getStoredUserSession()?.user ?? null

export const saveStoredUser = (user: IUser, cccApiUrl: string) => {
  const sessionStorage = getSessionStorage()

  writeStorageValue(sessionStorage, AUTH_USER_STORAGE_KEY, _base64Encode(JSON.stringify(user)))
  writeStorageValue(sessionStorage, AUTH_USER_CCC_API_URL_STORAGE_KEY, cccApiUrl)
}

export const clearStoredUser = () => {
  const sessionStorage = getSessionStorage()

  removeStorageValue(sessionStorage, AUTH_USER_STORAGE_KEY)
  removeStorageValue(sessionStorage, AUTH_USER_CCC_API_URL_STORAGE_KEY)
}

export const clearAuthSession = () => {
  clearAuthToken()
  clearStoredUser()
}

export const storeAuthReturnUrl = (returnUrl: string) => {
  writeStorageValue(getSessionStorage(), AUTH_RETURN_URL_STORAGE_KEY, returnUrl)
}

export const consumeStoredAuthReturnUrl = () => {
  const sessionStorage = getSessionStorage()
  const returnUrl = readStorageValue(sessionStorage, AUTH_RETURN_URL_STORAGE_KEY)

  removeStorageValue(sessionStorage, AUTH_RETURN_URL_STORAGE_KEY)

  return returnUrl
}
