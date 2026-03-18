import api from '@services/api'
const BASE = '/pm'
export const pmApi = {
  getDashboard: () => api.get(`${BASE}/dashboard`),
}
