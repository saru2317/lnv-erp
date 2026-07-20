import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const EMPTY_FORM = {
  itemCode:'', itemName:'', qty:'', uom:'',
  vendorCode:'', vendorName:'',
  fromLocation:'RM-STORE', toLocation:'RM-STORE',
  poNo:'', remarks:'',
}

export default function Subcontracting() {
  const nav = useNavigate()
  const [mode,    setMode]    = useState('out')   // 'out' | 'return'
  const [items,   setItems]   = useState([])
  const [vendors, setVendors] = useState([])
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState(EMPTY_FORM)

  // WOs flagged External (ctrlKey PP02) — RELEASED ones are candidates
  // to send out, AT_VENDOR ones are candidates for an unprocessed
  // return. Picking one locks item/qty to that WO so the movement log
  // carries a clean woNo reference instead of free-text entry.
  const [linkedWOs, setLinkedWOs] = useState([])
  const [selectedWO, setSelectedWO] = useState('')

  const loadWOs = useCallback(async (m) => {
    const status = m==='out' ? 'RELEASED' : 'AT_VENDOR'
    try {
      const res = await fetch(`${BASE_URL}/pp/wo?ctrlKey=PP02&status=${status}`, { headers:authHdrs2() })
      const d = await res.json()
      setLinkedWOs(d.data||[])
    } catch { setLinkedWOs([]) }
  },[])

  useEffect(()=>{
    fetch(`${BASE_URL}/wm/stock`, { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setItems(d.data||[])).catch(()=>{})
    fetch(`${BASE_URL}/vendors`, { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setVendors(d.data||[])).catch(()=>{})
  },[])

  useEffect(()=>{ loadWOs(mode) },[mode, loadWOs])

  const onWOChange = e => {
    const id = e.target.value
    setSelectedWO(id)
    if (!id) return
    const wo = linkedWOs.find(w=>String(w.id)===id)
    if (!wo) return
    setForm(f=>({ ...f,
      itemCode: wo.itemCode||'', itemName: wo.itemName||'',
      qty: String(wo.plannedQty),
      uom: wo.uom||f.uom,
    }))
  }

  const onItemChange = e => {
    const val  = e.target.value
    const item = items.find(i=>(i.itemCode||i.itemName)===val)
    setForm(f=>({ ...f,
      itemCode: item?.itemCode||val, itemName: item?.itemName||val,
      uom: item?.uom||f.uom,
    }))
  }

  const onVendorChange = e => {
    const code = e.target.value
    const v = vendors.find(v=>v.code===code)
    setForm(f=>({ ...f, vendorCode:code, vendorName: v?.name||'' }))
  }

  const reset = () => { setForm(EMPTY_FORM); setSelectedWO('') }

  const post = async () => {
    if (!form.itemCode && !form.itemName) return toast.error('Select item!')
    if (!form.qty || parseFloat(form.qty)<=0) return toast.error('Enter a valid quantity!')
    if (!form.vendorName) return toast.error('Select vendor!')
    setSaving(true)
    try {
      const endpoint = mode==='out' ? 'subcontract-out' : 'subcontract-return'
      const body = mode==='out'
        ? { itemCode:form.itemCode, itemName:form.itemName, qty:form.qty, uom:form.uom,
            vendorCode:form.vendorCode, vendorName:form.vendorName,
            fromLocation:form.fromLocation, poNo:form.poNo||undefined, remarks:form.remarks||undefined,
            woId:selectedWO||undefined }
        : { itemCode:form.itemCode, itemName:form.itemName, qty:form.qty, uom:form.uom,
            vendorCode:form.vendorCode, vendorName:form.vendorName,
            toLocation:form.toLocation, remarks:form.remarks||undefined,
            woId:selectedWO||undefined }
      const res  = await fetch(`${BASE_URL}/wm/${endpoint}`,
        { method:'POST', headers:authHdrs(), body:JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      reset()
      loadWOs(mode)
      nav('/wm/subcontract')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Subcontracting <small>Material Out / Processed Return</small></div>
        <div className="wm-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/subcontract')}>✕ Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={post}>
            {saving?'⏳ Posting...':mode==='out'?'Post Subcontract Out':'Post Return'}
          </button>
        </div>
      </div>

      <div className="wm-form-sec" style={{marginBottom:'14px'}}>
        <div className="wm-form-sec-body" style={{display:'flex',gap:'10px',padding:'14px'}}>
          <button
            className={mode==='out'?'btn btn-p sd-bsm':'btn btn-s sd-bsm'}
            onClick={()=>{setMode('out');reset()}}>
            📤 Send Out to Vendor
          </button>
          <button
            className={mode==='return'?'btn btn-p sd-bsm':'btn btn-s sd-bsm'}
            onClick={()=>{setMode('return');reset()}}>
            📥 Unprocessed Return
          </button>
        </div>
      </div>

      <div className="wm-form-sec" style={{marginBottom:'14px'}}>
        <div className="wm-form-sec-hdr">Link to Work Order (optional)</div>
        <div className="wm-form-sec-body">
          <div className="wm-form-grp">
            <label>{mode==='out' ? 'Pending External WO (ctrlKey PP02, ready to release)' : 'WO currently AT_VENDOR'}</label>
            <select className="wm-form-ctrl" value={selectedWO} onChange={onWOChange}>
              <option value="">-- Standalone (no WO link) --</option>
              {linkedWOs.map(w=>(
                <option key={w.id} value={w.id}>{w.woNo} — {w.itemName} · Qty {Number(w.plannedQty).toFixed(2)} {w.uom}</option>
              ))}
            </select>
            {linkedWOs.length===0 && (
              <small style={{color:'#6C757D'}}>
                {mode==='out' ? 'No external WOs currently RELEASED and ready to send out.' : 'No WOs currently AT_VENDOR.'}
              </small>
            )}
          </div>
        </div>
      </div>

      <div className="wm-form-sec">
        <div className="wm-form-sec-hdr">
          {mode==='out' ? 'Our material going OUT for outside processing' : 'Vendor returning material UNPROCESSED (no charge)'}
        </div>
        <div className="wm-form-sec-body">
          <div className="wm-form-row2">
            <div className="wm-form-grp"><label>Material <span>*</span></label>
              <select className="wm-form-ctrl" value={form.itemCode} onChange={onItemChange} disabled={!!selectedWO}>
                <option value="">-- Select Item --</option>
                {items.map(i=>(
                  <option key={i.itemCode||i.itemName} value={i.itemCode||i.itemName}>
                    {i.itemCode ? `${i.itemCode} — ` : ''}{i.itemName}
                  </option>
                ))}
              </select>
            </div>
            <div className="wm-form-grp"><label>Vendor <span>*</span></label>
              <select className="wm-form-ctrl" value={form.vendorCode} onChange={onVendorChange}>
                <option value="">-- Select Vendor --</option>
                {vendors.map(v=>(
                  <option key={v.code} value={v.code}>{v.code} — {v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="wm-form-row4">
            <div className="wm-form-grp"><label>Quantity <span>*</span></label>
              <input type="number" className="wm-form-ctrl" placeholder="Enter qty"
                value={form.qty} readOnly={!!selectedWO}
                onChange={e=>setForm(f=>({...f,qty:e.target.value}))}/>
            </div>
            <div className="wm-form-grp"><label>UOM</label>
              <input className="wm-form-ctrl" placeholder="Nos / Kg / etc."
                value={form.uom}
                onChange={e=>setForm(f=>({...f,uom:e.target.value}))}/>
            </div>
            {mode==='out' ? (
              <>
                <div className="wm-form-grp"><label>From Location</label>
                  <select className="wm-form-ctrl" value={form.fromLocation}
                    onChange={e=>setForm(f=>({...f,fromLocation:e.target.value}))}>
                    <option value="RM-STORE">RM Store</option>
                    <option value="SHOP-FLOOR">Shop Floor</option>
                    <option value="FG-STORE">FG Store</option>
                  </select>
                </div>
                <div className="wm-form-grp"><label>Subcontract PO No.</label>
                  <input className="wm-form-ctrl" placeholder="Optional — SCPO-2026-001"
                    value={form.poNo}
                    onChange={e=>setForm(f=>({...f,poNo:e.target.value}))}/>
                </div>
              </>
            ) : (
              <div className="wm-form-grp"><label>Return To Location</label>
                <select className="wm-form-ctrl" value={form.toLocation}
                  onChange={e=>setForm(f=>({...f,toLocation:e.target.value}))}>
                  <option value="RM-STORE">RM Store</option>
                  <option value="SHOP-FLOOR">Shop Floor</option>
                  <option value="FG-STORE">FG Store</option>
                </select>
              </div>
            )}
          </div>

          <div className="wm-form-row">
            <div className="wm-form-grp" style={{flex:1}}><label>Remarks</label>
              <input className="wm-form-ctrl" placeholder="Optional notes..."
                value={form.remarks}
                onChange={e=>setForm(f=>({...f,remarks:e.target.value}))}/>
            </div>
          </div>

          {mode==='out' && (
            <div className="pp-alert" style={{marginTop:'10px',background:'#D1ECF1',borderColor:'#BEE5EB',color:'#0C5460'}}>
              This material stays <strong>ours</strong> (ownership doesn't transfer) — it's just physically at the vendor's premises now.
              {selectedWO
                ? ' This WO moves to AT_VENDOR — it drops out of the release queue until the processed goods come back and the WO is completed.'
                : ' To bring processed goods back, receive against the Subcontract PO via GRN → Goods Receipt, not this screen. Use Unprocessed Return here only if the vendor sends it back without processing.'}
            </div>
          )}
        </div>
      </div>

      <div className="wm-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/subcontract')}>✕ Cancel</button>
        <button className="btn btn-p sd-bsm" disabled={saving} onClick={post}>
          {saving?'⏳ Posting...':mode==='out'?'Post Subcontract Out':'Post Return'}
        </button>
      </div>
    </div>
  )
}
