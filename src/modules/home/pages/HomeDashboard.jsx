import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

// ── SIDEBAR DATA ──────────────────────────────────────────
const SIDEBAR_GROUPS = [
  { key:'operations', label:'Operations', color:'#017E84', items:[
    { label:'Sales (SD)',        icon:'', path:'/sd',  desc:'Orders · Invoices' },
    { label:'Purchase (MM)',     icon:'', path:'/mm',  desc:'POs · Vendors · GRN' },
    { label:'Warehouse (WM)',    icon:'', path:'/wm',  desc:'Stock · Transfers' },
    { label:'Production (PP)',   icon:'', path:'/pp',  desc:'Jobs · Coating' },
    { label:'Quality (QM)',      icon:'', path:'/qm',  desc:'Inspection · NCR' },
    { label:'Maintenance (PM)',  icon:'', path:'/pm',  desc:'Breakdown · PM' },
  ]},
  { key:'people', label:'People', color:'#6C3483', items:[
    { label:'HR (HCM)',          icon:'', path:'/hcm', desc:'Payroll · Leave' },
    { label:'CRM',               icon:'', path:'/crm', desc:'Leads · Deals' },
    { label:'KPI / KRA',         icon:'', path:'/kpi', desc:'Performance' },
  ]},
  { key:'finance', label:'Finance', color:'#196F3D', items:[
    { label:'Finance (FI)',      icon:'', path:'/fi',      desc:'GST · P&L' },
    { label:'Reports',           icon:'', path:'/reports', desc:'Analytics' },
  ]},
  { key:'support', label:'Support', color:'#E06F39', items:[
    { label:'Transport',         icon:'', path:'/tm',    desc:'Trips · Fleet' },
    { label:'Assets',            icon:'', path:'/am',    desc:'Fixed Assets' },
    { label:'Civil',             icon:'', path:'/civil', desc:'Projects' },
    { label:'Visitor',           icon:'🪪', path:'/vm',    desc:'Gate Entry' },
    { label:'Canteen',           icon:'', path:'/cn',    desc:'Meals' },
  ]},
  { key:'system', label:'System', color:'#714B67', items:[
    { label:'Admin',             icon:'', path:'/admin',  desc:'Users · Roles' },
    { label:'Config',            icon:'', path:'/config', desc:'Settings' },
    { label:'MDM',               icon:'', path:'/mdm',   desc:'Master Data' },
  ]},
]

const KPI_DATA = [
  { icon:'', bg:'#EDE0EA', label:'Total Revenue',    val:'21.59Cr', trend:'18.2% vs LY',  up:true },
  { icon:'', bg:'#D4EDDA', label:'Open Orders',      val:'1,248',   trend:'67 Pending',   up:true },
  { icon:'', bg:'#D1ECF1', label:'Active Customers', val:'342',     trend:'28 New',        up:true },
  { icon:'', bg:'#F8D7DA', label:'Stock Alerts',     val:'14',      trend:'Needs Reorder', up:false },
]

const BAR_DATA = [
  {m:'Apr',v:0},{m:'May',v:662100},{m:'Jun',v:0},{m:'Jul',v:4622757},
  {m:'Aug',v:3133025},{m:'Sep',v:8121600},{m:'Oct',v:36000},{m:'Nov',v:297923},
  {m:'Dec',v:86950},{m:'Jan',v:4635610},
]

const TILES = [
  { color:'#714B67', label:'SD · Sales', items:[
    { icon:'', name:'Sales Orders',    count:'67',  sub:'Open orders',     badge:'3 Due',    bc:'#E06F39', path:'/sd/sales'     },
    { icon:'', name:'Invoices',        count:'12',  sub:'Pending payment', badge:'2 Overdue',bc:'#D9534F', path:'/sd/invoices'  },
    { icon:'', name:'Customer Master', count:'342', sub:'Active',          badge:null,       bc:null,      path:'/sd/customers' },
    { icon:'', name:'Deliveries',      count:'8',   sub:'Pending dispatch', badge:null,      bc:null,      path:'/sd/deliveries'},
  ]},
  { color:'#00A09D', label:'MM · Materials', items:[
    { icon:'', name:'Purchase Orders', count:'23',  sub:'Open POs',        badge:null,      bc:null,      path:'/mm/po'        },
    { icon:'', name:'Stock Overview',  count:'186', sub:'Material items',  badge:'14 Low',  bc:'#D9534F', path:'/mm/materials' },
    { icon:'', name:'Vendors',         count:'48',  sub:'Active vendors',  badge:null,      bc:null,      path:'/mm/vendors'   },
    { icon:'', name:'Goods Receipt',   count:'5',   sub:'Pending GRN',     badge:null,      bc:null,      path:'/mm/grn'       },
  ]},
  { color:'#E06F39', label:'PP · Production', items:[
    { icon:'', name:'Production Orders', count:'9',  sub:'In progress',    badge:null,      bc:null,      path:'/pp/wo'        },
    { icon:'', name:'Bill of Materials', count:'34', sub:'Active BOMs',    badge:null,      bc:null,      path:'/pp/bom'       },
    { icon:'', name:'Work Orders',       count:'15', sub:'Open',           badge:'4 Done',  bc:'#00A09D', path:'/pp/wo'        },
  ]},
]

const RECENT_TXN = [
  { doc:'INV-0124', cust:'Sri Lakshmi Mills',   amt:'3,91,680',  status:'Paid',       sc:'#155724', sb:'#D4EDDA' },
  { doc:'INV-0123', cust:'Coimbatore Spinners', amt:'8,12,160',  status:'Pending',    sc:'#856404', sb:'#FFF3CD' },
  { doc:'INV-0122', cust:'Rajesh Textiles',     amt:'1,42,800',  status:'Paid',       sc:'#155724', sb:'#D4EDDA' },
  { doc:'INV-0121', cust:'ARS Cotton Mills',    amt:'4,63,510',  status:'Overdue',    sc:'#721C24', sb:'#F8D7DA' },
  { doc:'SO-0124',  cust:'Vijay Fabrics',       amt:'2,82,068',  status:'Processing', sc:'#0C5460', sb:'#D1ECF1' },
]

const QUICK = [
  { icon:'', label:'New Sales Order',    path:'/sd/sales/new'   },
  { icon:'', label:'New Purchase Order', path:'/mm/po/new'      },
  { icon:'', label:'Create Invoice',     path:'/sd/invoices/new'},
  { icon:'', label:'Goods Receipt',      path:'/mm/grn/new'     },
  { icon:'', label:'Add Customer',       path:'/sd/customers'   },
  { icon:'', label:'Sales Report',       path:'/sd/reports'     },
  { icon:'', label:'Production Order',   path:'/pp/wo/new'      },
  { icon:'', label:'Analytics',          path:'/reports'        },
]

const FAVS = [
  { icon:'', label:'Dashboard',      path:'/home'         },
  { icon:'', label:'Sales Order',    path:'/sd/sales'     },
  { icon:'', label:'Purchase Order', path:'/mm/po'        },
  { icon:'', label:'Stock Overview', path:'/mm/materials' },
  { icon:'', label:'Customer Master',path:'/sd/customers' },
  { icon:'', label:'Sales Report',   path:'/sd/reports'   },
]

// ── Sidebar Component ─────────────────────────────────────
function Sidebar({ open, onClose, navigate }) {
  const [expanded, setExpanded] = useState({ operations:true, finance:true })
  const toggle = (k) => setExpanded(s => ({...s, [k]: !s[k]}))

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
      {SIDEBAR_GROUPS.map(grp => (
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
function BarChart() {
  const max = Math.max(...BAR_DATA.map(d => d.v))
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:150 }}>
      {BAR_DATA.map((d, i) => {
        const pct = max > 0 ? (d.v / max * 100) : 0
        const label = d.v > 0 ? (d.v >= 1e6 ? (d.v/1e6).toFixed(1)+'M' : (d.v/1e3).toFixed(0)+'K') : '-'
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:9, fontWeight:700, color:'#1C1C1C' }}>{label}</span>
            <div style={{ width:'100%', borderRadius:'3px 3px 0 0', minHeight:3,
              height: Math.max(pct, 2) + '%',
              background: pct > 60 ? '#714B67' : pct > 30 ? '#00A09D' : '#E0D5E0' }} />
            <span style={{ fontSize:10, color:'#6C757D' }}>{d.m}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────
export default function HomeDashboard() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const now = new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'long', year:'numeric'})

  return (
    <div style={{ display:'flex', height:'100%', background:'#F0EEEB' }}>

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} />

      {/* Main content */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

        {/* Favorites bar */}
        <div style={{ height:32, background:'#fff', borderBottom:'1px solid #E0D5E0',
          display:'flex', alignItems:'center', padding:'0 14px', gap:4,
          overflowX:'auto', flexShrink:0 }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)}
              style={{ padding:'3px 10px', borderRadius:4, fontSize:11, fontWeight:600,
                color:'#714B67', background:'none', border:'1px solid #E0D5E0',
                cursor:'pointer', marginRight:8, flexShrink:0 }}>
              Nav
            </button>
          )}
          <span style={{ fontSize:11, fontWeight:700, color:'#6C757D',
            marginRight:8, whiteSpace:'nowrap', letterSpacing:.5 }}>
            Favorites
          </span>
          {FAVS.map(f => (
            <div key={f.label} onClick={() => navigate(f.path)}
              style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 10px',
                borderRadius:3, cursor:'pointer', whiteSpace:'nowrap', fontSize:12,
                color:'#6C757D', flexShrink:0 }}
              onMouseEnter={e => { e.currentTarget.style.background='#EDE0EA'; e.currentTarget.style.color='#714B67' }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#6C757D' }}>
              {f.icon} {f.label}
            </div>
          ))}
        </div>

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

          {/* KPI Strip */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
            {KPI_DATA.map((k, i) => (
              <div key={i} style={{ background:'#fff', borderRadius:8, padding:'16px 18px',
                border:'1px solid #E0D5E0', boxShadow:'0 1px 4px rgba(0,0,0,.06)',
                display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:42, height:42, borderRadius:8, background:k.bg,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:20, flexShrink:0 }}>{k.icon}</div>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#6C757D',
                    textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:700,
                    color:'#1C1C1C', lineHeight:1.2 }}>{k.val}</div>
                  <div style={{ fontSize:11, color: k.up ? '#00A09D' : '#D9534F' }}>
                    {k.up ? '+' : ''}{k.trend}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Fiori Tiles */}
          {TILES.map(sec => (
            <div key={sec.label} style={{ marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#1C1C1C',
                marginBottom:12, paddingBottom:8,
                borderBottom:'2px solid #E0D5E0',
                display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:sec.color }} />
                {sec.label}
              </div>
              <div style={{ display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
                {sec.items.map(tile => (
                  <div key={tile.name} onClick={() => navigate(tile.path)}
                    style={{ background:'#fff', borderRadius:8, padding:16, cursor:'pointer',
                      border:'1px solid #E0D5E0', position:'relative',
                      minHeight:110, display:'flex', flexDirection:'column',
                      justifyContent:'space-between',
                      boxShadow:'0 1px 4px rgba(0,0,0,.06)',
                      borderTop:'3px solid ' + sec.color }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)' }}>
                    {tile.badge && (
                      <span style={{ position:'absolute', top:10, right:10,
                        background:tile.bc, color:'#fff', fontSize:10,
                        fontWeight:700, padding:'2px 6px', borderRadius:10 }}>
                        {tile.badge}
                      </span>
                    )}
                    <div>
                      <div style={{ fontSize:28, marginBottom:8 }}>{tile.icon}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#1C1C1C' }}>{tile.name}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily:'Syne,sans-serif', fontSize:22,
                        fontWeight:800, color:sec.color, marginTop:4 }}>{tile.count}</div>
                      <div style={{ fontSize:10, color:'#6C757D' }}>{tile.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Charts Row */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:22 }}>
            <div style={{ background:'#fff', borderRadius:8, padding:18,
              border:'1px solid #E0D5E0', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:14,
                  fontWeight:700, color:'#1C1C1C' }}>Monthly Sales Revenue</h4>
                <span style={{ fontSize:11, color:'#6C757D' }}>APR–JAN</span>
              </div>
              <BarChart />
            </div>
            <div style={{ background:'#fff', borderRadius:8, padding:18,
              border:'1px solid #E0D5E0', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
              <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:14,
                fontWeight:700, color:'#1C1C1C', marginBottom:16 }}>Revenue Mix</h4>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                <div style={{ width:120, height:120, borderRadius:'50%',
                  background:'conic-gradient(#714B67 0deg 195deg, #00A09D 195deg 280deg, #E06F39 280deg 335deg, #F5C518 335deg 360deg)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width:78, height:78, background:'#fff', borderRadius:'50%',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                    <strong style={{ fontFamily:'Syne,sans-serif', fontSize:14,
                      fontWeight:700, color:'#1C1C1C' }}>21.6Cr</strong>
                    <small style={{ fontSize:9, color:'#6C757D' }}>Total</small>
                  </div>
                </div>
              </div>
              {[['#714B67','SD Systems','54%'],['#00A09D','WM Lattice','24%'],
                ['#E06F39','MM Spares','14%'],['#F5C518','Others','8%']].map(([c,l,p])=>(
                <div key={l} style={{ display:'flex', alignItems:'center', padding:'3px 0' }}>
                  <div style={{ width:9, height:9, borderRadius:2,
                    background:c, flexShrink:0 }} />
                  <span style={{ flex:1, marginLeft:7, fontSize:12, color:'#6C757D' }}>{l}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#1C1C1C' }}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Recent Transactions */}
            <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
              overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'14px 18px',
                borderBottom:'1px solid #E0D5E0' }}>
                <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:14,
                  fontWeight:700, color:'#1C1C1C' }}>Recent Sales</h4>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => navigate('/sd/sales/new')}
                    style={{ padding:'5px 12px', borderRadius:4, fontSize:12,
                      fontWeight:600, cursor:'pointer',
                      background:'#714B67', color:'#fff', border:'none' }}>
                    + New Order
                  </button>
                </div>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#F8F9FA', borderBottom:'1px solid #E0D5E0' }}>
                    {['Doc No.','Customer','Amount','Status'].map(h => (
                      <th key={h} style={{ padding:'8px 14px', fontSize:11,
                        fontWeight:700, color:'#6C757D', textAlign:'left',
                        textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RECENT_TXN.map((r, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #F0EEEB' }}
                      onMouseEnter={e => e.currentTarget.style.background='#FDF8FC'}
                      onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ padding:'10px 14px', fontSize:12,
                        color:'#714B67', fontWeight:600,
                        fontFamily:'DM Mono,monospace' }}>{r.doc}</td>
                      <td style={{ padding:'10px 14px', fontSize:12 }}>{r.cust}</td>
                      <td style={{ padding:'10px 14px', fontSize:12,
                        fontFamily:'DM Mono,monospace' }}>Rs {r.amt}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ padding:'3px 9px', borderRadius:10,
                          fontSize:11, fontWeight:600,
                          background:r.sb, color:r.sc }}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
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
                  {QUICK.map(qa => (
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
