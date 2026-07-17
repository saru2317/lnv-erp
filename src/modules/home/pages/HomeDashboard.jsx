import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' })
const INR  = n => '₹' + parseFloat(n||0).toLocaleString('en-IN', { maximumFractionDigits:0 })
const CR   = n => { const v=parseFloat(n||0); return v>=10000000?`₹${(v/10000000).toFixed(2)}Cr`:v>=100000?`₹${(v/100000).toFixed(1)}L`:INR(v) }

// ── SIDEBAR DATA ──────────────────────────────────────────
const SIDEBAR_GROUPS = [
  { key:'operations', label:'Operations', color:'#017E84', items:[
    { label:'Sales (SD)',        icon:'🛒', path:'/sd',    mod:'sd',      desc:'Orders · Invoices' },
    { label:'Purchase (MM)',     icon:'📦', path:'/mm',    mod:'mm',      desc:'POs · Vendors · GRN' },
    { label:'Warehouse (WM)',    icon:'🏭', path:'/wm',    mod:'wm',      desc:'Stock · Transfers' },
    { label:'Production (PP)',   icon:'⚙️', path:'/pp',    mod:'pp',      desc:'Jobs · Coating' },
    { label:'Quality (QM)',      icon:'✅', path:'/qm',    mod:'qm',      desc:'Inspection · NCR' },
    { label:'Maintenance (PM)',  icon:'🔧', path:'/pm',    mod:'pm',      desc:'Breakdown · PM' },
  ]},
  { key:'people', label:'People', color:'#6C3483', items:[
    { label:'HR (HCM)',          icon:'👥', path:'/hcm',   mod:'hcm',     desc:'Payroll · Leave' },
    { label:'CRM',               icon:'🤝', path:'/crm',   mod:'crm',     desc:'Leads · Deals' },
    { label:'KPI / KRA',         icon:'🎯', path:'/kpi',   mod:'kpi',     desc:'Performance' },
  ]},
  { key:'finance', label:'Finance', color:'#196F3D', items:[
    { label:'Finance (FI)',      icon:'💰', path:'/fi',     mod:'fi',      desc:'GST · P&L' },
    { label:'Reports',           icon:'📊', path:'/reports',mod:'reports', desc:'Analytics' },
  ]},
  { key:'support', label:'Support', color:'#E06F39', items:[
    { label:'Transport',         icon:'🚛', path:'/tm',    mod:'tm',      desc:'Trips · Fleet' },
    { label:'Assets',            icon:'🏗️', path:'/am',    mod:'am',      desc:'Fixed Assets' },
    { label:'Civil',             icon:'👷', path:'/civil', mod:'civil',   desc:'Projects' },
    { label:'Education',         icon:'🎓', path:'/edu',   mod:'edu',     desc:'Students · Staff' },
    { label:'Visitor',           icon:'🪪', path:'/vm',    mod:'vm',      desc:'Gate Entry' },
    { label:'Canteen',           icon:'🍽️', path:'/cn',    mod:'cn',      desc:'Meals' },
  ]},
  { key:'system', label:'System', color:'#714B67', items:[
    { label:'Admin',             icon:'🛡️', path:'/admin', mod:'admin',   desc:'Users · Roles' },
    { label:'Config',            icon:'⚙️', path:'/config',mod:'config',  desc:'Settings' },
    { label:'MDM',               icon:'🗄️', path:'/mdm',   mod:'mdm',     desc:'Master Data' },
  ]},
]

// ── All possible tiles per module ──────────────────────────
const ALL_TILES = [
  { mod:'sd',      color:'#714B67', label:'SD · Sales', items:[
    { icon:'📋', name:'Sales Orders',    sub:'Open orders',      path:'/sd/sales',     ck:'salesOrders'   },
    { icon:'🧾', name:'Invoices',        sub:'Pending payment',  path:'/sd/invoices',  ck:'invoices'      },
    { icon:'👥', name:'Customer Master', sub:'Active',           path:'/sd/customers', ck:'customers'     },
    { icon:'🚚', name:'Deliveries',      sub:'Pending dispatch', path:'/sd/deliveries',ck:'deliveries'    },
  ]},
  { mod:'mm',      color:'#00A09D', label:'MM · Purchase', items:[
    { icon:'📦', name:'Purchase Orders', sub:'Open POs',         path:'/mm/po',        ck:'purchaseOrders'},
    { icon:'📊', name:'Stock Overview',  sub:'Material items',   path:'/wm/stock',     ck:'stockItems'    },
    { icon:'🏢', name:'Vendors',         sub:'Active vendors',   path:'/mm/vendors',   ck:'vendors'       },
    { icon:'✅', name:'Goods Receipt',   sub:'This month',       path:'/mm/grn',       ck:'grns'          },
  ]},
  { mod:'pp',      color:'#E06F39', label:'PP · Production', items:[
    { icon:'⚙️', name:'Work Orders',       sub:'Open',           path:'/pp/wo',        ck:'workOrders'    },
    { icon:'📋', name:'Bill of Materials', sub:'Active BOMs',    path:'/pp/bom',       ck:'boms'          },
    { icon:'🔧', name:'Production Orders', sub:'In progress',    path:'/pp/wo',        ck:'prodOrders'    },
  ]},
  { mod:'fi',      color:'#1A5276', label:'FI · Finance', items:[
    { icon:'📒', name:'Journal Entries',  sub:'Posted today',    path:'/fi/journals',  ck:'journalEntriesToday' },
    { icon:'💳', name:'AR / AP',          sub:'Outstanding (₹)', path:'/fi/ar-ap',     ck:'totalAR'          },
    { icon:'📊', name:'P&L Report',       sub:'EBITDA this month', path:'/fi/reports',   ck:'plEbitda'       },
    { icon:'🏦', name:'Bank & Cash',      sub:'Accounts',        path:'/fi/day-book',  ck:'bankCashNotBuilt' },
  ]},
  { mod:'wm',      color:'#1F618D', label:'WM · Warehouse', items:[
    { icon:'📦', name:'Stock List',       sub:'Material items',  path:'/wm/stock',     ck:'stockItems'    },
    { icon:'🏭', name:'WH Map',           sub:'Live zones',      path:'/wm/map',       ck:'grns'          },
    { icon:'🔍', name:'Gate Entry',       sub:'Vehicles inside', path:'/wm/gate',      ck:'purchaseOrders'},
  ]},
  { mod:'qm',      color:'#117864', label:'QM · Quality', items:[
    { icon:'✅', name:'Inspections',      sub:'Pending',         path:'/qm/inspection',ck:'workOrders'    },
    { icon:'⚠️', name:'NCR',              sub:'Open issues',     path:'/qm/ncr',       ck:'boms'          },
  ]},
  { mod:'pm',      color:'#6C3483', label:'PM · Maintenance', items:[
    { icon:'🔧', name:'Breakdown',        sub:'Open jobs',       path:'/pm/breakdown', ck:'workOrders'    },
    { icon:'📅', name:'PM Schedule',      sub:'Planned',         path:'/pm/schedule',  ck:'boms'          },
  ]},
  { mod:'hcm',     color:'#2E86C1', label:'HR · HCM', items:[
    { icon:'👥', name:'Employees',        sub:'Active',          path:'/hcm/employees',ck:'employeeCount'   },
    { icon:'📅', name:'Leave',            sub:'Pending approval',path:'/hcm/leave',    ck:'pendingLeave'    },
    { icon:'💰', name:'Payroll',          sub:'Slips this month',path:'/hcm/payroll',  ck:'payrollThisMonth'},
  ]},
  { mod:'crm',     color:'#1A5276', label:'CRM', items:[
    { icon:'🤝', name:'Leads',            sub:'Active pipeline', path:'/crm/leads',    ck:'salesOrders'   },
    { icon:'📞', name:'Follow-ups',       sub:'Due today',       path:'/crm/followups',ck:'invoices'      },
  ]},
  { mod:'tm',      color:'#784212', label:'TM · Transport', items:[
    { icon:'🚛', name:'Trips',            sub:'In transit',      path:'/tm/trips',     ck:'workOrders'    },
    { icon:'🚗', name:'Vehicles',         sub:'Fleet',           path:'/tm/vehicles',  ck:'boms'          },
  ]},
  { mod:'civil',   color:'#E06F39', label:'Civil · Projects', items:[
    { icon:'👷', name:'Active Projects',  sub:'In progress',     path:'/civil/projects', ck:'civilProjects' },
  ]},
]

const ALL_QUICK = [
  { icon:'📝', label:'Raise Purchase Indent', path:'/purchase-indent/new', mod:'home' },
  { icon:'➕', label:'New Sales Order',    path:'/sd/sales/new',    mod:'sd'      },
  { icon:'📦', label:'New Purchase Order', path:'/mm/po/new',       mod:'mm'      },
  { icon:'🧾', label:'Create Invoice',     path:'/sd/invoices/new', mod:'sd'      },
  { icon:'✅', label:'Goods Receipt',      path:'/mm/grn/new',      mod:'mm'      },
  { icon:'👤', label:'Add Customer',       path:'/sd/customers',    mod:'sd'      },
  { icon:'📒', label:'New Journal Entry',  path:'/fi/journals',     mod:'fi'      },
  { icon:'⚙️', label:'Production Order',   path:'/pp/wo/new',       mod:'pp'      },
  { icon:'📈', label:'Analytics',          path:'/reports',         mod:'reports' },
  { icon:'👥', label:'New Employee',       path:'/hcm/employees',   mod:'hcm'     },
  { icon:'🔧', label:'Log Breakdown',      path:'/pm/breakdown',    mod:'pm'      },
]

// ── KPI configs per role ─────────────────────────────────────
const ROLE_KPIS = {
  SALES:      ['monthRevenue','openOrders','activeCust','totalAR'],
  ACCOUNTS:   ['monthRevenue','totalAR','openOrders','activeCust'],
  PURCHASE:   ['purchaseOrders','stockItems','vendors','grns'],
  PRODUCTION: ['workOrders','boms','prodOrders','stockItems'],
  WAREHOUSE:  ['stockItems','grns','purchaseOrders','workOrders'],
  HR:         ['customers','salesOrders','invoices','grns'],
  MANAGER:    ['monthRevenue','openOrders','activeCust','totalAR'],
  ADMIN:      ['monthRevenue','openOrders','activeCust','totalAR'],
  SUPER_ADMIN:['monthRevenue','openOrders','activeCust','totalAR'],
}

const KPI_META = {
  monthRevenue:  { icon:'💰', bg:'#EDE0EA', label:'This Month Revenue',  sub:'Live',               up:true,  fmt:'cr' },
  openOrders:    { icon:'📦', bg:'#D4EDDA', label:'Open Orders',         sub:'Pending dispatch',   up:true,  fmt:'num'},
  activeCust:    { icon:'👥', bg:'#D1ECF1', label:'Active Customers',    sub:'In customer master', up:true,  fmt:'num'},
  totalAR:       { icon:'🏦', bg:'#FFF3CD', label:'Total Receivable',    sub:'Outstanding AR',     up:false, fmt:'cr' },
  purchaseOrders:{ icon:'📦', bg:'#D4EDDA', label:'Open Purchase Orders',sub:'Pending',            up:true,  fmt:'num'},
  stockItems:    { icon:'📊', bg:'#D1ECF1', label:'Stock Items',         sub:'Active materials',   up:true,  fmt:'num'},
  vendors:       { icon:'🏢', bg:'#FFF3CD', label:'Active Vendors',      sub:'Registered',         up:true,  fmt:'num'},
  grns:          { icon:'✅', bg:'#D4EDDA', label:'GRNs This Month',     sub:'Received',           up:true,  fmt:'num'},
  workOrders:    { icon:'⚙️', bg:'#EDE0EA', label:'Open Work Orders',    sub:'In progress',        up:true,  fmt:'num'},
  boms:          { icon:'📋', bg:'#D1ECF1', label:'Active BOMs',         sub:'Bill of materials',  up:true,  fmt:'num'},
  prodOrders:    { icon:'🔧', bg:'#FFF3CD', label:'Production Orders',   sub:'Released',           up:true,  fmt:'num'},
}

// Which module "owns" each KPI — used to hide sales/production-specific KPIs
// when that module isn't enabled for this company (e.g. a College shouldn't
// see "This Month Revenue" / "Open Orders" from the Sales module up top)
const KPI_MODULE = {
  monthRevenue:'sd', openOrders:'sd', activeCust:'sd', totalAR:'fi',
  purchaseOrders:'mm', stockItems:'wm', vendors:'mm', grns:'mm',
  workOrders:'pp', boms:'pp', prodOrders:'pp',
}





// Shared with the sidebar ordering below — one saved order drives everything
function getSavedModuleOrder() {
  try { return JSON.parse(localStorage.getItem('lnv_module_order') || 'null') || [] } catch { return [] }
}
function moduleRank(savedOrder, k) {
  const i = savedOrder.indexOf(k)
  return i === -1 ? 999 : i
}

// Reorders both the groups and the items within each group using the same
// Company Profile → Module Order setting the top nav uses. A group's rank is
// the best (lowest) rank among its own items, so e.g. ranking Finance ahead
// of Warehouse moves the whole Finance group ahead of Operations if needed.
function getOrderedSidebarGroups() {
  const savedOrder = getSavedModuleOrder()
  if (!savedOrder.length) return SIDEBAR_GROUPS

  const rank = (k) => moduleRank(savedOrder, k)
  const withSortedItems = SIDEBAR_GROUPS.map(grp => ({
    ...grp,
    items: [...grp.items].sort((a, b) => rank(a.mod) - rank(b.mod)),
  }))
  const groupRank = (grp) => Math.min(...grp.items.map(it => rank(it.mod)))
  return [...withSortedItems].sort((a, b) => groupRank(a) - groupRank(b))
}

// ── Sidebar Component ─────────────────────────────────────
function Sidebar({ open, onClose, navigate, hasAccess }) {
  const [expanded, setExpanded] = useState({ operations:true, finance:true })
  const toggle = (k) => setExpanded(s => ({...s, [k]: !s[k]}))

  if (!open) return null

  // Filter groups and items by role
  const visibleGroups = getOrderedSidebarGroups()
    .map(grp => ({ ...grp, items: grp.items.filter(item => hasAccess(item.mod)) }))
    .filter(grp => grp.items.length > 0)

  if (!open) return null

  return (
    <div style={{
      width:260, background:'#fff', borderRight:'1px solid #E0D5E0',
      display:'flex', flexDirection:'column', flexShrink:0,
      overflowY:'auto',
    }}>
      {/* Header */}
      <div style={{ padding:'10px 14px', background:'#F8F9FA',
        borderBottom:'1px solid #E0D5E0',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#6C757D',
          textTransform:'uppercase', letterSpacing:1 }}>Navigation</span>
        <span onClick={onClose}
          style={{ cursor:'pointer', color:'#6C757D', fontSize:16, lineHeight:1 }}>
          x
        </span>
      </div>

      {/* Groups */}
      {visibleGroups.map(grp => (
        <div key={grp.key} style={{ borderBottom:'1px solid #F0EEEB' }}>
          <div onClick={() => toggle(grp.key)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px',
              cursor:'pointer', background:'#F8F9FA',
              borderLeft:'3px solid ' + grp.color }}>
            <span style={{ flex:1, fontSize:11, fontWeight:700, color:'#1C1C1C',
              textTransform:'uppercase', letterSpacing:.5 }}>
              {grp.label}
            </span>
            <span style={{ fontSize:11, color:'#6C757D',
              transform: expanded[grp.key] ? 'rotate(90deg)' : 'none',
              display:'inline-block', transition:'transform .2s' }}>
              {'>'}
            </span>
          </div>
          {expanded[grp.key] && grp.items.map(item => (
            <div key={item.path} onClick={() => navigate(item.path)}
              style={{ display:'flex', alignItems:'center', gap:10,
                padding:'8px 14px 8px 20px', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background='#F8F4F8'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ width:30, height:30, borderRadius:7, flexShrink:0,
                background: grp.color + '18',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:15 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'#1C1C1C' }}>
                  {item.label}
                </div>
                <div style={{ fontSize:10, color:'#6C757D' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Bar Chart ──────────────────────────────────────────────
// ── Main Component ────────────────────────────────────────
export default function HomeDashboard() {
  const { user, hasAccess, isModuleEnabled } = useAuth()
  const navigate  = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const now = new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'long', year:'numeric'})

  const [exec,    setExec]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let attempts = 0
    const tryLoad = () => {
      const t = localStorage.getItem('lnv_token')
      if (!t && attempts < 5) { attempts++; setTimeout(tryLoad, 500); return }
      if (!t) { setLoading(false); return }
      fetch(`${BASE_URL}/sd/executive-dashboard`, {
        headers: { Authorization: `Bearer ${t}` }
      })
        .then(r => r.ok ? r.json() : Promise.reject(`${r.status}`))
        .then(d => { if (!d.error) setExec(d) })
        .catch(e => console.warn('Dashboard load:', e))
        .finally(() => setLoading(false))
    }
    tryLoad()
  }, [])

  // ── Role-based filtering ──────────────────────────────────
  const role = (user?.role || '').toUpperCase()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'MANAGER'

  // Visible only if the role has access AND the industry config (Company Profile) has this
  // module turned on — hasAccess alone ignores Company Profile entirely, which is why Super
  // Admin (hasAccess = true for everything) saw every module regardless of industry setup.
  const canSee = (mod) => hasAccess(mod) && isModuleEnabled(mod)

  // Filter tiles to only modules this role can access, then order them the
  // same way as the top nav / sidebar (Company Profile → Module Order)
  const savedOrder = getSavedModuleOrder()
  const TILES = ALL_TILES.filter(sec => canSee(sec.mod))
    .sort((a, b) => moduleRank(savedOrder, a.mod) - moduleRank(savedOrder, b.mod))
  const QUICK = ALL_QUICK.filter(q => canSee(q.mod))

  // KPI strip — role specific, then narrowed to modules actually enabled for this company
  const kpiKeys = (ROLE_KPIS[role] || ROLE_KPIS['ADMIN']).filter(k => canSee(KPI_MODULE[k]))
  const tc = exec?.tileCounts || {}
  const kpiValues = {
    monthRevenue:   exec?.kpis?.monthRevenue,
    openOrders:     tc.salesOrders,
    activeCust:     tc.customers,
    totalAR:        exec?.kpis?.totalAR,
    purchaseOrders: tc.purchaseOrders,
    stockItems:     tc.stockItems,
    vendors:        tc.vendors,
    grns:           tc.grns,
    workOrders:     tc.workOrders,
    boms:           tc.boms,
    prodOrders:     tc.prodOrders,
  }

  return (
    <div style={{ display:'flex', height:'100%', background:'#F0EEEB' }}>

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} hasAccess={canSee} />

      {/* Main content */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

        {/* Breadcrumb */}
        <div style={{ padding:'8px 20px', fontSize:12, color:'#6C757D',
          background:'#F8F9FA', borderBottom:'1px solid #E0D5E0', flexShrink:0 }}>
          <span style={{ color:'#714B67', cursor:'pointer' }}>Home</span>
          <span style={{ margin:'0 6px' }}>{'>'}</span>
          <span>Dashboard</span>
        </div>

        {/* Page body */}
        <div style={{ padding:20, flex:1 }}>

          {/* Greeting */}
          <div style={{ marginBottom:18 }}>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800,
              color:'#1C1C1C', marginBottom:3 }}>
              Good morning, {user?.name?.split(' ')[0]} 
            </h2>
            <p style={{ fontSize:12, color:'#6C757D' }}>
              LNV Manufacturing Pvt. Ltd. · Surface Treatment and Coating · {now}
            </p>
          </div>

          {/* KPI Strip — Role Based Live Data */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
            {kpiKeys.map((key, i) => {
              const meta = KPI_META[key] || {}
              const val  = kpiValues[key]
              const disp = val === undefined ? '…'
                : meta.fmt === 'cr' ? CR(val)
                : val?.toLocaleString('en-IN')
              return (
                <div key={i} style={{ background:'#fff', borderRadius:8, padding:'16px 18px',
                  border:'1px solid #E0D5E0', boxShadow:'0 1px 4px rgba(0,0,0,.06)',
                  display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:42, height:42, borderRadius:8, background:meta.bg,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{meta.icon}</div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:'#6C757D', textTransform:'uppercase', letterSpacing:.5 }}>{meta.label}</div>
                    <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:700, color:'#1C1C1C', lineHeight:1.2 }}>
                      {loading ? '…' : disp}
                    </div>
                    <div style={{ fontSize:11, color: meta.up ? '#00A09D' : '#D9534F' }}>{meta.sub}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Executive Charts — Admin/Manager only */}
          {isAdmin && exec && !loading && (<>

          {/* Row 1: Sales Trend + Purchase Trend — each gated by its own module */}
          {(() => {
            const showSales = canSee('sd')
            const showPurchase = canSee('mm')
            if (!showSales && !showPurchase) return null
            const cols = showSales && showPurchase ? '1fr 1fr' : '1fr'
            return (
              <div style={{ display:'grid', gridTemplateColumns:cols, gap:16, marginBottom:16 }}>

                {showSales && (
                <div style={{ background:'#fff', borderRadius:10, padding:'16px 18px', border:'1px solid #E0D5E0' }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'#1C1C1C', marginBottom:14 }}>📈 Sales Trend — Last 6 Months</div>
                  {(() => {
                    const data  = exec.salesTrend || []
                    const max   = Math.max(...data.map(d=>d.sales), 1)
                    return (
                      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120 }}>
                        {data.map((d,i) => {
                          const h = Math.round((d.sales/max)*100)
                          return (
                            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                              <div style={{ fontSize:9, color:'#714B67', fontWeight:700 }}>{d.sales>0?CR(d.sales):''}</div>
                              <div style={{ width:'100%', height:`${h||4}px`, background: i===data.length-1?'#714B67':'#EDE0EA',
                                borderRadius:'4px 4px 0 0', minHeight:4, transition:'height .3s',
                                position:'relative' }}/>
                              <div style={{ fontSize:9, color:'#6C757D', fontWeight:600 }}>{d.month}</div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
                )}

                {showPurchase && (
                <div style={{ background:'#fff', borderRadius:10, padding:'16px 18px', border:'1px solid #E0D5E0' }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'#1C1C1C', marginBottom:14 }}>📦 Purchase Trend — Last 6 Months</div>
                  {(() => {
                    const data = exec.purchaseTrend || []
                    const max  = Math.max(...data.map(d=>d.purchase), 1)
                    return (
                      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120 }}>
                        {data.map((d,i) => {
                          const h = Math.round((d.purchase/max)*100)
                          return (
                            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                              <div style={{ fontSize:9, color:'#1A5276', fontWeight:700 }}>{d.purchase>0?CR(d.purchase):''}</div>
                              <div style={{ width:'100%', height:`${h||4}px`, background: i===data.length-1?'#1A5276':'#CCE5FF',
                                borderRadius:'4px 4px 0 0', minHeight:4 }}/>
                              <div style={{ fontSize:9, color:'#6C757D', fontWeight:600 }}>{d.month}</div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
                )}
              </div>
            )
          })()}

          {/* Row 2: Top Customers + Top Products — both sales-performance metrics */}
          {canSee('sd') && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

            {/* Top Customers */}
            <div style={{ background:'#fff', borderRadius:10, padding:'16px 18px', border:'1px solid #E0D5E0' }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#1C1C1C', marginBottom:12 }}>🏆 Top Customers — This Year</div>
              {exec.topCustomers?.length === 0 ? (
                <div style={{ padding:20, textAlign:'center', color:'#6C757D', fontSize:12 }}>No sales data yet</div>
              ) : (exec.topCustomers||[]).map((c,i) => {
                const max = exec.topCustomers[0]?.value || 1
                const pct = Math.round(c.value/max*100)
                return (
                  <div key={i} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'#1C1C1C' }}>
                        <span style={{ color:'#714B67', fontWeight:800, marginRight:6 }}>#{i+1}</span>{c.name}
                      </span>
                      <span style={{ fontSize:12, fontWeight:700, color:'#714B67', fontFamily:'DM Mono,monospace' }}>{CR(c.value)}</span>
                    </div>
                    <div style={{ height:6, background:'#F0EEF0', borderRadius:3 }}>
                      <div style={{ height:'100%', width:`${pct}%`, borderRadius:3,
                        background: i===0?'#714B67':i===1?'#9B59B6':'#C39BD3' }}/>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Top Products */}
            <div style={{ background:'#fff', borderRadius:10, padding:'16px 18px', border:'1px solid #E0D5E0' }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#1C1C1C', marginBottom:12 }}>📊 Top Products — This Year</div>
              {exec.topProducts?.length === 0 ? (
                <div style={{ padding:20, textAlign:'center', color:'#6C757D', fontSize:12 }}>No invoice line data yet</div>
              ) : (exec.topProducts||[]).map((p,i) => {
                const max = exec.topProducts[0]?.value || 1
                const pct = Math.round(p.value/max*100)
                return (
                  <div key={i} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'#1C1C1C' }}>
                        <span style={{ color:'#017E84', fontWeight:800, marginRight:6 }}>#{i+1}</span>
                        <span style={{ maxWidth:160, display:'inline-block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', verticalAlign:'bottom' }}>{p.name}</span>
                      </span>
                      <span style={{ fontSize:12, fontWeight:700, color:'#017E84', fontFamily:'DM Mono,monospace' }}>{CR(p.value)}</span>
                    </div>
                    <div style={{ height:6, background:'#F0EEF0', borderRadius:3 }}>
                      <div style={{ height:'100%', width:`${pct}%`, borderRadius:3,
                        background: i===0?'#017E84':i===1?'#1ABC9C':'#A3D9D1' }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          )}

          {/* Row 3: Receivable vs Payable — AR needs Sales, AP needs Purchase */}
          {(canSee('sd') || canSee('mm')) && (() => {
            const rv  = exec.receivableVsPayable || {}
            const max = Math.max(rv.totalAR||0, rv.totalAP||0, 1)
            const items = [
              canSee('sd') && { label:'Accounts Receivable (AR)', total:rv.totalAR||0, overdue:rv.overdueAR||0, color:'#155724', bg:'#D4EDDA', icon:'📥' },
              canSee('mm') && { label:'Accounts Payable (AP)',    total:rv.totalAP||0, overdue:rv.overdueAP||0, color:'#721C24', bg:'#F8D7DA', icon:'📤' },
            ].filter(Boolean)
            const showBoth = items.length === 2
            return (
              <div style={{ background:'#fff', borderRadius:10, padding:'16px 20px', border:'1px solid #E0D5E0', marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#1C1C1C', marginBottom:14 }}>⚖️ Receivable vs Payable</div>
                <div style={{ display:'grid', gridTemplateColumns:showBoth?'1fr 1fr':'1fr', gap:20 }}>
                  {items.map(item => (
                    <div key={item.label}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:item.color }}>{item.icon} {item.label}</span>
                        <span style={{ fontSize:16, fontWeight:800, color:item.color, fontFamily:'DM Mono,monospace' }}>{CR(item.total)}</span>
                      </div>
                      <div style={{ height:12, background:'#F0EEF0', borderRadius:6, marginBottom:6, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.round(item.total/max*100)}%`,
                          background:item.color, borderRadius:6, transition:'width .5s' }}/>
                      </div>
                      {item.overdue > 0 && (
                        <div style={{ fontSize:11, color:'#DC3545', fontWeight:600 }}>
                          ⚠️ Overdue: {CR(item.overdue)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Net position — only makes sense when both AR and AP are actually shown */}
                {showBoth && (
                <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid #E0D5E0',
                  display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#6C757D' }}>Net Working Capital Position</span>
                  <span style={{ fontSize:14, fontWeight:800,
                    color: (rv.totalAR||0) > (rv.totalAP||0) ? '#155724' : '#721C24',
                    fontFamily:'DM Mono,monospace' }}>
                    {(rv.totalAR||0) >= (rv.totalAP||0) ? '+' : ''}{CR((rv.totalAR||0) - (rv.totalAP||0))}
                    <span style={{ fontSize:10, fontWeight:400, color:'#6C757D', marginLeft:6 }}>
                      ({(rv.totalAR||0) >= (rv.totalAP||0) ? 'Surplus' : 'Deficit'})
                    </span>
                  </span>
                </div>
                )}
              </div>
            )
          })()}

          </>)}

          {/* ── Module Tiles ─────────────────────────────────────── */}
          {TILES.map(sec => (
            <div key={sec.label} style={{ marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#1C1C1C',
                marginBottom:12, paddingBottom:8, borderBottom:`2px solid ${sec.color}`,
                display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:sec.color }}/>
                {sec.label}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${sec.items.length},1fr)`, gap:12 }}>
                {sec.items.filter(t => !t.mod || canSee(t.mod)).map((t, j) => {
                  const count = exec?.tileCounts?.[t.ck]
                  return (
                    <div key={j} onClick={() => navigate(t.path)}
                      style={{ background:'#fff', borderRadius:8, padding:'16px 18px',
                        border:`1px solid #E0D5E0`, boxShadow:'0 1px 4px rgba(0,0,0,.06)',
                        cursor:'pointer', display:'flex', alignItems:'center', gap:14,
                        transition:'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor=sec.color; e.currentTarget.style.boxShadow=`0 2px 12px ${sec.color}30` }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#E0D5E0'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)' }}>
                      <div style={{ width:42, height:42, borderRadius:8,
                        background: sec.color + '18',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:20, flexShrink:0 }}>{t.icon}</div>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:'#6C757D',
                          textTransform:'uppercase', letterSpacing:.5 }}>{t.name}</div>
                        <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:700,
                          color: sec.color, lineHeight:1.2 }}>
                          {count === undefined ? '—' : t.ck === 'plEbitda' ? '₹'+count.toLocaleString('en-IN') : count}
                        </div>
                        <div style={{ fontSize:11, color:'#6C757D' }}>{t.sub}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Bottom Row — Recent Sales (live) + Quick Actions */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:22 }}>

            {/* Recent Sales — Live */}
            <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0', overflow:'hidden' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'14px 18px', borderBottom:'1px solid #E0D5E0' }}>
                <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'#1C1C1C' }}>Recent Sales</h4>
                <button onClick={() => navigate('/sd/sales/new')}
                  style={{ padding:'5px 12px', borderRadius:4, fontSize:12, fontWeight:600,
                    cursor:'pointer', background:'#714B67', color:'#fff', border:'none' }}>+ New Order</button>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#F8F9FA', borderBottom:'1px solid #E0D5E0' }}>
                    {['Doc No.','Customer','Amount','Status'].map(h=>(
                      <th key={h} style={{ padding:'8px 14px', fontSize:11, fontWeight:700,
                        color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exec?.recentInvoices?.length > 0 ? exec.recentInvoices.map((r,i) => {
                    const ST = { PAID:{c:'#155724',b:'#D4EDDA'}, POSTED:{c:'#004085',b:'#CCE5FF'},
                      PENDING_APPROVAL:{c:'#856404',b:'#FFF3CD'}, OVERDUE:{c:'#721C24',b:'#F8D7DA'} }
                    const st = ST[r.status] || {c:'#0C5460',b:'#D1ECF1'}
                    return (
                      <tr key={i} style={{ borderBottom:'1px solid #F0EEEB', cursor:'pointer' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#FDF8FC'}
                        onMouseLeave={e=>e.currentTarget.style.background=''}
                        onClick={()=>navigate('/sd/invoices')}>
                        <td style={{ padding:'10px 14px', fontSize:12, color:'#714B67', fontWeight:600, fontFamily:'DM Mono,monospace' }}>{r.invoiceNo}</td>
                        <td style={{ padding:'10px 14px', fontSize:12 }}>{r.customerName}</td>
                        <td style={{ padding:'10px 14px', fontSize:12, fontFamily:'DM Mono,monospace' }}>{CR(r.grandTotal)}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ padding:'3px 9px', borderRadius:10, fontSize:11, fontWeight:600, background:st.b, color:st.c }}>{r.status}</span>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr><td colSpan={4} style={{ padding:24, textAlign:'center', color:'#6C757D', fontSize:12 }}>
                      {loading ? 'Loading…' : 'No invoices yet — create your first invoice'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Actions */}
            <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
              overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid #E0D5E0' }}>
                <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:14,
                  fontWeight:700, color:'#1C1C1C' }}>Quick Transactions</h4>
              </div>
              <div style={{ padding:'14px 18px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {QUICK.filter(qa => canSee(qa.mod)).map(qa => (
                    <div key={qa.label} onClick={() => navigate(qa.path)}
                      style={{ display:'flex', alignItems:'center', gap:8,
                        padding:'10px 12px', background:'#F8F9FA',
                        border:'1px solid #E0D5E0', borderRadius:6,
                        cursor:'pointer', fontSize:12, fontWeight:600,
                        color:'#1C1C1C', transition:'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#EDE0EA'; e.currentTarget.style.color='#714B67' }}
                      onMouseLeave={e => { e.currentTarget.style.background='#F8F9FA'; e.currentTarget.style.color='#1C1C1C' }}>
                      <span style={{ fontSize:18 }}>{qa.icon}</span>
                      {qa.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
