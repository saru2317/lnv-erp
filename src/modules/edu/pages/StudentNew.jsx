import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #DDD', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block',
  marginBottom:3, textTransform:'uppercase', letterSpacing:'0.5px' }
const sec = (title, color='#6E2C00') => ({
  fontSize:13, fontWeight:800, color, marginBottom:14,
  paddingBottom:8, borderBottom:`2px solid ${color}22`
})

const STEPS = ['Basic Info','Family Details','Academic Info','Transport & Hostel','Documents']
const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-']
const CATEGORIES   = ['GENERAL','OBC','BC','MBC','SC','ST','EWS']
const RELIGIONS    = ['Hindu','Muslim','Christian','Sikh','Jain','Buddhist','Others']

export default function StudentNew() {
  const nav = useNavigate()
  const [step,     setStep]     = useState(0)
  const [saving,   setSaving]   = useState(false)
  const [classes,  setClasses]  = useState([])
  const [sections, setSections] = useState([])
  const [routes,   setRoutes]   = useState([])
  const [stops,    setStops]    = useState([])

  const instId = localStorage.getItem('lnv_edu_inst') || ''

  const [photoPreview, setPhotoPreview] = useState('')
  const [uploadedDocs, setUploadedDocs] = useState([]) // [{name,type,size,dataUrl}]

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 500*1024) return toast.error('Photo must be under 500KB')
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result)
      set('photo', ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleDoc = (e, docName) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2*1024*1024) return toast.error('File must be under 2MB')
    const reader = new FileReader()
    reader.onload = (ev) => {
      setUploadedDocs(prev => {
        const filtered = prev.filter(d => d.name !== docName)
        return [...filtered, { name:docName, type:file.type, size:file.size, fileName:file.name, dataUrl:ev.target.result }]
      })
    }
    reader.readAsDataURL(file)
  }

  const removeDoc = (docName) => setUploadedDocs(prev => prev.filter(d => d.name !== docName))

  const [form, setForm] = useState({
    // Basic
    name:'', dob:'', gender:'', bloodGroup:'', aadhar:'', photo:'',
    // Family
    fatherName:'', fatherPhone:'', fatherOccupation:'', fatherEmail:'',
    motherName:'', motherPhone:'', motherOccupation:'',
    guardianName:'', guardianPhone:'', guardianRelation:'',
    address:'', city:'Coimbatore', pincode:'', state:'Tamil Nadu',
    // Academic
    classId:'', sectionId:'', rollNo:'',
    admissionDate: new Date().toISOString().slice(0,10),
    previousSchool:'', previousClass:'', tcNumber:'',
    category:'GENERAL', religion:'Hindu', motherTongue:'Tamil',
    nationality:'Indian', rteStudent:false,
    // Transport
    busRouteId:'', busStopId:'',
    // Hostel
    hostelRequired:false,
  })

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    fetch(`${BASE}/edu/classes?institutionId=${instId}`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setClasses(d.data||[])).catch(()=>{})
    fetch(`${BASE}/edu/bus-routes`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>setRoutes(d.data||[])).catch(()=>{})
  },[])

  useEffect(()=>{
    if (!form.classId) return
    const cls = classes.find(c=>String(c.id)===form.classId)
    setSections(cls?.sections||[])
    set('sectionId','')
  },[form.classId, classes])

  useEffect(()=>{
    if (!form.busRouteId) return
    const route = routes.find(r=>String(r.id)===form.busRouteId)
    setStops(route?.stops||[])
    set('busStopId','')
  },[form.busRouteId, routes])

  const canNext = () => {
    if (step===0) return form.name.trim() && form.gender && form.dob
    if (step===1) return form.fatherName.trim() && form.fatherPhone.trim()
    if (step===2) return form.classId && form.sectionId
    return true
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        classId:     undefined,
        sectionId:   form.sectionId    ? parseInt(form.sectionId)    : null,
        busRouteId:  form.busRouteId   ? parseInt(form.busRouteId)   : null,
        busStopId:   form.busStopId    ? parseInt(form.busStopId)    : null,
        documents:   uploadedDocs.length > 0 ? JSON.stringify(uploadedDocs.map(d=>({name:d.name,fileName:d.fileName,type:d.type}))) : null,
      }
      const r = await fetch(`${BASE}/edu/students`,{method:'POST',headers:hdr(),body:JSON.stringify(payload)})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ ${d.data.admissionNo} — ${d.data.name} admitted!`)
      nav(`/edu/students/${d.data.id}`)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const renderStep = () => {
    if (step===0) return (
      <div>
        <div style={sec('👤 Basic Information')}>👤 Basic Information</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
          <div style={{gridColumn:'1/-1'}}>
            <label style={lbl}>Student Full Name *</label>
            <input defaultValue={form.name} onBlur={e=>set('name',e.target.value)}
              placeholder='Enter student full name' style={{...inp,fontSize:15,fontWeight:700}} />
          </div>
          <div>
            <label style={lbl}>Date of Birth *</label>
            <input type='date' value={form.dob} onChange={e=>set('dob',e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Gender *</label>
            <div style={{display:'flex',gap:10,marginTop:4}}>
              {['Male','Female','Other'].map(g=>(
                <label key={g} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',
                  fontSize:13,fontWeight:form.gender===g?700:400}}>
                  <input type='radio' name='gender' value={g} checked={form.gender===g}
                    onChange={()=>set('gender',g)} style={{accentColor:'#6E2C00'}} />
                  {g==='Male'?'👦':g==='Female'?'👧':'⚧'} {g}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Blood Group</label>
            <select value={form.bloodGroup} onChange={e=>set('bloodGroup',e.target.value)} style={inp}>
              <option value=''>Select</option>
              {BLOOD_GROUPS.map(b=><option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Aadhar Number</label>
            <input defaultValue={form.aadhar} onBlur={e=>set('aadhar',e.target.value)}
              placeholder='XXXX XXXX XXXX' style={inp} />
          </div>
          <div style={{gridColumn:'1/-1'}}>
            <label style={lbl}>Residential Address *</label>
            <input defaultValue={form.address} onBlur={e=>set('address',e.target.value)}
              placeholder='Door No, Street Name, Area' style={inp} />
          </div>
          <div>
            <label style={lbl}>City</label>
            <input defaultValue={form.city} onBlur={e=>set('city',e.target.value)}
              placeholder='City' style={inp} />
          </div>
          <div>
            <label style={lbl}>Pincode</label>
            <input defaultValue={form.pincode} onBlur={e=>set('pincode',e.target.value)}
              placeholder='641001' style={inp} />
          </div>
          <div>
            <label style={lbl}>State</label>
            <input defaultValue={form.state} onBlur={e=>set('state',e.target.value)}
              placeholder='Tamil Nadu' style={inp} />
          </div>

          {/* Photo Upload */}
          <div style={{gridColumn:'1/-1',background:'#F8F5F8',borderRadius:8,padding:14}}>
            <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:10}}>📸 Student Photo</div>
            <div style={{display:'flex',gap:16,alignItems:'center'}}>
              <div style={{width:80,height:80,borderRadius:8,border:'2px solid #E8E0E8',
                background:'#F0EBF0',display:'flex',alignItems:'center',justifyContent:'center',
                overflow:'hidden',flexShrink:0}}>
                {photoPreview
                  ? <img src={photoPreview} alt='photo' style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : <span style={{fontSize:32}}>👤</span>}
              </div>
              <div>
                <label style={{display:'inline-block',padding:'8px 16px',background:'#6E2C00',color:'#fff',
                  borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:12}}>
                  📷 {photoPreview?'Change Photo':'Upload Photo'}
                  <input type='file' accept='image/*' onChange={handlePhoto} style={{display:'none'}}/>
                </label>
                <div style={{fontSize:11,color:'#888',marginTop:6}}>JPG/PNG · Max 500KB · Passport size</div>
                {photoPreview&&<button onClick={()=>{setPhotoPreview('');set('photo','')}} style={{marginTop:6,padding:'4px 10px',background:'#FDEDEC',color:'#C0392B',border:'none',borderRadius:4,cursor:'pointer',fontSize:11}}>✕ Remove</button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    )

    if (step===1) return (
      <div>
        <div style={sec('👨‍👩‍👦 Family Details')}>👨‍👩‍👦 Family Details</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {/* Father */}
          <div style={{background:'#EBF5FB',borderRadius:8,padding:14}}>
            <div style={{fontSize:12,fontWeight:700,color:'#1A5276',marginBottom:10}}>👨 Father Details</div>
            <div style={{display:'grid',gap:10}}>
              <div><label style={lbl}>Father Name *</label>
                <input defaultValue={form.fatherName} onBlur={e=>set('fatherName',e.target.value)}
                  placeholder='Father full name' style={inp} /></div>
              <div><label style={lbl}>Mobile *</label>
                <input defaultValue={form.fatherPhone} onBlur={e=>set('fatherPhone',e.target.value)}
                  placeholder='+91 99999 99999' style={inp} /></div>
              <div><label style={lbl}>Occupation</label>
                <input defaultValue={form.fatherOccupation} onBlur={e=>set('fatherOccupation',e.target.value)}
                  placeholder='Business / Service' style={inp} /></div>
              <div><label style={lbl}>Email</label>
                <input defaultValue={form.fatherEmail} onBlur={e=>set('fatherEmail',e.target.value)}
                  placeholder='father@email.com' style={inp} /></div>
            </div>
          </div>
          {/* Mother */}
          <div style={{background:'#F0EBF0',borderRadius:8,padding:14}}>
            <div style={{fontSize:12,fontWeight:700,color:'#714B67',marginBottom:10}}>👩 Mother Details</div>
            <div style={{display:'grid',gap:10}}>
              <div><label style={lbl}>Mother Name</label>
                <input defaultValue={form.motherName} onBlur={e=>set('motherName',e.target.value)}
                  placeholder='Mother full name' style={inp} /></div>
              <div><label style={lbl}>Mobile</label>
                <input defaultValue={form.motherPhone} onBlur={e=>set('motherPhone',e.target.value)}
                  placeholder='+91 99999 99999' style={inp} /></div>
              <div><label style={lbl}>Occupation</label>
                <input defaultValue={form.motherOccupation} onBlur={e=>set('motherOccupation',e.target.value)}
                  placeholder='Homemaker / Business' style={inp} /></div>
            </div>
          </div>
        </div>
        {/* Guardian */}
        <div style={{marginTop:14,background:'#FEF9E7',borderRadius:8,padding:14}}>
          <div style={{fontSize:12,fontWeight:700,color:'#B8860B',marginBottom:10}}>
            👴 Guardian Details (if different from parents)
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <div><label style={lbl}>Guardian Name</label>
              <input defaultValue={form.guardianName} onBlur={e=>set('guardianName',e.target.value)}
                placeholder='Guardian name' style={inp} /></div>
            <div><label style={lbl}>Mobile</label>
              <input defaultValue={form.guardianPhone} onBlur={e=>set('guardianPhone',e.target.value)}
                placeholder='+91 99999 99999' style={inp} /></div>
            <div><label style={lbl}>Relation</label>
              <input defaultValue={form.guardianRelation} onBlur={e=>set('guardianRelation',e.target.value)}
                placeholder='Uncle / Grandparent' style={inp} /></div>
          </div>
        </div>
      </div>
    )

    if (step===2) return (
      <div>
        <div style={sec('🎓 Academic Information')}>🎓 Academic Information</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
          <div>
            <label style={lbl}>Admission Date *</label>
            <input type='date' value={form.admissionDate}
              onChange={e=>set('admissionDate',e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Class *</label>
            <select value={form.classId} onChange={e=>set('classId',e.target.value)} style={inp}>
              <option value=''>Select Class</option>
              {classes.map(c=><option key={c.id} value={c.id}>{c.className}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Section *</label>
            <select value={form.sectionId} onChange={e=>set('sectionId',e.target.value)}
              disabled={!form.classId} style={{...inp,opacity:!form.classId?0.5:1}}>
              <option value=''>Select Section</option>
              {sections.map(s=><option key={s.id} value={s.id}>Section {s.sectionName}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Roll Number</label>
            <input defaultValue={form.rollNo} onBlur={e=>set('rollNo',e.target.value)}
              placeholder='Auto if blank' style={inp} />
          </div>
          <div>
            <label style={lbl}>Category</label>
            <select value={form.category} onChange={e=>set('category',e.target.value)} style={inp}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Religion</label>
            <select value={form.religion} onChange={e=>set('religion',e.target.value)} style={inp}>
              {RELIGIONS.map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Mother Tongue</label>
            <input defaultValue={form.motherTongue} onBlur={e=>set('motherTongue',e.target.value)}
              placeholder='Tamil' style={inp} />
          </div>
          <div>
            <label style={lbl}>Nationality</label>
            <input defaultValue={form.nationality} onBlur={e=>set('nationality',e.target.value)}
              placeholder='Indian' style={inp} />
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,paddingTop:22}}>
            <input type='checkbox' id='rte' checked={form.rteStudent}
              onChange={e=>set('rteStudent',e.target.checked)}
              style={{width:16,height:16,accentColor:'#6E2C00'}} />
            <label htmlFor='rte' style={{fontSize:13,fontWeight:600,cursor:'pointer',color:'#C0392B'}}>
              RTE Student (Free Admission)
            </label>
          </div>
        </div>
        {/* Previous School */}
        <div style={{marginTop:14,background:'#F5F5F5',borderRadius:8,padding:14}}>
          <div style={{fontSize:12,fontWeight:700,color:'#555',marginBottom:10}}>📋 Previous School Details</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <div style={{gridColumn:'1/3'}}>
              <label style={lbl}>Previous School Name</label>
              <input defaultValue={form.previousSchool} onBlur={e=>set('previousSchool',e.target.value)}
                placeholder='Name of previous school' style={inp} />
            </div>
            <div><label style={lbl}>Class Studied</label>
              <input defaultValue={form.previousClass} onBlur={e=>set('previousClass',e.target.value)}
                placeholder='e.g. Class 5' style={inp} /></div>
            <div><label style={lbl}>TC Number</label>
              <input defaultValue={form.tcNumber} onBlur={e=>set('tcNumber',e.target.value)}
                placeholder='Transfer Certificate No.' style={inp} /></div>
          </div>
        </div>
      </div>
    )

    if (step===3) return (
      <div>
        <div style={sec('🚌 Transport & Hostel')}>🚌 Transport & Hostel</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {/* Transport */}
          <div style={{background:'#E8F8F5',borderRadius:8,padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'#117A65',marginBottom:12}}>🚌 Bus Details</div>
            <div style={{display:'grid',gap:12}}>
              <div>
                <label style={lbl}>Bus Route</label>
                <select value={form.busRouteId} onChange={e=>set('busRouteId',e.target.value)} style={inp}>
                  <option value=''>No Bus / Own Transport</option>
                  {routes.map(r=>(
                    <option key={r.id} value={r.id}>{r.routeNo} — {r.routeName}</option>
                  ))}
                </select>
              </div>
              {form.busRouteId && (
                <div>
                  <label style={lbl}>Bus Stop (Pickup Point)</label>
                  <select value={form.busStopId} onChange={e=>set('busStopId',e.target.value)} style={inp}>
                    <option value=''>Select Stop</option>
                    {stops.map(s=>(
                      <option key={s.id} value={s.id}>
                        {s.stopName} — Pickup: {s.pickupTime}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {form.busRouteId && form.busStopId && (
                <div style={{background:'#117A6522',borderRadius:6,padding:'8px 12px',fontSize:12,color:'#117A65',fontWeight:600}}>
                  ✅ Bus fee will be auto-added to fee demand
                </div>
              )}
            </div>
          </div>
          {/* Hostel */}
          <div style={{background:'#FDF2E9',borderRadius:8,padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'#6E2C00',marginBottom:12}}>🏠 Hostel Details</div>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:12}}>
              <input type='checkbox' checked={form.hostelRequired}
                onChange={e=>set('hostelRequired',e.target.checked)}
                style={{width:16,height:16,accentColor:'#6E2C00'}} />
              <span style={{fontSize:13,fontWeight:600}}>Hostel Required</span>
            </label>
            {form.hostelRequired && (
              <div style={{background:'#6E2C0022',borderRadius:6,padding:'8px 12px',fontSize:12,color:'#6E2C00',fontWeight:600}}>
                ✅ Hostel room will be allocated separately
              </div>
            )}
            {!form.hostelRequired && (
              <div style={{fontSize:12,color:'#aaa'}}>
                Student is a day scholar — no hostel required
              </div>
            )}
          </div>
        </div>
      </div>
    )

    if (step===4) return (
      <div>
        <div style={sec('📄 Documents Upload')}>📄 Documents Upload</div>
        <div style={{background:'#F8F5F8',borderRadius:8,padding:16,marginBottom:16}}>
          <div style={{fontSize:12,color:'#888',marginBottom:12}}>
            Upload scanned copies or photos of documents:
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[
              {name:'Birth Certificate',icon:'📋',req:true},
              {name:'Transfer Certificate (TC)',icon:'📄',req:false},
              {name:'Aadhar Card (Student)',icon:'🪪',req:true},
              {name:'Aadhar Card (Parent)',icon:'🪪',req:false},
              {name:'Previous Mark Sheet',icon:'📊',req:false},
              {name:'Community Certificate',icon:'📜',req:false},
              {name:'Income Certificate',icon:'💰',req:false},
              {name:'Passport Photo',icon:'📸',req:true},
              {name:'Medical Certificate',icon:'🏥',req:false},
              {name:'Nativity Certificate',icon:'🗺️',req:false},
            ].map(doc=>{
              const uploaded = uploadedDocs.find(d=>d.name===doc.name)
              return(
                <div key={doc.name} style={{background:'#fff',borderRadius:8,padding:'10px 12px',
                  border:`1.5px solid ${uploaded?'#1E8449':'#E8E0E8'}`,
                  display:'flex',gap:10,alignItems:'center'}}>
                  <div style={{fontSize:22,flexShrink:0}}>{doc.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#333',marginBottom:2}}>
                      {doc.name}{doc.req&&<span style={{color:'#C0392B'}}> *</span>}
                    </div>
                    {uploaded?(
                      <div style={{display:'flex',gap:6,alignItems:'center'}}>
                        <span style={{fontSize:10,color:'#1E8449',fontWeight:700}}>✅ {uploaded.fileName}</span>
                        <button onClick={()=>removeDoc(doc.name)}
                          style={{padding:'1px 6px',background:'#FDEDEC',color:'#C0392B',
                            border:'none',borderRadius:3,cursor:'pointer',fontSize:10}}>✕</button>
                      </div>
                    ):(
                      <label style={{display:'inline-block',padding:'3px 10px',background:'#EBF5FB',
                        color:'#1A5276',borderRadius:4,cursor:'pointer',fontSize:10,fontWeight:700}}>
                        📎 Upload
                        <input type='file' accept='image/*,.pdf' onChange={e=>handleDoc(e,doc.name)} style={{display:'none'}}/>
                      </label>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{marginTop:10,fontSize:11,color:'#888'}}>
            ✅ {uploadedDocs.length} of 10 documents uploaded · Accepted: JPG, PNG, PDF · Max 2MB each
          </div>
        </div>

        {/* Summary before save */}
        <div style={{background:'#E8F5E9',border:'1px solid #1E8449',borderRadius:8,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:'#1E8449',marginBottom:10}}>
            ✅ Admission Summary
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12}}>
            {[
              ['Student Name',   form.name || '—'],
              ['Date of Birth',  form.dob  || '—'],
              ['Gender',         form.gender || '—'],
              ['Category',       form.category],
              ['Class',          classes.find(c=>String(c.id)===form.classId)?.className || '—'],
              ['Section',        sections.find(s=>String(s.id)===form.sectionId)?.sectionName ? `Section ${sections.find(s=>String(s.id)===form.sectionId)?.sectionName}` : '—'],
              ['Father Name',    form.fatherName || '—'],
              ['Father Phone',   form.fatherPhone || '—'],
              ['Bus Route',      routes.find(r=>String(r.id)===form.busRouteId)?.routeName || 'No Bus'],
              ['Hostel',         form.hostelRequired ? 'Required' : 'Day Scholar'],
            ].map(([l,v])=>(
              <div key={l} style={{display:'flex',gap:6}}>
                <span style={{color:'#888',minWidth:100}}>{l}:</span>
                <span style={{fontWeight:700,color:'#333'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:14}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>➕ New Admission</div>
          <div style={{fontSize:11,color:'#888'}}>Fill all details carefully</div>
        </div>
        <button onClick={()=>nav('/edu/students')}
          style={{padding:'6px 14px',background:'#fff',border:'1px solid #ddd',
            borderRadius:5,cursor:'pointer',fontSize:12,color:'#555',fontWeight:600}}>
          ← Back to Students
        </button>
      </div>

      {/* Step Indicator */}
      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:10,
        padding:'12px 16px',marginBottom:14,display:'flex',alignItems:'center'}}>
        {STEPS.map((s,i)=>(
          <React.Fragment key={s}>
            <div onClick={()=>i<step&&setStep(i)}
              style={{display:'flex',alignItems:'center',gap:8,cursor:i<step?'pointer':'default'}}>
              <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',
                justifyContent:'center',fontWeight:700,fontSize:12,
                background:i<step?'#1E8449':i===step?'#6E2C00':'#F0F0F0',
                color:i<=step?'#fff':'#999'}}>
                {i<step?'✓':i+1}
              </div>
              <span style={{fontSize:11,fontWeight:i===step?700:400,
                color:i===step?'#6E2C00':i<step?'#1E8449':'#999',
                display:window.innerWidth<800&&i!==step?'none':'block'}}>
                {s}
              </span>
            </div>
            {i<STEPS.length-1&&<div style={{flex:1,height:2,margin:'0 8px',background:i<step?'#1E8449':'#F0F0F0'}}/>}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:10,
        padding:20,marginBottom:14}}>
        {renderStep()}
      </div>

      {/* Navigation */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}
          style={{padding:'10px 20px',background:'#fff',border:'1px solid #ddd',
            borderRadius:6,cursor:step===0?'not-allowed':'pointer',
            fontWeight:600,color:step===0?'#ccc':'#555',opacity:step===0?0.5:1}}>
          ← Previous
        </button>

        {/* Mini summary */}
        <div style={{fontSize:12,color:'#888',textAlign:'center'}}>
          {form.name && <span style={{color:'#6E2C00',fontWeight:700}}>{form.name}</span>}
          {form.gender && <span> · {form.gender==='Male'?'👦':'👧'}</span>}
          {form.classId && <span> · {classes.find(c=>String(c.id)===form.classId)?.className}</span>}
        </div>

        {step < STEPS.length-1 ? (
          <button onClick={()=>{ if(!canNext()) return toast.error('Fill required fields first'); setStep(s=>s+1) }}
            style={{padding:'10px 24px',background:'#6E2C00',color:'#fff',border:'none',
              borderRadius:6,cursor:'pointer',fontWeight:700}}>
            Next: {STEPS[step+1]} →
          </button>
        ) : (
          <button onClick={save} disabled={saving}
            style={{padding:'10px 28px',background:'#1E8449',color:'#fff',border:'none',
              borderRadius:6,cursor:'pointer',fontWeight:800,fontSize:14}}>
            {saving?'⏳ Saving...':'✅ Complete Admission'}
          </button>
        )}
      </div>
    </div>
  )
}
