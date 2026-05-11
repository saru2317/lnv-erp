import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sdApi } from '../services/sdApi'

const STATIC = {
  kpis: [
    { label:'Total Revenue',    value:'\u20b921.6L', trend:'This Month', trendCls:'tup', bg:'#EDE0EA', onClick:'invoices'  },
    { label:'Open Orders',      value:'67',          trend:'12 New',     trendCls:'tup', bg:'#FFF3CD', onClick:'orders'    },
    { label:'Pending Invoices', value:'23',          trend:'3 Overdue',  trendCls:'tdn', bg:'#D1ECF1', onClick:'invoices'  },
    { label:'Customers',        value:'342',         trend:'28 New',     trendCls:'tup', bg:'#D4EDDA', onClick:'customers' },
    { label:'Overdue Amt',      value:'\u20b94.6L',  trend:'2 Pending',  trendCls:'tdn', bg:'#F8D7DA', onClick:'invoices'  },
  ],
  recentOrders: [
    { soNo:'SO-2026-0003', customerName:'Sri Lakshmi Mills',   grandTotal:390000, status:'confirmed' },
    { soNo:'SO-2026-0002', customerName:'Coimbatore Spinners',  grandTotal:810000, status:'pending'   },
    { soNo:'SO-2026-0001', customerName:'ARS Cotton',           grandTotal:140000, status:'delivered' },
  ],
  recentInvoices: [
    { invoiceNo:'INV-2026-0003', customerName:'Sri Lakshmi Mills',  grandTotal:390000, status:'PAID'    },
    { invoiceNo:'INV-2026-0002', customerName:'Coimbatore Spinners', grandTotal:810000, status:'POSTED'  },
    { invoiceNo:'INV-2026-0001', customerName:'ARS Cotton',          grandTotal:460000, status:'OVERDUE' },
  ],
  topCustomers: [],
}

const INR = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN', { minimumFractionDigits:0 })
const fmt = v => '\u20b9' + (parseFloat(v||0)/100000).toFixed(1) + 'L'

const STATUS_COLORS = {
  confirmed:{ bg:'#D4EDDA', c:'#155724' }, pending:{ bg:'#FFF3CD', c:'#856404' },
  delivered:{ bg:'#D1ECF1', c:'#0C5460' }, PAID:   { bg:'#D4EDDA', c:'#155724' },
  POSTED:   { bg:'#D1ECF1', c:'#0C5460' }, OVERDUE:{ bg:'#F8D7DA', c:'#721C24' },
  PARTIAL:  { bg:'#FFF3CD', c:'#856404' },
}

export default function SDDashboard() {
  const navigate = useNavigate()
  const [data,    setData]    = useState(STATIC)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    sdApi.getDashboard()
      .then(r => {
        const d = r?.data || r || {}
        // API returns { thisMonth, overdue, topCustomers }
        // Map to dashboard shape
        if (d.thisMonth || d.overdue) {
          const m = d.thisMonth || {}
          const o = d.overdue   || {}
          setData({
            kpis: [
              { label:'Total Revenue',    value:fmt(m.revenue),        trend:'This Month',            trendCls:'tup', bg:'#EDE0EA', onClick:'invoices'  },
              { label:'Open Orders',      value:String(m.orders||0),   trend:(m.orders||0)+' orders', trendCls:'tup', bg:'#FFF3CD', onClick:'orders'    },
              { label:'Invoices',         value:String(m.invoices||0), trend:'This Month',            trendCls:'tup', bg:'#D1ECF1', onClick:'invoices'  },
              { label:'Overdue',          value:fmt(o.amount),         trend:(o.count||0)+' bills',   trendCls:'tdn', bg:'#F8D7DA', onClick:'invoices'  },
              { label:'Collected',        value:fmt(m.received),       trend:'Receipts',              trendCls:'tup', bg:'#D4EDDA', onClick:'receipts'  },
            ],
            recentOrders:   STATIC.recentOrders,
            recentInvoices: STATIC.recentInvoices,
            topCustomers:   Array.isArray(d.topCustomers) ? d.topCustomers : [],
          })
        } else if (Array.isArray(d.kpis)) {
          setData(d)
        }
        // else keep STATIC
      })
      .catch(() => {}) // keep STATIC on error
      .finally(() => setLoading(false))
  }, [])

  const kpis          = Array.isArray(data.kpis)          ? data.kpis          : STATIC.kpis
  const recentOrders  = Array.isArray(data.recentOrders)  ? data.recentOrders  : STATIC.recentOrders
  const recentInvoices= Array.isArray(data.recentInvoices)? data.recentInvoices: STATIC.recentInvoices
  const topCustomers  = Array.isArray(data.topCustomers)  ? data.topCustomers  : []

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:20, color:'#714B67' }}>
          Sales Dashboard
          <small style={{ fontSize:13, fontWeight:400, color:'#6C757D', marginLeft:8 }}>SD Module Overview</small>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>navigate('/sd/orders/new')}
            style={{ padding:'7px 16px', background:'#714B67', color:'#fff', border:'none',
              borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>+ New Order</button>
          <button onClick={()=>navigate('/sd/invoices/new')}
            style={{ padding:'7px 16px', background:'#155724', color:'#fff', border:'none',
              borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>+ New Invoice</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:14 }}>
        {kpis.map((k,i) => (
          <div key={i} onClick={()=>navigate('/sd/'+(k.onClick||''))}
            style={{ background:'#fff', border:'1px solid #E0D5E0', borderRadius:10,
              padding:'14px 16px', cursor:'pointer', position:'relative', overflow:'hidden',
              borderTop:`3px solid ${k.bg==='#EDE0EA'?'#714B67':k.bg==='#F8D7DA'?'#DC3545':k.bg==='#D4EDDA'?'#28A745':k.bg==='#FFF3CD'?'#FFC107':'#17A2B8'}` }}
            onMouseOver={e=>e.currentTarget.style.background='#F8F4F8'}
            onMouseOut={e=>e.currentTarget.style.background='#fff'}>
            <div style={{ fontSize:10, fontWeight:700, color:'#6C757D', textTransform:'uppercase',
              letterSpacing:'.04em', marginBottom:6 }}>{k.label}</div>
            <div style={{ fontFamily:'DM Mono,monospace', fontWeight:800, fontSize:20,
              color:'#333', marginBottom:4 }}>{k.value}</div>
            <div style={{ fontSize:11, fontWeight:600,
              color: k.trendCls==='tup'?'#155724':'#DC3545' }}>{k.trend}</div>
          </div>
        ))}
      </div>

      {/* Panels */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>

        {/* Recent Orders */}
        <div style={{ background:'#fff', border:'1px solid #E0D5E0', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #E0D5E0',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#714B67' }}>Recent Orders</div>
            <button onClick={()=>navigate('/sd/orders')}
              style={{ fontSize:11, color:'#714B67', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
              View All
            </button>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#F8F4F8' }}>
                <th style={{ padding:'7px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'#714B67' }}>SO #</th>
                <th style={{ padding:'7px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'#714B67' }}>Customer</th>
                <th style={{ padding:'7px 12px', textAlign:'right', fontWeight:700, fontSize:11, color:'#714B67' }}>Amount</th>
                <th style={{ padding:'7px 12px', textAlign:'center', fontWeight:700, fontSize:11, color:'#714B67' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o,i) => {
                const sc = STATUS_COLORS[o.status] || { bg:'#F5F5F5', c:'#666' }
                return (
                  <tr key={i} style={{ borderBottom:'1px solid #F0EEEB', cursor:'pointer' }}
                    onClick={()=>navigate('/sd/orders')}
                    onMouseOver={e=>e.currentTarget.style.background='#F8F4F8'}
                    onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace', fontSize:11,
                      fontWeight:700, color:'#714B67' }}>{o.soNo}</td>
                    <td style={{ padding:'8px 12px', fontWeight:600, fontSize:12 }}>{o.customerName}</td>
                    <td style={{ padding:'8px 12px', textAlign:'right', fontFamily:'DM Mono,monospace',
                      fontWeight:700 }}>{INR(o.grandTotal||o.totalAmt||0)}</td>
                    <td style={{ padding:'8px 12px', textAlign:'center' }}>
                      <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10,
                        fontWeight:700, background:sc.bg, color:sc.c }}>
                        {(o.status||'').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Recent Invoices */}
        <div style={{ background:'#fff', border:'1px solid #E0D5E0', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #E0D5E0',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#714B67' }}>Recent Invoices</div>
            <button onClick={()=>navigate('/sd/invoices')}
              style={{ fontSize:11, color:'#714B67', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
              View All
            </button>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#F8F4F8' }}>
                <th style={{ padding:'7px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'#714B67' }}>Inv #</th>
                <th style={{ padding:'7px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'#714B67' }}>Customer</th>
                <th style={{ padding:'7px 12px', textAlign:'right', fontWeight:700, fontSize:11, color:'#714B67' }}>Amount</th>
                <th style={{ padding:'7px 12px', textAlign:'center', fontWeight:700, fontSize:11, color:'#714B67' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv,i) => {
                const sc = STATUS_COLORS[inv.status] || { bg:'#F5F5F5', c:'#666' }
                return (
                  <tr key={i} style={{ borderBottom:'1px solid #F0EEEB', cursor:'pointer' }}
                    onClick={()=>navigate('/sd/invoices')}
                    onMouseOver={e=>e.currentTarget.style.background='#F8F4F8'}
                    onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace', fontSize:11,
                      fontWeight:700, color:'#714B67' }}>{inv.invoiceNo}</td>
                    <td style={{ padding:'8px 12px', fontWeight:600, fontSize:12 }}>{inv.customerName}</td>
                    <td style={{ padding:'8px 12px', textAlign:'right', fontFamily:'DM Mono,monospace',
                      fontWeight:700 }}>{INR(inv.grandTotal||inv.totalAmt||0)}</td>
                    <td style={{ padding:'8px 12px', textAlign:'center' }}>
                      <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10,
                        fontWeight:700, background:sc.bg, color:sc.c }}>
                        {(inv.status||'').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <div style={{ background:'#fff', border:'1px solid #E0D5E0', borderRadius:10, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:13, color:'#714B67', marginBottom:12 }}>Top Customers</div>
          <div style={{ display:'flex', gap:10 }}>
            {topCustomers.map((c,i) => (
              <div key={i} style={{ flex:1, background:'#F8F4F8', borderRadius:8, padding:'10px 14px',
                borderLeft:'3px solid #714B67' }}>
                <div style={{ fontWeight:700, fontSize:12 }}>{c.name}</div>
                <div style={{ fontFamily:'DM Mono,monospace', fontWeight:800, fontSize:16,
                  color:'#714B67', marginTop:4 }}>{INR(c.revenue||0)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:14 }}>
        {[
          ['New Quotation',    '/sd/quotations/new', '#0C5460'],
          ['New Sales Order',  '/sd/orders/new',     '#714B67'],
          ['Create Invoice',   '/sd/invoices/new',   '#155724'],
          ['CEPA Export',      '/sd/cepa',           '#856404'],
        ].map(([label, path, color]) => (
          <button key={label} onClick={()=>navigate(path)}
            style={{ padding:'12px', background:color, color:'#fff', border:'none',
              borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
