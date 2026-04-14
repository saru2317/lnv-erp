import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const STATUS_CONFIG = {
  PRESENT:      { bg:'#D4EDDA', color:'#155724', label:'P'    },
  LATE:         { bg:'#FFF3CD', color:'#856404', label:'L'    },
  HALF_DAY:     { bg:'#D1ECF1', color:'#0C5460', label:'HD'   },
  ABSENT:       { bg:'#F8D7DA', color:'#721C24', label:'A'    },
  LOP:          { bg:'#F8D7DA', color:'#721C24', label:'LOP'  },
  OD:           { bg:'#EDE0EA', color:'#714B67', label:'OD'   },
  LEAVE:        { bg:'#E2D9F3', color:'#4A0D67', label:'L'    },
  WEEKLY_OFF:   { bg:'#E9ECEF', color:'#6C757D', label:'WO'   },
  MISSING_PUNCH:{ bg:'#FDE8D8', color:'#E06F39', label:'MP'   },
  PERMISSION:   { bg:'#D1ECF1', color:'#0C5460', label:'PE'   },
}

const fmt = n => String(n||0).padStart(2,'0')
const minsToHHMM = m => {
  if (!m) return '—'
  return `${fmt(Math.floor(m/60))}:${fmt(m%60)}`
}

// ── Manual Entry Modal ────────────────────────────────────
function ManualModal({ employees, onSave, onCancel }) {
  const [form, setForm] = useState({
    empCode:'', empName:'', date: new Date().toISOString().split('T')[0],
    punchIn:'', punchOut:'', status:'PRESENT', reason:''
  })
  const [saving, setSaving] = useState(false)

  const selEmp = employees.find(e=>e.empCode===form.empCode)
  useEffect(()=>{
    if (selEmp) setForm(p=>({...p, empName:selEmp.name,
      department:selEmp.department}))
  },[form.empCode])

  const save = async () => {
    if (!form.empCode) return toast.error('Select employee!')
    if (!form.date)    return toast.error('Select date!')
    if (!form.reason)  return toast.error('Reason required!')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/attendance/register/manual`,
        { method:'POST', headers:authHdrs(), body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
    fontSize:12, outline:'none', width:'100%', boxSizing:'border-box',
    fontFamily:'DM Sans,sans-serif' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:560,
        overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif',
            fontSize:15, fontWeight:700 }}>✏️ Manual Attendance Entry</h3>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:'#FFF3CD', padding:'8px 12px', borderRadius:6,
            fontSize:11, color:'#856404' }}>
            ⚠️ Manual entry creates audit trail. Reason is mandatory.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#495057',
                display:'block', marginBottom:3 }}>Employee *</label>
              <select value={form.empCode} style={{ ...inp, cursor:'pointer' }}
                onChange={e=>setForm(p=>({...p,empCode:e.target.value}))}>
                <option value="">-- Select --</option>
                {employees.map(e=>(
                  <option key={e.empCode} value={e.empCode}>
                    {e.empCode} — {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#495057',
                display:'block', marginBottom:3 }}>Date *</label>
              <input type="date" value={form.date} style={inp}
                onChange={e=>setForm(p=>({...p,date:e.target.value}))} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#495057',
                display:'block', marginBottom:3 }}>Punch IN</label>
              <input type="time" value={form.punchIn} style={inp}
                onChange={e=>setForm(p=>({...p,punchIn:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#495057',
                display:'block', marginBottom:3 }}>Punch OUT</label>
              <input type="time" value={form.punchOut} style={inp}
                onChange={e=>setForm(p=>({...p,punchOut:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'#495057',
                display:'block', marginBottom:3 }}>Status</label>
              <select value={form.status} style={{ ...inp, cursor:'pointer' }}
                onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                {['PRESENT','HALF_DAY','ABSENT','OD','LEAVE','LATE','LOP','WEEKLY_OFF'].map(s=>(
                  <option key={s}>{s.replace('_',' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'#495057',
              display:'block', marginBottom:3 }}>Reason / Remarks *</label>
            <textarea value={form.reason} rows={2}
              onChange={e=>setForm(p=>({...p,reason:e.target.value}))}
              style={{ ...inp, resize:'vertical' }}
              placeholder="Reason for manual entry (mandatory for audit)" />
          </div>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
          <button onClick={onCancel} style={{ padding:'8px 20px', background:'#fff',
            color:'#6C757D', border:'1.5px solid #E0D5E0', borderRadius:6,
            fontSize:13, cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding:'8px 24px', background:saving?'#9E7D96':'#714B67',
              color:'#fff', border:'none', borderRadius:6, fontSize:13,
              fontWeight:700, cursor:'pointer' }}>
            {saving?'⏳ Saving...':'💾 Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Punch Upload Modal ────────────────────────────────────
function PunchUploadModal({ onSave, onCancel }) {
  const [date,   setDate]   = useState(new Date().toISOString().split('T')[0])
  const [text,   setText]   = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!text.trim()) return toast.error('Paste punch data!')
    setSaving(true)
    try {
      // Parse CSV/text: EmpCode,Time or EmpCode,Date,Time
      const lines  = text.trim().split('\n').filter(l=>l.trim())
      const punches = []
      for (const line of lines) {
        const parts = line.split(/[,\t]/).map(p=>p.trim())
        if (parts.length < 2) continue
        const empCode  = parts[0]
        const punchTime= parts.length===2 ? parts[1] : parts[2]
        if (!empCode||!punchTime) continue
        punches.push({ empCode, date, time:punchTime, type:'UNKNOWN' })
      }
      if (!punches.length) return toast.error('No valid punch data found!')
      const res  = await fetch(`${BASE_URL}/attendance/punches/bulk`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({ punches }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:600,
        overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#0C5460', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif',
            fontSize:15, fontWeight:700 }}>📥 Upload Biometric Punch Data</h3>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'#495057',
              display:'block', marginBottom:3 }}>Date *</label>
            <input type="date" value={date}
              onChange={e=>setDate(e.target.value)}
              style={{ padding:'8px 10px', border:'1.5px solid #E0D5E0',
                borderRadius:5, fontSize:12, outline:'none' }} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:'#495057',
              display:'block', marginBottom:3 }}>
              Paste Punch Data (CSV format: EmpCode, Time)
            </label>
            <div style={{ fontSize:11, color:'#6C757D', marginBottom:6 }}>
              Format: <code>EMP001, 08:45</code> — one per line<br/>
              Or copy from Excel — Tab separated also works
            </div>
            <textarea value={text} onChange={e=>setText(e.target.value)}
              rows={10} style={{ padding:'8px 10px', border:'1.5px solid #E0D5E0',
                borderRadius:5, fontSize:12, outline:'none', width:'100%',
                boxSizing:'border-box', fontFamily:'DM Mono,monospace',
                resize:'vertical' }}
              placeholder={`EMP001, 08:45\nEMP001, 17:52\nEMP002, 09:10\nEMP002, 18:05\nEMP003, 08:30\nEMP003, 17:40`} />
          </div>
          <div style={{ background:'#D1ECF1', padding:'8px 12px', borderRadius:6,
            fontSize:11, color:'#0C5460' }}>
            💡 System will auto-detect first punch = IN, last punch = OUT per employee per day
          </div>
          <button onClick={()=>{
            const csv = [
              'EmpCode,Date,Time,Type',
              'EMP001,'+date+',08:30,IN',
              'EMP001,'+date+',17:45,OUT',
              'EMP002,'+date+',09:00,IN',
              'EMP002,'+date+',18:10,OUT',
              'EMP003,'+date+',08:15,IN',
              'EMP003,'+date+',17:30,OUT',
            ].join('\n')
            const blob = new Blob([csv], {type:'text/csv'})
            const a    = document.createElement('a')
            a.href     = URL.createObjectURL(blob)
            a.download = `punch_template_${date}.csv`
            a.click()
          }} style={{ padding:'6px 14px', background:'#fff', color:'#0C5460',
            border:'1.5px solid #0C5460', borderRadius:5, fontSize:11,
            cursor:'pointer', fontWeight:600, alignSelf:'flex-start' }}>
            📥 Download Excel Template
          </button>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
          <button onClick={onCancel} style={{ padding:'8px 20px', background:'#fff',
            color:'#6C757D', border:'1.5px solid #E0D5E0', borderRadius:6,
            fontSize:13, cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding:'8px 24px', background:saving?'#999':'#0C5460',
              color:'#fff', border:'none', borderRadius:6, fontSize:13,
              fontWeight:700, cursor:'pointer' }}>
            {saving?'⏳ Uploading...':'📥 Upload Punches'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────
export default function AttendanceRegister() {
  const now   = new Date()
  const [month,    setMonth]    = useState(now.getMonth()+1)
  const [year,     setYear]     = useState(now.getFullYear())
  const [view,     setView]     = useState('summary') // summary | daily
  const [selDate,  setSelDate]  = useState(now.toISOString().split('T')[0])
  const [records,  setRecords]  = useState([])
  const [summary,  setSummary]  = useState([])
  const [employees,setEmployees]= useState([])
  const [loading,  setLoading]  = useState(false)
  const [processing,setProcessing]=useState(false)
  const [processPreview,setProcessPreview]=useState(null)
  const [showManual,setShowManual]=useState(false)
  const [showUpload,setShowUpload]=useState(false)
  const [refreshKey,setRefreshKey]=useState(0)
  const [deptFilter,setDeptFilter]=useState('All')
  const [statusFilter,setStatusFilter]=useState('All')

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(
        `${BASE_URL}/attendance/summary?month=${month}&year=${year}`,
        { headers:authHdrs2() })
      const data = await res.json()
      setSummary(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [month, year])

  const fetchDaily = useCallback(async () => {
    setLoading(true)
    try {
      const [d,m2,y2] = selDate.split('-')
      const res  = await fetch(
        `${BASE_URL}/attendance/register?month=${parseInt(m2)}&year=${y2}`,
        { headers:authHdrs2() })
      const data = await res.json()
      // Filter by selected date
      const filtered = (data.data||[]).filter(r =>
        r.attendanceDate?.split('T')[0] === selDate)
      setRecords(filtered)
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [selDate, refreshKey])

  const fetchEmployees = useCallback(async () => {
    const res  = await fetch(`${BASE_URL}/employees`, { headers:authHdrs2() })
    const data = await res.json()
    setEmployees(data.data||[])
  }, [])

  useEffect(()=>{ fetchEmployees() }, [])
  useEffect(()=>{ if(view==='summary') fetchSummary() }, [view, fetchSummary])
  useEffect(()=>{ if(view==='daily')   fetchDaily()   }, [view, fetchDaily, refreshKey])

  const previewProcess = async () => {
    try {
      // Get punch count for date
      const [punchRes, empRes] = await Promise.all([
        fetch(`${BASE_URL}/attendance/punches?date=${selDate}`, { headers:authHdrs2() }),
        fetch(`${BASE_URL}/employees`, { headers:authHdrs2() }),
      ])
      const punchData = await punchRes.json()
      const empData   = await empRes.json()
      const punches   = punchData.data || []
      const employees = empData.data   || []
      const uniqueEmps = [...new Set(punches.map(p=>p.empCode))]
      setProcessPreview({
        date: selDate,
        totalPunches: punches.length,
        uniqueEmps: uniqueEmps.length,
        totalEmployees: employees.length,
        withPunch: uniqueEmps.length,
        withoutPunch: employees.length - uniqueEmps.length,
      })
    } catch(e){ toast.error(e.message) }
  }

  const processAttendance = async () => {
    setProcessPreview(null)
    setProcessing(true)
    try {
      const res  = await fetch(`${BASE_URL}/attendance/process`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({ date:selDate }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      setRefreshKey(k=>k+1)
    } catch(e){ toast.error(e.message) } finally { setProcessing(false) }
  }

  const lockDay = async () => {
    if (!confirm(`Lock attendance for ${selDate}? This cannot be undone!`)) return
    try {
      const res  = await fetch(`${BASE_URL}/attendance/lock`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({ date:selDate }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      fetchDaily()
    } catch(e){ toast.error(e.message) }
  }

  // Filtered data
  const depts = ['All', ...new Set([
    ...summary.map(s=>s.department),
    ...records.map(r=>r.department)
  ].filter(Boolean))]

  const filteredSummary = summary.filter(s =>
    (deptFilter==='All' || s.department===deptFilter))

  const filteredRecords = records.filter(r =>
    (deptFilter==='All'   || r.department===deptFilter) &&
    (statusFilter==='All' || r.status===statusFilter))

  // Overall stats
  const totalPresent = summary.reduce((s,e)=>s+e.present,0)
  const totalAbsent  = summary.reduce((s,e)=>s+e.absent,0)
  const totalLate    = summary.reduce((s,e)=>s+e.late,0)
  const totalLOP     = summary.reduce((s,e)=>s+e.lop,0)

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Attendance Register
          <small>Biometric · Manual · OD · Permission</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm"
            onClick={()=>setShowUpload(true)}>
            📥 Upload Punches
          </button>
          <button className="btn btn-s sd-bsm"
            onClick={()=>setShowManual(true)}>
            ✏️ Manual Entry
          </button>
          {view==='daily' && (
            <>
              <button className="btn btn-s sd-bsm"
                disabled={processing} onClick={previewProcess}
                style={{ background:'#0C5460', color:'#fff', border:'none' }}>
                {processing?'⏳ Processing...':'⚙️ Process'}
              </button>
              <button className="btn btn-s sd-bsm"
                onClick={lockDay}
                style={{ background:'#DC3545', color:'#fff', border:'none' }}>
                🔒 Day Close
              </button>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
        padding:'12px 16px', marginBottom:16, display:'flex',
        gap:12, flexWrap:'wrap', alignItems:'center' }}>

        {/* View toggle */}
        <div style={{ display:'flex', gap:0, borderRadius:6,
          overflow:'hidden', border:'1px solid #E0D5E0' }}>
          {[['summary','📊 Monthly'],['daily','📅 Daily']].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)}
              style={{ padding:'6px 14px', border:'none', cursor:'pointer',
                fontSize:12, fontWeight:600,
                background:view===v?'#714B67':'#fff',
                color:view===v?'#fff':'#6C757D' }}>{l}</button>
          ))}
        </div>

        {/* Month/Year for summary */}
        {view==='summary' && (
          <>
            <select value={month} onChange={e=>setMonth(parseInt(e.target.value))}
              style={{ padding:'7px 10px', border:'1px solid #E0D5E0',
                borderRadius:5, fontSize:12, cursor:'pointer' }}>
              {MONTHS.map((m,i)=>(
                <option key={i} value={i+1}>{m}</option>
              ))}
            </select>
            <select value={year} onChange={e=>setYear(parseInt(e.target.value))}
              style={{ padding:'7px 10px', border:'1px solid #E0D5E0',
                borderRadius:5, fontSize:12, cursor:'pointer' }}>
              {[2024,2025,2026,2027].map(y=>(
                <option key={y}>{y}</option>
              ))}
            </select>
          </>
        )}

        {/* Date for daily */}
        {view==='daily' && (
          <input type="date" value={selDate}
            onChange={e=>setSelDate(e.target.value)}
            style={{ padding:'7px 10px', border:'1px solid #E0D5E0',
              borderRadius:5, fontSize:12 }} />
        )}

        {/* Dept filter */}
        <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}
          style={{ padding:'7px 10px', border:'1px solid #E0D5E0',
            borderRadius:5, fontSize:12, cursor:'pointer' }}>
          {depts.map(d=><option key={d}>{d}</option>)}
        </select>

        {/* Status filter (daily only) */}
        {view==='daily' && (
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            style={{ padding:'7px 10px', border:'1px solid #E0D5E0',
              borderRadius:5, fontSize:12, cursor:'pointer' }}>
            {['All','PRESENT','LATE','ABSENT','LOP','HALF_DAY',
              'OD','LEAVE','MISSING_PUNCH','WEEKLY_OFF'].map(s=>(
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {/* KPI Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)',
        gap:10, marginBottom:16 }}>
        {[
          { l:'Total Employees', v:summary.length,   c:'#714B67', bg:'#EDE0EA' },
          { l:'Avg Present',     v:totalPresent,      c:'#155724', bg:'#D4EDDA' },
          { l:'Avg Absent',      v:totalAbsent,       c:'#721C24', bg:'#F8D7DA' },
          { l:'Late Marks',      v:totalLate,         c:'#856404', bg:'#FFF3CD' },
          { l:'LOP Days',        v:totalLOP,          c:'#DC3545', bg:'#F8D7DA' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg, borderRadius:8,
            padding:'10px 14px', border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c, fontWeight:700,
              textTransform:'uppercase', letterSpacing:.4 }}>{k.l}</div>
            <div style={{ fontSize:24, fontWeight:800, color:k.c,
              fontFamily:'Syne,sans-serif' }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* ── MONTHLY SUMMARY VIEW ── */}
      {view==='summary' && (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ maxHeight:'calc(100vh - 350px)',
            overflowY:'auto', overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse',
              minWidth:900 }}>
              <thead style={{ position:'sticky', top:0, zIndex:10,
                background:'#F8F4F8',
                boxShadow:'0 2px 4px rgba(0,0,0,.08)' }}>
                <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                  {['Emp Code','Name','Dept','Present','Absent',
                    'Half Day','Late','OD','Leave','LOP','OT Days'].map(h=>(
                    <th key={h} style={{ padding:'10px 12px', fontSize:10,
                      fontWeight:700, color:'#6C757D', textAlign:'left',
                      textTransform:'uppercase', letterSpacing:.3,
                      whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} style={{ padding:40,
                    textAlign:'center', color:'#6C757D' }}>⏳ Loading...</td></tr>
                ) : filteredSummary.length===0 ? (
                  <tr><td colSpan={11} style={{ padding:40,
                    textAlign:'center', color:'#6C757D' }}>
                    No attendance data for {MONTHS[month-1]} {year}.
                    Switch to Daily view → Process attendance
                  </td></tr>
                ) : filteredSummary.map((e,i)=>(
                  <tr key={e.empCode} style={{ borderBottom:'1px solid #F0EEF0',
                    background:i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'9px 12px',
                      fontFamily:'DM Mono,monospace', fontWeight:700,
                      color:'#714B67', fontSize:12 }}>{e.empCode}</td>
                    <td style={{ padding:'9px 12px', fontWeight:600,
                      fontSize:13 }}>{e.empName}</td>
                    <td style={{ padding:'9px 12px', fontSize:12,
                      color:'#6C757D' }}>{e.department}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center',
                      fontWeight:700, color:'#155724' }}>{e.present}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center',
                      fontWeight:700, color:e.absent>0?'#DC3545':'#6C757D' }}>
                      {e.absent}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center',
                      color:'#0C5460' }}>{e.halfDay}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center',
                      color:e.late>0?'#856404':'#6C757D' }}>{e.late}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center',
                      color:'#714B67' }}>{e.od}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center',
                      color:'#4A0D67' }}>{e.leave}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center',
                      fontWeight:700,
                      color:e.lop>0?'#DC3545':'#6C757D' }}>{e.lop}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center',
                      color:'#0C5460' }}>{e.ot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DAILY VIEW ── */}
      {view==='daily' && (
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ maxHeight:'calc(100vh - 350px)', overflowY:'auto',
            overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse',
              minWidth:900 }}>
              <thead style={{ position:'sticky', top:0, zIndex:10,
                background:'#F8F4F8',
                boxShadow:'0 2px 4px rgba(0,0,0,.08)' }}>
                <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                  {['Emp Code','Name','Dept','Shift','IN','OUT',
                    'Net Hrs','OT','Status','Late','Flags'].map(h=>(
                    <th key={h} style={{ padding:'10px 12px', fontSize:10,
                      fontWeight:700, color:'#6C757D', textAlign:'left',
                      textTransform:'uppercase', letterSpacing:.3,
                      whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} style={{ padding:40,
                    textAlign:'center', color:'#6C757D' }}>⏳ Loading...</td></tr>
                ) : filteredRecords.length===0 ? (
                  <tr><td colSpan={11} style={{ padding:40,
                    textAlign:'center', color:'#6C757D' }}>
                    <div style={{ fontSize:24, marginBottom:8 }}>⚙️</div>
                    No records for {selDate}.
                    Upload biometric data → click Process!
                  </td></tr>
                ) : filteredRecords.map((r,i)=>{
                  const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.ABSENT
                  return (
                    <tr key={r.id} style={{ borderBottom:'1px solid #F0EEF0',
                      background: r.isLocked?'#F8F9FA':i%2===0?'#fff':'#FDFBFD' }}>
                      <td style={{ padding:'9px 12px',
                        fontFamily:'DM Mono,monospace', fontWeight:700,
                        color:'#714B67', fontSize:12 }}>{r.empCode}</td>
                      <td style={{ padding:'9px 12px', fontWeight:600,
                        fontSize:13 }}>
                        {r.empName}
                        {r.isManual && (
                          <span style={{ fontSize:9, background:'#FFF3CD',
                            color:'#856404', padding:'1px 5px', borderRadius:10,
                            marginLeft:4, fontWeight:700 }}>Manual</span>
                        )}
                        {r.isLocked && (
                          <span style={{ fontSize:9, background:'#E9ECEF',
                            color:'#6C757D', padding:'1px 5px', borderRadius:10,
                            marginLeft:4 }}>🔒</span>
                        )}
                      </td>
                      <td style={{ padding:'9px 12px', fontSize:12,
                        color:'#6C757D' }}>{r.department}</td>
                      <td style={{ padding:'9px 12px' }}>
                        <span style={{ fontFamily:'DM Mono,monospace',
                          fontSize:11, fontWeight:700,
                          background:'#EDE0EA', color:'#714B67',
                          padding:'2px 6px', borderRadius:10 }}>
                          {r.shiftCode||'G'}
                        </span>
                      </td>
                      <td style={{ padding:'9px 12px',
                        fontFamily:'DM Mono,monospace', fontSize:12,
                        color: r.isLate?'#856404':'#1C1C1C',
                        fontWeight: r.isLate?700:400 }}>
                        {r.punchIn||'—'}
                      </td>
                      <td style={{ padding:'9px 12px',
                        fontFamily:'DM Mono,monospace', fontSize:12,
                        color: r.isEarlyOut?'#E06F39':'#1C1C1C' }}>
                        {r.punchOut||'—'}
                      </td>
                      <td style={{ padding:'9px 12px',
                        fontFamily:'DM Mono,monospace', fontSize:12,
                        fontWeight:700, color:'#0C5460' }}>
                        {minsToHHMM(r.netMins)}
                      </td>
                      <td style={{ padding:'9px 12px',
                        fontFamily:'DM Mono,monospace', fontSize:12,
                        color:'#155724' }}>
                        {r.isOT ? minsToHHMM(r.otMins) : '—'}
                      </td>
                      <td style={{ padding:'9px 12px' }}>
                        <span style={{ padding:'3px 10px', borderRadius:10,
                          fontSize:11, fontWeight:700,
                          background:sc.bg, color:sc.color }}>
                          {sc.label} {r.status.replace('_',' ')}
                        </span>
                      </td>
                      <td style={{ padding:'9px 12px', fontSize:12,
                        color:r.lateMins>0?'#856404':'#6C757D' }}>
                        {r.lateMins>0?`${r.lateMins}m`:'—'}
                      </td>
                      <td style={{ padding:'9px 12px' }}>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {r.isMissingPunch && (
                            <span style={{ fontSize:10, background:'#FDE8D8',
                              color:'#E06F39', padding:'1px 6px',
                              borderRadius:10, fontWeight:700 }}>⚠️ MP</span>
                          )}
                          {r.isEarlyOut && (
                            <span style={{ fontSize:10, background:'#FFF3CD',
                              color:'#856404', padding:'1px 6px',
                              borderRadius:10, fontWeight:700 }}>Early Out</span>
                          )}
                          {r.leaveType && (
                            <span style={{ fontSize:10, background:'#E2D9F3',
                              color:'#4A0D67', padding:'1px 6px',
                              borderRadius:10, fontWeight:700 }}>
                              {r.leaveType}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Footer totals */}
              {filteredRecords.length>0 && (
                <tfoot style={{ background:'#F8F4F8',
                  borderTop:'2px solid #E0D5E0',
                  position:'sticky', bottom:0 }}>
                  <tr>
                    <td colSpan={4} style={{ padding:'8px 12px',
                      fontSize:11, fontWeight:700, color:'#714B67' }}>
                      Total: {filteredRecords.length} employees
                    </td>
                    <td colSpan={3} style={{ padding:'8px 12px',
                      fontSize:11, color:'#6C757D' }}>
                      Present: {filteredRecords.filter(r=>['PRESENT','LATE'].includes(r.status)).length} |
                      Absent: {filteredRecords.filter(r=>r.status==='ABSENT').length} |
                      LOP: {filteredRecords.filter(r=>r.status==='LOP').length}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Process Preview Modal */}
      {processPreview && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'#fff', borderRadius:10, width:480,
            overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ background:'#0C5460', padding:'14px 20px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif',
                fontSize:15, fontWeight:700 }}>⚙️ Process Attendance</h3>
              <span onClick={()=>setProcessPreview(null)}
                style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
            </div>
            <div style={{ padding:20 }}>
              {/* Date */}
              <div style={{ background:'#D1ECF1', padding:'10px 14px',
                borderRadius:8, marginBottom:16, fontSize:13,
                color:'#0C5460', fontWeight:700, textAlign:'center' }}>
                📅 Processing attendance for: {processPreview.date}
              </div>
              {/* Stats grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                gap:10, marginBottom:16 }}>
                {[
                  ['Total Punch Records', processPreview.totalPunches, '#0C5460', '#D1ECF1'],
                  ['Employees with Punch', processPreview.withPunch, '#155724', '#D4EDDA'],
                  ['Total Employees', processPreview.totalEmployees, '#714B67', '#EDE0EA'],
                  ['No Punch (→ Absent/LOP)', processPreview.withoutPunch, '#721C24', '#F8D7DA'],
                ].map(([label,val,clr,bg])=>(
                  <div key={label} style={{ background:bg, borderRadius:8,
                    padding:'12px 14px', border:`1px solid ${clr}22` }}>
                    <div style={{ fontSize:11, color:clr, fontWeight:600,
                      textTransform:'uppercase', letterSpacing:.4 }}>{label}</div>
                    <div style={{ fontSize:26, fontWeight:800, color:clr,
                      fontFamily:'Syne,sans-serif' }}>{val}</div>
                  </div>
                ))}
              </div>
              {/* What will happen */}
              <div style={{ background:'#F8F7FA', borderRadius:8,
                padding:'12px 14px', fontSize:12, color:'#495057',
                lineHeight:1.8, marginBottom:12 }}>
                <div style={{ fontWeight:700, color:'#1C1C1C',
                  marginBottom:6 }}>Engine will:</div>
                <div>✅ Match IN/OUT punches per employee</div>
                <div>✅ Check approved OD / Leave / Permission</div>
                <div>✅ Calculate net hours, late mins, OT</div>
                <div>✅ Flag missing punches</div>
                <div>✅ Mark absent employees as LOP</div>
                <div>✅ Respect weekly off (Sunday)</div>
              </div>
              {processPreview.withoutPunch > 0 && (
                <div style={{ background:'#FFF3CD', padding:'8px 12px',
                  borderRadius:6, fontSize:12, color:'#856404',
                  border:'1px solid #FFEEBA' }}>
                  ⚠️ {processPreview.withoutPunch} employees have no punch data.
                  They will be marked as LOP (unless leave/OD is approved).
                  Apply OD/Leave before processing if needed.
                </div>
              )}
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
              display:'flex', justifyContent:'space-between',
              alignItems:'center', background:'#F8F7FA' }}>
              <button onClick={()=>setProcessPreview(null)}
                style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
                  border:'1.5px solid #E0D5E0', borderRadius:6,
                  fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={processAttendance} disabled={processing}
                style={{ padding:'8px 28px',
                  background:processing?'#999':'#0C5460',
                  color:'#fff', border:'none', borderRadius:6,
                  fontSize:13, fontWeight:700, cursor:'pointer' }}>
                {processing?'⏳ Processing...':'🚀 Process Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showManual && (
        <ManualModal employees={employees}
          onSave={()=>{ setShowManual(false); setView('daily'); setRefreshKey(k=>k+1) }}
          onCancel={()=>setShowManual(false)} />
      )}
      {showUpload && (
        <PunchUploadModal
          onSave={()=>{ setShowUpload(false); setView('daily'); setRefreshKey(k=>k+1) }}
          onCancel={()=>setShowUpload(false)} />
      )}
    </div>
  )
}
