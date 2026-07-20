import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { mmApi } from '../services/mmApi'

const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})

const EMPTY_FORM = {
  vendorCode:'', vendorName:'', processCode:'', processName:'',
  pricingBasis:'PIECE', rate:'', minCharge:'', hsnCode:'9988', gstRate:'18', notes:'',
}

export default function VendorRateCardMaster() {
  const [cards,   setCards]   = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rc, vd] = await Promise.all([mmApi.getVendorRateCards(), mmApi.getVendors()])
      setCards(rc.data||[]); setVendors(vd.data||[])
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[])
  useEffect(()=>{ load() },[load])

  const onVendorChange = e => {
    const code = e.target.value
    const v = vendors.find(v=>v.vendorCode===code)
    set('vendorCode', code); set('vendorName', v?.vendorName||'')
  }

  const reset = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(false) }

  const save = async () => {
    if (!form.vendorName)  return toast.error('Select vendor')
    if (!form.processName) return toast.error('Enter process name')
    if (!form.rate || parseFloat(form.rate)<=0) return toast.error('Enter a valid rate')
    try {
      if (editId) {
        await mmApi.updateVendorRateCard(editId, form)
        toast.success('Rate card updated')
      } else {
        await mmApi.createVendorRateCard(form)
        toast.success('Rate card added')
      }
      reset(); load()
    } catch(e){ toast.error(e.message) }
  }

  const edit = c => {
    setForm({ vendorCode:c.vendorCode||'', vendorName:c.vendorName||'',
      processCode:c.processCode||'', processName:c.processName||'',
      pricingBasis:c.pricingBasis||'PIECE', rate:c.rate, minCharge:c.minCharge,
      hsnCode:c.hsnCode||'9988', gstRate:c.gstRate||'18', notes:c.notes||'' })
    setEditId(c.id); setShowForm(true)
  }

  const toggleActive = async c => {
    try {
      await mmApi.updateVendorRateCard(c.id, { isActive: !c.isActive })
      toast.success(c.isActive?'Deactivated':'Activated')
      load()
    } catch(e){ toast.error(e.message) }
  }

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          Vendor Rate Card <small>Subcontract / External Process Rates (used by Cost &amp; Pricing)</small>
        </div>
        <div className="lv-acts">
          <button className="btn btn-p sd-bsm" onClick={()=>{reset();setShowForm(true)}}>+ Add Rate Card</button>
        </div>
      </div>

      <div className="pp-alert" style={{marginBottom:14,background:'#D1ECF1',borderColor:'#BEE5EB',color:'#0C5460'}}>
        Rates entered here feed the Cost &amp; Pricing engine for any Routing Operation flagged <strong>External (PP02)</strong> — matched by process name. Without a matching active rate card, that operation contributes ₹0 to the item's standard cost.
      </div>

      {showForm && (
        <div className="wm-form-sec" style={{ marginBottom:16 }}>
          <div className="wm-form-sec-hdr">{editId?'Edit':'New'} Vendor Rate Card</div>
          <div className="wm-form-sec-body">
            <div className="wm-form-row2">
              <div className="wm-form-grp"><label>Vendor <span>*</span></label>
                <select className="wm-form-ctrl" value={form.vendorCode} onChange={onVendorChange}>
                  <option value="">-- Select Vendor --</option>
                  {vendors.map(v=>(
                    <option key={v.vendorCode} value={v.vendorCode}>{v.vendorCode} — {v.vendorName}</option>
                  ))}
                </select>
              </div>
              <div className="wm-form-grp"><label>Process Name <span>*</span></label>
                <input className="wm-form-ctrl" placeholder="e.g. Degating, Powder Coating..."
                  value={form.processName} onChange={e=>set('processName',e.target.value)}/>
                <small style={{color:'#6C757D'}}>Must match the Routing Operation's process name exactly (case-insensitive)</small>
              </div>
            </div>
            <div className="wm-form-row4">
              <div className="wm-form-grp"><label>Pricing Basis</label>
                <select className="wm-form-ctrl" value={form.pricingBasis} onChange={e=>set('pricingBasis',e.target.value)}>
                  <option value="PIECE">Per Piece</option>
                  <option value="KG">Per Kg</option>
                  <option value="HOUR">Per Hour</option>
                  <option value="LOT">Per Lot</option>
                </select>
              </div>
              <div className="wm-form-grp"><label>Rate (₹) <span>*</span></label>
                <input type="number" className="wm-form-ctrl" placeholder="0.00"
                  value={form.rate} onChange={e=>set('rate',e.target.value)}/>
              </div>
              <div className="wm-form-grp"><label>Min Charge (₹)</label>
                <input type="number" className="wm-form-ctrl" placeholder="0.00"
                  value={form.minCharge} onChange={e=>set('minCharge',e.target.value)}/>
              </div>
              <div className="wm-form-grp"><label>GST Rate (%)</label>
                <input type="number" className="wm-form-ctrl" value={form.gstRate}
                  onChange={e=>set('gstRate',e.target.value)}/>
              </div>
            </div>
            <div className="wm-form-row2">
              <div className="wm-form-grp"><label>HSN Code</label>
                <input className="wm-form-ctrl" value={form.hsnCode} onChange={e=>set('hsnCode',e.target.value)}/>
              </div>
              <div className="wm-form-grp"><label>Notes</label>
                <input className="wm-form-ctrl" value={form.notes} onChange={e=>set('notes',e.target.value)}/>
              </div>
            </div>
          </div>
          <div className="wm-form-acts">
            <button className="btn btn-s sd-bsm" onClick={reset}>Cancel</button>
            <button className="btn btn-p sd-bsm" onClick={save}>{editId?'Update':'Save'}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
      ) : cards.length===0 ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          No rate cards yet — external routing operations will cost ₹0 until one's added.
        </div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead style={{ background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Vendor','Process','Basis','Rate','Min Charge','GST','Status',''].map(h=>(
                  <th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cards.map((c,i)=>(
                <tr key={c.id} style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FDFBFD' }}>
                  <td style={{ padding:'8px 10px', fontWeight:600 }}>{c.vendorName}</td>
                  <td style={{ padding:'8px 10px' }}>{c.processName}</td>
                  <td style={{ padding:'8px 10px' }}>{c.pricingBasis}</td>
                  <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace' }}>{fmtC(c.rate)}</td>
                  <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace' }}>{fmtC(c.minCharge)}</td>
                  <td style={{ padding:'8px 10px' }}>{c.gstRate}%</td>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{ padding:'3px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                      background:c.isActive?'#D4EDDA':'#E9ECEF', color:c.isActive?'#155724':'#6C757D',
                      cursor:'pointer' }} onClick={()=>toggleActive(c)}>
                      {c.isActive?'Active':'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding:'8px 10px' }}>
                    <button className="btn btn-s sd-bsm" style={{padding:'3px 8px',fontSize:11}} onClick={()=>edit(c)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
