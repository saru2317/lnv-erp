import api from '@services/api'
const BASE = '/fi'
export const fiApi = {
  getDashboard: () => api.get(`${BASE}/dashboard`),
}
