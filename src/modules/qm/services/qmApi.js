import api from '@services/api'
const BASE = '/qm'
export const qmApi = {
  getDashboard: () => api.get(`${BASE}/dashboard`),
}
