import { getAuthToken } from './auth-session'

const getNormalizedAuthToken = () => getAuthToken().trim()

export const getAuthRequestHeaders = () => {
  const token = getNormalizedAuthToken()

  return token ? { 'x-access-token': token } : {}
}

export const getSocketAuthPayload = () => {
  const token = getNormalizedAuthToken()

  return token ? { token } : {}
}
