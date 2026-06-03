import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n  => n != null ? '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits:2 }) : '—'
const fmtD = s  => s ? new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'

const STATUS_STYLE = {
  DRAFT:      { bg:'#F8F9FA', c:'#6C757D' },
  OPEN:       { bg:'#D1ECF1', c:'#0C5460' },
  CONFIRMED:  { bg:'#D4EDDA', c:'#155724' },
  PROCESSING: { bg:'#FFF3CD', c:'#856404' },
  DELIVERED:  { bg:'#CCE5FF', c:'#004085' },
  PAID:       { bg:'#D4EDDA', c:'#155724' },
  CANCELLED:  { bg:'#F8D7DA', c:'#721C24' },
}
const PAGE_SIZE = 10

export default function SOList() {
  const nav = useNavigate()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('')
  const [page,    setPage]    = useState(1)
  const [acting,  setActing]  = useState(null)
  const timer = useRef()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      const res  = await fetch(`${BASE}/sd/orders?${params}`, { headers: hdr2() })
      const data = await res.json()
      setOrders(data.data || [])
      setPage(1)
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }, [search, status])

  useEffect(() => { load() }, [load])

  const confirmOrder = async (o, e) => {
    e.stopPropagation()
    if (!window.confirm(`Confirm ${o.soNo}?`)) return
    setActing(o.id)
    try {
      const res  = await fetch(`${BASE}/sd/orders/${o.id}/confirm`, { method:'POST', headers: hdr() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${o.soNo} confirmed!`)
      load()
    } catch(e) { toast.error(e.message) }
    finally { setActing(null) }
  }

  const deleteOrder = async (o, e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete ${o.soNo}?`)) return
    setActing(o.id)
    try {
      const res  = await fetch(`${BASE}/sd/orders/${o.id}`, { method:'DELETE', headers: hdr() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${o.soNo} deleted!`)
      load()
    } catch(e) { toast.error(e.message) }
    finally { setActing(null) }
  }

  const confirmed  = orders.filter(o => ['CONFIRMED','PROCESSING'].includes((o.status||'').toUpperCase())).length
  const draft      = orders.filter(o => ['DRAFT','OPEN'].includes((o.status||'').toUpperCase())).length
  const grandTotal = orders.reduce((s,o) => s + parseFloat(o.grandTotal||0), 0)
  const paged      = orders.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)
  const totalPages = Math.ceil(orders.length / PAGE_SIZE)

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Sales Orders <small>VA05 · {orders.length} record(s)</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-p" onClick={() => nav('/sd/orders/new')}>+ New Sales Order</button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        {[['Total Orders', orders.length,'#714B67'],['Confirmed', confirmed,'#155724'],
          ['Draft / Open', draft,'#856404'],['Grand Total', fmtC(grandTotal),'#1A5276']
        ].map(([l,v,c]) => (
          <div key={l} style={{ background:'#fff', border:'1.5px solid #E0D5E0',
            borderRadius:8, padding:'12px 16px', textAlign:'center' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#6C757D', textTransform:'uppercase', marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:22, fontWeight:800, color:c, fontFamily:'DM Mono,monospace' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:12 }}>
        <input placeholder="Search SO #, customer..." value={search}
          onChange={e => { setSearch(e.target.value); clearTimeout(timer.current); timer.current = setTimeout(load, 400) }}
          style={{ flex:1, padding:'8px 12px', border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:12, outline:'none' }} />
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ padding:'8px 12px', border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:12, outline:'none' }}>
          {['','DRAFT','OPEN','CONFIRMED','PROCESSING','DELIVERED','PAID','CANCELLED'].map(s => (
            <option key={s} value={s}>{s || 'All Status'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1.5px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>SO NUMBER</th><th>DATE</th><th>CUSTOMER</th>
              <th style={{textAlign:'right'}}>ITEMS</th>
              <th style={{textAlign:'right'}}>TAXABLE</th>
              <th style={{textAlign:'right'}}>GST</th>
              <th style={{textAlign:'right'}}>TOTAL</th>
              <th>DELIVERY</th><th>STATUS</th><th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading orders...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={10} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                <div style={{fontSize:32,marginBottom:8}}>📦</div>
                No orders found.
                <button className="btn-xs pri" style={{marginLeft:8}} onClick={() => nav('/sd/orders/new')}>+ Create SO</button>
              </td></tr>
            ) : paged.map((o, i) => {
              const st = STATUS_STYLE[(o.status||'DRAFT').toUpperCase()] || STATUS_STYLE.DRAFT
              const isDraft = ['DRAFT','OPEN'].includes((o.status||'').toUpperCase())
              const canInvoice = ['CONFIRMED','PROCESSING'].includes((o.status||'').toUpperCase())
              const isActing = acting === o.id
              let lineCount = o.lineCount || o._count?.lines || 0
              try {
                if (!lineCount && o.lineItems) {
                  const li = typeof o.lineItems === 'string' ? JSON.parse(o.lineItems) : o.lineItems
                  lineCount = Array.isArray(li) ? li.length : 0
                }
              } catch {}

              return (
                <tr key={o.id} style={{cursor:'pointer', background:i%2===0?'#fff':'#FAFAFA'}}
                  onClick={() => nav(`/sd/orders/${o.id}`)}>
                  <td>
                    <strong style={{fontFamily:'DM Mono,monospace', fontSize:12, color:'#714B67'}}>{o.soNo}</strong>
                    {o.poReference && <div style={{fontSize:10,color:'#6C757D'}}>PO: {o.poReference}</div>}
                  </td>
                  <td style={{fontSize:12,color:'#6C757D'}}>{fmtD(o.orderDate||o.date)}</td>
                  <td style={{fontWeight:600,fontSize:12}}>
                    {o.customerName}
                    {o.salesExec && <div style={{fontSize:10,color:'#6C757D'}}>{o.salesExec}</div>}
                  </td>
                  <td style={{textAlign:'right',fontSize:12,color:'#6C757D'}}>{lineCount > 0 ? `${lineCount} item(s)` : '—'}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12}}>{fmtC(o.taxableAmt)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:12,color:'#856404'}}>
                    {fmtC(parseFloat(o.cgst||0)+parseFloat(o.sgst||0)+parseFloat(o.igst||0))}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#155724'}}>{fmtC(o.grandTotal)}</td>
                  <td style={{fontSize:11,color:'#6C757D'}}>{fmtD(o.deliveryDate)}</td>
                  <td>
                    <span style={{background:st.bg,color:st.c,padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                      {(o.status||'DRAFT').toUpperCase()}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{display:'flex',gap:4}}>
                      <button style={{padding:'3px 10px',fontSize:11,fontWeight:700,borderRadius:4,
                        border:'1px solid #DEE2E6',background:'#fff',color:'#714B67',cursor:'pointer'}}
                        onClick={() => nav(`/sd/orders/${o.id}`)}>View</button>
                      {isDraft && (
                        <button style={{padding:'3px 10px',fontSize:11,fontWeight:700,borderRadius:4,
                          border:'none',background:'#D4EDDA',color:'#155724',cursor:'pointer',opacity:isActing?.6:1}}
                          disabled={isActing} onClick={e => confirmOrder(o,e)}>Confirm</button>
                      )}
                      {canInvoice && (
                        <button style={{padding:'3px 10px',fontSize:11,fontWeight:700,borderRadius:4,
                          border:'none',background:'#714B67',color:'#fff',cursor:'pointer'}}
                          onClick={e=>{e.stopPropagation();nav(`/sd/invoices/new?soId=${o.id}`)}}>Invoice</button>
                      )}
                      {isDraft && (
                        <button style={{padding:'3px 8px',fontSize:11,fontWeight:700,borderRadius:4,
                          border:'none',background:'#F8D7DA',color:'#721C24',cursor:'pointer',opacity:isActing?.6:1}}
                          disabled={isActing} onClick={e => deleteOrder(o,e)}>🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {orders.length > PAGE_SIZE && (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'10px 16px',background:'#F8F4F8',fontSize:12,color:'#6C757D'}}>
            <span>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,orders.length)} of {orders.length}</span>
            <div style={{display:'flex',gap:4}}>
              <button onClick={() => page>1 && setPage(p=>p-1)}
                style={{padding:'4px 10px',borderRadius:4,border:'1px solid #E0D5E0',
                  background:'#fff',cursor:page>1?'pointer':'default',opacity:page>1?1:.4}}>‹</button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)}
                  style={{padding:'4px 10px',borderRadius:4,border:'1px solid',
                    background:p===page?'#714B67':'#fff',color:p===page?'#fff':'#714B67',
                    borderColor:'#714B67',cursor:'pointer',fontWeight:p===page?700:400}}>{p}</button>
              ))}
              <button onClick={() => page<totalPages && setPage(p=>p+1)}
                style={{padding:'4px 10px',borderRadius:4,border:'1px solid #E0D5E0',
                  background:'#fff',cursor:page<totalPages?'pointer':'default',opacity:page<totalPages?1:.4}}>›</button>
            </div>
            <span>Total: <strong>{fmtC(grandTotal)}</strong></span>
          </div>
        )}
      </div>
    </div>
  )
}
