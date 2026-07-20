import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

export default function JobWorkReceipt() {
  const nav = useNavigate()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJC, setSelectedJC] = useState(null)
  const [qty, setQty] = useState('')
  const [toLocation, setToLocation] = useState('RM-STORE')
  const [remarks, setRemarks] = useState('')
  const [posting, setPosting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/pp/job-cards?status=PENDING`, { headers:authHdrs2() })
      const d = await res.json()
      setPending(d.data||[])
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[])
  useEffect(()=>{ load() },[load])

  const pick = jc => {
    setSelectedJC(jc)
    setQty(String(jc.receivedQty))
    setRemarks('')
  }

  const post = async () => {
    if (!selectedJC) return
    if (!qty || parseFloat(qty)<=0) return toast.error('Enter a valid quantity')
    setPosting(true)
    try {
      const res = await fetch(`${BASE_URL}/wm/job-work-receipt`, {
        method:'POST', headers:authHdrs(),
        body: JSON.stringify({
          itemCode: selectedJC.itemCode, itemName: selectedJC.itemName,
          qty, uom: selectedJC.uom,
          customerId: selectedJC.customerId, customerName: selectedJC.customerName,
          toLocation, remarks: remarks||undefined,
          jcId: selectedJC.id,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      setSelectedJC(null); setQty(''); setRemarks('')
      load()
    } catch(e){ toast.error(e.message) } finally { setPosting(false) }
  }

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          Job Work Receipt <small>Confirm physical receipt of customer material against a Job Card</small>
        </div>
      </div>

      <div className="pp-alert" style={{marginBottom:14,background:'#D1ECF1',borderColor:'#BEE5EB',color:'#0C5460'}}>
        Production raises the Job Card (paperwork) — this screen is Warehouse confirming the material has actually
        arrived and posting it to stock as <strong>customer-owned</strong>, not ours. Same split as GRN → Goods Receipt for purchases.
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selectedJC ? '1fr 1fr' : '1fr', gap:16 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#714B67', marginBottom:8 }}>
            Job Cards Awaiting Receipt ({pending.length})
          </div>
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
          ) : pending.length===0 ? (
            <div style={{ padding:30, textAlign:'center', color:'#6C757D',
              background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
              Nothing pending — every Job Card has been received.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {pending.map(jc=>(
                <div key={jc.id} onClick={()=>pick(jc)} style={{
                  background: selectedJC?.id===jc.id ? '#F0EEEB' : '#fff',
                  border: selectedJC?.id===jc.id ? '2px solid #714B67' : '1px solid #E0D5E0',
                  borderRadius:8, padding:'10px 14px', cursor:'pointer' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'#714B67' }}>{jc.jcNo}</span>
                    <span style={{ fontSize:11, color:'#6C757D' }}>{new Date(jc.jcDate).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div style={{ fontWeight:600, fontSize:13, marginTop:2 }}>{jc.itemCode?`${jc.itemCode} — `:''}{jc.itemName}</div>
                  <div style={{ fontSize:12, color:'#6C757D' }}>{jc.customerName} · {Number(jc.receivedQty).toFixed(2)} {jc.uom}{jc.dcNo?` · Their DC: ${jc.dcNo}`:''}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedJC && (
          <div className="wm-form-sec">
            <div className="wm-form-sec-hdr">Confirm Receipt — {selectedJC.jcNo}</div>
            <div className="wm-form-sec-body">
              <div className="wm-form-row2">
                <div className="wm-form-grp"><label>Item</label>
                  <input className="wm-form-ctrl" value={selectedJC.itemName} readOnly />
                </div>
                <div className="wm-form-grp"><label>Customer</label>
                  <input className="wm-form-ctrl" value={selectedJC.customerName} readOnly />
                </div>
              </div>
              <div className="wm-form-row2">
                <div className="wm-form-grp"><label>Qty Received <span>*</span></label>
                  <input type="number" className="wm-form-ctrl" value={qty} onChange={e=>setQty(e.target.value)} />
                  <small style={{color:'#6C757D'}}>Job Card says {Number(selectedJC.receivedQty).toFixed(2)} {selectedJC.uom} — adjust if the physical count differs</small>
                </div>
                <div className="wm-form-grp"><label>Store Into</label>
                  <select className="wm-form-ctrl" value={toLocation} onChange={e=>setToLocation(e.target.value)}>
                    <option value="RM-STORE">RM Store</option>
                    <option value="SHOP-FLOOR">Shop Floor</option>
                  </select>
                </div>
              </div>
              <div className="wm-form-row">
                <div className="wm-form-grp" style={{flex:1}}><label>Remarks</label>
                  <input className="wm-form-ctrl" placeholder="Optional notes..." value={remarks} onChange={e=>setRemarks(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="wm-form-acts">
              <button className="btn btn-s sd-bsm" onClick={()=>setSelectedJC(null)}>✕ Cancel</button>
              <button className="btn btn-p sd-bsm" disabled={posting} onClick={post}>
                {posting?'⏳ Posting...':'Confirm Receipt'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
