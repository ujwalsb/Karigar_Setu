import axios from 'axios'

function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL
  // If in browser on production / deployed domain (non-localhost)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // If VITE_API_URL is missing or was baked in with localhost, use relative /api/v1
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return '/api/v1'
    }
  }
  return envUrl || '/api/v1'
}

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('us_token') : null
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginPath = typeof window !== 'undefined' && window.location.pathname === '/login'
    const isAuthEndpoint = error.config?.url?.includes('/auth/')

    // Only redirect to /login on 401 if we are NOT already on /login and not an auth endpoint
    if (error.response?.status === 401 && !isLoginPath && !isAuthEndpoint) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('us_token')
        window.location.href = '/login'
      }
    }

    let message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred'

    if (Array.isArray(error.response?.data?.errors) && error.response.data.errors.length > 0) {
      const details = error.response.data.errors
        .map((e: any) => e.message || e.msg)
        .filter(Boolean)
        .join(', ')
      if (details) {
        message = `${message}: ${details}`
      }
    }

    const customErr = new Error(message) as any
    customErr.response = error.response
    customErr.status = error.response?.status
    return Promise.reject(customErr)
  }
)

export default apiClient

