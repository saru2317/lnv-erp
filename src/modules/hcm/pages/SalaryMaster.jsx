import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n  => n ? '₹' + Number(n).toLocaleString('en-IN') : '—'

const TYPE_COLOR = {
  EARNING:   { bg:'#D4EDDA', c:'#155724' },
  DEDUCTION: { bg:'#F8D7DA', c:'#721C24' },
  STATUTORY: { bg:'#D1ECF1', c:'#0C5460' },
  EMPLOYER:  { bg:'#FFF3CD', c:'#856404' },
}

export default function SalaryMaster() {
  const [components, setComponents] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [tab,        setTab]        = useState('ALL')

  const EMPTY = {
    code:'', name:'', type:'EARNING', calcType:'FIXED',
    value:0, isPercentOf:'BASIC', isActive:true,
    taxable:true, pfApplicable:false, esiApplicable:false,
    printOnPayslip:true, sequence:10
  }
  const [form, setForm] = useState(EMPTY)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE}/pay-component`, { headers: hdr2() })
      const data = await res.json()
      setComponents(data.data || data || [])
    } catch { toast.error('Failed to load pay components') }
    finally { setLoading(false) }
  }

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setShowForm(true) }
  const openEdit = (c) => { setForm({ ...c }); setEditing(c.id); setShowForm(true) }

  const save = async () => {
    if (!form.code || !form.name) return toast.error('Code and Name required!')
    setSaving(true)
    try {
      const url    = editing ? `${BASE}/pay-component/${editing}` : `${BASE}/pay-component`
      const method = editing ? 'PATCH' : 'POST'
      const res    = await fetch(url, { method, headers: hdr(), body: JSON.stringify(form) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editing ? 'Component updated!' : 'Component added!')
      setShowForm(false); load()
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const TABS = ['ALL', 'EARNING', 'DEDUCTION', 'STATUTORY', 'EMPLOYER']
  const shown = tab === 'ALL' ? components : components.filter(c => c.type === tab)
  const F = f => ({
    value: form[f] ?? '',
    onChange: e => setForm(p => ({ ...p, [f]: e.target.value }))
  })

  return (
    <div>
      <div className="hcm-pg-hdr">
        <div>
          <h2 className="hcm-pg-title">Salary Master</h2>
          <p className="hcm-pg-sub">Pay components, CTC structure & earnings/deductions</p>
        </div>
        <button className="hcm-btn-primary" onClick={openAdd}>+ Add Component</button>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {Object.entries(TYPE_COLOR).map(([type, style]) => (
          <div key={type}
            style={{ background:style.bg, borderRadius:8,
              padding:'10px 14px', textAlign:'center',
              cursor:'pointer' }}
            onClick={() => setTab(type)}>
            <div style={{ fontSize:20, fontWeight:800,
              color:style.c, fontFamily:'DM Mono,monospace' }}>
              {components.filter(c => c.type === type).length}
            </div>
            <div style={{ fontSize:10, fontWeight:700,
              color:style.c, textTransform:'uppercase' }}>
              {type}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:10 }}>
        {TABS.map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            style={{
              padding:'5px 14px', borderRadius:14, fontSize:11,
              fontWeight:700, cursor:'pointer',
              background: tab === t ? '#714B67' : '#F8F4F8',
              color:      tab === t ? '#fff'    : '#714B67',
              border:    `1.5px solid ${tab === t ? '#714B67' : '#E0D5E0'}`,
            }}>
            {t} ({t==='ALL' ? components.length : components.filter(c=>c.type===t).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:8,
        border:'1.5px solid #E0D5E0', overflow:'hidden' }}>
        <table className="hcm-table">
          <thead>
            <tr>
              <th>#</th><th>Code</th><th>Component Name</th>
              <th>Type</th><th>Calc Method</th>
              <th>Value / %</th><th>Taxable</th>
              <th>PF</th><th>ESI</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ padding:30, textAlign:'center',
                color:'#6C757D' }}>Loading...</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={10} style={{ padding:30, textAlign:'center',
                color:'#6C757D' }}>
                No pay components. Click "+ Add Component" to create.
              </td></tr>
            ) : shown.map((c, i) => {
              const style = TYPE_COLOR[c.type] || TYPE_COLOR.EARNING
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight:700, color:'#6C757D', fontSize:11 }}>
                    {c.sequence || i+1}
                  </td>
                  <td><span style={{ fontFamily:'DM Mono,monospace',
                    fontWeight:700, color:'#714B67', fontSize:12 }}>
                    {c.code}
                  </span></td>
                  <td><strong style={{ fontSize:13 }}>{c.name}</strong></td>
                  <td>
                    <span style={{ ...style, padding:'2px 8px',
                      borderRadius:10, fontSize:11, fontWeight:700 }}>
                      {c.type}
                    </span>
                  </td>
                  <td style={{ fontSize:11, color:'#6C757D' }}>
                    {c.calcType || 'FIXED'}
                  </td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700 }}>
                    {c.calcType === 'PERCENT'
                      ? `${c.value}% of ${c.isPercentOf || 'BASIC'}`
                      : fmtC(c.value)}
                  </td>
                  <td>{c.taxable ? '✅' : '—'}</td>
                  <td>{c.pfApplicable ? '✅' : '—'}</td>
                  <td>{c.esiApplicable ? '✅' : '—'}</td>
                  <td>
                    <button className="btn-xs" onClick={() => openEdit(c)}>Edit</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="hcm-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="hcm-modal" onClick={e => e.stopPropagation()}
            style={{ maxWidth:520 }}>
            <div className="hcm-modal-hdr">
              <h3>{editing ? 'Edit Component' : 'Add Pay Component'}</h3>
              <span onClick={() => setShowForm(false)} style={{ cursor:'pointer' }}>✕</span>
            </div>
            <div style={{ padding:'16px 20px',
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[['code','Code *','BASIC'],['name','Name *','Basic Salary']].map(([k,l,p]) => (
                <div key={k}>
                  <label style={{ fontSize:10,fontWeight:700,color:'#495057',
                    display:'block',marginBottom:3,textTransform:'uppercase' }}>{l}</label>
                  <input {...F(k)} placeholder={p}
                    style={{ padding:'7px 10px',border:'1.5px solid #E0D5E0',
                      borderRadius:5,fontSize:12,width:'100%',
                      boxSizing:'border-box',outline:'none' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:'#495057',
                  display:'block',marginBottom:3,textTransform:'uppercase' }}>Type</label>
                <select {...F('type')}
                  style={{ padding:'7px 10px',border:'1.5px solid #E0D5E0',
                    borderRadius:5,fontSize:12,width:'100%',outline:'none' }}>
                  {['EARNING','DEDUCTION','STATUTORY','EMPLOYER'].map(t=>(
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:'#495057',
                  display:'block',marginBottom:3,textTransform:'uppercase' }}>Calc Method</label>
                <select {...F('calcType')}
                  style={{ padding:'7px 10px',border:'1.5px solid #E0D5E0',
                    borderRadius:5,fontSize:12,width:'100%',outline:'none' }}>
                  {['FIXED','PERCENT','FORMULA'].map(t=>(
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:'#495057',
                  display:'block',marginBottom:3,textTransform:'uppercase' }}>
                  {form.calcType === 'PERCENT' ? 'Percentage' : 'Fixed Amount'}
                </label>
                <input type="number" {...F('value')}
                  style={{ padding:'7px 10px',border:'1.5px solid #E0D5E0',
                    borderRadius:5,fontSize:12,width:'100%',
                    boxSizing:'border-box',outline:'none' }} />
              </div>
              {form.calcType === 'PERCENT' && (
                <div>
                  <label style={{ fontSize:10,fontWeight:700,color:'#495057',
                    display:'block',marginBottom:3,textTransform:'uppercase' }}>% Of</label>
                  <select {...F('isPercentOf')}
                    style={{ padding:'7px 10px',border:'1.5px solid #E0D5E0',
                      borderRadius:5,fontSize:12,width:'100%',outline:'none' }}>
                    {['BASIC','GROSS','CTC','BASIC+DA'].map(t=>(
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize:10,fontWeight:700,color:'#495057',
                  display:'block',marginBottom:3,textTransform:'uppercase' }}>Sequence</label>
                <input type="number" {...F('sequence')}
                  style={{ padding:'7px 10px',border:'1.5px solid #E0D5E0',
                    borderRadius:5,fontSize:12,width:'100%',
                    boxSizing:'border-box',outline:'none' }} />
              </div>
              {[['taxable','Taxable'],['pfApplicable','PF Applicable'],
                ['esiApplicable','ESI Applicable'],['printOnPayslip','Print on Payslip']].map(([k,l])=>(
                <div key={k} style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <input type="checkbox"
                    checked={!!form[k]}
                    onChange={e=>setForm(p=>({...p,[k]:e.target.checked}))} />
                  <label style={{ fontSize:12,fontWeight:600 }}>{l}</label>
                </div>
              ))}
            </div>
            <div style={{ padding:'12px 20px',borderTop:'1px solid #F0F0F0',
              display:'flex',justifyContent:'flex-end',gap:8 }}>
              <button className="hcm-btn-outline" onClick={()=>setShowForm(false)}>Cancel</button>
              <button className="hcm-btn-primary" disabled={saving} onClick={save}>
                {saving ? '⏳' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
