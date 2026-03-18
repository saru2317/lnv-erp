/**
 * MM Module API — All Purchase/Vendor API calls
 * Base URL: /api/mm/ (proxied to localhost:3000/mm/)
 */
import api from '@services/api'

const BASE = '/mm'

// Purchase Orders
export const mmApi = {
  // POs
  getPOs:        (params) => api.get(`${BASE}/po`, { params }),
  getPOById:     (id)     => api.get(`${BASE}/po/${id}`),
  createPO:      (data)   => api.post(`${BASE}/po`, data),
  updatePO:      (id, data)=> api.put(`${BASE}/po/${id}`, data),
  approvePO:     (id)     => api.post(`${BASE}/po/${id}/approve`),
  sendPO:        (id)     => api.post(`${BASE}/po/${id}/send`),

  // GRN
  getGRNs:       (params) => api.get(`${BASE}/grn`, { params }),
  getGRNById:    (id)     => api.get(`${BASE}/grn/${id}`),
  createGRN:     (data)   => api.post(`${BASE}/grn`, data),

  // Vendor Invoices
  getInvoices:   (params) => api.get(`${BASE}/invoices`, { params }),
  getInvoiceById:(id)     => api.get(`${BASE}/invoices/${id}`),
  createInvoice: (data)   => api.post(`${BASE}/invoices`, data),
  payInvoice:    (id, data)=> api.post(`${BASE}/invoices/${id}/pay`, data),

  // Vendors
  getVendors:    (params) => api.get(`${BASE}/vendors`, { params }),
  getVendorById: (id)     => api.get(`${BASE}/vendors/${id}`),
  createVendor:  (data)   => api.post(`${BASE}/vendors`, data),
  updateVendor:  (id, data)=> api.put(`${BASE}/vendors/${id}`, data),
  getVendorLedger:(id)    => api.get(`${BASE}/vendors/${id}/ledger`),

  // Materials
  getMaterials:  (params) => api.get(`${BASE}/materials`, { params }),
  createMaterial:(data)   => api.post(`${BASE}/materials`, data),

  // Payments
  getPayments:   (params) => api.get(`${BASE}/payments`, { params }),
  createPayment: (data)   => api.post(`${BASE}/payments`, data),

  // RFQ
  getRFQs:       (params) => api.get(`${BASE}/rfq`, { params }),
  createRFQ:     (data)   => api.post(`${BASE}/rfq`, data),
  convertRFQtoPO:(id)     => api.post(`${BASE}/rfq/${id}/convert`),

  // Dashboard
  getDashboard:  ()       => api.get(`${BASE}/dashboard`),
}
