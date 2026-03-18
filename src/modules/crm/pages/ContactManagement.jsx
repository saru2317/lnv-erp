import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CONTACTS } from './_crmData'

export default function ContactManagement() {
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({name:'',company:'',designation:'',phone:'',email:''})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const filtered = CONTACTS.filter(c=>
    (status==='All'||c.status===status)&&
    (!search||c.name.toLowerCase().includes(search.toLowerCase())||c.company.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Contact Management <small>{filtered.length} contacts</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={()=>setShowForm(true)}>+ New Contact</button>
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
        {['All','Active','Inactive'].map(s=>(
          <button key={s} onClick={()=>setStatus(s)}
            style={{padding:'4px 14px',borderRadius:'20px',border:'1px solid var(--odoo-border)',
              background:status===s?'var(--odoo-purple)':'#fff',
              color:status===s?'#fff':'var(--odoo-text)',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>
            {s}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="sd-filter-bar">
        <input className="sd-search" placeholder="🔍 Search contact or company…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {showForm&&(
        <div className="fi-panel" style={{marginBottom:'14px',border:'2px solid var(--odoo-purple)'}}>
          <div className="fi-panel-hdr"><h3>Add New Contact</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field"><label>Full Name</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Contact name" /></div>
              <div className="sd-field"><label>Company</label><input value={form.company} onChange={e=>set('company',e.target.value)} placeholder="Company name" /></div>
              <div className="sd-field"><label>Designation</label><input value={form.designation} onChange={e=>set('designation',e.target.value)} placeholder="e.g. Purchase Manager" /></div>
              <div className="sd-field"><label>Phone</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="Mobile number" /></div>
              <div className="sd-field"><label>Email</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="email@company.com" /></div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
              <button className="btn btn-p btn-s" onClick={()=>setShowForm(false)}>Save Contact</button>
              <button className="btn btn-s sd-bsm" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'12px'}}>
        {filtered.map(c=>(
          <div key={c.id} style={{background:'#fff',borderRadius:'10px',padding:'14px',
            boxShadow:'0 1px 4px rgba(0,0,0,.08)',border:'1px solid var(--odoo-border)',cursor:'pointer',
            transition:'box-shadow .15s'}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(113,75,103,.15)'}
            onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.08)'}
            onClick={()=>nav(`/crm/customers`)}>
            <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'10px'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'var(--odoo-purple)',
                display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'14px',fontWeight:'700',flexShrink:0}}>
                {c.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
              </div>
              <div>
                <div style={{fontWeight:'700',fontSize:'13px'}}>{c.name}</div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{c.designation}</div>
              </div>
              <span className={c.status==='Active'?'crm-stage-won':'crm-badge-notq'} style={{marginLeft:'auto',fontSize:'10px'}}>{c.status}</span>
            </div>
            <div style={{fontSize:'12px',color:'var(--odoo-gray)',marginBottom:'6px'}}>🏢 {c.company}</div>
            <div style={{display:'flex',gap:'12px',fontSize:'12px'}}>
              <span>📞 {c.phone}</span>
            </div>
            <div style={{fontSize:'12px',color:'var(--odoo-gray)',marginTop:'4px'}}>📧 {c.email}</div>
            <div style={{marginTop:'8px',paddingTop:'8px',borderTop:'1px solid var(--odoo-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'11px',color:'var(--odoo-gray)'}}>Last contact: {c.lastContact}</span>
              <div style={{display:'flex',gap:'6px'}}>
                <button className="btn-act-edit" onClick={e=>e.stopPropagation()}>✏️</button>
                <button className="btn-act-view" onClick={e=>{e.stopPropagation();nav('/crm/activities')}}>📞</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:'40px',color:'var(--odoo-gray)'}}>No contacts found</div>}
      </div>
    </div>
  )
}
