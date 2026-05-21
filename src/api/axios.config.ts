import axios from 'axios'
import { setupInterceptors } from './interceptors'

const fetcher = axios.create({ baseURL: import.meta.env.VITE_API_URL })
export const fetcherExe = axios.create({
  baseURL: import.meta.env.VITE_SOCKET_URL + '/api/v1',
})

fetcher.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  if (token) config.headers.set('x-access-token', token)
  config.headers['Content-Type'] = 'application/json'

  return config
})

setupInterceptors(fetcher)

export default fetcher
