import type { AxiosError } from 'axios'

export const getExecutionRequestErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  const requestError = error as AxiosError<{ message?: string }>

  return requestError.response?.data?.message || fallbackMessage
}
