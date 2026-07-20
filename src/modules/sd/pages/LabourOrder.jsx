import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '₹' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const STATUS_STYLE = {
  OPEN:        { bg:'#FFF3CD', c:'#856404' },
  IN_PROGRESS: { bg:'#CFE2FF', c:'#084298' },
  COMPLETED:   { bg:'#D4EDDA', c:'#155724' },
  CLOSED:      { bg:'#E2D9F3', c:'#4B2E83' },
  CANCELLED:   { bg:'#F8D7DA', c:'#721C24' },
}

const BLANK = {
  customerName:'', customerGstin:'', customerId:'',
  itemCode:'', itemName:'', orderedQty:'', uom:'Nos',
  processCode:'', processName:'', materialType:'', materialSupply:'without',
  rateOverride:'', expectedDeliveryDate:'', remarks:'',
}

export default function LabourOrder() {
  const nav = useNavigate()
  const [tab, setTab] = useState('list')
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('')
  const [custSearch, setCustSearch] = useState('')
  const [showDrop, setShowDrop] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [rateInfo, setRateInfo] = useState(null)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

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

  // Auto-lookup rate whenever process / material-supply / customer changes
  useEffect(()=>{
    if (!form.processName) { setRateInfo(null); return }
    fetch(`${BASE_URL}/sd/labour-pricebook/get-rate`, {
      method:'POST', headers:hdr(),
      body: JSON.stringify({ processCode:form.processCode, processName:form.processName,
        customerId:form.customerId, materialType:form.materialSupply })
    }).then(r=>r.json()).then(d=>setRateInfo(d)).catch(()=>setRateInfo(null))
  },[form.processName, form.processCode, form.materialSupply, form.customerId])

  const reset = () => { setForm(BLANK); setCustSearch(''); setRateInfo(null) }

  const save = async () => {
    if (!form.customerName) return toast.error('Select customer')
    if (!form.itemName)     return toast.error('Item name required')
    if (!form.orderedQty || parseFloat(form.orderedQty)<=0) return toast.error('Enter a valid quantity')
    if (!form.processName)  return toast.error('Select a process — used to look up the rate')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/sd/labour-orders`, {
        method:'POST', headers:hdr(), body: JSON.stringify(form)
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      reset(); setTab('list'); load()
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

  const filtCust = customers.filter(c=>
    c.name?.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.code?.toLowerCase().includes(custSearch.toLowerCase())
  ).slice(0,8)

  const filtered = orders.filter(o=>{
    const matchS = !statusF || o.status===statusF
    const matchQ = !search ||
      o.loNo?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.itemName?.toLowerCase().includes(search.toLowerCase())
    return matchS && matchQ
  })

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
            Labour Order
            <small style={{fontSize:11,fontWeight:400,color:'#6C757D',marginLeft:8}}>Customer's job-work demand, rate locked in at agreement time</small>
          </div>
          <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
            Created before material arrives — Job Cards can optionally be raised against one
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setTab('list')}
            style={{padding:'7px 14px',background:tab==='list'?'#714B67':'#fff',
              color:tab==='list'?'#fff':'#6C757D',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>
            List
          </button>
          <button onClick={()=>setTab('new')}
            style={{padding:'7px 16px',background:tab==='new'?'#714B67':'#fff',
              color:tab==='new'?'#fff':'#714B67',border:'1px solid #714B67',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
            + New Labour Order
          </button>
        </div>
      </div>

      {tab==='list' ? (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
            {[
              { l:'Total Orders', v:orders.length, c:'#714B67', bg:'#EDE0EA' },
              { l:'Open',         v:orders.filter(o=>o.status==='OPEN').length, c:'#856404', bg:'#FFF3CD' },
              { l:'In Progress',  v:orders.filter(o=>o.status==='IN_PROGRESS').length, c:'#084298', bg:'#CFE2FF' },
              { l:'Completed',    v:orders.filter(o=>o.status==='COMPLETED'||o.status==='CLOSED').length, c:'#155724', bg:'#D4EDDA' },
            ].map(k=>(
              <div key={k.l} style={{background:'#fff',borderRadius:8,padding:'10px 14px',border:'1px solid #E0D5E0',borderLeft:`4px solid ${k.c}`}}>
                <div style={{fontSize:15,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{k.v}</div>
                <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>{k.l}</div>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search LO, customer, item..."
              style={{padding:'7px 12px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,outline:'none',width:220}} />
            <select value={statusF} onChange={e=>setStatusF(e.target.value)}
              style={{padding:'7px 10px',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,outline:'none'}}>
              <option value="">All Status</option>
              {Object.keys(STATUS_STYLE).map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
            <span style={{marginLeft:'auto',fontSize:11,color:'#6C757D'}}>{filtered.length} of {orders.length} records</span>
          </div>

          {loading ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>⏳ Loading...</div>
          ) : filtered.length===0 ? (
            <div style={{padding:40,textAlign:'center',color:'#6C757D',background:'#fff',borderRadius:8,border:'2px dashed #E0D5E0'}}>
              No Labour Orders yet.
              <div style={{marginTop:12}}><button onClick={()=>setTab('new')} style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>+ New Labour Order</button></div>
            </div>
          ) : (
            <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead style={{background:'#F8F4F8'}}>
                  <tr style={{borderBottom:'2px solid #E0D5E0'}}>
                    {['LO No','Customer','Item','Qty','Rate','Process','Expected','Status',''].map(h=>(
                      <th key={h} style={{padding:'8px 10px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left',textTransform:'uppercase'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o,i)=>(
                    <tr key={o.id} style={{borderBottom:'1px solid #F0EEF0',background:i%2===0?'#fff':'#FDFBFD'}}>
                      <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace',color:'#714B67',fontWeight:600}}>{o.loNo}</td>
                      <td style={{padding:'8px 10px'}}>{o.customerName}</td>
                      <td style={{padding:'8px 10px',fontWeight:600}}>{o.itemCode?`${o.itemCode} — `:''}{o.itemName}</td>
                      <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace'}}>{Number(o.orderedQty).toFixed(2)} {o.uom}</td>
                      <td style={{padding:'8px 10px',fontFamily:'DM Mono,monospace'}}>{INR(o.materialSupply==='with'?o.rateWithMat:o.rateWithoutMat)}/{o.pricingBasis}</td>
                      <td style={{padding:'8px 10px'}}>{o.processName}</td>
                      <td style={{padding:'8px 10px',fontSize:11,color:'#6C757D'}}>{o.expectedDeliveryDate?new Date(o.expectedDeliveryDate).toLocaleDateString('en-IN'):'—'}</td>
                      <td style={{padding:'8px 10px'}}>
                        <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                          background:STATUS_STYLE[o.status]?.bg,color:STATUS_STYLE[o.status]?.c}}>{o.status?.replace('_',' ')}</span>
                      </td>
                      <td style={{padding:'8px 10px'}}>
                        {o.status==='OPEN' && (
                          <button onClick={()=>cancelOrder(o.id)} style={{padding:'3px 8px',fontSize:11,background:'#F8D7DA',color:'#721C24',border:'none',borderRadius:4,cursor:'pointer'}}>Cancel</button>
                        )}
                        {(o.status==='OPEN') && (
                          <button onClick={()=>nav(`/pp/job-card/new?loId=${o.id}`)} style={{padding:'3px 8px',fontSize:11,background:'#714B67',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',marginLeft:4}}>+ Job Card</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Customer</div>
            <div style={{position:'relative',maxWidth:400}}>
              <label style={lbl}>Customer Name *</label>
              <input style={inp} value={custSearch||form.customerName}
                onChange={e=>{ setCustSearch(e.target.value); set('customerName',e.target.value); setShowDrop(true) }}
                onFocus={()=>setShowDrop(true)} onBlur={()=>setTimeout(()=>setShowDrop(false),200)}
                placeholder="Type to search..." />
              {showDrop && filtCust.length>0 && (
                <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:100,background:'#fff',
                  border:'1px solid #E0D5E0',borderRadius:6,boxShadow:'0 4px 16px rgba(0,0,0,.12)',maxHeight:180,overflowY:'auto'}}>
                  {filtCust.map(c=>(
                    <div key={c.id} onClick={()=>{
                        set('customerName',c.name); set('customerGstin',c.gstin||''); set('customerId',String(c.id))
                        setCustSearch(c.name); setShowDrop(false)
                      }}
                      style={{padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid #F0EEEB',fontSize:12}}>
                      {c.name} {c.gstin && <span style={{color:'#6C757D',fontSize:11}}> · {c.gstin}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Item &amp; Quantity</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr 1fr 1fr',gap:12}}>
              <div><label style={lbl}>Item Code</label>
                <input style={inp} value={form.itemCode} onChange={e=>set('itemCode',e.target.value)} placeholder="Optional" /></div>
              <div><label style={lbl}>Item Name *</label>
                <input style={inp} value={form.itemName} onChange={e=>set('itemName',e.target.value)} /></div>
              <div><label style={lbl}>Ordered Qty *</label>
                <input type="number" style={inp} value={form.orderedQty} onChange={e=>set('orderedQty',e.target.value)} /></div>
              <div><label style={lbl}>UOM</label>
                <input style={inp} value={form.uom} onChange={e=>set('uom',e.target.value)} /></div>
            </div>
          </div>

          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>Process &amp; Rate</div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12,marginBottom:10}}>
              <div><label style={lbl}>Process *</label>
                <select style={inp} value={form.processName}
                  onChange={e=>{
                    const p = processes.find(pr=>(pr.name||pr.processName)===e.target.value)
                    set('processName', e.target.value); set('processCode', p?.code||p?.processCode||'')
                  }}>
                  <option value="">-- Select Process --</option>
                  {processes.map(p=>(
                    <option key={p.id||p.code||p.name} value={p.name||p.processName}>{p.name||p.processName}</option>
                  ))}
                </select>
              </div>
              <div><label style={lbl}>Material Supply</label>
                <select style={inp} value={form.materialSupply} onChange={e=>set('materialSupply',e.target.value)}>
                  <option value="without">Without Material (labour only)</option>
                  <option value="with">With Material (we supply)</option>
                </select>
              </div>
              <div><label style={lbl}>Expected Delivery</label>
                <input type="date" style={inp} value={form.expectedDeliveryDate} onChange={e=>set('expectedDeliveryDate',e.target.value)} /></div>
            </div>

            {form.processName && (
              <div style={{background: rateInfo?.found?'#D4EDDA':'#FFF3CD', borderRadius:6, padding:'10px 14px', marginBottom:10}}>
                {rateInfo?.found ? (
                  <div style={{fontSize:12,color:'#155724'}}>
                    Rate from price book: <strong>{INR(rateInfo.rate)}/{rateInfo.basis}</strong>
                    {rateInfo.minCharge>0 && <> · Min charge {INR(rateInfo.minCharge)}</>} · GST {rateInfo.gstRate}%
                  </div>
                ) : (
                  <div style={{fontSize:12,color:'#856404'}}>No price book entry found for this process — enter a manual rate below or it'll be locked in at ₹0.</div>
                )}
              </div>
            )}

            <div style={{maxWidth:240}}>
              <label style={lbl}>Manual Rate Override</label>
              <input type="number" style={inp} value={form.rateOverride} onChange={e=>set('rateOverride',e.target.value)}
                placeholder={rateInfo?.found ? `Leave blank to use ${rateInfo.rate}` : 'Required — no price book match'} />
            </div>
          </div>

          <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:12}}>
            <label style={lbl}>Remarks</label>
            <input style={inp} value={form.remarks} onChange={e=>set('remarks',e.target.value)} placeholder="Optional notes..." />
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <button onClick={()=>{reset();setTab('list')}} style={{padding:'8px 16px',background:'#fff',color:'#6C757D',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>Cancel</button>
            <button disabled={saving} onClick={save} style={{padding:'8px 20px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              {saving?'⏳ Saving...':'Save Labour Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
