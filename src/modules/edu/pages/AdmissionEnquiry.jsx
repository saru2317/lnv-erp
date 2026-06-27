import React,{useState,useEffect,useCallback}from 'react'
import {useNavigate}from 'react-router-dom'
import toast from 'react-hot-toast'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'
const toISO=d=>d?new Date(d).toISOString().slice(0,10):''
const inp={padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}
const lbl={fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}
const STATUS_CLR={
  NEW:           {bg:'#EBF5FB',color:'#1A5276'},
  FOLLOW_UP:     {bg:'#FEF9E7',color:'#B8860B'},
  INTERVIEW:     {bg:'#F0EBF0',color:'#714B67'},
  ADMITTED:      {bg:'#E8F5E9',color:'#1E8449'},
  NOT_INTERESTED:{bg:'#F5F5F5',color:'#666'},
  DEACTIVATED:   {bg:'#FDEDEC',color:'#C0392B'},
}
const EMPTY={studentName:'',dob:'',gender:'',classApplying:'',fatherName:'',motherName:'',
  phone:'',email:'',address:'',source:'WALK_IN',remarks:'',followUpDate:''}

export default function AdmissionEnquiry(){
  const nav=useNavigate()
  const [enquiries,setEnquiries]=useState([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [statusFilter,setStatusFilter]=useState('')
  const [showAdd,setShowAdd]=useState(false)
  const [showEdit,setShowEdit]=useState(false)
  const [editId,setEditId]=useState(null)
  const [saving,setSaving]=useState(false)
  const [confirmDeactivate,setConfirmDeactivate]=useState(null)
  const [form,setForm]=useState(EMPTY)
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  const load=useCallback(async()=>{
    setLoading(true)
    const params=new URLSearchParams()
    if(search)params.set('search',search)
    if(statusFilter)params.set('status',statusFilter)
    const r=await fetch(`${BASE}/edu/enquiries?${params}`,{headers:hdr2()})
    const d=await r.json();setEnquiries(d.data||[]);setLoading(false)
  },[search,statusFilter])
  useEffect(()=>{load()},[load])

  const save=async()=>{
    if(!form.studentName.trim())return toast.error('Student name required')
    if(!form.phone.trim())return toast.error('Phone required')
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/edu/enquiries`,{method:'POST',headers:hdr(),body:JSON.stringify(form)})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success(`✅ ${d.data.enquiryNo} registered!`)
      setShowAdd(false);setForm(EMPTY);load()
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  const openEdit=(e)=>{
    setEditId(e.id)
    setForm({studentName:e.studentName||'',dob:toISO(e.dob),gender:e.gender||'',
      classApplying:e.classApplying||'',fatherName:e.fatherName||'',motherName:e.motherName||'',
      phone:e.phone||'',email:e.email||'',address:e.address||'',source:e.source||'WALK_IN',
      remarks:e.remarks||'',followUpDate:toISO(e.followUpDate)})
    setShowEdit(true)
  }

  const saveEdit=async()=>{
    if(!form.studentName.trim())return toast.error('Student name required')
    if(!form.phone.trim())return toast.error('Phone required')
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/edu/enquiries/${editId}`,{method:'PATCH',headers:hdr(),body:JSON.stringify(form)})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success('✅ Enquiry updated!')
      setShowEdit(false);setEditId(null);setForm(EMPTY);load()
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  const updateStatus=async(id,status)=>{
    await fetch(`${BASE}/edu/enquiries/${id}`,{method:'PATCH',headers:hdr(),body:JSON.stringify({status})})
    if(status==='ADMITTED'){toast.success('Converting to admission...');nav('/edu/students/new')}
    else{toast.success('Status updated!');load()}
  }

  const doDeactivate=async()=>{
    if(!confirmDeactivate)return
    try{
      await fetch(`${BASE}/edu/enquiries/${confirmDeactivate.id}`,{method:'PATCH',headers:hdr(),body:JSON.stringify({deactivate:true})})
      toast.success(`❌ ${confirmDeactivate.studentName} deactivated`)
      setConfirmDeactivate(null);load()
    }catch{toast.error('Failed')}
  }

  const stats=Object.keys(STATUS_CLR).reduce((acc,k)=>({...acc,[k]:enquiries.filter(e=>e.status===k).length}),{})

  const Fields=()=>(
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <div style={{gridColumn:'1/-1'}}><label style={lbl}>Student Name *</label>
        <input value={form.studentName} onChange={e=>set('studentName',e.target.value)} placeholder='Student full name' style={{...inp,fontSize:14}}/></div>
      <div><label style={lbl}>Date of Birth</label>
        <input type='date' value={form.dob} onChange={e=>set('dob',e.target.value)} style={inp}/></div>
      <div><label style={lbl}>Gender</label>
        <select value={form.gender} onChange={e=>set('gender',e.target.value)} style={inp}>
          <option value=''>Select</option><option>Male</option><option>Female</option>
        </select></div>
      <div style={{gridColumn:'1/-1'}}><label style={lbl}>Class Applying For</label>
        <input value={form.classApplying} onChange={e=>set('classApplying',e.target.value)} placeholder='e.g. Class 6 / LKG / BSc CS' style={inp}/></div>
      <div><label style={lbl}>Father Name</label>
        <input value={form.fatherName} onChange={e=>set('fatherName',e.target.value)} placeholder='Father name' style={inp}/></div>
      <div><label style={lbl}>Mother Name</label>
        <input value={form.motherName} onChange={e=>set('motherName',e.target.value)} placeholder='Mother name' style={inp}/></div>
      <div><label style={lbl}>Phone *</label>
        <input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder='+91 99999 99999' style={inp}/></div>
      <div><label style={lbl}>Email</label>
        <input value={form.email} onChange={e=>set('email',e.target.value)} placeholder='parent@email.com' style={inp}/></div>
      <div><label style={lbl}>Source</label>
        <select value={form.source} onChange={e=>set('source',e.target.value)} style={inp}>
          <option value='WALK_IN'>Walk-in</option><option value='REFERRAL'>Referral</option>
          <option value='ONLINE'>Online</option><option value='NEWSPAPER'>Newspaper</option>
          <option value='SOCIAL_MEDIA'>Social Media</option>
        </select></div>
      <div><label style={lbl}>Follow-up Date</label>
        <input type='date' value={form.followUpDate} onChange={e=>set('followUpDate',e.target.value)} style={inp}/></div>
      <div style={{gridColumn:'1/-1'}}><label style={lbl}>Address</label>
        <input value={form.address} onChange={e=>set('address',e.target.value)} placeholder='Address' style={inp}/></div>
      <div style={{gridColumn:'1/-1'}}><label style={lbl}>Remarks</label>
        <input value={form.remarks} onChange={e=>set('remarks',e.target.value)} placeholder='Any special notes' style={inp}/></div>
    </div>
  )

  return(
    <div style={{fontFamily:'DM Sans,sans-serif'}}>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📋 Admission Enquiry</div>
          <div style={{fontSize:11,color:'#888'}}>{enquiries.length} enquiries · {stats.ADMITTED||0} converted</div>
        </div>
        <button onClick={()=>{setForm(EMPTY);setShowAdd(true)}}
          style={{padding:'7px 18px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
          + New Enquiry
        </button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,marginBottom:12}}>
        {Object.entries(STATUS_CLR).map(([k,v])=>(
          <div key={k} onClick={()=>setStatusFilter(statusFilter===k?'':k)}
            style={{background:statusFilter===k?v.bg:'#fff',
              border:`1.5px solid ${statusFilter===k?v.color:'#E8E0E8'}`,
              borderRadius:8,padding:'10px 14px',cursor:'pointer'}}>
            <div style={{fontSize:10,color:'#888'}}>{k.replace(/_/g,' ')}</div>
            <div style={{fontSize:20,fontWeight:800,color:v.color}}>{stats[k]||0}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,
        padding:'10px 14px',marginBottom:12,display:'flex',gap:10}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder='🔍 Search by name / phone...' style={{...inp,width:280}}/>
        <button onClick={()=>setStatusFilter('')}
          style={{padding:'7px 14px',background:'#F5F5F5',border:'none',borderRadius:5,
            cursor:'pointer',fontSize:12,fontWeight:600,color:'#555'}}>Clear Filter</button>
      </div>

      {/* Table */}
      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
        {loading?<div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>:
        enquiries.length===0?
          <div style={{padding:60,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>📋</div>
            <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:8}}>No Enquiries</div>
            <button onClick={()=>{setForm(EMPTY);setShowAdd(true)}}
              style={{padding:'9px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>
              + Add Enquiry
            </button>
          </div>:
        <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:900}}>
          <thead><tr style={{background:'#6E2C00',color:'#fff'}}>
            {['Enq. No','Student','Class','Parent','Phone','Source','Date','Follow-up','Status','Change Status','Actions'].map(h=>(
              <th key={h} style={{padding:'9px 10px',textAlign:'left',fontSize:10,fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {enquiries.map((e,i)=>{
              const sc=STATUS_CLR[e.status]||STATUS_CLR.NEW
              const isDead=e.status==='DEACTIVATED'
              const overdue=e.followUpDate&&new Date(e.followUpDate)<new Date()
              return(
                <tr key={e.id} style={{background:isDead?'#FFF5F5':i%2===0?'#fff':'#FDF9F7',
                  borderBottom:'1px solid #F5EDE0',opacity:isDead?0.65:1}}>
                  <td style={{padding:'8px 10px',fontFamily:'monospace',fontSize:10,color:'#6E2C00',fontWeight:700}}>{e.enquiryNo}</td>
                  <td style={{padding:'8px 10px',fontWeight:700,whiteSpace:'nowrap'}}>
                    {e.studentName}
                    {e.gender&&<div style={{fontSize:10,color:'#aaa'}}>{e.gender}</div>}
                  </td>
                  <td style={{padding:'8px 10px',fontSize:11,color:'#555'}}>{e.classApplying||'—'}</td>
                  <td style={{padding:'8px 10px',fontSize:11,color:'#555',whiteSpace:'nowrap'}}>{e.fatherName||e.motherName||'—'}</td>
                  <td style={{padding:'8px 10px',whiteSpace:'nowrap'}}>{e.phone}</td>
                  <td style={{padding:'8px 10px',fontSize:10,color:'#555'}}>{e.source?.replace(/_/g,' ')||'—'}</td>
                  <td style={{padding:'8px 10px',fontSize:10,color:'#888',whiteSpace:'nowrap'}}>{fmtD(e.enquiryDate)}</td>
                  <td style={{padding:'8px 10px',fontSize:10,whiteSpace:'nowrap',
                    color:overdue?'#C0392B':'#888',fontWeight:overdue?700:400}}>
                    {e.followUpDate?(overdue?'⚠️ ':'')+fmtD(e.followUpDate):'—'}
                  </td>
                  <td style={{padding:'8px 10px'}}>
                    <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                      background:sc.bg,color:sc.color,whiteSpace:'nowrap'}}>
                      {e.status?.replace(/_/g,' ')}
                    </span>
                  </td>
                  <td style={{padding:'8px 10px'}}>
                    {!isDead&&(
                      <select onChange={ev=>{ if(ev.target.value){updateStatus(e.id,ev.target.value);ev.target.value=''} }}
                        defaultValue=''
                        style={{padding:'4px 6px',border:'1px solid #ddd',borderRadius:4,fontSize:10,cursor:'pointer'}}>
                        <option value=''>Change →</option>
                        {Object.keys(STATUS_CLR).filter(s=>s!=='DEACTIVATED'&&s!==e.status).map(s=>(
                          <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td style={{padding:'8px 10px'}}>
                    <div style={{display:'flex',gap:4}}>
                      {!isDead&&(
                        <button onClick={()=>openEdit(e)}
                          style={{padding:'3px 9px',background:'#EBF5FB',color:'#1A5276',
                            border:'1px solid #AED6F1',borderRadius:4,cursor:'pointer',
                            fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>
                          ✏️ Edit
                        </button>
                      )}
                      {!isDead?(
                        <button onClick={()=>setConfirmDeactivate(e)}
                          style={{padding:'3px 9px',background:'#FDEDEC',color:'#C0392B',
                            border:'1px solid #F1948A',borderRadius:4,cursor:'pointer',
                            fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>
                          🗑 Off
                        </button>
                      ):(
                        <button onClick={()=>updateStatus(e.id,'NEW')}
                          style={{padding:'3px 9px',background:'#E8F5E9',color:'#1E8449',
                            border:'1px solid #A9DFBF',borderRadius:4,cursor:'pointer',
                            fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>
                          ↩ Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>}
      </div>

      {/* ── ADD MODAL ── */}
      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:580,
            maxHeight:'88vh',overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'#6E2C00',marginBottom:18}}>📋 New Admission Enquiry</div>
            <Fields/>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
              <button onClick={()=>setShowAdd(false)}
                style={{padding:'7px 16px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={save} disabled={saving}
                style={{padding:'7px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>
                {saving?'⏳...':'💾 Save Enquiry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {showEdit&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setShowEdit(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:580,
            maxHeight:'88vh',overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <div style={{fontSize:16,fontWeight:800,color:'#1A5276'}}>✏️ Edit Enquiry</div>
              <div style={{fontSize:11,color:'#aaa',fontFamily:'monospace'}}>ID #{editId}</div>
            </div>
            <Fields/>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
              <button onClick={()=>setShowEdit(false)}
                style={{padding:'7px 16px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={saveEdit} disabled={saving}
                style={{padding:'7px 22px',background:'#1A5276',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>
                {saving?'⏳...':'💾 Update Enquiry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DEACTIVATE CONFIRM ── */}
      {confirmDeactivate&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:400,
            boxShadow:'0 16px 48px rgba(0,0,0,.3)',textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>🗑️</div>
            <div style={{fontSize:16,fontWeight:800,color:'#C0392B',marginBottom:8}}>Deactivate Enquiry?</div>
            <div style={{fontSize:14,fontWeight:700,color:'#333',marginBottom:6}}>{confirmDeactivate.studentName}</div>
            <div style={{fontSize:12,color:'#888',marginBottom:20}}>
              This enquiry will be marked Deactivated.<br/>You can restore it anytime using the Restore button.
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>setConfirmDeactivate(null)}
                style={{padding:'9px 22px',background:'#f0f0f0',border:'none',borderRadius:6,
                  cursor:'pointer',fontWeight:600,fontSize:13}}>Cancel</button>
              <button onClick={doDeactivate}
                style={{padding:'9px 22px',background:'#C0392B',color:'#fff',border:'none',
                  borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:13}}>
                🗑 Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
