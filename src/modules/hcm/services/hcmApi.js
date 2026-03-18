import api from '@services/api'
const BASE = '/hcm'
export const hcmApi = {
  getDashboard: () => api.get(`${BASE}/dashboard`),
}
