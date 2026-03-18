import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ── DEMO KPI DATA ─────────────────────────────────────
const MONTH_DATA = {
  revenue:     { val:'₹48.6L',  prev:'₹41.2L',  pct:18.0,  up:true  },
  purchases:   { val:'₹28.4L',  prev:'₹31.0L',  pct:-8.4,  up:false },
  production:  { val:'847 jobs', prev:'780 jobs', pct:8.6,   up:true  },
  stock_val:   { val:'₹1.24Cr', prev:'₹1.18Cr', pct:5.1,   up:true  },
  gross_profit:{ val:'₹14.8L',  prev:'₹11.4L',  pct:29.8,  up:true  },
  overdue_ar:  { val:'₹8.2L',   prev:'₹6.4L',   pct:28.1,  up:false },
  open_po:     { val:'23',       prev:'18',       pct:27.8,  up:false },
  quality_pass:{ val:'97.2%',   prev:'96.8%',   pct:0.4,   up:true  },
}

// Monthly trend — last 6 months
const TREND = [
  { m:'Oct', rev:3612000, pur:2240000, gp:1040000 },
  { m:'Nov', rev:3980000, pur:2560000, gp:1180000 },
  { m:'Dec', rev:3240000, pur:2110000, gp:980000  },
  { m:'Jan', rev:4120000, pur:2890000, gp:1240000 },
  { m:'Feb', rev:4120000, pur:3100000, gp:1140000 },
  { m:'Mar', rev:4860000, pur:2840000, gp:1480000 },
]

// Top customers
const TOP_CUSTOMERS = [
  { name:'Ashok Leyland',      rev:1248000, invoices:5, paid:1056000, due:192000 },
  { name:'TVS Motors',         rev:980000,  invoices:4, paid:980000,  due:0 },
  { name:'Sri Lakshmi Mills',  rev:812160,  invoices:3, paid:624000,  due:188160 },
  { name:'Coimbatore Spinners',rev:463510,  invoices:2, paid:320000,  due:143510 },
  { name:'Vijay Fabrics',      rev:282068,  invoices:2, paid:282068,  due:0 },
]

// Module health
const MODULE_HEALTH = [
  { mod:'SD · Sales',      icon:'💰', open:24, alerts:2, status:'normal' },
  { mod:'MM · Purchase',   icon:'🛒', open:8,  alerts:1, status:'warning' },
  { mod:'PP · Production', icon:'🏭', open:9,  alerts:0, status:'good' },
  { mod:'FI · Finance',    icon:'📒', open:12, alerts:3, status:'critical' },
  { mod:'QM · Quality',    icon:'🔬', open:3,  alerts:1, status:'normal' },
  { mod:'PM · Maintenance',icon:'🔧', open:5,  alerts:2, status:'warning' },
  { mod:'WM · Warehouse',  icon:'📦', open:14, alerts:1, status:'normal' },
  { mod:'HCM · HR',        icon:'👥', open:0,  alerts:0, status:'good' },
]

const HS = {
  good:    { color:'#155724', bg:'#D4EDDA', dot:'#00A09D' },
  normal:  { color:'#0C5460', bg:'#D1ECF1', dot:'#017E84' },
  warning: { color:'#856404', bg:'#FFF3CD', dot:'#E06F39' },
  critical:{ color:'#721C24', bg:'#F8D7DA', dot:'#D9534F' },
}

const maxRev = Math.max(...TREND.map(t => t.rev))
const fmt = (n, type='currency') => {
  if (type === 'currency') {
    if (n >= 10000000) return '₹' + (n/10000000).toFixed(2) + 'Cr'
    if (n >= 100000)   return '₹' + (n/100000).toFixed(1) + 'L'
    return '₹' + n.toLocaleString('en-IN')
  }
  return n
}

export default function ReportsDashboard() {
  const nav = useNavigate()

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Reports & Analytics
          <small>Cross-module business intelligence — March 2026</small>
        </div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select">
            <option>Mar 2026</option><option>Feb 2026</option>
            <option>Q4 FY26</option><option>FY 2025-26</option>
          </select>
          <button className="btn btn-s sd-bsm">⬇️ Export All</button>
          <button className="btn btn-s sd-bsm">🖨️ Print</button>
        </div>
      </div>

      {/* KPI strip — 8 cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        {[
          { icon:'💰', label:'Revenue (MTD)',    ...MONTH_DATA.revenue,    path:'/reports/sales',    bg:'#EDE0EA' },
          { icon:'🛒', label:'Purchases (MTD)',  ...MONTH_DATA.purchases,  path:'/reports/purchase', bg:'#D1ECF1' },
          { icon:'📊', label:'Gross Profit',     ...MONTH_DATA.gross_profit,path:'/reports/finance', bg:'#D4EDDA' },
          { icon:'📦', label:'Stock Value',      ...MONTH_DATA.stock_val,  path:'/reports/inventory',bg:'#FEF8E6' },
          { icon:'🏭', label:'Production Jobs',  ...MONTH_DATA.production, path:'/reports/production',bg:'#E6F7F7' },
          { icon:'⚠️', label:'Overdue AR',       ...MONTH_DATA.overdue_ar, path:'/reports/finance', bg:'#F8D7DA' },
          { icon:'🛒', label:'Open POs',         ...MONTH_DATA.open_po,    path:'/reports/purchase', bg:'#FFF3CD' },
          { icon:'🔬', label:'Quality Pass Rate',...MONTH_DATA.quality_pass,path:'/reports/quality', bg:'#E6F7F7' },
        ].map(k => (
          <div key={k.label} onClick={() => nav(k.path)}
            style={{ background:'#fff', borderRadius:8, padding:'14px 16px',
              border:'1px solid var(--odoo-border)', cursor:'pointer',
              boxShadow:'0 1px 4px rgba(0,0,0,.06)', transition:'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:k.bg,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                {k.icon}
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--odoo-gray)',
                textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            </div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800,
              color:'var(--odoo-dark)', lineHeight:1 }}>{k.val}</div>
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:5 }}>
              <span style={{ fontSize:11, fontWeight:700,
                color: k.up ? 'var(--odoo-green)' : 'var(--odoo-red)' }}>
                {k.up ? '▲' : '▼'} {Math.abs(k.pct)}%
              </span>
              <span style={{ fontSize:10, color:'var(--odoo-gray)' }}>vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Trend chart + Module health */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginBottom:14 }}>

        {/* Revenue trend bar chart */}
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          padding:18, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'var(--odoo-dark)' }}>
              📈 Revenue vs Purchase vs Gross Profit (6 months)
            </h4>
            <button onClick={() => nav('/reports/sales')}
              style={{ fontSize:11, color:'var(--odoo-purple)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
              Full Report →
            </button>
          </div>
          {/* Bar chart */}
          <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:140 }}>
            {TREND.map((t, i) => {
              const revH  = (t.rev / maxRev) * 130
              const purH  = (t.pur / maxRev) * 130
              const gpH   = (t.gp  / maxRev) * 130
              const isLast = i === TREND.length - 1
              return (
                <div key={t.m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:130 }}>
                    <div title={`Revenue: ${fmt(t.rev)}`}
                      style={{ width:12, height:revH, background: isLast ? 'var(--odoo-purple)' : '#C4A4BB',
                        borderRadius:'3px 3px 0 0', transition:'height .5s' }} />
                    <div title={`Purchases: ${fmt(t.pur)}`}
                      style={{ width:12, height:purH, background: isLast ? 'var(--odoo-orange)' : '#F5C9A8',
                        borderRadius:'3px 3px 0 0', transition:'height .5s' }} />
                    <div title={`Gross Profit: ${fmt(t.gp)}`}
                      style={{ width:12, height:gpH, background: isLast ? 'var(--odoo-green)' : '#A8D8C8',
                        borderRadius:'3px 3px 0 0', transition:'height .5s' }} />
                  </div>
                  <span style={{ fontSize:10, color: isLast ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
                    fontWeight: isLast ? 700 : 400 }}>{t.m}</span>
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div style={{ display:'flex', gap:16, marginTop:10, justifyContent:'center' }}>
            {[['var(--odoo-purple)','Revenue'],['var(--odoo-orange)','Purchases'],['var(--odoo-green)','Gross Profit']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:c }} />
                <span style={{ fontSize:11, color:'var(--odoo-gray)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Module health */}
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--odoo-border)' }}>
            <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'var(--odoo-dark)' }}>
              🏥 Module Health
            </h4>
          </div>
          {MODULE_HEALTH.map(m => {
            const hs = HS[m.status]
            return (
              <div key={m.mod} style={{ padding:'9px 14px', borderBottom:'1px solid var(--odoo-border)',
                display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:hs.dot, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--odoo-dark)' }}>{m.mod}</div>
                  <div style={{ fontSize:10, color:'var(--odoo-gray)' }}>
                    {m.open} open &nbsp;·&nbsp;
                    <span style={{ color: m.alerts > 0 ? 'var(--odoo-red)' : 'var(--odoo-green)', fontWeight:600 }}>
                      {m.alerts > 0 ? `${m.alerts} alerts` : 'No alerts'}
                    </span>
                  </div>
                </div>
                <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:600,
                  background:hs.bg, color:hs.color, whiteSpace:'nowrap' }}>
                  {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Row 3: Top customers + Quick reports */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:14 }}>
        {/* Top customers */}
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--odoo-border)',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'var(--odoo-dark)' }}>
              👥 Top Customers by Revenue — MTD
            </h4>
            <button onClick={() => nav('/reports/sales')}
              style={{ fontSize:11, color:'var(--odoo-purple)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
              View All →
            </button>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F8F9FA' }}>
                {['#','Customer','Revenue','Invoices','Collected','Outstanding'].map(h => (
                  <th key={h} style={{ padding:'8px 12px', fontSize:11, fontWeight:700,
                    color:'var(--odoo-gray)', textAlign: h==='#'||h==='Invoices' ? 'center' : 'left',
                    borderBottom:'1px solid var(--odoo-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_CUSTOMERS.map((c, i) => (
                <tr key={c.name} style={{ borderBottom:'1px solid var(--odoo-border)' }}
                  onMouseEnter={e => e.currentTarget.style.background='#FDF8FC'}
                  onMouseLeave={e => e.currentTarget.style.background=''}>
                  <td style={{ padding:'10px 12px', textAlign:'center', fontWeight:700,
                    color:'var(--odoo-purple)', fontSize:13 }}>{i+1}</td>
                  <td style={{ padding:'10px 12px', fontWeight:700, fontSize:12 }}>{c.name}</td>
                  <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace', fontSize:12,
                    fontWeight:700, color:'var(--odoo-dark)' }}>{fmt(c.rev)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'center', fontSize:12 }}>{c.invoices}</td>
                  <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace', fontSize:12,
                    color:'var(--odoo-green)', fontWeight:600 }}>{fmt(c.paid)}</td>
                  <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace', fontSize:12,
                    color: c.due > 0 ? 'var(--odoo-red)' : 'var(--odoo-green)', fontWeight:600 }}>
                    {c.due > 0 ? fmt(c.due) : '✅ Clear'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick report links */}
        <div style={{ background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          padding:18, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700,
            color:'var(--odoo-dark)', marginBottom:14 }}>📋 Quick Reports</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { icon:'💰', label:'Sales Report',          sub:'Revenue · Customers · Trends',    path:'/reports/sales',      color:'#714B67' },
              { icon:'🛒', label:'Purchase Report',       sub:'Vendors · POs · GRN',             path:'/reports/purchase',   color:'#017E84' },
              { icon:'📦', label:'Inventory Report',      sub:'Stock · Movement · Aging',        path:'/reports/inventory',  color:'#E06F39' },
              { icon:'📒', label:'Finance Report',        sub:'P&L · Balance Sheet · Cash Flow', path:'/reports/finance',    color:'#196F3D' },
              { icon:'🏭', label:'Production Report',     sub:'Jobs · Efficiency · WIP',         path:'/reports/production', color:'#1A5276' },
              { icon:'🔬', label:'Quality Report',        sub:'Inspections · NCR · Pass Rate',   path:'/reports/quality',    color:'#6C3483' },
              { icon:'👥', label:'HR Report',             sub:'Attendance · Payroll · Leaves',   path:'/reports/hr',         color:'#784212' },
              { icon:'🚚', label:'Transport Report',      sub:'Trips · Fuel · Fleet Cost',       path:'/reports/transport',  color:'#E06F39' },
            ].map(r => (
              <div key={r.label} onClick={() => nav(r.path)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                  borderRadius:7, cursor:'pointer', border:`1px solid ${r.color}22`,
                  background:`${r.color}08`, transition:'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background=`${r.color}18`; e.currentTarget.style.borderColor=r.color }}
                onMouseLeave={e => { e.currentTarget.style.background=`${r.color}08`; e.currentTarget.style.borderColor=`${r.color}22` }}>
                <span style={{ fontSize:20 }}>{r.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--odoo-dark)' }}>{r.label}</div>
                  <div style={{ fontSize:10, color:'var(--odoo-gray)' }}>{r.sub}</div>
                </div>
                <span style={{ fontSize:14, color:r.color }}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
