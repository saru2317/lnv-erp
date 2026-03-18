import api from './api'

const AuthService = {
  /** POST /auth/login */
  login: (credentials) => api.post('/auth/login', credentials),

  /** POST /auth/logout */
  logout: () => api.post('/auth/logout'),

  /** GET /auth/me — get current user from token */
  getMe: () => api.get('/auth/me'),

  /** POST /auth/refresh */
  refreshToken: () => api.post('/auth/refresh'),
}

export default AuthService
