import axios, { type InternalAxiosRequestConfig } from 'axios'

const stripTrailingSlash = (value?: string) => value?.replace(/\/+$/, '')

const cccClient = axios.create({
  baseURL: stripTrailingSlash(import.meta.env.VITE_API_URL),
  adapter: 'fetch',
})
export const exeClient = axios.create({
  baseURL: stripTrailingSlash(import.meta.env.VITE_EXE_API_URL),
  adapter: 'fetch',
})

const applyDefaultHeaders = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.set('x-access-token', token)

  return config
}

cccClient.interceptors.request.use(applyDefaultHeaders)
exeClient.interceptors.request.use(applyDefaultHeaders)

export default cccClient
