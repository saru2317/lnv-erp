// src/modules/mm/services/mmApi.js
// Centralized API calls for MM module

const BASE  = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok   = () => localStorage.getItem('lnv_token')
const hdr   = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2  = () => ({ Authorization:`Bearer ${tok()}` })

// ── Generic request helper (MM routes) ───────────────
const req = async (method, path, body) => {
  const res  = await fetch(`${BASE}/mm${path}`,
    { method, headers: body ? hdr() : hdr2(),
      body: body ? JSON.stringify(body) : undefined })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ── Stock routes helper (/api/stock — separate router) ─
const stockReq = async (method, path) => {
  const res  = await fetch(`${BASE}/stock${path}`,
    { method, headers: hdr2() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const mmApi = {

  // ── DASHBOARD ──────────────────────────────────────
  dashboard:            ()            => req('GET',    '/dashboard'),

  // ── PR (Purchase Indent) ───────────────────────────
  getPRList:            (q='')        => req('GET',    `/pr${q}`),
  createPR:             (body)        => req('POST',   '/pr', body),
  updatePR:             (id, body)    => req('PATCH',  `/pr/${id}`, body),
  submitPR:             (id)          => req('POST',   `/pr/${id}/submit`),
  approvePR:            (id, body)    => req('POST',   `/pr/${id}/approve`, body),
  rejectPR:             (id, body)    => req('POST',   `/pr/${id}/reject`, body),
  preclosePR:           (id, body)    => req('POST',   `/pr/${id}/preclose`, body),
  getPRItems:           (id)          => req('GET',    `/pr/${id}/items`),
  getPRNextNo:          ()            => req('GET',    '/pr/next-no'),

  // ── CS (Comparative Statement) ─────────────────────
  getCSList:            ()            => req('GET',    '/cs'),
  getCS:                (id)          => req('GET',    `/cs/${id}`),
  createCS:             (body)        => req('POST',   '/cs', body),
  approveCS:            (id, body)    => req('PATCH',  `/cs/${id}/approve`, body),
  deleteCS:             (id)          => req('DELETE', `/cs/${id}`),
  getCSNextNo:          ()            => req('GET',    '/cs/next-no'),

  // ── PO (Purchase Order) ────────────────────────────
  getPOList:            (q='')        => req('GET',    `/po${q}`),
  getPO:                (id)          => req('GET',    `/po/${id}`),
  createPO:             (body)        => req('POST',   '/po', body),
  updatePO:             (id, body)    => req('PATCH',  `/po/${id}`, body),
  approvePO:            (id, body)    => req('PATCH',  `/po/${id}`, { status:'APPROVED', ...body }),
  cancelPO:             (id)          => req('PATCH',  `/po/${id}/cancel`),
  getPONextNo:          (type='PO')   => req('GET',    `/po/next-no?type=${type}`),

  // ── GRN (Gate Receipt Note) ────────────────────────
  getGRNList:           (q='')        => req('GET',    `/grn${q}`),
  getGRN:               (id)          => req('GET',    `/grn/${id}`),
  createGRN:            (body)        => req('POST',   '/grn', body),

  // ── QC Inspection (Incoming — from GRN) ───────────
  getQCList:            (grnId)       => req('GET',    `/qc-inspection${grnId ? `?grnId=${grnId}` : ''}`),
  getQC:                (id)          => req('GET',    `/qc-inspection/${id}`),
  createQC:             (body)        => req('POST',   '/qc-inspection', body),
  approveQC:            (id, body)    => req('PATCH',  `/qc-inspection/${id}/approve`, body),

  // ── Material Issue to WO ───────────────────────────
  getMaterialIssues:    (woId)        => req('GET',    `/material-issue${woId ? `?woId=${woId}` : ''}`),
  createMaterialIssue:  (body)        => req('POST',   '/material-issue', body),

  // ── Vendor Invoice ─────────────────────────────────
  getInvoices:          (q='')        => req('GET',    `/invoices${q}`),
  getInvoiceNextNo:     ()            => req('GET',    '/invoices/next-no'),
  createInvoice:        (body)        => req('POST',   '/invoices', body),
  updateInvoice:        (id, body)    => req('PATCH',  `/invoices/${id}`, body),
  payInvoice:           (id, body)    => req('PATCH',  `/invoices/${id}/pay`, body),

  // ── RFQ ────────────────────────────────────────────
  getRFQList:           ()            => req('GET',    '/rfq'),
  getRFQ:               (id)          => req('GET',    `/rfq/${id}`),
  createRFQ:            (body)        => req('POST',   '/rfq', body),
  addQuote:             (id, body)    => req('POST',   `/rfq/${id}/quote`, body),

  // ── Purchase Returns ───────────────────────────────
  getReturns:           ()            => req('GET',    '/returns'),
  createReturn:         (body)        => req('POST',   '/returns', body),

  // ── Vendors & Items (master lookups) ──────────────
  getVendors:           ()            => req('GET',    '/vendors'),
  getVendorNextCode:    ()            => req('GET',    '/vendors/next-code'),
  createVendor:         (body)        => req('POST',   '/vendors/create', body),
  getItems:             ()            => req('GET',    '/items'),

  // ── Stock (uses /api/stock router directly) ────────
  getStockSummary:      ()            => stockReq('GET', '/summary'),
  getStockLedger:       (itemId)      => stockReq('GET', `?itemId=${itemId}`),
}
