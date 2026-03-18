import React, { useState } from 'react'
import { RATE_CARDS, PP_CUSTOMERS, DEMO_COMPANY_CONFIG, CHARGE_BASES } from './_ppConfig'

export default function RateCardMaster() {
  const [cards,    setCards]    = useState(RATE_CARDS)
  const [custFilter, setCustFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [form,     setForm]     = useState({customerId:'',process:'',rate:'',unit:'Per Piece',effectiveFrom:'2025-01-01',status:'Active'})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const processes = DEMO_COMPANY_CONFIG.processes

  const filtered = custFilter==='All' ? cards : cards.filter(c=>c.customerId===custFilter)
  const grouped  = PP_CUSTOMERS.reduce((acc,c)=>{acc[c.id]=filtered.filter(r=>r.customerId===c.id);return acc},{})

  const handleSave = () => {
    if(!form.customerId||!form.process||!form.rate){alert('Fill all required fields');return}
    const cust = PP_CUSTOMERS.find(c=>c.id===form.customerId)
    if(editId){
      setCards(cs=>cs.map(c=>c.id===editId?{...c,...form,customerName:cust?.name||''}:c))
      setEditId(null)
    } else {
      const id=`RC-${String(cards.length+1).padStart(3,'0')}`
      setCards(cs=>[...cs,{id,...form,customerName:cust?.name||''}])
    }
    setForm({customerId:'',process:'',rate:'',unit:'Per Piece',effectiveFrom:'2025-01-01',status:'Active'})
    setShowForm(false)
  }

  const handleEdit = r => {
    setForm({customerId:r.customerId,process:r.process,rate:r.rate,unit:r.unit,effectiveFrom:r.effectiveFrom,status:r.status})
    setEditId(r.id); setShowForm(true)
  }

  // Add bulk rates for a customer
  const addBulkForCustomer = custId => {
    const cust = PP_CUSTOMERS.find(c=>c.id===custId)
    if(!cust) return
    const existing = cards.filter(c=>c.customerId===custId).map(c=>c.process)
    const missing  = cust.processes.filter(p=>!existing.includes(p))
    if(missing.length===0){alert('All processes already have rate cards!');return}
    const newCards = missing.map((p,i)=>({
      id:`RC-${String(cards.length+i+1).padStart(3,'0')}`,
      customerId:custId,customerName:cust.name,
      process:p,rate:5,unit:cust.chargeBy,effectiveFrom:'2025-01-01',status:'Active'
    }))
    setCards(c=>[...c,...newCards])
    alert(`Added ${newCards.length} rate cards for ${cust.name}. Please update the rates.`)
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Rate Card Master <small>Per customer · Per process · Per unit</small></div>
        <div className="fi-lv-actions">
          <select className="sd-select" value={custFilter} onChange={e=>setCustFilter(e.target.value)}>
            <option value="All">All Customers</option>
            {PP_CUSTOMERS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-p btn-s" onClick={()=>{setEditId(null);setShowForm(true)}}>+ Add Rate</button>
        </div>
      </div>

      {/* Rate pricing tip */}
      <div style={{marginBottom:'14px',padding:'10px 14px',background:'#FFF3CD',borderRadius:'8px',fontSize:'12px',color:'#856404'}}>
        💡 <strong>Rate hierarchy:</strong> Customer-specific rate → Process default rate → System default. Customer rate always takes priority for billing!
      </div>

      {/* Add/Edit Form */}
      {showForm&&(
        <div className="fi-panel" style={{marginBottom:'14px',border:'2px solid var(--odoo-purple)'}}>
          <div className="fi-panel-hdr"><h3>{editId?'✏️ Edit Rate':'➕ Add Rate Card'}</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field"><label>Customer *</label>
                <select value={form.customerId} onChange={e=>set('customerId',e.target.value)}>
                  <option value="">Select Customer</option>
                  {PP_CUSTOMERS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="sd-field"><label>Process *</label>
                <select value={form.process} onChange={e=>set('process',e.target.value)}>
                  <option value="">Select Process</option>
                  {processes.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="sd-field"><label>Rate (₹) *</label><input type="number" value={form.rate} onChange={e=>set('rate',e.target.value)} placeholder="0.00" step="0.01" /></div>
              <div className="sd-field"><label>Unit</label>
                <select value={form.unit} onChange={e=>set('unit',e.target.value)}>
                  {CHARGE_BASES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="sd-field"><label>Effective From</label><input type="date" value={form.effectiveFrom} onChange={e=>set('effectiveFrom',e.target.value)} /></div>
              <div className="sd-field"><label>Status</label>
                <select value={form.status} onChange={e=>set('status',e.target.value)}>
                  <option>Active</option><option>Inactive</option><option>Expired</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
              <button className="btn btn-p btn-s" onClick={handleSave}>✓ Save Rate</button>
              <button className="btn btn-s sd-bsm" onClick={()=>{setShowForm(false);setEditId(null)}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Customer-grouped rate cards */}
      {PP_CUSTOMERS.filter(c=>custFilter==='All'||c.id===custFilter).map(cust=>{
        const custCards = cards.filter(r=>r.customerId===cust.id)
        const custProcs  = cust.processes
        const missingRates = custProcs.filter(p=>!custCards.find(r=>r.process===p))
        const totalPerJob = custCards.filter(r=>r.status==='Active').reduce((s,r)=>s+parseFloat(r.rate||0),0)

        return (
          <div key={cust.id} className="fi-panel" style={{marginBottom:'12px'}}>
            <div className="fi-panel-hdr">
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'var(--odoo-purple)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700'}}>
                  {cust.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
                </div>
                <div>
                  <div style={{fontWeight:'700',fontSize:'13px'}}>{cust.name}</div>
                  <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{cust.entity} · {custCards.length}/{custProcs.length} processes rated · Charge: {cust.chargeBy}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                {totalPerJob>0&&(
                  <div style={{textAlign:'right',marginRight:'8px'}}>
                    <div style={{fontFamily:'DM Mono,monospace',fontWeight:'800',fontSize:'14px',color:'var(--odoo-purple)'}}>₹{totalPerJob.toFixed(2)}</div>
                    <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>total {cust.chargeBy.toLowerCase()}</div>
                  </div>
                )}
                {missingRates.length>0&&<button className="btn btn-s sd-bsm" onClick={()=>addBulkForCustomer(cust.id)}>+ Fill Missing ({missingRates.length})</button>}
                <button className="btn btn-s sd-bsm" onClick={()=>{set('customerId',cust.id);setShowForm(true)}}>+ Add Rate</button>
              </div>
            </div>
            <div className="fi-panel-body" style={{padding:'0'}}>
              {/* Process rate list */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1px',background:'var(--odoo-border)'}}>
                {custProcs.map(p=>{
                  const rc = custCards.find(r=>r.process===p&&r.status==='Active')
                  return (
                    <div key={p} style={{background:rc?'#fff':'#FFF8F0',padding:'10px 14px'}}>
                      <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',marginBottom:'4px',textTransform:'uppercase'}}>{p}</div>
                      {rc
                        ? <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontFamily:'DM Mono,monospace',fontWeight:'800',fontSize:'16px',color:'var(--odoo-purple)'}}>₹{parseFloat(rc.rate).toFixed(2)}</span>
                            <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                              <span style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{rc.unit}</span>
                              <button className="btn-act-edit" style={{padding:'2px 6px',fontSize:'10px'}} onClick={()=>handleEdit(rc)}>✏️</button>
                            </div>
                          </div>
                        : <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:'11px',color:'var(--odoo-orange)',fontWeight:'600'}}>⚠️ No rate set</span>
                            <button className="btn-act-edit" style={{padding:'2px 8px',fontSize:'10px'}} onClick={()=>{set('customerId',cust.id);set('process',p);setShowForm(true)}}>Add</button>
                          </div>
                      }
                    </div>
                  )
                })}
              </div>
              {missingRates.length>0&&(
                <div style={{padding:'8px 14px',background:'#FFF3CD',fontSize:'11px',color:'#856404'}}>
                  ⚠️ Missing rates for: <strong>{missingRates.join(', ')}</strong> — Job invoices may be incorrect!
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
