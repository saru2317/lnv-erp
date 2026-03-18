/** LNV ERP — App-wide constants */

export const APP_NAME    = 'LNV ERP'
export const APP_VERSION = 'v11'
export const COMPANY     = 'LNV Manufacturing Pvt. Ltd.'
export const LOCATION    = 'Ranipet, Tamil Nadu'

// ─── Module Registry ─────────────────────────────────────────────────────────
export const MODULES = {
  home:   { key: 'home',   label: 'Home',              icon: '🏠',  path: '/home'   },
  sd:     { key: 'sd',     label: 'Sales (SD)',         icon: '📦',  path: '/sd'     },
  mm:     { key: 'mm',     label: 'Purchase (MM)',      icon: '🛒',  path: '/mm'     },
  wm:     { key: 'wm',     label: 'Warehouse (WM)',     icon: '🏗️',  path: '/wm'     },
  fi:     { key: 'fi',     label: 'Finance (FI)',       icon: '💰',  path: '/fi'     },
  pp:     { key: 'pp',     label: 'Production (PP)',    icon: '🎨',  path: '/pp'     },
  qm:     { key: 'qm',     label: 'Quality (QM)',       icon: '🔬',  path: '/qm'     },
  pm:     { key: 'pm',     label: 'Maintenance (PM)',   icon: '🔧',  path: '/pm'     },
  hcm:    { key: 'hcm',    label: 'HR (HCM)',           icon: '👥',  path: '/hcm'    },
  crm:    { key: 'crm',    label: 'CRM',                icon: '🤝',  path: '/crm'    },
  config: { key: 'config', label: 'Configuration',      icon: '⚙️',  path: '/config' },
}

// ─── Role Labels ─────────────────────────────────────────────────────────────
export const ROLES = {
  admin:      { label: 'Super Admin',    icon: '👑', color: '#714B67' },
  manager:    { label: 'Plant Manager',  icon: '🏭', color: '#B85A2E' },
  accounts:   { label: 'Accounts',       icon: '💰', color: '#007A77' },
  operations: { label: 'Operator',       icon: '⚙️', color: '#015E63' },
  hr:         { label: 'HR Manager',     icon: '👥', color: '#6C3483' },
  sales:      { label: 'Sales Officer',  icon: '📦', color: '#015E63' },
}

// ─── GST Rates ───────────────────────────────────────────────────────────────
export const GST_RATES = [0, 5, 12, 18, 28]

// ─── Indian States for GST ───────────────────────────────────────────────────
export const STATES = [
  { code: '33', name: 'Tamil Nadu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '07', name: 'Delhi' },
  { code: '06', name: 'Haryana' },
  { code: '09', name: 'Uttar Pradesh' },
]

// ─── Pagination ───────────────────────────────────────────────────────────────
export const PAGE_SIZE = 20
