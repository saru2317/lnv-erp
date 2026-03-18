import api from '@services/api'
const BASE = '/pp'
export const ppApi = {
  getDashboard: () => api.get(`${BASE}/dashboard`),
}
