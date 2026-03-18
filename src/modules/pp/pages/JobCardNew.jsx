import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PP_CUSTOMERS, ITEMS, INDUSTRIES, PRODUCTION_TYPES, JOB_CARDS, MOULDS, calcShotOutput } from './_ppConfig'

export default function JobCardNew() {
  const nav = useNavigate()
  const [form, setForm] = useState({
    customerId:'', dcNo:'', date: new Date().toISOString().slice(0,10),
    itemId:'', qty:'', priority:'Normal', remarks:''
  })
  const [submitted, setSubmitted] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const customer = PP_CUSTOMERS.find(c => c.id === form.customerId)
  const item     = ITEMS.find(i => i.id === form.itemId)
  const ind      = item ? INDUSTRIES[item.industry] : null
  const pt       = item ? PRODUCTION_TYPES[item.prodType] : null
  const mould    = item?.mouldId ? MOULDS.find(m => m.id === item.mouldId) : null
  const shotInfo = item?.prodType === 'mould' && item?.cavity && form.qty
    ? calcShotOutput(parseInt(form.qty), item.cavity) : null

  const openBatches  = item ? JOB_CARDS.filter(j => j.itemId === item.id && j.status !== 'Done') : []
  const batchSuggest = item?.prodType === 'batch' && openBatches.length > 0
  const routeStages  = ind?.stages || []

  const handleSubmit = () => {
    if (!form.customerId || !form.itemId || !form.qty) { alert('Customer, Item and Qty required'); return }
    setSubmitted(true)
    setTimeout(() => nav('/pp/job-cards'), 1200)
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New Job Card <small>Route loaded from item — not customer</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/job-cards')}>← Back</button>
        </div>
      </div>

      {submitted && (
        <div style={{ padding:'12px 16px',background:'#E8F5E9',borderRadius:'8px',marginBottom:'14px',fontWeight:'700',color:'#2E7D32' }}>
          ✅ Job Card created! Redirecting…
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>

        {/* LEFT */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>📋 Job Header</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field">
                <label>Customer *</label>
                <select value={form.customerId} onChange={e => set('customerId', e.target.value)}>
                  <option value="">Select Customer</option>
                  {PP_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="sd-field">
                <label>DC / Challan No.</label>
                <input value={form.dcNo} onChange={e => set('dcNo', e.target.value)} placeholder="e.g. KAC/DC/2025/113" />
              </div>
              <div className="sd-field">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div className="sd-field">
                <label>Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                  {['Normal','High','Urgent'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            {customer && (
              <div style={{ marginTop:'8px',padding:'8px 12px',background:'#F3F0FF',borderRadius:'6px',fontSize:'12px' }}>
                👤 <strong>{customer.name}</strong> · {customer.entity} · 📞 {customer.phone} · Charge: <strong>{customer.chargeBy}</strong>
              </div>
            )}
            <div className="sd-field" style={{ marginTop:'10px' }}>
              <label>Remarks</label>
              <textarea rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Special instructions…" style={{resize:'vertical'}} />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>📦 Item & Quantity</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field" style={{ gridColumn:'1/-1' }}>
                <label>Item * <span style={{fontSize:'10px',color:'var(--odoo-gray)',fontWeight:'400'}}>— routing auto-loads from item</span></label>
                <select value={form.itemId} onChange={e => set('itemId', e.target.value)}>
                  <option value="">Select Item</option>
                  {ITEMS.map(i => {
                    const iind = INDUSTRIES[i.industry]
                    return <option key={i.id} value={i.id}>{iind?.icon} {i.name} ({i.code})</option>
                  })}
                </select>
              </div>
              <div className="sd-field">
                <label>Quantity *</label>
                <input type="number" value={form.qty} onChange={e => set('qty', e.target.value)} placeholder="e.g. 500" />
              </div>
              {item && <div className="sd-field"><label>UOM</label><input value={item.uom} disabled /></div>}
            </div>

            {item && (
              <div style={{ marginTop:'8px',padding:'10px 12px',background:ind?.light,borderRadius:'8px',borderLeft:`3px solid ${ind?.color}` }}>
                <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                  <span style={{ fontSize:'20px' }}>{ind?.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:'800',fontSize:'13px' }}>{item.name}</div>
                    <div style={{ fontSize:'10px',color:'var(--odoo-gray)',fontFamily:'DM Mono,monospace' }}>{item.code}</div>
                    <div style={{ display:'flex',gap:'6px',marginTop:'3px' }}>
                      <span style={{ padding:'2px 6px',background:ind?.color,color:'#fff',borderRadius:'4px',fontSize:'10px',fontWeight:'700' }}>{ind?.name}</span>
                      <span style={{ padding:'2px 6px',background:'var(--odoo-purple)',color:'#fff',borderRadius:'4px',fontSize:'10px',fontWeight:'700' }}>{pt?.icon} {pt?.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shot calc */}
            {shotInfo && (
              <div style={{ marginTop:'10px',padding:'12px',background:'#FFF3CD',borderRadius:'8px',border:'1px solid #FFE082' }}>
                <div style={{ fontWeight:'800',fontSize:'12px',color:'#E65100',marginBottom:'8px' }}>💉 Shot Calculator</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px' }}>
                  {[['Shots Needed',shotInfo.shots,'#E65100'],['Cavity',shotInfo.cavity,'#1A5276'],['Total Output',shotInfo.output,'var(--odoo-green)']].map(([l,v,c])=>(
                    <div key={l} style={{ textAlign:'center',padding:'6px',background:'#fff',borderRadius:'6px' }}>
                      <div style={{ fontWeight:'800',fontSize:'18px',color:c }}>{v}</div>
                      <div style={{ fontSize:'9px',color:'var(--odoo-gray)' }}>{l}</div>
                    </div>
                  ))}
                </div>
                {mould && <div style={{ marginTop:'6px',fontSize:'10px',color:'var(--odoo-gray)' }}>
                  {mould.name} · Life: <span style={{color:mould.shots/mould.maxShots>0.8?'var(--odoo-red)':'var(--odoo-green)',fontWeight:'700'}}>{((mould.shots/mould.maxShots)*100).toFixed(0)}% used</span>
                </div>}
              </div>
            )}

            {/* Batch suggest */}
            {batchSuggest && (
              <div style={{ marginTop:'10px',padding:'10px 12px',background:'#E3F2FD',borderRadius:'8px',border:'1px solid #90CAF9' }}>
                <div style={{ fontWeight:'800',fontSize:'12px',color:'#1565C0',marginBottom:'4px' }}>🪣 Batch Clubbing Possible</div>
                <div style={{ fontSize:'11px',color:'#1565C0',marginBottom:'6px' }}>{openBatches.length} open job(s) with same item — club to optimise batch capacity.</div>
                <div style={{ display:'flex',gap:'4px',flexWrap:'wrap' }}>
                  {openBatches.map(j=>(
                    <span key={j.id} style={{ padding:'2px 7px',background:'#BBDEFB',borderRadius:'4px',fontSize:'10px',fontWeight:'700',color:'#1565C0' }}>{j.id}: {j.qty} {j.unit}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Route preview */}
      {item && routeStages.length > 0 && (
        <div className="fi-panel" style={{ marginTop:'14px' }}>
          <div className="fi-panel-hdr">
            <h3>🗺️ Production Route — Loaded from Item ✅</h3>
            <span style={{ fontSize:'11px',color:'var(--odoo-gray)',fontWeight:'400' }}>Routing is item-specific · {routeStages.length} stages</span>
          </div>
          <div className="fi-panel-body">
            <div style={{ display:'flex',gap:'0',alignItems:'center',flexWrap:'wrap',marginBottom:'12px' }}>
              {routeStages.map((s,i)=>(
                <React.Fragment key={s.id}>
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'3px' }}>
                    <div style={{ width:'34px',height:'34px',borderRadius:'50%',background:'var(--odoo-purple)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px' }}>{s.icon}</div>
                    <div style={{ fontSize:'9px',fontWeight:'700',color:'var(--odoo-purple)',textAlign:'center',maxWidth:'56px',lineHeight:'1.2' }}>{s.name}</div>
                    <div style={{ fontSize:'9px',color:'var(--odoo-gray)',textAlign:'center',maxWidth:'56px' }}>{s.machine}</div>
                  </div>
                  {i<routeStages.length-1&&<div style={{ width:'20px',height:'2px',background:'var(--odoo-purple)',marginBottom:'18px',opacity:.35 }} />}
                </React.Fragment>
              ))}
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'6px' }}>
              {routeStages.map((s,i)=>(
                <div key={s.id} style={{ padding:'7px 10px',background:'#F8F9FA',borderRadius:'6px',border:'1px solid var(--odoo-border)' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:'5px',marginBottom:'3px' }}>
                    <span style={{ fontSize:'13px' }}>{s.icon}</span>
                    <strong style={{ fontSize:'10px',color:'var(--odoo-purple)' }}>{i+1}. {s.name}</strong>
                  </div>
                  <div style={{ display:'flex',gap:'2px',flexWrap:'wrap' }}>
                    {(s.fields||[]).map((f,fi)=>(
                      <span key={fi} style={{ padding:'1px 4px',background:'#EDE0EA',borderRadius:'3px',fontSize:'9px',color:'var(--odoo-purple)',fontWeight:'600' }}>{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex',gap:'10px',marginTop:'16px',justifyContent:'flex-end' }}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/job-cards')}>Cancel</button>
        <button className="btn btn-p" onClick={handleSubmit} disabled={submitted}>
          {submitted ? '✓ Creating…' : '✓ Create Job Card'}
        </button>
      </div>
    </div>
  )
}
