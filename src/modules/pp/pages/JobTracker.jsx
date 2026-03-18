import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { JOB_CARDS, JOB_STEPS, WORK_CENTERS, STEP_STATUS_COLORS } from './_ppConfig'

export default function JobTracker() {
  const [params]  = useSearchParams()
  const initId    = params.get('id')||JOB_CARDS[0]?.id||''
  const [jobId,   setJobId]   = useState(initId)
  const [viewMode,setViewMode]= useState('timeline') // timeline | table | gantt

  const job   = JOB_CARDS.find(j=>j.id===jobId)
  const steps = JOB_STEPS[jobId]||(job?.processes||[]).map((p,i)=>({
    step:p,status:i===0?'Running':'Waiting',wcId:'',operator:'',startTime:'',endTime:'',qty:0,remarks:''
  }))

  const doneCount  = steps.filter(s=>s.status==='Done').length
  const totalSteps = steps.length
  const pct        = totalSteps>0?Math.round((doneCount/totalSteps)*100):0
  const running    = steps.find(s=>s.status==='Running')
  const pending    = steps.filter(s=>s.status==='Waiting').length

  const getWCName = id => WORK_CENTERS.find(w=>w.id===id)?.name||id||'—'

  const statusIcon  = s => ({Done:'✅',Running:'🔵',Waiting:'⏳',Blocked:'🔴',Skipped:'⏭'}[s]||'❓')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Job Tracker <small>Real-time step-by-step progress</small></div>
        <div className="fi-lv-actions">
          <select className="sd-select" value={jobId} onChange={e=>setJobId(e.target.value)}>
            {JOB_CARDS.map(j=><option key={j.id} value={j.id}>{j.id} — {j.item}</option>)}
          </select>
          <div style={{display:'flex',gap:'4px',background:'#F0EEEB',padding:'3px',borderRadius:'6px'}}>
            {[['timeline','⏱️ Timeline'],['table','📋 Table'],['gantt','📊 Gantt']].map(([v,l])=>(
              <button key={v} onClick={()=>setViewMode(v)} style={{padding:'5px 10px',borderRadius:'4px',border:'none',fontSize:'11px',fontWeight:'600',cursor:'pointer',
                background:viewMode===v?'var(--odoo-purple)':'transparent',color:viewMode===v?'#fff':'var(--odoo-gray)'}}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {job&&(
        <>
          {/* Job header card */}
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:'16px',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase'}}>Job Card</div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:'18px',fontWeight:'800',color:'var(--odoo-purple)'}}>{job.id}</div>
                </div>
                <div>
                  <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase'}}>Customer</div>
                  <div style={{fontWeight:'700',fontSize:'13px'}}>{job.customerName}</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{job.dcNo}</div>
                </div>
                <div>
                  <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase'}}>Item</div>
                  <div style={{fontWeight:'700',fontSize:'13px'}}>{job.item}</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{job.qty} {job.unit}</div>
                </div>
                <div>
                  <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase'}}>Current Step</div>
                  <div style={{fontWeight:'700',fontSize:'13px',color:'var(--odoo-orange)'}}>{running?.step||'Completed'}</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{doneCount}/{totalSteps} done · {pending} pending</div>
                </div>
                {/* Progress donut-like display */}
                <div style={{textAlign:'center',minWidth:'80px'}}>
                  <div style={{fontSize:'28px',fontWeight:'800',fontFamily:'DM Mono,monospace',
                    color:pct===100?'var(--odoo-green)':'var(--odoo-purple)'}}>{pct}%</div>
                  <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>Complete</div>
                </div>
              </div>
              {/* Full progress bar */}
              <div style={{marginTop:'12px'}}>
                <div style={{display:'flex',gap:'2px'}}>
                  {steps.map((s,i)=>(
                    <div key={i} title={s.step} style={{flex:1,height:'8px',borderRadius:'2px',transition:'background .3s',
                      background:s.status==='Done'?'var(--odoo-green)':s.status==='Running'?'var(--odoo-orange)':'#E9ECEF'}}></div>
                  ))}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',color:'var(--odoo-gray)',marginTop:'3px'}}>
                  <span>Start</span><span>End</span>
                </div>
              </div>
            </div>
          </div>

          {/* TIMELINE VIEW */}
          {viewMode==='timeline'&&(
            <div style={{position:'relative',paddingLeft:'24px'}}>
              {/* Vertical line */}
              <div style={{position:'absolute',left:'28px',top:'20px',bottom:'20px',width:'2px',background:'var(--odoo-border)'}}></div>
              {steps.map((s,idx)=>{
                const wc = WORK_CENTERS.find(w=>w.id===s.wcId)
                return (
                  <div key={idx} style={{display:'flex',gap:'16px',marginBottom:'12px',position:'relative'}}>
                    {/* Step circle on timeline */}
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',flexShrink:0,zIndex:1,
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',
                      background:s.status==='Done'?'var(--odoo-green)':s.status==='Running'?'var(--odoo-orange)':'var(--odoo-border)',
                      border:'2px solid #fff',boxShadow:'0 0 0 2px '+(s.status==='Done'?'var(--odoo-green)':s.status==='Running'?'var(--odoo-orange)':'var(--odoo-border)')}}>
                      {s.status==='Done'?'✓':s.status==='Running'?'●':idx+1}
                      {/* If done, show check in white */}
                    </div>
                    {/* Step content */}
                    <div style={{flex:1,padding:'10px 14px',borderRadius:'8px',marginBottom:'0',
                      background:s.status==='Done'?'#F8FFF8':s.status==='Running'?'#FFFBF0':'#F8F9FA',
                      border:'1px solid',borderColor:s.status==='Done'?'#C3E6CB':s.status==='Running'?'#FFEEBA':'var(--odoo-border)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div>
                          <span style={{fontWeight:'700',fontSize:'13px'}}>{s.step}</span>
                          {s.status==='Running'&&(
                            <span style={{marginLeft:'8px',padding:'2px 7px',borderRadius:'8px',fontSize:'10px',fontWeight:'700',
                              background:'var(--odoo-orange)',color:'#fff'}}>RUNNING</span>
                          )}
                        </div>
                        <span style={{fontSize:'11px',fontWeight:'700',
                          color:s.status==='Done'?'var(--odoo-green)':s.status==='Running'?'var(--odoo-orange)':'var(--odoo-gray)'}}>
                          {statusIcon(s.status)} {s.status}
                        </span>
                      </div>
                      {(wc||s.operator||s.startTime)&&(
                        <div style={{marginTop:'4px',fontSize:'11px',color:'var(--odoo-gray)',display:'flex',gap:'12px',flexWrap:'wrap'}}>
                          {wc&&<span>⚙️ {wc.name}</span>}
                          {s.operator&&<span>👤 {s.operator}</span>}
                          {s.startTime&&<span>🕐 {s.startTime}{s.endTime?' → '+s.endTime:' (ongoing)'}</span>}
                          {s.qty>0&&<span>✅ {s.qty} {job.unit} processed</span>}
                        </div>
                      )}
                      {s.remarks&&<div style={{marginTop:'4px',fontSize:'11px',color:'var(--odoo-gray)',fontStyle:'italic'}}>💬 {s.remarks}</div>}
                      {s.status==='Waiting'&&idx>0&&steps[idx-1]?.status!=='Done'&&(
                        <div style={{marginTop:'4px',fontSize:'11px',color:'var(--odoo-red)',fontWeight:'600'}}>🔒 Waiting for "{steps[idx-1].step}" to complete</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode==='table'&&(
            <div className="sd-table-wrap">
              <table className="sd-table">
                <thead>
                  <tr><th>#</th><th>Step</th><th>Work Center</th><th>Operator</th><th>Start</th><th>End</th><th>Qty</th><th>Status</th><th>Remarks</th></tr>
                </thead>
                <tbody>
                  {steps.map((s,i)=>(
                    <tr key={i} style={{background:s.status==='Running'?'#FFFBF0':s.status==='Done'?'#F8FFF8':''}}>
                      <td style={{textAlign:'center'}}><span style={{width:'22px',height:'22px',borderRadius:'50%',
                        background:s.status==='Done'?'var(--odoo-green)':s.status==='Running'?'var(--odoo-orange)':'var(--odoo-border)',
                        color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:'700'}}>{i+1}</span></td>
                      <td style={{fontWeight:'700',fontSize:'12px'}}>{s.step}</td>
                      <td style={{fontSize:'11px'}}>{getWCName(s.wcId)}</td>
                      <td style={{fontSize:'11px'}}>{s.operator||'—'}</td>
                      <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{s.startTime||'—'}</td>
                      <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{s.endTime||'—'}</td>
                      <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700'}}>{s.qty||'—'}</td>
                      <td><span style={{padding:'2px 7px',borderRadius:'8px',fontSize:'10px',fontWeight:'700',
                        background:s.status==='Done'?'#D4EDDA':s.status==='Running'?'#FFF3CD':'#F0EEEB',
                        color:s.status==='Done'?'#155724':s.status==='Running'?'#856404':'var(--odoo-gray)'}}>{s.status}</span></td>
                      <td style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{s.remarks||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* GANTT VIEW — horizontal step bars */}
          {viewMode==='gantt'&&(
            <div className="fi-panel">
              <div className="fi-panel-hdr"><h3>📊 Process Gantt — {job.id}</h3></div>
              <div className="fi-panel-body">
                {steps.map((s,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
                    <div style={{width:'160px',fontSize:'11px',fontWeight:'600',textAlign:'right',flexShrink:0}}>{s.step}</div>
                    <div style={{flex:1,background:'#F0EEEB',borderRadius:'4px',height:'22px',position:'relative'}}>
                      <div style={{
                        position:'absolute',left:`${(i/(totalSteps))*100}%`,
                        width:`${(1/totalSteps)*100}%`,height:'100%',borderRadius:'4px',
                        background:s.status==='Done'?'var(--odoo-green)':s.status==='Running'?'var(--odoo-orange)':'var(--odoo-border)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:'9px',fontWeight:'700',color:'#fff',overflow:'hidden'}}>
                        {s.status!=='Waiting'?s.status:''}
                      </div>
                    </div>
                    <div style={{width:'70px',fontSize:'10px',color:'var(--odoo-gray)',flexShrink:0}}>
                      {s.startTime||'—'}{s.endTime?' → '+s.endTime:''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
