import type { AxiosInstance } from 'axios'
import { clearAuthSession } from '../lib/auth-session'
import { redirectToLogin } from '../utils/auth'

export const setupAuthInterceptors = (api: AxiosInstance) => {
  api.interceptors.response.use(
    (response) => response,

    async (error) => {
      const status = error?.response?.status

      if (status === 401) {
        clearAuthSession()
        redirectToLogin()

        return Promise.reject(error)
      }

      return Promise.reject(error)
    },
  )
}
