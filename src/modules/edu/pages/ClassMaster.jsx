import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const inp  = { padding:'8px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl  = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block', marginBottom:3, textTransform:'uppercase' }

const WING_COLORS = {
  PRE_PRIMARY:{ bg:'#FEF9E7', color:'#B8860B', label:'Pre-Primary' },
  PRIMARY:    { bg:'#E8F5E9', color:'#1E8449', label:'Primary'     },
  MIDDLE:     { bg:'#EBF5FB', color:'#1A5276', label:'Middle'      },
  HIGH:       { bg:'#FDF2E9', color:'#6E2C00', label:'High'        },
  HIGHER_SEC: { bg:'#F0EBF0', color:'#714B67', label:'Higher Sec'  },
  UG:         { bg:'#E8F8F5', color:'#117A65', label:'UG'          },
  PG:         { bg:'#FDEDEC', color:'#C0392B', label:'PG'          },
  RESEARCH:   { bg:'#F5F5F5', color:'#555555', label:'Research'    },
}

export default function ClassMaster() {
  const [classes,  setClasses]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showAdd,  setShowAdd]  = useState(false)
  const [showSec,  setShowSec]  = useState(null) // classId to add section
  const [saving,   setSaving]   = useState(false)
  const [form,     setForm]     = useState({ className:'', classCode:'', wing:'PRIMARY', orderNo:'' })
  const [secForm,  setSecForm]  = useState({ sectionName:'', strength:'40' })
  const instId = localStorage.getItem('lnv_edu_inst') || ''

  const load = async () => {
    setLoading(true)
    const r = await fetch(`${BASE}/edu/classes?institutionId=${instId}`,{headers:hdr2()})
    const d = await r.json()
    setClasses(d.data||[])
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  const grouped = classes.reduce((acc,c)=>{
    const wing = c.wing||'PRIMARY'
    if (!acc[wing]) acc[wing]=[]
    acc[wing].push(c)
    return acc
  },{})

  const saveClass = async () => {
    if (!form.className.trim()) return toast.error('Class name required')
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/edu/classes`,{method:'POST',headers:hdr(),
        body:JSON.stringify({...form, orderNo:parseInt(form.orderNo||99)})})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ ${d.data.className} created!`)
      setShowAdd(false); setForm({ className:'', classCode:'', wing:'PRIMARY', orderNo:'' })
      load()
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const saveSection = async (classId) => {
    if (!secForm.sectionName.trim()) return toast.error('Section name required')
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/edu/sections`,{method:'POST',headers:hdr(),
        body:JSON.stringify({ classId, sectionName:secForm.sectionName, strength:parseInt(secForm.strength||40) })})
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ Section ${d.data.sectionName} added!`)
      setShowSec(null); setSecForm({ sectionName:'', strength:'40' })
      load()
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const WINGS = ['PRE_PRIMARY','PRIMARY','MIDDLE','HIGH','HIGHER_SEC','UG','PG','RESEARCH']

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>🏫 Class & Section Master</div>
          <div style={{fontSize:11,color:'#888'}}>{classes.length} classes · {classes.reduce((s,c)=>s+(c.sections?.length||0),0)} sections</div>
        </div>
        <button onClick={()=>setShowAdd(true)}
          style={{padding:'7px 18px',background:'#6E2C00',color:'#fff',border:'none',
            borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
          + Add Class
        </button>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:40,color:'#aaa'}}>⏳ Loading...</div>
      ) : classes.length===0 ? (
        <div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:8,border:'1px solid #E8E0E8'}}>
          <div style={{fontSize:48,marginBottom:12}}>🏫</div>
          <div style={{fontSize:15,fontWeight:600,color:'#6E2C00',marginBottom:8}}>No Classes Yet</div>
          <div style={{fontSize:12,color:'#888',marginBottom:16}}>Run seedEdu.js to load default data</div>
          <button onClick={()=>setShowAdd(true)}
            style={{padding:'9px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>
            + Add First Class
          </button>
        </div>
      ) : (
        Object.entries(grouped).sort((a,b)=>WINGS.indexOf(a[0])-WINGS.indexOf(b[0])).map(([wing, wingClasses])=>{
          const wc = WING_COLORS[wing] || WING_COLORS.PRIMARY
          return (
            <div key={wing} style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,marginBottom:12,overflow:'hidden'}}>
              <div style={{background:`linear-gradient(135deg,${wc.color}22,${wc.color}11)`,
                borderBottom:`2px solid ${wc.color}44`,padding:'9px 16px',
                display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:13,fontWeight:700,color:wc.color}}>{wc.label} Classes</div>
                <div style={{fontSize:11,color:wc.color}}>{wingClasses.length} classes</div>
              </div>
              <div style={{padding:14,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
                {wingClasses.sort((a,b)=>a.orderNo-b.orderNo).map(cls=>(
                  <div key={cls.id} style={{border:`1px solid ${wc.color}33`,borderRadius:8,
                    padding:12,background:`${wc.color}08`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <div style={{fontSize:13,fontWeight:700,color:wc.color}}>{cls.className}</div>
                      <div style={{fontFamily:'monospace',fontSize:10,color:'#aaa'}}>{cls.classCode}</div>
                    </div>
                    {/* Sections */}
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
                      {(cls.sections||[]).map(s=>(
                        <div key={s.id} style={{padding:'3px 10px',background:wc.bg,color:wc.color,
                          borderRadius:10,fontSize:11,fontWeight:700,border:`1px solid ${wc.color}44`}}>
                          Sec {s.sectionName}
                          <span style={{fontSize:9,color:'#888',marginLeft:4}}>({s.strength})</span>
                        </div>
                      ))}
                      {/* Add section inline */}
                      {showSec===cls.id ? (
                        <div style={{display:'flex',gap:4,alignItems:'center'}}>
                          <input defaultValue={secForm.sectionName}
                            onBlur={e=>setSecForm(f=>({...f,sectionName:e.target.value}))}
                            placeholder='A' maxLength={3}
                            style={{width:40,padding:'3px 6px',border:`1.5px solid ${wc.color}`,
                              borderRadius:4,fontSize:12,outline:'none',textAlign:'center'}} />
                          <button onClick={()=>saveSection(cls.id)}
                            style={{padding:'3px 8px',background:wc.color,color:'#fff',
                              border:'none',borderRadius:4,cursor:'pointer',fontSize:11}}>✅</button>
                          <button onClick={()=>setShowSec(null)}
                            style={{padding:'3px 6px',background:'#f0f0f0',border:'none',
                              borderRadius:4,cursor:'pointer',fontSize:11}}>✕</button>
                        </div>
                      ) : (
                        <button onClick={()=>{ setShowSec(cls.id); setSecForm({ sectionName:'', strength:'40' }) }}
                          style={{padding:'3px 8px',background:'transparent',color:wc.color,
                            border:`1px dashed ${wc.color}`,borderRadius:10,cursor:'pointer',fontSize:10}}>
                          + Section
                        </button>
                      )}
                    </div>
                    <div style={{fontSize:10,color:'#aaa'}}>
                      {cls.sections?.reduce((s,sec)=>s+(sec.strength||0),0)} total strength
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* Add Class Modal */}
      {showAdd && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:460,
            boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'#6E2C00',marginBottom:18}}>🏫 Add New Class</div>
            <div style={{display:'grid',gap:14}}>
              <div><label style={lbl}>Class Name *</label>
                <input defaultValue={form.className}
                  onBlur={e=>setForm(f=>({...f,className:e.target.value}))}
                  placeholder='e.g. Class 6 / B.Sc CS Year 1' style={inp} /></div>
              <div><label style={lbl}>Class Code *</label>
                <input defaultValue={form.classCode}
                  onBlur={e=>setForm(f=>({...f,classCode:e.target.value}))}
                  placeholder='e.g. C06 / BSC-CS-Y1' style={inp} /></div>
              <div><label style={lbl}>Wing / Level</label>
                <select value={form.wing} onChange={e=>setForm(f=>({...f,wing:e.target.value}))} style={inp}>
                  {Object.entries(WING_COLORS).map(([k,v])=>(
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select></div>
              <div><label style={lbl}>Sort Order</label>
                <input type='number' defaultValue={form.orderNo}
                  onBlur={e=>setForm(f=>({...f,orderNo:e.target.value}))}
                  placeholder='1, 2, 3...' style={inp} /></div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
              <button onClick={()=>setShowAdd(false)}
                style={{padding:'7px 16px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={saveClass} disabled={saving}
                style={{padding:'7px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>
                {saving?'⏳...':'💾 Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
