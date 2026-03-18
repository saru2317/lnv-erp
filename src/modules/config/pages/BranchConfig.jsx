import React, { useState } from 'react'
import { BRANCHES } from './_configData'

const BRANCH_TYPES = ['Manufacturing','Sales Office','Warehouse','Service Center','Head Office']

export default function BranchConfig() {
  const [branches, setBranches] = useState(BRANCHES)
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [form, setForm] = useState({ name:'', type:'Manufacturing', address:'', gstin:'', phone:'', head:'', status:'Active', isHQ:false })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.name || !form.type) { alert('Name and type required'); return }
    if (editId) {
      setBranches(bs => bs.map(b => b.id===editId ? {...b,...form} : b))
      setEditId(null)
    } else {
      const id = `BR-${String(branches.length+1).padStart(3,'0')}`
      setBranches(bs => [...bs, { id, ...form }])
    }
    setForm({ name:'', type:'Manufacturing', address:'', gstin:'', phone:'', head:'', status:'Active', isHQ:false })
    setShowForm(false)
  }

  const handleEdit = b => {
    setForm({ name:b.name, type:b.type, address:b.address, gstin:b.gstin, phone:b.phone, head:b.head, status:b.status, isHQ:b.isHQ })
    setEditId(b.id); setShowForm(true)
  }

  const typeColor = t => ({ Manufacturing:'#714B67', 'Sales Office':'#117A65', Warehouse:'#1A5276', 'Service Center':'#784212', 'Head Office':'#C0392B' }[t] || '#555')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Branches / Locations <small>{branches.filter(b=>b.status==='Active').length} active branches</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={()=>{setEditId(null);setShowForm(true)}}>+ New Branch</button>
        </div>
      </div>

      {showForm && (
        <div className="fi-panel" style={{ marginBottom:'16px', border:'2px solid var(--odoo-purple)' }}>
          <div className="fi-panel-hdr"><h3>{editId?'✏️ Edit':'➕ New'} Branch</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field"><label>Branch Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Ranipet Plant" /></div>
              <div className="sd-field">
                <label>Branch Type *</label>
                <select value={form.type} onChange={e=>set('type',e.target.value)}>
                  {BRANCH_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="sd-field" style={{gridColumn:'1/-1'}}><label>Address</label><input value={form.address} onChange={e=>set('address',e.target.value)} /></div>
              <div className="sd-field"><label>GSTIN</label><input value={form.gstin} onChange={e=>set('gstin',e.target.value)} style={{fontFamily:'DM Mono,monospace'}} /></div>
              <div className="sd-field"><label>Phone</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} /></div>
              <div className="sd-field"><label>Branch Head</label><input value={form.head} onChange={e=>set('head',e.target.value)} /></div>
              <div className="sd-field">
                <label>Status</label>
                <select value={form.status} onChange={e=>set('status',e.target.value)}><option>Active</option><option>Inactive</option></select>
              </div>
              <div className="sd-field" style={{display:'flex',alignItems:'center',gap:'8px',paddingTop:'20px'}}>
                <input type="checkbox" id="isHQ" checked={form.isHQ} onChange={e=>set('isHQ',e.target.checked)} style={{accentColor:'var(--odoo-purple)'}} />
                <label htmlFor="isHQ" style={{cursor:'pointer',fontWeight:'600',fontSize:'12px',marginBottom:0}}>Is Headquarters?</label>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
              <button className="btn btn-p btn-s" onClick={handleSave}>✓ {editId?'Update':'Save'}</button>
              <button className="btn btn-s sd-bsm" onClick={()=>{setShowForm(false);setEditId(null)}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'12px'}}>
        {branches.map(b => (
          <div key={b.id} style={{padding:'16px', background:'#fff', borderRadius:'10px',
            border:'1px solid var(--odoo-border)', borderLeft:`4px solid ${typeColor(b.type)}`,
            opacity: b.status==='Inactive' ? 0.65 : 1}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'10px'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'8px',background:typeColor(b.type),display:'flex',
                alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'18px',flexShrink:0}}>
                {b.type==='Manufacturing'?'🏭':b.type==='Sales Office'?'💼':b.type==='Warehouse'?'📦':'🏢'}
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <strong style={{fontSize:'13px'}}>{b.name}</strong>
                  {b.isHQ && <span style={{fontSize:'9px',fontWeight:'800',padding:'1px 5px',background:'#FFD700',color:'#000',borderRadius:'4px'}}>HQ</span>}
                </div>
                <span style={{fontSize:'10px',fontWeight:'700',padding:'1px 6px',borderRadius:'4px',
                  background:typeColor(b.type)+'22',color:typeColor(b.type)}}>{b.type}</span>
              </div>
              <span style={{fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'6px',
                background:b.status==='Active'?'#E8F5E9':'#F5F5F5', color:b.status==='Active'?'#2E7D32':'#757575'}}>
                ● {b.status}
              </span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',fontSize:'11px',color:'var(--odoo-gray)',marginBottom:'10px'}}>
              <div>📍 {b.address}</div>
              <div>👤 {b.head}</div>
              <div>📞 {b.phone}</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:'10px'}}>GST: {b.gstin}</div>
            </div>
            <div style={{display:'flex',gap:'6px'}}>
              <button className="btn-act-edit" onClick={()=>handleEdit(b)}>Edit</button>
              <button className="btn-act-view" onClick={()=>setBranches(bs=>bs.map(x=>x.id===b.id?{...x,status:x.status==='Active'?'Inactive':'Active'}:x))}>
                {b.status==='Active'?'🔒 Disable':'🔓 Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
