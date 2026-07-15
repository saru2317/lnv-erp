import React,{useState,useEffect,useCallback}from 'react'
import toast from 'react-hot-toast'

const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
// Mirrors backend canApprove() in config/approvalRoles.js — HR/Manager/Admin/Super
// Admin roles own the HCM module and can approve LEAVE. Kept in sync manually
// since this is a different app (frontend vs backend); if you add an approver
// role on the backend, add it here too.
const LEAVE_APPROVER_ROLES=['HR','MANAGER','ADMIN','SUPER_ADMIN']
const canApproveLeave=()=>{
  try{
    const role=(JSON.parse(localStorage.getItem('lnv_user')||'{}').role||'').toUpperCase().trim()
    return LEAVE_APPROVER_ROLES.some(r=>role.includes(r))
  }catch{return false}
}
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'
const inp={padding:'7px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',boxSizing:'border-box'}
const lbl={fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}
const PAGE_SIZE=20

const STATUS_CLR={
  PENDING:  {bg:'#FEF9E7',color:'#B8860B'},
  APPROVED: {bg:'#E8F5E9',color:'#1E8449'},
  REJECTED: {bg:'#FDEDEC',color:'#C0392B'},
  CANCELLED:{bg:'#F5F5F5',color:'#888'},
}
const calcDays=(from,to)=>{
  if(!from||!to)return''
  const d=Math.ceil((new Date(to)-new Date(from))/(1000*60*60*24))+1
  return d>0?String(d):''
}
const MONTHS=[['01','January'],['02','February'],['03','March'],['04','April'],
  ['05','May'],['06','June'],['07','July'],['08','August'],
  ['09','September'],['10','October'],['11','November'],['12','December']]
const YEARS=Array.from({length:5},(_,i)=>String(new Date().getFullYear()-i))
const EMPTY={staffId:'',staffCode:'',staffName:'',department:'EDUCATION',
  leaveType:'',fromDate:'',toDate:'',days:'1',reason:'',isHalfDay:false,halfDaySession:''}

export default function StaffLeave(){
  const [leaves,   setLeaves]   = useState([])
  const [staffList,setStaffList]= useState([])
  const [leaveTypes,setLeaveTypes]=useState([])
  const [balance,  setBalance]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [stats,    setStats]    = useState({total:0,pending:0,approved:0,rejected:0})

  // Filters
  const [staffFilter,  setStaffFilter]  = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [month,setMonth]=useState(()=>String(new Date().getMonth()+1).padStart(2,'0'))
  const [year, setYear] =useState(()=>String(new Date().getFullYear()))

  // Pagination
  const [page,      setPage]      = useState(1)
  const [totalPages,setTotalPages]= useState(1)
  const [totalCount,setTotalCount]= useState(0)

  // Modals
  const [showAdd,      setShowAdd]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [confirmAction,setConfirmAction]= useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [form,setForm]=useState(EMPTY)
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  // Load staff + HR leave types on mount
  const instId = localStorage.getItem('lnv_edu_inst') || ''
  useEffect(()=>{
    // Get education staff
    fetch(`${BASE}/edu/staff?limit=200&institutionId=${instId}`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setStaffList(d.data||[])).catch(()=>{})
    // Get leave types (LeaveType is a company-wide HR master — same policy
    // for Education staff as everyone else, not Education-specific data)
    fetch(`${BASE}/leave/types`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setLeaveTypes(d.data||[])).catch(()=>{
        // Fallback: hardcoded from HR schema
        setLeaveTypes([
          {code:'CL', name:'Casual Leave',    daysPerYear:12},
          {code:'SL', name:'Sick Leave',      daysPerYear:12},
          {code:'EL', name:'Earned Leave',    daysPerYear:15},
          {code:'ML', name:'Maternity Leave', daysPerYear:90},
          {code:'LOP',name:'Loss of Pay',     daysPerYear:0},
        ])
      })
  },[])

  // Load leave balance when staff selected in form
  useEffect(()=>{
    if(!form.staffCode)return
    fetch(`${BASE}/leave/balance/${form.staffCode}`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setBalance(d.data||[])).catch(()=>setBalance([]))
  },[form.staffCode])

  // Load leave applications (HR table, filtered by department=EDUCATION)
  const load=useCallback(async()=>{
    setLoading(true)
    try{
      const params=new URLSearchParams()
      if(staffFilter) params.set('empCode',staffFilter)
      if(statusFilter)params.set('status',statusFilter)
      if(month)params.set('month',month)
      if(year) params.set('year',year)
      params.set('department','EDUCATION')
      // Get from HR leave applications API
      const r=await fetch(`${BASE}/leave/applications?${params}`,{headers:hdr2()})
      const d=await r.json()
      const all=d.data||[]
      // Pagination client-side (HR API may not support it)
      const total=all.length
      const pg=page
      const paginated=all.slice((pg-1)*PAGE_SIZE, pg*PAGE_SIZE)
      setLeaves(paginated)
      setTotalCount(total)
      setTotalPages(Math.max(1,Math.ceil(total/PAGE_SIZE)))
      setStats({
        total:all.length,
        pending: all.filter(l=>l.status==='PENDING').length,
        approved:all.filter(l=>l.status==='APPROVED').length,
        rejected:all.filter(l=>l.status==='REJECTED').length,
      })
    }catch{}finally{setLoading(false)}
  },[staffFilter,statusFilter,month,year,page])
  useEffect(()=>{load()},[load])
  useEffect(()=>{setPage(1)},[staffFilter,statusFilter,month,year])

  // Pick staff → auto-fill empCode + empName
  const pickStaff=(staffId)=>{
    const s=staffList.find(x=>String(x.id)===String(staffId))
    if(!s)return
    setForm(f=>({...f,staffId,staffCode:s.staffCode,staffName:s.name,
      department:'EDUCATION'}))
  }

  // Apply Leave → POST to HR leave applications
  const save=async()=>{
    if(!form.staffCode)return toast.error('Select staff member')
    if(!form.leaveType)return toast.error('Select leave type')
    if(!form.fromDate||!form.toDate)return toast.error('Select leave dates')
    if(new Date(form.toDate)<new Date(form.fromDate))return toast.error('To date must be after from date')
    if(!form.reason.trim())return toast.error('Reason is required')
    if(form.isHalfDay && !form.halfDaySession)return toast.error('Select 1st Half or 2nd Half')
    // Check balance
    const bal=balance.find(b=>b.code===form.leaveType)
    if(bal&&bal.balance<parseFloat(form.days||1)&&form.leaveType!=='LOP'){
      return toast.error(`Insufficient ${form.leaveType} balance. Available: ${bal.balance} days`)
    }
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/leave/applications`,{method:'POST',headers:hdr(),
        body:JSON.stringify({
          empCode:   form.staffCode,
          empName:   form.staffName,
          department:'EDUCATION',
          leaveType: form.leaveType,
          fromDate:  form.fromDate,
          toDate:    form.toDate,
          days:      parseFloat(form.days||1),
          reason:    form.reason,
          isHalfDay: form.isHalfDay,
          halfDaySession: form.isHalfDay ? form.halfDaySession : null,
        })})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success(`✅ ${d.data.leaveNo} applied!`)
      setShowAdd(false);setForm(EMPTY);setBalance([]);load()
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  // Approve
  const doApprove=async()=>{
    if(!confirmAction)return
    try{
      const r=await fetch(`${BASE}/leave/applications/${confirmAction.leave.id}/approve`,
        {method:'PATCH',headers:hdr(),body:JSON.stringify({remarks:'Approved by Education Admin'})})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success(`✅ Leave Approved: ${confirmAction.leave.empName}`)
      setConfirmAction(null);load()
    }catch{toast.error('Failed')}
  }

  // Reject
  const doReject=async()=>{
    if(!confirmAction)return
    if(!rejectReason.trim())return toast.error('Rejection reason required')
    try{
      const r=await fetch(`${BASE}/leave/applications/${confirmAction.leave.id}/reject`,
        {method:'PATCH',headers:hdr(),body:JSON.stringify({rejectReason})})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success(`❌ Leave Rejected: ${confirmAction.leave.empName}`)
      setConfirmAction(null);setRejectReason('');load()
    }catch{toast.error('Failed')}
  }

  // Cancel
  const doCancel=async(leave)=>{
    try{
      await fetch(`${BASE}/leave/applications/${leave.id}/cancel`,{method:'PATCH',headers:hdr()})
      toast.success('Leave cancelled')
      load()
    }catch{toast.error('Failed')}
  }

  const Pagination=()=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px'}}>
      <div style={{fontSize:12,color:'#888'}}>
        Showing <strong>{Math.min((page-1)*PAGE_SIZE+1,totalCount)}–{Math.min(page*PAGE_SIZE,totalCount)}</strong> of <strong>{totalCount}</strong> records
      </div>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <button onClick={()=>setPage(1)} disabled={page===1}
          style={{padding:'4px 8px',border:'1px solid #ddd',borderRadius:4,cursor:page===1?'not-allowed':'pointer',background:page===1?'#f5f5f5':'#fff',color:page===1?'#ccc':'#555',fontSize:12}}>«</button>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
          style={{padding:'4px 10px',border:'1px solid #ddd',borderRadius:4,cursor:page===1?'not-allowed':'pointer',background:page===1?'#f5f5f5':'#fff',color:page===1?'#ccc':'#555',fontSize:12}}>‹ Prev</button>
        {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
          let p=totalPages<=5?i+1:page<=3?i+1:page>=totalPages-2?totalPages-4+i:page-2+i
          return(<button key={p} onClick={()=>setPage(p)}
            style={{padding:'4px 10px',border:`1px solid ${p===page?'#6E2C00':'#ddd'}`,borderRadius:4,
              cursor:'pointer',fontSize:12,fontWeight:p===page?700:400,
              background:p===page?'#6E2C00':'#fff',color:p===page?'#fff':'#555',minWidth:32}}>{p}</button>)
        })}
        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
          style={{padding:'4px 10px',border:'1px solid #ddd',borderRadius:4,cursor:page===totalPages?'not-allowed':'pointer',background:page===totalPages?'#f5f5f5':'#fff',color:page===totalPages?'#ccc':'#555',fontSize:12}}>Next ›</button>
        <button onClick={()=>setPage(totalPages)} disabled={page===totalPages}
          style={{padding:'4px 8px',border:'1px solid #ddd',borderRadius:4,cursor:page===totalPages?'not-allowed':'pointer',background:page===totalPages?'#f5f5f5':'#fff',color:page===totalPages?'#ccc':'#555',fontSize:12}}>»</button>
      </div>
    </div>
  )

  return(
    <div style={{fontFamily:'DM Sans,sans-serif',display:'flex',flexDirection:'column',height:'100%'}}>

      {/* ── STICKY HEADER ── */}
      <div style={{position:'sticky',top:-16,zIndex:100,background:'#fff',
        margin:'-16px -16px 0 -16px',
        borderBottom:'2px solid #E8E0E8',boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px'}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>🗓️ Staff Leave Register</div>
            <div style={{fontSize:11,color:'#888',display:'flex',gap:12,alignItems:'center'}}>
              <span>{stats.total} total · {stats.pending} pending · {stats.approved} approved</span>
              <span style={{background:'#E8F5E9',color:'#1E8449',padding:'1px 8px',borderRadius:10,
                fontSize:10,fontWeight:700}}>🔗 Linked to HR Leave Policy</span>
            </div>
          </div>
          <button onClick={()=>{setForm(EMPTY);setBalance([]);setShowAdd(true)}}
            style={{padding:'8px 18px',background:'#6E2C00',color:'#fff',border:'none',
              borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
            + Apply Leave
          </button>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0,borderTop:'1px solid #F5EDE0'}}>
          {[
            ['📋 Total',    stats.total,    '#6E2C00','#FDF2E9'],
            ['⏳ Pending',  stats.pending,  '#B8860B','#FEF9E7'],
            ['✅ Approved', stats.approved, '#1E8449','#E8F5E9'],
            ['❌ Rejected', stats.rejected, '#C0392B','#FDEDEC'],
          ].map(([l,v,c,bg])=>(
            <div key={l} style={{background:bg,padding:'8px 16px',borderRight:'1px solid #E8E0E8',
              display:'flex',gap:12,alignItems:'center',cursor:'pointer'}}
              onClick={()=>setStatusFilter(statusFilter===l.split(' ')[1]?.toUpperCase()||'')}>
              <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:10,color:'#888',fontWeight:600}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{padding:'8px 16px',background:'#FAFAFA',borderTop:'1px solid #F0EDE8',
          display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <select value={staffFilter} onChange={e=>setStaffFilter(e.target.value)} style={{...inp,width:210}}>
            <option value=''>All Staff</option>
            {staffList.map(s=><option key={s.staffCode} value={s.staffCode}>{s.name} ({s.staffCode})</option>)}
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{...inp,width:120}}>
            <option value=''>All Status</option>
            <option value='PENDING'>Pending</option>
            <option value='APPROVED'>Approved</option>
            <option value='REJECTED'>Rejected</option>
            <option value='CANCELLED'>Cancelled</option>
          </select>
          <select value={month} onChange={e=>setMonth(e.target.value)} style={{...inp,width:130}}>
            {MONTHS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(e.target.value)} style={{...inp,width:90}}>
            {YEARS.map(y=><option key={y}>{y}</option>)}
          </select>
          <button onClick={load}
            style={{...inp,padding:'7px 14px',background:'#FDF2E9',border:'1px solid #6E2C00',
              cursor:'pointer',fontWeight:600,color:'#6E2C00'}}>🔄 Refresh</button>
          {(staffFilter||statusFilter)&&(
            <button onClick={()=>{setStaffFilter('');setStatusFilter('')}}
              style={{...inp,padding:'7px 14px',background:'#F5F5F5',border:'1px solid #ddd',
                cursor:'pointer',fontWeight:600,color:'#888'}}>✕ Clear</button>
          )}
          <div style={{marginLeft:'auto',fontSize:11,color:'#888'}}>
            {totalCount} records · Page {page}/{totalPages}
          </div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{flex:1,overflowY:'auto',overflowX:'auto'}}>
        {loading?(
          <div style={{padding:60,textAlign:'center',color:'#aaa'}}>
            <div style={{fontSize:32,marginBottom:12}}>⏳</div>Loading...
          </div>
        ):leaves.length===0?(
          <div style={{padding:60,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>🗓️</div>
            <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:6}}>No Leave Records</div>
            <div style={{fontSize:12,color:'#888',marginBottom:20}}>No leaves found for selected period</div>
            <button onClick={()=>{setForm(EMPTY);setBalance([]);setShowAdd(true)}}
              style={{padding:'9px 22px',background:'#6E2C00',color:'#fff',border:'none',
                borderRadius:6,cursor:'pointer',fontWeight:700}}>+ Apply Leave</button>
          </div>
        ):(
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#6E2C00',color:'#fff',position:'sticky',top:0,zIndex:10}}>
                {['Leave No','Staff','Leave Type','From','To','Days','Reason','Applied','Status','Actions'].map(h=>(
                  <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,
                    fontWeight:600,whiteSpace:'nowrap',background:'#6E2C00'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaves.map((l,i)=>{
                const sc=STATUS_CLR[l.status]||STATUS_CLR.PENDING
                const isPending=l.status==='PENDING'
                const isApproved=l.status==='APPROVED'
                return(
                  <tr key={l.id}
                    style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#FEF9F5'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDF9F7'}>
                    <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:10,
                      color:'#6E2C00',fontWeight:700,whiteSpace:'nowrap'}}>{l.leaveNo}</td>
                    <td style={{padding:'9px 12px'}}>
                      <div style={{fontWeight:700}}>{l.empName}</div>
                      <div style={{fontSize:10,color:'#aaa',fontFamily:'monospace'}}>{l.empCode}</div>
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <div style={{fontWeight:700,color:'#6E2C00'}}>{l.leaveType}</div>
                      {l.isHalfDay&&<div style={{fontSize:10,color:'#714B67'}}>Half Day — {l.halfDaySession==='SECOND_HALF'?'2nd Half':'1st Half'}</div>}
                    </td>
                    <td style={{padding:'9px 12px',whiteSpace:'nowrap',fontSize:11}}>{fmtD(l.fromDate)}</td>
                    <td style={{padding:'9px 12px',whiteSpace:'nowrap',fontSize:11}}>{fmtD(l.toDate)}</td>
                    <td style={{padding:'9px 12px',textAlign:'center',fontWeight:700,
                      color:Number(l.days)>5?'#C0392B':'#333'}}>
                      {l.days}{Number(l.days)>5&&' ⚠️'}
                    </td>
                    <td style={{padding:'9px 12px',color:'#555',fontSize:11,maxWidth:160}}>
                      <div style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.reason||'—'}</div>
                    </td>
                    <td style={{padding:'9px 12px',fontSize:10,color:'#888',whiteSpace:'nowrap'}}>{fmtD(l.appliedOn)}</td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                        background:sc.bg,color:sc.color,whiteSpace:'nowrap'}}>{l.status}</span>
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <div style={{display:'flex',gap:4}}>
                        {isPending&&canApproveLeave()&&(<>
                          <button onClick={()=>setConfirmAction({leave:l,action:'APPROVE'})}
                            style={{padding:'4px 8px',background:'#E8F5E9',color:'#1E8449',
                              border:'1px solid #A9DFBF',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                            ✅ Approve
                          </button>
                          <button onClick={()=>{setConfirmAction({leave:l,action:'REJECT'});setRejectReason('')}}
                            style={{padding:'4px 8px',background:'#FDEDEC',color:'#C0392B',
                              border:'1px solid #F1948A',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                            ❌ Reject
                          </button>
                        </>)}
                        {(isPending||isApproved)&&(
                          <button onClick={()=>doCancel(l)}
                            style={{padding:'4px 8px',background:'#F5F5F5',color:'#888',
                              border:'1px solid #ddd',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                            🚫 Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── PAGINATION FOOTER ── */}
      {!loading&&totalCount>0&&(
        <div style={{position:'sticky',bottom:-16,background:'#fff',
          margin:'0 -16px -16px -16px',
          borderTop:'2px solid #E8E0E8',boxShadow:'0 -2px 8px rgba(0,0,0,.06)'}}>
          <Pagination/>
        </div>
      )}

      {/* ── APPLY LEAVE MODAL ── */}
      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:560,
            maxHeight:'90vh',overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#6E2C00'}}>🗓️ Apply Leave</div>
                <div style={{fontSize:11,color:'#888'}}>Submitted to HR Leave Policy</div>
              </div>
              <button onClick={()=>setShowAdd(false)}
                style={{background:'#f0f0f0',border:'none',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontWeight:700,fontSize:14}}>✕</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              {/* Staff */}
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Staff Member *</label>
                <select value={form.staffId} onChange={e=>pickStaff(e.target.value)} style={{...inp,width:'100%'}}>
                  <option value=''>Select Staff</option>
                  {staffList.map(s=><option key={s.id} value={s.id}>{s.name} — {s.designation||s.staffCode}</option>)}
                </select>
              </div>

              {/* Leave Balance — shown after staff selected */}
              {form.staffCode&&balance.length>0&&(
                <div style={{gridColumn:'1/-1',background:'#F0EBF0',borderRadius:8,padding:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#714B67',marginBottom:8}}>
                    📊 Leave Balance — {form.staffName}
                  </div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {balance.map(b=>(
                      <div key={b.code} style={{background:'#fff',borderRadius:6,padding:'6px 12px',
                        border:`1.5px solid ${b.balance<=0?'#F1948A':'#E8E0E8'}`,textAlign:'center',minWidth:80}}>
                        <div style={{fontSize:10,color:'#888'}}>{b.code}</div>
                        <div style={{fontSize:16,fontWeight:800,color:b.balance<=0?'#C0392B':'#1E8449'}}>{b.balance}</div>
                        <div style={{fontSize:9,color:'#aaa'}}>available</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leave Type */}
              <div><label style={lbl}>Leave Type *</label>
                <select value={form.leaveType} onChange={e=>set('leaveType',e.target.value)} style={{...inp,width:'100%'}}>
                  <option value=''>Select</option>
                  {leaveTypes.map(t=>(
                    <option key={t.code} value={t.code}>{t.code} — {t.name} ({t.daysPerYear||'∞'} days/yr)</option>
                  ))}
                </select></div>
              <div><label style={lbl}>Number of Days</label>
                <input type='number' value={form.days} min='0.5' step='0.5'
                  onChange={e=>set('days',e.target.value)}
                  style={{...inp,width:'100%',fontWeight:700,fontSize:14}}/></div>
              <div><label style={lbl}>From Date *</label>
                <input type='date' value={form.fromDate} onChange={e=>{
                  set('fromDate',e.target.value)
                  const d=calcDays(e.target.value,form.toDate)
                  if(d)set('days',d)
                }} style={{...inp,width:'100%'}}/></div>
              <div><label style={lbl}>To Date *</label>
                <input type='date' value={form.toDate} onChange={e=>{
                  set('toDate',e.target.value)
                  const d=calcDays(form.fromDate,e.target.value)
                  if(d)set('days',d)
                }} style={{...inp,width:'100%'}}/></div>
              <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:8}}>
                <input type='checkbox' id='halfday' checked={form.isHalfDay}
                  onChange={e=>{
                    set('isHalfDay',e.target.checked)
                    if(e.target.checked)set('days','0.5')
                    else set('halfDaySession','')
                  }}
                  style={{width:16,height:16,accentColor:'#6E2C00'}}/>
                <label htmlFor='halfday' style={{fontSize:12,fontWeight:600,cursor:'pointer'}}>Half Day Leave</label>
                {form.isHalfDay && (
                  <div style={{display:'flex',gap:14,marginLeft:10}}>
                    <label style={{display:'flex',alignItems:'center',gap:5,fontSize:12,cursor:'pointer'}}>
                      <input type='radio' name='halfDaySession' value='FIRST_HALF'
                        checked={form.halfDaySession==='FIRST_HALF'}
                        onChange={()=>set('halfDaySession','FIRST_HALF')}
                        style={{accentColor:'#6E2C00'}}/>
                      1st Half
                    </label>
                    <label style={{display:'flex',alignItems:'center',gap:5,fontSize:12,cursor:'pointer'}}>
                      <input type='radio' name='halfDaySession' value='SECOND_HALF'
                        checked={form.halfDaySession==='SECOND_HALF'}
                        onChange={()=>set('halfDaySession','SECOND_HALF')}
                        style={{accentColor:'#6E2C00'}}/>
                      2nd Half
                    </label>
                  </div>
                )}
              </div>
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Reason *</label>
                <input value={form.reason} onChange={e=>set('reason',e.target.value)}
                  placeholder='Reason for leave (required by HR policy)...'
                  style={{...inp,width:'100%'}}/></div>
            </div>

            {/* Date Preview */}
            {form.fromDate&&form.toDate&&(
              <div style={{marginTop:12,padding:'8px 12px',background:'#F8F5F8',borderRadius:6,
                fontSize:12,color:'#714B67',fontWeight:600}}>
                📅 {fmtD(form.fromDate)} → {fmtD(form.toDate)} = <strong>{form.days} day(s)</strong>
                {form.leaveType&&balance.find(b=>b.code===form.leaveType)&&(
                  <span style={{marginLeft:12,color:
                    balance.find(b=>b.code===form.leaveType)?.balance>=parseFloat(form.days)?'#1E8449':'#C0392B'}}>
                    · Balance after: <strong>
                      {(balance.find(b=>b.code===form.leaveType)?.balance||0)-parseFloat(form.days||0)} days
                    </strong>
                  </span>
                )}
              </div>
            )}

            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
              <button onClick={()=>setShowAdd(false)}
                style={{padding:'8px 18px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={save} disabled={saving}
                style={{padding:'8px 24px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>
                {saving?'⏳ Submitting...':'📋 Submit to HR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── APPROVE CONFIRM ── */}
      {confirmAction?.action==='APPROVE'&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:400,
            boxShadow:'0 16px 48px rgba(0,0,0,.3)',textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>✅</div>
            <div style={{fontSize:16,fontWeight:800,color:'#1E8449',marginBottom:8}}>Approve Leave?</div>
            <div style={{fontSize:14,fontWeight:700,color:'#333',marginBottom:4}}>{confirmAction.leave.empName}</div>
            <div style={{fontSize:12,color:'#888',marginBottom:20}}>
              {confirmAction.leave.leaveType} · {confirmAction.leave.days} day(s)<br/>
              {fmtD(confirmAction.leave.fromDate)} → {fmtD(confirmAction.leave.toDate)}
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>setConfirmAction(null)}
                style={{padding:'9px 22px',background:'#f0f0f0',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={doApprove}
                style={{padding:'9px 22px',background:'#1E8449',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>
                ✅ Approve Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT CONFIRM ── */}
      {confirmAction?.action==='REJECT'&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:440,
            boxShadow:'0 16px 48px rgba(0,0,0,.3)'}}>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:48,marginBottom:8}}>❌</div>
              <div style={{fontSize:16,fontWeight:800,color:'#C0392B'}}>Reject Leave?</div>
              <div style={{fontSize:14,fontWeight:700,color:'#333',marginTop:4}}>{confirmAction.leave.empName}</div>
              <div style={{fontSize:12,color:'#888'}}>
                {confirmAction.leave.leaveType} · {confirmAction.leave.days} day(s)
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={lbl}>Rejection Reason * (required by HR policy)</label>
              <input value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
                placeholder='Enter reason for rejection...'
                style={{...inp,width:'100%'}}/>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>{setConfirmAction(null);setRejectReason('')}}
                style={{padding:'9px 22px',background:'#f0f0f0',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={doReject}
                style={{padding:'9px 22px',background:'#C0392B',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>
                ❌ Reject Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
