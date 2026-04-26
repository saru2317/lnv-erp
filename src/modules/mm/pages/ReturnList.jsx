import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json',
  Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const REASONS = [
  'Quality Rejection','Damaged in Transit',
  'Wrong Material Delivered','Short Supply',
  'Spec Mismatch','Excess Quantity','Expired Material'
]

function ReturnModal({ onSave, onCancel }) {
  const [grns,  setGRNs]  = useState([])
  const [saving,setSaving]= useState(false)
  const [form, setForm] = useState({
    grnNo:'', grnId:'', vendorName:'',
    materialDesc:'', returnQty:'', unit:'',
    reason:'Quality Rejection', remarks:''
  })

  useEffect(()=>{
    fetch(`${BASE_URL}/wm/grn`,
      { headers:authHdrs2() })
      .then(r=>r.json())
      .then(d=>setGRNs(d.data||[]))
      .catch(()=>{})
  },[])

  const onGRNChange = e => {
    const g = grns.find(g=>g.id===parseInt(e.target.value))
    if (!g) return
    setForm(f=>({ ...f,
      grnId:   g.id,
      grnNo:   g.grnNo,
      vendorName: g.vendorName,
      unit:    g.lines?.[0]?.unit||'',
      materialDesc: g.lines?.map(l=>l.itemName).join(', ')||''
    }))
  }

  const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0',
    borderRadius:5, fontSize:12, outline:'none', width:'100%',
    boxSizing:'border-box' }
  const lbl = { fontSize:10, fontWeight:700, color:'#495057',
    display:'block', marginBottom:3, textTransform:'uppercase' }

  const save = async () => {
    if (!form.grnNo)    return toast.error('Select a GRN!')
    if (!form.returnQty)return toast.error('Enter return quantity!')
    if (!form.reason)   return toast.error('Select reason!')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/mm/returns`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0,
      background:'rgba(0,0,0,.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10,
        width:520, overflow:'hidden',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#DC3545', padding:'14px 20px',
          display:'flex', justifyContent:'space-between',
          alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontSize:15,
            fontWeight:700 }}>↩️ New Purchase Return</h3>
          <span onClick={onCancel}
            style={{ color:'#fff', cursor:'pointer',
              fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20,
          display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={lbl}>GRN Reference *</label>
            <select style={{ ...inp, cursor:'pointer' }}
              value={form.grnId}
              onChange={onGRNChange}>
              <option value="">-- Select GRN --</option>
              {grns.map(g=>(
                <option key={g.id} value={g.id}>
                  {g.grnNo} · {g.vendorName}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display:'grid',
            gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={lbl}>Vendor</label>
              <input style={{ ...inp, background:'#F8F9FA' }}
                value={form.vendorName} readOnly />
            </div>
            <div>
              <label style={lbl}>Reason *</label>
              <select style={{ ...inp, cursor:'pointer' }}
                value={form.reason}
                onChange={e=>setForm(f=>({...f,
                  reason:e.target.value}))}>
                {REASONS.map(r=>(
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Material Description</label>
            <input style={inp} value={form.materialDesc}
              onChange={e=>setForm(f=>({...f,
                materialDesc:e.target.value}))} />
          </div>
          <div style={{ display:'grid',
            gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={lbl}>Return Qty *</label>
              <input type="number" style={inp}
                value={form.returnQty} placeholder="0"
                onChange={e=>setForm(f=>({...f,
                  returnQty:e.target.value}))} />
            </div>
            <div>
              <label style={lbl}>Unit</label>
              <input style={inp} value={form.unit}
                placeholder="Nos/Kg/Ltr"
                onChange={e=>setForm(f=>({...f,
                  unit:e.target.value}))} />
            </div>
          </div>
          <div>
            <label style={lbl}>Remarks</label>
            <textarea style={{ ...inp, resize:'vertical' }}
              rows={2} value={form.remarks}
              placeholder="Additional notes..."
              onChange={e=>setForm(f=>({...f,
                remarks:e.target.value}))} />
          </div>
        </div>
        <div style={{ padding:'12px 20px',
          borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end',
          gap:10, background:'#F8F7FA' }}>
          <button onClick={onCancel}
            style={{ padding:'8px 20px', background:'#fff',
              color:'#6C757D', border:'1.5px solid #E0D5E0',
              borderRadius:6, fontSize:13,
              cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding:'8px 24px',
              background:'#DC3545', color:'#fff',
              border:'none', borderRadius:6,
              fontSize:13, fontWeight:700,
              cursor:'pointer' }}>
            {saving?'⏳':'↩️'} Submit Return
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReturnList() {
  const [returns, setReturns] = useState([])
  const [loading, setLoad]    = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [search,  setSearch]  = useState('')

  const fetch_ = useCallback(async () => {
    setLoad(true)
    try {
      const res  = await fetch(`${BASE_URL}/mm/returns`,
        { headers:authHdrs2() })
      const data = await res.json()
      setReturns(data.data||[])
    } catch(e){ toast.error(e.message) }
    finally { setLoad(false) }
  },[])

  useEffect(()=>{ fetch_() },[])

  const filtered = returns.filter(r =>
    !search ||
    r.returnNo?.toLowerCase().includes(search.toLowerCase()) ||
    r.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    r.grnNo?.toLowerCase().includes(search.toLowerCase()))

  const STATUS = {
    PENDING:  { bg:'#FFF3CD', color:'#856404', label:'Pending'  },
    RETURNED: { bg:'#F8D7DA', color:'#721C24', label:'Returned' },
    CLOSED:   { bg:'#D4EDDA', color:'#155724', label:'Closed'   },
  }

  return (
    <div>
      {/* Sticky Header */}
      <div style={{ position:'sticky', top:0, zIndex:100,
        background:'#F8F4F8',
        borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Purchase Returns
            <small>MIGO-RE · Return to Vendor</small>
          </div>
          <div className="lv-acts">
            <input placeholder="Search return, GRN, vendor..."
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{ padding:'6px 12px',
                border:'1px solid #E0D5E0',
                borderRadius:5, fontSize:12, width:200 }} />
            <button className="btn btn-p sd-bsm"
              onClick={()=>setShowNew(true)}>
              ↩️ New Return
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center',
          color:'#6C757D' }}>⏳ Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center',
          color:'#6C757D', background:'#fff',
          borderRadius:8, border:'2px dashed #E0D5E0',
          marginTop:16 }}>
          <div style={{ fontSize:32 }}>↩️</div>
          <div style={{ fontWeight:700, marginTop:8 }}>
            No purchase returns
          </div>
          <button className="btn btn-p sd-bsm"
            style={{ marginTop:12 }}
            onClick={()=>setShowNew(true)}>
            + New Return
          </button>
        </div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0',
          borderRadius:8, overflow:'hidden', marginTop:14 }}>
          <table style={{ width:'100%',
            borderCollapse:'collapse', fontSize:12 }}>
            <thead style={{ background:'#F8F4F8',
              position:'sticky', top:60 }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Return No.','Date','GRN Ref',
                  'Vendor','Material','Qty',
                  'Reason','Status'].map(h=>(
                  <th key={h} style={{ padding:'8px 12px',
                    fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left',
                    textTransform:'uppercase',
                    letterSpacing:.3,
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r,i)=>{
                const sc = STATUS[r.status]||STATUS.PENDING
                return (
                  <tr key={r.id} style={{
                    borderBottom:'1px solid #F0EEF0',
                    background:i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'8px 12px' }}>
                      <strong style={{ color:'#714B67',
                        fontFamily:'DM Mono,monospace',
                        fontSize:12 }}>{r.returnNo}</strong>
                    </td>
                    <td style={{ padding:'8px 12px',
                      fontSize:11, color:'#6C757D' }}>
                      {new Date(r.createdAt)
                        .toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding:'8px 12px',
                      fontFamily:'DM Mono,monospace',
                      fontSize:11, color:'#714B67' }}>
                      {r.grnNo}
                    </td>
                    <td style={{ padding:'8px 12px',
                      fontWeight:600 }}>{r.vendorName}</td>
                    <td style={{ padding:'8px 12px',
                      fontSize:11 }}>{r.materialDesc}</td>
                    <td style={{ padding:'8px 12px',
                      fontWeight:700 }}>
                      {r.returnQty} {r.unit}
                    </td>
                    <td style={{ padding:'8px 12px',
                      fontSize:11, color:'#856404' }}>
                      {r.reason}
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      <span style={{ padding:'2px 8px',
                        borderRadius:10, fontSize:10,
                        fontWeight:700,
                        background:sc.bg, color:sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <ReturnModal
          onSave={()=>{ setShowNew(false); fetch_() }}
          onCancel={()=>setShowNew(false)} />
      )}
    </div>
  )
}
