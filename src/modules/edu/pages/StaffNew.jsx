import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #DDD', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block',
  marginBottom:3, textTransform:'uppercase', letterSpacing:'0.5px' }
const sec = (color='#6E2C00') => ({
  fontSize:13, fontWeight:800, color, marginBottom:14,
  paddingBottom:8, borderBottom:`2px solid ${color}22`
})

// Same lists as StaffMaster.jsx — keep in sync if you edit either
const DESIGNATIONS = ['Principal','Vice Principal','HM','HOD','Professor','Asst. Professor',
  'PGT','TGT','PRT','Lab Assistant','Librarian','Accountant','Admin Staff','Peon','Driver','Attender']
const QUALIFICATIONS = ['PhD','M.Phil','ME/MTech','MBA','MCA','MSc','MA','MCom','BE/BTech','BCA','BSc','BA','BCom','Diploma','SSLC']

const EMPTY_FORM = {
  name:'', type:'TEACHING', designation:'', qualification:'', specialization:'',
  phone:'', email:'', doj:new Date().toISOString().slice(0,10), salary:'',
}

export default function StaffNew() {
  const nav = useNavigate()
  const instId = localStorage.getItem('lnv_edu_inst') || ''
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }))

  const save = async (addAnother) => {
    if (!form.name.trim())  return toast.error('Name is required')
    if (!form.phone.trim()) return toast.error('Phone number is required')
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/edu/staff`, { method:'POST', headers:hdr(),
        body: JSON.stringify({ ...form, institutionId: instId }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ ${d.data.staffCode} — ${d.data.name} added`)
      if (addAnother) setForm(EMPTY_FORM)
      else nav('/edu/staff')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:14}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>➕ New Staff</div>
          <div style={{fontSize:11,color:'#888'}}>Staff code is generated automatically</div>
        </div>
        <button onClick={()=>nav('/edu/staff')}
          style={{padding:'6px 14px',background:'#fff',border:'1px solid #ddd',
            borderRadius:5,cursor:'pointer',fontSize:12,color:'#555',fontWeight:600}}>
          ← Back to Staff List
        </button>
      </div>

      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:10,padding:20,marginBottom:14}}>
        <div style={sec()}>👤 Basic Information</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:22}}>
          <div style={{gridColumn:'1/-1'}}>
            <label style={lbl}>Full Name *</label>
            <input value={form.name} onChange={e=>set('name',e.target.value)}
              placeholder='Enter staff full name' style={{...inp,fontSize:15,fontWeight:700}} />
          </div>
          <div>
            <label style={lbl}>Staff Type *</label>
            <select value={form.type} onChange={e=>set('type',e.target.value)} style={inp}>
              <option value='TEACHING'>Teaching</option>
              <option value='NON_TEACHING'>Non-Teaching</option>
              <option value='CONTRACT'>Contract</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Phone *</label>
            <input value={form.phone} onChange={e=>set('phone',e.target.value)}
              placeholder='10-digit mobile number' style={inp} />
          </div>
          <div>
            <label style={lbl}>Email</label>
            <input type='email' value={form.email} onChange={e=>set('email',e.target.value)}
              placeholder='name@example.com' style={inp} />
          </div>
        </div>

        <div style={sec('#1A5276')}>🎓 Professional Details</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:22}}>
          <div>
            <label style={lbl}>Designation</label>
            <select value={form.designation} onChange={e=>set('designation',e.target.value)} style={inp}>
              <option value=''>Select</option>
              {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Qualification</label>
            <select value={form.qualification} onChange={e=>set('qualification',e.target.value)} style={inp}>
              <option value=''>Select</option>
              {QUALIFICATIONS.map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Specialization / Subject</label>
            <input value={form.specialization} onChange={e=>set('specialization',e.target.value)}
              placeholder='Mathematics / Physics / English' style={inp} />
          </div>
        </div>

        <div style={sec('#1E8449')}>💼 Employment</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
          <div>
            <label style={lbl}>Date of Joining</label>
            <input type='date' value={form.doj} onChange={e=>set('doj',e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Monthly Salary (₹)</label>
            <input type='number' value={form.salary} onChange={e=>set('salary',e.target.value)}
              placeholder='e.g. 35000' style={inp} />
          </div>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
        <button onClick={()=>save(true)} disabled={saving}
          style={{padding:'10px 20px',background:'#fff',color:'#6E2C00',border:'1.5px solid #6E2C00',
            borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:13}}>
          {saving ? '⏳ Saving...' : '💾 Save & Add Another'}
        </button>
        <button onClick={()=>save(false)} disabled={saving}
          style={{padding:'10px 28px',background:'#1E8449',color:'#fff',border:'none',
            borderRadius:6,cursor:'pointer',fontWeight:800,fontSize:14}}>
          {saving ? '⏳ Saving...' : '✅ Save & Go to List'}
        </button>
      </div>
    </div>
  )
}
