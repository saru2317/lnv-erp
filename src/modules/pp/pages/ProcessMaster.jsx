import React, { useState } from 'react'
import { DEMO_COMPANY_CONFIG, CHARGE_BASES } from './_ppConfig'

const INITIAL_PROCESSES = DEMO_COMPANY_CONFIG.processes.map((p,i)=>({
  id:`PROC-${String(i+1).padStart(3,'0')}`,
  name:p, seq:i+1, mandatory:true,
  stdTime:30+(i*10), timeUnit:'Minutes',
  chargeBy:'Per Piece', defaultRate:5+(i*2),
  canParallel:false, canSkip:false, status:'Active',
}))

export default function ProcessMaster() {
  const [processes, setProcesses] = useState(INITIAL_PROCESSES)
  const [dragging,  setDragging]  = useState(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [newProc,   setNewProc]   = useState({name:'',stdTime:30,timeUnit:'Minutes',chargeBy:'Per Piece',defaultRate:'',mandatory:true,canParallel:false,canSkip:false})
  const set = (k,v) => setNewProc(f=>({...f,[k]:v}))

  // Drag to reorder
  const handleDragStart = idx => setDragging(idx)
  const handleDragOver  = (e,idx) => {
    e.preventDefault()
    if(dragging===null||dragging===idx) return
    const reordered = [...processes]
    const [moved] = reordered.splice(dragging,1)
    reordered.splice(idx,0,moved)
    reordered.forEach((p,i)=>p.seq=i+1)
    setProcesses(reordered)
    setDragging(idx)
  }

  const handleAddProcess = () => {
    if(!newProc.name) { alert('Enter process name'); return }
    setProcesses(p=>[...p,{
      id:`PROC-${String(p.length+1).padStart(3,'0')}`,
      ...newProc, seq:p.length+1, status:'Active'
    }])
    setNewProc({name:'',stdTime:30,timeUnit:'Minutes',chargeBy:'Per Piece',defaultRate:'',mandatory:true,canParallel:false,canSkip:false})
    setShowAdd(false)
  }

  const toggleField = (id,field) => setProcesses(ps=>ps.map(p=>p.id===id?{...p,[field]:!p[field]}:p))
  const updateSeq   = (id,dir) => {
    const ps = [...processes]
    const idx = ps.findIndex(p=>p.id===id)
    if(dir==='up'&&idx>0){ [ps[idx-1],ps[idx]]=[ps[idx],ps[idx-1]] }
    if(dir==='dn'&&idx<ps.length-1){ [ps[idx],ps[idx+1]]=[ps[idx+1],ps[idx]] }
    ps.forEach((p,i)=>p.seq=i+1)
    setProcesses(ps)
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Process Master <small>{processes.length} processes · Drag to reorder</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/pp/routing-template')}> Routing Template</button>
          <button className="btn btn-p btn-s" onClick={()=>setShowAdd(true)}>+ Add Process</button>
        </div>
      </div>

      {/* Industry badge */}
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px',padding:'10px 14px',background:'#EDE0EA',borderRadius:'8px'}}>
        <span style={{fontSize:'20px'}}></span>
        <div>
          <div style={{fontWeight:'700',fontSize:'13px',color:'var(--odoo-purple)'}}>{DEMO_COMPANY_CONFIG.subType.replace('_',' ').toUpperCase()} — Process Configuration</div>
          <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>Drag rows to reorder sequence · Toggle mandatory/parallel/skip flags per process</div>
        </div>
        <div style={{marginLeft:'auto',fontSize:'12px',color:'var(--odoo-purple)',fontWeight:'600'}}>Charge basis: {DEMO_COMPANY_CONFIG.chargeBy}</div>
      </div>

      {/* Add form */}
      {showAdd&&(
        <div className="fi-panel" style={{marginBottom:'14px',border:'2px solid var(--odoo-purple)'}}>
          <div className="fi-panel-hdr"><h3>Add New Process</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field"><label>Process Name *</label><input value={newProc.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Zinc Phosphating" /></div>
              <div className="sd-field"><label>Std. Time</label><input type="number" value={newProc.stdTime} onChange={e=>set('stdTime',e.target.value)} /></div>
              <div className="sd-field"><label>Time Unit</label>
                <select value={newProc.timeUnit} onChange={e=>set('timeUnit',e.target.value)}>
                  {['Minutes','Hours','Seconds'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="sd-field"><label>Default Rate (₹)</label><input type="number" value={newProc.defaultRate} onChange={e=>set('defaultRate',e.target.value)} /></div>
              <div className="sd-field"><label>Charge By</label>
                <select value={newProc.chargeBy} onChange={e=>set('chargeBy',e.target.value)}>
                  {CHARGE_BASES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:'16px',marginTop:'10px',fontSize:'12px'}}>
              {[['mandatory','Mandatory (cannot skip)'],['canParallel','Can run parallel with other processes'],['canSkip','Customer can opt-out this process']].map(([k,l])=>(
                <label key={k} style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'}}>
                  <input type="checkbox" checked={newProc[k]} onChange={e=>set(k,e.target.checked)} />
                  {l}
                </label>
              ))}
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
              <button className="btn btn-p btn-s" onClick={handleAddProcess}> Add Process</button>
              <button className="btn btn-s sd-bsm" onClick={()=>setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Process table with drag-to-reorder */}
      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead>
            <tr>
              <th style={{width:'32px'}}></th>
              <th>Seq</th><th>Process Name</th><th>Std. Time</th><th>Charge By</th><th>Default Rate</th>
              <th>Mandatory</th><th>Parallel OK</th><th>Can Skip</th><th>Status</th><th>Reorder</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p,idx)=>(
              <tr key={p.id}
                draggable
                onDragStart={()=>handleDragStart(idx)}
                onDragOver={e=>handleDragOver(e,idx)}
                style={{background:dragging===idx?'#EDE0EA':'',cursor:'grab',borderBottom:'1px solid var(--odoo-border)'}}>
                <td style={{textAlign:'center',color:'var(--odoo-gray)',fontSize:'16px',cursor:'grab'}}>⠿</td>
                <td>
                  <span style={{width:'24px',height:'24px',borderRadius:'50%',background:'var(--odoo-purple)',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700'}}>{p.seq}</span>
                </td>
                <td><strong style={{fontSize:'12px'}}>{p.name}</strong><div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{p.id}</div></td>
                <td style={{fontSize:'12px',fontFamily:'DM Mono,monospace'}}>{p.stdTime} {p.timeUnit}</td>
                <td style={{fontSize:'12px'}}>{p.chargeBy}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',color:'var(--odoo-purple)'}}>₹{p.defaultRate}</td>
                <td style={{textAlign:'center'}}>
                  <span onClick={()=>toggleField(p.id,'mandatory')} style={{cursor:'pointer',fontSize:'16px'}}>{p.mandatory?'':'⬜'}</span>
                </td>
                <td style={{textAlign:'center'}}>
                  <span onClick={()=>toggleField(p.id,'canParallel')} style={{cursor:'pointer',fontSize:'16px'}}>{p.canParallel?'':'⬜'}</span>
                </td>
                <td style={{textAlign:'center'}}>
                  <span onClick={()=>toggleField(p.id,'canSkip')} style={{cursor:'pointer',fontSize:'16px'}}>{p.canSkip?'':'⬜'}</span>
                </td>
                <td><span className={p.status==='Active'?'crm-stage-won':'crm-badge-notq'}>{p.status}</span></td>
                <td>
                  <button style={{border:'none',background:'none',cursor:'pointer',fontSize:'14px',padding:'2px'}} onClick={()=>updateSeq(p.id,'up')}>▲</button>
                  <button style={{border:'none',background:'none',cursor:'pointer',fontSize:'14px',padding:'2px'}} onClick={()=>updateSeq(p.id,'dn')}>▼</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sequence visual */}
      <div className="fi-panel" style={{marginTop:'14px'}}>
        <div className="fi-panel-hdr"><h3> Current Process Sequence</h3></div>
        <div className="fi-panel-body">
          <div style={{display:'flex',flexWrap:'wrap',gap:'0',alignItems:'center'}}>
            {processes.map((p,i)=>(
              <React.Fragment key={p.id}>
                <div style={{padding:'6px 12px',borderRadius:'4px',fontSize:'12px',fontWeight:'600',
                  background:p.mandatory?'var(--odoo-purple)':'var(--odoo-border)',
                  color:p.mandatory?'#fff':'var(--odoo-gray)'}}>
                  {p.seq}. {p.name}
                  {p.canParallel&&<span style={{fontSize:'9px',marginLeft:'4px',opacity:.8}}>‖</span>}
                </div>
                {i<processes.length-1&&<div style={{fontSize:'18px',color:'var(--odoo-gray)',padding:'0 4px'}}>→</div>}
              </React.Fragment>
            ))}
          </div>
          <div style={{marginTop:'8px',fontSize:'11px',color:'var(--odoo-gray)'}}>
            <span style={{marginRight:'16px'}}>● Purple = Mandatory</span>
            <span style={{marginRight:'16px'}}>● Gray = Optional</span>
            <span>‖ = Can run parallel</span>
          </div>
        </div>
      </div>
    </div>
  )
}
