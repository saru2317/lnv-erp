import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => `₹${parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'
const pct  = (a,b) => b>0 ? `${((a/b)*100).toFixed(1)}%` : '—'

const TABS = [
  { key:'summary',  label:'📊 Sales Summary',      path:'/sd/reports/summary'  },
  { key:'ledger',   label:'📒 Customer Ledger',     path:'/sd/reports/ledger'   },
  { key:'aging',    label:'⏰ Receivables Aging',   path:'/sd/reports/aging'    },
  { key:'revenue',  label:'💰 Revenue Analysis',    path:'/sd/reports/revenue'  },
]

const today  = new Date().toISOString().split('T')[0]
const firstD = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

export default function SDReports() {
  const nav      = useNavigate()
  const location = useLocation()
  const tab      = TABS.find(t=>location.pathname.includes(t.key))?.key || 'summary'

  const [from,     setFrom]     = useState(firstD)
  const [to,       setTo]       = useState(today)
  const [custF,    setCustF]    = useState('')
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [customers,setCustomers]= useState([])

  useEffect(()=>{
    fetch(`${BASE}/sd/customers?limit=200`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setCustomers(d.data||[])).catch(()=>{})
  },[])

  useEffect(()=>{ load() },[tab, from, to])

  const load = async () => {
    setLoading(true)
    setData(null)
    try {
      const params = new URLSearchParams({ from, to, ...(custF && {customerName:custF}) })
      const r = await fetch(`${BASE}/sd/reports/${tab}?${params}`, { headers:hdr2() })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setData(d.data)
    } catch(e) { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }

  return (
    <div>
      {/* Header */}
      <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67',marginBottom:14}}>
        SD Reports
        <small style={{fontSize:11,fontWeight:400,color:'#6C757D',marginLeft:8}}>Sales analytics & financial reports</small>
      </div>

      {/* Tab bar */}
      <div style={{display:'flex',gap:4,marginBottom:14,padding:'4px 6px',background:'#F0EEEB',borderRadius:8,width:'fit-content'}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>nav(t.path)}
            style={{padding:'7px 16px',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',border:'none',
              background:tab===t.key?'#714B67':'transparent',color:tab===t.key?'#fff':'#6C757D'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center',flexWrap:'wrap',
        background:'#fff',padding:'10px 14px',borderRadius:8,border:'1px solid #E0D5E0'}}>
        <label style={{fontSize:11,fontWeight:700,color:'#6C757D'}}>FROM</label>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)}
          style={{padding:'6px 8px',border:'1px solid #E0D5E0',borderRadius:5,fontSize:12,outline:'none'}} />
        <label style={{fontSize:11,fontWeight:700,color:'#6C757D'}}>TO</label>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)}
          style={{padding:'6px 8px',border:'1px solid #E0D5E0',borderRadius:5,fontSize:12,outline:'none'}} />
        {['summary','ledger'].includes(tab) && (
          <>
            <label style={{fontSize:11,fontWeight:700,color:'#6C757D'}}>CUSTOMER</label>
            <select value={custF} onChange={e=>{setCustF(e.target.value); setTimeout(load,100)}}
              style={{padding:'6px 10px',border:'1px solid #E0D5E0',borderRadius:5,fontSize:12,outline:'none'}}>
              <option value="">All Customers</option>
              {customers.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </>
        )}
        <button onClick={load} style={{padding:'6px 16px',background:'#714B67',color:'#fff',
          border:'none',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer'}}>
          🔄 Refresh
        </button>
        {data && (
          <span style={{marginLeft:'auto',fontSize:11,color:'#6C757D'}}>
            {from} → {to}
          </span>
        )}
      </div>

      {loading && <div style={{padding:60,textAlign:'center',color:'#6C757D'}}>⏳ Loading report…</div>}

      {!loading && data && (
        <>
          {/* ── SALES SUMMARY ── */}
          {tab==='summary' && (
            <div>
              {/* KPI */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
                {[
                  { l:'Total Invoices',  v:data.invoices?.length||0,                                                  c:'#714B67', bg:'#EDE0EA' },
                  { l:'Total Taxable',   v:INR(data.invoices?.reduce((s,i)=>s+parseFloat(i.taxableAmt||0),0)),        c:'#1565C0', bg:'#E3F2FD' },
                  { l:'Total GST',       v:INR(data.invoices?.reduce((s,i)=>s+parseFloat(i.cgst||0)+parseFloat(i.sgst||0)+parseFloat(i.igst||0),0)), c:'#856404', bg:'#FFF3CD' },
                  { l:'Grand Total',     v:INR(data.invoices?.reduce((s,i)=>s+parseFloat(i.grandTotal||i.totalAmt||0),0)), c:'#155724', bg:'#D4EDDA' },
                ].map(k=>(
                  <div key={k.l} style={{background:'#fff',borderRadius:8,padding:'12px 14px',
                    border:'1px solid #E0D5E0',borderLeft:`4px solid ${k.c}`}}>
                    <div style={{fontSize:16,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{k.v}</div>
                    <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{k.l}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {/* By Customer */}
                <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                  <div style={{padding:'10px 14px',background:'#714B67',color:'#fff',fontWeight:700,fontSize:12}}>
                    By Customer
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead><tr style={{background:'#F8F4F8'}}>
                      {['Customer','Invoices','Taxable','GST','Total','Outstanding'].map(h=>(
                        <th key={h} style={{padding:'7px 10px',textAlign:h==='Customer'?'left':'right',fontSize:10,fontWeight:700,color:'#6C757D'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {(data.byCustomer||[]).sort((a,b)=>b.total-a.total).map((r,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                          <td style={{padding:'8px 10px',fontWeight:600}}>{r.customer}</td>
                          <td style={{padding:'8px 10px',textAlign:'right',color:'#6C757D'}}>{r.invoices}</td>
                          <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(r.taxable)}</td>
                          <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#856404'}}>{INR(r.gst)}</td>
                          <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#2E7D32'}}>{INR(r.total)}</td>
                          <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:r.total-r.paid>0?'#C62828':'#155724'}}>{INR(r.total-r.paid)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* By Month */}
                <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                  <div style={{padding:'10px 14px',background:'#714B67',color:'#fff',fontWeight:700,fontSize:12}}>Monthly Trend</div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead><tr style={{background:'#F8F4F8'}}>
                      {['Month','Invoices','Total'].map(h=>(
                        <th key={h} style={{padding:'7px 10px',textAlign:h==='Month'?'left':'right',fontSize:10,fontWeight:700,color:'#6C757D'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {(data.byMonth||[]).map((r,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                          <td style={{padding:'8px 10px',fontWeight:600}}>{r.month}</td>
                          <td style={{padding:'8px 10px',textAlign:'right',color:'#6C757D'}}>{r.invoices}</td>
                          <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#2E7D32'}}>{INR(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice list */}
              <div style={{marginTop:14,background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                <div style={{padding:'10px 14px',background:'#714B67',color:'#fff',fontWeight:700,fontSize:12}}>
                  Invoice Details ({data.invoices?.length||0})
                </div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr style={{background:'#F8F4F8'}}>
                    {['Invoice No','Customer','Date','SO Ref','Taxable','GST','Total','Status'].map(h=>(
                      <th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'#6C757D'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(data.invoices||[]).map((inv,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA',cursor:'pointer'}}
                        onClick={()=>nav(`/sd/invoices/${inv.id}`)}>
                        <td style={{padding:'7px 10px'}}><code style={{color:'#714B67',fontWeight:700,fontSize:11}}>{inv.invoiceNo}</code></td>
                        <td style={{padding:'7px 10px',fontWeight:600}}>{inv.customerName}</td>
                        <td style={{padding:'7px 10px',color:'#6C757D'}}>{fmtD(inv.date)}</td>
                        <td style={{padding:'7px 10px',fontSize:11,color:'#6C757D'}}>{inv.soRef||'—'}</td>
                        <td style={{padding:'7px 10px',fontFamily:'DM Mono,monospace'}}>{INR(inv.taxableAmt)}</td>
                        <td style={{padding:'7px 10px',fontFamily:'DM Mono,monospace',color:'#856404'}}>{INR(parseFloat(inv.cgst||0)+parseFloat(inv.sgst||0)+parseFloat(inv.igst||0))}</td>
                        <td style={{padding:'7px 10px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#2E7D32'}}>{INR(inv.grandTotal||inv.totalAmt)}</td>
                        <td style={{padding:'7px 10px'}}>
                          <span style={{padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:700,
                            background:inv.status==='PAID'?'#D4EDDA':inv.status==='POSTED'?'#D1ECF1':'#F5F5F5',
                            color:inv.status==='PAID'?'#155724':inv.status==='POSTED'?'#0C5460':'#6C757D'}}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CUSTOMER LEDGER ── */}
          {tab==='ledger' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
                {[
                  { l:'Total Invoiced', v:INR(data.ledger?.reduce((s,l)=>s+l.total,0)||0),       c:'#1565C0', bg:'#E3F2FD' },
                  { l:'Total Paid',     v:INR(data.ledger?.reduce((s,l)=>s+l.paid,0)||0),         c:'#155724', bg:'#D4EDDA' },
                  { l:'Outstanding',    v:INR(data.totalOutstanding||0),                           c:'#C62828', bg:'#F8D7DA' },
                ].map(k=>(
                  <div key={k.l} style={{background:'#fff',borderRadius:8,padding:'12px 14px',
                    border:'1px solid #E0D5E0',borderLeft:`4px solid ${k.c}`}}>
                    <div style={{fontSize:16,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{k.v}</div>
                    <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr style={{background:'var(--odoo-purple)'}}>
                    {['Invoice No','Customer','Date','Due Date','Total','Paid','Outstanding','Balance','Status'].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:'#fff',textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(data.ledger||[]).map((r,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA',
                        cursor:'pointer'}} onClick={()=>nav(`/sd/invoices/${r.id}`)}>
                        <td style={{padding:'8px 10px'}}><code style={{color:'#714B67',fontWeight:700,fontSize:11}}>{r.invoiceNo}</code></td>
                        <td style={{padding:'8px 10px',fontWeight:600}}>{r.customerName}</td>
                        <td style={{padding:'8px 10px',color:'#6C757D'}}>{fmtD(r.date)}</td>
                        <td style={{padding:'8px 10px',color:r.dueDate&&new Date(r.dueDate)<new Date()&&r.outstanding>0?'#C62828':'#6C757D'}}>{fmtD(r.dueDate)}</td>
                        <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace'}}>{INR(r.total)}</td>
                        <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',color:'#155724'}}>{INR(r.paid)}</td>
                        <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',fontWeight:700,color:r.outstanding>0?'#C62828':'#155724'}}>{INR(r.outstanding)}</td>
                        <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>{INR(r.runningBalance)}</td>
                        <td style={{padding:'8px 10px'}}>
                          <span style={{padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:700,
                            background:r.status==='PAID'?'#D4EDDA':'#F8D7DA',
                            color:r.status==='PAID'?'#155724':'#721C24'}}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr style={{background:'#F0EEEB',fontWeight:700}}>
                    <td colSpan={4} style={{padding:'8px 10px',fontSize:11,textAlign:'right',color:'#6C757D'}}>Total</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace'}}>{INR(data.ledger?.reduce((s,r)=>s+r.total,0)||0)}</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',color:'#155724'}}>{INR(data.ledger?.reduce((s,r)=>s+r.paid,0)||0)}</td>
                    <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',color:'#C62828',fontSize:13}}>{INR(data.totalOutstanding)}</td>
                    <td colSpan={2}></td>
                  </tr></tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── RECEIVABLES AGING ── */}
          {tab==='aging' && (
            <div>
              {/* Bucket totals */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:14}}>
                {[
                  { l:'Current',   k:'current', c:'#155724', bg:'#D4EDDA' },
                  { l:'1-30 Days', k:'days30',  c:'#856404', bg:'#FFF3CD' },
                  { l:'31-60 Days',k:'days60',  c:'#E65100', bg:'#FFF3E0' },
                  { l:'61-90 Days',k:'days90',  c:'#C62828', bg:'#FFEBEE' },
                  { l:'>90 Days',  k:'over90',  c:'#721C24', bg:'#F8D7DA' },
                ].map(b=>(
                  <div key={b.k} style={{background:'#fff',borderRadius:8,padding:'12px 14px',
                    border:'1px solid #E0D5E0',borderLeft:`4px solid ${b.c}`}}>
                    <div style={{fontSize:15,fontWeight:800,color:b.c,fontFamily:'Syne,sans-serif'}}>
                      {INR(data.buckets?.[b.k]?.reduce((s,r)=>s+r.outstanding,0)||0)}
                    </div>
                    <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{b.l} ({data.buckets?.[b.k]?.length||0})</div>
                  </div>
                ))}
              </div>

              {/* Summary by customer */}
              <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden',marginBottom:14}}>
                <div style={{padding:'10px 14px',background:'#714B67',color:'#fff',fontWeight:700,fontSize:12}}>
                  Aging Summary by Customer
                </div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr style={{background:'#F8F4F8'}}>
                    {['Customer','Current','1-30 Days','31-60 Days','61-90 Days','>90 Days','Total'].map(h=>(
                      <th key={h} style={{padding:'7px 10px',textAlign:h==='Customer'?'left':'right',fontSize:10,fontWeight:700,color:'#6C757D'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(data.summary||[]).map((r,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                        <td style={{padding:'8px 10px',fontWeight:600}}>{r.customer}</td>
                        <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#155724'}}>{INR(r.current)}</td>
                        <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#856404'}}>{INR(r.days30)}</td>
                        <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#E65100'}}>{INR(r.days60)}</td>
                        <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#C62828'}}>{INR(r.days90)}</td>
                        <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#721C24',fontWeight:700}}>{INR(r.over90)}</td>
                        <td style={{padding:'8px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,color:'#714B67'}}>{INR(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REVENUE ANALYSIS ── */}
          {tab==='revenue' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
                {[
                  { l:'Total Revenue',  v:INR(data.totalRevenue||0),      c:'#155724', bg:'#D4EDDA' },
                  { l:'Total Invoices', v:data.invoiceCount||0,            c:'#1565C0', bg:'#E3F2FD' },
                  { l:'Top Item',       v:data.byItem?.[0]?.name||'—',    c:'#714B67', bg:'#EDE0EA' },
                ].map(k=>(
                  <div key={k.l} style={{background:'#fff',borderRadius:8,padding:'12px 14px',
                    border:'1px solid #E0D5E0',borderLeft:`4px solid ${k.c}`}}>
                    <div style={{fontSize:16,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{k.v}</div>
                    <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{k.l}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {/* Top items */}
                <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                  <div style={{padding:'10px 14px',background:'#714B67',color:'#fff',fontWeight:700,fontSize:12}}>
                    Top Items by Revenue
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead><tr style={{background:'#F8F4F8'}}>
                      {['Item','Qty','Revenue','%'].map(h=>(
                        <th key={h} style={{padding:'7px 10px',textAlign:h==='Item'?'left':'right',fontSize:10,fontWeight:700,color:'#6C757D'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {(data.byItem||[]).map((r,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                          <td style={{padding:'7px 10px'}}>
                            <div style={{fontWeight:600}}>{r.name}</div>
                            <code style={{fontSize:10,color:'#714B67'}}>{r.code}</code>
                          </td>
                          <td style={{padding:'7px 10px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{parseFloat(r.qty||0).toLocaleString('en-IN')}</td>
                          <td style={{padding:'7px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#2E7D32'}}>{INR(r.amount)}</td>
                          <td style={{padding:'7px 10px',textAlign:'right',color:'#6C757D'}}>{pct(r.amount,data.totalRevenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Monthly trend */}
                <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
                  <div style={{padding:'10px 14px',background:'#714B67',color:'#fff',fontWeight:700,fontSize:12}}>
                    Monthly Revenue Trend
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead><tr style={{background:'#F8F4F8'}}>
                      {['Month','Invoices','Revenue'].map(h=>(
                        <th key={h} style={{padding:'7px 10px',textAlign:h==='Month'?'left':'right',fontSize:10,fontWeight:700,color:'#6C757D'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {(data.monthly||[]).map((r,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                          <td style={{padding:'7px 10px',fontWeight:600}}>{r.month}</td>
                          <td style={{padding:'7px 10px',textAlign:'right',color:'#6C757D'}}>{r.invoices}</td>
                          <td style={{padding:'7px 10px',textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#2E7D32'}}>{INR(r.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !data && (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          <div style={{fontSize:32,marginBottom:8}}>📊</div>
          <div style={{fontWeight:700}}>Select date range and click Refresh</div>
        </div>
      )}
    </div>
  )
}
