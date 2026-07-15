import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const toDay = () => new Date().toISOString().slice(0,10)

export default function StaffAttendance() {
  const [instId,   setInstId]   = useState(localStorage.getItem('lnv_edu_inst') || '')
  const [searchParams] = useSearchParams()
  const [date,     setDate]     = useState(searchParams.get('date') || toDay())
  const [staffList,setStaffList]= useState([])
  const [rows,     setRows]     = useState([])
  const [saving,   setSaving]   = useState(false)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    const onStorage = () => setInstId(localStorage.getItem('lnv_edu_inst') || '')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`${BASE}/edu/staff?limit=200&institutionId=${instId}`, { headers:hdr2() })
      .then(r=>r.json()).then(async d => {
        const staff = d.data || []
        setStaffList(staff)
        // Pull today's already-saved attendance (if any) so re-opening the page doesn't lose it
        const attRes = await fetch(`${BASE}/edu/attendance/staff?date=${date}&institutionId=${instId}`, { headers:hdr2() })
        const attData = await attRes.json()
        const byStaffId = {}
        ;(attData.data||[]).forEach(a => { byStaffId[a.staffId] = a })
        setRows(staff.map(s => {
          const existing = byStaffId[s.id]
          return {
            staffId: s.id, name: s.name, staffCode: s.staffCode, designation: s.designation,
            status: existing?.status || 'PRESENT',
            inTime: existing?.inTime || '', outTime: existing?.outTime || '',
            remarks: existing?.remarks || '',
          }
        }))
      }).catch(()=>{}).finally(()=>setLoading(false))
  }, [instId, date])

  const setRow = (idx,k,v) => setRows(prev => { const n=[...prev]; n[idx]={...n[idx],[k]:v}; return n })
  const markAll = (status) => setRows(prev => prev.map(r => ({...r,status})))

  const save = async () => {
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/edu/attendance/staff`, { method:'POST', headers:hdr(),
        body: JSON.stringify({ date, entries: rows }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ Attendance saved — ${rows.filter(r=>r.status==='PRESENT').length} present, ${rows.filter(r=>r.status==='ABSENT').length} absent`)
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const present = rows.filter(r=>r.status==='PRESENT').length
  const absent  = rows.filter(r=>r.status==='ABSENT').length
  const inp = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none' }

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>✅ Staff Attendance</div>
        {rows.length > 0 && (
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:12,color:'#1E8449',fontWeight:700}}>✅ {present} Present</span>
            <span style={{fontSize:12,color:'#C0392B',fontWeight:700}}>❌ {absent} Absent</span>
            <button onClick={save} disabled={saving}
              style={{padding:'7px 18px',background:'#1E8449',color:'#fff',border:'none',
                borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
              {saving?'⏳...':'💾 Save Attendance'}
            </button>
          </div>
        )}
      </div>

      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,
        padding:'12px 16px',marginBottom:12,display:'flex',gap:12,alignItems:'center'}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:3}}>DATE</div>
          <input type='date' value={date} onChange={e=>setDate(e.target.value)} style={{...inp,fontWeight:700}} />
        </div>
        {rows.length > 0 && (
          <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
            <button onClick={()=>markAll('PRESENT')}
              style={{padding:'6px 14px',background:'#E8F5E9',color:'#1E8449',border:'1px solid #1E8449',
                borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700}}>✅ All Present</button>
            <button onClick={()=>markAll('ABSENT')}
              style={{padding:'6px 14px',background:'#FDEDEC',color:'#C0392B',border:'1px solid #C0392B',
                borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700}}>❌ All Absent</button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading staff...</div>
      ) : rows.length === 0 ? (
        <div style={{padding:60,textAlign:'center',background:'#fff',borderRadius:8,border:'1px solid #E8E0E8'}}>
          <div style={{fontSize:48,marginBottom:12}}>👥</div>
          <div style={{fontSize:15,fontWeight:600,color:'#6E2C00'}}>No staff found for this institution</div>
        </div>
      ) : (
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{background:'#1E8449',color:'#fff'}}>
                {['Staff','Present','Absent','Late','Half Day','In Time','Out Time','Remarks'].map(h=>(
                  <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,fontWeight:600}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row,idx) => (
                <tr key={idx} style={{background:row.status==='ABSENT'?'#FFF5F5':row.status==='LATE'?'#FFF8E7':idx%2===0?'#fff':'#F8FDF8',
                  borderBottom:'1px solid #E8F5E9'}}>
                  <td style={{padding:'8px 12px'}}>
                    <div style={{fontWeight:700}}>{row.name}</div>
                    <div style={{fontSize:10,color:'#888'}}>{row.staffCode} · {row.designation||'—'}</div>
                  </td>
                  {['PRESENT','ABSENT','LATE','HALF_DAY'].map(status=>(
                    <td key={status} style={{padding:'8px 12px',textAlign:'center'}}>
                      <input type='radio' name={`att-${idx}`} checked={row.status===status}
                        onChange={()=>setRow(idx,'status',status)}
                        style={{width:16,height:16,cursor:'pointer',
                          accentColor:status==='PRESENT'?'#1E8449':status==='ABSENT'?'#C0392B':'#B8860B'}} />
                    </td>
                  ))}
                  <td style={{padding:'8px 12px'}}>
                    <input type='time' value={row.inTime} onChange={e=>setRow(idx,'inTime',e.target.value)}
                      style={{...inp,padding:'4px 6px',fontSize:11,width:100}} />
                  </td>
                  <td style={{padding:'8px 12px'}}>
                    <input type='time' value={row.outTime} onChange={e=>setRow(idx,'outTime',e.target.value)}
                      style={{...inp,padding:'4px 6px',fontSize:11,width:100}} />
                  </td>
                  <td style={{padding:'8px 12px'}}>
                    <input defaultValue={row.remarks} onBlur={e=>setRow(idx,'remarks',e.target.value)}
                      placeholder='Notes...'
                      style={{width:'100%',padding:'4px 8px',border:'1px solid #ddd',borderRadius:4,fontSize:11,outline:'none'}} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:'12px 16px',background:'#E8F5E9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#1E8449'}}>
              Total: {rows.length} | ✅ {present} Present | ❌ {absent} Absent | {rows.length > 0 ? ((present/rows.length)*100).toFixed(1) : 0}% Attendance
            </div>
            <button onClick={save} disabled={saving}
              style={{padding:'9px 24px',background:'#1E8449',color:'#fff',border:'none',
                borderRadius:6,cursor:'pointer',fontWeight:800,fontSize:14}}>
              {saving?'⏳ Saving...':'💾 Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
