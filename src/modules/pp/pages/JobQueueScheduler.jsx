import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { JOB_CARDS, JOB_STEPS, WORK_CENTERS, PRIORITY_COLORS } from './_ppConfig'

// ─── SMART SCHEDULER CORE ────────────────────────────────────────────────────
// Rule: IF work_center.status == FREE
//       AND job.current_step.prerequisite == DONE (prev step completed)
//       THEN assign job to work_center (priority: oldest READY job first)
// Jobs don't wait in order — any READY job can grab a FREE work center!
// ─────────────────────────────────────────────────────────────────────────────

function buildSchedulerState(jobs, stepData, wcs) {
  // Build current state of all jobs + what's READY to run
  const jobStates = jobs.map(job => {
    const steps = stepData[job.id] || job.processes.map((p,i)=>({
      step:p,
      status: i < job.currentStep-1 ? 'Done' : i===job.currentStep-1 ? 'Running' : 'Waiting',
      wcId:'', operator:'', startTime:'', endTime:'', qty:0, remarks:''
    }))
    const doneCount    = steps.filter(s=>s.status==='Done').length
    const runningStep  = steps.find(s=>s.status==='Running')
    const nextWaiting  = steps.find(s=>s.status==='Waiting')
    const isReady      = !runningStep && nextWaiting && doneCount === steps.indexOf(nextWaiting)
    return { ...job, steps, doneCount, runningStep, nextWaiting, isReady, totalSteps:steps.length }
  })

  // Build WC utilization map
  const wcMap = wcs.map(wc => {
    const assignedJob = jobStates.find(j=>j.runningStep&&j.runningStep.wcId===wc.id)
    const queuedJobs  = jobStates.filter(j=>j.isReady&&j.nextWaiting&&
      jobStates.find(jj=>jj.id===j.id)?.steps.find(s=>s.status==='Waiting'&&s.step===wc.process))
    return { ...wc, assignedJob: assignedJob||null, isOccupied: !!assignedJob, queuedCount: queuedJobs.length }
  })

  return { jobStates, wcMap }
}

export default function JobQueueScheduler() {
  const nav = useNavigate()
  const [jobs,     setJobs]     = useState(JOB_CARDS.filter(j=>j.status!=='Completed'))
  const [stepData, setStepData] = useState(JOB_STEPS)
  const [view,     setView]     = useState('scheduler') // scheduler | queue | wcboard
  const [autoTick, setAutoTick] = useState(false)
  const [tickLog,  setTickLog]  = useState([])
  const tickRef = useRef(null)

  const { jobStates, wcMap } = buildSchedulerState(jobs, stepData, WORK_CENTERS)

  // READY jobs = previous step Done + not currently running
  const readyJobs  = jobStates.filter(j=>j.isReady)
  const runningJobs= jobStates.filter(j=>j.runningStep)
  const waitingJobs= jobStates.filter(j=>!j.isReady&&!j.runningStep&&j.steps.some(s=>s.status==='Waiting'))

  // Auto-tick: simulate scheduler tick every 3s
  useEffect(()=>{
    if(autoTick){
      tickRef.current = setInterval(()=>runSchedulerTick(), 3000)
    } else {
      clearInterval(tickRef.current)
    }
    return ()=>clearInterval(tickRef.current)
  },[autoTick,jobs,stepData])

  const runSchedulerTick = () => {
    setStepData(prev=>{
      const next = {...prev}
      let log = []

      // For each job with a running step — mark it done after "some time"
      JOB_CARDS.filter(j=>j.status!=='Completed').forEach(job=>{
        const steps = next[job.id]||[]
        const runIdx= steps.findIndex(s=>s.status==='Running')
        if(runIdx>=0 && Math.random()>0.4){ // 60% chance step completes this tick
          const updated = [...steps]
          updated[runIdx]={...updated[runIdx],status:'Done',endTime:new Date().toLocaleTimeString()}
          if(runIdx+1 < updated.length){
            updated[runIdx+1]={...updated[runIdx+1],status:'Running',startTime:new Date().toLocaleTimeString(),wcId:'WC-auto'}
          }
          next[job.id]=updated
          log.push(`✅ ${job.id}: "${updated[runIdx].step}" DONE → "${updated[runIdx+1]?.step||'Completed'}" started`)
        }
      })

      if(log.length>0) setTickLog(t=>[...log,...t].slice(0,20))
      return next
    })
  }

  const manualAssign = (jobId, stepIdx, wcId) => {
    setStepData(prev=>{
      const steps=[...(prev[jobId]||[])]
      if(steps[stepIdx]) steps[stepIdx]={...steps[stepIdx],status:'Running',wcId,startTime:new Date().toLocaleTimeString()}
      setTickLog(t=>[`🔵 Manual: ${jobId} step "${steps[stepIdx]?.step}" assigned to ${WORK_CENTERS.find(w=>w.id===wcId)?.name||wcId}`,...t].slice(0,20))
      return {...prev,[jobId]:steps}
    })
  }

  const markStepDone = (jobId, stepIdx) => {
    setStepData(prev=>{
      const steps=[...(prev[jobId]||[])]
      if(steps[stepIdx]){
        steps[stepIdx]={...steps[stepIdx],status:'Done',endTime:new Date().toLocaleTimeString()}
        if(stepIdx+1<steps.length) steps[stepIdx+1]={...steps[stepIdx+1],status:'Running',startTime:new Date().toLocaleTimeString()}
      }
      setTickLog(t=>[`✅ ${jobId}: Step "${steps[stepIdx]?.step}" marked DONE`,...t].slice(0,20))
      return {...prev,[jobId]:steps}
    })
  }

  // Free WCs - active WCs not running anything
  const freeWCs = WORK_CENTERS.filter(w=>w.status==='Active'&&!wcMap.find(wm=>wm.id===w.id)?.isOccupied)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Job Queue & Smart Scheduler
          <small>{readyJobs.length} ready · {runningJobs.length} running · {freeWCs.length} work centers free</small>
        </div>
        <div className="fi-lv-actions">
          <div style={{display:'flex',gap:'4px',background:'#F0EEEB',padding:'3px',borderRadius:'6px'}}>
            {[['scheduler','🧠 Scheduler'],['queue','📋 Queue'],['wcboard','🏭 WC Board']].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:'5px 12px',borderRadius:'4px',border:'none',fontSize:'12px',fontWeight:'600',cursor:'pointer',
                background:view===v?'var(--odoo-purple)':'transparent',color:view===v?'#fff':'var(--odoo-gray)'}}>
                {l}
              </button>
            ))}
          </div>
          <button className="btn btn-s sd-bsm" onClick={runSchedulerTick}>▶ Run Tick</button>
          <button className={`btn btn-s ${autoTick?'btn-p':''}`} onClick={()=>setAutoTick(v=>!v)}
            style={{background:autoTick?'var(--odoo-red)':'',color:autoTick?'#fff':'',borderColor:autoTick?'var(--odoo-red)':''}}>
            {autoTick?'⏹ Stop Auto':'▶▶ Auto Simulate'}
          </button>
          <button className="btn btn-p btn-s" onClick={()=>nav('/pp/job-card/new')}>+ New Job</button>
        </div>
      </div>

      {/* SCHEDULER VIEW — The heart of the system */}
      {view==='scheduler'&&(
        <div>
          {/* Smart scheduler rule explanation */}
          <div style={{marginBottom:'14px',padding:'12px 16px',background:'linear-gradient(135deg,#1A1A2E,#16213E)',borderRadius:'10px',color:'#fff'}}>
            <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'6px'}}>🧠 Smart Scheduler Logic</div>
            <div style={{fontSize:'11px',lineHeight:'1.8',color:'#CBD5E0'}}>
              <span style={{color:'#68D391',fontWeight:'700'}}>Rule:</span> A Work Center is <span style={{color:'#68D391'}}>FREE</span> → it grabs the <span style={{color:'#F6E05E'}}>oldest READY job</span> for its process, regardless of job sequence.<br/>
              <span style={{color:'#FC8181',fontWeight:'700'}}>Sequence Lock:</span> A job's Step N+1 is <span style={{color:'#FC8181'}}>LOCKED</span> until Step N is marked <span style={{color:'#68D391'}}>DONE</span>.<br/>
              <span style={{color:'#76E4F7',fontWeight:'700'}}>Parallel:</span> Multiple work centers for the same process run simultaneously — Job A & Job B can both run Step 2 at the same time!
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
            {/* READY JOBS — can be assigned now */}
            <div className="fi-panel">
              <div className="fi-panel-hdr" style={{background:'#D4EDDA'}}>
                <h3 style={{color:'#155724'}}>🟢 READY — Waiting for Free Work Center ({readyJobs.length})</h3>
              </div>
              {readyJobs.length===0
                ? <div style={{padding:'20px',textAlign:'center',color:'var(--odoo-gray)',fontSize:'12px'}}>No jobs ready to start next step</div>
                : readyJobs.map(job=>{
                    const nextStep = job.nextWaiting?.step||'—'
                    const availWCs = WORK_CENTERS.filter(w=>w.process===nextStep&&w.status==='Active'&&!wcMap.find(wm=>wm.id===w.id)?.isOccupied)
                    return (
                      <div key={job.id} style={{padding:'10px 14px',borderBottom:'1px solid var(--odoo-border)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                          <div>
                            <strong style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)',fontSize:'12px'}}>{job.id}</strong>
                            <span style={{marginLeft:'8px',fontSize:'11px',color:'var(--odoo-gray)'}}>{job.item}</span>
                          </div>
                          <span className={PRIORITY_COLORS[job.priority]}>{job.priority}</span>
                        </div>
                        <div style={{fontSize:'11px',marginBottom:'6px'}}>
                          Next step: <strong style={{color:'var(--odoo-orange)'}}>{nextStep}</strong>
                          <span style={{marginLeft:'8px',color:'var(--odoo-gray)'}}>{job.doneCount}/{job.totalSteps} done</span>
                        </div>
                        {availWCs.length>0
                          ? <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                              {availWCs.map(wc=>(
                                <button key={wc.id} className="btn btn-p btn-s"
                                  style={{fontSize:'10px',padding:'3px 10px'}}
                                  onClick={()=>{
                                    const stepIdx=(stepData[job.id]||[]).findIndex(s=>s.status==='Running'||(s.status==='Waiting'&&(stepData[job.id]||[]).slice(0,(stepData[job.id]||[]).indexOf(s)).every(ss=>ss.status==='Done')))
                                    manualAssign(job.id,stepIdx>=0?stepIdx:job.currentStep-1,wc.id)
                                  }}>
                                  ⚙️ Assign → {wc.name}
                                </button>
                              ))}
                            </div>
                          : <div style={{fontSize:'11px',color:'var(--odoo-red)'}}>⚠️ No free work center for "{nextStep}" right now</div>
                        }
                      </div>
                    )
                  })
              }
            </div>

            {/* RUNNING JOBS — currently in progress */}
            <div className="fi-panel">
              <div className="fi-panel-hdr" style={{background:'#FFF3CD'}}>
                <h3 style={{color:'#856404'}}>🔵 RUNNING — In Progress ({runningJobs.length})</h3>
              </div>
              {runningJobs.length===0
                ? <div style={{padding:'20px',textAlign:'center',color:'var(--odoo-gray)',fontSize:'12px'}}>No jobs currently running</div>
                : runningJobs.map(job=>{
                    const runStep = job.runningStep
                    const stepIdx = (stepData[job.id]||[]).findIndex(s=>s.status==='Running')
                    return (
                      <div key={job.id} style={{padding:'10px 14px',borderBottom:'1px solid var(--odoo-border)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                          <strong style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)',fontSize:'12px'}}>{job.id}</strong>
                          <button className="btn btn-p btn-s" style={{fontSize:'10px',padding:'3px 10px',background:'var(--odoo-green)',borderColor:'var(--odoo-green)'}}
                            onClick={()=>markStepDone(job.id,stepIdx)}>
                            ✓ Mark Done
                          </button>
                        </div>
                        <div style={{fontSize:'11px',marginBottom:'4px'}}>
                          Running: <strong style={{color:'var(--odoo-blue)'}}>{runStep?.step}</strong>
                          {runStep?.wcId&&<span style={{marginLeft:'6px',fontSize:'10px',color:'var(--odoo-gray)'}}>@ {WORK_CENTERS.find(w=>w.id===runStep.wcId)?.name||runStep.wcId}</span>}
                        </div>
                        <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{job.item} · {job.qty} {job.unit} · {job.doneCount}/{job.totalSteps} steps done</div>
                        {/* Step progress mini bar */}
                        <div style={{display:'flex',gap:'2px',marginTop:'6px'}}>
                          {job.steps.map((s,i)=>(
                            <div key={i} title={s.step} style={{flex:1,height:'4px',borderRadius:'2px',
                              background:s.status==='Done'?'var(--odoo-green)':s.status==='Running'?'var(--odoo-orange)':'var(--odoo-border)'}}></div>
                          ))}
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          </div>

          {/* WAITING JOBS */}
          {waitingJobs.length>0&&(
            <div className="fi-panel" style={{marginBottom:'14px'}}>
              <div className="fi-panel-hdr" style={{background:'#F8D7DA'}}>
                <h3 style={{color:'#721C24'}}>⏳ WAITING — Blocked by previous step ({waitingJobs.length})</h3>
              </div>
              <div className="fi-panel-body" style={{padding:'0'}}>
                {waitingJobs.map(job=>(
                  <div key={job.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'8px 14px',borderBottom:'1px solid var(--odoo-border)'}}>
                    <strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)',minWidth:'80px'}}>{job.id}</strong>
                    <span style={{fontSize:'12px',flex:1}}>{job.item} · <span style={{color:'var(--odoo-gray)'}}>{job.customerName}</span></span>
                    <span style={{fontSize:'11px',color:'var(--odoo-red)'}}>Blocked: waiting for step {job.doneCount} to complete first</span>
                    <div style={{display:'flex',gap:'2px',minWidth:'100px'}}>
                      {job.steps.map((s,i)=>(
                        <div key={i} title={s.step} style={{flex:1,height:'5px',borderRadius:'2px',
                          background:s.status==='Done'?'var(--odoo-green)':s.status==='Running'?'var(--odoo-orange)':'var(--odoo-border)'}}></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduler Activity Log */}
          {tickLog.length>0&&(
            <div className="fi-panel">
              <div className="fi-panel-hdr"><h3>📝 Scheduler Activity Log</h3></div>
              <div className="fi-panel-body" style={{maxHeight:'180px',overflow:'auto',fontFamily:'DM Mono,monospace',fontSize:'11px'}}>
                {tickLog.map((l,i)=>(
                  <div key={i} style={{padding:'3px 0',borderBottom:'1px solid var(--odoo-border)',color:l.includes('✅')?'var(--odoo-green)':l.includes('🔵')?'var(--odoo-blue)':'var(--odoo-text)'}}>
                    <span style={{color:'var(--odoo-gray)',marginRight:'8px'}}>{new Date().toLocaleTimeString()}</span>{l}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUEUE VIEW */}
      {view==='queue'&&(
        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead>
              <tr><th>Job ID</th><th>Customer</th><th>Item</th><th>Qty</th><th>Priority</th><th>Process Route</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {jobStates.map(job=>(
                <tr key={job.id}>
                  <td><strong style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)',fontSize:'12px'}}>{job.id}</strong></td>
                  <td style={{fontSize:'12px'}}>{job.customerName}</td>
                  <td style={{fontSize:'12px'}}>{job.item}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{job.qty} {job.unit}</td>
                  <td><span className={PRIORITY_COLORS[job.priority]}>{job.priority}</span></td>
                  <td>
                    <div style={{display:'flex',gap:'2px',flexWrap:'wrap'}}>
                      {job.steps.map((s,i)=>(
                        <span key={i} style={{padding:'1px 6px',borderRadius:'3px',fontSize:'10px',fontWeight:'600',
                          background:s.status==='Done'?'#D4EDDA':s.status==='Running'?'#FFF3CD':'#F0EEEB',
                          color:s.status==='Done'?'#155724':s.status==='Running'?'#856404':'var(--odoo-gray)',
                          border:'1px solid',borderColor:s.status==='Done'?'#C3E6CB':s.status==='Running'?'#FFEEBA':'var(--odoo-border)'}}>
                          {i+1}.{s.step.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span style={{padding:'3px 8px',borderRadius:'10px',fontSize:'10px',fontWeight:'700',
                      background:job.isReady?'#D4EDDA':job.runningStep?'#FFF3CD':'#F8D7DA',
                      color:job.isReady?'#155724':job.runningStep?'#856404':'#721C24'}}>
                      {job.isReady?'🟢 READY':job.runningStep?'🔵 RUNNING':'⏳ WAITING'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-act-view" onClick={()=>nav(`/pp/process-execution?id=${job.id}`)}>⚙️ Execute</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* WORK CENTER BOARD */}
      {view==='wcboard'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'12px'}}>
          {wcMap.map(wc=>(
            <div key={wc.id} className="fi-panel" style={{border:`2px solid ${wc.isOccupied?'var(--odoo-orange)':wc.status==='Under Maintenance'?'var(--odoo-red)':'var(--odoo-green)'}`}}>
              <div style={{padding:'12px 14px',borderBottom:'1px solid var(--odoo-border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontWeight:'700',fontSize:'13px'}}>{wc.name}</div>
                    <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{wc.process}</div>
                  </div>
                  <div style={{width:'12px',height:'12px',borderRadius:'50%',flexShrink:0,marginTop:'2px',
                    background:wc.status==='Under Maintenance'?'var(--odoo-red)':wc.isOccupied?'var(--odoo-orange)':'var(--odoo-green)'}}></div>
                </div>
              </div>
              <div style={{padding:'10px 14px'}}>
                {wc.status==='Under Maintenance'
                  ? <div style={{textAlign:'center',color:'var(--odoo-red)',fontWeight:'700',fontSize:'12px',padding:'8px 0'}}>🔧 Under Maintenance</div>
                  : wc.isOccupied&&wc.assignedJob
                    ? <div>
                        <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-orange)',marginBottom:'4px'}}>🔵 RUNNING</div>
                        <div style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',color:'var(--odoo-purple)'}}>{wc.assignedJob.id}</div>
                        <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginTop:'2px'}}>{wc.assignedJob.item}</div>
                        <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{wc.assignedJob.qty} {wc.assignedJob.unit}</div>
                      </div>
                    : <div style={{textAlign:'center',padding:'8px 0'}}>
                        <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-green)',marginBottom:'4px'}}>🟢 FREE</div>
                        <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>Ready to accept jobs</div>
                        {readyJobs.filter(j=>j.nextWaiting?.step===wc.process).length>0&&(
                          <div style={{marginTop:'6px',fontSize:'10px',color:'var(--odoo-orange)',fontWeight:'600'}}>
                            {readyJobs.filter(j=>j.nextWaiting?.step===wc.process).length} job(s) waiting for this WC!
                          </div>
                        )}
                      </div>
                }
                <div style={{marginTop:'8px',borderTop:'1px solid var(--odoo-border)',paddingTop:'6px',display:'flex',justifyContent:'space-between',fontSize:'10px',color:'var(--odoo-gray)'}}>
                  <span>Cap: {wc.capacity} {wc.unit}</span>
                  <span>👤 {wc.operator||'—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
