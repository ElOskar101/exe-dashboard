import { _base64Decode, _base64Encode } from '@/utils/common'
import { userSchema, type IUser } from '../models/user.interface'

const AUTH_TOKEN_STORAGE_KEY = 'token'
const AUTH_USER_STORAGE_KEY = 'me'
const AUTH_RETURN_URL_STORAGE_KEY = 'returnUrl'

const getLocalStorage = () => (typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage)
const getSessionStorage = () => (typeof globalThis.sessionStorage === 'undefined' ? null : globalThis.sessionStorage)

export const getAuthToken = () => getLocalStorage()?.getItem(AUTH_TOKEN_STORAGE_KEY) ?? ''

export const saveAuthToken = (token: string) => {
  getLocalStorage()?.setItem(AUTH_TOKEN_STORAGE_KEY, token)
}

export const clearAuthToken = () => {
  getLocalStorage()?.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

export const getStoredUser = () => {
  const sessionStorage = getSessionStorage()
  const savedUserData = sessionStorage?.getItem(AUTH_USER_STORAGE_KEY)

  if (!savedUserData) {
    return null
  }

  try {
    const parsedUser = userSchema.safeParse(JSON.parse(_base64Decode(savedUserData)))

    if (parsedUser.success) {
      return parsedUser.data
    }

    sessionStorage?.removeItem(AUTH_USER_STORAGE_KEY)
    return null
  } catch {
    sessionStorage?.removeItem(AUTH_USER_STORAGE_KEY)
    return null
  }
}

export const saveStoredUser = (user: IUser) => {
  getSessionStorage()?.setItem(AUTH_USER_STORAGE_KEY, _base64Encode(JSON.stringify(user)))
}

export const clearStoredUser = () => {
  getSessionStorage()?.removeItem(AUTH_USER_STORAGE_KEY)
}

export const clearAuthSession = () => {
  clearAuthToken()
  clearStoredUser()
}

export const storeAuthReturnUrl = (returnUrl: string) => {
  getSessionStorage()?.setItem(AUTH_RETURN_URL_STORAGE_KEY, returnUrl)
}

export const consumeStoredAuthReturnUrl = () => {
  const sessionStorage = getSessionStorage()
  const returnUrl = sessionStorage?.getItem(AUTH_RETURN_URL_STORAGE_KEY) ?? null

  sessionStorage?.removeItem(AUTH_RETURN_URL_STORAGE_KEY)

  return returnUrl
}
