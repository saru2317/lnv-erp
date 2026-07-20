import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json',
  Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0',
  borderRadius:5, fontSize:12, outline:'none', width:'100%',
  boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057',
  display:'block', marginBottom:3, textTransform:'uppercase',
  letterSpacing:.3 }

// Each purpose drives: which direction it logs (IN/OUT), which party
// picker to show (SUPPLIER/CUSTOMER/EITHER/NONE), and which reference
// document to pick against. Gate Entry only ever REFERENCES a document
// already created by the owning module — it never creates the stock
// movement itself (Subcontract Out/Return, Job Work Receipt/Return,
// Purchase Return, Sales Return all already exist as real screens).
const PURPOSE_CONFIG = {
  'Material Receipt':           { direction:'IN',  party:'SUPPLIER', ref:'PO' },
  'Job Work Material':          { direction:'IN',  party:'CUSTOMER', ref:'NONE' },
  'Subcontract Material Return':{ direction:'IN',  party:'SUPPLIER', ref:'SUBCONTRACT_PO' },
  'Sales Return':                { direction:'IN',  party:'CUSTOMER', ref:'INVOICE' },
  'General Material Receipt':    { direction:'IN',  party:'EITHER',   ref:'NONE' },
  'Material Return':             { direction:'OUT', party:'SUPPLIER', ref:'NONE' },
  'Subcontract Material Out':    { direction:'OUT', party:'SUPPLIER', ref:'SUBCONTRACT_PO' },
  'Job Work Return':             { direction:'OUT', party:'CUSTOMER', ref:'JOB_CARD' },
  'Supplier Return':             { direction:'OUT', party:'SUPPLIER', ref:'GRN' },
  'General Material Out':        { direction:'OUT', party:'EITHER',   ref:'NONE' },
  'Visitor':        { direction:'IN', party:'NONE', ref:'NONE' },
  'Contractor':      { direction:'IN', party:'NONE', ref:'NONE' },
  'Empty Vehicle':   { direction:'IN', party:'NONE', ref:'NONE' },
  'Sample Delivery': { direction:'IN', party:'NONE', ref:'NONE' },
  'Courier':         { direction:'IN', party:'NONE', ref:'NONE' },
}
const PURPOSES = Object.keys(PURPOSE_CONFIG)

export default function GateEntryNew() {
  const nav = useNavigate()
  const [pos,       setPOs]      = useState([])
  const [vendors,   setVendors]  = useState([])
  const [customers, setCustomers]= useState([])
  const [jobCards,  setJobCards] = useState([])
  const [grns,      setGRNs]     = useState([])
  const [invoices,  setInvoices] = useState([])
  const [gateNo,  setGateNo] = useState('GE-AUTO')
  const [saving,  setSaving] = useState(false)
  const [generalParty, setGeneralParty] = useState('SUPPLIER') // for General Material Out/Receipt only
  const now = new Date()
  const [form, setForm] = useState({
    vehicleNo:'', vehicleType:'Truck',
    driverName:'', driverPhone:'', driverLicense:'',
    vendorCode:'', vendorName:'', customerId:'', customerName:'',
    dcNo:'', dcDate:'',
    poNo:'', poId:'', purpose:'Material Receipt',
    jcId:'', jcNo:'', grnId:'', grnNo:'', invoiceId:'', invoiceNo:'',
    materialDesc:'', noOfPackages:'',
    dcQty:'', dcUnit:'',
    grossWeight:'', netWeight:'', weightUnit:'Kg',
    securityName: JSON.parse(localStorage.getItem('lnv_user')||'{}')?.name||'',
    entryTime: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    remarks:''
  })
  const cfg = PURPOSE_CONFIG[form.purpose] || PURPOSE_CONFIG['Material Receipt']
  const effectiveParty = cfg.party==='EITHER' ? generalParty : cfg.party

  useEffect(()=>{
    fetch(`${BASE_URL}/wm/gate-entry/next-no`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setGateNo(d.gateNo||'GE-AUTO'))
      .catch(()=>{})
    fetch(`${BASE_URL}/wm/vendors`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setVendors(d.data||[]))
      .catch(()=>{})
    fetch(`${BASE_URL}/wm/pending-pos`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setPOs(d.data||[]))
      .catch(()=>{})
    fetch(`${BASE_URL}/sd/customers`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setCustomers(d.data||[]))
      .catch(()=>{})
    fetch(`${BASE_URL}/wm/job-cards-returnable`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setJobCards(d.data||[]))
      .catch(()=>{})
    fetch(`${BASE_URL}/wm/grns-recent`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setGRNs(d.data||[]))
      .catch(()=>{})
    fetch(`${BASE_URL}/wm/sales-invoices-recent`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setInvoices(d.data||[]))
      .catch(()=>{})
  },[])

  const onCustomerChange = e => {
    const c = customers.find(c=>String(c.id)===e.target.value)
    setForm(p=>({ ...p, customerId:e.target.value, customerName:c?.name||'' }))
  }
  const onJobCardChange = e => {
    const jc = jobCards.find(j=>String(j.id)===e.target.value)
    if (!jc) { setForm(p=>({...p, jcId:'', jcNo:''})); return }
    setForm(p=>({ ...p, jcId:String(jc.id), jcNo:jc.jcNo,
      customerId:String(jc.customerId||''), customerName:jc.customerName,
      materialDesc:jc.itemName }))
  }
  const onGRNChange = e => {
    const g = grns.find(g=>String(g.id)===e.target.value)
    if (!g) { setForm(p=>({...p, grnId:'', grnNo:''})); return }
    setForm(p=>({ ...p, grnId:String(g.id), grnNo:g.grnNo,
      vendorName:g.vendorName||p.vendorName, poNo:g.poNo||p.poNo }))
  }
  const onInvoiceChange = e => {
    const inv = invoices.find(i=>String(i.id)===e.target.value)
    if (!inv) { setForm(p=>({...p, invoiceId:'', invoiceNo:''})); return }
    setForm(p=>({ ...p, invoiceId:String(inv.id), invoiceNo:inv.invoiceNo,
      customerId:String(inv.customerId||''), customerName:inv.customerName }))
  }


  const onVendorChange = e => {
    const v = vendors.find(v=>v.vendorCode===e.target.value)
    setForm(p=>({ ...p,
      vendorCode: e.target.value,
      vendorName: v?.vendorName||'' }))
  }

  const onPOChange = e => {
    const po = pos.find(p=>p.id===parseInt(e.target.value))
    if (!po) return
    // Auto load vendor details + material from PO lines
    const matDesc = (po.lines||[])
      .map(l=>l.itemName).filter(Boolean).join(', ')
    const totalDCQty = (po.lines||[])
      .reduce((s,l)=>s+parseFloat(l.qty||0), 0)
    const unit = po.lines?.[0]?.unit||''
    const vCode = vendors.find(v=>
      v.vendorCode===po.vendorCode||
      v.vendorName===po.vendorName)?.vendorCode||''
    setForm(p=>({ ...p,
      poId:        po.id,
      poNo:        po.poNo||'',
      vendorCode:  vCode||po.vendorCode||'',
      vendorName:  po.vendorName||'',
      materialDesc:matDesc,
      dcQty:       totalDCQty,
      dcUnit:      unit,
    }))
  }

  const save = async () => {
    if (!form.vehicleNo) return toast.error('Vehicle No required!')
    if (effectiveParty==='SUPPLIER' && !form.vendorName) return toast.error('Vendor required!')
    if (effectiveParty==='CUSTOMER' && !form.customerName) return toast.error('Customer required!')
    if (cfg.ref==='JOB_CARD' && !form.jcId) return toast.error('Select the Job Card being returned!')
    if (cfg.ref==='GRN' && !form.grnId) return toast.error('Select the GRN being returned against!')
    if (cfg.ref==='INVOICE' && !form.invoiceId) return toast.error('Select the Invoice being returned against!')
    setSaving(true)
    try {
      const payload = { ...form, direction:cfg.direction, partyType:effectiveParty }
      const res  = await fetch(`${BASE_URL}/wm/gate-entry`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.message} — Gate Pass: GP-${data.data.gateNo}`)
      nav('/wm/gate-entry')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const field = (label, field, type='text', placeholder='') => (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} style={inp}
        value={form[field]} placeholder={placeholder}
        onChange={e=>setForm(p=>({...p,[field]:e.target.value}))} />
    </div>
  )

  const grid3 = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }
  const grid2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }

  const section = (title, icon, children) => (
    <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
      overflow:'hidden', marginBottom:12 }}>
      <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)',
        padding:'7px 14px', display:'flex', gap:8, alignItems:'center' }}>
        <span>{icon}</span>
        <span style={{ color:'#fff', fontSize:12, fontWeight:700,
          fontFamily:'Syne,sans-serif' }}>{title}</span>
      </div>
      <div style={{ padding:14, background:'#fff' }}>{children}</div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column',
      height:'100%', overflow:'hidden' }}>

      {/* ── Sticky Header ─────────────────────────── */}
      <div style={{ flexShrink:0, position:'sticky', top:0, zIndex:100,
        background:'#F8F4F8', borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div>
            <div className="lv-ttl">
              🚛 Gate Entry
              <small style={{ fontFamily:'DM Mono,monospace',
                color:'#714B67', marginLeft:8 }}>{gateNo}</small>
            </div>
            <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>
              Time: {form.entryTime} · Gate Pass auto-generated on save
            </div>
          </div>
          <div className="lv-acts">
            <button className="btn btn-s sd-bsm"
              onClick={()=>nav('/wm/gate-entry')}>✕ Cancel</button>
            <button className="btn btn-p sd-bsm"
              disabled={saving} onClick={save}>
              {saving?'⏳ Saving...':'🚛 Record Entry'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable Body ────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 0 60px' }}>
          {/* Purpose */}
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Purpose of Visit</label>
            <div style={{ display:'flex', gap:6,
              flexWrap:'wrap', marginTop:4 }}>
              {PURPOSES.map(p=>(
                <div key={p}
                  onClick={()=>setForm(f=>({...f,purpose:p}))}
                  style={{ padding:'5px 12px', borderRadius:20,
                    cursor:'pointer', fontSize:12, fontWeight:600,
                    border:`2px solid ${form.purpose===p
                      ?'#155724':'#E0D5E0'}`,
                    background:form.purpose===p?'#155724':'#fff',
                    color:form.purpose===p?'#fff':'#6C757D',
                    transition:'all .15s' }}>
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle & Driver */}
          {section('Vehicle & Driver Details', '🚛',(
            <>
              <div style={{ ...grid3, marginBottom:12 }}>
                <div>
                  <label style={lbl}>Vehicle No *</label>
                  <input style={{ ...inp, textTransform:'uppercase',
                    fontWeight:700, letterSpacing:1 }}
                    value={form.vehicleNo} placeholder="TN 01 AB 1234"
                    onChange={e=>setForm(p=>({...p,
                      vehicleNo:e.target.value.toUpperCase()}))} />
                </div>
                <div>
                  <label style={lbl}>Vehicle Type</label>
                  <select style={{ ...inp, cursor:'pointer' }}
                    value={form.vehicleType}
                    onChange={e=>setForm(p=>({...p,
                      vehicleType:e.target.value}))}>
                    {['Truck','Mini Truck','Tempo','Van',
                      'Two Wheeler','Car','Auto'].map(t=>(
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Entry Time</label>
                  <input type="time" style={inp}
                    value={form.entryTime}
                    onChange={e=>setForm(p=>({...p,
                      entryTime:e.target.value}))} />
                </div>
              </div>
              <div style={grid3}>
                {field('Driver Name', 'driverName', 'text', 'Driver full name')}
                {field('Driver Phone', 'driverPhone', 'tel', '9876543210')}
                {field('License No.', 'driverLicense', 'text', 'DL No.')}
              </div>
            </>
          ))}

          {/* Party + Reference Document — driven by PURPOSE_CONFIG */}
          {section(
            cfg.ref==='PO' ? 'Supplier / PO Details' :
            cfg.ref==='SUBCONTRACT_PO' ? 'Vendor / Subcontract PO' :
            cfg.ref==='JOB_CARD' ? 'Customer / Job Card' :
            cfg.ref==='GRN' ? 'Supplier / GRN Reference' :
            cfg.ref==='INVOICE' ? 'Customer / Invoice Reference' :
            effectiveParty==='CUSTOMER' ? 'Customer Details' :
            effectiveParty==='SUPPLIER' ? 'Supplier Details' : 'Party Details',
            '🏢', (
            <>
              {cfg.party==='EITHER' && (
                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  {['SUPPLIER','CUSTOMER'].map(pt=>(
                    <div key={pt} onClick={()=>setGeneralParty(pt)}
                      style={{ padding:'5px 14px', borderRadius:16, cursor:'pointer', fontSize:11, fontWeight:700,
                        border:`2px solid ${generalParty===pt?'#714B67':'#E0D5E0'}`,
                        background:generalParty===pt?'#714B67':'#fff',
                        color:generalParty===pt?'#fff':'#6C757D' }}>
                      {pt==='SUPPLIER'?'To/From Supplier':'To/From Customer'}
                    </div>
                  ))}
                </div>
              )}

              {cfg.ref==='PO' && (
                <>
                  <div style={{ ...grid3, marginBottom:12 }}>
                    <div>
                      <label style={lbl}>Link PO (optional)</label>
                      <select style={{ ...inp, cursor:'pointer' }} value={form.poId} onChange={onPOChange}>
                        <option value="">-- Select PO --</option>
                        {pos.filter(p=>p.poType!=='SUBCONTRACT').map(p=>(
                          <option key={p.id} value={p.id}>{p.poNo} · {p.vendorName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Vendor / Supplier *</label>
                      <select style={{ ...inp, cursor:'pointer' }} value={form.vendorCode} onChange={onVendorChange}>
                        <option value="">-- Select Vendor --</option>
                        {vendors.map(v=>(
                          <option key={v.vendorCode} value={v.vendorCode}>{v.vendorCode} — {v.vendorName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>DC / Challan No.</label>
                      <input style={inp} value={form.dcNo} placeholder="Delivery Challan No."
                        onChange={e=>setForm(p=>({...p, dcNo:e.target.value}))} />
                    </div>
                  </div>
                  <div style={grid3}>
                    {field('DC Date', 'dcDate', 'date')}
                    {field('PO No. (manual)', 'poNo', 'text', 'PO-2026-0001')}
                    <div>
                      <label style={lbl}>Vendor Name</label>
                      <input style={{ ...inp, background:form.vendorCode?'#F8F9FA':'#fff' }}
                        value={form.vendorName} readOnly={!!form.vendorCode} placeholder="Vendor name"
                        onChange={e=>setForm(p=>({...p, vendorName:e.target.value}))} />
                    </div>
                  </div>
                </>
              )}

              {cfg.ref==='SUBCONTRACT_PO' && (
                <div style={{ ...grid3, marginBottom:12 }}>
                  <div>
                    <label style={lbl}>Subcontract PO *</label>
                    <select style={{ ...inp, cursor:'pointer' }} value={form.poId} onChange={onPOChange}>
                      <option value="">-- Select Subcontract PO --</option>
                      {pos.filter(p=>p.poType==='SUBCONTRACT').map(p=>(
                        <option key={p.id} value={p.id}>{p.poNo} · {p.vendorName}</option>
                      ))}
                    </select>
                    {pos.filter(p=>p.poType==='SUBCONTRACT').length===0 && (
                      <small style={{color:'#6C757D'}}>No Subcontract POs found — create one in MM first.</small>
                    )}
                  </div>
                  <div>
                    <label style={lbl}>Vendor Name</label>
                    <input style={{ ...inp, background:form.vendorCode?'#F8F9FA':'#fff' }}
                      value={form.vendorName} readOnly={!!form.poId} placeholder="Auto-filled from PO"
                      onChange={e=>setForm(p=>({...p, vendorName:e.target.value}))} />
                  </div>
                  <div>
                    <label style={lbl}>DC / Challan No.</label>
                    <input style={inp} value={form.dcNo} placeholder="Vendor's delivery challan No."
                      onChange={e=>setForm(p=>({...p, dcNo:e.target.value}))} />
                  </div>
                </div>
              )}

              {cfg.ref==='JOB_CARD' && (
                <div style={{ ...grid3, marginBottom:12 }}>
                  <div>
                    <label style={lbl}>Job Card *</label>
                    <select style={{ ...inp, cursor:'pointer' }} value={form.jcId} onChange={onJobCardChange}>
                      <option value="">-- Select Job Card --</option>
                      {jobCards.map(j=>(
                        <option key={j.id} value={j.id}>{j.jcNo} · {j.itemName} · {j.customerName}</option>
                      ))}
                    </select>
                    {jobCards.length===0 && <small style={{color:'#6C757D'}}>No job cards currently RECEIVED or IN_PROGRESS.</small>}
                  </div>
                  <div>
                    <label style={lbl}>Customer</label>
                    <input style={{ ...inp, background:'#F8F9FA' }} value={form.customerName} readOnly />
                  </div>
                  <div>
                    <label style={lbl}>Reason</label>
                    <input style={inp} value={form.remarks} placeholder="Wrong spec, cancelled, etc."
                      onChange={e=>setForm(p=>({...p, remarks:e.target.value}))} />
                  </div>
                </div>
              )}

              {cfg.ref==='GRN' && (
                <div style={{ ...grid3, marginBottom:12 }}>
                  <div>
                    <label style={lbl}>GRN *</label>
                    <select style={{ ...inp, cursor:'pointer' }} value={form.grnId} onChange={onGRNChange}>
                      <option value="">-- Select GRN --</option>
                      {grns.map(g=>(
                        <option key={g.id} value={g.id}>{g.grnNo} · {g.vendorName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Vendor Name</label>
                    <input style={{ ...inp, background:form.grnId?'#F8F9FA':'#fff' }}
                      value={form.vendorName} readOnly={!!form.grnId} placeholder="Auto-filled from GRN"
                      onChange={e=>setForm(p=>({...p, vendorName:e.target.value}))} />
                  </div>
                  <div>
                    <label style={lbl}>Return Reason</label>
                    <input style={inp} value={form.remarks} placeholder="Defective, excess, wrong item..."
                      onChange={e=>setForm(p=>({...p, remarks:e.target.value}))} />
                  </div>
                </div>
              )}

              {cfg.ref==='INVOICE' && (
                <div style={{ ...grid3, marginBottom:12 }}>
                  <div>
                    <label style={lbl}>Sales Invoice *</label>
                    <select style={{ ...inp, cursor:'pointer' }} value={form.invoiceId} onChange={onInvoiceChange}>
                      <option value="">-- Select Invoice --</option>
                      {invoices.map(i=>(
                        <option key={i.id} value={i.id}>{i.invoiceNo} · {i.customerName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Customer</label>
                    <input style={{ ...inp, background:'#F8F9FA' }} value={form.customerName} readOnly />
                  </div>
                  <div>
                    <label style={lbl}>Return Reason</label>
                    <input style={inp} value={form.remarks} placeholder="Damaged, wrong item, excess..."
                      onChange={e=>setForm(p=>({...p, remarks:e.target.value}))} />
                  </div>
                </div>
              )}

              {cfg.ref==='NONE' && effectiveParty==='CUSTOMER' && (
                <div style={{ ...grid3, marginBottom:12 }}>
                  <div>
                    <label style={lbl}>Customer *</label>
                    <select style={{ ...inp, cursor:'pointer' }} value={form.customerId} onChange={onCustomerChange}>
                      <option value="">-- Select Customer --</option>
                      {customers.map(c=>(
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>DC / Challan No.</label>
                    <input style={inp} value={form.dcNo} placeholder="Their delivery challan No."
                      onChange={e=>setForm(p=>({...p, dcNo:e.target.value}))} />
                  </div>
                  <div>
                    <label style={lbl}>DC Date</label>
                    <input type="date" style={inp} value={form.dcDate}
                      onChange={e=>setForm(p=>({...p, dcDate:e.target.value}))} />
                  </div>
                </div>
              )}

              {cfg.ref==='NONE' && effectiveParty==='SUPPLIER' && (
                <div style={{ ...grid3, marginBottom:12 }}>
                  <div>
                    <label style={lbl}>Vendor / Supplier *</label>
                    <select style={{ ...inp, cursor:'pointer' }} value={form.vendorCode} onChange={onVendorChange}>
                      <option value="">-- Select Vendor --</option>
                      {vendors.map(v=>(
                        <option key={v.vendorCode} value={v.vendorCode}>{v.vendorCode} — {v.vendorName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>DC / Challan No.</label>
                    <input style={inp} value={form.dcNo} placeholder="Delivery Challan No."
                      onChange={e=>setForm(p=>({...p, dcNo:e.target.value}))} />
                  </div>
                  <div>
                    <label style={lbl}>Vendor Name</label>
                    <input style={{ ...inp, background:form.vendorCode?'#F8F9FA':'#fff' }}
                      value={form.vendorName} readOnly={!!form.vendorCode} placeholder="Vendor name"
                      onChange={e=>setForm(p=>({...p, vendorName:e.target.value}))} />
                  </div>
                </div>
              )}
            </>
          ))}

          {/* PO Items Preview */}
          {form.poId && pos.find(p=>p.id===parseInt(form.poId)) && (
            <div style={{ background:'#D1ECF1',
              borderRadius:8, padding:'10px 14px',

              marginBottom:12,
              border:'1px solid #B8DAFF' }}>
              <div style={{ fontSize:10, fontWeight:700,
                color:'#0C5460', marginBottom:6,
                textTransform:'uppercase' }}>
                📋 Items from PO {form.poNo}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap',
                gap:6 }}>
                {(pos.find(p=>p.id===parseInt(form.poId))
                  ?.lines||[]).map((l,i)=>(
                  <div key={i} style={{ background:'#fff',
                    borderRadius:6, padding:'4px 10px',
                    fontSize:11, fontWeight:600,
                    color:'#0C5460',
                    border:'1px solid #B8DAFF' }}>
                    {l.itemName}
                    <span style={{ color:'#6C757D',
                      marginLeft:6 }}>
                      {parseFloat(l.qty||0)} {l.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Material Details */}
          {section('Material Details', '📦', (
            <>
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Material Description</label>
                <input style={inp} value={form.materialDesc}
                  placeholder="Brief description of materials"
                  onChange={e=>setForm(p=>({...p,
                    materialDesc:e.target.value}))} />
              </div>
              <div style={{ ...grid3, marginBottom:12 }}>
                <div>
                  <label style={lbl}>DC / Challan Qty</label>
                  <div style={{ display:'flex', gap:6 }}>
                    <input type="number" style={{ ...inp, flex:1 }}
                      value={form.dcQty} placeholder="0"
                      onChange={e=>setForm(p=>({...p,
                        dcQty:e.target.value}))} />
                    <input style={{ ...inp, width:60 }}
                      value={form.dcUnit} placeholder="Unit"
                      onChange={e=>setForm(p=>({...p,
                        dcUnit:e.target.value}))} />
                  </div>
                </div>
                {field('No. of Packages', 'noOfPackages',
                  'number', '0')}
                {field('Gross Weight', 'grossWeight',
                  'number', '0.000')}
              </div>
              <div style={grid3}>
                {field('Net Weight', 'netWeight',
                  'number', '0.000')}
                <div>
                  <label style={lbl}>Weight Unit</label>
                  <select style={{ ...inp, cursor:'pointer' }}
                    value={form.weightUnit}
                    onChange={e=>setForm(p=>({...p,
                      weightUnit:e.target.value}))}>
                    {['Kg','MT','Ltr','Nos','Box'].map(u=>(
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ))}

          {/* Security */}
          {section('Security / Remarks', '🔒', (
            <div style={grid2}>
              {field('Security Officer Name', 'securityName',
                'text', 'Officer name')}
              {field('Remarks', 'remarks', 'text',
                'Any notes...')}
            </div>
          ))}
      </div>
    </div>
  )
}
