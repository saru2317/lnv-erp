import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }

const STATUS_CONFIG = {
  PENDING:   { bg:'#FFF3CD', color:'#856404', label:'Pending'   },
  APPROVED:  { bg:'#D4EDDA', color:'#155724', label:'Approved'  },
  REJECTED:  { bg:'#F8D7DA', color:'#721C24', label:'Rejected'  },
  CANCELLED: { bg:'#E9ECEF', color:'#6C757D', label:'Cancelled' },
}

const LEAVE_COLORS = {
  CL:'#2874A6', SL:'#E06F39', EL:'#155724', ML:'#714B67',
  PL:'#0C5460', FH:'#856404', LOP:'#DC3545', PH:'#6C757D',
}

function ApplyModal({ employees, leaveTypes, onSave, onCancel }) {
  const [form, setForm] = useState({
    empCode:'', fromDate:'', toDate:'', leaveType:'CL',
    isHalfDay:false, reason:''
  })
  const [saving, setSaving] = useState(false)
  const [days,   setDays]   = useState(1)

  const selEmp = employees.find(e=>e.empCode===form.empCode)

  useEffect(()=>{
    if (form.fromDate && form.toDate) {
      const from = new Date(form.fromDate)
      const to   = new Date(form.toDate)
      const diff = Math.ceil((to-from)/(1000*60*60*24))+1
      setDays(form.isHalfDay ? 0.5 : Math.max(1, diff))
    }
  },[form.fromDate, form.toDate, form.isHalfDay])

  const save = async () => {
    if (!form.empCode||!form.fromDate||!form.reason)
      return toast.error('Employee, Date, Reason required!')
    setSaving(true)
    try {
      const extra = (() => { try { return JSON.parse(selEmp?.remarks||'{}') } catch { return {} } })()
      const payload = { ...form, days,
        empName: selEmp?.name||form.empCode,
        department: selEmp?.department||'',
        toDate: form.toDate||form.fromDate }
      const res  = await fetch(`${BASE_URL}/leave/applications`,
        { method:'POST', headers:authHdrs(), body:JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      onSave()
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const F = f => ({ value:form[f]||'', style:inp,
    onChange:e=>setForm(p=>({...p,[f]:e.target.value})),
    onFocus:e=>e.target.style.borderColor='#714B67',
    onBlur:e=>e.target.style.borderColor='#E0D5E0' })

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',
      display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999 }}>
      <div style={{ background:'#fff',borderRadius:10,width:560,
        overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:'#714B67',padding:'14px 20px',
          display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h3 style={{ color:'#fff',margin:0,fontFamily:'Syne,sans-serif',
            fontSize:15,fontWeight:700 }}>🌴 Apply Leave</h3>
          <span onClick={onCancel} style={{ color:'#fff',cursor:'pointer',fontSize:20 }}>✕</span>
        </div>
        <div style={{ padding:20,display:'flex',flexDirection:'column',gap:12 }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Employee *</label>
              <select value={form.empCode} style={{ ...inp,cursor:'pointer' }}
                onChange={e=>setForm(p=>({...p,empCode:e.target.value}))}>
                <option value="">-- Select Employee --</option>
                {employees.map(e=>(
                  <option key={e.empCode} value={e.empCode}>
                    {e.empCode} — {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>Leave Type *</label>
              <select value={form.leaveType} style={{ ...inp,cursor:'pointer' }}
                onChange={e=>setForm(p=>({...p,leaveType:e.target.value}))}>
                {leaveTypes.map(lt=>(
                  <option key={lt.code} value={lt.code}>
                    {lt.code} — {lt.name} ({lt.daysPerYear}d/yr)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>From Date *</label>
              <input type="date" {...F('fromDate')} /></div>
            <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
              display:'block',marginBottom:3 }}>To Date</label>
              <input type="date" {...F('toDate')} /></div>
            <div>
              <label style={{ fontSize:11,fontWeight:700,color:'#495057',
                display:'block',marginBottom:3 }}>Days</label>
              <div style={{ display:'flex',alignItems:'center',gap:8,height:38 }}>
                <span style={{ fontSize:20,fontWeight:800,color:'#714B67',
                  fontFamily:'Syne,sans-serif' }}>{days}</span>
                <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                  <input type="checkbox" checked={form.isHalfDay}
                    onChange={e=>setForm(p=>({...p,isHalfDay:e.target.checked}))}
                    style={{ width:14,height:14,accentColor:'#714B67' }} />
                  <span style={{ fontSize:11,color:'#6C757D' }}>Half day</span>
                </div>
              </div>
            </div>
          </div>
          <div><label style={{ fontSize:11,fontWeight:700,color:'#495057',
            display:'block',marginBottom:3 }}>Reason *</label>
            <textarea {...F('reason')} rows={2}
              style={{ ...inp,resize:'vertical' }}
              placeholder="Reason for leave..." />
          </div>
        </div>
        <div style={{ padding:'12px 20px',borderTop:'1px solid #E0D5E0',
          display:'flex',justifyContent:'space-between',alignItems:'center',
          background:'#F8F7FA' }}>
          <div style={{ fontSize:11,color:'#6C757D' }}>
            Leave days: <strong style={{ color:'#714B67',fontSize:14 }}>{days}</strong>
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={onCancel} style={{ padding:'8px 20px',background:'#fff',
              color:'#6C757D',border:'1.5px solid #E0D5E0',borderRadius:6,
              fontSize:13,cursor:'pointer' }}>Cancel</button>
            <button onClick={save} disabled={saving}
              style={{ padding:'8px 24px',background:saving?'#9E7D96':'#714B67',
                color:'#fff',border:'none',borderRadius:6,fontSize:13,
                fontWeight:700,cursor:'pointer' }}>
              {saving?'⏳ Applying...':'🌴 Apply Leave'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeaveRegister() {
  const now = new Date()
  const [view,      setView]      = useState('applications')
  const [month,     setMonth]     = useState(now.getMonth()+1)
  const [year,      setYear]      = useState(now.getFullYear())
  const [records,   setRecords]   = useState([])
  const [employees, setEmployees] = useState([])
  const [leaveTypes,setLeaveTypes]= useState([])
  const [loading,   setLoading]   = useState(true)
  const [showApply, setShowApply] = useState(false)
  const [chipStatus,setChipStatus]= useState('All')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [lRes,eRes,ltRes] = await Promise.all([
        fetch(`${BASE_URL}/leave/applications?month=${month}&year=${year}`,
          { headers:authHdrs2() }),
        fetch(`${BASE_URL}/employees`, { headers:authHdrs2() }),
        fetch(`${BASE_URL}/hr-master/leave-types`, { headers:authHdrs2() }),
      ])
      const lData  = await lRes.json()
      const eData  = await eRes.json()
      const ltData = await ltRes.json()
      setRecords(lData.data||[])
      setEmployees(eData.data||[])
      setLeaveTypes(ltData.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [month, year])

  useEffect(()=>{ fetchAll() }, [fetchAll])

  const filtered = chipStatus==='All'
    ? records : records.filter(r=>r.status===chipStatus)

  const kpi = {
    pending:  records.filter(r=>r.status==='PENDING').length,
    approved: records.filter(r=>r.status==='APPROVED').length,
    rejected: records.filter(r=>r.status==='REJECTED').length,
    totalDays:records.filter(r=>r.status==='APPROVED')
      .reduce((s,r)=>s+parseFloat(r.days||0),0),
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Leave Register <small>{MONTHS[month-1]} {year}</small>
        </div>
        <div className="fi-lv-actions">
          <select value={month} onChange={e=>setMonth(parseInt(e.target.value))}
            style={{ padding:'6px 10px',border:'1px solid #E0D5E0',
              borderRadius:5,fontSize:12,cursor:'pointer' }}>
            {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(parseInt(e.target.value))}
            style={{ padding:'6px 10px',border:'1px solid #E0D5E0',
              borderRadius:5,fontSize:12,cursor:'pointer' }}>
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-p sd-bsm"
            onClick={()=>setShowApply(true)}>+ Apply Leave</button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',
        gap:10,marginBottom:14 }}>
        {[
          { l:'Pending',     v:kpi.pending,  c:'#856404', bg:'#FFF3CD' },
          { l:'Approved',    v:kpi.approved, c:'#155724', bg:'#D4EDDA' },
          { l:'Rejected',    v:kpi.rejected, c:'#721C24', bg:'#F8D7DA' },
          { l:'Total Days',  v:kpi.totalDays,c:'#714B67', bg:'#EDE0EA' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg,borderRadius:8,
            padding:'10px 14px',border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10,color:k.c,fontWeight:700,
              textTransform:'uppercase',letterSpacing:.5 }}>{k.l}</div>
            <div style={{ fontSize:24,fontWeight:800,color:k.c,
              fontFamily:'Syne,sans-serif' }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Chips */}
      <div className="pp-chips">
        {['All','PENDING','APPROVED','REJECTED','CANCELLED'].map(s=>{
          const sc = STATUS_CONFIG[s]||{ bg:'#F0EEF0',color:'#6C757D',label:s }
          const cnt = s==='All'?records.length:records.filter(r=>r.status===s).length
          return (
            <div key={s} className={`pp-chip${chipStatus===s?' on':''}`}
              onClick={()=>setChipStatus(s)}>
              {sc.label||s} <span>{cnt}</span>
            </div>
          )
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding:40,textAlign:'center',color:'#6C757D' }}>⏳ Loading...</div>
      ) : (
        <div style={{ border:'1px solid #E0D5E0',borderRadius:8,
          overflow:'hidden',maxHeight:'calc(100vh - 380px)',overflowY:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky',top:0,zIndex:10,
              background:'#F8F4F8',boxShadow:'0 2px 4px rgba(0,0,0,.06)' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Leave No','Employee','Dept','Type','From','To',
                  'Days','Reason','Status','Applied On'].map(h=>(
                  <th key={h} style={{ padding:'10px 12px',fontSize:10,
                    fontWeight:700,color:'#6C757D',textAlign:'left',
                    textTransform:'uppercase',letterSpacing:.3,
                    whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={10} style={{ padding:40,textAlign:'center',
                  color:'#6C757D' }}>No leave records for {MONTHS[month-1]} {year}</td></tr>
              ) : filtered.map((r,i)=>{
                const sc = STATUS_CONFIG[r.status]||{}
                return (
                  <tr key={r.id} style={{ borderBottom:'1px solid #F0EEF0',
                    background:i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                      fontWeight:700,color:'#714B67',fontSize:11 }}>{r.leaveNo}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <div style={{ fontWeight:700,fontSize:13 }}>{r.empName}</div>
                      <div style={{ fontSize:10,color:'#6C757D' }}>{r.empCode}</div>
                    </td>
                    <td style={{ padding:'9px 12px',fontSize:12,color:'#6C757D' }}>
                      {r.department}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ padding:'2px 8px',borderRadius:10,
                        fontSize:11,fontWeight:700,
                        background:`${LEAVE_COLORS[r.leaveType]||'#6C757D'}22`,
                        color:LEAVE_COLORS[r.leaveType]||'#6C757D' }}>
                        {r.leaveType}
                      </span>
                    </td>
                    <td style={{ padding:'9px 12px',fontSize:12,
                      fontFamily:'DM Mono,monospace' }}>
                      {new Date(r.fromDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding:'9px 12px',fontSize:12,
                      fontFamily:'DM Mono,monospace' }}>
                      {new Date(r.toDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding:'9px 12px',textAlign:'center',
                      fontWeight:800,fontSize:14,color:'#714B67',
                      fontFamily:'Syne,sans-serif' }}>
                      {parseFloat(r.days).toFixed(1)}</td>
                    <td style={{ padding:'9px 12px',fontSize:12,
                      color:'#495057',maxWidth:200,
                      overflow:'hidden',textOverflow:'ellipsis',
                      whiteSpace:'nowrap' }}>{r.reason}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ padding:'3px 10px',borderRadius:10,
                        fontSize:11,fontWeight:700,
                        background:sc.bg,color:sc.color }}>
                        {sc.label||r.status}
                      </span>
                    </td>
                    <td style={{ padding:'9px 12px',fontSize:11,color:'#6C757D' }}>
                      {new Date(r.appliedOn).toLocaleDateString('en-IN')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showApply && (
        <ApplyModal employees={employees} leaveTypes={leaveTypes}
          onSave={()=>{ setShowApply(false); fetchAll() }}
          onCancel={()=>setShowApply(false)} />
      )}
    </div>
  )
}
