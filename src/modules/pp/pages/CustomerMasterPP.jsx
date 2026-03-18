import React, { useState } from 'react'
import { PP_CUSTOMERS, DEMO_COMPANY_CONFIG, ENTITY_TYPES } from './_ppConfig'

export default function CustomerMasterPP() {
  const [customers, setCustomers] = useState(PP_CUSTOMERS)
  const [showForm,  setShowForm]  = useState(false)
  const [editId,    setEditId]    = useState(null)
  const [search,    setSearch]    = useState('')
  const [form, setForm] = useState({name:'',entity:'',processes:[],chargeBy:'Per Piece',contact:'',phone:'',email:'',gst:'',city:'',state:''})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const ALL_PROCESSES = DEMO_COMPANY_CONFIG.processes

  const toggleProc = p => setForm(f=>({...f,processes:f.processes.includes(p)?f.processes.filter(x=>x!==p):[...f.processes,p]}))

  const handleSave = () => {
    if(!form.name||!form.entity||form.processes.length===0){alert('Fill required fields and select at least one process');return}
    if(editId){
      setCustomers(cs=>cs.map(c=>c.id===editId?{...c,...form}:c))
      setEditId(null)
    } else {
      setCustomers(cs=>[...cs,{id:`CUST-${String(cs.length+1).padStart(3,'0')}`,...form}])
    }
    setForm({name:'',entity:'',processes:[],chargeBy:'Per Piece',contact:'',phone:'',email:'',gst:'',city:'',state:''})
    setShowForm(false)
  }

  const handleEdit = c => {
    setForm({name:c.name,entity:c.entity,processes:c.processes,chargeBy:c.chargeBy,contact:c.contact,phone:c.phone,email:c.email||'',gst:c.gst||'',city:c.city||'',state:c.state||''})
    setEditId(c.id); setShowForm(true)
  }

  const filtered = customers.filter(c=>!search||c.name.toLowerCase().includes(search.toLowerCase())||c.entity.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Customer Master <small>Entity-wise · Multi-process configuration</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" style={{width:'200px'}} placeholder="🔍 Search customer…" value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="btn btn-p btn-s" onClick={()=>{setEditId(null);setShowForm(true)}}>+ New Customer</button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm&&(
        <div className="fi-panel" style={{marginBottom:'16px',border:'2px solid var(--odoo-purple)'}}>
          <div className="fi-panel-hdr"><h3>{editId?'✏️ Edit Customer':'➕ New Customer'}</h3></div>
          <div className="fi-panel-body">
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'16px'}}>
              <div>
                <div className="sd-form-grid" style={{marginBottom:'12px'}}>
                  <div className="sd-field"><label>Customer Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Company name" /></div>
                  <div className="sd-field"><label>Entity Type *</label>
                    <select value={form.entity} onChange={e=>set('entity',e.target.value)}>
                      <option value="">Select Entity Type</option>
                      {ENTITY_TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="sd-field"><label>Contact Person</label><input value={form.contact} onChange={e=>set('contact',e.target.value)} placeholder="Name" /></div>
                  <div className="sd-field"><label>Phone</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="Mobile" /></div>
                  <div className="sd-field"><label>Email</label><input value={form.email} onChange={e=>set('email',e.target.value)} placeholder="email@company.com" /></div>
                  <div className="sd-field"><label>GST Number</label><input value={form.gst} onChange={e=>set('gst',e.target.value)} placeholder="GST No." /></div>
                  <div className="sd-field"><label>City</label><input value={form.city} onChange={e=>set('city',e.target.value)} /></div>
                  <div className="sd-field"><label>State</label><input value={form.state} onChange={e=>set('state',e.target.value)} /></div>
                </div>
              </div>
              {/* Right — Process Selection */}
              <div>
                <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'8px'}}>Processes Required *</div>
                <div style={{display:'flex',flexDirection:'column',gap:'5px',marginBottom:'12px'}}>
                  {ALL_PROCESSES.map((p,i)=>(
                    <label key={p} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 10px',borderRadius:'6px',cursor:'pointer',
                      background:form.processes.includes(p)?'#EDE0EA':'#F8F9FA',
                      border:'1px solid',borderColor:form.processes.includes(p)?'var(--odoo-purple)':'var(--odoo-border)'}}>
                      <input type="checkbox" checked={form.processes.includes(p)} onChange={()=>toggleProc(p)} style={{accentColor:'var(--odoo-purple)'}} />
                      <span style={{fontSize:'12px',fontWeight:'600',color:form.processes.includes(p)?'var(--odoo-purple)':'var(--odoo-text)'}}>{i+1}. {p}</span>
                    </label>
                  ))}
                </div>
                <div className="sd-field">
                  <label>Charge Basis</label>
                  <select value={form.chargeBy} onChange={e=>set('chargeBy',e.target.value)}>
                    {['Per Piece','Per Kg','Per Batch','Per Sqft','Per Meter'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
              <button className="btn btn-p btn-s" onClick={handleSave}>✓ {editId?'Update':'Save'} Customer</button>
              <button className="btn btn-s sd-bsm" onClick={()=>{setShowForm(false);setEditId(null)}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Cards */}
      <div style={{display:'grid',gap:'10px'}}>
        {filtered.map(c=>(
          <div key={c.id} className="fi-panel">
            <div style={{display:'flex',alignItems:'center',gap:'14px',padding:'12px 14px',flexWrap:'wrap'}}>
              {/* Avatar */}
              <div style={{width:'44px',height:'44px',borderRadius:'50%',background:'var(--odoo-purple)',
                display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'15px',fontWeight:'800',flexShrink:0}}>
                {c.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
              </div>
              {/* Info */}
              <div style={{flex:1}}>
                <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'2px'}}>{c.name}</div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>
                  🏭 {c.entity} · 👤 {c.contact} · 📞 {c.phone} · 💰 {c.chargeBy}
                </div>
              </div>
              {/* Process chips */}
              <div style={{display:'flex',flexWrap:'wrap',gap:'4px',maxWidth:'500px'}}>
                {c.processes.map((p,i)=>(
                  <div key={p} style={{display:'flex',alignItems:'center',gap:'3px'}}>
                    <span style={{padding:'2px 8px',borderRadius:'10px',fontSize:'10px',fontWeight:'700',
                      background:'var(--odoo-purple)',color:'#fff'}}>{i+1}. {p}</span>
                    {i<c.processes.length-1&&<span style={{fontSize:'12px',color:'var(--odoo-gray)'}}>→</span>}
                  </div>
                ))}
              </div>
              {/* Actions */}
              <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                <button className="btn-act-edit" onClick={()=>handleEdit(c)}>✏️ Edit</button>
                <button className="btn-act-view" onClick={()=>{}}>💰 Rate Card</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length===0&&<div style={{textAlign:'center',padding:'40px',color:'var(--odoo-gray)'}}>No customers found</div>}
      </div>

      {/* Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginTop:'14px'}}>
        {[
          {l:'Total Customers',v:customers.length,c:'var(--odoo-purple)',i:'👥'},
          {l:'Entity Types',v:[...new Set(customers.map(c=>c.entity))].length,c:'var(--odoo-blue)',i:'🏭'},
          {l:'Avg Processes/Customer',v:Math.round(customers.reduce((s,c)=>s+c.processes.length,0)/customers.length),c:'var(--odoo-orange)',i:'⚙️'},
          {l:'Per Piece Customers',v:customers.filter(c=>c.chargeBy==='Per Piece').length,c:'var(--odoo-green)',i:'💰'},
        ].map(k=>(
          <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.c}}>
            <div className="crm-kpi-icon">{k.i}</div>
            <div className="crm-kpi-val" style={{color:k.c}}>{k.v}</div>
            <div className="crm-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
