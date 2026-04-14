import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box',
  fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057',
  display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }

const STATUS = {
  DRAFT:       { bg:'#F0EEF0', color:'#6C757D', icon:'✏️',  label:'Draft'        },
  SUBMITTED:   { bg:'#FFF3CD', color:'#856404', icon:'📤',  label:'Submitted'    },
  HR_REVIEW:   { bg:'#D1ECF1', color:'#0C5460', icon:'👀',  label:'HR Review'    },
  APPROVED:    { bg:'#D4EDDA', color:'#155724', icon:'✅',  label:'Approved'     },
  REJECTED:    { bg:'#F8D7DA', color:'#721C24', icon:'❌',  label:'Rejected'     },
  JOB_CREATED: { bg:'#EDE0EA', color:'#714B67', icon:'🎯',  label:'Job Created'  },
}

const REASONS = [
  { value:'EXPANSION',    label:'Business Expansion — new positions' },
  { value:'REPLACEMENT',  label:'Replacement — employee resigned/retired' },
  { value:'ATTRITION',    label:'Attrition — covering workload' },
  { value:'NEW_PROJECT',  label:'New Project — temporary/permanent' },
  { value:'SEASONAL',     label:'Seasonal Demand — festival/peak period' },
]

// ── MRF Form Modal ────────────────────────────────────────
function MRFModal({ mrf, employees, onSave, onCancel }) {
  const isEdit = !!mrf?.id
  const [form, setForm] = useState(mrf ? {
    ...mrf,
    requiredBy: mrf.requiredBy?.split('T')[0]||'',
    budgetMin:  mrf.budgetMin||'',
    budgetMax:  mrf.budgetMax||'',
  } : {
    requestedBy:'', requestedByName:'', department:'',
    position:'', category:'Worker', noOfPositions:1,
    reason:'EXPANSION', replacingEmpCode:'', replacingEmpName:'',
    requiredBy:'', minExperience:'', skillRequired:'',
    budgetMin:'', budgetMax:'', jobDescription:''
  })
  const [saving, setSaving] = useState(false)

  const F = f => ({ value:form[f]??'', style:inp,
    onChange:e=>setForm(p=>({...p,[f]:e.target.value})),
    onFocus:e=>e.target.style.borderColor='#714B67',
    onBlur:e=>e.target.style.borderColor='#E0D5E0' })

  // auto fill name from emp selection
  const selEmp = employees.find(e=>e.empCode===form.requestedBy)
  useEffect(()=>{
    if (selEmp) setForm(p=>({...p,
      requestedByName:selEmp.name,
      department:selEmp.department||p.department
    }))
  },[form.requestedBy])

  const save = async (submitAfter=false) => {
    if (!form.department||!form.position||!form.reason)
      return toast.error('Department, Position, Reason required!')
    setSaving(true)
    try {
      const url    = isEdit?`${BASE_URL}/mrf/${mrf.id}`:`${BASE_URL}/mrf`
      const method = isEdit?'PATCH':'POST'
      const res    = await fetch(url,{method,headers:authHdrs(),
        body:JSON.stringify(form)})
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Auto submit if requested
      if (submitAfter && data.data?.id) {
        const sRes = await fetch(`${BASE_URL}/mrf/${data.data.id}/submit`,
          {method:'POST',headers:authHdrs(),body:'{}'})
        const sData = await sRes.json()
        toast.success(sData.message)
      } else {
        toast.success(data.message)
      }
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.55)',
      display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999 }}>
      <div style={{ background:'#fff',borderRadius:10,width:'90%',maxWidth:800,
        maxHeight:'92vh',overflow:'hidden',display:'flex',flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.35)' }}>
        <div style={{ background:'#714B67',padding:'14px 20px',
          display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div>
            <h3 style={{ color:'#fff',margin:0,fontFamily:'Syne,sans-serif',
              fontSize:16,fontWeight:700 }}>
              {isEdit?`Edit — ${mrf.mrfNo}`:'📋 New Manpower Requisition'}</h3>
            <p style={{ color:'rgba(255,255,255,.6)',margin:'2px 0 0',fontSize:11 }}>
              HOD raises → HR reviews → MD approves → Job auto-created
            </p>
          </div>
          <span onClick={onCancel}
            style={{ color:'#fff',cursor:'pointer',fontSize:20 }}>✕</span>
        </div>

        <div style={{ overflowY:'auto',flex:1,padding:20,
          display:'flex',flexDirection:'column',gap:16 }}>

          {/* Section 1 — Request Info */}
          <div style={{ background:'#F8F4F8',borderRadius:8,padding:16,
            border:'1px solid #E0D5E0' }}>
            <div style={{ fontSize:12,fontWeight:700,color:'#714B67',
              marginBottom:12 }}>👤 Requisition Details</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
              <div><label style={lbl}>Requested By (HOD)</label>
                <select value={form.requestedBy} style={{ ...inp,cursor:'pointer' }}
                  onChange={e=>setForm(p=>({...p,requestedBy:e.target.value}))}>
                  <option value="">-- Select HOD --</option>
                  {employees.map(e=>(
                    <option key={e.empCode} value={e.empCode}>
                      {e.empCode} — {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div><label style={lbl}>Department *</label>
                <input {...F('department')} placeholder="Production" /></div>
              <div><label style={lbl}>Required By Date</label>
                <input type="date" {...F('requiredBy')} /></div>
            </div>
          </div>

          {/* Section 2 — Position Details */}
          <div style={{ background:'#F8F4F8',borderRadius:8,padding:16,
            border:'1px solid #E0D5E0' }}>
            <div style={{ fontSize:12,fontWeight:700,color:'#714B67',
              marginBottom:12 }}>🏭 Position Details</div>
            <div style={{ display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12,
              marginBottom:12 }}>
              <div><label style={lbl}>Position / Designation *</label>
                <input {...F('position')} placeholder="e.g. Ring Frame Operator" /></div>
              <div><label style={lbl}>Category</label>
                <select {...F('category')} style={{ ...inp,cursor:'pointer' }}>
                  {['Worker','Staff','Contractor'].map(c=><option key={c}>{c}</option>)}
                </select></div>
              <div><label style={lbl}>No. of Positions *</label>
                <input type="number" {...F('noOfPositions')} min={1} /></div>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              <div><label style={lbl}>Min Experience Required</label>
                <input {...F('minExperience')} placeholder="e.g. 2 years ring frame" /></div>
              <div><label style={lbl}>Skills Required</label>
                <input {...F('skillRequired')}
                  placeholder="e.g. Knitting, Quality inspection" /></div>
            </div>
          </div>

          {/* Section 3 — Reason */}
          <div style={{ background:'#F8F4F8',borderRadius:8,padding:16,
            border:'1px solid #E0D5E0' }}>
            <div style={{ fontSize:12,fontWeight:700,color:'#714B67',
              marginBottom:12 }}>📋 Reason for Requisition *</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,
              marginBottom:12 }}>
              {REASONS.map(r=>(
                <div key={r.value} onClick={()=>setForm(p=>({...p,reason:r.value}))}
                  style={{ padding:'10px 14px',borderRadius:8,cursor:'pointer',
                    border:`2px solid ${form.reason===r.value?'#714B67':'#E0D5E0'}`,
                    background:form.reason===r.value?'#EDE0EA':'#fff' }}>
                  <div style={{ fontWeight:700,fontSize:12,
                    color:form.reason===r.value?'#714B67':'#1C1C1C' }}>
                    {r.value}
                  </div>
                  <div style={{ fontSize:11,color:'#6C757D',marginTop:2 }}>
                    {r.label}
                  </div>
                </div>
              ))}
            </div>
            {form.reason==='REPLACEMENT' && (
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div><label style={lbl}>Replacing Employee Code</label>
                  <input {...F('replacingEmpCode')} placeholder="EMP001" /></div>
                <div><label style={lbl}>Replacing Employee Name</label>
                  <input {...F('replacingEmpName')} placeholder="Name" /></div>
              </div>
            )}
          </div>

          {/* Section 4 — Budget & JD */}
          <div style={{ background:'#F8F4F8',borderRadius:8,padding:16,
            border:'1px solid #E0D5E0' }}>
            <div style={{ fontSize:12,fontWeight:700,color:'#714B67',
              marginBottom:12 }}>💰 Budget & Job Description</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,
              marginBottom:12 }}>
              <div><label style={lbl}>Budget Min (₹/month)</label>
                <input type="number" {...F('budgetMin')}
                  placeholder="e.g. 12000" /></div>
              <div><label style={lbl}>Budget Max (₹/month)</label>
                <input type="number" {...F('budgetMax')}
                  placeholder="e.g. 18000" /></div>
            </div>
            <div><label style={lbl}>Job Description / Requirements</label>
              <textarea {...F('jobDescription')} rows={3}
                style={{ ...inp,resize:'vertical' }}
                placeholder="Detailed job description, duties, requirements..." /></div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px',borderTop:'1px solid #E0D5E0',
          display:'flex',justifyContent:'space-between',alignItems:'center',
          background:'#F8F7FA' }}>
          <div style={{ fontSize:11,color:'#6C757D' }}>
            💡 Save as Draft → edit later, or Submit directly to HR
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={onCancel}
              style={{ padding:'8px 20px',background:'#fff',color:'#6C757D',
                border:'1.5px solid #E0D5E0',borderRadius:6,
                fontSize:13,cursor:'pointer' }}>Cancel</button>
            <button onClick={()=>save(false)} disabled={saving}
              style={{ padding:'8px 20px',background:'#fff',color:'#714B67',
                border:'1.5px solid #714B67',borderRadius:6,
                fontSize:13,fontWeight:600,cursor:'pointer' }}>
              💾 Save Draft</button>
            <button onClick={()=>save(true)} disabled={saving}
              style={{ padding:'8px 24px',background:saving?'#9E7D96':'#714B67',
                color:'#fff',border:'none',borderRadius:6,fontSize:13,
                fontWeight:700,cursor:'pointer' }}>
              {saving?'⏳ Saving...':'📤 Save & Submit to HR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Action Modal (HR Review / MD Approve / Reject) ─────────
function ActionModal({ mrf, action, onSave, onCancel }) {
  const [remarks, setRemarks] = useState('')
  const [saving,  setSaving]  = useState(false)

  const CONFIG = {
    'hr-review': { title:'👀 HR Review — Forward to MD',
      btn:'Forward to MD', color:'#0C5460', bg:'#D1ECF1',
      placeholder:'HR remarks before forwarding to MD...' },
    'approve':   { title:'✅ MD Approval',
      btn:'Approve & Create Job', color:'#155724', bg:'#D4EDDA',
      placeholder:'Approval remarks (optional)...' },
    'reject':    { title:'❌ Reject MRF',
      btn:'Reject', color:'#721C24', bg:'#F8D7DA',
      placeholder:'Reason for rejection (mandatory)...' },
  }
  const cfg = CONFIG[action]||{}

  const doAction = async () => {
    if (action==='reject' && !remarks)
      return toast.error('Rejection reason required!')
    setSaving(true)
    try {
      const body = action==='hr-review' ? { hrRemarks:remarks }
        : action==='approve'            ? { approvalRemarks:remarks }
        : { rejectReason:remarks }
      const res  = await fetch(`${BASE_URL}/mrf/${mrf.id}/${action}`,
        { method:'POST',headers:authHdrs(),body:JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.job) toast.success(`${data.message} — ${data.job.jobNo}`)
      else toast.success(data.message)
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',
      display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000 }}>
      <div style={{ background:'#fff',borderRadius:10,width:520,
        overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:cfg.color,padding:'14px 20px',
          display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h3 style={{ color:'#fff',margin:0,fontFamily:'Syne,sans-serif',
            fontSize:15,fontWeight:700 }}>{cfg.title}</h3>
          <span onClick={onCancel}
            style={{ color:'#fff',cursor:'pointer',fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20 }}>
          <div style={{ background:cfg.bg,padding:'10px 14px',borderRadius:8,
            marginBottom:14,fontSize:12,color:cfg.color }}>
            <strong>{mrf.mrfNo}</strong> — {mrf.position} ({mrf.noOfPositions} positions)
            <br/>{mrf.department} | {mrf.category} | {mrf.reason}
          </div>
          {action==='approve' && (
            <div style={{ background:'#D4EDDA',padding:'10px 12px',borderRadius:6,
              fontSize:12,color:'#155724',marginBottom:14 }}>
              🎯 Approving will automatically create Job Opening and start recruitment!
            </div>
          )}
          <label style={lbl}>Remarks {action==='reject'?'*':'(optional)'}</label>
          <textarea value={remarks} onChange={e=>setRemarks(e.target.value)}
            style={{ ...inp,minHeight:80,resize:'vertical' }}
            placeholder={cfg.placeholder} />
        </div>
        <div style={{ padding:'12px 20px',borderTop:'1px solid #E0D5E0',
          display:'flex',justifyContent:'flex-end',gap:10,background:'#F8F7FA' }}>
          <button onClick={onCancel}
            style={{ padding:'8px 20px',background:'#fff',color:'#6C757D',
              border:'1.5px solid #E0D5E0',borderRadius:6,
              fontSize:13,cursor:'pointer' }}>Cancel</button>
          <button onClick={doAction} disabled={saving}
            style={{ padding:'8px 24px',background:saving?'#999':cfg.color,
              color:'#fff',border:'none',borderRadius:6,fontSize:13,
              fontWeight:700,cursor:'pointer' }}>
            {saving?'⏳ Processing...':cfg.btn}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────
export default function ManpowerRequisition() {
  const nav = useNavigate()
  const [mrfs,      setMrfs]      = useState([])
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null) // null | 'new' | mrf
  const [action,    setAction]    = useState(null) // {mrf, type}
  const [chipFilter,setChipFilter]= useState('All')
  const [expand,    setExpand]    = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes,eRes] = await Promise.all([
        fetch(`${BASE_URL}/mrf`, { headers:authHdrs2() }),
        fetch(`${BASE_URL}/employees`, { headers:authHdrs2() }),
      ])
      const mData = await mRes.json()
      const eData = await eRes.json()
      setMrfs(mData.data||[])
      setEmployees(eData.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchAll() }, [])

  const filtered = chipFilter==='All'
    ? mrfs : mrfs.filter(m=>m.status===chipFilter)

  const kpi = {
    draft:      mrfs.filter(m=>m.status==='DRAFT').length,
    submitted:  mrfs.filter(m=>m.status==='SUBMITTED').length,
    hrReview:   mrfs.filter(m=>m.status==='HR_REVIEW').length,
    jobCreated: mrfs.filter(m=>m.status==='JOB_CREATED').length,
  }

  return (
    <div style={{ padding:20,background:'#F8F7FA',minHeight:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',
        alignItems:'center',marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif',fontSize:18,
            fontWeight:800,color:'#1C1C1C',margin:0 }}>
            Manpower Requisition
          </h2>
          <p style={{ fontSize:12,color:'#6C757D',margin:'3px 0 0' }}>
            HOD raises → HR reviews → MD approves → Job Opening auto-created
          </p>
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={()=>nav('/hcm/jobs')}
            style={{ padding:'8px 16px',background:'#fff',color:'#714B67',
              border:'1.5px solid #714B67',borderRadius:6,fontSize:13,
              fontWeight:600,cursor:'pointer' }}>
            📋 Job Openings
          </button>
          <button onClick={()=>setModal('new')}
            style={{ padding:'8px 18px',background:'#714B67',color:'#fff',
              border:'none',borderRadius:6,fontSize:13,fontWeight:700,
              cursor:'pointer' }}>
            + New Requisition
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',
        gap:10,marginBottom:16 }}>
        {[
          { l:'Draft',       v:kpi.draft,      c:'#6C757D', bg:'#F0EEF0' },
          { l:'Pending HR',  v:kpi.submitted,  c:'#856404', bg:'#FFF3CD' },
          { l:'Pending MD',  v:kpi.hrReview,   c:'#0C5460', bg:'#D1ECF1' },
          { l:'Job Created', v:kpi.jobCreated, c:'#714B67', bg:'#EDE0EA' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg,borderRadius:8,
            padding:'12px 16px',border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:11,color:k.c,fontWeight:600,
              textTransform:'uppercase',letterSpacing:.5 }}>{k.l}</div>
            <div style={{ fontSize:28,fontWeight:800,color:k.c,
              fontFamily:'Syne,sans-serif' }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Chips */}
      <div style={{ display:'flex',gap:8,marginBottom:14,flexWrap:'wrap' }}>
        {['All','DRAFT','SUBMITTED','HR_REVIEW','JOB_CREATED','REJECTED'].map(s=>{
          const sc = STATUS[s]||{ bg:'#F0EEF0',color:'#6C757D',label:s }
          const cnt = s==='All'?mrfs.length:mrfs.filter(m=>m.status===s).length
          return (
            <div key={s} onClick={()=>setChipFilter(s)}
              style={{ padding:'5px 14px',borderRadius:20,cursor:'pointer',
                fontSize:12,fontWeight:600,
                border:`2px solid ${chipFilter===s?sc.color:'#E0D5E0'}`,
                background:chipFilter===s?sc.bg:'#fff',
                color:chipFilter===s?sc.color:'#6C757D' }}>
              {sc.icon||''} {sc.label||s} ({cnt})
            </div>
          )
        })}
      </div>

      {/* MRF List */}
      {loading ? (
        <div style={{ padding:40,textAlign:'center',color:'#6C757D' }}>⏳ Loading...</div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60,textAlign:'center',color:'#6C757D',
          background:'#fff',borderRadius:8,border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32,marginBottom:12 }}>📋</div>
          <div style={{ fontWeight:700 }}>No requisitions found</div>
          <div style={{ fontSize:12,marginTop:4 }}>
            Click "+ New Requisition" to raise manpower request
          </div>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {filtered.map(m=>{
            const sc = STATUS[m.status]||{}
            const isExpanded = expand===m.id
            return (
              <div key={m.id} style={{ background:'#fff',borderRadius:8,
                border:'1px solid #E0D5E0',overflow:'hidden',
                boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                {/* Header row */}
                <div style={{ padding:'14px 18px',display:'flex',
                  justifyContent:'space-between',alignItems:'center',
                  flexWrap:'wrap',gap:10 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:14 }}>
                    <span style={{ fontFamily:'DM Mono,monospace',fontSize:12,
                      fontWeight:700,color:'#714B67' }}>{m.mrfNo}</span>
                    <div>
                      <div style={{ fontWeight:700,fontSize:14,color:'#1C1C1C' }}>
                        {m.position}
                        <span style={{ marginLeft:8,fontSize:12,color:'#6C757D',
                          fontWeight:400 }}>× {m.noOfPositions}</span>
                      </div>
                      <div style={{ fontSize:11,color:'#6C757D',
                        marginTop:2,display:'flex',gap:10 }}>
                        <span>{m.department}</span>
                        <span>{m.category}</span>
                        <span>By: <strong>{m.requestedByName}</strong></span>
                        {m.requiredBy && (
                          <span>Required by: <strong>
                            {new Date(m.requiredBy).toLocaleDateString('en-IN')}
                          </strong></span>
                        )}
                        {m.budgetMin && (
                          <span>₹{Number(m.budgetMin).toLocaleString()}–
                            {Number(m.budgetMax||m.budgetMin).toLocaleString()}/mo</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex',alignItems:'center',
                    gap:8,flexWrap:'wrap' }}>
                    {/* Status badge */}
                    <span style={{ padding:'4px 12px',borderRadius:10,
                      fontSize:11,fontWeight:700,
                      background:sc.bg,color:sc.color }}>
                      {sc.icon} {sc.label}
                    </span>

                    {/* Reason badge */}
                    <span style={{ padding:'3px 10px',borderRadius:10,
                      fontSize:10,fontWeight:600,
                      background:'#F0EEF0',color:'#6C757D' }}>
                      {m.reason?.replace('_',' ')}
                    </span>

                    {/* Action buttons per status */}
                    {m.status==='DRAFT' && (
                      <>
                        <button onClick={()=>setModal(m)}
                          style={{ padding:'5px 12px',background:'#fff',
                            color:'#714B67',border:'1.5px solid #714B67',
                            borderRadius:5,fontSize:11,cursor:'pointer',
                            fontWeight:600 }}>✏️ Edit</button>
                        <button onClick={()=>setAction({mrf:m,type:'submit'})}
                          style={{ padding:'5px 12px',background:'#856404',
                            color:'#fff',border:'none',borderRadius:5,
                            fontSize:11,cursor:'pointer',fontWeight:600 }}>
                          📤 Submit to HR</button>
                      </>
                    )}
                    {m.status==='SUBMITTED' && (
                      <button onClick={()=>setAction({mrf:m,type:'hr-review'})}
                        style={{ padding:'5px 12px',background:'#0C5460',
                          color:'#fff',border:'none',borderRadius:5,
                          fontSize:11,cursor:'pointer',fontWeight:600 }}>
                        👀 HR Review & Forward</button>
                    )}
                    {m.status==='HR_REVIEW' && (
                      <>
                        <button onClick={()=>setAction({mrf:m,type:'approve'})}
                          style={{ padding:'5px 12px',background:'#28A745',
                            color:'#fff',border:'none',borderRadius:5,
                            fontSize:11,cursor:'pointer',fontWeight:700 }}>
                          ✅ MD Approve</button>
                        <button onClick={()=>setAction({mrf:m,type:'reject'})}
                          style={{ padding:'5px 12px',background:'#DC3545',
                            color:'#fff',border:'none',borderRadius:5,
                            fontSize:11,cursor:'pointer',fontWeight:600 }}>
                          ❌ Reject</button>
                      </>
                    )}
                    {m.status==='JOB_CREATED' && (
                      <button onClick={()=>nav('/hcm/jobs')}
                        style={{ padding:'5px 12px',background:'#EDE0EA',
                          color:'#714B67',border:'none',borderRadius:5,
                          fontSize:11,cursor:'pointer',fontWeight:600 }}>
                        🎯 View Job {m.jobNo}</button>
                    )}

                    <button onClick={()=>setExpand(isExpanded?null:m.id)}
                      style={{ padding:'5px 10px',background:'#fff',
                        color:'#6C757D',border:'1px solid #E0D5E0',
                        borderRadius:5,fontSize:11,cursor:'pointer' }}>
                      {isExpanded?'▲ Less':'▼ More'}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ borderTop:'1px solid #F0EEF0',padding:'14px 18px',
                    background:'#FDFBFD',display:'grid',
                    gridTemplateColumns:'1fr 1fr 1fr',gap:16 }}>
                    <div>
                      <div style={{ fontSize:11,fontWeight:700,color:'#714B67',
                        marginBottom:6,textTransform:'uppercase' }}>Position Details</div>
                      {[
                        ['Category', m.category],
                        ['Experience', m.minExperience||'—'],
                        ['Skills', m.skillRequired||'—'],
                        ['Budget', m.budgetMin?`₹${Number(m.budgetMin).toLocaleString()}–${Number(m.budgetMax||m.budgetMin).toLocaleString()}/mo`:'—'],
                      ].map(([l,v])=>(
                        <div key={l} style={{ fontSize:12,marginBottom:4 }}>
                          <span style={{ color:'#6C757D' }}>{l}: </span>
                          <strong>{v}</strong>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize:11,fontWeight:700,color:'#714B67',
                        marginBottom:6,textTransform:'uppercase' }}>Approval Trail</div>
                      <div style={{ fontSize:12,lineHeight:2 }}>
                        {m.requestedByName && <div>Raised by: <strong>{m.requestedByName}</strong></div>}
                        {m.hrReviewedBy && <div>HR: <strong>{m.hrReviewedBy}</strong> — {m.hrRemarks||'—'}</div>}
                        {m.approvedBy && <div style={{ color:'#155724' }}>
                          ✅ MD: <strong>{m.approvedBy}</strong></div>}
                        {m.rejectedBy && <div style={{ color:'#DC3545' }}>
                          ❌ Rejected by <strong>{m.rejectedBy}</strong>: {m.rejectReason}</div>}
                        {m.jobNo && <div style={{ color:'#714B67' }}>
                          🎯 Job: <strong>{m.jobNo}</strong></div>}
                      </div>
                    </div>
                    {m.jobDescription && (
                      <div>
                        <div style={{ fontSize:11,fontWeight:700,color:'#714B67',
                          marginBottom:6,textTransform:'uppercase' }}>Job Description</div>
                        <div style={{ fontSize:12,color:'#495057',
                          lineHeight:1.7,whiteSpace:'pre-wrap' }}>
                          {m.jobDescription}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* MRF Form Modal */}
      {modal && (
        <MRFModal mrf={modal==='new'?null:modal} employees={employees}
          onSave={()=>{ setModal(null); fetchAll() }}
          onCancel={()=>setModal(null)} />
      )}

      {/* Submit action (inline for submit) */}
      {action?.type==='submit' && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000 }}>
          <div style={{ background:'#fff',borderRadius:10,width:420,
            overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ background:'#856404',padding:'14px 20px',
              display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <h3 style={{ color:'#fff',margin:0,fontFamily:'Syne,sans-serif',
                fontSize:15,fontWeight:700 }}>📤 Submit to HR</h3>
              <span onClick={()=>setAction(null)}
                style={{ color:'#fff',cursor:'pointer',fontSize:20 }}>✕</span>
            </div>
            <div style={{ padding:20 }}>
              <div style={{ fontSize:13,color:'#495057',marginBottom:12 }}>
                Submit <strong>{action.mrf.mrfNo}</strong> — {action.mrf.position} ({action.mrf.noOfPositions} positions) to HR for review?
              </div>
            </div>
            <div style={{ padding:'12px 20px',borderTop:'1px solid #E0D5E0',
              display:'flex',justifyContent:'flex-end',gap:10,background:'#F8F7FA' }}>
              <button onClick={()=>setAction(null)}
                style={{ padding:'8px 20px',background:'#fff',color:'#6C757D',
                  border:'1.5px solid #E0D5E0',borderRadius:6,
                  fontSize:13,cursor:'pointer' }}>Cancel</button>
              <button onClick={async()=>{
                try {
                  const res = await fetch(`${BASE_URL}/mrf/${action.mrf.id}/submit`,
                    {method:'POST',headers:authHdrs(),body:'{}'})
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error)
                  toast.success(data.message)
                  setAction(null); fetchAll()
                } catch(e){ toast.error(e.message) }
              }} style={{ padding:'8px 24px',background:'#856404',
                color:'#fff',border:'none',borderRadius:6,fontSize:13,
                fontWeight:700,cursor:'pointer' }}>
                📤 Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HR Review / Approve / Reject modal */}
      {action && action.type!=='submit' && (
        <ActionModal mrf={action.mrf} action={action.type}
          onSave={()=>{ setAction(null); fetchAll() }}
          onCancel={()=>setAction(null)} />
      )}
    </div>
  )
}
