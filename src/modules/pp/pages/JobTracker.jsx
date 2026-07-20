import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs2 = () => ({ Authorization:`Bearer ${getToken()}` })

const STATUS_STYLE = {
  PENDING:     { bg:'#FFF3CD', color:'#856404' },
  RECEIVED:    { bg:'#D1ECF1', color:'#0C5460' },
  IN_PROGRESS: { bg:'#CFE2FF', color:'#084298' },
  COMPLETED:   { bg:'#D4EDDA', color:'#155724' },
  DISPATCHED:  { bg:'#E2D9F3', color:'#4B2E83' },
  ON_HOLD:     { bg:'#F8D7DA', color:'#721C24' },
}

export default function JobTracker() {
  const [params] = useSearchParams()
  const [jobId, setJobId] = useState(params.get('id')||'')
  const [jobs, setJobs] = useState([])
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadJobs = useCallback(async () => {
    const res = await fetch(`${BASE_URL}/pp/job-cards`, { headers:authHdrs2() })
    const d = await res.json()
    setJobs(d.data||[])
    if (!jobId && d.data?.length) setJobId(String(d.data[0].id))
  },[jobId])

  const loadJob = useCallback(async (id) => {
    if (!id) { setJob(null); setLoading(false); return }
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/pp/job-cards/${id}`, { headers:authHdrs2() })
      const d = await res.json()
      setJob(d.data)
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[])

  useEffect(()=>{ loadJobs() },[]) // eslint-disable-line
  useEffect(()=>{ loadJob(jobId) },[jobId, loadJob])

  const stages = Array.isArray(job?.stages) ? job.stages : []
  const entries = job?.stageEntries || []
  const doneCount = entries.filter(e=>e.status==='DONE').length
  const pct = stages.length ? Math.round((doneCount/stages.length)*100) : 0
  const entryFor = idx => entries.find(e=>e.stageIdx===idx)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Job Tracker <small>Real-time progress, read-only</small></div>
        <div className="fi-lv-actions">
          <select className="sd-select" value={jobId} onChange={e=>setJobId(e.target.value)}>
            <option value="">-- Select Job Card --</option>
            {jobs.map(j=><option key={j.id} value={j.id}>{j.jcNo} — {j.itemName} ({j.customerName})</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
      ) : !job ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>No job card selected.</div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
            <div style={{ background:'#F8F4F8', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:10, color:'#6C757D', fontWeight:700, textTransform:'uppercase' }}>Status</div>
              <span style={{ padding:'3px 8px', borderRadius:10, fontSize:11, fontWeight:700,
                background:STATUS_STYLE[job.status]?.bg, color:STATUS_STYLE[job.status]?.color }}>
                {job.status?.replace('_',' ')}
              </span>
            </div>
            <div style={{ background:'#F8F4F8', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:10, color:'#6C757D', fontWeight:700, textTransform:'uppercase' }}>Progress</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#714B67', fontFamily:'Syne,sans-serif' }}>{pct}%</div>
            </div>
            <div style={{ background:'#F8F4F8', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:10, color:'#6C757D', fontWeight:700, textTransform:'uppercase' }}>Processed Qty</div>
              <div style={{ fontSize:16, fontWeight:700, fontFamily:'DM Mono,monospace' }}>{Number(job.processedQty).toFixed(2)} / {Number(job.receivedQty).toFixed(2)}</div>
            </div>
            <div style={{ background:'#F8F4F8', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:10, color:'#6C757D', fontWeight:700, textTransform:'uppercase' }}>Rejected Qty</div>
              <div style={{ fontSize:16, fontWeight:700, fontFamily:'DM Mono,monospace', color: Number(job.rejectedQty)>0?'#DC3545':'inherit' }}>{Number(job.rejectedQty).toFixed(2)}</div>
            </div>
          </div>

          <div className="wm-form-sec">
            <div className="wm-form-sec-hdr">{job.jcNo} — {job.itemName} · {job.customerName}</div>
            <div className="wm-form-sec-body">
              {stages.length===0 ? (
                <div style={{color:'#6C757D',fontSize:12}}>No stages configured for this job card.</div>
              ) : (
                <div style={{ position:'relative', paddingLeft:24 }}>
                  <div style={{ position:'absolute', left:9, top:8, bottom:8, width:2, background:'#E0D5E0' }} />
                  {stages.map((s, idx) => {
                    const entry = entryFor(idx)
                    const done = idx < job.currentStage
                    const active = idx === job.currentStage
                    return (
                      <div key={idx} style={{ position:'relative', marginBottom:16 }}>
                        <div style={{ position:'absolute', left:-24, top:2, width:18, height:18, borderRadius:'50%',
                          background: done?'#155724':active?'#084298':'#E9ECEF',
                          color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>
                          {done?'✓':idx+1}
                        </div>
                        <div style={{ fontWeight:700, fontSize:13, color: done?'#155724':active?'#084298':'#6C757D' }}>
                          {s}{active && <span style={{marginLeft:8,fontSize:10,fontWeight:700,color:'#084298'}}>● IN PROGRESS</span>}
                        </div>
                        {entry && (
                          <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>
                            Out: {Number(entry.qtyOut).toFixed(2)}
                            {Number(entry.qtyRejected)>0 && <span style={{color:'#DC3545'}}> · Rejected: {Number(entry.qtyRejected).toFixed(2)}</span>}
                            {entry.operator && <> · {entry.operator}</>}
                            {entry.completedAt && <> · {new Date(entry.completedAt).toLocaleString('en-IN')}</>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
