import React, { useState } from 'react'
import { NUMBER_SERIES, ALL_MODULES } from './_configData'

export default function NumberSeries() {
  const [series,   setSeries]   = useState(NUMBER_SERIES)
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [modF,     setModF]     = useState('All')
  const [form, setForm] = useState({ module:'SD', docType:'', prefix:'', next:1, padding:4, suffix:'', status:'Active' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const preview = () => {
    const padded = String(form.next).padStart(parseInt(form.padding) || 4, '0')
    return `${form.prefix}${padded}${form.suffix}`
  }

  const handleSave = () => {
    if (!form.docType || !form.prefix) { alert('Document type and prefix required'); return }
    if (editId) {
      setSeries(s => s.map(x => x.id === editId ? { ...x, ...form, next:parseInt(form.next), padding:parseInt(form.padding) } : x))
      setEditId(null)
    } else {
      const id = `NS-${String(series.length + 1).padStart(3,'0')}`
      setSeries(s => [...s, { id, ...form, next:parseInt(form.next), padding:parseInt(form.padding), example:preview() }])
    }
    setForm({ module:'SD', docType:'', prefix:'', next:1, padding:4, suffix:'', status:'Active' })
    setShowForm(false)
  }

  const handleEdit = s => {
    setForm({ module:s.module, docType:s.docType, prefix:s.prefix, next:s.next, padding:s.padding, suffix:s.suffix||'', status:s.status })
    setEditId(s.id); setShowForm(true)
  }

  const moduleColor = m => ({ SD:'#117A65', MM:'#1A5276', PP:'#714B67', FI:'#196F3D', QM:'#C0392B', HCM:'#6C3483', CRM:'#784212', WM:'#1F618D' }[m] || '#555')

  const filtered = series.filter(s => modF === 'All' || s.module === modF)
  const modules  = [...new Set(series.map(s => s.module))]

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Number Series <small>Auto-numbering per document type</small></div>
        <div className="fi-lv-actions">
          <select className="sd-select" value={modF} onChange={e=>setModF(e.target.value)}>
            <option value="All">All Modules</option>
            {modules.map(m => <option key={m}>{m}</option>)}
          </select>
          <button className="btn btn-p btn-s" onClick={() => { setEditId(null); setShowForm(true) }}>+ New Series</button>
        </div>
      </div>

      {showForm && (
        <div className="fi-panel" style={{ marginBottom:'16px', border:'2px solid var(--odoo-purple)' }}>
          <div className="fi-panel-hdr"><h3>{editId ? ' Edit' : ' New'} Number Series</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field">
                <label>Module</label>
                <select value={form.module} onChange={e=>set('module',e.target.value)}>
                  {['SD','MM','WM','FI','PP','QM','PM','HCM','CRM','Config'].map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="sd-field"><label>Document Type *</label><input value={form.docType} onChange={e=>set('docType',e.target.value)} placeholder="e.g. Sales Order" /></div>
              <div className="sd-field"><label>Prefix *</label><input value={form.prefix} onChange={e=>set('prefix',e.target.value)} placeholder="e.g. SO/" style={{fontFamily:'DM Mono,monospace'}} /></div>
              <div className="sd-field"><label>Suffix (optional)</label><input value={form.suffix} onChange={e=>set('suffix',e.target.value)} placeholder="e.g. /25-26" style={{fontFamily:'DM Mono,monospace'}} /></div>
              <div className="sd-field"><label>Next Number</label><input type="number" value={form.next} onChange={e=>set('next',e.target.value)} min={1} /></div>
              <div className="sd-field"><label>Zero Padding</label><input type="number" value={form.padding} onChange={e=>set('padding',e.target.value)} min={1} max={8} /></div>
              <div className="sd-field">
                <label>Status</label>
                <select value={form.status} onChange={e=>set('status',e.target.value)}><option>Active</option><option>Inactive</option></select>
              </div>
            </div>
            {/* Live preview */}
            <div style={{ marginTop:'10px', padding:'10px 14px', background:'#F8F9FA', borderRadius:'6px', display:'flex', alignItems:'center', gap:'12px' }}>
              <span style={{ fontSize:'11px', color:'var(--odoo-gray)', fontWeight:'700' }}>PREVIEW:</span>
              <span style={{ fontFamily:'DM Mono,monospace', fontWeight:'800', fontSize:'16px', color:'var(--odoo-purple)' }}>{preview()}</span>
              <span style={{ fontSize:'11px', color:'var(--odoo-gray)' }}>Next: <strong style={{fontFamily:'DM Mono,monospace'}}>{form.prefix}{String(parseInt(form.next)+1).padStart(parseInt(form.padding)||4,'0')}{form.suffix}</strong></span>
            </div>
            <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
              <button className="btn btn-p btn-s" onClick={handleSave}> {editId?'Update':'Save'}</button>
              <button className="btn btn-s sd-bsm" onClick={()=>{setShowForm(false);setEditId(null)}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead>
            <tr><th>Module</th><th>Document Type</th><th>Format</th><th>Next Number</th><th>Example</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const padded = String(s.next).padStart(s.padding, '0')
              const eg = `${s.prefix}${padded}${s.suffix||''}`
              return (
                <tr key={s.id}>
                  <td>
                    <span style={{ padding:'3px 8px', borderRadius:'6px', fontSize:'10px', fontWeight:'800',
                      background:moduleColor(s.module)+'22', color:moduleColor(s.module) }}>{s.module}</span>
                  </td>
                  <td style={{ fontWeight:'600', fontSize:'12px' }}>{s.docType}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontSize:'12px', color:'var(--odoo-gray)' }}>
                    {s.prefix}<span style={{ color:'var(--odoo-orange)' }}>{'N'.repeat(s.padding)}</span>{s.suffix||''}
                  </td>
                  <td>
                    <strong style={{ fontFamily:'DM Mono,monospace', color:'var(--odoo-blue)', fontSize:'14px' }}>{s.next.toLocaleString()}</strong>
                  </td>
                  <td>
                    <span style={{ fontFamily:'DM Mono,monospace', fontWeight:'700', fontSize:'12px', color:'var(--odoo-purple)', background:'#EDE0EA', padding:'3px 8px', borderRadius:'4px' }}>
                      {eg}
                    </span>
                  </td>
                  <td>
                    <span style={{ padding:'3px 8px', borderRadius:'8px', fontSize:'10px', fontWeight:'700',
                      background:s.status==='Active'?'#E8F5E9':'#F5F5F5', color:s.status==='Active'?'#2E7D32':'#757575' }}>
                      ● {s.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-act-edit" onClick={() => handleEdit(s)}></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
