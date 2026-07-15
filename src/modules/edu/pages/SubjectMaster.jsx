import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const inp  = { padding:'7px 9px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const sel  = { ...inp }
const th   = { padding:'8px 10px', fontSize:11, color:'#6E2C00', textAlign:'left', borderBottom:'2px solid #E8E0E8' }
const td   = { padding:'7px 10px', fontSize:12, borderBottom:'1px solid #F0F0F0' }
const btnPrimary   = { padding:'7px 16px', background:'#6E2C00', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:12 }
const btnSecondary = { padding:'6px 12px', background:'#fff', color:'#6E2C00', border:'1.5px solid #6E2C00', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:11 }
const btnDanger    = { padding:'4px 9px', background:'#fdecea', color:'#C0392B', border:'none', borderRadius:4, cursor:'pointer', fontSize:11 }

const TYPES = ['THEORY','PRACTICAL','LANGUAGE','CO_SCHOLASTIC']
const emptySubjectForm = { subjectCode:'', subjectName:'', shortName:'', type:'THEORY', isLanguage:false, languageNo:'', maxTheoryMarks:'', maxPracticalMarks:'', passMarks:'' }

export default function SubjectMaster() {
  const [instId,   setInstId]   = useState(localStorage.getItem('lnv_edu_inst') || '')
  const [tab,      setTab]      = useState('subjects') // 'subjects' | 'mapping'

  const [subjects, setSubjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId,setEditingId]= useState(null)
  const [form,     setForm]     = useState(emptySubjectForm)

  const [classes,  setClasses]  = useState([])
  const [selClass, setSelClass] = useState('')
  const [classSubs,setClassSubs]= useState([])
  const [staff,    setStaff]    = useState([])
  const [addSubId, setAddSubId] = useState('')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    const onStorage = () => setInstId(localStorage.getItem('lnv_edu_inst') || '')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const loadSubjects = () => {
    fetch(`${BASE}/edu/subjects?institutionId=${instId}`, { headers:hdr2() }).then(r=>r.json()).then(d=>setSubjects(d.data||[]))
  }
  useEffect(() => {
    loadSubjects()
    fetch(`${BASE}/edu/classes?institutionId=${instId}`, { headers:hdr2() }).then(r=>r.json()).then(d=>setClasses(d.data||[]))
    fetch(`${BASE}/edu/staff?type=TEACHING&limit=200&institutionId=${instId}`, { headers:hdr2() }).then(r=>r.json()).then(d=>setStaff(d.data||[]))
    setSelClass('')
  }, [instId])

  useEffect(() => {
    if (!selClass) { setClassSubs([]); return }
    loadClassSubs(selClass)
  }, [selClass])

  const loadClassSubs = async (classId) => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/edu/class-subjects?classId=${classId}`, { headers:hdr2() })
      const d = await r.json()
      setClassSubs(d.data || [])
    } catch { toast.error('Failed to load class subjects') }
    finally { setLoading(false) }
  }

  // ── Subject Master CRUD ──
  const openNewSubject = () => { setForm(emptySubjectForm); setEditingId(null); setShowForm(true) }
  const openEditSubject = (s) => {
    setForm({
      subjectCode:s.subjectCode, subjectName:s.subjectName, shortName:s.shortName||'',
      type:s.type, isLanguage:s.isLanguage, languageNo:s.languageNo||'',
      maxTheoryMarks:s.maxTheoryMarks||'', maxPracticalMarks:s.maxPracticalMarks||'', passMarks:s.passMarks||'',
    })
    setEditingId(s.id); setShowForm(true)
  }
  const saveSubject = async () => {
    if (!form.subjectName || (!editingId && !form.subjectCode)) return toast.error('Subject Code and Name are required')
    try {
      const url = editingId ? `${BASE}/edu/subjects/${editingId}` : `${BASE}/edu/subjects`
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? form : { ...form, institutionId: instId }
      const r = await fetch(url, { method, headers:hdr(), body:JSON.stringify(body) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(editingId ? '✅ Subject updated' : '✅ Subject created')
      setShowForm(false); loadSubjects()
    } catch { toast.error('Save failed') }
  }
  const toggleActive = async (s) => {
    await fetch(`${BASE}/edu/subjects/${s.id}`, { method:'PATCH', headers:hdr(), body:JSON.stringify({ isActive: !s.isActive }) })
    loadSubjects()
  }

  // ── Class ↔ Subject assignment ──
  const unassignedSubjects = subjects.filter(s => !classSubs.some(cs => cs.subjectId === s.id))

  const assignSubject = async () => {
    if (!addSubId) return toast.error('Pick a subject to add')
    try {
      const r = await fetch(`${BASE}/edu/class-subjects`, { method:'POST', headers:hdr(),
        body: JSON.stringify({ classId: selClass, subjectId: addSubId, periodsPerWeek: 6 }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success('✅ Subject added to class')
      setAddSubId(''); loadClassSubs(selClass)
    } catch { toast.error('Failed to add') }
  }
  const updateAssignment = async (cs, field, value) => {
    try {
      await fetch(`${BASE}/edu/class-subjects`, { method:'POST', headers:hdr(), body: JSON.stringify({
        classId: selClass, subjectId: cs.subjectId,
        staffId: field==='staffId' ? value : (cs.staffId||''),
        periodsPerWeek: field==='periodsPerWeek' ? value : cs.periodsPerWeek,
        isOptional: field==='isOptional' ? value : cs.isOptional,
      })})
      loadClassSubs(selClass)
    } catch { toast.error('Update failed') }
  }
  const removeAssignment = async (cs) => {
    try {
      await fetch(`${BASE}/edu/class-subjects/${cs.id}`, { method:'DELETE', headers:hdr2() })
      toast.success('Removed from class'); loadClassSubs(selClass)
    } catch { toast.error('Remove failed') }
  }

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📚 Subject Master</div>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>setTab('subjects')}
            style={{...btnSecondary, background:tab==='subjects'?'#6E2C00':'#fff', color:tab==='subjects'?'#fff':'#6E2C00'}}>
            Subjects
          </button>
          <button onClick={()=>setTab('mapping')}
            style={{...btnSecondary, background:tab==='mapping'?'#6E2C00':'#fff', color:tab==='mapping'?'#fff':'#6E2C00'}}>
            Class Mapping
          </button>
        </div>
      </div>

      {tab === 'subjects' && (
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
            <button onClick={openNewSubject} style={btnPrimary}>+ New Subject</button>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={th}>Code</th><th style={th}>Name</th><th style={th}>Type</th>
              <th style={th}>Theory / Practical / Pass</th><th style={th}>Status</th><th style={th}></th>
            </tr></thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s.id}>
                  <td style={td}>{s.subjectCode}</td>
                  <td style={td}>{s.subjectName}{s.isLanguage ? ` (L${s.languageNo||''})` : ''}</td>
                  <td style={td}>{s.type}</td>
                  <td style={td}>{s.maxTheoryMarks||'—'} / {s.maxPracticalMarks||'—'} / {s.passMarks||'—'}</td>
                  <td style={td}>
                    <span style={{color:s.isActive?'#1E8449':'#C0392B',fontWeight:700,fontSize:11}}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={td}>
                    <button onClick={()=>openEditSubject(s)} style={{...btnSecondary,marginRight:6,padding:'4px 10px'}}>Edit</button>
                    <button onClick={()=>toggleActive(s)} style={btnDanger}>{s.isActive?'Deactivate':'Activate'}</button>
                  </td>
                </tr>
              ))}
              {subjects.length===0 && <tr><td colSpan={6} style={{...td,textAlign:'center',color:'#aaa'}}>No subjects yet for this institution</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'mapping' && (
        <div>
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,marginBottom:12}}>
            <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
              <div style={{fontSize:12,fontWeight:700,color:'#6E2C00'}}>Class:</div>
              <select value={selClass} onChange={e=>setSelClass(e.target.value)} style={{...sel,width:220}}>
                <option value=''>Select a class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
              </select>
              {selClass && (
                <>
                  <select value={addSubId} onChange={e=>setAddSubId(e.target.value)} style={{...sel,width:220}}>
                    <option value=''>+ Add subject...</option>
                    {unassignedSubjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                  </select>
                  <button onClick={assignSubject} style={btnPrimary}>Add to Class</button>
                </>
              )}
            </div>
          </div>

          {!selClass ? (
            <div style={{textAlign:'center',padding:50,background:'#fff',borderRadius:8,border:'1px solid #E8E0E8',color:'#aaa'}}>
              Select a class to see and manage its assigned subjects
            </div>
          ) : loading ? (
            <div style={{textAlign:'center',padding:40,color:'#aaa'}}>⏳ Loading...</div>
          ) : (
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>
                  <th style={th}>Subject</th><th style={th}>Type</th><th style={th}>Teacher</th>
                  <th style={th}>Periods/Week</th><th style={th}>Optional</th><th style={th}></th>
                </tr></thead>
                <tbody>
                  {classSubs.map(cs => (
                    <tr key={cs.id}>
                      <td style={td}>{cs.subject.subjectName}</td>
                      <td style={td}>{cs.subject.type}</td>
                      <td style={td}>
                        <select value={cs.staffId||''} onChange={e=>updateAssignment(cs,'staffId',e.target.value)} style={{...sel,width:180}}>
                          <option value=''>— Unassigned —</option>
                          {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td style={td}>
                        <input type='number' min={1} max={20} value={cs.periodsPerWeek}
                          onChange={e=>updateAssignment(cs,'periodsPerWeek',e.target.value)} style={{...inp,width:60}} />
                      </td>
                      <td style={td}>
                        <input type='checkbox' checked={cs.isOptional} onChange={e=>updateAssignment(cs,'isOptional',e.target.checked)} />
                      </td>
                      <td style={td}>
                        <button onClick={()=>removeAssignment(cs)} style={btnDanger}>Remove</button>
                      </td>
                    </tr>
                  ))}
                  {classSubs.length===0 && <tr><td colSpan={6} style={{...td,textAlign:'center',color:'#aaa'}}>No subjects assigned to this class yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:8,padding:20,width:420,maxHeight:'85vh',overflow:'auto'}}>
            <div style={{fontSize:15,fontWeight:800,color:'#6E2C00',marginBottom:14}}>
              {editingId ? 'Edit Subject' : 'New Subject'}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {!editingId && (
                <div>
                  <label style={{fontSize:11,color:'#888'}}>Subject Code *</label>
                  <input value={form.subjectCode} onChange={e=>setForm({...form,subjectCode:e.target.value})} style={inp} />
                </div>
              )}
              <div>
                <label style={{fontSize:11,color:'#888'}}>Subject Name *</label>
                <input value={form.subjectName} onChange={e=>setForm({...form,subjectName:e.target.value})} style={inp} />
              </div>
              <div>
                <label style={{fontSize:11,color:'#888'}}>Short Name</label>
                <input value={form.shortName} onChange={e=>setForm({...form,shortName:e.target.value})} style={inp} />
              </div>
              <div>
                <label style={{fontSize:11,color:'#888'}}>Type</label>
                <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={sel}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type='checkbox' checked={form.isLanguage} onChange={e=>setForm({...form,isLanguage:e.target.checked})} />
                <label style={{fontSize:12}}>Is a language subject</label>
                {form.isLanguage && (
                  <input placeholder='L1/L2/L3 no.' value={form.languageNo} onChange={e=>setForm({...form,languageNo:e.target.value})} style={{...inp,width:100}} />
                )}
              </div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Max Theory</label>
                  <input value={form.maxTheoryMarks} onChange={e=>setForm({...form,maxTheoryMarks:e.target.value})} style={inp} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Max Practical</label>
                  <input value={form.maxPracticalMarks} onChange={e=>setForm({...form,maxPracticalMarks:e.target.value})} style={inp} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Pass Marks</label>
                  <input value={form.passMarks} onChange={e=>setForm({...form,passMarks:e.target.value})} style={inp} />
                </div>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:18}}>
              <button onClick={()=>setShowForm(false)} style={{...btnSecondary}}>Cancel</button>
              <button onClick={saveSubject} style={btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
