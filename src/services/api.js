/**
 * LNV ERP — Central API client
 * Wraps axios with auth token, base URL, and error handling
 */
import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lnv_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle errors globally ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || 'Something went wrong'

    if (status === 401) {
      localStorage.removeItem('lnv_token')
      localStorage.removeItem('lnv_user')
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    } else if (status === 403) {
      toast.error('Access denied for your role.')
    } else if (status === 404) {
      toast.error('Resource not found.')
    } else if (status >= 500) {
      toast.error('Server error. Please try again.')
    } else if (!error.response) {
      toast.error('Network error. Check your connection.')
    }

    return Promise.reject(error)
  }
)

export default api
