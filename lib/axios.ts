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

export function getAxiosErrorMessage(
  error: unknown,
  fallbackMessage: string
) {
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

    return `${fallbackMessage}: ${error.message}`
  }

  if (error instanceof Error) {
    return `${fallbackMessage}: ${error.message}`
  }

  return fallbackMessage
}

export default api
