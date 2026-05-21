import axios from 'axios'

const fetcher = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  adapter: 'fetch',
})
export const fetcherExe = axios.create({
  baseURL: import.meta.env.VITE_EXE_API_URL,
  adapter: 'fetch',
})

fetcher.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  if (token) config.headers.set('x-access-token', token)
  config.headers['Content-Type'] = 'application/json'

  return config
})

export default fetcher
