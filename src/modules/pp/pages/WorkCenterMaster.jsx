import React, { useState } from 'react'
import { WORK_CENTERS, DEMO_COMPANY_CONFIG, SHIFT_OPTIONS, WC_STATUS } from './_ppConfig'

export default function WorkCenterMaster() {
  const [wcs,      setWcs]      = useState(WORK_CENTERS)
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [filter,   setFilter]   = useState('All')
  const [form,     setForm]     = useState({name:'',process:'',capacity:'',unit:'Pieces/shift',shift:SHIFT_OPTIONS[3],operator:'',status:'Active'})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const processes = DEMO_COMPANY_CONFIG.processes

  const filtered = filter==='All' ? wcs : wcs.filter(w=>w.status===filter)

  const handleSave = () => {
    if(!form.name||!form.process) { alert('Fill required fields'); return }
    if(editId) {
      setWcs(ws=>ws.map(w=>w.id===editId?{...w,...form}:w))
      setEditId(null)
    } else {
      setWcs(ws=>[...ws,{id:`WC-${String(ws.length+1).padStart(3,'0')}`,utilization:0,...form}])
    }
    setForm({name:'',process:'',capacity:'',unit:'Pieces/shift',shift:SHIFT_OPTIONS[3],operator:'',status:'Active'})
    setShowForm(false)
  }

  const handleEdit = w => {
    setForm({name:w.name,process:w.process,capacity:w.capacity,unit:w.unit,shift:w.shift,operator:w.operator,status:w.status})
    setEditId(w.id); setShowForm(true)
  }

  const utilColor = u => u>=90?'var(--odoo-red)':u>=70?'var(--odoo-orange)':'var(--odoo-green)'

  // Group by process
  const byProcess = processes.reduce((acc,p)=>{
    acc[p]=wcs.filter(w=>w.process===p); return acc
  },{})

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Work Center Master <small>{wcs.length} work centers configured</small></div>
        <div className="fi-lv-actions">
          <select className="sd-select" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option>All</option>{WC_STATUS.map(s=><option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-p btn-s" onClick={()=>{setEditId(null);setShowForm(true)}}>+ Add Work Center</button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm&&(
        <div className="fi-panel" style={{marginBottom:'14px',border:'2px solid var(--odoo-purple)'}}>
          <div className="fi-panel-hdr"><h3>{editId?' Edit':' New'} Work Center</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field"><label>Work Center Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Powder Coat Booth 1" /></div>
              <div className="sd-field"><label>Linked Process *</label>
                <select value={form.process} onChange={e=>set('process',e.target.value)}>
                  <option value="">Select Process</option>
                  {processes.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="sd-field"><label>Capacity</label><input type="number" value={form.capacity} onChange={e=>set('capacity',e.target.value)} placeholder="e.g. 500" /></div>
              <div className="sd-field"><label>Capacity Unit</label>
                <select value={form.unit} onChange={e=>set('unit',e.target.value)}>
                  {['Pieces/shift','Kg/shift','Batches/shift','Hours/shift','Meters/shift'].map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="sd-field"><label>Shift</label>
                <select value={form.shift} onChange={e=>set('shift',e.target.value)}>
                  {SHIFT_OPTIONS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="sd-field"><label>Operator / Incharge</label><input value={form.operator} onChange={e=>set('operator',e.target.value)} placeholder="Name" /></div>
              <div className="sd-field"><label>Status</label>
                <select value={form.status} onChange={e=>set('status',e.target.value)}>
                  {WC_STATUS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
              <button className="btn btn-p btn-s" onClick={handleSave}> {editId?'Update':'Save'}</button>
              <button className="btn btn-s sd-bsm" onClick={()=>{setShowForm(false);setEditId(null)}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Process-grouped view */}
      <div style={{display:'grid',gap:'12px'}}>
        {processes.map(proc=>{
          const procWCs = wcs.filter(w=>w.process===proc&&(filter==='All'||w.status===filter))
          if(procWCs.length===0&&filter!=='All') return null
          return (
            <div key={proc} className="fi-panel">
              <div className="fi-panel-hdr">
                <h3> {proc}</h3>
                <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                  <span style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{procWCs.length} work center{procWCs.length!==1?'s':''}</span>
                  <button className="btn btn-s sd-bsm" onClick={()=>{set('process',proc);setEditId(null);setShowForm(true)}}>+ Add</button>
                </div>
              </div>
              {procWCs.length===0
                ? <div style={{padding:'14px',textAlign:'center',color:'var(--odoo-gray)',fontSize:'12px'}}>No work centers for this process yet. <button className="btn btn-s btn-p" onClick={()=>{set('process',proc);setShowForm(true)}}>Add one</button></div>
                : <div className="fi-panel-body" style={{padding:'0'}}>
                    {procWCs.map(w=>(
                      <div key={w.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderBottom:'1px solid var(--odoo-border)'}}>
                        {/* WC status dot */}
                        <div style={{width:'10px',height:'10px',borderRadius:'50%',flexShrink:0,
                          background:w.status==='Active'?'var(--odoo-green)':w.status==='Under Maintenance'?'var(--odoo-red)':'var(--odoo-gray)'}}></div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:'700',fontSize:'13px'}}>{w.name}</div>
                          <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}> {w.operator||'—'} ·  {w.shift}</div>
                        </div>
                        {/* Capacity */}
                        <div style={{textAlign:'center',minWidth:'90px'}}>
                          <div style={{fontFamily:'DM Mono,monospace',fontWeight:'700',fontSize:'13px',color:'var(--odoo-purple)'}}>{w.capacity}</div>
                          <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{w.unit}</div>
                        </div>
                        {/* Utilization */}
                        <div style={{minWidth:'100px'}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'3px'}}>
                            <span style={{color:'var(--odoo-gray)'}}>Utilization</span>
                            <strong style={{color:utilColor(w.utilization)}}>{w.utilization}%</strong>
                          </div>
                          <div style={{background:'#F0EEEB',borderRadius:'3px',height:'5px'}}>
                            <div style={{width:`${w.utilization}%`,height:'100%',borderRadius:'3px',background:utilColor(w.utilization),transition:'width .3s'}}></div>
                          </div>
                        </div>
                        {/* Status badge */}
                        <span className={w.status==='Active'?'crm-stage-won':w.status==='Under Maintenance'?'crm-stage-lost':'crm-badge-new'} style={{fontSize:'10px',flexShrink:0}}>{w.status}</span>
                        {/* Actions */}
                        <div style={{display:'flex',gap:'4px',flexShrink:0}}>
                          <button className="btn-act-edit" onClick={()=>handleEdit(w)}></button>
                          <button className="btn-act-del" onClick={()=>setWcs(ws=>ws.filter(x=>x.id!==w.id))}></button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )
        })}
      </div>

      {/* Summary stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginTop:'14px'}}>
        {[
          {l:'Total Work Centers', v:wcs.length,                                   c:'var(--odoo-purple)',i:''},
          {l:'Active',             v:wcs.filter(w=>w.status==='Active').length,    c:'var(--odoo-green)', i:''},
          {l:'Under Maintenance',  v:wcs.filter(w=>w.status==='Under Maintenance').length,c:'var(--odoo-red)',i:''},
          {l:'Avg Utilization',    v:Math.round(wcs.filter(w=>w.status==='Active').reduce((s,w)=>s+w.utilization,0)/wcs.filter(w=>w.status==='Active').length)+'%',c:'var(--odoo-orange)',i:''},
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
