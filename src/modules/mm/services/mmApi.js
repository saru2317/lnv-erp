// src/modules/mm/services/mmApi.js
// Centralized API calls for MM module

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })

const req = async (method, path, body) => {
  const res  = await fetch(`${BASE}/mm${path}`,
    { method, headers: body?hdr():hdr2(),
      body: body?JSON.stringify(body):undefined })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error||'Request failed')
  return data
}

export const mmApi = {
  // Dashboard
  dashboard:     ()        => req('GET',  '/dashboard'),

  // PR
  getPRList:     (q='')    => req('GET',  `/pr${q}`),
  createPR:      (body)    => req('POST', '/pr', body),
  updatePR:      (id,body) => req('PATCH',`/pr/${id}`, body),

  // CS
  getCSList:     ()        => req('GET',  '/cs'),
  createCS:      (body)    => req('POST', '/cs', body),
  approveCS:     (id,body) => req('PATCH',`/cs/${id}/approve`, body),

  // PO
  getPOList:     (q='')    => req('GET',  `/po${q}`),
  getPO:         (id)      => req('GET',  `/po/${id}`),
  createPO:      (body)    => req('POST', '/po', body),
  updatePO:      (id,body) => req('PATCH',`/po/${id}`, body),

  // GRN
  getGRNList:    (q='')    => req('GET',  `/grn${q}`),
  createGRN:     (body)    => req('POST', '/grn', body),

  // Invoices
  getInvoices:   (q='')    => req('GET',  `/invoices${q}`),
  createInvoice: (body)    => req('POST', '/invoices', body),
  payInvoice:    (id,body) => req('PATCH',`/invoices/${id}/pay`, body),

  // Masters
  getVendors:    ()        => req('GET',  '/vendors'),
  getItems:      ()        => req('GET',  '/items'),
}
