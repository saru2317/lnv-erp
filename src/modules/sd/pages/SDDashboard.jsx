import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'
import { sdApi } from '../services/sdApi'

// Fallback static data when API not ready
const STATIC = {
  kpis: [
    { icon:'▸', label:'Total Revenue',    value:'₹21.6Cr', trend:'▲ 18.2%', trendCls:'tup', bg:'#EDE0EA', onClick:'revenue' },
    { icon:'📋', label:'Open Orders',      value:'67',      trend:'12 New',  trendCls:'tup', bg:'#FFF3CD', onClick:'orders'  },
    { icon:'🧾', label:'Pending Invoices', value:'23',      trend:'3 Overdue',trendCls:'tdn',bg:'#D1ECF1', onClick:'invoices'},
    { icon:'👥', label:'Customers',        value:'342',     trend:'▲ 28 New',trendCls:'tup', bg:'#D4EDDA', onClick:'customers'},
    { icon:'⏰', label:'Overdue Amt',      value:'₹4.6L',  trend:'2 Customers',trendCls:'tdn',bg:'#F8D7DA',onClick:'invoices'},
  ],
  recentOrders: [
    { id:'SO-0124', customer:'Sri Lakshmi Mills',   amount:'₹3.9L',  status:'confirmed' },
    { id:'SO-0123', customer:'Coimbatore Spinners',  amount:'₹8.1L',  status:'pending'   },
    { id:'SO-0122', customer:'ARS Cotton',           amount:'₹1.4L',  status:'delivered' },
  ],
  recentInvoices: [
    { id:'INV-0124', customer:'Sri Lakshmi Mills',  amount:'₹3.9L', status:'paid'    },
    { id:'INV-0123', customer:'Coimbatore Spinners', amount:'₹8.1L', status:'pending' },
    { id:'INV-0121', customer:'ARS Cotton',          amount:'₹4.6L', status:'overdue' },
  ],
}

export default function SDDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(STATIC)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    sdApi.getDashboard()
      .then(r => setData(r.data || STATIC))
      .catch(() => setData(STATIC))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="hero-in">
          <div className="h1t">
            <h1>Sales & Distribution <em>(SD)</em></h1>
            <p>Customers · Quotations · Sales Orders · Invoices · Payments · Returns</p>
            <div className="hpill">TVS Motor · Ashok Leyland · Lucas TVS</div>
          </div>
          <div style={{display:'flex',gap:'7px',flexWrap:'wrap'}}>
            {[{v:'₹21.6Cr',l:'Revenue'},{v:'67',l:'Orders'},{v:'342',l:'Customers'},{v:'23',l:'Invoices'}].map(s=>(
              <div key={s.l} style={{background:'rgba(255,255,255,.13)',border:'1px solid rgba(255,255,255,.18)',borderRadius:'7px',padding:'8px 11px',textAlign:'center',cursor:'pointer'}} onClick={()=>navigate('/sd/orders')}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:'16px',fontWeight:'800',color:'#fff',lineHeight:'1'}}>{s.v}</div>
                <div style={{fontSize:'8px',fontWeight:'700',color:'rgba(255,255,255,.52)',textTransform:'uppercase',letterSpacing:'.3px',marginTop:'2px'}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',marginBottom:'13px'}}>
        {data.kpis.map(k=>(
          <div key={k.label} className="kc" style={{'--ac':'#714B67'}} onClick={()=>navigate(`/sd/${k.onClick}`)}>
            <div style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'24px',opacity:'.07'}}>{k.icon}</div>
            <div className="k-lb">{k.label}</div>
            <div className="k-vl">{k.value}</div>
            <div className={`k-tr ${k.trendCls}`}>{k.trend}</div>
          </div>
        ))}
      </div>

      {/* Panels */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'16px'}}>
        {/* Recent Orders */}
        <div className="dc" style={{cursor:'pointer'}} onClick={()=>navigate('/sd/orders')}>
          <div className="dc-hd"><h4>Recent Sales Orders</h4></div>
          <table className="sd-tbl">
            <thead><tr><th>SO #</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {data.recentOrders.map(o=>(
                <tr key={o.id}>
                  <td><strong style={{color:'#714B67',fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{o.id}</strong></td>
                  <td>{o.customer}</td>
                  <td>{o.amount}</td>
                  <td><Badge status={o.status}>{o.status.toUpperCase()}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Invoices */}
        <div className="dc" style={{cursor:'pointer'}} onClick={()=>navigate('/sd/invoices')}>
          <div className="dc-hd"><h4>Recent Invoices</h4></div>
          <table className="sd-tbl">
            <thead><tr><th>INV #</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {data.recentInvoices.map(i=>(
                <tr key={i.id}>
                  <td><strong style={{color:'#714B67',fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{i.id}</strong></td>
                  <td>{i.customer}</td>
                  <td>{i.amount}</td>
                  <td><Badge status={i.status}>{i.status.toUpperCase()}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="dc">
          <div className="dc-hd"><h4> Quick Transactions</h4></div>
          <div style={{padding:'10px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px'}}>
            {[
              {label:' New Quotation', to:'/sd/quotations/new', cls:'btn-p'},
              {label:' New Sales Order',to:'/sd/orders/new',   cls:'btn-p'},
              {label:' New Invoice',   to:'/sd/invoices/new',  cls:'btn-p'},
              {label:' Add Customer',  to:'/sd/customers/new', cls:'btn-s'},
              {label:' Record Payment',to:'/sd/payments/new',  cls:'btn-s'},
              {label:'↩ Sales Return',  to:'/sd/returns/new',   cls:'btn-s'},
            ].map(a=>(
              <button key={a.label} className={`btn ${a.cls} btn-sm`} onClick={()=>navigate(a.to)}>{a.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
