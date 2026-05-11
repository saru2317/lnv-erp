/**
 * SD Module API — All Sales/Customer API calls
 * Uses direct fetch — no dependency on api.js default export
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('lnv_token')}`,
})

const get  = (path, params) => {
  const url = new URL(BASE_URL + path)
  if (params) Object.entries(params).forEach(([k,v]) => v && url.searchParams.set(k, v))
  return fetch(url.toString(), { headers: headers() }).then(r => r.json())
}
const post = (path, body)   => fetch(BASE_URL + path, { method:'POST', headers: headers(), body: JSON.stringify(body) }).then(r => r.json())
const put  = (path, body)   => fetch(BASE_URL + path, { method:'PUT',  headers: headers(), body: JSON.stringify(body) }).then(r => r.json())
const del  = (path)         => fetch(BASE_URL + path, { method:'DELETE', headers: headers() }).then(r => r.json())

export const sdApi = {
  // Dashboard
  getDashboard:    ()       => get('/sd/dashboard'),

  // Customers
  getCustomers:    (p)      => get('/sd/customers', p),
  getCustomerById: (id)     => get(`/sd/customers/${id}`),
  createCustomer:  (d)      => post('/sd/customers', d),
  updateCustomer:  (id, d)  => put(`/sd/customers/${id}`, d),

  // Quotations
  getQuotations:   (p)      => get('/sd/quotations', p),
  getQuotationById:(id)     => get(`/sd/quotations/${id}`),
  createQuotation: (d)      => post('/sd/quotations', d),
  convertToSO:     (id)     => post(`/sd/quotations/${id}/convert`),

  // Sales Orders
  getOrders:       (p)      => get('/sd/orders', p),
  getOrderById:    (id)     => get(`/sd/orders/${id}`),
  createOrder:     (d)      => post('/sd/orders', d),
  updateOrder:     (id, d)  => put(`/sd/orders/${id}`, d),
  confirmOrder:    (id)     => post(`/sd/orders/${id}/confirm`),

  // Invoices
  getInvoices:     (p)      => get('/sd/invoices', p),
  getInvoiceById:  (id)     => get(`/sd/invoices/${id}`),
  createInvoice:   (d)      => post('/sd/invoices', d),
  postInvoice:     (id)     => post(`/sd/invoices/${id}/post`),
  getGSTSummary:   (p)      => get('/sd/invoices/gst-summary', p),

  // Payments / Receipts
  getPayments:     (p)      => get('/sd/payments', p),
  createPayment:   (d)      => post('/sd/payments', d),

  // Returns / Credit Notes
  getReturns:      (p)      => get('/sd/returns', p),
  createReturn:    (d)      => post('/sd/returns', d),
}
