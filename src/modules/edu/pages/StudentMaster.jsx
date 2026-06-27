import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })

const STATUS_COLORS = {
  ACTIVE:      { bg:'#E8F5E9', color:'#1E8449' },
  INACTIVE:    { bg:'#FDEDEC', color:'#C0392B' },
  TRANSFERRED: { bg:'#EBF5FB', color:'#1A5276' },
  PASSED_OUT:  { bg:'#F0EBF0', color:'#714B67' },
}
const inp = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block', marginBottom:3, textTransform:'uppercase' }
const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-']
const CATEGORIES   = ['GENERAL','OBC','BC','MBC','SC','ST','EWS']
const PAGE_SIZE = 20

export default function StudentMaster() {
  const nav = useNavigate()

  // Data
  const [students,  setStudents]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [stats,     setStats]     = useState({ total:0, active:0, boys:0, girls:0 })
  const [classes,   setClasses]   = useState([])
  const [sections,  setSections]  = useState([])

  // Filters
  const [search,      setSearch]      = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter,setStatusFilter]= useState('ACTIVE')

  // Pagination
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Institution — reactive
  const [instId, setInstId] = useState(() => localStorage.getItem('lnv_edu_inst') || '')

  // Edit modal
  const [showEdit,      setShowEdit]      = useState(false)
  const [editStudent,   setEditStudent]   = useState(null)
  const [saving,        setSaving]        = useState(false)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [form,          setForm]          = useState({})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  // Listen to institution switcher
  useEffect(() => {
    const onStorage = () => {
      const newId = localStorage.getItem('lnv_edu_inst') || ''
      setInstId(newId)
      setPage(1)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Load students
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)       params.set('search', search)
      if (classFilter)  params.set('classId', classFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (instId)       params.set('institutionId', instId)
      params.set('page', page)
      params.set('limit', PAGE_SIZE)

      const r = await fetch(`${BASE}/edu/students?${params}`, { headers:hdr2() })
      const d = await r.json()
      setStudents(d.data || [])
      if (d.stats) setStats(d.stats)
      if (d.pagination) {
        setTotalPages(d.pagination.totalPages || 1)
        setTotalCount(d.pagination.totalCount || 0)
      }
    } catch {} finally { setLoading(false) }
  }, [search, classFilter, statusFilter, instId, page])

  useEffect(() => { load() }, [load])

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1) }, [search, classFilter, statusFilter, instId])

  // Load classes for filter
  useEffect(() => {
    fetch(`${BASE}/edu/classes?institutionId=${instId}`, { headers:hdr2() })
      .then(r=>r.json()).then(d=>setClasses(d.data||[])).catch(()=>{})
  }, [instId])

  // Open Edit
  const openEdit = (s) => {
    setEditStudent(s)
    setForm({
      name: s.name||'', gender: s.gender||'',
      dob: s.dob ? new Date(s.dob).toISOString().slice(0,10) : '',
      bloodGroup: s.bloodGroup||'', aadhar: s.aadhar||'',
      fatherName: s.fatherName||'', fatherPhone: s.fatherPhone||'',
      fatherOccupation: s.fatherOccupation||'',
      motherName: s.motherName||'', motherPhone: s.motherPhone||'',
      address: s.address||'', city: s.city||'', pincode: s.pincode||'',
      rollNo: s.rollNo||'', category: s.category||'GENERAL', religion: s.religion||'',
      classId: s.section?.classId ? String(s.section.classId) : '',
      sectionId: s.sectionId ? String(s.sectionId) : '',
    })
    if (s.section?.classId) {
      const cls = classes.find(c => c.id === s.section.classId)
      setSections(cls?.sections || [])
    }
    setShowEdit(true)
  }

  const saveEdit = async () => {
    if (!form.name.trim()) return toast.error('Name required')
    setSaving(true)
    try {
      const payload = { ...form, sectionId: form.sectionId ? parseInt(form.sectionId) : undefined }
      delete payload.classId
      const r = await fetch(`${BASE}/edu/students/${editStudent.id}`, {
        method:'PATCH', headers:hdr(), body:JSON.stringify(payload)
      })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success('✅ Student updated!')
      setShowEdit(false); setEditStudent(null); load()
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const toggleStatus = async () => {
    if (!confirmToggle) return
    const newStatus = confirmToggle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await fetch(`${BASE}/edu/students/${confirmToggle.id}`, {
        method:'PATCH', headers:hdr(), body:JSON.stringify({ status: newStatus })
      })
      toast.success(`${newStatus === 'ACTIVE' ? '✅ Activated' : '❌ Deactivated'}: ${confirmToggle.name}`)
      setConfirmToggle(null); load()
    } catch { toast.error('Failed') }
  }

  // Pagination controls
  const Pagination = () => (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
      padding:'10px 16px',background:'#fff',borderTop:'1px solid #E8E0E8'}}>
      <div style={{fontSize:12,color:'#888'}}>
        Showing <strong>{((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, totalCount)}</strong> of <strong>{totalCount}</strong> students
      </div>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <button onClick={()=>setPage(1)} disabled={page===1}
          style={{padding:'4px 10px',border:'1px solid #ddd',borderRadius:4,cursor:page===1?'not-allowed':'pointer',
            background:page===1?'#f5f5f5':'#fff',color:page===1?'#ccc':'#555',fontSize:12}}>«</button>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
          style={{padding:'4px 10px',border:'1px solid #ddd',borderRadius:4,cursor:page===1?'not-allowed':'pointer',
            background:page===1?'#f5f5f5':'#fff',color:page===1?'#ccc':'#555',fontSize:12}}>‹ Prev</button>

        {/* Page numbers */}
        {Array.from({length:Math.min(5,totalPages)},(_, i)=>{
          let p
          if (totalPages<=5) p=i+1
          else if (page<=3) p=i+1
          else if (page>=totalPages-2) p=totalPages-4+i
          else p=page-2+i
          return(
            <button key={p} onClick={()=>setPage(p)}
              style={{padding:'4px 10px',border:`1px solid ${p===page?'#6E2C00':'#ddd'}`,borderRadius:4,
                cursor:'pointer',fontSize:12,fontWeight:p===page?700:400,
                background:p===page?'#6E2C00':'#fff',color:p===page?'#fff':'#555',minWidth:32}}>
              {p}
            </button>
          )
        })}

        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
          style={{padding:'4px 10px',border:'1px solid #ddd',borderRadius:4,cursor:page===totalPages?'not-allowed':'pointer',
            background:page===totalPages?'#f5f5f5':'#fff',color:page===totalPages?'#ccc':'#555',fontSize:12}}>Next ›</button>
        <button onClick={()=>setPage(totalPages)} disabled={page===totalPages}
          style={{padding:'4px 10px',border:'1px solid #ddd',borderRadius:4,cursor:page===totalPages?'not-allowed':'pointer',
            background:page===totalPages?'#f5f5f5':'#fff',color:page===totalPages?'#ccc':'#555',fontSize:12}}>»</button>

        <span style={{fontSize:11,color:'#aaa',marginLeft:4}}>Page {page} / {totalPages}</span>
      </div>
    </div>
  )

  return (
    <div style={{fontFamily:'DM Sans,sans-serif', display:'flex', flexDirection:'column', height:'100%' }}>

      {/* ── STICKY HEADER ── */}
      <div style={{position:'sticky',top:-16,zIndex:100,background:'#fff',
        margin:'-16px -16px 0 -16px',
        borderBottom:'2px solid #E8E0E8',boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>

        {/* Title row */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
          padding:'10px 16px'}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>👨‍🎓 Student Master</div>
            <div style={{fontSize:11,color:'#888'}}>
              {stats.total} total · {stats.active} active · {stats.boys} boys · {stats.girls} girls
              {instId && <span style={{color:'#714B67',fontWeight:600}}> (current institution)</span>}
            </div>
          </div>
          <button onClick={()=>nav('/edu/students/new')}
            style={{padding:'8px 18px',background:'#6E2C00',color:'#fff',border:'none',
              borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
            + New Admission
          </button>
        </div>

        {/* Stats bar */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0,
          borderTop:'1px solid #F5EDE0'}}>
          {[
            ['👨‍🎓 Total',  stats.total,  '#6E2C00', '#FDF2E9'],
            ['✅ Active',   stats.active,  '#1E8449', '#E8F5E9'],
            ['👦 Boys',     stats.boys,   '#1A5276', '#EBF5FB'],
            ['👧 Girls',    stats.girls,  '#714B67', '#F0EBF0'],
          ].map(([l,v,c,bg])=>(
            <div key={l} style={{background:bg,padding:'8px 16px',
              borderRight:'1px solid #E8E0E8',display:'flex',gap:12,alignItems:'center'}}>
              <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
              <div style={{fontSize:10,color:'#888',fontWeight:600}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Filter row */}
        <div style={{padding:'8px 16px',background:'#FAFAFA',borderTop:'1px solid #F0EDE8',
          display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder='🔍 Search by name / admission no...'
            style={{...inp,width:220}} />
          <select value={classFilter} onChange={e=>setClassFilter(e.target.value)}
            style={{...inp,width:160}}>
            <option value=''>All Classes</option>
            {classes.map(c=>(<option key={c.id} value={c.id}>{c.className}</option>))}
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            style={{...inp,width:120}}>
            <option value=''>All Status</option>
            <option value='ACTIVE'>Active</option>
            <option value='INACTIVE'>Inactive</option>
            <option value='TRANSFERRED'>Transferred</option>
            <option value='PASSED_OUT'>Passed Out</option>
          </select>
          <button onClick={()=>load()}
            style={{...inp,padding:'7px 14px',background:'#FDF2E9',border:'1px solid #6E2C00',
              cursor:'pointer',fontWeight:600,color:'#6E2C00'}}>🔄 Refresh</button>
          {(search||classFilter||statusFilter!=='ACTIVE') && (
            <button onClick={()=>{setSearch('');setClassFilter('');setStatusFilter('ACTIVE');setPage(1)}}
              style={{...inp,padding:'7px 14px',background:'#F5F5F5',border:'1px solid #ddd',
                cursor:'pointer',fontWeight:600,color:'#888'}}>✕ Clear</button>
          )}
          <div style={{marginLeft:'auto',fontSize:11,color:'#888'}}>
            {totalCount} students · Page {page}/{totalPages}
          </div>
        </div>
      </div>

      {/* ── TABLE AREA (scrollable) ── */}
      <div style={{flex:1,overflowY:'auto',overflowX:'auto'}}>
        {loading ? (
          <div style={{padding:60,textAlign:'center',color:'#aaa'}}>
            <div style={{fontSize:32,marginBottom:12}}>⏳</div>
            <div>Loading students...</div>
          </div>
        ) : students.length === 0 ? (
          <div style={{padding:60,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>👨‍🎓</div>
            <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:8}}>No Students Found</div>
            <button onClick={()=>nav('/edu/students/new')}
              style={{padding:'9px 22px',background:'#6E2C00',color:'#fff',border:'none',
                borderRadius:6,cursor:'pointer',fontWeight:700}}>+ Add First Student</button>
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#6E2C00',color:'#fff',position:'sticky',top:0,zIndex:10}}>
                {['Photo','Adm. No','Name','Class / Section','Gender','Father','Phone','Status','Actions'].map(h=>(
                  <th key={h} style={{padding:'9px 12px',textAlign:'left',fontSize:11,
                    fontWeight:600,whiteSpace:'nowrap',background:'#6E2C00'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s,i)=>{
                const sc = STATUS_COLORS[s.status] || STATUS_COLORS.ACTIVE
                const isInactive = s.status === 'INACTIVE'
                return (
                  <tr key={s.id}
                    style={{background:isInactive?'#FFF5F5':i%2===0?'#fff':'#FDF9F7',
                      borderBottom:'1px solid #F5EDE0',
                      opacity:isInactive?0.7:1,
                      transition:'background .1s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#FEF9F5'}
                    onMouseLeave={e=>e.currentTarget.style.background=isInactive?'#FFF5F5':i%2===0?'#fff':'#FDF9F7'}>

                    {/* Photo */}
                    <td style={{padding:'6px 12px'}}>
                      <div style={{width:36,height:36,borderRadius:'50%',overflow:'hidden',
                        background:'#F0EBF0',border:'2px solid #E8D5C4',flexShrink:0,
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                        {s.photo
                          ? <img src={s.photo} alt='' style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : (s.gender==='Female'?'👧':'👦')}
                      </div>
                    </td>
                    <td style={{padding:'9px 12px',fontFamily:'monospace',fontSize:10,
                      color:'#6E2C00',fontWeight:700,whiteSpace:'nowrap'}}>{s.admissionNo}</td>
                    <td style={{padding:'9px 12px'}}>
                      <div style={{fontWeight:700,color:'#333'}}>{s.name}</div>
                      {s.rollNo && <div style={{fontSize:10,color:'#aaa'}}>Roll: {s.rollNo}</div>}
                    </td>
                    <td style={{padding:'9px 12px',color:'#555',fontSize:11,whiteSpace:'nowrap'}}>
                      {s.section?.class?.className}<br/>
                      <span style={{color:'#aaa',fontSize:10}}>Sec {s.section?.sectionName}</span>
                    </td>
                    <td style={{padding:'9px 12px',textAlign:'center',fontSize:16}}>
                      {s.gender==='Male'?'👦':s.gender==='Female'?'👧':'—'}
                    </td>
                    <td style={{padding:'9px 12px',color:'#555',fontSize:11,whiteSpace:'nowrap'}}>
                      {s.fatherName||'—'}
                    </td>
                    <td style={{padding:'9px 12px',color:'#555',fontSize:11,whiteSpace:'nowrap'}}>
                      {s.fatherPhone||s.motherPhone||'—'}
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                        background:sc.bg,color:sc.color,whiteSpace:'nowrap'}}>{s.status}</span>
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <div style={{display:'flex',gap:4}}>
                        <button onClick={()=>nav(`/edu/students/${s.id}`)}
                          style={{padding:'4px 8px',background:'#EBF5FB',color:'#1A5276',
                            border:'1px solid #AED6F1',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                          👁 View
                        </button>
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

      {/* ── PAGINATION FOOTER (sticky bottom) ── */}
      {!loading && totalCount > 0 && (
        <div style={{position:'sticky',bottom:-16,background:'#fff',
          margin:'0 -16px -16px -16px',
          borderTop:'2px solid #E8E0E8',boxShadow:'0 -2px 8px rgba(0,0,0,.06)'}}>
          <Pagination/>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {showEdit && editStudent && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setShowEdit(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:620,
            maxHeight:'90vh',overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#1A5276'}}>✏️ Edit Student</div>
                <div style={{fontSize:11,color:'#888'}}>{editStudent.admissionNo} — {editStudent.name}</div>
              </div>
              <button onClick={()=>setShowEdit(false)}
                style={{background:'#f0f0f0',border:'none',borderRadius:6,
                  padding:'5px 12px',cursor:'pointer',fontWeight:700,fontSize:14}}>✕</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              {/* Basic */}
              <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#6E2C00',
                borderBottom:'2px solid #6E2C0022',paddingBottom:5,marginBottom:2}}>👤 Basic Info</div>
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Full Name *</label>
                <input value={form.name} onChange={e=>set('name',e.target.value)}
                  style={{...inp,width:'100%',fontSize:14}}/></div>
              <div><label style={lbl}>Date of Birth</label>
                <input type='date' value={form.dob} onChange={e=>set('dob',e.target.value)} style={{...inp,width:'100%'}}/></div>
              <div><label style={lbl}>Gender</label>
                <select value={form.gender} onChange={e=>set('gender',e.target.value)} style={{...inp,width:'100%'}}>
                  <option value=''>Select</option><option>Male</option><option>Female</option><option>Other</option>
                </select></div>
              <div><label style={lbl}>Blood Group</label>
                <select value={form.bloodGroup} onChange={e=>set('bloodGroup',e.target.value)} style={{...inp,width:'100%'}}>
                  <option value=''>Select</option>
                  {BLOOD_GROUPS.map(b=><option key={b}>{b}</option>)}
                </select></div>
              <div><label style={lbl}>Aadhar Number</label>
                <input value={form.aadhar} onChange={e=>set('aadhar',e.target.value)}
                  placeholder='XXXX XXXX XXXX' style={{...inp,width:'100%'}}/></div>

              {/* Academic */}
              <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#1A5276',
                borderBottom:'2px solid #1A527622',paddingBottom:5,marginBottom:2,marginTop:8}}>🎓 Academic</div>
              <div><label style={lbl}>Class</label>
                <select value={form.classId} onChange={e=>{
                  set('classId',e.target.value)
                  const cls=classes.find(c=>String(c.id)===e.target.value)
                  setSections(cls?.sections||[])
                  set('sectionId','')
                }} style={{...inp,width:'100%'}}>
                  <option value=''>Select Class</option>
                  {classes.map(c=><option key={c.id} value={c.id}>{c.className}</option>)}
                </select></div>
              <div><label style={lbl}>Section</label>
                <select value={form.sectionId} onChange={e=>set('sectionId',e.target.value)} style={{...inp,width:'100%'}}>
                  <option value=''>Select Section</option>
                  {sections.map(s=><option key={s.id} value={s.id}>Section {s.sectionName}</option>)}
                </select></div>
              <div><label style={lbl}>Roll Number</label>
                <input value={form.rollNo} onChange={e=>set('rollNo',e.target.value)} style={{...inp,width:'100%'}}/></div>
              <div><label style={lbl}>Category</label>
                <select value={form.category} onChange={e=>set('category',e.target.value)} style={{...inp,width:'100%'}}>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select></div>

              {/* Family */}
              <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#714B67',
                borderBottom:'2px solid #714B6722',paddingBottom:5,marginBottom:2,marginTop:8}}>👨‍👩‍👦 Family</div>
              <div><label style={lbl}>Father Name</label>
                <input value={form.fatherName} onChange={e=>set('fatherName',e.target.value)} style={{...inp,width:'100%'}}/></div>
              <div><label style={lbl}>Father Phone</label>
                <input value={form.fatherPhone} onChange={e=>set('fatherPhone',e.target.value)} style={{...inp,width:'100%'}}/></div>
              <div><label style={lbl}>Father Occupation</label>
                <input value={form.fatherOccupation} onChange={e=>set('fatherOccupation',e.target.value)} style={{...inp,width:'100%'}}/></div>
              <div><label style={lbl}>Mother Name</label>
                <input value={form.motherName} onChange={e=>set('motherName',e.target.value)} style={{...inp,width:'100%'}}/></div>
              <div><label style={lbl}>Mother Phone</label>
                <input value={form.motherPhone} onChange={e=>set('motherPhone',e.target.value)} style={{...inp,width:'100%'}}/></div>

              {/* Address */}
              <div style={{gridColumn:'1/-1',fontSize:11,fontWeight:700,color:'#117A65',
                borderBottom:'2px solid #117A6522',paddingBottom:5,marginBottom:2,marginTop:8}}>🏠 Address</div>
              <div style={{gridColumn:'1/-1'}}><label style={lbl}>Address</label>
                <input value={form.address} onChange={e=>set('address',e.target.value)} style={{...inp,width:'100%'}}/></div>
              <div><label style={lbl}>City</label>
                <input value={form.city} onChange={e=>set('city',e.target.value)} style={{...inp,width:'100%'}}/></div>
              <div><label style={lbl}>Pincode</label>
                <input value={form.pincode} onChange={e=>set('pincode',e.target.value)} style={{...inp,width:'100%'}}/></div>
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
              <button onClick={()=>setShowEdit(false)}
                style={{padding:'8px 18px',background:'#f0f0f0',border:'none',
                  borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={saveEdit} disabled={saving}
                style={{padding:'8px 24px',background:'#1A5276',color:'#fff',border:'none',
                  borderRadius:5,cursor:'pointer',fontWeight:700}}>
                {saving?'⏳ Saving...':'💾 Update Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOGGLE CONFIRM ── */}
      {confirmToggle && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:12,padding:28,width:400,
            boxShadow:'0 16px 48px rgba(0,0,0,.3)',textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>
              {confirmToggle.status==='ACTIVE'?'❌':'✅'}
            </div>
            <div style={{fontSize:16,fontWeight:800,marginBottom:8,
              color:confirmToggle.status==='ACTIVE'?'#C0392B':'#1E8449'}}>
              {confirmToggle.status==='ACTIVE'?'Mark as Inactive?':'Re-Activate Student?'}
            </div>
            <div style={{fontSize:14,fontWeight:700,color:'#333',marginBottom:6}}>{confirmToggle.name}</div>
            <div style={{fontSize:12,color:'#888',marginBottom:20}}>
              {confirmToggle.status==='ACTIVE'
                ? 'Student will be marked Inactive and hidden from active lists.'
                : 'Student will be re-activated and appear in active lists.'}
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button onClick={()=>setConfirmToggle(null)}
                style={{padding:'9px 22px',background:'#f0f0f0',border:'none',
                  borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:13}}>Cancel</button>
              <button onClick={toggleStatus}
                style={{padding:'9px 22px',border:'none',borderRadius:6,cursor:'pointer',
                  fontWeight:700,fontSize:13,color:'#fff',
                  background:confirmToggle.status==='ACTIVE'?'#C0392B':'#1E8449'}}>
                {confirmToggle.status==='ACTIVE'?'❌ Mark Inactive':'✅ Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
