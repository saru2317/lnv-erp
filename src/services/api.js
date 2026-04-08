// ═══════════════════════════════════════════════════════
// LNV ERP — Frontend API Service
// src/services/api.js
// ═══════════════════════════════════════════════════════

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// ── Helper ────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('lnv_token')
}

async function request(method, path, body = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
  }
  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  const res  = await fetch(`${BASE_URL}${path}`, options)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return data
}

const get    = (path)         => request('GET',    path)
const post   = (path, body)   => request('POST',   path, body)
const patch  = (path, body)   => request('PATCH',  path, body)
const del    = (path)         => request('DELETE', path)

// ── AUTH ──────────────────────────────────────────────────
export const authAPI = {
  login:   (email, password) => post('/auth/login', { email, password }),
  logout:  ()                => { localStorage.removeItem('lnv_token') },
  me:      ()                => get('/auth/me'),
}

// ── ITEMS (MDM) ───────────────────────────────────────────
export const itemsAPI = {
  getAll:      (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return get(`/items${q ? '?' + q : ''}`)
  },
  getById:     (id)          => get(`/items/${id}`),
  create:      (data)        => post('/items', data),
  update:      (id, data)    => patch(`/items/${id}`, data),
  deactivate:  (id)          => del(`/items/${id}`),
  getStock:    (id)          => get(`/items/${id}/stock`),
  getCategories: ()          => get('/items/meta/categories'),
}

// ── CUSTOMERS (MDM) ───────────────────────────────────────
export const customersAPI = {
  getAll:  (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return get(`/customers${q ? '?' + q : ''}`)
  },
  getById: (id)          => get(`/customers/${id}`),
  create:  (data)        => post('/customers', data),
  update:  (id, data)    => patch(`/customers/${id}`, data),
}

// ── SUPPLIERS (MDM) ───────────────────────────────────────
export const suppliersAPI = {
  getAll:  (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return get(`/suppliers${q ? '?' + q : ''}`)
  },
  getById: (id)          => get(`/suppliers/${id}`),
  create:  (data)        => post('/suppliers', data),
  update:  (id, data)    => patch(`/suppliers/${id}`, data),
}

// ── SALES ─────────────────────────────────────────────────
export const salesAPI = {
  orders: {
    getAll:  (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return get(`/sales/orders${q ? '?' + q : ''}`)
    },
    getById: (id)          => get(`/sales/orders/${id}`),
    create:  (data)        => post('/sales/orders', data),
    update:  (id, data)    => patch(`/sales/orders/${id}`, data),
  },
  invoices: {
    getAll:  (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return get(`/sales/invoices${q ? '?' + q : ''}`)
    },
    getById: (id)          => get(`/sales/invoices/${id}`),
    create:  (data)        => post('/sales/invoices', data),
  },
}

// ── PURCHASE ──────────────────────────────────────────────
export const purchaseAPI = {
  orders: {
    getAll:  (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return get(`/purchase/orders${q ? '?' + q : ''}`)
    },
    getById: (id)          => get(`/purchase/orders/${id}`),
    create:  (data)        => post('/purchase/orders', data),
    update:  (id, data)    => patch(`/purchase/orders/${id}`, data),
  },
  grn: {
    getAll:  ()            => get('/purchase/grn'),
    getById: (id)          => get(`/purchase/grn/${id}`),
    create:  (data)        => post('/purchase/grn', data),
  },
}

// ── STOCK ─────────────────────────────────────────────────
export const stockAPI = {
  getLedger:   (itemId)      => get(`/stock/ledger?itemId=${itemId}`),
  getOverview: ()            => get('/stock/overview'),
  getAlerts:   ()            => get('/stock/alerts'),
}

// ── PRODUCTION ────────────────────────────────────────────
export const productionAPI = {
  workOrders: {
    getAll:  (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return get(`/production/orders${q ? '?' + q : ''}`)
    },
    getById: (id)          => get(`/production/orders/${id}`),
    create:  (data)        => post('/production/orders', data),
    update:  (id, data)    => patch(`/production/orders/${id}`, data),
  },
  batches: {
    getAll:  ()            => get('/production/batches'),
    getById: (id)          => get(`/production/batches/${id}`),
    create:  (data)        => post('/production/batches', data),
    update:  (id, data)    => patch(`/production/batches/${id}`, data),
  },
}

// ── FINANCE ───────────────────────────────────────────────
export const financeAPI = {
  journals: {
    getAll:  (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return get(`/finance/journals${q ? '?' + q : ''}`)
    },
    getById: (id)          => get(`/finance/journals/${id}`),
    create:  (data)        => post('/finance/journals', data),
  },
  coa:      ()             => get('/finance/coa'),
  daybook:  (from, to)     => get(`/finance/daybook?from=${from}&to=${to}`),
}

// ── HR ────────────────────────────────────────────────────
export const hrAPI = {
  employees: {
    getAll:  ()            => get('/hr/employees'),
    getById: (id)          => get(`/hr/employees/${id}`),
    create:  (data)        => post('/hr/employees', data),
    update:  (id, data)    => patch(`/hr/employees/${id}`, data),
  },
  attendance: {
    getByDate: (date)      => get(`/hr/attendance?date=${date}`),
    mark:      (data)      => post('/hr/attendance', data),
  },
  salary: {
    getAll:  ()            => get('/hr/salary'),
    getById: (id)          => get(`/hr/salary/${id}`),
  },
}

// ── DASHBOARD ─────────────────────────────────────────────
export const dashboardAPI = {
  getSummary: () => get('/dashboard'),
  getKPIs:    () => get('/dashboard/kpis'),
}

// ── QUALITY ───────────────────────────────────────────────
export const qualityAPI = {
  checks: {
    getAll:  ()      => get('/quality/checks'),
    getById: (id)    => get(`/quality/checks/${id}`),
    create:  (data)  => post('/quality/checks', data),
  },
}

// ── HEALTH CHECK ──────────────────────────────────────────
export const healthCheck = () => fetch(`${BASE_URL}/health`).then(r => r.json())
