import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { INDUSTRIES, ITEMS, JOB_CARDS, BATCHES, WORK_CENTERS, calcShotOutput, calcPlatingThickness } from './_ppConfig'

export default function ProductionEntry() {
  const nav = useNavigate()

  // Selectors
  const [entryMode, setEntryMode] = useState('job')  // 'job' | 'batch' | 'industry'
  const [selJobId,  setSelJobId]  = useState(JOB_CARDS[0]?.id || '')
  const [selBatchId,setSelBatchId]= useState(BATCHES[0]?.id || '')
  const [selInd,    setSelInd]    = useState('surface_treatment')

  // Stage wizard
  const [curStep,       setCurStep]       = useState(0)
  const [completedSteps,setCompletedSteps]= useState(new Set())
  const [formData,      setFormData]      = useState({})  // { stageIdx: { fieldName: value } }
  const [saved,         setSaved]         = useState(false)

  // Mould shot tracking
  const [shotsCounter, setShotsCounter]  = useState(0)
  const [shotsFired,   setShotsFired]    = useState(0)

  // Derived
  const job   = JOB_CARDS.find(j => j.id === selJobId)
  const batch = BATCHES.find(b => b.id === selBatchId)
  const item  = job ? ITEMS.find(i => i.id === job.itemId) : null
  const indKey= entryMode==='industry' ? selInd : (item ? item.industry : 'surface_treatment')
  const ind   = INDUSTRIES[indKey]
  const stages= ind?.stages || []
  const isMould = ind?.prodType === 'mould'
  const isElec  = indKey === 'electroplating'
  const isBatch = ind?.prodType === 'batch'

  // Shot info
  const shotInfo = isMould && item?.cavity && job?.qty
    ? calcShotOutput(job.qty, item.cavity) : null

  // Field setter
  const setField = (stageIdx, field, val) =>
    setFormData(d => ({ ...d, [stageIdx]: { ...(d[stageIdx]||{}), [field]: val } }))
  const getField = (stageIdx, field) => formData[stageIdx]?.[field] || ''

  // Ampere-hour auto-calc on electroplating
  const recalcThickness = (sIdx) => {
    const d = formData[sIdx] || {}
    if (d['Current (A)'] && d['Time (min)'] && d['Part Area (dm²)']) {
      const t = calcPlatingThickness(parseFloat(d['Current (A)']), parseFloat(d['Time (min)']), parseFloat(d['Part Area (dm²)']))
      setField(sIdx, 'Calculated Thickness (µm)', t)
    }
  }

  const markDone = () => {
    setCompletedSteps(s => new Set([...s, curStep]))
    if (curStep < stages.length - 1) setCurStep(curStep + 1)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const progressPct = stages.length > 0 ? Math.round((completedSteps.size / stages.length) * 100) : 0

  const indList = Object.entries(INDUSTRIES)

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Production Entry <small>Stage-by-stage recording · 15 industries</small></div>
        <div className="fi-lv-actions">
          {['job','batch','industry'].map(m => (
            <button key={m} onClick={() => { setEntryMode(m); setCurStep(0); setCompletedSteps(new Set()) }}
              className={`btn btn-s ${entryMode===m?'btn-p':'sd-bsm'}`}>
              {m==='job'?'📋 Job Card':m==='batch'?'🪣 Batch':'🏭 Industry'}
            </button>
          ))}
        </div>
      </div>

      {/* Top selectors */}
      <div className="fi-panel" style={{ marginBottom:'14px' }}>
        <div className="fi-panel-body" style={{ padding:'12px 16px' }}>
          <div style={{ display:'grid', gridTemplateColumns: entryMode==='industry'?'1fr':'1fr 1fr', gap:'12px', alignItems:'end' }}>

            {entryMode==='job' && (
              <>
                <div className="sd-field" style={{ margin:0 }}>
                  <label>Job Card</label>
                  <select value={selJobId} onChange={e=>{ setSelJobId(e.target.value); setCurStep(0); setCompletedSteps(new Set()); setFormData({}) }}>
                    {JOB_CARDS.map(j=><option key={j.id} value={j.id}>{j.id} — {j.customerName} · {j.item} ({j.qty} pcs)</option>)}
                  </select>
                </div>
                <div className="sd-field" style={{ margin:0 }}>
                  <label>DC / Challan</label>
                  <input value={job?.dcNo||''} disabled style={{ background:'#F8F9FA' }} />
                </div>
              </>
            )}

            {entryMode==='batch' && (
              <>
                <div className="sd-field" style={{ margin:0 }}>
                  <label>Batch</label>
                  <select value={selBatchId} onChange={e=>{ setSelBatchId(e.target.value); setCurStep(0); setCompletedSteps(new Set()); setFormData({}) }}>
                    {BATCHES.map(b=><option key={b.id} value={b.id}>{b.id} — {b.stage} · {b.jobCards.length} jobs · {b.totalQty} pcs</option>)}
                  </select>
                </div>
                <div style={{ padding:'8px 12px',background:'#E3F2FD',borderRadius:'6px',fontSize:'12px',color:'#1565C0' }}>
                  🪣 <strong>Jobs in batch:</strong> {batch?.jobCards.join(', ')} · Total: {batch?.totalQty} pcs
                </div>
              </>
            )}

            {entryMode==='industry' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'6px' }}>
                {indList.map(([k,v]) => (
                  <div key={k} onClick={() => { setSelInd(k); setCurStep(0); setCompletedSteps(new Set()); setFormData({}) }}
                    style={{ display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'6px',cursor:'pointer',
                      border:'1px solid',borderColor:selInd===k?v.color:'var(--odoo-border)',
                      background:selInd===k?v.light:'#fff' }}>
                    <span style={{ fontSize:'18px' }}>{v.icon}</span>
                    <div>
                      <div style={{ fontSize:'10px',fontWeight:'700',color:selInd===k?v.color:'var(--odoo-text)' }}>{v.name}</div>
                      <div style={{ fontSize:'9px',color:'var(--odoo-gray)' }}>{v.desc}</div>
                    </div>
                    {selInd===k&&<span style={{ marginLeft:'auto',color:v.color }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Job / Industry info row */}
          {(job||ind) && (
            <div style={{ display:'flex',gap:'12px',alignItems:'center',marginTop:'10px',padding:'8px 12px',background:ind?.light||'#F8F9FA',borderRadius:'8px',flexWrap:'wrap' }}>
              <span style={{ fontSize:'22px' }}>{ind?.icon}</span>
              <div>
                <strong style={{ fontSize:'13px' }}>{entryMode==='job'?job?.item:ind?.name}</strong>
                {job&&<div style={{ fontSize:'11px',color:'var(--odoo-gray)' }}>Customer: {job.customerName} · Qty: {job.qty} {job.unit} · Priority: {job.priority}</div>}
              </div>
              <div style={{ marginLeft:'auto',textAlign:'right' }}>
                <div style={{ fontSize:'12px',fontWeight:'700',color:ind?.color }}>{stages.length} stages</div>
                <div style={{ fontSize:'10px',color:'var(--odoo-gray)' }}>{completedSteps.size} done · {progressPct}% complete</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shot info bar (moulding) */}
      {isMould && shotInfo && (
        <div style={{ padding:'10px 14px',background:'#FFF3CD',borderRadius:'8px',marginBottom:'14px',display:'flex',gap:'20px',alignItems:'center',flexWrap:'wrap' }}>
          <strong style={{ color:'#E65100' }}>💉 Shot Tracker</strong>
          <span>Job Qty: <strong>{job?.qty}</strong></span>
          <span>Cavity: <strong>{item?.cavity}</strong></span>
          <span>Shots Required: <strong>{shotInfo.shots}</strong></span>
          <span>Shots Fired: <strong style={{ color:'var(--odoo-orange)' }}>{shotsFired}</strong></span>
          <span>Remaining: <strong style={{ color:'var(--odoo-green)' }}>{Math.max(0,shotInfo.shots-shotsFired)}</strong></span>
          <div style={{ marginLeft:'auto',display:'flex',gap:'6px' }}>
            <button className="btn btn-s sd-bsm" onClick={()=>setShotsFired(s=>Math.max(0,s-1))}>-1</button>
            <button className="btn btn-p btn-s" onClick={()=>setShotsFired(s=>Math.min(shotInfo.shots,s+1))}>+1 Shot</button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {stages.length>0&&(
        <div style={{ marginBottom:'14px' }}>
          <div style={{ display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'5px' }}>
            <span style={{ fontWeight:'700' }}>Overall Progress</span>
            <span style={{ color:ind?.color,fontWeight:'700' }}>{completedSteps.size}/{stages.length} stages · {progressPct}%</span>
          </div>
          <div style={{ height:'6px',background:'#E0E0E0',borderRadius:'3px',overflow:'hidden' }}>
            <div style={{ height:'100%',width:`${progressPct}%`,background:ind?.color||'var(--odoo-purple)',transition:'width .4s',borderRadius:'3px' }} />
          </div>
        </div>
      )}

      {/* Stage wizard */}
      {stages.length>0&&(
        <div style={{ display:'grid',gridTemplateColumns:'220px 1fr',gap:'14px' }}>

          {/* Stage list */}
          <div style={{ display:'flex',flexDirection:'column',gap:'4px' }}>
            {stages.map((s,i)=>(
              <div key={s.id} onClick={()=>setCurStep(i)}
                style={{ display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'8px',cursor:'pointer',transition:'all .15s',
                  border:'1px solid',borderColor:i===curStep?ind?.color||'var(--odoo-purple)':'var(--odoo-border)',
                  background:i===curStep?ind?.light||'#EDE0EA':completedSteps.has(i)?'#F1F8E9':'#fff' }}>
                <div style={{ width:'24px',height:'24px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'800',
                  background:completedSteps.has(i)?'var(--odoo-green)':i===curStep?ind?.color||'var(--odoo-purple)':'#E0E0E0',
                  color:completedSteps.has(i)||i===curStep?'#fff':'var(--odoo-gray)' }}>
                  {completedSteps.has(i)?'✓':(i+1)}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:'11px',fontWeight:'700',color:i===curStep?ind?.color||'var(--odoo-purple)':'var(--odoo-text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize:'9px',color:'var(--odoo-gray)' }}>{s.machine}</div>
                </div>
                {completedSteps.has(i)&&<span style={{ fontSize:'12px',color:'var(--odoo-green)' }}>✅</span>}
              </div>
            ))}
          </div>

          {/* Current stage form */}
          {stages[curStep] && (() => {
            const s = stages[curStep]
            return (
              <div className="fi-panel" style={{ margin:0 }}>
                <div className="fi-panel-hdr" style={{ background:ind?.light||'#EDE0EA' }}>
                  <h3 style={{ color:ind?.color||'var(--odoo-purple)',display:'flex',alignItems:'center',gap:'8px' }}>
                    <span style={{ fontSize:'20px' }}>{s.icon}</span>
                    Stage {curStep+1} of {stages.length}: {s.name}
                  </h3>
                  <div style={{ fontSize:'11px',color:ind?.color||'var(--odoo-purple)',opacity:.8 }}>
                    {s.machine} · {s.fields?.length||0} fields
                    {s.perJobInBatch&&<span style={{ marginLeft:'8px',padding:'2px 6px',background:ind?.color,color:'#fff',borderRadius:'4px',fontSize:'10px',fontWeight:'700' }}>Per-Job in Batch</span>}
                    {s.shotCounter&&<span style={{ marginLeft:'8px',padding:'2px 6px',background:'#FF8F00',color:'#fff',borderRadius:'4px',fontSize:'10px',fontWeight:'700' }}>Shot Counter</span>}
                    {s.amperHourCalc&&<span style={{ marginLeft:'8px',padding:'2px 6px',background:'#1565C0',color:'#fff',borderRadius:'4px',fontSize:'10px',fontWeight:'700' }}>A·hr Calc</span>}
                  </div>
                </div>
                <div className="fi-panel-body">

                  {/* Batch jobs selector (for perJobInBatch stages like HRC testing) */}
                  {s.perJobInBatch && batch && (
                    <div style={{ marginBottom:'12px',padding:'10px 12px',background:'#E3F2FD',borderRadius:'8px',fontSize:'12px' }}>
                      🪣 <strong>Batch Mode:</strong> Enter readings for each job separately ↓
                      <div style={{ display:'flex',gap:'6px',marginTop:'6px',flexWrap:'wrap' }}>
                        {batch.jobCards.map(jid=>(
                          <span key={jid} style={{ padding:'4px 10px',background:'#BBDEFB',borderRadius:'4px',fontSize:'11px',fontWeight:'700',color:'#1565C0',cursor:'pointer' }}>{jid}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fields grid */}
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'10px' }}>
                    {(s.fields||[]).map(field=>(
                      <div key={field} className="sd-field" style={{ margin:0 }}>
                        <label style={{ fontSize:'11px' }}>{field}</label>
                        {field.toLowerCase().includes('pass/fail')||field.toLowerCase().includes('result')?
                          <select value={getField(curStep,field)} onChange={e=>setField(curStep,field,e.target.value)}>
                            <option value="">Select</option><option>Pass</option><option>Fail</option><option>Conditional</option>
                          </select>
                        :field.toLowerCase().includes('shift')?
                          <select value={getField(curStep,field)} onChange={e=>setField(curStep,field,e.target.value)}>
                            <option value="">Select</option>
                            <option>Morning (6AM-2PM)</option><option>Afternoon (2PM-10PM)</option><option>Night (10PM-6AM)</option><option>General</option>
                          </select>
                        :field.toLowerCase().includes('type')||field.toLowerCase().includes('method')||field.toLowerCase().includes('process')?
                          <input value={getField(curStep,field)} onChange={e=>setField(curStep,field,e.target.value)} placeholder={field} />
                        :<input
                            type={field.toLowerCase().includes('qty')||field.toLowerCase().includes('temp')||field.toLowerCase().includes('time')||field.toLowerCase().includes('speed')||field.toLowerCase().includes('%')||field.toLowerCase().includes('(a)')||field.toLowerCase().includes('(v)')||field.toLowerCase().includes('(kg)')||field.toLowerCase().includes('(min)')?'number':'text'}
                            value={getField(curStep,field)}
                            onChange={e=>{
                              setField(curStep,field,e.target.value)
                              if(isElec&&(field==='Current (A)'||field==='Time (min)'||field==='Part Area (dm²)')){
                                setTimeout(()=>recalcThickness(curStep),100)
                              }
                            }}
                            placeholder={field}
                          />
                        }
                      </div>
                    ))}
                  </div>

                  {/* Shot counter display */}
                  {s.shotCounter && shotInfo && (
                    <div style={{ marginTop:'12px',padding:'10px 12px',background:'#FFF8E1',borderRadius:'8px',border:'1px solid #FFE082' }}>
                      <div style={{ fontWeight:'800',fontSize:'12px',color:'#E65100',marginBottom:'8px' }}>💉 Shot Counter for this stage</div>
                      <div style={{ display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap' }}>
                        <div style={{ textAlign:'center',padding:'8px 12px',background:'#fff',borderRadius:'6px',minWidth:'80px' }}>
                          <div style={{ fontSize:'24px',fontWeight:'900',color:'#E65100' }}>{shotsFired}</div>
                          <div style={{ fontSize:'10px',color:'var(--odoo-gray)' }}>Shots Fired</div>
                        </div>
                        <div style={{ textAlign:'center',padding:'8px 12px',background:'#fff',borderRadius:'6px',minWidth:'80px' }}>
                          <div style={{ fontSize:'24px',fontWeight:'900',color:'var(--odoo-green)' }}>{shotsFired*item?.cavity||0}</div>
                          <div style={{ fontSize:'10px',color:'var(--odoo-gray)' }}>Output Pcs</div>
                        </div>
                        <div style={{ textAlign:'center',padding:'8px 12px',background:'#fff',borderRadius:'6px',minWidth:'80px' }}>
                          <div style={{ fontSize:'24px',fontWeight:'900',color:'var(--odoo-blue)' }}>{Math.max(0,shotInfo.shots-shotsFired)}</div>
                          <div style={{ fontSize:'10px',color:'var(--odoo-gray)' }}>Remaining</div>
                        </div>
                        <div style={{ display:'flex',flexDirection:'column',gap:'4px' }}>
                          <button className="btn btn-p btn-s" onClick={()=>setShotsFired(s=>Math.min(shotInfo.shots,s+1))}>+1 Shot</button>
                          <button className="btn btn-s sd-bsm" onClick={()=>setShotsFired(s=>Math.max(0,s-1))}>-1 Shot</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ampere-hour auto-calc */}
                  {s.amperHourCalc && getField(curStep,'Calculated Thickness (µm)') && (
                    <div style={{ marginTop:'10px',padding:'10px 12px',background:'#E8EAF6',borderRadius:'8px',fontSize:'12px',color:'#283593' }}>
                      ⚗️ <strong>Auto-calculated:</strong> Thickness = {getField(curStep,'Calculated Thickness (µm)')} µm
                      &nbsp;·&nbsp; Required: {getField(curStep,'Required Thickness (µm)')||'—'} µm
                      {getField(curStep,'Required Thickness (µm)') && (
                        <span style={{ marginLeft:'8px',fontWeight:'800',color: parseFloat(getField(curStep,'Calculated Thickness (µm)'))>=parseFloat(getField(curStep,'Required Thickness (µm)'))?'var(--odoo-green)':'var(--odoo-red)' }}>
                          {parseFloat(getField(curStep,'Calculated Thickness (µm)'))>=parseFloat(getField(curStep,'Required Thickness (µm)'))?'✅ PASS':'❌ FAIL'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display:'flex',gap:'8px',marginTop:'14px',alignItems:'center' }}>
                    <button className="btn btn-p btn-s" onClick={markDone}>
                      {completedSteps.has(curStep)?'✓ Re-save Stage':'✓ Mark Stage Done'}
                    </button>
                    {curStep>0&&<button className="btn btn-s sd-bsm" onClick={()=>setCurStep(curStep-1)}>← Prev</button>}
                    {curStep<stages.length-1&&<button className="btn btn-s sd-bsm" onClick={()=>setCurStep(curStep+1)}>Next →</button>}
                    {completedSteps.size===stages.length&&(
                      <button className="btn btn-p" style={{ marginLeft:'auto',background:'var(--odoo-green)' }} onClick={handleSave}>
                        {saved?'✅ Saved!':'🎉 Complete All & Save'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Recent entries */}
      <div className="fi-panel" style={{ marginTop:'16px' }}>
        <div className="fi-panel-hdr"><h3>📄 Recent Entries</h3></div>
        <div className="fi-panel-body" style={{ padding:'10px 14px' }}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'8px' }}>
            {JOB_CARDS.map(j=>{
              const jitem=ITEMS.find(i=>i.id===j.itemId)
              const jind=INDUSTRIES[jitem?.industry]
              return(
                <div key={j.id} style={{ padding:'8px 10px',background:'#F8F9FA',borderRadius:'6px',border:'1px solid var(--odoo-border)',cursor:'pointer' }}
                  onClick={()=>{setEntryMode('job');setSelJobId(j.id);setCurStep(j.currentStep>0?j.currentStep-1:0)}}>
                  <div style={{ display:'flex',gap:'6px',alignItems:'center',marginBottom:'4px' }}>
                    <span>{jind?.icon}</span>
                    <strong style={{ fontSize:'11px',color:'var(--odoo-purple)' }}>{j.id}</strong>
                    <span style={{ marginLeft:'auto',fontSize:'10px',padding:'1px 5px',background:j.status==='In Progress'?'#FFF3E0':'#F5F5F5',borderRadius:'4px',color:j.status==='In Progress'?'#E65100':'var(--odoo-gray)',fontWeight:'700' }}>{j.status}</span>
                  </div>
                  <div style={{ fontSize:'11px',color:'var(--odoo-text)' }}>{j.customerName}</div>
                  <div style={{ fontSize:'10px',color:'var(--odoo-gray)' }}>{j.item} · {j.qty} pcs</div>
                  <div style={{ marginTop:'4px',height:'3px',background:'#E0E0E0',borderRadius:'2px' }}>
                    <div style={{ height:'100%',width:`${Math.round((j.currentStep/((jind?.stages?.length)||1))*100)}%`,background:jind?.color||'var(--odoo-purple)',borderRadius:'2px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
