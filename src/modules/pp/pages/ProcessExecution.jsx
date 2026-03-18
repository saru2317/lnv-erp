import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { JOB_CARDS, JOB_STEPS, WORK_CENTERS, STEP_STATUS_COLORS, STEP_STATUS_TEXT } from './_ppConfig'

export default function ProcessExecution() {
  const nav    = useNavigate()
  const [params]= useSearchParams()
  const initId  = params.get('id')||JOB_CARDS[0]?.id||''
  const [jobId, setJobId]    = useState(initId)
  const [steps, setSteps]    = useState(()=>{
    const base = JOB_STEPS[initId]||[]
    return base.length>0?base:(JOB_CARDS.find(j=>j.id===initId)?.processes||[]).map((p,i)=>({
      step:p,status:i===0?'Running':'Waiting',wcId:'',operator:'',startTime:i===0?'09:00':'',endTime:'',qty:0,remarks:''
    }))
  })
  const [showModal, setShowModal] = useState(null) // step index
  const [form, setForm] = useState({wcId:'',operator:'',qty:'',remarks:''})

  const job = JOB_CARDS.find(j=>j.id===jobId)

  const loadJob = id => {
    setJobId(id)
    const base = JOB_STEPS[id]||[]
    const procs=(JOB_CARDS.find(j=>j.id===id)?.processes||[])
    setSteps(base.length>0?base:procs.map((p,i)=>({
      step:p,status:i===0?'Running':'Waiting',wcId:'',operator:'',startTime:'',endTime:'',qty:0,remarks:''
    })))
  }

  const isStepUnlocked = idx => {
    if(idx===0) return true
    return steps.slice(0,idx).every(s=>s.status==='Done')
  }

  const markDone = idx => {
    setSteps(prev=>{
      const next=[...prev]
      next[idx]={...next[idx],status:'Done',endTime:new Date().toLocaleTimeString(),qty:form.qty||next[idx].qty||job?.qty||0,wcId:form.wcId||next[idx].wcId,operator:form.operator||next[idx].operator,remarks:form.remarks}
      if(idx+1<next.length) next[idx+1]={...next[idx+1],status:'Running',startTime:new Date().toLocaleTimeString()}
      return next
    })
    setShowModal(null)
    setForm({wcId:'',operator:'',qty:'',remarks:''})
  }

  const doneCount   = steps.filter(s=>s.status==='Done').length
  const totalSteps  = steps.length
  const progressPct = totalSteps>0?Math.round((doneCount/totalSteps)*100):0
  const isComplete  = doneCount===totalSteps&&totalSteps>0

  const processByStep = stepIdx => {
    const s = steps[stepIdx]
    return WORK_CENTERS.filter(w=>w.process===s?.step&&w.status==='Active')
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Process Execution <small>Step-by-step job execution with sequence lock</small></div>
        <div className="fi-lv-actions">
          <select className="sd-select" value={jobId} onChange={e=>loadJob(e.target.value)}>
            {JOB_CARDS.filter(j=>j.status!=='Completed').map(j=><option key={j.id} value={j.id}>{j.id} — {j.item} ({j.customerName})</option>)}
          </select>
          {isComplete&&<button className="btn btn-p btn-s" style={{background:'var(--odoo-green)',borderColor:'var(--odoo-green)'}} onClick={()=>nav('/pp/job-work-invoice')}>📄 Create Invoice →</button>}
        </div>
      </div>

      {job&&(
        <>
          {/* Job header */}
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-body">
              <div style={{display:'flex',gap:'20px',flexWrap:'wrap',alignItems:'center'}}>
                {[['Job Card',job.id],['Customer',job.customerName],['Item',job.item],['Qty',`${job.qty} ${job.unit}`],['DC No.',job.dcNo],['Priority',job.priority]].map(([k,v])=>(
                  <div key={k}>
                    <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase'}}>{k}</div>
                    <div style={{fontSize:'13px',fontWeight:'700',color:'var(--odoo-purple)',fontFamily:k==='Job Card'||k==='DC No.'?'DM Mono,monospace':''}}>{v}</div>
                  </div>
                ))}
                <div style={{marginLeft:'auto',textAlign:'right'}}>
                  <div style={{fontSize:'24px',fontWeight:'800',fontFamily:'DM Mono,monospace',color:isComplete?'var(--odoo-green)':'var(--odoo-purple)'}}>{progressPct}%</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{doneCount}/{totalSteps} steps</div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{marginTop:'10px',background:'#F0EEEB',borderRadius:'4px',height:'8px'}}>
                <div style={{width:`${progressPct}%`,height:'100%',borderRadius:'4px',
                  background:isComplete?'var(--odoo-green)':'var(--odoo-purple)',transition:'width .4s'}}></div>
              </div>
            </div>
          </div>

          {/* Steps — SEQUENCE LOCKED */}
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {steps.map((s,idx)=>{
              const unlocked = isStepUnlocked(idx)
              const wc       = WORK_CENTERS.find(w=>w.id===s.wcId)
              const avail    = processByStep(idx)

              return (
                <div key={idx} style={{
                  borderRadius:'10px',overflow:'hidden',
                  border:`2px solid ${s.status==='Done'?'var(--odoo-green)':s.status==='Running'?'var(--odoo-orange)':unlocked?'var(--odoo-border)':'#DEE2E6'}`,
                  opacity:!unlocked?0.55:1,
                  transition:'all .2s'
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',
                    background:STEP_STATUS_COLORS[s.status]}}>

                    {/* Step number circle */}
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                      background:s.status==='Done'?'var(--odoo-green)':s.status==='Running'?'var(--odoo-orange)':'var(--odoo-border)',color:'#fff',fontWeight:'800',fontSize:'13px'}}>
                      {s.status==='Done'?'✓':idx+1}
                    </div>

                    {/* Step info */}
                    <div style={{flex:1}}>
                      <div style={{fontWeight:'700',fontSize:'14px',display:'flex',alignItems:'center',gap:'8px'}}>
                        {s.step}
                        {!unlocked&&<span style={{fontSize:'11px',color:'var(--odoo-gray)'}}>🔒 Locked — Step {idx} must complete first</span>}
                        {s.status==='Running'&&<span style={{fontSize:'10px',background:'var(--odoo-orange)',color:'#fff',padding:'2px 8px',borderRadius:'8px',fontWeight:'700'}}>IN PROGRESS</span>}
                        {s.status==='Done'&&<span style={{fontSize:'10px',background:'var(--odoo-green)',color:'#fff',padding:'2px 8px',borderRadius:'8px',fontWeight:'700'}}>DONE</span>}
                      </div>
                      {(s.wcId||s.operator||s.startTime)&&(
                        <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginTop:'2px'}}>
                          {wc&&<span>⚙️ {wc.name} · </span>}
                          {s.operator&&<span>👤 {s.operator} · </span>}
                          {s.startTime&&<span>🕐 Start: {s.startTime}</span>}
                          {s.endTime&&<span> → End: {s.endTime}</span>}
                          {s.qty>0&&<span> · ✅ {s.qty} {job.unit}</span>}
                        </div>
                      )}
                      {s.remarks&&<div style={{fontSize:'11px',color:'var(--odoo-gray)',fontStyle:'italic'}}>💬 {s.remarks}</div>}
                    </div>

                    {/* Action button */}
                    {s.status==='Running'&&unlocked&&(
                      <button className="btn btn-p btn-s" style={{background:'var(--odoo-green)',borderColor:'var(--odoo-green)',flexShrink:0}}
                        onClick={()=>{setForm({wcId:s.wcId||'',operator:s.operator||'',qty:job?.qty||'',remarks:''});setShowModal(idx)}}>
                        ✓ Mark Done
                      </button>
                    )}
                    {s.status==='Waiting'&&unlocked&&(
                      <button className="btn btn-s sd-bsm" style={{flexShrink:0}}
                        onClick={()=>{setSteps(prev=>{const n=[...prev];n[idx]={...n[idx],status:'Running',startTime:new Date().toLocaleTimeString()};return n})}}>
                        ▶ Start Step
                      </button>
                    )}
                  </div>

                  {/* Available work centers for this step */}
                  {s.status!=='Done'&&unlocked&&avail.length>0&&(
                    <div style={{padding:'6px 14px',background:'#F8F9FA',borderTop:'1px solid var(--odoo-border)',display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap'}}>
                      <span style={{fontSize:'10px',color:'var(--odoo-gray)',fontWeight:'700'}}>Work Centers:</span>
                      {avail.map(w=>(
                        <span key={w.id} onClick={()=>setSteps(prev=>{const n=[...prev];n[idx]={...n[idx],wcId:w.id};return n})}
                          style={{padding:'2px 8px',borderRadius:'8px',fontSize:'10px',cursor:'pointer',fontWeight:'600',
                            background:s.wcId===w.id?'var(--odoo-purple)':'#fff',
                            color:s.wcId===w.id?'#fff':'var(--odoo-text)',
                            border:'1px solid',borderColor:s.wcId===w.id?'var(--odoo-purple)':'var(--odoo-border)'}}>
                          {w.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {isComplete&&(
            <div style={{marginTop:'16px',padding:'16px',background:'linear-gradient(135deg,var(--odoo-green),#00C0B0)',borderRadius:'10px',color:'#fff',textAlign:'center'}}>
              <div style={{fontSize:'28px',marginBottom:'6px'}}>🎉</div>
              <div style={{fontWeight:'800',fontSize:'16px',marginBottom:'4px'}}>All Steps Completed!</div>
              <div style={{fontSize:'12px',marginBottom:'12px',opacity:.9}}>Job {jobId} is ready for dispatch and invoicing</div>
              <button className="btn btn-p btn-s" style={{background:'#fff',color:'var(--odoo-green)',borderColor:'#fff'}} onClick={()=>nav('/pp/job-work-invoice')}>
                📄 Create Invoice →
              </button>
            </div>
          )}
        </>
      )}

      {/* Mark Done Modal */}
      {showModal!==null&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
          <div style={{background:'#fff',borderRadius:'12px',padding:'24px',width:'380px',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
            <h3 style={{fontFamily:'Syne,sans-serif',marginBottom:'16px',color:'var(--odoo-purple)'}}>✓ Complete Step: {steps[showModal]?.step}</h3>
            <div className="sd-form-grid">
              <div className="sd-field"><label>Work Center</label>
                <select value={form.wcId} onChange={e=>setForm(f=>({...f,wcId:e.target.value}))}>
                  <option value="">Select</option>
                  {processByStep(showModal).map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="sd-field"><label>Operator</label><input value={form.operator} onChange={e=>setForm(f=>({...f,operator:e.target.value}))} placeholder="Name" /></div>
              <div className="sd-field"><label>Qty Processed</label><input type="number" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))} /></div>
              <div className="sd-field"><label>Remarks</label><input value={form.remarks} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))} placeholder="Optional" /></div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
              <button className="btn btn-p btn-s" style={{flex:1,background:'var(--odoo-green)',borderColor:'var(--odoo-green)'}} onClick={()=>markDone(showModal)}>✓ Confirm Done</button>
              <button className="btn btn-s sd-bsm" onClick={()=>setShowModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
