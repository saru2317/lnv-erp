/**
 * SD Module API — All Sales/Customer API calls
 * Proxied via Vite to http://localhost:3000
 */
import api from '@services/api'
const B = '/sd'

export const sdApi = {
  // Dashboard
  getDashboard:    ()       => api.get(`${B}/dashboard`),

  // Customers
  getCustomers:    (p)      => api.get(`${B}/customers`, { params: p }),
  getCustomerById: (id)     => api.get(`${B}/customers/${id}`),
  createCustomer:  (d)      => api.post(`${B}/customers`, d),
  updateCustomer:  (id, d)  => api.put(`${B}/customers/${id}`, d),

  // Quotations
  getQuotations:   (p)      => api.get(`${B}/quotations`, { params: p }),
  getQuotationById:(id)     => api.get(`${B}/quotations/${id}`),
  createQuotation: (d)      => api.post(`${B}/quotations`, d),
  convertToSO:     (id)     => api.post(`${B}/quotations/${id}/convert`),

  // Sales Orders
  getOrders:       (p)      => api.get(`${B}/orders`, { params: p }),
  getOrderById:    (id)     => api.get(`${B}/orders/${id}`),
  createOrder:     (d)      => api.post(`${B}/orders`, d),
  updateOrder:     (id, d)  => api.put(`${B}/orders/${id}`, d),
  confirmOrder:    (id)     => api.post(`${B}/orders/${id}/confirm`),

  // Invoices
  getInvoices:     (p)      => api.get(`${B}/invoices`, { params: p }),
  getInvoiceById:  (id)     => api.get(`${B}/invoices/${id}`),
  createInvoice:   (d)      => api.post(`${B}/invoices`, d),
  postInvoice:     (id)     => api.post(`${B}/invoices/${id}/post`),
  getGSTSummary:   (p)      => api.get(`${B}/invoices/gst-summary`, { params: p }),

  // Payments
  getPayments:     (p)      => api.get(`${B}/payments`, { params: p }),
  createPayment:   (d)      => api.post(`${B}/payments`, d),

  // Returns / Credit Notes
  getReturns:      (p)      => api.get(`${B}/returns`, { params: p }),
  createReturn:    (d)      => api.post(`${B}/returns`, d),
}
