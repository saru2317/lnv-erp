import React, { useState, useEffect } from 'react'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const inp  = { padding:'8px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none' }
const th   = { padding:'8px 12px', fontSize:11, color:'#1E8449', textAlign:'left', borderBottom:'2px solid #E8F5E9' }
const td   = { padding:'8px 12px', fontSize:12, borderBottom:'1px solid #F0F0F0' }
const fmtD = d => new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',weekday:'short'})

const STATUS_STYLE = {
  PRESENT: { bg:'#E8F5E9', color:'#1E8449' }, ABSENT: { bg:'#FDEDEC', color:'#C0392B' },
  LATE: { bg:'#FEF9E7', color:'#B8860B' }, HALF_DAY: { bg:'#EBF5FB', color:'#1A5276' },
}

export default function StaffAttendanceHistory() {
  const [instId,   setInstId]   = useState(localStorage.getItem('lnv_edu_inst') || '')
  const [search,   setSearch]   = useState('')
  const [results,  setResults]  = useState([])
  const [selStaff, setSelStaff] = useState(null)
  const [dateFrom, setDateFrom] = useState(() => { const d=new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10) })
  const [dateTo,   setDateTo]   = useState(new Date().toISOString().slice(0,10))
  const [records,  setRecords]  = useState([])
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    const onStorage = () => setInstId(localStorage.getItem('lnv_edu_inst') || '')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const searchStaff = async (q) => {
    setSearch(q)
    if (q.length < 2) { setResults([]); return }
    const r = await fetch(`${BASE}/edu/staff?search=${encodeURIComponent(q)}&institutionId=${instId}`, { headers:hdr2() })
    const d = await r.json()
    setResults((d.data||[]).slice(0,8))
  }

  const pickStaff = (s) => {
    setSelStaff(s); setResults([]); setSearch(s.name)
  }

  useEffect(() => {
    if (!selStaff) return
    setLoading(true)
    const params = new URLSearchParams({ staffId:selStaff.id, dateFrom, dateTo })
    fetch(`${BASE}/edu/attendance/staff?${params}`, { headers:hdr2() })
      .then(r=>r.json()).then(d => setRecords(d.data||[]))
      .finally(() => setLoading(false))
  }, [selStaff, dateFrom, dateTo])

  const present = records.filter(r=>r.status==='PRESENT').length
  const absent  = records.filter(r=>r.status==='ABSENT').length
  const late    = records.filter(r=>r.status==='LATE').length

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div style={{fontSize:18,fontWeight:800,color:'#1E8449'}}>🔍 Staff Attendance History</div>
        <div style={{fontSize:11,color:'#888',marginTop:2}}>Look up one staff member's full attendance record over any date range</div>
      </div>

      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,marginBottom:12}}>
        <div style={{position:'relative',maxWidth:400,marginBottom:12}}>
          <input placeholder='Search by name or staff code...' value={search}
            onChange={e=>searchStaff(e.target.value)} style={{...inp,width:'100%',boxSizing:'border-box'}} />
          {results.length>0 && (
            <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',
              border:'1px solid #E8E0E8',borderRadius:5,zIndex:10,maxHeight:220,overflow:'auto',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
              {results.map(s => (
                <div key={s.id} onClick={()=>pickStaff(s)}
                  style={{padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid #F0F0F0',fontSize:12}}>
                  <b>{s.name}</b> — {s.staffCode} {s.designation?`· ${s.designation}`:''}
                </div>
              ))}
            </div>
          )}
        </div>
        {selStaff && (
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:3}}>FROM</div>
              <input type='date' value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:3}}>TO</div>
              <input type='date' value={dateTo} onChange={e=>setDateTo(e.target.value)} style={inp} />
            </div>
          </div>
        )}
      </div>

      {!selStaff ? (
        <div style={{padding:60,textAlign:'center',background:'#fff',borderRadius:8,border:'1px solid #E8E0E8',color:'#aaa'}}>
          Search and select a staff member to view their attendance history
        </div>
      ) : loading ? (
        <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>
      ) : (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:14}}>
            {[
              {label:'Total Marked', val:records.length, color:'#6E2C00'},
              {label:'Present', val:present, color:'#1E8449'},
              {label:'Absent', val:absent, color:'#C0392B'},
              {label:'Late', val:late, color:'#B8860B'},
              {label:'Attendance %', val:records.length>0?((present/records.length)*100).toFixed(1)+'%':'—', color:'#1A5276'},
            ].map(c => (
              <div key={c.label} style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:'12px 16px',textAlign:'center'}}>
                <div style={{fontSize:20,fontWeight:800,color:c.color}}>{c.val}</div>
                <div style={{fontSize:10,color:'#888',fontWeight:700,textTransform:'uppercase'}}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr><th style={th}>Date</th><th style={th}>Status</th><th style={th}>In / Out</th><th style={th}>Remarks</th></tr></thead>
              <tbody>
                {records.map(r => {
                  const s = STATUS_STYLE[r.status] || STATUS_STYLE.PRESENT
                  return (
                    <tr key={r.id}>
                      <td style={{...td,fontWeight:700}}>{fmtD(r.date)}</td>
                      <td style={td}><span style={{padding:'3px 10px',borderRadius:12,background:s.bg,color:s.color,fontSize:10,fontWeight:700}}>{r.status}</span></td>
                      <td style={{...td,color:'#888'}}>{r.inTime||'—'} / {r.outTime||'—'}</td>
                      <td style={{...td,color:'#888'}}>{r.remarks||'—'}</td>
                    </tr>
                  )
                })}
                {records.length===0 && <tr><td colSpan={4} style={{...td,textAlign:'center',color:'#aaa',padding:30}}>No attendance records in this date range</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
