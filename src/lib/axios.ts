import axios, { type InternalAxiosRequestConfig } from 'axios'

const fetcher = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  adapter: 'fetch',
})
export const fetcherExe = axios.create({
  baseURL: import.meta.env.VITE_EXE_API_URL,
  adapter: 'fetch',
})

const applyDefaultHeaders = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.set('x-access-token', token)
  config.headers['Content-Type'] = 'application/json'

  return config
}

fetcher.interceptors.request.use(applyDefaultHeaders)
fetcherExe.interceptors.request.use(applyDefaultHeaders)

export default fetcher
