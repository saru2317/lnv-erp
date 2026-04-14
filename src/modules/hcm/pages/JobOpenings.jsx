import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const PRIORITY_COLOR = { High:'#DC3545', Medium:'#856404', Low:'#2874A6' }
const STATUS_CONFIG  = {
  Open:       { bg:'#D1ECF1', color:'#0C5460' },
  'In Progress':{ bg:'#FFF3CD', color:'#856404' },
  Filled:     { bg:'#D4EDDA', color:'#155724' },
  Closed:     { bg:'#E9ECEF', color:'#6C757D' },
}
const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box',
  fontFamily:'DM Sans,sans-serif' }

function JobModal({ job, onSave, onCancel }) {
  const isEdit = !!job?.id
  const [form, setForm] = useState(job || {
    title:'', department:'', category:'Worker', positions:1,
    priority:'Medium', closingDate:'', description:''
  })
  const [saving, setSaving] = useState(false)
  const F = f => ({ value:form[f]||'', style:inp,
    onChange:e=>setForm(p=>({...p,[f]:e.target.value})),
    onFocus:e=>e.target.style.borderColor='#714B67',
    onBlur:e=>e.target.style.borderColor='#E0D5E0' })
  const save = async () => {
    if (!form.title||!form.department) return toast.error('Title and Department required!')
    setSaving(true)
    try {
      const url    = isEdit?`${BASE_URL}/recruitment/jobs/${job.id}`:`${BASE_URL}/recruitment/jobs`
      const method = isEdit?'PATCH':'POST'
      const res    = await fetch(url,{method,headers:authHdrs(),body:JSON.stringify(form)})
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(isEdit?'Updated!':data.message)
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
            fontSize:15,fontWeight:700 }}>
            {isEdit?`Edit — ${job.jobNo}`:'+ New Job Opening'}</h3>
          <span onClick={onCancel} style={{ color:'#fff',cursor:'pointer',fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20,display:'flex',flexDirection:'column',gap:12 }}>
          <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
            display:'block',marginBottom:3 }}>Position Title *</label>
            <input {...F('title')} placeholder="e.g. Ring Frame Operator" /></div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Department *</label>
              <input {...F('department')} placeholder="Production" /></div>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Category</label>
              <select {...F('category')}>
                {['Worker','Staff','Contractor'].map(c=><option key={c}>{c}</option>)}
              </select></div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>No. of Positions</label>
              <input type="number" {...F('positions')} min={1} /></div>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Priority</label>
              <select {...F('priority')}>
                {['High','Medium','Low'].map(p=><option key={p}>{p}</option>)}
              </select></div>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Closing Date</label>
              <input type="date" {...F('closingDate')} /></div>
          </div>
          <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
            display:'block',marginBottom:3 }}>Job Description</label>
            <textarea {...F('description')} rows={3}
              style={{ ...inp,resize:'vertical' }}
              placeholder="Key responsibilities and requirements..." /></div>
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
            {saving?'⏳ Saving...':'💾 Save'}</button>
        </div>
      </div>
    </div>
  )
}

export default function JobOpenings() {
  const nav = useNavigate()
  const [jobs,    setJobs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null) // null | 'new' | job obj
  const [chip,    setChip]    = useState('All')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/recruitment/jobs`, { headers:authHdrs2() })
      const data = await res.json()
      if (res.ok) setJobs(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchJobs() }, [])

  const filtered = chip==='All' ? jobs : jobs.filter(j=>j.status===chip)

  const kpi = {
    open:   jobs.filter(j=>j.status==='Open').length,
    filled: jobs.filter(j=>j.status==='Filled').length,
    total:  jobs.reduce((s,j)=>s+(j._count?.candidates||0),0),
    high:   jobs.filter(j=>j.priority==='High'&&j.status==='Open').length,
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Job Openings <small>Recruitment Pipeline</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm"
            onClick={()=>nav('/hcm/candidates')}>👥 Candidates</button>
          <button className="btn btn-p sd-bsm"
            onClick={()=>setModal('new')}>+ New Position</button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',
        gap:12,marginBottom:16 }}>
        {[
          { l:'Open Positions', v:kpi.open,   c:'#714B67',bg:'#EDE0EA' },
          { l:'High Priority',  v:kpi.high,   c:'#DC3545',bg:'#F8D7DA' },
          { l:'Total Candidates',v:kpi.total, c:'#0C5460',bg:'#D1ECF1' },
          { l:'Filled',         v:kpi.filled, c:'#155724',bg:'#D4EDDA' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg,borderRadius:8,
            padding:'12px 16px',border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10,color:k.c,fontWeight:700,
              textTransform:'uppercase',letterSpacing:.5 }}>{k.l}</div>
            <div style={{ fontSize:28,fontWeight:800,color:k.c,
              fontFamily:'Syne,sans-serif' }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="pp-chips">
        {['All','Open','In Progress','Filled','Closed'].map(c=>(
          <div key={c} className={`pp-chip${chip===c?' on':''}`}
            onClick={()=>setChip(c)}>
            {c} <span>{c==='All'?jobs.length:jobs.filter(j=>j.status===c).length}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding:40,textAlign:'center',color:'#6C757D' }}>⏳ Loading...</div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead style={{ background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Job ID','Position','Dept','Type','Positions','Candidates',
                  'Closing Date','Priority','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 12px',fontSize:10,fontWeight:700,
                    color:'#6C757D',textAlign:'left',textTransform:'uppercase',
                    letterSpacing:.3,whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((j,i)=>{
                const sc = STATUS_CONFIG[j.status]||STATUS_CONFIG['Open']
                return (
                  <tr key={j.id} style={{ borderBottom:'1px solid #F0EEF0',
                    background:i%2===0?'#fff':'#FDFBFD',cursor:'pointer' }}
                    onClick={()=>nav('/hcm/candidates')}>
                    <td style={{ padding:'10px 12px',fontFamily:'DM Mono,monospace',
                      fontWeight:700,color:'#714B67',fontSize:12 }}>{j.jobNo}</td>
                    <td style={{ padding:'10px 12px',fontWeight:700,fontSize:13 }}>
                      {j.title}</td>
                    <td style={{ padding:'10px 12px',fontSize:12 }}>{j.department}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ fontSize:11,fontWeight:700,
                        color:j.category==='Worker'?'#E06F39':'#2874A6' }}>
                        {j.category}</span></td>
                    <td style={{ padding:'10px 12px',textAlign:'center',
                      fontWeight:700 }}>
                      <span style={{ color:(j.filled||0)>=(j.positions||1)?'#155724':'#856404' }}>
                        {j.filled||0}/{j.positions}
                      </span></td>
                    <td style={{ padding:'10px 12px',textAlign:'center',
                      fontWeight:700,color:'#714B67' }}>
                      {j._count?.candidates||0}</td>
                    <td style={{ padding:'10px 12px',fontSize:12,color:'#6C757D' }}>
                      {j.closingDate
                        ? new Date(j.closingDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ fontWeight:700,fontSize:12,
                        color:PRIORITY_COLOR[j.priority]||'#6C757D' }}>
                        {j.priority}</span></td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ padding:'3px 10px',borderRadius:10,
                        fontSize:11,fontWeight:700,
                        background:sc.bg,color:sc.color }}>{j.status}</span>
                    </td>
                    <td style={{ padding:'10px 12px' }}
                      onClick={e=>e.stopPropagation()}>
                      <div style={{ display:'flex',gap:4 }}>
                        <button className="btn-xs"
                          onClick={()=>nav('/hcm/candidates')}>Pipeline</button>
                        <button className="btn-xs pri"
                          onClick={()=>setModal(j)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length===0 && !loading && (
                <tr><td colSpan={10} style={{ padding:40,textAlign:'center',
                  color:'#6C757D' }}>No job openings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <JobModal job={modal==='new'?null:modal}
          onSave={()=>{ setModal(null); fetchJobs() }}
          onCancel={()=>setModal(null)} />
      )}
    </div>
  )
}
