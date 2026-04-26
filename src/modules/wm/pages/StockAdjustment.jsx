import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

export default function StockAdjustment() {
  const nav = useNavigate()
  const [items,  setItems]  = useState([])
  const [saving, setSaving] = useState(false)
  const [adjNo,  setAdjNo]  = useState('Auto-generated')
  const [form, setForm] = useState({
    itemCode:'', currentStock:0, adjQty:'',
    adjType:'Negative', reason:'Physical Count Variance',
    remarks:'', date: new Date().toISOString().split('T')[0]
  })

  useEffect(()=>{
    fetch(`${BASE_URL}/wm/stock`, { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setItems(d.data||[])).catch(()=>{})
  },[])

  const onItemChange = e => {
    const item = items.find(i=>i.itemCode===e.target.value)
    setForm(f=>({ ...f,
      itemCode: e.target.value,
      currentStock: parseFloat(item?.balanceQty||0)
    }))
  }

  const newStock = form.adjType==='Positive'
    ? form.currentStock + parseFloat(form.adjQty||0)
    : form.currentStock - parseFloat(form.adjQty||0)

  const post = async () => {
    if (!form.itemCode) return toast.error('Select item!')
    if (!form.adjQty)   return toast.error('Enter adjustment qty!')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/wm/adjustment`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      nav('/wm/movement')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Stock Adjustment <small>Manual Correction Entry</small></div>
        <div className="wm-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}> Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={post}>{saving?'⏳ Posting...':'Post Adjustment'}</button>
        </div>
      </div>

      <div className="wm-form-sec">
        <div className="wm-form-sec-hdr"> Adjustment Entry</div>
        <div className="wm-form-sec-body">
          <div className="wm-form-row">
            <div className="wm-form-grp"><label>Adjustment No.</label><input className="wm-form-ctrl" value={adjNo} readOnly/></div>
            <div className="wm-form-grp"><label>Date</label><input type="date" className="wm-form-ctrl" defaultValue="2025-02-28"/></div>
            <div className="wm-form-grp"><label>Reason</label>
              <select className="wm-form-ctrl">
                <option>Physical Count Variance</option>
                <option>Damage / Write-off</option>
                <option>Production Loss</option>
                <option>Sample / Testing</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="wm-form-row2">
            <div className="wm-form-grp"><label>Material <span>*</span></label>
              <select className="wm-form-ctrl">
                {items.map(i=>(
                <option key={i.itemCode} value={i.itemCode}>
                  {i.itemCode} — {i.itemName}
                </option>
              ))}
              </select>
            </div>
            <div className="wm-form-grp"><label>Remarks</label>
              <input className="wm-form-ctrl" placeholder="Reason for adjustment..."/>
            </div>
          </div>
          <div className="wm-form-row4">
            <div className="wm-form-grp"><label>Current Stock</label><input className="wm-form-ctrl" value={`${form.currentStock} ${items.find(i=>i.itemCode===form.itemCode)?.uom||''}`} readOnly/></div>
            <div className="wm-form-grp"><label>Adjustment Qty <span>*</span></label><input type="number" className="wm-form-ctrl" placeholder="-5 or +10"/></div>
            <div className="wm-form-grp"><label>New Stock (after)</label><input className="wm-form-ctrl" value={`${isNaN(newStock)?'—':newStock.toFixed(2)} ${items.find(i=>i.itemCode===form.itemCode)?.uom||''}`} readOnly/></div>
            <div className="wm-form-grp"><label>Adjustment Type</label>
              <select className="wm-form-ctrl">
                <option> Negative (Reduce)</option>
                <option>Positive (Increase)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="wm-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}> Cancel</button>
        <button className="btn btn-p sd-bsm" disabled={saving} onClick={post}>{saving?'⏳ Posting...':'Post Adjustment'}</button>
      </div>
    </div>
  )
}
