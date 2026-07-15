import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const inp  = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none' }
const th   = { padding:'8px 12px', fontSize:11, color:'#6E2C00', textAlign:'left', borderBottom:'2px solid #E8E0E8' }
const td   = { padding:'8px 12px', fontSize:12, borderBottom:'1px solid #F0F0F0' }
const fmtD = d => new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',weekday:'short'})

export default function AttendanceRegister() {
  const nav = useNavigate()
  const [instId,  setInstId]  = useState(localStorage.getItem('lnv_edu_inst') || '')
  const [dateFrom,setDateFrom]= useState(() => { const d=new Date(); d.setDate(d.getDate()-14); return d.toISOString().slice(0,10) })
  const [dateTo,  setDateTo]  = useState(new Date().toISOString().slice(0,10))
  const [sessions,setSessions]= useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const onStorage = () => setInstId(localStorage.getItem('lnv_edu_inst') || '')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ institutionId:instId, dateFrom, dateTo })
    fetch(`${BASE}/edu/attendance/student/register?${params}`, { headers:hdr2() })
      .then(r=>r.json()).then(d => setSessions(d.data||[]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [instId, dateFrom, dateTo])

  const openSession = (s) => {
    nav(`/edu/attendance/student?date=${s.date}&sectionId=${s.sectionId}`)
  }

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12,
        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📋 Attendance Register</div>
        <button onClick={()=>nav('/edu/attendance/student')}
          style={{padding:'7px 16px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,
            cursor:'pointer',fontWeight:700,fontSize:12}}>
          + Mark Today's Attendance
        </button>
      </div>

      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:'12px 16px',marginBottom:12,display:'flex',gap:12}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:3}}>FROM</div>
          <input type='date' value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={inp} />
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:3}}>TO</div>
          <input type='date' value={dateTo} onChange={e=>setDateTo(e.target.value)} style={inp} />
        </div>
      </div>

      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={th}>Date</th><th style={th}>Class</th><th style={th}>Section</th>
              <th style={th}>Total</th><th style={th}>Present</th><th style={th}>Absent</th>
              <th style={th}>Late</th><th style={th}>Half Day</th><th style={th}>Attendance %</th><th style={th}></th>
            </tr></thead>
            <tbody>
              {sessions.map((s,i) => (
                <tr key={i} onClick={()=>openSession(s)}
                  style={{cursor:'pointer',background:i%2===0?'#fff':'#FAF8FA'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#F3EEF3'}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FAF8FA'}>
                  <td style={{...td,fontWeight:700}}>{fmtD(s.date)}</td>
                  <td style={td}>{s.className}</td>
                  <td style={td}>Section {s.sectionName}</td>
                  <td style={td}>{s.total}</td>
                  <td style={{...td,color:'#1E8449',fontWeight:700}}>{s.present}</td>
                  <td style={{...td,color:'#C0392B',fontWeight:700}}>{s.absent}</td>
                  <td style={{...td,color:'#B8860B'}}>{s.late}</td>
                  <td style={td}>{s.halfDay}</td>
                  <td style={td}>{s.total>0 ? ((s.present/s.total)*100).toFixed(1) : 0}%</td>
                  <td style={{...td,color:'#6E2C00',fontWeight:700}}>View / Edit →</td>
                </tr>
              ))}
              {sessions.length===0 && <tr><td colSpan={10} style={{...td,textAlign:'center',color:'#aaa',padding:40}}>No attendance marked in this date range</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
