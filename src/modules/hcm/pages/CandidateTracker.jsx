import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const STAGES = ['Applied','Shortlisted','Interview','Offer','Joined','Rejected']
const STAGE_COLORS = {
  Applied:'#6C757D', Shortlisted:'#2874A6', Interview:'#E06F39',
  Offer:'#714B67', Joined:'#155724', Rejected:'#DC3545'
}
const STAGE_BG = {
  Applied:'#E9ECEF', Shortlisted:'#D1ECF1', Interview:'#FDE8D8',
  Offer:'#EDE0EA', Joined:'#D4EDDA', Rejected:'#F8D7DA'
}
const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box',
  fontFamily:'DM Sans,sans-serif' }

function AddCandidateModal({ jobs, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:'', phone:'', email:'', jobId:'', position:'',
    department:'', experience:'', source:'Walk-in', remarks:''
  })
  const [saving, setSaving] = useState(false)
  const F = f => ({ value:form[f]||'', style:inp,
    onChange:e=>setForm(p=>({...p,[f]:e.target.value})),
    onFocus:e=>e.target.style.borderColor='#714B67',
    onBlur:e=>e.target.style.borderColor='#E0D5E0' })

  const selJob = jobs.find(j=>j.id===parseInt(form.jobId))
  useEffect(()=>{
    if (selJob) setForm(p=>({...p,
      position:selJob.title, department:selJob.department }))
  },[form.jobId])

  const save = async () => {
    if (!form.name||!form.position) return toast.error('Name and Position required!')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/recruitment/candidates`,
        { method:'POST', headers:authHdrs(), body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',
      display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999 }}>
      <div style={{ background:'#fff',borderRadius:10,width:560,
        overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67',padding:'14px 20px',
          display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h3 style={{ color:'#fff',margin:0,fontFamily:'Syne,sans-serif',
            fontSize:15,fontWeight:700 }}>👤 Add Candidate</h3>
          <span onClick={onCancel} style={{ color:'#fff',cursor:'pointer',fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20,display:'flex',flexDirection:'column',gap:12 }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Full Name *</label>
              <input {...F('name')} placeholder="Candidate name" /></div>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Mobile</label>
              <input {...F('phone')} placeholder="10-digit mobile" /></div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Email</label>
              <input type="email" {...F('email')} placeholder="email@example.com" /></div>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Applied For (Job)</label>
              <select {...F('jobId')} style={{ ...inp,cursor:'pointer' }}>
                <option value="">-- Select Job Opening --</option>
                {jobs.filter(j=>j.status==='Open').map(j=>(
                  <option key={j.id} value={j.id}>{j.jobNo} — {j.title}</option>
                ))}
              </select></div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Position *</label>
              <input {...F('position')} placeholder="Position applied for" /></div>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Experience</label>
              <input {...F('experience')} placeholder="e.g. 3 years" /></div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Source</label>
              <select {...F('source')} style={{ ...inp,cursor:'pointer' }}>
                {['Walk-in','Naukri','LinkedIn','Referral','Indeed','Campus','Agency','Other'].map(s=>(
                  <option key={s}>{s}</option>))}
              </select></div>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Remarks</label>
              <input {...F('remarks')} placeholder="Any notes..." /></div>
          </div>
        </div>
        <div style={{ padding:'12px 20px',borderTop:'1px solid #E0D5E0',
          display:'flex',justifyContent:'flex-end',gap:10,background:'#F8F7FA' }}>
          <button onClick={onCancel} style={{ padding:'8px 20px',background:'#fff',
            color:'#6C757D',border:'1.5px solid #E0D5E0',borderRadius:6,
            fontSize:13,cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding:'8px 24px',background:saving?'#9E7D96':'#714B67',
              color:'#fff',border:'none',borderRadius:6,fontSize:13,
              fontWeight:700,cursor:'pointer' }}>
            {saving?'⏳ Saving...':'💾 Add Candidate'}</button>
        </div>
      </div>
    </div>
  )
}

function MoveModal({ candidate, onSave, onCancel }) {
  const [stage,  setStage]  = useState(candidate.stage)
  const [remarks,setRemarks]= useState('')
  const [intDate,setIntDate]= useState('')
  const [offer,  setOffer]  = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res  = await fetch(
        `${BASE_URL}/recruitment/candidates/${candidate.id}/stage`,
        { method:'PATCH', headers:authHdrs(),
          body:JSON.stringify({ stage, remarks,
            interviewDate:intDate||undefined,
            offerSalary:offer?parseFloat(offer):undefined }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',
      display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999 }}>
      <div style={{ background:'#fff',borderRadius:10,width:460,
        overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:STAGE_COLORS[stage]||'#714B67',padding:'14px 20px',
          display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h3 style={{ color:'#fff',margin:0,fontFamily:'Syne,sans-serif',
            fontSize:15,fontWeight:700 }}>
            Move — {candidate.name}</h3>
          <span onClick={onCancel} style={{ color:'#fff',cursor:'pointer',fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20,display:'flex',flexDirection:'column',gap:12 }}>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:6 }}>Move to Stage</label>
            <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
              {STAGES.filter(s=>s!==candidate.stage).map(s=>(
                <div key={s} onClick={()=>setStage(s)}
                  style={{ padding:'6px 14px',borderRadius:20,cursor:'pointer',
                    fontSize:12,fontWeight:600,
                    border:`2px solid ${stage===s?STAGE_COLORS[s]:'#E0D5E0'}`,
                    background:stage===s?STAGE_BG[s]:'#fff',
                    color:stage===s?STAGE_COLORS[s]:'#6C757D' }}>{s}</div>
              ))}
            </div>
          </div>
          {stage==='Interview' && (
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Interview Date</label>
              <input type="datetime-local" value={intDate}
                onChange={e=>setIntDate(e.target.value)} style={inp} /></div>
          )}
          {stage==='Offer' && (
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Offer Salary (₹/month)</label>
              <input type="number" value={offer}
                onChange={e=>setOffer(e.target.value)} style={inp}
                placeholder="e.g. 18000" /></div>
          )}
          <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
            display:'block',marginBottom:3 }}>Remarks</label>
            <textarea value={remarks} onChange={e=>setRemarks(e.target.value)}
              style={{ ...inp,resize:'vertical' }} rows={2}
              placeholder="Notes about this stage move..." /></div>
        </div>
        <div style={{ padding:'12px 20px',borderTop:'1px solid #E0D5E0',
          display:'flex',justifyContent:'flex-end',gap:10,background:'#F8F7FA' }}>
          <button onClick={onCancel} style={{ padding:'8px 20px',background:'#fff',
            color:'#6C757D',border:'1.5px solid #E0D5E0',borderRadius:6,
            fontSize:13,cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding:'8px 24px',
              background:saving?'#999':STAGE_COLORS[stage]||'#714B67',
              color:'#fff',border:'none',borderRadius:6,fontSize:13,
              fontWeight:700,cursor:'pointer' }}>
            {saving?'⏳ Moving...`':'→ Move to '+stage}</button>
        </div>
      </div>
    </div>
  )
}

export default function CandidateTracker() {
  const [candidates, setCandidates] = useState([])
  const [jobs,       setJobs]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showAdd,    setShowAdd]    = useState(false)
  const [moveModal,  setMoveModal]  = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes,jRes] = await Promise.all([
        fetch(`${BASE_URL}/recruitment/candidates`, { headers:authHdrs2() }),
        fetch(`${BASE_URL}/recruitment/jobs`, { headers:authHdrs2() }),
      ])
      const cData = await cRes.json()
      const jData = await jRes.json()
      setCandidates(cData.data||[])
      setJobs(jData.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchAll() }, [])

  const stageMap = {}
  STAGES.forEach(s=>{ stageMap[s]=candidates.filter(c=>c.stage===s) })
  const total = candidates.length

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Candidate Pipeline <small>{total} candidates total</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={fetchAll}>🔄</button>
          <button className="btn btn-p sd-bsm"
            onClick={()=>setShowAdd(true)}>+ Add Candidate</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding:40,textAlign:'center',color:'#6C757D' }}>⏳ Loading...</div>
      ) : (
        <>
          {/* Kanban board */}
          <div style={{ overflowX:'auto' }}>
            <div style={{ display:'grid',
              gridTemplateColumns:`repeat(${STAGES.length},minmax(200px,1fr))`,
              gap:12,minWidth:1200,paddingBottom:8 }}>
              {STAGES.map(stage=>(
                <div key={stage} style={{ background:'#F8F7FA',
                  borderRadius:8,overflow:'hidden',
                  border:'1px solid #E0D5E0' }}>
                  {/* Stage header */}
                  <div style={{ padding:'10px 12px',
                    background:STAGE_BG[stage],
                    borderBottom:`2px solid ${STAGE_COLORS[stage]}` }}>
                    <div style={{ fontWeight:700,fontSize:13,
                      color:STAGE_COLORS[stage],display:'flex',
                      justifyContent:'space-between' }}>
                      <span>{stage}</span>
                      <span style={{ background:STAGE_COLORS[stage],
                        color:'#fff',borderRadius:10,padding:'1px 8px',
                        fontSize:11 }}>{stageMap[stage]?.length||0}</span>
                    </div>
                  </div>
                  {/* Cards */}
                  <div style={{ padding:8,display:'flex',
                    flexDirection:'column',gap:8,minHeight:100 }}>
                    {(stageMap[stage]||[]).map(c=>(
                      <div key={c.id} style={{ background:'#fff',
                        borderRadius:8,padding:'10px 12px',
                        boxShadow:'0 1px 4px rgba(0,0,0,.06)',
                        borderLeft:`3px solid ${STAGE_COLORS[stage]}` }}>
                        <div style={{ fontWeight:700,fontSize:13,
                          color:'#1C1C1C' }}>{c.name}</div>
                        <div style={{ fontSize:11,color:'#6C757D',margin:'2px 0' }}>
                          {c.position}</div>
                        <div style={{ display:'flex',gap:6,
                          flexWrap:'wrap',marginTop:4 }}>
                          {c.experience && (
                            <span style={{ background:'#F0EEEB',padding:'1px 6px',
                              borderRadius:4,fontSize:10 }}>{c.experience}</span>
                          )}
                          <span style={{ background:'#F0EEEB',padding:'1px 6px',
                            borderRadius:4,fontSize:10 }}>{c.source}</span>
                        </div>
                        <div style={{ fontSize:10,color:'#6C757D',marginTop:4 }}>
                          {c.candNo} · {new Date(c.appliedOn).toLocaleDateString('en-IN')}
                        </div>
                        {c.interviewDate && (
                          <div style={{ fontSize:10,color:'#714B67',
                            fontWeight:600,marginTop:2 }}>
                            📅 {new Date(c.interviewDate).toLocaleDateString('en-IN')}
                          </div>
                        )}
                        {c.offerSalary && (
                          <div style={{ fontSize:11,color:'#155724',
                            fontWeight:700,marginTop:2 }}>
                            💰 ₹{Number(c.offerSalary).toLocaleString('en-IN')}/mo
                          </div>
                        )}
                        <div style={{ display:'flex',gap:4,marginTop:8 }}>
                          {stage!=='Joined'&&stage!=='Rejected' && (
                            <button className="btn-xs pri"
                              onClick={()=>setMoveModal(c)}>→ Move</button>
                          )}
                          {stage==='Rejected' && (
                            <button className="btn-xs"
                              onClick={()=>setMoveModal(c)}>↩ Reconsider</button>
                          )}
                        </div>
                      </div>
                    ))}
                    {(stageMap[stage]||[]).length===0 && (
                      <div style={{ textAlign:'center',color:'#CCC',
                        fontSize:12,padding:'20px 0' }}>Empty</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Funnel stats */}
          <div className="fi-panel" style={{ marginTop:16 }}>
            <div className="fi-panel-hdr"><h3>📊 Recruitment Funnel</h3></div>
            <div className="fi-panel-body">
              <div style={{ display:'grid',
                gridTemplateColumns:`repeat(${STAGES.length},1fr)`,gap:10 }}>
                {STAGES.map(stage=>(
                  <div key={stage} style={{ textAlign:'center',padding:10,
                    background:STAGE_BG[stage],borderRadius:8 }}>
                    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,
                      fontSize:24,color:STAGE_COLORS[stage] }}>
                      {stageMap[stage]?.length||0}</div>
                    <div style={{ fontSize:11,fontWeight:600,
                      color:STAGE_COLORS[stage] }}>{stage}</div>
                    <div style={{ background:'#fff',borderRadius:4,
                      height:5,marginTop:6,overflow:'hidden' }}>
                      <div style={{
                        width:total>0?`${((stageMap[stage]?.length||0)/total*100)}%`:'0%',
                        height:'100%',borderRadius:4,
                        background:STAGE_COLORS[stage],transition:'width .3s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {showAdd && (
        <AddCandidateModal jobs={jobs}
          onSave={()=>{ setShowAdd(false); fetchAll() }}
          onCancel={()=>setShowAdd(false)} />
      )}
      {moveModal && (
        <MoveModal candidate={moveModal}
          onSave={()=>{ setMoveModal(null); fetchAll() }}
          onCancel={()=>setMoveModal(null)} />
      )}
    </div>
  )
}
