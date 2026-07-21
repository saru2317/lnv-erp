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
  const [woLines, setWoLines] = useState(null)   // null = no WO yet, [] = WO exists but no components
  const [consumeQty, setConsumeQty] = useState({})   // issue id -> qty being posted
  const [consumeMode, setConsumeMode] = useState({}) // issue id -> DIRECT | SHOPFLOOR override
  const [consumeOp, setConsumeOp] = useState({})     // issue id -> operator name
  const [consuming, setConsuming] = useState('')     // issue id currently posting
  const [generating, setGenerating] = useState(false)

  const loadConsumption = useCallback(async (woId) => {
    if (!woId) { setWoLines(null); return }
    try {
      const res = await fetch(`${BASE_URL}/pp/wo/${woId}/consumption`, { headers:authHdrs2() })
      const d = await res.json()
      setWoLines(d.data?.lines||[])
      const modes = {}
      ;(d.data?.lines||[]).forEach(l=>{ modes[l.id] = l.issueMode })
      setConsumeMode(modes)
    } catch { setWoLines(null) }
  },[])

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
  useEffect(()=>{ if (job?.woId) loadConsumption(job.woId); else setWoLines(null) },[job?.woId, loadConsumption])

  const generateWO = async () => {
    if (!job) return
    setGenerating(true)
    try {
      const res = await fetch(`${BASE_URL}/pp/job-cards/${job.id}/generate-wo`, { method:'POST', headers:authHdrs() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      loadJob(job.id)
    } catch(e){ toast.error(e.message) } finally { setGenerating(false) }
  }

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
      if (job.woId) loadConsumption(job.woId)
    } catch(e){ toast.error(e.message) } finally { setPosting(false) }
  }

  const postConsumption = async (line) => {
    const qty = consumeQty[line.id]
    if (!qty || parseFloat(qty)<=0) return toast.error('Enter a quantity to consume')
    const mode = consumeMode[line.id] || line.issueMode
    setConsuming(String(line.id))
    try {
      const res = await fetch(`${BASE_URL}/pp/wo/material-issue/${line.id}/consume`, {
        method:'POST', headers:authHdrs(),
        body: JSON.stringify({ qty, issueMode: mode, operator: consumeOp[line.id]||undefined })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      setConsumeQty(q=>({...q,[line.id]:''}))
      loadConsumption(job.woId)
    } catch(e){ toast.error(e.message) } finally { setConsuming('') }
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

          {job.bomId && !job.woId && (
            <div className="pp-alert" style={{marginBottom:14,background:'#FFF3CD',borderColor:'#FFEEBA',color:'#856404',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>This job has a BOM but no Work Order yet — material consumption needs a real WO to post against (Work Center Board, variance tracking, everything).</span>
              <button disabled={generating} onClick={generateWO}
                style={{padding:'6px 14px',background:'#856404',color:'#fff',border:'none',borderRadius:5,fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',marginLeft:12}}>
                {generating?'⏳ Generating...':'⚙️ Generate Work Order'}
              </button>
            </div>
          )}

          {woLines && (
            <div className="wm-form-sec" style={{marginBottom:14}}>
              <div className="wm-form-sec-hdr">Material Consumption {job.woNo && <span style={{fontWeight:400,opacity:.8}}>— {job.woNo}</span>}</div>
              <div className="wm-form-sec-body">
                {woLines.length===0 ? (
                  <div style={{fontSize:12,color:'#6C757D'}}>No components reserved on this WO.</div>
                ) : (
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid #E0D5E0'}}>
                        {['Component','Source','Mode','Standard','Consumed','Variance','Available','Operator','Consume Qty',''].map(h=>(
                          <th key={h} style={{padding:'6px 8px',fontSize:10,fontWeight:700,color:'#6C757D',textAlign:'left',textTransform:'uppercase'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {woLines.map(l=>(
                        <tr key={l.id} style={{borderBottom:'1px solid #F0EEEB'}}>
                          <td style={{padding:'6px 8px',fontWeight:600}}>{l.itemCode?`${l.itemCode} — `:''}{l.itemName}</td>
                          <td style={{padding:'6px 8px'}}>
                            <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                              background:l.ownerType==='CUSTOMER'?'#EDE0EA':'#E9ECEF',
                              color:l.ownerType==='CUSTOMER'?'#714B67':'#6C757D'}}>
                              {l.ownerType==='CUSTOMER'?'🤝 Customer':'🏭 Own'}
                            </span>
                          </td>
                          <td style={{padding:'6px 8px'}}>
                            <span onClick={()=>setConsumeMode(m=>({...m,[l.id]: (m[l.id]||l.issueMode)==='SHOPFLOOR'?'DIRECT':'SHOPFLOOR'}))}
                              title="Click to switch between direct-to-WO and shop-floor bulk"
                              style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,cursor:'pointer',
                              background:(consumeMode[l.id]||l.issueMode)==='SHOPFLOOR'?'#D1ECF1':'#E9ECEF',
                              color:(consumeMode[l.id]||l.issueMode)==='SHOPFLOOR'?'#0C5460':'#6C757D'}}>
                              {(consumeMode[l.id]||l.issueMode)==='SHOPFLOOR'?'📦 Shop Floor':'➡️ Direct'}
                            </span>
                          </td>
                          <td style={{padding:'6px 8px',fontFamily:'DM Mono,monospace'}}>{l.bomQty.toFixed(3)} {l.uom}</td>
                          <td style={{padding:'6px 8px',fontFamily:'DM Mono,monospace'}}>{l.consumedQty.toFixed(3)}</td>
                          <td style={{padding:'6px 8px',fontFamily:'DM Mono,monospace',
                            color:Math.abs(l.varianceQty)<0.001?'#6C757D':l.varianceQty>0?'#DC3545':'#856404'}}>
                            {l.varianceQty>0?'+':''}{l.varianceQty.toFixed(3)}
                          </td>
                          <td style={{padding:'6px 8px',fontFamily:'DM Mono,monospace'}}>
                            {l.available!=null ? (
                              <span style={{color:l.available<=0?'#DC3545':'inherit'}}>{l.available.toFixed(3)}</span>
                            ) : '—'}
                          </td>
                          <td style={{padding:'6px 8px',width:90}}>
                            <input style={{width:'100%',padding:'4px 6px',border:'1px solid #E0D5E0',borderRadius:4,fontSize:12}}
                              placeholder={l.operator||'Name'}
                              value={consumeOp[l.id]||''}
                              onChange={e=>setConsumeOp(o=>({...o,[l.id]:e.target.value}))} />
                          </td>
                          <td style={{padding:'6px 8px',width:90}}>
                            <input type="number" style={{width:'100%',padding:'4px 6px',border:'1px solid #E0D5E0',borderRadius:4,fontSize:12}}
                              value={consumeQty[l.id]||''}
                              onChange={e=>setConsumeQty(q=>({...q,[l.id]:e.target.value}))} />
                          </td>
                          <td style={{padding:'6px 8px'}}>
                            <button disabled={consuming===String(l.id)} onClick={()=>postConsumption(l)}
                              style={{padding:'4px 10px',background:'#714B67',color:'#fff',border:'none',borderRadius:4,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                              {consuming===String(l.id)?'⏳':'Consume'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div style={{fontSize:10,color:'#6C757D',marginTop:8}}>
                  Direct = issued straight to this WO (right for parts tied to one specific job, like a customer's own components). Shop Floor = drawn from a shared bulk pool already transferred there via Stock Transfer (right for shared consumables like powder or paint). Variance = actual consumed vs the BOM standard — every operator's usage shows here, not just the average.
                </div>
              </div>
            </div>
          )}

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
