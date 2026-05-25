import axios, { type InternalAxiosRequestConfig } from 'axios'
import { APP_CONFIG } from '@/app.config'

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
  baseURL: ensurePathSuffix(APP_CONFIG.cccApiUrl, '/api'),
  adapter: 'fetch',
})
export const exeClient = axios.create({
  baseURL: stripTrailingSlash(APP_CONFIG.exeApiUrl),
  adapter: 'fetch',
})
export const exeReportsClient = axios.create({
  baseURL: stripTrailingSlash(APP_CONFIG.exeReportsUrl),
  adapter: 'fetch',
})

const applyDefaultHeaders = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.set('x-access-token', token)

  return config
}

cccClient.interceptors.request.use(applyDefaultHeaders)
exeClient.interceptors.request.use(applyDefaultHeaders)
exeReportsClient.interceptors.request.use(applyDefaultHeaders)

export default cccClient
