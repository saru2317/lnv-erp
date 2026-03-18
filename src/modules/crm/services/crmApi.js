import api from '@services/api'
const BASE = '/crm'
export const crmApi = {
  getDashboard: () => api.get(`${BASE}/dashboard`),
}
