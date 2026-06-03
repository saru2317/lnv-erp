import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })

const WEEKOFF_OPTIONS = [
  { id:'sun_only',    label:'Sunday Only',              desc:'6 working days · 1 week-off' },
  { id:'sun_sat',     label:'Sunday + Alternate Saturday', desc:'5½ working days' },
  { id:'sun_allsat',  label:'Sunday + All Saturdays',   desc:'5 working days (Staff only)' },
  { id:'rotational',  label:'Rotational Week-Off',      desc:'1 day off per 7-day cycle (Workers)' },
]

export default function LeavePolicy() {
  const [leaveTypes, setLeaveTypes] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editing,    setEditing]    = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [weekoff,    setWeekoff]    = useState('sun_only')

  const EMPTY = {
    code:'', name:'', maxDays:0, carryForward:false,
    encashable:false, period:'Annual', medicalCertRequired:false,
    isActive:true, accrualRate:'', noticeRequired:''
  }
  const [form, setForm] = useState(EMPTY)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE}/hr-master/leave-types`, { headers: hdr2() })
      const data = await res.json()
      setLeaveTypes(data.data || [])
    } catch { toast.error('Failed to load leave types') }
    finally { setLoading(false) }
  }

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setShowForm(true) }
  const openEdit = (lt) => {
    setForm({ ...lt, maxDays: lt.maxDays || lt.days || 0 })
    setEditing(lt.id); setShowForm(true)
  }

  const save = async () => {
    if (!form.code || !form.name) return toast.error('Code and Name required!')
    setSaving(true)
    try {
      const url    = editing ? `${BASE}/hr-master/leave-types/${editing}` : `${BASE}/hr-master/leave-types`
      const method = editing ? 'PATCH' : 'POST'
      const res    = await fetch(url, { method, headers: hdr(), body: JSON.stringify(form) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editing ? 'Leave type updated!' : 'Leave type added!')
      setShowForm(false); load()
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const toggle = async (lt) => {
    try {
      await fetch(`${BASE}/hr-master/leave-types/${lt.id}`,
        { method:'PATCH', headers: hdr(), body: JSON.stringify({ isActive: !lt.isActive }) })
      load()
    } catch { toast.error('Failed to update') }
  }

  const F = f => ({ value: form[f] ?? '', onChange: e => setForm(p => ({ ...p, [f]: e.target.value })) })

  return (
    <div>
      <div className="hcm-pg-hdr">
        <div>
          <h2 className="hcm-pg-title">Leave Policy</h2>
          <p className="hcm-pg-sub">Leave types, entitlements & week-off rules</p>
        </div>
        <button className="hcm-btn-primary" onClick={openAdd}>+ Add Leave Type</button>
      </div>

      {/* Week-off config */}
      <div style={{ background:'#fff', borderRadius:8,
        border:'1.5px solid #E0D5E0', padding:'16px 20px', marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:13, color:'#714B67', marginBottom:12 }}>
          📅 Week-Off Configuration
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {WEEKOFF_OPTIONS.map(w => (
            <div key={w.id}
              onClick={() => setWeekoff(w.id)}
              style={{
                padding:'10px 14px', borderRadius:8, cursor:'pointer',
                border: `2px solid ${weekoff===w.id ? '#714B67' : '#E0D5E0'}`,
                background: weekoff===w.id ? '#EDE0EA' : '#FAFAFA',
              }}>
              <div style={{ fontWeight:700, fontSize:12,
                color: weekoff===w.id ? '#714B67' : '#1A1A2E' }}>
                {weekoff===w.id ? '✅ ' : ''}{w.label}
              </div>
              <div style={{ fontSize:10, color:'#6C757D', marginTop:2 }}>{w.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Types Table */}
      <div style={{ background:'#fff', borderRadius:8,
        border:'1.5px solid #E0D5E0', overflow:'hidden' }}>
        <table className="hcm-table">
          <thead>
            <tr>
              <th>Code</th><th>Leave Type</th><th>Max Days</th>
              <th>Period</th><th>Carry Forward</th><th>Encashable</th>
              <th>Medical Cert</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding:30, textAlign:'center',
                color:'#6C757D' }}>Loading...</td></tr>
            ) : leaveTypes.length === 0 ? (
              <tr><td colSpan={9} style={{ padding:30, textAlign:'center',
                color:'#6C757D' }}>No leave types. Click "+ Add Leave Type"</td></tr>
            ) : leaveTypes.map(lt => (
              <tr key={lt.id}>
                <td><span style={{ fontFamily:'DM Mono,monospace',
                  fontWeight:700, color:'#714B67', fontSize:12 }}>
                  {lt.code}
                </span></td>
                <td><strong style={{ fontSize:13 }}>{lt.name}</strong></td>
                <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700 }}>
                  {lt.maxDays || lt.days || 0}
                </td>
                <td style={{ fontSize:11, color:'#6C757D' }}>{lt.period || 'Annual'}</td>
                <td>{lt.carryForward || lt.carry ? '✅' : '—'}</td>
                <td>{lt.encashable || lt.encash ? '✅' : '—'}</td>
                <td>{lt.medicalCertRequired ? '📋' : '—'}</td>
                <td>
                  <span style={{
                    padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700,
                    background: lt.isActive !== false ? '#D4EDDA' : '#F8D7DA',
                    color:      lt.isActive !== false ? '#155724' : '#721C24',
                  }}>
                    {lt.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display:'flex', gap:4 }}>
                    <button className="btn-xs" onClick={() => openEdit(lt)}>Edit</button>
                    <button className="btn-xs"
                      style={{ background:'#FFF3CD', color:'#856404', border:'none' }}
                      onClick={() => toggle(lt)}>
                      {lt.isActive !== false ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="hcm-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="hcm-modal" onClick={e => e.stopPropagation()}
            style={{ maxWidth:480 }}>
            <div className="hcm-modal-hdr">
              <h3>{editing ? 'Edit Leave Type' : 'Add Leave Type'}</h3>
              <span onClick={() => setShowForm(false)} style={{ cursor:'pointer' }}>✕</span>
            </div>
            <div style={{ padding:'16px 20px',
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                ['code',   'Leave Code *', 'EL'],
                ['name',   'Leave Name *',  'Earned Leave'],
                ['maxDays','Max Days',       '15'],
                ['period', 'Period',         'Annual'],
                ['accrualRate', 'Accrual Rate', '1.25/month'],
                ['noticeRequired', 'Notice Required', '7 days'],
              ].map(([key, label, ph]) => (
                <div key={key}>
                  <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                    display:'block', marginBottom:3, textTransform:'uppercase' }}>
                    {label}
                  </label>
                  <input {...F(key)} placeholder={ph}
                    style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
                      borderRadius:5, fontSize:12, width:'100%',
                      boxSizing:'border-box', outline:'none' }} />
                </div>
              ))}
              {[
                ['carryForward',      'Carry Forward'],
                ['encashable',        'Encashable'],
                ['medicalCertRequired','Medical Cert Required'],
              ].map(([key, label]) => (
                <div key={key} style={{ display:'flex',
                  alignItems:'center', gap:8 }}>
                  <input type="checkbox"
                    checked={!!form[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} />
                  <label style={{ fontSize:12, fontWeight:600 }}>{label}</label>
                </div>
              ))}
            </div>
            <div style={{ padding:'12px 20px', borderTop:'1px solid #F0F0F0',
              display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button className="hcm-btn-outline"
                onClick={() => setShowForm(false)}>Cancel</button>
              <button className="hcm-btn-primary"
                disabled={saving} onClick={save}>
                {saving ? '⏳ Saving...' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
