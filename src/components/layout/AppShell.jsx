import React from 'react'
import { Toaster } from 'react-hot-toast'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import UniversalSearch from '@components/ui/UniversalSearch'
import NotificationsPanel from '@components/ui/NotificationsPanel'
import styles from './AppShell.module.css'
import LNVAssistant from '@components/ui/LNVAssistant'

const ALL_MODULES = [
  { key:'home',    label:'Home',        icon:'🏠' },
  { key:'sd',      label:'Sales',       icon:'🛒' },
  { key:'mm',      label:'Purchase',    icon:'📦' },
  { key:'wm',      label:'Warehouse',   icon:'🏭' },
  { key:'fi',      label:'Finance',     icon:'💰' },
  { key:'pp',      label:'Production',  icon:'⚙️'  },
  { key:'qm',      label:'Quality',     icon:'✅' },
  { key:'pm',      label:'Maintenance', icon:'🔧' },
  { key:'hcm',     label:'HR',          icon:'👥' },
  { key:'crm',     label:'CRM',         icon:'🤝' },
  { key:'admin',   label:'Admin',       icon:'👤' },
  { key:'config',  label:'Config',      icon:'⚙️'  },
  { key:'tm',      label:'Transport',   icon:'🚛' },
  { key:'am',      label:'Assets',      icon:'🏗️'  },
  { key:'civil',   label:'Civil',       icon:'👷' },
  { key:'edu',     label:'Education',   icon:'🎓' },
  { key:'vm',      label:'Visitor',     icon:'🪪' },
  { key:'cn',      label:'Canteen',     icon:'🍽️'  },
  { key:'reports', label:'Reports',     icon:'📊' },
  { key:'kpi',     label:'KPI / KRA',   icon:'🎯' },
  { key:'mdm',     label:'MDM',         icon:'🗄️'  },
  { key:'ai',      label:'AI Analytics',icon:'🤖' },
]

// Home/Admin/Config/Reports/MDM/AI are core — they stay in their fixed slot.
// Everything else gets reordered per Company Profile → Module Order (Super Admin).
const FIXED_NAV_KEYS = ['home','admin','config','reports','mdm','ai']

function getOrderedModules() {
  let savedOrder = []
  try { savedOrder = JSON.parse(localStorage.getItem('lnv_module_order') || 'null') || [] } catch {}
  if (!savedOrder.length) return ALL_MODULES

  const rank = (k) => { const i = savedOrder.indexOf(k); return i === -1 ? 999 : i }
  const reorderable = ALL_MODULES.filter(m => !FIXED_NAV_KEYS.includes(m.key))
    .sort((a, b) => rank(a.key) - rank(b.key))

  let ptr = 0
  return ALL_MODULES.map(m => FIXED_NAV_KEYS.includes(m.key) ? m : reorderable[ptr++])
}

// Route → human label map for recent tracking
const ROUTE_LABELS = {
  '/home':'Home Dashboard', '/sd':'Sales', '/sd/sales':'Sales Orders',
  '/sd/invoices':'Invoices', '/sd/customers':'Customer Master', '/sd/quotations':'Quotations',
  '/sd/deliveries':'Deliveries', '/sd/reports':'Sales Report', '/sd/sales/new':'New Sales Order',
  '/sd/invoices/new':'New Invoice',
  '/mm':'Purchase', '/mm/po':'Purchase Orders', '/mm/pr':'Purchase Indent',
  '/mm/grn':'Goods Receipt', '/mm/vendors':'Vendors', '/mm/materials':'Material Master',
  '/mm/cs':'Comparative Statement', '/mm/po/new':'New Purchase Order',
  '/wm':'Warehouse', '/wm/stock':'Stock Overview', '/wm/transfers':'Stock Transfers',
  '/fi':'Finance', '/fi/jv':'Journal Entry', '/fi/pl':'Profit & Loss',
  '/fi/bs':'Balance Sheet', '/fi/gstr3b':'GSTR-3B', '/fi/trial':'Trial Balance',
  '/fi/approvals':'Approvals', '/fi/bank-recon':'Bank Reconciliation',
  '/fi/coa':'Chart of Accounts', '/fi/cashflow':'Cash Flow',
  '/pp':'Production', '/pp/wo':'Work Orders', '/pp/bom':'Bill of Materials',
  '/qm':'Quality', '/qm/ncr':'NCR', '/qm/inspection':'Inspection',
  '/pm':'Maintenance', '/hcm':'HR', '/hcm/employees':'Employees',
  '/hcm/payroll':'Payroll', '/hcm/leave':'Leave', '/hcm/attendance':'Attendance',
  '/crm':'CRM', '/crm/leads':'Leads', '/tm':'Transport', '/tm/vehicles':'Vehicles',
  '/am':'Assets', '/civil':'Civil', '/vm':'Visitor', '/cn':'Canteen',
  '/reports':'Reports', '/kpi':'KPI / KRA', '/mdm':'MDM', '/ai':'AI Analytics',
  '/admin':'Admin Dashboard', '/config':'Config', '/config/users':'User Management',
  '/admin/support':'🎫 Support', '/admin/billing':'💰 LNV Billing',
  '/admin/users':'User Management', '/admin/approvals':'Approval Inbox',
  '/admin/controls':'Controls & Limits', '/admin/audit/logs':'Audit Log',
  '/config/company':'Company Profile', '/config/approval-matrix':'Approval Matrix',
  '/sd/einvoice':'e-Invoice (IRN)', '/sd/ewaybill':'e-Way Bill',
  '/sd/dc':'Delivery Challan', '/sd/payments':'Payment Receipts',
  '/mm/vendor-invoices':'Vendor Invoice', '/mm/vendor-payments':'Vendor Payments',
  '/pp/production-entry':'Production Entry', '/pp/work-center-board':'Work Center Board',
  '/pp/capacity-planning':'Capacity Planning', '/pp/mould-master':'Mould Master',
  '/pp/mrp':'MRP Run', '/qm/inspections':'Inspection List',
  '/qm/capa':'CAPA', '/qm/complaints':'Complaints',
  '/hcm/statutory':'Statutory Reports', '/hcm/increment':'Increment Management',
  '/crm/opportunities':'Opportunity Pipeline', '/crm/activities':'Activity Log',
  '/fi/jv/new':'New Journal Entry', '/fi/daybook':'Day Book',
  '/fi/ledger':'General Ledger', '/fi/budget':'Budget vs Actual',
}

const getModKey = (path) => path.split('/').filter(Boolean)[0] || 'home'

// Per-user localStorage keys
const storageKey = (userId, type) => `lnv_${type}_${userId}`

const loadJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}

const ROLE_COLORS = {
  SUPER_ADMIN:'#4A235A', ADMIN:'#714B67', MANAGER:'#017E84',
  ACCOUNTS:'#E06F39', PRODUCTION:'#784212', OPERATIONS:'#00A09D',
  HR:'#8E44AD', SALES:'#2980B9', TRANSPORT:'#E06F39',
  CIVIL:'#1B4F72', PURCHASE:'#1A5276', WAREHOUSE:'#117A65', VIEWER:'#6C757D',
}

export default function AppShell() {
  const { user, logout, hasAccess, isModuleEnabled } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const currentMod = location.pathname.split('/')[1] || 'home'
  const now = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
  const [aiConfig, setAiConfig] = React.useState(null)

  // ── Favorites state (per user) ───────────────────────────
  const userId = user?.id || 'guest'
  const [pinned,  setPinned]  = React.useState(() => loadJSON(storageKey(userId,'pinned'), []))
  const [recent,  setRecent]  = React.useState(() => loadJSON(storageKey(userId,'recent'), []))

  // Track route changes → update recent
  React.useEffect(() => {
    const path  = location.pathname
    const label = ROUTE_LABELS[path]
    if (!label || path === '/') return
    const mod   = getModKey(path)
    if (!hasAccess(mod)) return

    setRecent(prev => {
      const filtered = prev.filter(r => r.path !== path)
      const updated  = [{ path, label, mod }, ...filtered].slice(0, 10)
      localStorage.setItem(storageKey(userId,'recent'), JSON.stringify(updated))
      return updated
    })
  }, [location.pathname])

  // Persist pinned
  const togglePin = (item, e) => {
    e.stopPropagation()
    setPinned(prev => {
      const exists  = prev.find(p => p.path === item.path)
      const updated = exists
        ? prev.filter(p => p.path !== item.path)
        : [{ path:item.path, label:item.label, mod:item.mod }, ...prev].slice(0, 8)
      localStorage.setItem(storageKey(userId,'pinned'), JSON.stringify(updated))
      return updated
    })
  }

  const isPinned = (path) => pinned.some(p => p.path === path)

  // Favorites bar items: pinned first, then recent (no duplicates), max 8
  const favItems = [
    ...pinned,
    ...recent.filter(r => !isPinned(r.path)),
  ].slice(0, 8)

  // Load AI config
  const loadAiConfig = React.useCallback(() => {
    const token = localStorage.getItem('lnv_token')
    if (!token) return
    const cached = localStorage.getItem('lnv_ai_config')
    if (cached) {
      try {
        const cfg = JSON.parse(cached)
        if (cfg.aiEnabled) { setAiConfig(cfg); return }
      } catch {}
    }
    fetch((import.meta.env.VITE_API_URL||'http://localhost:3000/api') + '/ai/settings', {
      headers:{ Authorization:`Bearer ${token}` }
    }).then(r=>r.json()).then(d => {
      if (d.data?.aiEnabled) {
        setAiConfig(d.data)
        localStorage.setItem('lnv_ai_config', JSON.stringify(d.data))
      } else {
        setAiConfig(null)
      }
    }).catch(()=>{})
  }, [])

  React.useEffect(() => {
    loadAiConfig()
    const onStorage = (e) => {
      if (e.key === 'lnv_ai_config' || e.key === 'lnv_ai_enabled') loadAiConfig()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [loadAiConfig])

  return (
    <div className={styles.shell}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <div className={styles.logoWrap}>
            <div className={styles.logoIcon} style={{
              background:'linear-gradient(135deg,#E06F39,#F5A623)',
              boxShadow:'0 2px 8px rgba(224,111,57,.4)'
            }}>LNV</div>
            <div>
              <span className={styles.logoName} style={{letterSpacing:'.5px'}}>LNV ERP</span>
              <span className={styles.logoSub} style={{
                background:'rgba(255,255,255,.2)',padding:'1px 5px',
                borderRadius:3,fontSize:9,marginLeft:4,fontWeight:700
              }}>v2.0</span>
            </div>
          </div>
        </div>

        <UniversalSearch />

        <div className={styles.topRight}>
          <div className={styles.shellDate}>{now}</div>
          <NotificationsPanel />
          <button className={styles.iconBtn} onClick={() => navigate('/config')} title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <span className={styles.roleBadge} style={{ borderColor: ROLE_COLORS[user?.role] }}>
            {user?.role?.toUpperCase()}
          </span>
          <div className={styles.userPill} onClick={logout} title="Click to logout">
            <div className={styles.userAvatar} style={{ background: ROLE_COLORS[user?.role] || '#714B67' }}>
              {user?.name?.[0] || 'U'}
            </div>
            <div>
              <div className={styles.userTextName}>{user?.name}</div>
              <div className={styles.userTextRole}>
                {(() => { try { return JSON.parse(localStorage.getItem('lnv_company')||'{}')?.name || 'LNV Manufacturing' } catch { return 'LNV Manufacturing' } })()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Module Nav Bar */}
      <nav className={styles.modNav}>
        {getOrderedModules().map(m => {
          if (!hasAccess(m.key)) return null
          if (!isModuleEnabled(m.key)) return null  // hidden if disabled in Company Profile
          return (
            <div key={m.key}
              className={`${styles.navItem} ${currentMod === m.key ? styles.active : ''}`}
              onClick={() => navigate('/' + m.key)}>
              <span className={styles.modIcon}>{m.icon}</span>
              {m.label}
            </div>
          )
        })}
      </nav>

      {/* Favorites Bar */}
      <div style={{
        height:30, background:'#FAFAFA', borderBottom:'1px solid #E8E0E8',
        display:'flex', alignItems:'center', padding:'0 14px', gap:2,
        overflowX:'auto', flexShrink:0,
      }}>
        <span style={{ fontSize:10, fontWeight:700, color:'#9B8EA0',
          marginRight:6, whiteSpace:'nowrap', letterSpacing:.8,
          textTransform:'uppercase', flexShrink:0 }}>
          ★ Favorites
        </span>
        {favItems.length === 0 && (
          <span style={{ fontSize:11, color:'#B0A0B8', fontStyle:'italic' }}>
            Navigate pages — they appear here. Click ★ to pin.
          </span>
        )}
        {favItems.map(item => {
          const pinned_ = isPinned(item.path)
          const isActive = location.pathname === item.path
          return (
            <div key={item.path}
              style={{ display:'flex', alignItems:'center', gap:3, padding:'2px 8px',
                borderRadius:3, cursor:'pointer', whiteSpace:'nowrap', fontSize:11,
                flexShrink:0, transition:'all .15s', userSelect:'none',
                color: isActive ? '#714B67' : '#5A5065',
                background: isActive ? '#EDE0EA' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                borderBottom: isActive ? '2px solid #714B67' : '2px solid transparent',
              }}
              onClick={() => navigate(item.path)}
              onMouseEnter={e => { if(!isActive) e.currentTarget.style.background='#F0EAF4' }}
              onMouseLeave={e => { if(!isActive) e.currentTarget.style.background='transparent' }}>
              {item.label}
              <span
                onClick={(e) => togglePin(item, e)}
                title={pinned_ ? 'Unpin' : 'Pin to favorites'}
                style={{ fontSize:10, color: pinned_ ? '#E8A020' : '#C0B0C8',
                  cursor:'pointer', lineHeight:1, padding:'1px 2px',
                  transition:'color .15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = pinned_ ? '#C07010' : '#714B67' }}
                onMouseLeave={e => { e.currentTarget.style.color = pinned_ ? '#E8A020' : '#C0B0C8' }}>
                {pinned_ ? '★' : '☆'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      {aiConfig?.aiEnabled && <LNVAssistant config={aiConfig} />}

      <Toaster
        position="bottom-center"
        gutter={12}
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'Tahoma, Verdana, sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            padding: '12px 20px',
            borderRadius: '8px',
            minWidth: '280px',
            boxShadow: '0 8px 32px rgba(0,0,0,.25)',
          },
          success: {
            style: { background: '#1C1C1C', color: '#fff' },
            iconTheme: { primary:'#4CAF50', secondary:'#fff' },
          },
          error: {
            style: { background: '#DC3545', color: '#fff' },
            iconTheme: { primary:'#fff', secondary:'#DC3545' },
          },
        }}
      />
    </div>
  )
}

