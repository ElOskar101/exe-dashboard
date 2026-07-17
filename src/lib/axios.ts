import axios, { type InternalAxiosRequestConfig } from 'axios'
import { getAuthRequestHeaders } from '@/features/auth/lib/auth-transport'
import { getCccApiUrl } from '@/lib/ccc-api-url'

export const stripTrailingSlash = (value?: string) => value?.replace(/\/+$/, '')

export const ensurePathSuffix = (value: string | undefined, suffix: string) => {
  const normalizedValue = stripTrailingSlash(value)
  const normalizedSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`

  if (!normalizedValue || normalizedValue.endsWith(normalizedSuffix)) {
    return normalizedValue
  }

  return `${normalizedValue}${normalizedSuffix}`
}

const cccClient = axios.create({
  adapter: 'fetch',
})
export const exeClient = axios.create({
  adapter: 'fetch',
})
export const exeReportsClient = axios.create({
  adapter: 'fetch',
})

const applyDefaultHeaders = (config: InternalAxiosRequestConfig) => {
  config.headers.set('User-Agent', false)

  for (const [headerName, value] of Object.entries(getAuthRequestHeaders())) {
    config.headers.set(headerName, value)
  }

  return config
}

const applyCccRequestConfig = (config: InternalAxiosRequestConfig) => {
  config.baseURL = ensurePathSuffix(getCccApiUrl(), '/api')

  return applyDefaultHeaders(config)
}

cccClient.interceptors.request.use(applyCccRequestConfig)
exeClient.interceptors.request.use(applyDefaultHeaders)
exeReportsClient.interceptors.request.use(applyDefaultHeaders)

export default cccClient
