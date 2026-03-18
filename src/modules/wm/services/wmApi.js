import api from '@services/api'
const BASE = '/wm'
export const wmApi = {
  getDashboard: () => api.get(`${BASE}/dashboard`),
}
