import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

export default function ProcessExecution() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [jobId, setJobId] = useState(params.get('id')||'')
  const [jobs, setJobs] = useState([])
  const [job, setJob] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [form, setForm] = useState({ workCenter:'', operator:'', qtyOut:'', qtyRejected:'0', remarks:'' })

  const loadJobs = useCallback(async () => {
    // Only job cards actively being worked (RECEIVED or IN_PROGRESS) make
    // sense to execute against — PENDING hasn't been physically received
    // yet, COMPLETED/DISPATCHED/ON_HOLD have nothing left to do here.
    const res = await fetch(`${BASE_URL}/pp/job-cards?status=RECEIVED,IN_PROGRESS`, { headers:authHdrs2() })
    const d = await res.json()
    setJobs(d.data||[])
  },[])

  const loadJob = useCallback(async (id) => {
    if (!id) { setJob(null); setEntries([]); setLoading(false); return }
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/pp/job-cards/${id}`, { headers:authHdrs2() })
      const d = await res.json()
      setJob(d.data)
      setEntries(d.data?.stageEntries||[])
    } catch(e){ toast.error(e.message) }
    finally { setLoading(false) }
  },[])

  useEffect(()=>{ loadJobs() },[loadJobs])
  useEffect(()=>{ loadJob(jobId) },[jobId, loadJob])

  const stages = Array.isArray(job?.stages) ? job.stages : []
  const currentIdx = job?.currentStage ?? 0
  const currentStageName = stages[currentIdx]
  const isDone = job && currentIdx >= stages.length && stages.length>0

  const postStage = async () => {
    if (!job) return
    if (!form.qtyOut || parseFloat(form.qtyOut)<=0) return toast.error('Enter output quantity')
    setPosting(true)
    try {
      const res = await fetch(`${BASE_URL}/pp/job-cards/${job.id}/stage`, {
        method:'POST', headers:authHdrs(),
        body: JSON.stringify({
          stageIdx: currentIdx, stageName: currentStageName,
          workCenter: form.workCenter||null, operator: form.operator||null,
          qtyIn: job.receivedQty, qtyOut: form.qtyOut, qtyRejected: form.qtyRejected||0,
          status:'DONE', completedAt: new Date().toISOString(),
          remarks: form.remarks||null,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      setForm({ workCenter:'', operator:'', qtyOut:'', qtyRejected:'0', remarks:'' })
      loadJob(job.id)
      loadJobs()
    } catch(e){ toast.error(e.message) } finally { setPosting(false) }
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Process Execution <small>Record stage-by-stage progress</small></div>
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
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          {jobs.length===0
            ? 'No job cards ready for execution — nothing RECEIVED or IN_PROGRESS right now.'
            : 'Pick a job card above to start recording stages.'}
        </div>
      ) : (
        <>
          <div className="wm-form-sec" style={{marginBottom:14}}>
            <div className="wm-form-sec-body" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:14}}>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>{job.jcNo} — {job.itemName}</div>
                <div style={{fontSize:12,color:'#6C757D'}}>{job.customerName} · {Number(job.receivedQty).toFixed(2)} {job.uom} received</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:11,color:'#6C757D'}}>Stage {Math.min(currentIdx+1,stages.length)} of {stages.length}</div>
                <div style={{background:'#E9ECEF',borderRadius:6,height:8,width:140,overflow:'hidden',marginTop:4}}>
                  <div style={{background:'#714B67',height:'100%',width:`${stages.length?Math.round((currentIdx/stages.length)*100):0}%`}} />
                </div>
              </div>
            </div>
          </div>

          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
            {stages.map((s,i)=>{
              const done = i < currentIdx
              const active = i === currentIdx && !isDone
              return (
                <div key={i} style={{ padding:'6px 12px', borderRadius:16, fontSize:12, fontWeight:700,
                  background: done?'#D4EDDA':active?'#CFE2FF':'#E9ECEF',
                  color: done?'#155724':active?'#084298':'#6C757D' }}>
                  {done?'✓ ':active?'▶ ':''}{i+1}. {s}
                </div>
              )
            })}
          </div>

          {isDone ? (
            <div className="pp-alert" style={{background:'#D4EDDA',borderColor:'#C3E6CB',color:'#155724'}}>
              All stages complete — {job.jcNo} is <strong>COMPLETED</strong>. Ready to raise a Job Work DC (SD → Delivery Challan → Job Work) to dispatch it back to {job.customerName}.
            </div>
          ) : (
            <div className="wm-form-sec">
              <div className="wm-form-sec-hdr">Record Stage: {currentStageName}</div>
              <div className="wm-form-sec-body">
                <div className="wm-form-row4">
                  <div className="wm-form-grp"><label>Work Center</label>
                    <input className="wm-form-ctrl" placeholder="Optional"
                      value={form.workCenter} onChange={e=>setForm(f=>({...f,workCenter:e.target.value}))}/>
                  </div>
                  <div className="wm-form-grp"><label>Operator</label>
                    <input className="wm-form-ctrl" placeholder="Optional"
                      value={form.operator} onChange={e=>setForm(f=>({...f,operator:e.target.value}))}/>
                  </div>
                  <div className="wm-form-grp"><label>Qty Out <span>*</span></label>
                    <input type="number" className="wm-form-ctrl" placeholder="Qty"
                      value={form.qtyOut} onChange={e=>setForm(f=>({...f,qtyOut:e.target.value}))}/>
                  </div>
                  <div className="wm-form-grp"><label>Qty Rejected</label>
                    <input type="number" className="wm-form-ctrl" placeholder="0"
                      value={form.qtyRejected} onChange={e=>setForm(f=>({...f,qtyRejected:e.target.value}))}/>
                  </div>
                </div>
                <div className="wm-form-row">
                  <div className="wm-form-grp" style={{flex:1}}><label>Remarks</label>
                    <input className="wm-form-ctrl" placeholder="Optional notes..."
                      value={form.remarks} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))}/>
                  </div>
                </div>
              </div>
              <div className="wm-form-acts">
                <button className="btn btn-p sd-bsm" disabled={posting} onClick={postStage}>
                  {posting?'⏳ Posting...':`Mark "${currentStageName}" Done`}
                </button>
              </div>
            </div>
          )}

          {entries.length>0 && (
            <div style={{marginTop:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#714B67',marginBottom:8}}>Completed Stages</div>
              <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead style={{ background:'#F8F4F8' }}>
                    <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                      {['Stage','Qty Out','Rejected','Operator','Completed'].map(h=>(
                        <th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700,
                          color:'#6C757D', textAlign:'left', textTransform:'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e,i)=>(
                      <tr key={e.id} style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FDFBFD' }}>
                        <td style={{ padding:'8px 10px', fontWeight:600 }}>{e.stageName}</td>
                        <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace' }}>{Number(e.qtyOut).toFixed(2)}</td>
                        <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace' }}>{Number(e.qtyRejected).toFixed(2)}</td>
                        <td style={{ padding:'8px 10px' }}>{e.operator||'—'}</td>
                        <td style={{ padding:'8px 10px', fontSize:11, color:'#6C757D' }}>
                          {e.completedAt ? new Date(e.completedAt).toLocaleString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
