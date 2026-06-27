import React,{useState,useEffect,useCallback}from 'react'
import toast from 'react-hot-toast'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtC=n=>'₹'+Number(n||0).toLocaleString('en-IN')
const toISO=d=>d?new Date(d).toISOString().slice(0,10):''
const inp={padding:'7px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',boxSizing:'border-box'}
const lbl={fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}
const PAGE_SIZE=20

const TYPE_CLR={
  TEACHING:    {bg:'#E8F5E9',color:'#1E8449'},
  NON_TEACHING:{bg:'#EBF5FB',color:'#1A5276'},
  CONTRACT:    {bg:'#FEF9E7',color:'#B8860B'},
  PART_TIME:   {bg:'#F0EBF0',color:'#714B67'},
}
const DESIGNATIONS=['Principal','Vice Principal','HM','HOD','Professor','Asst. Professor',
  'PGT','TGT','PRT','Lab Assistant','Librarian','Accountant','Admin Staff','Peon','Driver','Attender']
const QUALIFICATIONS=['PhD','M.Phil','ME/MTech','MBA','MCA','MSc','MA','MCom','BE/BTech','BCA','BSc','BA','BCom','Diploma','SSLC']
const EMPTY_FORM={
  name:'',type:'TEACHING',designation:'',qualification:'',specialization:'',
  gender:'',dob:'',phone:'',email:'',address:'',aadhar:'',pan:'',
  doj:'',salary:'',bankAccount:'',bankIfsc:'',photo:''
}

export default function StaffMaster(){
  // Data
  const [staff,setStaff]=useState([])
  const [loading,setLoading]=useState(true)
  const [stats,setStats]=useState({total:0,teaching:0,nonTeaching:0,contract:0})
  // Filters
  const [search,setSearch]=useState('')
  const [typeFilter,setTypeFilter]=useState('')
  const [statusFilter,setStatusFilter]=useState('ACTIVE')
  // Pagination
  const [page,setPage]=useState(1)
  const [totalPages,setTotalPages]=useState(1)
  const [totalCount,setTotalCount]=useState(0)
  // Modals
  const [showAdd,setShowAdd]=useState(false)
  const [showEdit,setShowEdit]=useState(false)
  const [editStaff,setEditStaff]=useState(null)
  const [saving,setSaving]=useState(false)
  const [confirmToggle,setConfirmToggle]=useState(null)
  const [form,setForm]=useState(EMPTY_FORM)
  const [photoPreview,setPhotoPreview]=useState('')
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  // Institution
  const [instId,setInstId]=useState(()=>localStorage.getItem('lnv_edu_inst')||'')
  useEffect(()=>{
    const onStorage=()=>{ setInstId(localStorage.getItem('lnv_edu_inst')||''); setPage(1) }
    window.addEventListener('storage',onStorage)
    return()=>window.removeEventListener('storage',onStorage)
  },[])

  const load=useCallback(async()=>{
    setLoading(true)
    try{
      const params=new URLSearchParams()
      if(search)      params.set('search',search)
      if(typeFilter)  params.set('type',typeFilter)
      if(statusFilter==='INACTIVE') params.set('status','INACTIVE')
      params.set('page',page)
      params.set('limit',PAGE_SIZE)
      const r=await fetch(`${BASE}/edu/staff?${params}`,{headers:hdr2()})
      const d=await r.json()
      setStaff(d.data||[])
      if(d.stats) setStats(d.stats)
      if(d.pagination){setTotalPages(d.pagination.totalPages||1);setTotalCount(d.pagination.totalCount||0)}
    }catch{}finally{setLoading(false)}
  },[search,typeFilter,statusFilter,page])
  useEffect(()=>{load()},[load])
  useEffect(()=>{setPage(1)},[search,typeFilter,statusFilter,instId])

  // Photo handler
  const handlePhoto=(e)=>{
    const file=e.target.files[0]
    if(!file)return
    if(file.size>500*1024)return toast.error('Photo must be under 500KB')
    const reader=new FileReader()
    reader.onload=(ev)=>{ setPhotoPreview(ev.target.result); set('photo',ev.target.result) }
    reader.readAsDataURL(file)
  }

  // Add Staff
  const save=async()=>{
    if(!form.name.trim())return toast.error('Name required')
    if(!form.phone.trim())return toast.error('Phone required')
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/edu/staff`,{method:'POST',headers:hdr(),
        body:JSON.stringify({...form,salary:form.salary?parseFloat(form.salary):null})})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success(`✅ ${d.data.staffCode} — ${d.data.name} added!`)
      setShowAdd(false);setForm(EMPTY_FORM);setPhotoPreview('');load()
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  // Edit Staff
  const openEdit=(s)=>{
    setEditStaff(s)
    setPhotoPreview(s.photo||'')
    setForm({
      name:s.name||'',type:s.type||'TEACHING',designation:s.designation||'',
      qualification:s.qualification||'',specialization:s.specialization||'',
      gender:s.gender||'',dob:toISO(s.dob),phone:s.phone||'',email:s.email||'',
      address:s.address||'',aadhar:s.aadhar||'',pan:s.pan||'',
      doj:toISO(s.doj),salary:s.salary?String(s.salary):'',
      bankAccount:s.bankAccount||'',bankIfsc:s.bankIfsc||'',photo:s.photo||''
    })
    setShowEdit(true)
  }
  const saveEdit=async()=>{
    if(!form.name.trim())return toast.error('Name required')
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/edu/staff/${editStaff.id}`,{method:'PATCH',headers:hdr(),
        body:JSON.stringify({...form,salary:form.salary?parseFloat(form.salary):null})})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success('✅ Staff updated!')
      setShowEdit(false);setEditStaff(null);setPhotoPreview('');load()
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  // Toggle Active/Inactive
  const doToggle=async()=>{
    if(!confirmToggle)return
    try{
      await fetch(`${BASE}/edu/staff/${confirmToggle.id}`,{method:'PATCH',headers:hdr(),
        body:JSON.stringify({isActive:!confirmToggle.isActive})})
      toast.success(`${confirmToggle.isActive?'❌ Deactivated':'✅ Activated'}: ${confirmToggle.name}`)
      setConfirmToggle(null);load()
    }catch{toast.error('Failed')}
  }

  // Pagination
  const Pagination=()=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px'}}>
      <div style={{fontSize:12,color:'#888'}}>
        Showing <strong>{Math.min((page-1)*PAGE_SIZE+1,totalCount)}–{Math.min(page*PAGE_SIZE,totalCount)}</strong> of <strong>{totalCount}</strong> staff
      </div>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <button onClick={()=>setPage(1)} disabled={page===1}
          style={{padding:'4px 8px',border:'1px solid #ddd',borderRadius:4,cursor:page===1?'not-allowed':'pointer',background:page===1?'#f5f5f5':'#fff',color:page===1?'#ccc':'#555',fontSize:12}}>«</button>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
          style={{padding:'4px 10px',border:'1px solid #ddd',borderRadius:4,cursor:page===1?'not-allowed':'pointer',background:page===1?'#f5f5f5':'#fff',color:page===1?'#ccc':'#555',fontSize:12}}>‹ Prev</button>
        {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
          let p=totalPages<=5?i+1:page<=3?i+1:page>=totalPages-2?totalPages-4+i:page-2+i
          return(<button key={p} onClick={()=>setPage(p)}
            style={{padding:'4px 10px',border:`1px solid ${p===page?'#6E2C00':'#ddd'}`,borderRadius:4,cursor:'pointer',
              fontSize:12,fontWeight:p===page?700:400,background:p===page?'#6E2C00':'#fff',
              color:p===page?'#fff':'#555',minWidth:32}}>{p}</button>)
        })}
        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
          style={{padding:'4px 10px',border:'1px solid #ddd',borderRadius:4,cursor:page===totalPages?'not-allowed':'pointer',background:page===totalPages?'#f5f5f5':'#fff',color:page===totalPages?'#ccc':'#555',fontSize:12}}>Next ›</button>
        <button onClick={()=>setPage(totalPages)} disabled={page===totalPages}
          style={{padding:'4px 8px',border:'1px solid #ddd',borderRadius:4,cursor:page===totalPages?'not-allowed':'pointer',background:page===totalPages?'#f5f5f5':'#fff',color:page===totalPages?'#ccc':'#555',fontSize:12}}>»</button>
        <span style={{fontSize:11,color:'#aaa',marginLeft:4}}>Page {page}/{totalPages}</span>
      </div>
    </div>
  )

  // Shared form fields (used in both Add and Edit)
  const FormFields=()=>(
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      {/* Photo */}
      <div style={{gridColumn:'1/-1',display:'flex',gap:16,alignItems:'center',
        background:'#F8F5F8',borderRadius:8,padding:14}}>
        <div style={{width:72,height:72,borderRadius:8,border:'2px solid #E8E0E8',
          background:'#F0EBF0',display:'flex',alignItems:'center',justifyContent:'center',
          overflow:'hidden',flexShrink:0}}>
          {photoPreview?<img src={photoPreview} alt='' style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            :<span style={{fontSize:30}}>👩‍🏫</span>}
        </div>
        <div>
          <label style={{display:'inline-block',padding:'7px 14px',background:'#6E2C00',color:'#fff',
            borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:11}}>
            📷 {photoPreview?'Change Photo':'Upload Photo'}
            <input type='file' accept='image/*' onChange={handlePhoto} style={{display:'none'}}/>
          </label>
          <div style={{fontSize:10,color:'#888',marginTop:5}}>JPG/PNG · Max 500KB</div>
          {photoPreview&&<button onClick={()=>{setPhotoPreview('');set('photo','')}}
            style={{marginTop:4,padding:'3px 8px',background:'#FDEDEC',color:'#C0392B',
              border:'none',borderRadius:3,cursor:'pointer',fontSize:10}}>✕ Remove</button>}
        </div>
      </div>

      {/* Section: Basic */}
      <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#6E2C00',
        borderBottom:'2px solid #6E2C0022',paddingBottom:4}}>👤 Basic Info</div>
      <div style={{gridColumn:'1/-1'}}><label style={lbl}>Full Name *</label>
        <input value={form.name} onChange={e=>set('name',e.target.value)}
          placeholder='Staff full name' style={{...inp,width:'100%',fontSize:14}}/></div>
      <div><label style={lbl}>Type *</label>
        <select value={form.type} onChange={e=>set('type',e.target.value)} style={{...inp,width:'100%'}}>
          <option value='TEACHING'>Teaching</option>
          <option value='NON_TEACHING'>Non-Teaching</option>
          <option value='CONTRACT'>Contract</option>
          <option value='PART_TIME'>Part-Time</option>
        </select></div>
      <div><label style={lbl}>Gender</label>
        <select value={form.gender} onChange={e=>set('gender',e.target.value)} style={{...inp,width:'100%'}}>
          <option value=''>Select</option><option>Male</option><option>Female</option>
        </select></div>
      <div><label style={lbl}>Date of Birth</label>
        <input type='date' value={form.dob} onChange={e=>set('dob',e.target.value)} style={{...inp,width:'100%'}}/></div>
      <div><label style={lbl}>Date of Joining</label>
        <input type='date' value={form.doj} onChange={e=>set('doj',e.target.value)} style={{...inp,width:'100%'}}/></div>

      {/* Section: Professional */}
      <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#1A5276',
        borderBottom:'2px solid #1A527622',paddingBottom:4,marginTop:6}}>🎓 Professional</div>
      <div><label style={lbl}>Designation</label>
        <select value={form.designation} onChange={e=>set('designation',e.target.value)} style={{...inp,width:'100%'}}>
          <option value=''>Select</option>
          {DESIGNATIONS.map(d=><option key={d}>{d}</option>)}
        </select></div>
      <div><label style={lbl}>Qualification</label>
        <select value={form.qualification} onChange={e=>set('qualification',e.target.value)} style={{...inp,width:'100%'}}>
          <option value=''>Select</option>
          {QUALIFICATIONS.map(q=><option key={q}>{q}</option>)}
        </select></div>
      <div style={{gridColumn:'1/-1'}}><label style={lbl}>Specialization / Subject</label>
        <input value={form.specialization} onChange={e=>set('specialization',e.target.value)}
          placeholder='Mathematics / Physics / English' style={{...inp,width:'100%'}}/></div>

      {/* Section: Contact */}
      <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#117A65',
        borderBottom:'2px solid #117A6522',paddingBottom:4,marginTop:6}}>📞 Contact</div>
      <div><label style={lbl}>Phone *</label>
        <input value={form.phone} onChange={e=>set('phone',e.target.value)}
          placeholder='+91 99999 99999' style={{...inp,width:'100%'}}/></div>
      <div><label style={lbl}>Email</label>
        <input value={form.email} onChange={e=>set('email',e.target.value)}
          placeholder='staff@school.edu' style={{...inp,width:'100%'}}/></div>
      <div style={{gridColumn:'1/-1'}}><label style={lbl}>Address</label>
        <input value={form.address} onChange={e=>set('address',e.target.value)} style={{...inp,width:'100%'}}/></div>
      <div><label style={lbl}>Aadhar Number</label>
        <input value={form.aadhar} onChange={e=>set('aadhar',e.target.value)}
          placeholder='XXXX XXXX XXXX' style={{...inp,width:'100%'}}/></div>
      <div><label style={lbl}>PAN Number</label>
        <input value={form.pan} onChange={e=>set('pan',e.target.value)}
          placeholder='ABCDE1234F' style={{...inp,width:'100%'}}/></div>

      {/* Section: Salary */}
      <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#B8860B',
        borderBottom:'2px solid #B8860B22',paddingBottom:4,marginTop:6}}>💰 Salary & Bank</div>
      <div><label style={lbl}>Monthly Salary (₹)</label>
        <input type='number' value={form.salary} onChange={e=>set('salary',e.target.value)}
          placeholder='35000' style={{...inp,width:'100%'}}/></div>
      <div><label style={lbl}>Bank Account No</label>
        <input value={form.bankAccount} onChange={e=>set('bankAccount',e.target.value)} style={{...inp,width:'100%'}}/></div>
      <div style={{gridColumn:'1/-1'}}><label style={lbl}>Bank IFSC Code</label>
        <input value={form.bankIfsc} onChange={e=>set('bankIfsc',e.target.value)}
          placeholder='SBIN0001234' style={{...inp,width:'100%'}}/></div>
    </div>
  )

  return(
    <div style={{fontFamily:'DM Sans,sans-serif',display:'flex',flexDirection:'column',height:'100%'}}>

      {/* ── STICKY HEADER ── */}
      <div style={{position:'sticky',top:-16,zIndex:100,background:'#fff',
        margin:'-16px -16px 0 -16px',
        borderBottom:'2px solid #E8E0E8',boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>

        {/* Title row */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px'}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>👩‍🏫 Staff Master</div>
            <div style={{fontSize:11,color:'#888'}}>
              {stats.total} total · {stats.teaching} teaching · {stats.nonTeaching} non-teaching · {stats.contract} contract
            </div>
          </div>
          <button onClick={()=>{setForm(EMPTY_FORM);setPhotoPreview('');setShowAdd(true)}}
            style={{padding:'8px 18px',background:'#6E2C00',color:'#fff',border:'none',
              borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
            + Add Staff
          </button>
        </div>

        {/* Stats bar */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0,borderTop:'1px solid #F5EDE0'}}>
          {[
            ['👩‍🏫 Total',    stats.total,      '#6E2C00','#FDF2E9'],
            ['📚 Teaching',   stats.teaching,   '#1E8449','#E8F5E9'],
            ['🏢 Non-Teaching',stats.nonTeaching,'#1A5276','#EBF5FB'],
            ['🤝 Contract',   stats.contract,   '#B8860B','#FEF9E7'],
          ].map(([l,v,c,bg])=>(
            <div key={l} style={{background:bg,padding:'8px 16px',borderRight:'1px solid #E8E0E8',
              display:'flex',gap:12,alignItems:'center'}}>
              <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:10,color:'#888',fontWeight:600}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Filter row */}
        <div style={{padding:'8px 16px',background:'#FAFAFA',borderTop:'1px solid #F0EDE8',
          display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder='🔍 Search by name / code / phone...'
            style={{...inp,width:230}}/>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{...inp,width:150}}>
            <option value=''>All Types</option>
            <option value='TEACHING'>Teaching</option>
            <option value='NON_TEACHING'>Non-Teaching</option>
            <option value='CONTRACT'>Contract</option>
            <option value='PART_TIME'>Part-Time</option>
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{...inp,width:120}}>
            <option value='ACTIVE'>Active</option>
            <option value='INACTIVE'>Inactive</option>
          </select>
          <button onClick={load}
            style={{...inp,padding:'7px 14px',background:'#FDF2E9',border:'1px solid #6E2C00',
              cursor:'pointer',fontWeight:600,color:'#6E2C00'}}>🔄 Refresh</button>
          {(search||typeFilter||statusFilter!=='ACTIVE')&&(
            <button onClick={()=>{setSearch('');setTypeFilter('');setStatusFilter('ACTIVE');setPage(1)}}
              style={{...inp,padding:'7px 14px',background:'#F5F5F5',border:'1px solid #ddd',
                cursor:'pointer',fontWeight:600,color:'#888'}}>✕ Clear</button>
          )}
          <div style={{marginLeft:'auto',fontSize:11,color:'#888'}}>
            {totalCount} staff · Page {page}/{totalPages}
          </div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{flex:1,overflowY:'auto',overflowX:'auto'}}>
        {loading?(
          <div style={{padding:60,textAlign:'center',color:'#aaa'}}>
            <div style={{fontSize:32,marginBottom:12}}>⏳</div>
            <div>Loading staff...</div>
          </div>
        ):staff.length===0?(
          <div style={{padding:60,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>👩‍🏫</div>
            <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:8}}>No Staff Found</div>
            <button onClick={()=>{setForm(EMPTY_FORM);setPhotoPreview('');setShowAdd(true)}}
              style={{padding:'9px 22px',background:'#6E2C00',color:'#fff',border:'none',
                borderRadius:6,cursor:'pointer',fontWeight:700}}>+ Add First Staff</button>
          </div>
        ):(
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#6E2C00',color:'#fff',position:'sticky',top:0,zIndex:10}}>
                {['Photo','Code','Name','Type','Designation','Specialization','Phone','Salary','Status','Actions'].map(h=>(
                  <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,
                    fontWeight:600,whiteSpace:'nowrap',background:'#6E2C00'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((s,i)=>{
                const tc=TYPE_CLR[s.type]||TYPE_CLR.TEACHING
                const isInactive=!s.isActive
                return(
                  <tr key={s.id}
                    style={{background:isInactive?'#FFF5F5':i%2===0?'#fff':'#FDF9F7',
                      borderBottom:'1px solid #F5EDE0',opacity:isInactive?0.7:1}}
                    onMouseEnter={e=>e.currentTarget.style.background='#FEF9F5'}
                    onMouseLeave={e=>e.currentTarget.style.background=isInactive?'#FFF5F5':i%2===0?'#fff':'#FDF9F7'}>

                    {/* Photo */}
                    <td style={{padding:'6px 12px'}}>
                      <div style={{width:36,height:36,borderRadius:'50%',overflow:'hidden',
                        background:'#F0EBF0',border:'2px solid #E8D5C4',
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                        {s.photo
                          ?<img src={s.photo} alt='' style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          :(s.gender==='Female'?'👩':'👨')}
                      </div>
                    </td>
                    <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:10,
                      color:'#6E2C00',fontWeight:700,whiteSpace:'nowrap'}}>{s.staffCode}</td>
                    <td style={{padding:'9px 12px'}}>
                      <div style={{fontWeight:700,color:'#333'}}>{s.name}</div>
                      {s.qualification&&<div style={{fontSize:10,color:'#aaa'}}>{s.qualification}</div>}
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                        background:tc.bg,color:tc.color,whiteSpace:'nowrap'}}>
                        {s.type?.replace('_',' ')}
                      </span>
                    </td>
                    <td style={{padding:'9px 12px',color:'#555',fontSize:11,whiteSpace:'nowrap'}}>{s.designation||'—'}</td>
                    <td style={{padding:'9px 12px',color:'#555',fontSize:11}}>{s.specialization||'—'}</td>
                    <td style={{padding:'9px 12px',whiteSpace:'nowrap'}}>{s.phone}</td>
                    <td style={{padding:'9px 12px',fontWeight:700,color:'#1E8449',whiteSpace:'nowrap'}}>
                      {s.salary?fmtC(s.salary)+'/mo':'—'}
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                        background:isInactive?'#FDEDEC':'#E8F5E9',
                        color:isInactive?'#C0392B':'#1E8449'}}>
                        {isInactive?'INACTIVE':'ACTIVE'}
                      </span>
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={()=>openEdit(s)}
                          style={{padding:'4px 8px',background:'#FEF9E7',color:'#B8860B',
                            border:'1px solid #F9E79F',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                          ✏️ Edit
                        </button>
                        <button onClick={()=>setConfirmToggle(s)}
                          style={{padding:'4px 8px',
                            background:isInactive?'#E8F5E9':'#FDEDEC',
                            color:isInactive?'#1E8449':'#C0392B',
                            border:`1px solid ${isInactive?'#A9DFBF':'#F1948A'}`,
                            borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700,whiteSpace:'nowrap'}}>
                          {isInactive?'✅ ON':'❌ OFF'}
                        </button>
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

      {/* ── ADD MODAL ── */}
      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:620,
            maxHeight:'90vh',overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <div style={{fontSize:16,fontWeight:800,color:'#6E2C00'}}>👩‍🏫 Add New Staff</div>
              <button onClick={()=>setShowAdd(false)}
                style={{background:'#f0f0f0',border:'none',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontWeight:700,fontSize:14}}>✕</button>
            </div>
            <FormFields/>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
              <button onClick={()=>setShowAdd(false)}
                style={{padding:'8px 18px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={save} disabled={saving}
                style={{padding:'8px 24px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>
                {saving?'⏳ Saving...':'💾 Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {showEdit&&editStaff&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setShowEdit(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:620,
            maxHeight:'90vh',overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#1A5276'}}>✏️ Edit Staff</div>
                <div style={{fontSize:11,color:'#888'}}>{editStaff.staffCode} — {editStaff.name}</div>
              </div>
              <button onClick={()=>setShowEdit(false)}
                style={{background:'#f0f0f0',border:'none',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontWeight:700,fontSize:14}}>✕</button>
            </div>
            <FormFields/>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
              <button onClick={()=>setShowEdit(false)}
                style={{padding:'8px 18px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={saveEdit} disabled={saving}
                style={{padding:'8px 24px',background:'#1A5276',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>
                {saving?'⏳ Saving...':'💾 Update Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOGGLE CONFIRM ── */}
      {confirmToggle&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:400,
            boxShadow:'0 16px 48px rgba(0,0,0,.3)',textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>{confirmToggle.isActive?'❌':'✅'}</div>
            <div style={{fontSize:16,fontWeight:800,marginBottom:8,
              color:confirmToggle.isActive?'#C0392B':'#1E8449'}}>
              {confirmToggle.isActive?'Mark as Inactive?':'Re-Activate Staff?'}
            </div>
            <div style={{fontSize:14,fontWeight:700,color:'#333',marginBottom:6}}>{confirmToggle.name}</div>
            <div style={{fontSize:12,color:'#888',marginBottom:20}}>
              {confirmToggle.isActive
                ?'Staff will be marked Inactive and removed from active lists.'
                :'Staff will be re-activated and appear in active lists.'}
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>setConfirmToggle(null)}
                style={{padding:'9px 22px',background:'#f0f0f0',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:13}}>Cancel</button>
              <button onClick={doToggle}
                style={{padding:'9px 22px',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:13,color:'#fff',
                  background:confirmToggle.isActive?'#C0392B':'#1E8449'}}>
                {confirmToggle.isActive?'❌ Mark Inactive':'✅ Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
