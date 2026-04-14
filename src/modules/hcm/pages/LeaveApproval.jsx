import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const LEAVE_COLORS = {
  CL:'#2874A6', SL:'#E06F39', EL:'#155724', ML:'#714B67',
  PL:'#0C5460', FH:'#856404', LOP:'#DC3545',
}

export default function LeaveApproval() {
  const [pending,   setPending]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [rejectId,  setRejectId]  = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing,setProcessing]= useState(null)

  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/leave/applications?status=PENDING`,
        { headers:authHdrs2() })
      const data = await res.json()
      setPending(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchPending() }, [])

  const approve = async (id) => {
    setProcessing(id)
    try {
      const res  = await fetch(`${BASE_URL}/leave/applications/${id}/approve`,
        { method:'PATCH',headers:authHdrs(),body:JSON.stringify({ remarks:'Approved' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Leave Approved!')
      fetchPending()
    } catch(e){ toast.error(e.message) } finally { setProcessing(null) }
  }

  const approveAll = async () => {
    if (!confirm(`Approve all ${pending.length} pending leaves?`)) return
    for (const p of pending) await approve(p.id)
    toast.success('All leaves approved!')
  }

  const reject = async () => {
    if (!rejectReason) return toast.error('Reason required!')
    setProcessing(rejectId)
    try {
      const res  = await fetch(`${BASE_URL}/leave/applications/${rejectId}/reject`,
        { method:'PATCH',headers:authHdrs(),body:JSON.stringify({ rejectReason }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Leave Rejected')
      setRejectId(null); setRejectReason(''); fetchPending()
    } catch(e){ toast.error(e.message) } finally { setProcessing(null) }
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Leave Approval
          <small style={{ color:pending.length>0?'#856404':'#6C757D' }}>
            {pending.length} pending
          </small>
        </div>
        <div className="fi-lv-actions">
          {pending.length>0 && (
            <button className="btn btn-p sd-bsm"
              style={{ background:'#28A745',border:'none' }}
              onClick={approveAll}>
              ✅ Approve All ({pending.length})
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding:40,textAlign:'center',color:'#6C757D' }}>⏳ Loading...</div>
      ) : pending.length===0 ? (
        <div style={{ padding:60,textAlign:'center',color:'#6C757D',
          background:'#fff',borderRadius:8,border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:40,marginBottom:12 }}>✅</div>
          <div style={{ fontWeight:700,fontSize:15 }}>All caught up!</div>
          <div style={{ fontSize:12,marginTop:4 }}>No pending leave approvals</div>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {pending.map(p=>(
            <div key={p.id} style={{ background:'#fff',borderRadius:8,
              border:'1px solid #E0D5E0',padding:'16px 18px',
              boxShadow:'0 1px 4px rgba(0,0,0,.05)',
              display:'flex',justifyContent:'space-between',
              alignItems:'center',flexWrap:'wrap',gap:10,
              borderLeft:`4px solid ${LEAVE_COLORS[p.leaveType]||'#6C757D'}` }}>
              <div style={{ display:'flex',gap:16,alignItems:'center',flex:1 }}>
                {/* Leave type badge */}
                <div style={{ width:52,height:52,borderRadius:10,
                  background:`${LEAVE_COLORS[p.leaveType]||'#6C757D'}22`,
                  display:'flex',flexDirection:'column',
                  alignItems:'center',justifyContent:'center' }}>
                  <div style={{ fontSize:14,fontWeight:800,
                    color:LEAVE_COLORS[p.leaveType]||'#6C757D' }}>
                    {p.leaveType}
                  </div>
                  <div style={{ fontSize:11,fontWeight:700,
                    color:LEAVE_COLORS[p.leaveType]||'#6C757D' }}>
                    {parseFloat(p.days).toFixed(1)}d
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:14,color:'#1C1C1C' }}>
                    {p.empName}
                    <span style={{ marginLeft:8,fontSize:11,color:'#6C757D',
                      fontWeight:400 }}>{p.empCode} · {p.department}</span>
                  </div>
                  <div style={{ fontSize:12,color:'#495057',marginTop:3 }}>
                    📅 {new Date(p.fromDate).toLocaleDateString('en-IN')}
                    {p.fromDate!==p.toDate &&
                      ` → ${new Date(p.toDate).toLocaleDateString('en-IN')}`}
                    <span style={{ marginLeft:8,color:'#714B67',fontWeight:600 }}>
                      ({parseFloat(p.days)} days)
                    </span>
                  </div>
                  <div style={{ fontSize:12,color:'#6C757D',marginTop:2 }}>
                    💬 {p.reason}
                  </div>
                  <div style={{ fontSize:10,color:'#6C757D',marginTop:2 }}>
                    Applied: {new Date(p.appliedOn).toLocaleDateString('en-IN')} ·
                    {p.leaveNo}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={()=>approve(p.id)}
                  disabled={processing===p.id}
                  style={{ padding:'7px 18px',background:'#28A745',
                    color:'#fff',border:'none',borderRadius:6,fontSize:12,
                    fontWeight:700,cursor:'pointer',whiteSpace:'nowrap' }}>
                  {processing===p.id?'⏳':'✅'} Approve
                </button>
                <button onClick={()=>setRejectId(p.id)}
                  style={{ padding:'7px 14px',background:'#fff',
                    color:'#DC3545',border:'1.5px solid #DC3545',
                    borderRadius:6,fontSize:12,cursor:'pointer',
                    fontWeight:600,whiteSpace:'nowrap' }}>
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999 }}>
          <div style={{ background:'#fff',borderRadius:10,width:440,
            overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ background:'#DC3545',padding:'14px 20px',
              display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <h3 style={{ color:'#fff',margin:0,fontFamily:'Syne,sans-serif',
                fontSize:15,fontWeight:700 }}>❌ Reject Leave</h3>
              <span onClick={()=>{ setRejectId(null); setRejectReason('') }}
                style={{ color:'#fff',cursor:'pointer',fontSize:20 }}>✕</span>
            </div>
            <div style={{ padding:20 }}>
              <div style={{ fontSize:13,color:'#495057',marginBottom:12 }}>
                {pending.find(p=>p.id===rejectId)?.empName} —
                {pending.find(p=>p.id===rejectId)?.leaveType}
                ({pending.find(p=>p.id===rejectId)?.days} days)
              </div>
              <label style={{ fontSize:11,fontWeight:700,color:'#495057',
                display:'block',marginBottom:4 }}>Rejection Reason *</label>
              <textarea value={rejectReason}
                onChange={e=>setRejectReason(e.target.value)}
                rows={3} style={{ padding:'8px 10px',border:'1.5px solid #E0D5E0',
                  borderRadius:5,fontSize:12,outline:'none',width:'100%',
                  boxSizing:'border-box',resize:'vertical' }}
                placeholder="Reason for rejection..." />
            </div>
            <div style={{ padding:'12px 20px',borderTop:'1px solid #E0D5E0',
              display:'flex',justifyContent:'flex-end',gap:10,background:'#F8F7FA' }}>
              <button onClick={()=>{ setRejectId(null); setRejectReason('') }}
                style={{ padding:'8px 20px',background:'#fff',color:'#6C757D',
                  border:'1.5px solid #E0D5E0',borderRadius:6,
                  fontSize:13,cursor:'pointer' }}>Cancel</button>
              <button onClick={reject} disabled={!!processing}
                style={{ padding:'8px 24px',background:'#DC3545',
                  color:'#fff',border:'none',borderRadius:6,fontSize:13,
                  fontWeight:700,cursor:'pointer' }}>
                {processing?'⏳':'❌'} Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
