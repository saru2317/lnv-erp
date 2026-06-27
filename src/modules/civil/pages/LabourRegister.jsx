import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'
const toDay = () => new Date().toISOString().slice(0,10)

const inp = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block',
  marginBottom:3, textTransform:'uppercase', letterSpacing:'0.5px' }

const TRADES = ['Mason','Carpenter','Plumber','Electrician','Painter',
  'Steel Fixer','Helper / Unskilled','Supervisor','Contractor Labour']

const TABS = ['attendance','workers','supervisor']

export default function LabourRegister() {
  const nav = useNavigate()
  const [tab,        setTab]        = useState('attendance')
  const [projects,   setProjects]   = useState([])
  const [workers,    setWorkers]    = useState([])
  const [attendance, setAttendance] = useState([])
  const [visits,     setVisits]     = useState([])
  const [selProject, setSelProject] = useState('')
  const [loading,    setLoading]    = useState(false)

  // Modals
  const [showAttModal, setShowAttModal] = useState(false)
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [showVisitModal,  setShowVisitModal]  = useState(false)
  const [saving, setSaving] = useState(false)

  // Worker form
  const [workerForm, setWorkerForm] = useState({
    name:'', trade:'Mason', phone:'', dailyRate:'', workerType:'DAILY', contractorName:''
  })

  // Attendance form — direct entry
  const [attDate, setAttDate] = useState(toDay())
  const [attRows, setAttRows] = useState([])

  // Supervisor visit form
  const [visitForm, setVisitForm] = useState({
    date: toDay(), supervisorName:'', supervisorPhone:'',
    projectId:'', timeIn:'', timeOut:'', hoursSpent:'',
    activitiesReviewed:'', issuesFound:'', instructions:'', nextVisitDate:''
  })
  // Multi-project visit rows (same day, multiple sites)
  const [visitRows, setVisitRows] = useState([
    { projectId:'', timeIn:'', timeOut:'', hoursSpent:'', activitiesReviewed:'', issuesFound:'', instructions:'' }
  ])

  useEffect(()=>{
    fetch(`${BASE}/civil/projects`,{headers:hdr2()}).then(r=>r.json()).then(d=>setProjects(d.data||[])).catch(()=>{})
    fetch(`${BASE}/civil/workers`, {headers:hdr2()}).then(r=>r.json()).then(d=>setWorkers(d.data||[])).catch(()=>{})
  },[])

  const loadAttendance = useCallback(async (pid)=>{
    if (!pid) return
    setLoading(true)
    const params = new URLSearchParams({ projectId:pid })
    const r = await fetch(`${BASE}/civil/attendance?${params}`,{headers:hdr2()})
    const d = await r.json()
    setAttendance(d.data||[])
    setLoading(false)
  },[])

  const loadVisits = useCallback(async (pid)=>{
    if (!pid) return
    const params = new URLSearchParams({ projectId:pid })
    const r = await fetch(`${BASE}/civil/supervisor-visits?${params}`,{headers:hdr2()})
    const d = await r.json()
    setVisits(d.data||[])
  },[])

  useEffect(()=>{
    if (selProject) { loadAttendance(selProject); loadVisits(selProject) }
  },[selProject, loadAttendance, loadVisits])

  // Open attendance modal — pre-fill workers
  const openAttModal = () => {
    setAttRows(workers.map(w=>({
      workerId:  w.id,
      workerCode:w.workerCode,
      name:      w.name,
      trade:     w.trade,
      present:   true,
      hoursWorked:'8',
      overtimeHrs:'0',
      dailyRate:  Number(w.dailyRate||0),
    })))
    setShowAttModal(true)
  }

  const setAttRow = (idx, k, v) => setAttRows(prev=>{
    const n = [...prev]
    n[idx] = { ...n[idx], [k]:v }
    return n
  })

  const saveAttendance = async () => {
    if (!selProject)  return toast.error('Select a project first')
    if (!attDate)     return toast.error('Select date')
    const entries = attRows.map(r=>({
      workerId:   r.workerId,
      projectId:  selProject,
      hoursWorked:parseFloat(r.hoursWorked||8),
      overtimeHrs:parseFloat(r.overtimeHrs||0),
      dailyRate:  parseFloat(r.dailyRate||0),
      present:    r.present,
    }))
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/civil/attendance`,{method:'POST',headers:hdr(),
        body:JSON.stringify({ date:attDate, entries })})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ Attendance saved — ${entries.filter(e=>e.present).length} workers marked present`)
      setShowAttModal(false); loadAttendance(selProject)
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  // Save worker
  const saveWorker = async () => {
    if (!workerForm.name.trim()) return toast.error('Name required')
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/civil/workers`,{method:'POST',headers:hdr(),body:JSON.stringify(workerForm)})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ ${d.data.workerCode} — ${d.data.name} added!`)
      setWorkers(prev=>[d.data,...prev])
      setShowWorkerModal(false)
      setWorkerForm({ name:'', trade:'Mason', phone:'', dailyRate:'', workerType:'DAILY', contractorName:'' })
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  // Save supervisor visits (multi-project in one day)
  const saveVisits = async () => {
    if (!visitForm.supervisorName.trim()) return toast.error('Supervisor name required')
    const validRows = visitRows.filter(v=>v.projectId)
    if (validRows.length === 0) return toast.error('Add at least one project visit')
    setSaving(true)
    try {
      const visits = validRows.map(v=>({
        date:               visitForm.date,
        supervisorName:     visitForm.supervisorName,
        supervisorPhone:    visitForm.supervisorPhone||null,
        projectId:          parseInt(v.projectId),
        timeIn:             v.timeIn||null,
        timeOut:            v.timeOut||null,
        hoursSpent:         parseFloat(v.hoursSpent||0),
        activitiesReviewed: v.activitiesReviewed||null,
        issuesFound:        v.issuesFound||null,
        instructions:       v.instructions||null,
        nextVisitDate:      visitForm.nextVisitDate ? new Date(visitForm.nextVisitDate) : null,
      }))
      const r = await fetch(`${BASE}/civil/supervisor-visits`,{method:'POST',headers:hdr(),
        body:JSON.stringify({ visits })})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ ${visits.length} site visit(s) logged for ${visitForm.supervisorName}!`)
      setShowVisitModal(false)
      setVisitRows([{ projectId:'', timeIn:'', timeOut:'', hoursSpent:'', activitiesReviewed:'', issuesFound:'', instructions:'' }])
      if (selProject) loadVisits(selProject)
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const setVRow = (idx, k, v) => setVisitRows(prev=>{
    const n=[...prev]; n[idx]={...n[idx],[k]:v}
    // Auto calc hours
    if ((k==='timeIn'||k==='timeOut') && n[idx].timeIn && n[idx].timeOut) {
      const [h1,m1] = n[idx].timeIn.split(':').map(Number)
      const [h2,m2] = n[idx].timeOut.split(':').map(Number)
      const hrs = ((h2*60+m2)-(h1*60+m1))/60
      n[idx].hoursSpent = hrs > 0 ? hrs.toFixed(1) : '0'
    }
    return n
  })

  // Attendance summary by date
  const byDate = attendance.reduce((acc,a)=>{
    const date = new Date(a.date).toISOString().slice(0,10)
    if (!acc[date]) acc[date] = { date, count:0, amount:0 }
    if (a.present) { acc[date].count++; acc[date].amount += Number(a.totalAmount||0) }
    return acc
  },{})

  const presentToday = attRows.filter(r=>r.present).length
  const totalAttAmt  = attRows.reduce((s,r)=>s+( r.present ? parseFloat(r.dailyRate||0) : 0 ),0)

  return (
    <div style={{ background:'#F8F5F8', minHeight:'100vh', fontFamily:'DM Sans,sans-serif' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        background:'#fff', borderBottom:'1px solid #E8E0E8', padding:'10px 16px', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'#6E2C00' }}>👷 Labour Register</div>
          <div style={{ fontSize:11, color:'#888' }}>{workers.length} workers in pool</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setShowWorkerModal(true)}
            style={{ padding:'7px 14px', background:'#FDF2E9', border:'1px solid #6E2C00',
              borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:600, color:'#6E2C00' }}>
            + Add Worker
          </button>
          <button onClick={openAttModal}
            style={{ padding:'7px 14px', background:'#1E8449', color:'#fff',
              border:'none', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:700 }}>
            ✅ Mark Attendance
          </button>
          <button onClick={()=>setShowVisitModal(true)}
            style={{ padding:'7px 14px', background:'#1A5276', color:'#fff',
              border:'none', borderRadius:5, cursor:'pointer', fontSize:12, fontWeight:700 }}>
            📍 Log Supervisor Visit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'#fff', border:'1px solid #E8E0E8',
        borderRadius:8, padding:4, marginBottom:12, width:'fit-content' }}>
        {[
          ['attendance','📋 Attendance Register'],
          ['workers',   '👤 Worker Pool'],
          ['supervisor','📍 Supervisor Visits'],
        ].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:'7px 18px', border:'none', borderRadius:6, cursor:'pointer',
              fontWeight:700, fontSize:12, background:tab===k?'#6E2C00':'transparent',
              color:tab===k?'#fff':'#888' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Project selector for attendance/visits */}
      {(tab==='attendance' || tab==='supervisor') && (
        <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8,
          padding:'10px 14px', marginBottom:12 }}>
          <select value={selProject} onChange={e=>setSelProject(e.target.value)}
            style={{ width:420, padding:'8px 12px', border:'1.5px solid #E8D5C4',
              borderRadius:6, fontSize:13, background:'#FFFAF7', outline:'none' }}>
            <option value=''>— Select Project —</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
          </select>
        </div>
      )}

      {/* ══ ATTENDANCE TAB ══ */}
      {tab==='attendance' && (
        <div>
          {/* Date-wise summary cards */}
          {Object.keys(byDate).length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',
              gap:10, marginBottom:14 }}>
              {Object.values(byDate).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14).map(d=>(
                <div key={d.date} style={{ background:'#fff', borderRadius:8, padding:'10px 14px',
                  border:'1px solid #E8E0E8', borderLeft:'3px solid #6E2C00' }}>
                  <div style={{ fontSize:11, color:'#888' }}>{fmtD(d.date)}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:'#6E2C00' }}>{d.count} workers</div>
                  <div style={{ fontSize:12, color:'#1E8449', fontWeight:600 }}>{fmtC(d.amount)}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, overflow:'hidden' }}>
            {!selProject ? (
              <div style={{ padding:40, textAlign:'center', color:'#aaa' }}>Select a project to view attendance</div>
            ) : loading ? (
              <div style={{ padding:40, textAlign:'center', color:'#aaa' }}>⏳ Loading...</div>
            ) : attendance.length===0 ? (
              <div style={{ padding:50, textAlign:'center' }}>
                <div style={{ fontSize:36, marginBottom:12 }}>👷</div>
                <div style={{ fontSize:15, fontWeight:600, color:'#6E2C00', marginBottom:8 }}>No attendance yet</div>
                <button onClick={openAttModal}
                  style={{ padding:'9px 20px', background:'#1E8449', color:'#fff',
                    border:'none', borderRadius:6, cursor:'pointer', fontWeight:700 }}>
                  ✅ Mark Today's Attendance
                </button>
              </div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#6E2C00', color:'#fff' }}>
                    {['Date','Worker','Trade','Present','Hours','OT Hrs','Rate','Amount'].map(h=>(
                      <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a,i)=>(
                    <tr key={a.id} style={{ background:i%2===0?'#fff':'#FDF9F7',
                      borderBottom:'1px solid #F5EDE0' }}>
                      <td style={{ padding:'9px 12px', fontWeight:600 }}>{fmtD(a.date)}</td>
                      <td style={{ padding:'9px 12px' }}>{a.worker?.name||'—'}</td>
                      <td style={{ padding:'9px 12px', color:'#555', fontSize:11 }}>{a.worker?.trade||'—'}</td>
                      <td style={{ padding:'9px 12px', textAlign:'center', fontSize:16 }}>
                        {a.present?'✅':'❌'}
                      </td>
                      <td style={{ padding:'9px 12px', textAlign:'center' }}>{a.hoursWorked}</td>
                      <td style={{ padding:'9px 12px', textAlign:'center',
                        color:Number(a.overtimeHrs)>0?'#D35400':'#ccc' }}>
                        {Number(a.overtimeHrs)>0?a.overtimeHrs:'—'}
                      </td>
                      <td style={{ padding:'9px 12px', textAlign:'right' }}>{fmtC(a.dailyRate)}</td>
                      <td style={{ padding:'9px 12px', textAlign:'right',
                        fontWeight:700, color:'#1E8449' }}>{fmtC(a.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══ WORKER POOL TAB ══ */}
      {tab==='workers' && (
        <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, overflow:'hidden' }}>
          {workers.length===0 ? (
            <div style={{ padding:50, textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>👷</div>
              <div style={{ fontSize:15, fontWeight:600, color:'#6E2C00', marginBottom:8 }}>No workers yet</div>
              <button onClick={()=>setShowWorkerModal(true)}
                style={{ padding:'9px 20px', background:'#6E2C00', color:'#fff',
                  border:'none', borderRadius:6, cursor:'pointer', fontWeight:700 }}>
                + Add First Worker
              </button>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#6E2C00', color:'#fff' }}>
                  {['Code','Name','Trade','Type','Phone','Daily Rate'].map(h=>(
                    <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workers.map((w,i)=>(
                  <tr key={w.id} style={{ background:i%2===0?'#fff':'#FDF9F7', borderBottom:'1px solid #F5EDE0' }}>
                    <td style={{ padding:'9px 12px', fontFamily:'monospace', fontSize:10,
                      color:'#6E2C00', fontWeight:700 }}>{w.workerCode}</td>
                    <td style={{ padding:'9px 12px', fontWeight:700 }}>{w.name}</td>
                    <td style={{ padding:'9px 12px', color:'#555' }}>{w.trade}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                        background:w.workerType==='MONTHLY'?'#EBF5FB':w.workerType==='CONTRACTOR'?'#FEF9E7':'#E8F5E9',
                        color:w.workerType==='MONTHLY'?'#1A5276':w.workerType==='CONTRACTOR'?'#B8860B':'#1E8449' }}>
                        {w.workerType}
                      </span>
                    </td>
                    <td style={{ padding:'9px 12px', color:'#555' }}>{w.phone||'—'}</td>
                    <td style={{ padding:'9px 12px', fontWeight:700, color:'#1E8449' }}>
                      {fmtC(w.dailyRate)}/day
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ══ SUPERVISOR VISITS TAB ══ */}
      {tab==='supervisor' && (
        <div style={{ background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, overflow:'hidden' }}>
          {!selProject ? (
            <div style={{ padding:40, textAlign:'center', color:'#aaa' }}>Select a project to view visits</div>
          ) : visits.length===0 ? (
            <div style={{ padding:50, textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📍</div>
              <div style={{ fontSize:15, fontWeight:600, color:'#6E2C00', marginBottom:8 }}>No supervisor visits logged</div>
              <button onClick={()=>setShowVisitModal(true)}
                style={{ padding:'9px 20px', background:'#1A5276', color:'#fff',
                  border:'none', borderRadius:6, cursor:'pointer', fontWeight:700 }}>
                📍 Log First Visit
              </button>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#1A5276', color:'#fff' }}>
                  {['Date','Supervisor','Time In','Time Out','Hours','Activities Reviewed','Issues Found','Instructions'].map(h=>(
                    <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visits.map((v,i)=>(
                  <tr key={v.id} style={{ background:i%2===0?'#fff':'#EBF5FB',
                    borderBottom:'1px solid #D6EAF8' }}>
                    <td style={{ padding:'9px 12px', fontWeight:600 }}>{fmtD(v.date)}</td>
                    <td style={{ padding:'9px 12px', fontWeight:700, color:'#1A5276' }}>{v.supervisorName}</td>
                    <td style={{ padding:'9px 12px', color:'#555' }}>{v.timeIn||'—'}</td>
                    <td style={{ padding:'9px 12px', color:'#555' }}>{v.timeOut||'—'}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center', fontWeight:700,
                      color:'#1A5276' }}>{v.hoursSpent ? `${v.hoursSpent} hrs` : '—'}</td>
                    <td style={{ padding:'9px 12px', fontSize:11, color:'#555',
                      maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {v.activitiesReviewed||'—'}
                    </td>
                    <td style={{ padding:'9px 12px', fontSize:11,
                      color:v.issuesFound?'#C0392B':'#888' }}>
                      {v.issuesFound||'—'}
                    </td>
                    <td style={{ padding:'9px 12px', fontSize:11, color:'#555',
                      maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {v.instructions||'—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ══ MARK ATTENDANCE MODAL ══ */}
      {showAttModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:12, width:720, maxHeight:'85vh',
            overflowY:'auto', boxShadow:'0 16px 48px rgba(0,0,0,.25)' }}>

            {/* Modal Header */}
            <div style={{ background:'#1E8449', padding:'14px 20px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>✅ Mark Attendance</div>
                <div style={{ fontSize:12, color:'#A9DFBF' }}>
                  {projects.find(p=>String(p.id)===String(selProject))?.projectName || '—'}
                </div>
              </div>
              <button onClick={()=>setShowAttModal(false)}
                style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff',
                  borderRadius:6, padding:'5px 12px', cursor:'pointer', fontWeight:700 }}>✕</button>
            </div>

            <div style={{ padding:20 }}>
              {/* Date picker */}
              <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1 }}>
                  <label style={lbl}>Attendance Date *</label>
                  <input type='date' value={attDate} onChange={e=>setAttDate(e.target.value)}
                    style={{ ...inp, width:200, fontSize:14, fontWeight:700 }} />
                </div>
                <div style={{ background:'#E8F5E9', borderRadius:8, padding:'8px 16px',
                  fontSize:13, fontWeight:700, color:'#1E8449' }}>
                  Present: {presentToday} workers · {fmtC(totalAttAmt)}
                </div>
              </div>

              {workers.length===0 ? (
                <div style={{ textAlign:'center', padding:30, color:'#aaa' }}>
                  No workers in pool. Add workers first.
                </div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#1E8449', color:'#fff' }}>
                      {['Present','Worker','Trade','Hours','OT Hrs','Rate (₹)','Amount'].map(h=>(
                        <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attRows.map((row, idx)=>(
                      <tr key={idx} style={{ background:row.present?'#fff':'#FFF5F5',
                        borderBottom:'1px solid #E8F5E9', opacity:row.present?1:0.5 }}>
                        <td style={{ padding:'8px 12px' }}>
                          <input type='checkbox' checked={row.present}
                            onChange={e=>setAttRow(idx,'present',e.target.checked)}
                            style={{ width:18, height:18, cursor:'pointer', accentColor:'#1E8449' }} />
                        </td>
                        <td style={{ padding:'8px 12px', fontWeight:700 }}>{row.name}</td>
                        <td style={{ padding:'8px 12px', color:'#555', fontSize:11 }}>{row.trade}</td>
                        <td style={{ padding:'8px 12px' }}>
                          <input type='number' defaultValue={row.hoursWorked}
                            onBlur={e=>setAttRow(idx,'hoursWorked',e.target.value)}
                            disabled={!row.present}
                            style={{ width:60, padding:'5px 8px', border:'1px solid #ddd',
                              borderRadius:4, fontSize:12, textAlign:'center', outline:'none' }} />
                        </td>
                        <td style={{ padding:'8px 12px' }}>
                          <input type='number' defaultValue={row.overtimeHrs}
                            onBlur={e=>setAttRow(idx,'overtimeHrs',e.target.value)}
                            disabled={!row.present}
                            style={{ width:60, padding:'5px 8px', border:'1px solid #ddd',
                              borderRadius:4, fontSize:12, textAlign:'center', outline:'none' }} />
                        </td>
                        <td style={{ padding:'8px 12px' }}>
                          <input type='number' defaultValue={row.dailyRate}
                            onBlur={e=>setAttRow(idx,'dailyRate',e.target.value)}
                            disabled={!row.present}
                            style={{ width:80, padding:'5px 8px', border:'1px solid #ddd',
                              borderRadius:4, fontSize:12, textAlign:'right', outline:'none' }} />
                        </td>
                        <td style={{ padding:'8px 12px', fontWeight:700,
                          color:row.present?'#1E8449':'#ccc' }}>
                          {row.present ? fmtC(parseFloat(row.dailyRate||0)) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
                <button onClick={()=>setShowAttModal(false)}
                  style={{ padding:'8px 18px', background:'#f0f0f0', border:'none',
                    borderRadius:5, cursor:'pointer', fontWeight:600 }}>Cancel</button>
                <button onClick={saveAttendance} disabled={saving}
                  style={{ padding:'8px 24px', background:'#1E8449', color:'#fff',
                    border:'none', borderRadius:5, cursor:'pointer', fontWeight:700 }}>
                  {saving ? '⏳...' : '✅ Save Attendance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD WORKER MODAL ══ */}
      {showWorkerModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:24, width:460,
            boxShadow:'0 16px 48px rgba(0,0,0,.25)' }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#6E2C00', marginBottom:18 }}>👷 Add Worker to Pool</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Worker Name *</label>
                <input defaultValue={workerForm.name} onBlur={e=>setWorkerForm(f=>({...f,name:e.target.value}))}
                  placeholder='Full name' style={inp} />
              </div>
              <div>
                <label style={lbl}>Trade *</label>
                <select value={workerForm.trade} onChange={e=>setWorkerForm(f=>({...f,trade:e.target.value}))} style={inp}>
                  {TRADES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Worker Type</label>
                <select value={workerForm.workerType} onChange={e=>setWorkerForm(f=>({...f,workerType:e.target.value}))} style={inp}>
                  <option value='DAILY'>Daily Wage</option>
                  <option value='MONTHLY'>Monthly</option>
                  <option value='CONTRACTOR'>Contractor</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input defaultValue={workerForm.phone} onBlur={e=>setWorkerForm(f=>({...f,phone:e.target.value}))}
                  placeholder='+91 99999 99999' style={inp} />
              </div>
              <div>
                <label style={lbl}>Daily Rate (₹)</label>
                <input type='number' defaultValue={workerForm.dailyRate}
                  onBlur={e=>setWorkerForm(f=>({...f,dailyRate:e.target.value}))}
                  placeholder='650' style={inp} />
              </div>
              {workerForm.workerType==='CONTRACTOR' && (
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={lbl}>Contractor Company Name</label>
                  <input defaultValue={workerForm.contractorName}
                    onBlur={e=>setWorkerForm(f=>({...f,contractorName:e.target.value}))}
                    placeholder='Contractor company name' style={inp} />
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18 }}>
              <button onClick={()=>setShowWorkerModal(false)}
                style={{ padding:'7px 16px', background:'#f0f0f0', border:'none',
                  borderRadius:5, cursor:'pointer', fontWeight:600 }}>Cancel</button>
              <button onClick={saveWorker} disabled={saving}
                style={{ padding:'7px 22px', background:'#6E2C00', color:'#fff',
                  border:'none', borderRadius:5, cursor:'pointer', fontWeight:700 }}>
                {saving?'⏳...':'💾 Add Worker'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SUPERVISOR VISIT MODAL ══ */}
      {showVisitModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:12, width:780, maxHeight:'88vh',
            overflowY:'auto', boxShadow:'0 16px 48px rgba(0,0,0,.25)' }}>

            <div style={{ background:'#1A5276', padding:'14px 20px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>📍 Log Supervisor Site Visit</div>
                <div style={{ fontSize:12, color:'#AED6F1' }}>One supervisor — multiple sites in one day</div>
              </div>
              <button onClick={()=>setShowVisitModal(false)}
                style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff',
                  borderRadius:6, padding:'5px 12px', cursor:'pointer', fontWeight:700 }}>✕</button>
            </div>

            <div style={{ padding:20 }}>
              {/* Supervisor details */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:14, marginBottom:20 }}>
                <div style={{ gridColumn:'1/3' }}>
                  <label style={lbl}>Supervisor Name *</label>
                  <input defaultValue={visitForm.supervisorName}
                    onBlur={e=>setVisitForm(f=>({...f,supervisorName:e.target.value}))}
                    placeholder='Site engineer / supervisor name' style={inp} />
                </div>
                <div>
                  <label style={lbl}>Phone</label>
                  <input defaultValue={visitForm.supervisorPhone}
                    onBlur={e=>setVisitForm(f=>({...f,supervisorPhone:e.target.value}))}
                    placeholder='+91 99999 99999' style={inp} />
                </div>
                <div>
                  <label style={lbl}>Visit Date *</label>
                  <input type='date' value={visitForm.date}
                    onChange={e=>setVisitForm(f=>({...f,date:e.target.value}))} style={inp} />
                </div>
              </div>

              {/* Site Visit Rows */}
              <div style={{ fontSize:13, fontWeight:700, color:'#1A5276', marginBottom:10 }}>
                📍 Sites Visited Today
              </div>

              {visitRows.map((row, idx)=>(
                <div key={idx} style={{ background:'#EBF5FB', borderRadius:10, padding:14,
                  marginBottom:12, border:'1px solid #AED6F1' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#1A5276' }}>
                      🏗️ Site Visit {idx+1}
                    </div>
                    {visitRows.length > 1 && (
                      <button onClick={()=>setVisitRows(prev=>prev.filter((_,i)=>i!==idx))}
                        style={{ padding:'2px 8px', background:'#FDEDEC', color:'#C0392B',
                          border:'none', borderRadius:4, cursor:'pointer', fontSize:11 }}>✕ Remove</button>
                    )}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:12, marginBottom:10 }}>
                    <div>
                      <label style={lbl}>Project / Site *</label>
                      <select value={row.projectId} onChange={e=>setVRow(idx,'projectId',e.target.value)}
                        style={inp}>
                        <option value=''>— Select Project —</option>
                        {projects.map(p=><option key={p.id} value={p.id}>{p.projectCode} — {p.projectName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Time In</label>
                      <input type='time' value={row.timeIn}
                        onChange={e=>setVRow(idx,'timeIn',e.target.value)} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Time Out</label>
                      <input type='time' value={row.timeOut}
                        onChange={e=>setVRow(idx,'timeOut',e.target.value)} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Hours Spent</label>
                      <input type='number' value={row.hoursSpent}
                        onChange={e=>setVRow(idx,'hoursSpent',e.target.value)}
                        placeholder='Auto' style={{ ...inp, fontWeight:700, color:'#1A5276' }} />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                    <div>
                      <label style={lbl}>Activities Reviewed</label>
                      <input defaultValue={row.activitiesReviewed}
                        onBlur={e=>setVRow(idx,'activitiesReviewed',e.target.value)}
                        placeholder='e.g. Foundation, Column casting' style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Issues Found</label>
                      <input defaultValue={row.issuesFound}
                        onBlur={e=>setVRow(idx,'issuesFound',e.target.value)}
                        placeholder='Any quality / safety issues' style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Instructions Given</label>
                      <input defaultValue={row.instructions}
                        onBlur={e=>setVRow(idx,'instructions',e.target.value)}
                        placeholder='Instructions to site team' style={inp} />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add another site */}
              <button onClick={()=>setVisitRows(prev=>[...prev,
                { projectId:'', timeIn:'', timeOut:'', hoursSpent:'', activitiesReviewed:'', issuesFound:'', instructions:'' }])}
                style={{ padding:'7px 16px', background:'#EBF5FB', color:'#1A5276',
                  border:'1.5px dashed #1A5276', borderRadius:6, cursor:'pointer',
                  fontWeight:700, fontSize:12, marginBottom:16 }}>
                + Add Another Site Visit
              </button>

              {/* Next visit date */}
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Next Planned Visit Date</label>
                <input type='date' value={visitForm.nextVisitDate}
                  onChange={e=>setVisitForm(f=>({...f,nextVisitDate:e.target.value}))}
                  style={{ ...inp, width:200 }} />
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setShowVisitModal(false)}
                  style={{ padding:'8px 18px', background:'#f0f0f0', border:'none',
                    borderRadius:5, cursor:'pointer', fontWeight:600 }}>Cancel</button>
                <button onClick={saveVisits} disabled={saving}
                  style={{ padding:'8px 24px', background:'#1A5276', color:'#fff',
                    border:'none', borderRadius:5, cursor:'pointer', fontWeight:700 }}>
                  {saving ? '⏳...' : `📍 Log ${visitRows.filter(v=>v.projectId).length} Site Visit(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
