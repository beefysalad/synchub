import axios from 'axios'
import type { AxiosError, AxiosInstance } from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized access')
    }

    if (error.response?.status === 500) {
      console.error('Server error')
    }

    return Promise.reject(error)
  }
)

export function createExternalApi(config?: {
  baseURL?: string
  headers?: Record<string, string>
  timeout?: number
}): AxiosInstance {
  return axios.create({
    baseURL: config?.baseURL,
    timeout: config?.timeout ?? 15000,
    headers: {
      'Content-Type': 'application/json',
      ...(config?.headers ?? {}),
    },
  })
}

export function getAxiosErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data

    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData
    }

    if (
      responseData &&
      typeof responseData === 'object' &&
      'error' in responseData &&
      typeof responseData.error === 'string'
    ) {
      return responseData.error
    }

    if (
      responseData &&
      typeof responseData === 'object' &&
      'message' in responseData &&
      typeof responseData.message === 'string'
    ) {
      const details =
        'errors' in responseData && Array.isArray(responseData.errors)
          ? responseData.errors
              //eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((item: any) =>
                item && typeof item === 'object' && 'message' in item
                  ? String(item.message)
                  : JSON.stringify(item)
              )
              .filter(Boolean)
              .join(', ')
          : ''

      return details
        ? `${responseData.message}: ${details}`
        : responseData.message
    }

    return `${fallbackMessage}: ${error.message}`
  }

  if (error instanceof Error) {
    return `${fallbackMessage}: ${error.message}`
  }

  return fallbackMessage
}

export default api
