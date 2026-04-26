import React, { useState, useEffect, useCallback } from 'react'
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

const STATUS = {
  IN:       { bg:'#D4EDDA', color:'#155724', label:'Inside',   icon:'🔵' },
  OUT:      { bg:'#E9ECEF', color:'#6C757D', label:'Exited',   icon:'⚪' },
  GRN_DONE: { bg:'#EDE0EA', color:'#714B67', label:'GRN Done', icon:'✅' },
  RETURNED: { bg:'#FFF3CD', color:'#856404', label:'Returned', icon:'↩️' },
}
const PURPOSES = [
  'Material Receipt','Material Return',
  'Visitor','Contractor','Empty Vehicle',
  'Sample Delivery','Courier'
]

// ── Gate Entry Form Modal ──────────────────────────────────
function GateEntryModal({ onSave, onCancel }) {
  const [pos,     setPOs]    = useState([])
  const [vendors, setVendors]= useState([])
  const [gateNo,  setGateNo] = useState('GE-AUTO')
  const [saving,  setSaving] = useState(false)
  const now = new Date()
  const [form, setForm] = useState({
    vehicleNo:'', vehicleType:'Truck',
    driverName:'', driverPhone:'', driverLicense:'',
    vendorCode:'', vendorName:'', dcNo:'', dcDate:'',
    poNo:'', poId:'', purpose:'Material Receipt',
    materialDesc:'', noOfPackages:'',
    dcQty:'', dcUnit:'',
    grossWeight:'', netWeight:'', weightUnit:'Kg',
    securityName: JSON.parse(localStorage.getItem('lnv_user')||'{}')?.name||'',
    entryTime: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    remarks:''
  })

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
  },[])

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
    if (!form.vendorName) return toast.error('Vendor required!')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/wm/gate-entry`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.message} — Gate Pass: GP-${data.data.gateNo}`)
      onSave()
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
    <div style={{ position:'fixed', inset:0,
      background:'rgba(0,0,0,.55)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#F0EEEB', borderRadius:10,
        width:'92%', maxWidth:860, maxHeight:'94vh',
        display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#155724,#0C5460)',
          padding:'14px 20px', flexShrink:0,
          display:'flex', justifyContent:'space-between',
          alignItems:'center', borderRadius:'10px 10px 0 0' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0,
              fontFamily:'Syne,sans-serif',
              fontSize:16, fontWeight:800 }}>
              🚛 Gate Entry
            </h3>
            <p style={{ color:'rgba(255,255,255,.7)',
              margin:'2px 0 0', fontSize:11 }}>
              Gate No: <strong style={{ color:'#90EE90',
                fontFamily:'DM Mono,monospace' }}>
                {gateNo}
              </strong>
              &nbsp;|&nbsp;
              Time: {form.entryTime}
            </p>
          </div>
          <span onClick={onCancel}
            style={{ color:'#fff', cursor:'pointer',
              fontSize:22 }}>✕</span>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:16 }}>
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

          {/* Supplier & PO */}
          {section('Supplier / PO Details', '🏢', (
            <>
              <div style={{ ...grid3, marginBottom:12 }}>
                <div>
                  <label style={lbl}>Link PO (optional)</label>
                  <select style={{ ...inp, cursor:'pointer' }}
                    value={form.poId}
                    onChange={onPOChange}>
                    <option value="">-- Select PO --</option>
                    {pos.map(p=>(
                      <option key={p.id} value={p.id}>
                        {p.poNo} · {p.vendorName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Vendor / Supplier *</label>
                  <select style={{ ...inp, cursor:'pointer' }}
                    value={form.vendorCode}
                    onChange={onVendorChange}>
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v=>(
                      <option key={v.vendorCode} value={v.vendorCode}>
                        {v.vendorCode} — {v.vendorName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>DC / Challan No.</label>
                  <input style={inp} value={form.dcNo}
                    placeholder="Delivery Challan No."
                    onChange={e=>setForm(p=>({...p,
                      dcNo:e.target.value}))} />
                </div>
              </div>
              <div style={grid3}>
                {field('DC Date', 'dcDate', 'date')}
                {field('PO No. (manual)', 'poNo', 'text', 'PO-2026-0001')}
                <div>
                  <label style={lbl}>Vendor Name</label>
                  <input style={{ ...inp, background:
                    form.vendorCode?'#F8F9FA':'#fff' }}
                    value={form.vendorName}
                    readOnly={!!form.vendorCode}
                    placeholder="Vendor name"
                    onChange={e=>setForm(p=>({...p,
                      vendorName:e.target.value}))} />
                </div>
              </div>
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

        {/* Footer */}
        <div style={{ padding:'12px 20px',
          borderTop:'1px solid #E0D5E0', flexShrink:0,
          display:'flex', justifyContent:'space-between',
          alignItems:'center', background:'#F8F7FA',
          borderRadius:'0 0 10px 10px' }}>
          <div style={{ fontSize:11, color:'#6C757D' }}>
            Gate Pass will be auto-generated on save
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onCancel}
              style={{ padding:'8px 20px', background:'#fff',
                color:'#6C757D', border:'1.5px solid #E0D5E0',
                borderRadius:6, fontSize:13, cursor:'pointer' }}>
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              style={{ padding:'8px 28px',
                background:saving?'#999':'#155724',
                color:'#fff', border:'none', borderRadius:6,
                fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {saving?'⏳ Saving...':'🚛 Record Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Gate Pass Print ────────────────────────────────────────
function GatePassModal({ entry, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0,
      background:'rgba(0,0,0,.55)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10,
        width:480, boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#155724', padding:'12px 20px',
          display:'flex', justifyContent:'space-between',
          alignItems:'center', borderRadius:'10px 10px 0 0' }}>
          <h3 style={{ color:'#fff', margin:0, fontSize:15,
            fontWeight:700 }}>🎫 Gate Pass</h3>
          <span onClick={onClose}
            style={{ color:'#fff', cursor:'pointer',
              fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20 }} id="gate-pass-print">
          {/* Gate Pass content */}
          <div style={{ border:'3px solid #155724',
            borderRadius:8, padding:16, textAlign:'center',
            marginBottom:14 }}>
            <div style={{ fontSize:11, color:'#6C757D',
              marginBottom:4 }}>LNV MANUFACTURING PVT. LTD.</div>
            <div style={{ fontSize:20, fontWeight:900,
              color:'#155724', fontFamily:'Syne,sans-serif',
              letterSpacing:1 }}>GATE PASS</div>
            <div style={{ fontSize:16, fontWeight:800,
              color:'#714B67', fontFamily:'DM Mono,monospace',
              marginTop:4 }}>{entry.gatePassNo}</div>
          </div>
          <div style={{ display:'grid',
            gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12 }}>
            {[
              ['Gate Entry No', entry.gateNo],
              ['Date',          new Date(entry.entryDate)
                                  .toLocaleDateString('en-IN')],
              ['Entry Time',    entry.entryTime||'—'],
              ['Purpose',       entry.purpose],
              ['Vehicle No.',   entry.vehicleNo],
              ['Vehicle Type',  entry.vehicleType],
              ['Driver Name',   entry.driverName||'—'],
              ['Driver Phone',  entry.driverPhone||'—'],
              ['Vendor',        entry.vendorName],
              ['DC No.',        entry.dcNo||'—'],
              ['PO No.',        entry.poNo||'—'],
              ['Material',      entry.materialDesc||'—'],
              ['Packages',      entry.noOfPackages||'—'],
              ['Gross Wt.',     entry.grossWeight
                                  ?`${entry.grossWeight} ${entry.weightUnit}`:'—'],
            ].map(([l,v])=>(
              <div key={l} style={{ background:'#F8F7FA',
                padding:'6px 10px', borderRadius:5 }}>
                <div style={{ fontSize:9, color:'#6C757D',
                  fontWeight:700, textTransform:'uppercase' }}>
                  {l}
                </div>
                <div style={{ fontWeight:700, marginTop:1 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:14, display:'flex',
            justifyContent:'space-between',
            borderTop:'1px dashed #E0D5E0', paddingTop:12,
            fontSize:11, color:'#6C757D' }}>
            <div>Security: {entry.securityName||'—'}</div>
            <div>Exit Time: ___________</div>
          </div>
        </div>
        <div style={{ padding:'12px 20px',
          borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end',
          gap:10, background:'#F8F7FA',
          borderRadius:'0 0 10px 10px' }}>
          <button onClick={onClose}
            style={{ padding:'8px 20px', background:'#fff',
              color:'#6C757D', border:'1.5px solid #E0D5E0',
              borderRadius:6, fontSize:13, cursor:'pointer' }}>
            Close
          </button>
          <button onClick={()=>window.print()}
            style={{ padding:'8px 24px', background:'#155724',
              color:'#fff', border:'none', borderRadius:6,
              fontSize:13, fontWeight:700, cursor:'pointer' }}>
            🖨️ Print Gate Pass
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN GATE ENTRY LIST ───────────────────────────────────
export default function GateEntryList() {
  const nav = useNavigate()
  const [entries, setEntries]  = useState([])
  const [loading, setLoading]  = useState(true)
  const [showNew, setShowNew]  = useState(false)
  const [showPass,setShowPass] = useState(null)
  const [search,  setSearch]   = useState('')
  const [chip,    setChip]     = useState('all')

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/wm/gate-entry`,
        { headers:authHdrs2() })
      const data = await res.json()
      setEntries(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchEntries() }, [])

  const recordExit = async (entry) => {
    try {
      const res  = await fetch(
        `${BASE_URL}/wm/gate-entry/${entry.id}/exit`,
        { method:'PATCH', headers:authHdrs(),
          body:'{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Vehicle exit recorded!')
      fetchEntries()
    } catch(e){ toast.error(e.message) }
  }

  const filtered = entries.filter(e => {
    const matchChip = chip==='all' || e.status===chip
    const matchSearch = !search ||
      e.gateNo?.toLowerCase().includes(search.toLowerCase()) ||
      e.vehicleNo?.toLowerCase().includes(search.toLowerCase()) ||
      e.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      e.poNo?.toLowerCase().includes(search.toLowerCase())
    return matchChip && matchSearch
  })

  const inside = entries.filter(e=>e.status==='IN').length

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          Gate Entry Register
          {inside > 0 && (
            <span style={{ marginLeft:10, padding:'3px 10px',
              borderRadius:10, fontSize:12, fontWeight:700,
              background:'#D4EDDA', color:'#155724' }}>
              🔵 {inside} vehicle(s) inside
            </span>
          )}
        </div>
        <div className="lv-acts">
          <input placeholder="Search Gate No., Vehicle, Vendor..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{ padding:'6px 12px',
              border:'1px solid #E0D5E0',
              borderRadius:5, fontSize:12, width:200 }} />
          <button className="btn btn-p sd-bsm"
            onClick={()=>setShowNew(true)}>
            + Gate Entry
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          { l:'Total Today',
            v:entries.filter(e=>{
              const d=new Date(e.createdAt)
              const t=new Date()
              return d.toDateString()===t.toDateString()
            }).length,
            c:'#714B67', bg:'#EDE0EA' },
          { l:'Currently Inside',
            v:inside,
            c:'#155724', bg:'#D4EDDA' },
          { l:'Exited',
            v:entries.filter(e=>e.status==='OUT').length,
            c:'#6C757D', bg:'#E9ECEF' },
          { l:'GRN Pending',
            v:entries.filter(e=>
              e.status==='IN'&&e.purpose==='Material Receipt').length,
            c:'#856404', bg:'#FFF3CD' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg,
            borderRadius:8, padding:'10px 14px',
            border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c,
              fontWeight:700, textTransform:'uppercase' }}>
              {k.l}
            </div>
            <div style={{ fontSize:24, fontWeight:800,
              color:k.c, fontFamily:'Syne,sans-serif' }}>
              {k.v}
            </div>
          </div>
        ))}
      </div>

      {/* Chips */}
      <div className="mm-chips" style={{ marginBottom:12 }}>
        {[['all','All'],['IN','Inside'],
          ['OUT','Exited'],['GRN_DONE','GRN Done']].map(([k,l])=>(
          <div key={k} className={`mm-chip${chip===k?' on':''}`}
            onClick={()=>setChip(k)}>
            {l} <strong style={{ marginLeft:4 }}>
              {k==='all'?entries.length
                :entries.filter(e=>e.status===k).length}
            </strong>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center',
          color:'#6C757D' }}>⏳ Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center',
          color:'#6C757D', background:'#fff', borderRadius:8,
          border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🚛</div>
          <div style={{ fontWeight:700 }}>No gate entries</div>
          <button className="btn btn-p sd-bsm"
            style={{ marginTop:12 }}
            onClick={()=>setShowNew(true)}>
            + New Gate Entry
          </button>
        </div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0',
          borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%',
            borderCollapse:'collapse', fontSize:12 }}>
            <thead style={{ background:'#F8F4F8',
              position:'sticky', top:0 }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Gate No.','Date/Time','Vehicle',
                  'Driver','Vendor','PO Ref',
                  'Purpose','DC No.','Status',
                  'Actions'].map(h=>(
                  <th key={h} style={{ padding:'8px 10px',
                    fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left',
                    textTransform:'uppercase', letterSpacing:.3,
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e,i)=>{
                const sc = STATUS[e.status]||STATUS.IN
                const isIn = e.status==='IN'
                return (
                  <tr key={e.id} style={{
                    borderBottom:'1px solid #F0EEF0',
                    background: isIn
                      ? '#F0FFF4'
                      : i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'8px 10px' }}>
                      <strong style={{ color:'#714B67',
                        fontFamily:'DM Mono,monospace',
                        fontSize:12 }}>{e.gateNo}</strong>
                      <div style={{ fontSize:9,
                        color:'#aaa',
                        fontFamily:'DM Mono,monospace' }}>
                        {e.gatePassNo}
                      </div>
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontSize:11, color:'#6C757D' }}>
                      <div>
                        {new Date(e.entryDate)
                          .toLocaleDateString('en-IN')}
                      </div>
                      <div style={{ fontWeight:700,
                        color: isIn?'#155724':'#6C757D' }}>
                        IN: {e.entryTime||'—'}
                        {e.exitTime &&
                          ` | OUT: ${e.exitTime}`}
                      </div>
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      <div style={{ fontWeight:700,
                        fontFamily:'DM Mono,monospace',
                        fontSize:13, letterSpacing:.5 }}>
                        {e.vehicleNo}
                      </div>
                      <div style={{ fontSize:10,
                        color:'#6C757D' }}>
                        {e.vehicleType}
                      </div>
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontSize:11 }}>
                      <div>{e.driverName||'—'}</div>
                      <div style={{ color:'#6C757D',
                        fontSize:10 }}>
                        {e.driverPhone||''}
                      </div>
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontWeight:600 }}>{e.vendorName}</td>
                    <td style={{ padding:'8px 10px',
                      fontFamily:'DM Mono,monospace',
                      fontSize:11, color:'#714B67' }}>
                      {e.poNo||'—'}
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontSize:11 }}>
                      <span style={{ padding:'2px 8px',
                        borderRadius:8, fontSize:10,
                        fontWeight:600,
                        background:e.purpose==='Material Receipt'
                          ?'#D1ECF1':'#F8F9FA',
                        color:e.purpose==='Material Receipt'
                          ?'#0C5460':'#6C757D' }}>
                        {e.purpose}
                      </span>
                    </td>
                    <td style={{ padding:'8px 10px',
                      fontSize:11, color:'#6C757D',
                      fontFamily:'DM Mono,monospace' }}>
                      {e.dcNo||'—'}
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{ padding:'2px 8px',
                        borderRadius:10, fontSize:11,
                        fontWeight:700,
                        background:sc.bg,
                        color:sc.color }}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td style={{ padding:'8px 10px' }}
                      onClick={ev=>ev.stopPropagation()}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-xs"
                          onClick={()=>setShowPass(e)}>
                          🎫 Pass
                        </button>
                        {isIn && (
                          <button className="btn-xs"
                            style={{ background:'#6C757D',
                              color:'#fff' }}
                            onClick={()=>recordExit(e)}>
                            OUT ↗
                          </button>
                        )}
                        {isIn &&
                          e.purpose==='Material Receipt' && (
                          <button className="btn-xs pri"
                            onClick={()=>nav(
                              `/wm/grn/new${
                                e.poId?`?po=${e.poId}`:''
                              }`)}>
                            GRN
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <GateEntryModal
          onSave={()=>{ setShowNew(false); fetchEntries() }}
          onCancel={()=>setShowNew(false)} />
      )}

      {showPass && (
        <GatePassModal
          entry={showPass}
          onClose={()=>setShowPass(null)} />
      )}
    </div>
  )
}
