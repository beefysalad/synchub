import axios from 'axios'

/**
 * Normalizes error messages from API calls.
 * Extracts message from Axios response if available, otherwise uses generic error message.
 */
export const handleApiError = (error: unknown): never => {
  let errorMessage = 'An unexpected error occurred'

  if (axios.isAxiosError(error)) {
    // If the server returned a JSON error response like { error: "..." }
    errorMessage = error.response?.data?.error || error.message
  } else if (error instanceof Error) {
    errorMessage = error.message
  }

  throw new Error(errorMessage)
}
