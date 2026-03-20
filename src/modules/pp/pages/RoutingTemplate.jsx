import React, { useState } from 'react'
import { DEMO_COMPANY_CONFIG, PP_CUSTOMERS } from './_ppConfig'

const ALL_PROCESSES = DEMO_COMPANY_CONFIG.processes

export default function RoutingTemplate() {
  const [custId,    setCustId]    = useState('DEFAULT')
  const [routes,    setRoutes]    = useState({
    DEFAULT: [...ALL_PROCESSES],
    'CUST-001': ['Pre-Treatment','Degreasing','Powder Coating','Curing','QC Inspection'],
    'CUST-002': [...ALL_PROCESSES],
    'CUST-003': ['Degreasing','Chrome Plating','QC Inspection'],
    'CUST-004': ['Pre-Treatment','Phosphating','CED Coating','Curing','QC Inspection'],
    'CUST-005': ['Degreasing','Powder Coating','Curing'],
  })
  const [dragging, setDragging] = useState(null)
  const [saved,    setSaved]    = useState(false)

  const currentRoute = routes[custId] || [...ALL_PROCESSES]

  const toggleProcess = p => {
    setRoutes(r=>{
      const curr = r[custId]||[...ALL_PROCESSES]
      return {...r,[custId]:curr.includes(p)?curr.filter(x=>x!==p):[...curr,p]}
    })
    setSaved(false)
  }

  const handleDragStart = idx => setDragging(idx)
  const handleDragOver  = (e,idx) => {
    e.preventDefault()
    if(dragging===null||dragging===idx) return
    const reordered = [...currentRoute]
    const [moved] = reordered.splice(dragging,1)
    reordered.splice(idx,0,moved)
    setRoutes(r=>({...r,[custId]:reordered}))
    setDragging(idx)
  }

  const moveStep = (idx,dir) => {
    const r = [...currentRoute]
    if(dir==='up'&&idx>0)       [r[idx-1],r[idx]]=[r[idx],r[idx-1]]
    if(dir==='dn'&&idx<r.length-1)[r[idx],r[idx+1]]=[r[idx+1],r[idx]]
    setRoutes(rt=>({...rt,[custId]:r})); setSaved(false)
  }

  const resetToDefault = () => {
    setRoutes(r=>({...r,[custId]:[...ALL_PROCESSES]})); setSaved(false)
  }

  const custName = custId==='DEFAULT'?'Default (All Customers)':PP_CUSTOMERS.find(c=>c.id===custId)?.name||custId

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Routing Template <small>Define process sequence per customer</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={resetToDefault}>↺ Reset to Default</button>
          <button className="btn btn-p btn-s" onClick={()=>setSaved(true)}>Save Route</button>
        </div>
      </div>

      {saved&&<div className="pp-alert" style={{marginBottom:'14px'}}>Routing template saved for <strong>{custName}</strong>! New job cards will auto-use this route.</div>}

      {/* Customer selector */}
      <div className="fi-panel" style={{marginBottom:'14px'}}>
        <div className="fi-panel-hdr"><h3> Select Customer / Template</h3></div>
        <div className="fi-panel-body">
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            {[{id:'DEFAULT',name:'⭐ Default Template',desc:'Used when no customer-specific route exists'},...PP_CUSTOMERS.map(c=>({id:c.id,name:c.name,desc:c.entity+' · '+c.processes.length+' processes'}))].map(c=>(
              <div key={c.id} onClick={()=>{setCustId(c.id);setSaved(false)}}
                style={{padding:'10px 14px',borderRadius:'8px',border:'2px solid',cursor:'pointer',minWidth:'160px',
                  borderColor:custId===c.id?'var(--odoo-purple)':'var(--odoo-border)',
                  background:custId===c.id?'#EDE0EA':'#fff'}}>
                <div style={{fontWeight:'700',fontSize:'12px',color:custId===c.id?'var(--odoo-purple)':'var(--odoo-text)',marginBottom:'2px'}}>{c.name}</div>
                <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
        {/* Available processes - toggle to add/remove */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3> Available Processes — Toggle to include/exclude</h3></div>
          <div className="fi-panel-body">
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {ALL_PROCESSES.map(p=>{
                const included = currentRoute.includes(p)
                const seqNum   = currentRoute.indexOf(p)+1
                return (
                  <div key={p} onClick={()=>toggleProcess(p)}
                    style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',borderRadius:'6px',cursor:'pointer',
                      border:'1px solid',transition:'all .15s',
                      borderColor:included?'var(--odoo-purple)':'var(--odoo-border)',
                      background:included?'#EDE0EA':'#F8F9FA'}}>
                    <div style={{width:'22px',height:'22px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                      background:included?'var(--odoo-purple)':'var(--odoo-border)',color:'#fff',fontSize:'11px',fontWeight:'700',flexShrink:0}}>
                      {included?seqNum:'—'}
                    </div>
                    <span style={{flex:1,fontSize:'12px',fontWeight:'600',color:included?'var(--odoo-purple)':'var(--odoo-gray)'}}>{p}</span>
                    <span style={{fontSize:'16px'}}>{included?'':'⬜'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Route builder - drag to reorder */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3> Route for <span style={{color:'var(--odoo-purple)'}}>{custName}</span></h3>
            <span style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{currentRoute.length} steps · Drag to reorder</span>
          </div>
          <div className="fi-panel-body">
            {currentRoute.length===0
              ? <div style={{textAlign:'center',padding:'32px',color:'var(--odoo-gray)'}}>No processes selected. Toggle processes on the left.</div>
              : <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {currentRoute.map((p,idx)=>(
                    <div key={p}
                      draggable
                      onDragStart={()=>handleDragStart(idx)}
                      onDragOver={e=>handleDragOver(e,idx)}
                      style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',borderRadius:'6px',
                        background:dragging===idx?'#EDE0EA':'#fff',border:'1px solid var(--odoo-border)',cursor:'grab',
                        transition:'background .15s'}}>
                      {/* Drag handle */}
                      <span style={{color:'var(--odoo-gray)',fontSize:'16px',cursor:'grab'}}>⠿</span>
                      {/* Step number */}
                      <div style={{width:'24px',height:'24px',borderRadius:'50%',background:'var(--odoo-purple)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',flexShrink:0}}>{idx+1}</div>
                      {/* Process name */}
                      <span style={{flex:1,fontSize:'12px',fontWeight:'600'}}>{p}</span>
                      {/* First/Last badge */}
                      {idx===0&&<span style={{fontSize:'10px',background:'#D1ECF1',color:'#0C5460',padding:'2px 6px',borderRadius:'8px',fontWeight:'700'}}>START</span>}
                      {idx===currentRoute.length-1&&<span style={{fontSize:'10px',background:'#D4EDDA',color:'#155724',padding:'2px 6px',borderRadius:'8px',fontWeight:'700'}}>END</span>}
                      {/* Up/Down buttons */}
                      <div style={{display:'flex',flexDirection:'column',gap:'1px'}}>
                        <button style={{border:'none',background:'none',cursor:'pointer',fontSize:'12px',lineHeight:1,padding:'1px'}} onClick={()=>moveStep(idx,'up')}>▲</button>
                        <button style={{border:'none',background:'none',cursor:'pointer',fontSize:'12px',lineHeight:1,padding:'1px'}} onClick={()=>moveStep(idx,'dn')}>▼</button>
                      </div>
                    </div>
                  ))}
                </div>
            }

            {/* Arrow flow visual */}
            {currentRoute.length>0&&(
              <div style={{marginTop:'14px',padding:'10px',background:'#F8F9FA',borderRadius:'6px'}}>
                <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',marginBottom:'6px'}}>FLOW PREVIEW</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'0',alignItems:'center'}}>
                  {currentRoute.map((p,i)=>(
                    <React.Fragment key={p}>
                      <div style={{padding:'3px 8px',background:'var(--odoo-purple)',color:'#fff',borderRadius:'3px',fontSize:'10px',fontWeight:'700'}}>{p}</div>
                      {i<currentRoute.length-1&&<span style={{fontSize:'14px',color:'var(--odoo-gray)',padding:'0 3px'}}>→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
