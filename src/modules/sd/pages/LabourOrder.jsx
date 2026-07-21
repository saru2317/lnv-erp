import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const fmtC = n => '₹' + Math.round(n||0).toLocaleString('en-IN')

const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0',
  borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:3, textTransform:'uppercase' }

const STATUS_STYLE = {
  OPEN:        { bg:'#FFF3CD', c:'#856404' },
  IN_PROGRESS: { bg:'#CFE2FF', c:'#084298' },
  COMPLETED:   { bg:'#D4EDDA', c:'#155724' },
  CLOSED:      { bg:'#E2D9F3', c:'#4B2E83' },
  CANCELLED:   { bg:'#F8D7DA', c:'#721C24' },
}

const newLine = () => ({
  itemCode:'', itemName:'', orderedQty:1, uom:'Nos',
  processCode:'', processName:'', materialSupply:'without',
  rateOverride:'', remarks:'', _rateInfo:null,
})

export default function LabourOrder() {
  const nav = useNavigate()
  const [view, setView] = useState('list') // 'list' | 'new'
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('')

  const [form, setForm] = useState({
    customerId:'', customerName:'', customerGstin:'',
    expectedDeliveryDate:'', remarks:'',
  })
  const [lines, setLines] = useState([newLine()])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/sd/labour-orders`, { headers:hdr2() })
      const d = await res.json()
      setOrders(d.data||[])
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[])

  useEffect(()=>{
    load()
    fetch(`${BASE_URL}/sd/customers`, { headers:hdr2() }).then(r=>r.json()).then(d=>setCustomers(d.data||[])).catch(()=>{})
    fetch(`${BASE_URL}/process`, { headers:hdr2() }).then(r=>r.json()).then(d=>setProcesses(d.data||d||[])).catch(()=>{})
  },[load])

  const resetForm = () => {
    setForm({ customerId:'', customerName:'', customerGstin:'', expectedDeliveryDate:'', remarks:'' })
    setLines([newLine()])
  }

  const onCustomerChange = id => {
    const c = customers.find(c=>String(c.id)===id)
    setForm(f=>({ ...f, customerId:id, customerName:c?.name||'', customerGstin:c?.gstin||'' }))
    // Customer changed — every line's rate may differ (customer-specific
    // price book overrides), refresh them all.
    lines.forEach((l,i)=>{ if (l.processName) fetchRatePreview(i, l, id) })
  }

  const updLine = (i, changes) => setLines(prev => prev.map((l,idx)=> idx===i ? {...l,...changes} : l))

  const fetchRatePreview = async (i, l, customerId=form.customerId) => {
    if (!l.processName) return
    try {
      const res = await fetch(`${BASE_URL}/sd/labour-pricebook/get-rate`, {
        method:'POST', headers:hdr(),
        body: JSON.stringify({ processCode:l.processCode, processName:l.processName,
          customerId, materialType:l.materialSupply })
      })
      const d = await res.json()
      updLine(i, { _rateInfo: d })
    } catch { updLine(i, { _rateInfo:null }) }
  }

  const lineCalc = l => {
    const rate = l.rateOverride ? parseFloat(l.rateOverride) : (l._rateInfo?.rate||0)
    const taxable = Math.max(rate * parseFloat(l.orderedQty||0), l._rateInfo?.minCharge||0)
    const gstPct = l._rateInfo?.gstRate ?? 18
    const gstAmt = taxable * gstPct / 100
    return { rate, taxable, gst:gstAmt, total: taxable+gstAmt, gstPct }
  }

  const totals = lines.reduce((acc,l)=>{
    const c = lineCalc(l)
    return { taxable:acc.taxable+c.taxable, gst:acc.gst+c.gst, total:acc.total+c.total }
  }, { taxable:0, gst:0, total:0 })

  const save = async () => {
    if (!form.customerName) return toast.error('Select customer')
    for (const [i,l] of lines.entries()) {
      if (!l.itemName)    return toast.error(`Line ${i+1}: item required`)
      if (!l.orderedQty || parseFloat(l.orderedQty)<=0) return toast.error(`Line ${i+1}: enter a valid quantity`)
      if (!l.processName) return toast.error(`Line ${i+1}: select a process`)
    }
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/sd/labour-orders`, {
        method:'POST', headers:hdr(),
        body: JSON.stringify({ ...form, lines })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      resetForm(); setView('list'); load()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const cancelOrder = async id => {
    if (!confirm('Cancel this Labour Order?')) return
    try {
      const res = await fetch(`${BASE_URL}/sd/labour-orders/${id}/cancel`, { method:'POST', headers:hdr() })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message); load()
    } catch(e){ toast.error(e.message) }
  }

  const filtered = orders.filter(o=>{
    const matchS = !statusF || o.status===statusF
    const matchQ = !search ||
      o.loNo?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.itemName?.toLowerCase().includes(search.toLowerCase())
    return matchS && matchQ
  })

  if (view === 'list') return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          Labour Order
          <small>Customer's job-work demand · rate locked in at agreement time</small>
        </div>
        <div className="lv-acts">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search LO, customer, item..."
            style={{ ...inp, width:200 }} />
          <select value={statusF} onChange={e=>setStatusF(e.target.value)} style={{ ...inp, width:140 }}>
            <option value="">All Status</option>
            {Object.keys(STATUS_STYLE).map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <button className="btn btn-p sd-bsm" onClick={()=>{resetForm();setView('new')}}>+ New Labour Order</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        {[
          { l:'Total Orders', v:orders.length, c:'#714B67', bg:'#EDE0EA' },
          { l:'Open',         v:orders.filter(o=>o.status==='OPEN').length, c:'#856404', bg:'#FFF3CD' },
          { l:'In Progress',  v:orders.filter(o=>o.status==='IN_PROGRESS').length, c:'#084298', bg:'#CFE2FF' },
          { l:'Completed',    v:orders.filter(o=>o.status==='COMPLETED'||o.status==='CLOSED').length, c:'#155724', bg:'#D4EDDA' },
        ].map(k=>(
          <div key={k.l} style={{ background:'#fff', borderRadius:8, padding:'10px 14px', border:'1px solid #E0D5E0', borderLeft:`4px solid ${k.c}` }}>
            <div style={{ fontSize:15, fontWeight:800, color:k.c, fontFamily:'Syne,sans-serif' }}>{k.v}</div>
            <div style={{ fontSize:10, color:'#6C757D', marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D', background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          No Labour Orders yet.
          <div style={{ marginTop:12 }}>
            <button className="btn btn-p sd-bsm" onClick={()=>{resetForm();setView('new')}}>+ New Labour Order</button>
          </div>
        </div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#714B67', color:'#fff' }}>
                {['LO No','Customer','Lines','Items','Total Value','Expected','Status',''].map(h=>(
                  <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontSize:10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o,i)=>(
                <tr key={o.id} style={{ borderBottom:'1px solid #F0F0F0', background:i%2===0?'#fff':'#FAFAFA' }}>
                  <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace', color:'#714B67', fontWeight:600 }}>{o.loNo}</td>
                  <td style={{ padding:'8px 10px' }}>{o.customerName}</td>
                  <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace' }}>{o.lines?.length||1}</td>
                  <td style={{ padding:'8px 10px', fontWeight:600 }}>
                    {o.lines?.length>1 ? `${o.lines[0].itemName} +${o.lines.length-1} more` : (o.itemCode?`${o.itemCode} — `:'')+o.itemName}
                  </td>
                  <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace', fontWeight:600 }}>{fmtC(o.grandTotal||0)}</td>
                  <td style={{ padding:'8px 10px', fontSize:11, color:'#6C757D' }}>{o.expectedDeliveryDate?new Date(o.expectedDeliveryDate).toLocaleDateString('en-IN'):'—'}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{ padding:'3px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                      background:STATUS_STYLE[o.status]?.bg, color:STATUS_STYLE[o.status]?.c }}>{o.status?.replace('_',' ')}</span>
                  </td>
                  <td style={{ padding:'8px 10px' }}>
                    {o.status==='OPEN' && (
                      <button onClick={()=>cancelOrder(o.id)} style={{ padding:'3px 8px', fontSize:11, background:'#F8D7DA', color:'#721C24', border:'none', borderRadius:4, cursor:'pointer' }}>Cancel</button>
                    )}
                    {o.status==='OPEN' && (
                      <button onClick={()=>nav(`/pp/job-card/new?loId=${o.id}`)} style={{ padding:'3px 8px', fontSize:11, background:'#714B67', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', marginLeft:4 }}>+ Job Card</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="lv-hdr">
        <div className="lv-ttl">
          New Labour Order
          <small>Job Work · rate locked in at agreement, before material arrives</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={()=>{resetForm();setView('list')}}>← Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>💾 Save Labour Order</button>
        </div>
      </div>

      {/* Customer & Order Header */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">👤 Customer &amp; Order Header</div>
        <div className="fi-form-sec-body">
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Customer *</label>
              <select style={inp} value={form.customerId} onChange={e=>onCustomerChange(e.target.value)}>
                <option value="">-- Select Customer --</option>
                {customers.map(c=>(
                  <option key={c.id} value={c.id}>{c.code||c.customerCode} — {c.name||c.customerName}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Customer GSTIN</label>
              <input style={{ ...inp, background:'#F8F9FA', fontFamily:'DM Mono,monospace', fontSize:11 }} value={form.customerGstin} readOnly />
            </div>
            <div>
              <label style={lbl}>Expected Delivery</label>
              <input type="date" style={inp} value={form.expectedDeliveryDate} onChange={e=>setForm(f=>({...f,expectedDeliveryDate:e.target.value}))} />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>📦 Items &amp; Processes</span>
          <button onClick={()=>setLines(p=>[...p,newLine()])}
            style={{ padding:'3px 12px', fontSize:11, cursor:'pointer', background:'#fff', border:'1px solid #E0D5E0', borderRadius:4, color:'#714B67' }}>
            + Add Row
          </button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#714B67', color:'#fff' }}>
                {['#','Item','Process','Material Supply','Qty','UOM','Rate','Taxable','GST','Total',''].map((h,i)=>(
                  <th key={i} style={{ padding:'7px 10px', textAlign:'left', whiteSpace:'nowrap', fontSize:10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l,i)=>{
                const c = lineCalc(l)
                return (
                  <tr key={i} style={{ borderBottom:'1px solid #F0F0F0', background:i%2===0?'#fff':'#FAFAFA' }}>
                    <td style={{ padding:'5px 8px', color:'#6C757D', fontWeight:700, width:24 }}>{i+1}</td>
                    <td style={{ padding:'4px 6px', minWidth:170 }}>
                      <input style={{ ...inp, fontSize:11, marginBottom:2 }} placeholder="Item code (optional)"
                        value={l.itemCode} onChange={e=>updLine(i,{itemCode:e.target.value})} />
                      <input style={{ ...inp, fontSize:11 }} placeholder="Item name *"
                        value={l.itemName} onChange={e=>updLine(i,{itemName:e.target.value})} />
                    </td>
                    <td style={{ padding:'4px 6px', minWidth:150 }}>
                      <select style={{ ...inp, fontSize:11 }} value={l.processName}
                        onChange={e=>{
                          const p = processes.find(pr=>(pr.name||pr.processName)===e.target.value)
                          updLine(i,{processName:e.target.value, processCode:p?.code||p?.processCode||''})
                          setTimeout(()=>fetchRatePreview(i,{...l,processName:e.target.value,processCode:p?.code||p?.processCode||''}),0)
                        }}>
                        <option value="">-- Process --</option>
                        {processes.map(p=>(
                          <option key={p.id||p.code||p.name} value={p.name||p.processName}>{p.name||p.processName}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding:'4px 6px', width:120 }}>
                      <select style={{ ...inp, fontSize:11 }} value={l.materialSupply}
                        onChange={e=>{ updLine(i,{materialSupply:e.target.value}); setTimeout(()=>fetchRatePreview(i,{...l,materialSupply:e.target.value}),0) }}>
                        <option value="without">Without Mat.</option>
                        <option value="with">With Mat.</option>
                      </select>
                    </td>
                    <td style={{ padding:'4px 6px', width:65 }}>
                      <input type="number" style={{ ...inp, textAlign:'right' }} value={l.orderedQty} min={0}
                        onChange={e=>updLine(i,{orderedQty:parseFloat(e.target.value)||0})} />
                    </td>
                    <td style={{ padding:'4px 6px', width:65 }}>
                      <select style={inp} value={l.uom} onChange={e=>updLine(i,{uom:e.target.value})}>
                        {['Nos','Kg','Mtr','Ltr','Sqft','Set','Pcs'].map(u=><option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:'4px 6px', width:85 }}>
                      <input type="number" style={{ ...inp, textAlign:'right' }} value={l.rateOverride}
                        placeholder={l._rateInfo?.found?String(l._rateInfo.rate):'—'}
                        onChange={e=>updLine(i,{rateOverride:e.target.value})} />
                    </td>
                    <td style={{ padding:'4px 8px', fontFamily:'DM Mono,monospace', textAlign:'right', background:'#F8F9FA' }}>{fmtC(c.taxable)}</td>
                    <td style={{ padding:'4px 8px', fontFamily:'DM Mono,monospace', textAlign:'right', color:'#856404' }}>{fmtC(c.gst)}</td>
                    <td style={{ padding:'4px 8px', fontFamily:'DM Mono,monospace', textAlign:'right', fontWeight:700 }}>{fmtC(c.total)}</td>
                    <td style={{ padding:'4px 6px', textAlign:'center' }}>
                      {lines.length>1 && (
                        <button onClick={()=>setLines(p=>p.filter((_,idx)=>idx!==i))}
                          style={{ background:'#F8D7DA', color:'#721C24', border:'none', borderRadius:3, padding:'2px 6px', cursor:'pointer' }}>✕</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:'#EDE0EA', fontWeight:700 }}>
                <td colSpan={7} style={{ padding:'8px 10px', fontSize:12, color:'#714B67' }}>Totals</td>
                <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace' }}>{fmtC(totals.taxable)}</td>
                <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', color:'#856404' }}>{fmtC(totals.gst)}</td>
                <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, fontSize:14, color:'#714B67' }}>{fmtC(totals.total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        {lines.some(l=>l.processName && !l._rateInfo?.found) && (
          <div style={{ padding:'8px 14px', fontSize:11, color:'#856404', background:'#FFF3CD' }}>
            One or more lines have no price book match — enter a manual rate for those, or they'll lock in at ₹0.
          </div>
        )}
      </div>

      {/* Remarks */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📋 Remarks</div>
        <div className="fi-form-sec-body">
          <textarea style={{ ...inp, resize:'vertical' }} rows={2} value={form.remarks}
            onChange={e=>setForm(f=>({...f,remarks:e.target.value}))}
            placeholder="Internal notes, delivery instructions..." />
        </div>
      </div>
    </div>
  )
}
