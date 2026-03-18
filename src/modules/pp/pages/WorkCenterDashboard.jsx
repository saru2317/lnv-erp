import React, { useState } from 'react'
import { WORK_CENTERS, JOB_CARDS, JOB_STEPS } from './_ppConfig'

export default function WorkCenterDashboard() {
  const [filter, setFilter] = useState('All')

  const getRunningJob = wc => {
    for(const job of JOB_CARDS){
      const steps = JOB_STEPS[job.id]||[]
      const running = steps.find(s=>s.status==='Running'&&s.wcId===wc.id)
      if(running) return {job,step:running}
    }
    return null
  }

  const getQueuedJobs = wc => {
    const queued = []
    for(const job of JOB_CARDS.filter(j=>j.status==='In Progress')){
      const steps = JOB_STEPS[job.id]||[]
      const idx   = steps.findIndex(s=>s.step===wc.process&&s.status==='Waiting')
      if(idx>0&&steps.slice(0,idx).every(s=>s.status==='Done')) queued.push(job)
    }
    return queued
  }

  const filtered = filter==='All'?WORK_CENTERS:WORK_CENTERS.filter(w=>w.status===filter||
    (filter==='Free'&&w.status==='Active'&&!getRunningJob(w))||
    (filter==='Busy'&&getRunningJob(w)))

  const totalActive  = WORK_CENTERS.filter(w=>w.status==='Active').length
  const totalBusy    = WORK_CENTERS.filter(w=>getRunningJob(w)).length
  const totalFree    = totalActive-totalBusy
  const totalMaint   = WORK_CENTERS.filter(w=>w.status==='Under Maintenance').length
  const avgUtil      = Math.round(WORK_CENTERS.filter(w=>w.status==='Active').reduce((s,w)=>s+w.utilization,0)/totalActive)

  const statusColor = w => {
    if(w.status==='Under Maintenance') return 'var(--odoo-red)'
    if(getRunningJob(w)) return 'var(--odoo-orange)'
    return 'var(--odoo-green)'
  }

  const statusLabel = w => {
    if(w.status==='Under Maintenance') return '🔧 Maintenance'
    if(getRunningJob(w)) return '🔵 Running'
    if(w.status!=='Active') return w.status
    return '🟢 Free'
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Work Center Dashboard <small>Live status · Real-time view</small></div>
        <div className="fi-lv-actions">
          <div style={{display:'flex',gap:'4px',background:'#F0EEEB',padding:'3px',borderRadius:'6px'}}>
            {['All','Free','Busy','Under Maintenance'].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{padding:'5px 12px',borderRadius:'4px',border:'none',fontSize:'11px',fontWeight:'600',cursor:'pointer',
                background:filter===f?'var(--odoo-purple)':'transparent',color:filter===f?'#fff':'var(--odoo-gray)'}}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',marginBottom:'14px'}}>
        {[
          {l:'Total WCs',    v:WORK_CENTERS.length,c:'var(--odoo-purple)',i:'⚙️'},
          {l:'Active',       v:totalActive,         c:'var(--odoo-blue)',  i:'✅'},
          {l:'Running',      v:totalBusy,           c:'var(--odoo-orange)',i:'🔵'},
          {l:'Free',         v:totalFree,           c:'var(--odoo-green)', i:'🟢'},
          {l:'Maintenance',  v:totalMaint,          c:'var(--odoo-red)',   i:'🔧'},
        ].map(k=>(
          <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.c}}>
            <div className="crm-kpi-icon">{k.i}</div>
            <div className="crm-kpi-val" style={{color:k.c}}>{k.v}</div>
            <div className="crm-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>

      {/* WC Cards grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'12px'}}>
        {filtered.map(wc=>{
          const running = getRunningJob(wc)
          const queued  = getQueuedJobs(wc)

          return (
            <div key={wc.id} style={{background:'#fff',borderRadius:'10px',overflow:'hidden',
              border:`2px solid ${statusColor(wc)}`,
              boxShadow:`0 0 0 3px ${statusColor(wc)}22`}}>

              {/* Top stripe */}
              <div style={{height:'4px',background:statusColor(wc)}}></div>

              <div style={{padding:'12px 14px'}}>
                {/* WC header */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                  <div>
                    <div style={{fontWeight:'700',fontSize:'13px'}}>{wc.name}</div>
                    <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{wc.id} · {wc.process}</div>
                  </div>
                  <span style={{padding:'3px 8px',borderRadius:'8px',fontSize:'10px',fontWeight:'700',
                    background:statusColor(wc)+'22',color:statusColor(wc)}}>{statusLabel(wc)}</span>
                </div>

                {/* Capacity & Operator */}
                <div style={{display:'flex',gap:'12px',marginBottom:'8px',fontSize:'11px',color:'var(--odoo-gray)'}}>
                  <span>📦 {wc.capacity} {wc.unit}</span>
                  <span>👤 {wc.operator||'Unassigned'}</span>
                  <span>🕐 {wc.shift.split('(')[0].trim()}</span>
                </div>

                {/* Utilization bar */}
                <div style={{marginBottom:'10px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',marginBottom:'3px'}}>
                    <span style={{color:'var(--odoo-gray)'}}>Utilization</span>
                    <strong style={{color:wc.utilization>=90?'var(--odoo-red)':wc.utilization>=70?'var(--odoo-orange)':'var(--odoo-green)'}}>{wc.utilization}%</strong>
                  </div>
                  <div style={{background:'#F0EEEB',borderRadius:'3px',height:'5px'}}>
                    <div style={{width:`${wc.utilization}%`,height:'100%',borderRadius:'3px',
                      background:wc.utilization>=90?'var(--odoo-red)':wc.utilization>=70?'var(--odoo-orange)':'var(--odoo-green)'}}></div>
                  </div>
                </div>

                {/* Running job */}
                {running
                  ? <div style={{padding:'8px 10px',background:'#FFF3CD',borderRadius:'6px',marginBottom:'8px'}}>
                      <div style={{fontSize:'10px',fontWeight:'700',color:'#856404',marginBottom:'3px'}}>CURRENT JOB</div>
                      <div style={{fontFamily:'DM Mono,monospace',fontWeight:'700',fontSize:'12px',color:'var(--odoo-purple)'}}>{running.job.id}</div>
                      <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{running.job.item} · {running.job.qty} {running.job.unit}</div>
                      {running.step.startTime&&<div style={{fontSize:'10px',color:'#856404',marginTop:'2px'}}>Started: {running.step.startTime}</div>}
                    </div>
                  : wc.status==='Active'&&(
                      <div style={{padding:'8px 10px',background:'#D4EDDA',borderRadius:'6px',marginBottom:'8px',textAlign:'center'}}>
                        <div style={{fontSize:'11px',fontWeight:'700',color:'#155724'}}>🟢 AVAILABLE</div>
                        <div style={{fontSize:'10px',color:'#155724'}}>Ready to accept next job</div>
                      </div>
                    )
                }

                {/* Queued jobs */}
                {queued.length>0&&(
                  <div style={{padding:'6px 10px',background:'#F8F9FA',borderRadius:'6px',fontSize:'10px'}}>
                    <div style={{fontWeight:'700',color:'var(--odoo-gray)',marginBottom:'3px'}}>QUEUE ({queued.length})</div>
                    {queued.slice(0,2).map(j=>(
                      <div key={j.id} style={{color:'var(--odoo-text)'}}>{j.id} — {j.item}</div>
                    ))}
                    {queued.length>2&&<div style={{color:'var(--odoo-gray)'}}>+{queued.length-2} more</div>}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
