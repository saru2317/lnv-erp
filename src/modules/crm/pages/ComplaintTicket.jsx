import React, { useState } from 'react'
import { COMPLAINTS, CUSTOMERS, SALESREPS, TICKET_PRIORITY_COLORS, TICKET_STATUS_COLORS } from './_crmData'

export default function ComplaintTicket() {
  const [status,   setStatus]   = useState('All')
  const [priority, setPriority] = useState('All')
  const [search,   setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({company:'',contact:'',type:'Quality',priority:'Medium',subject:'',description:''})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const filtered = COMPLAINTS.filter(c=>
    (status==='All'||c.status===status)&&
    (priority==='All'||c.priority===priority)&&
    (!search||c.company.toLowerCase().includes(search.toLowerCase())||c.subject.toLowerCase().includes(search.toLowerCase()))
  )

  const openCount     = COMPLAINTS.filter(c=>c.status==='Open').length
  const inProgCount   = COMPLAINTS.filter(c=>c.status==='In Progress').length
  const resolvedCount = COMPLAINTS.filter(c=>c.status==='Resolved').length
  const highCount     = COMPLAINTS.filter(c=>c.priority==='High').length

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Complaints & Tickets <small>Post-sales support</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={()=>setShowForm(true)}>+ New Ticket</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'14px'}}>
        {[
          {l:'Open',       v:openCount,    clr:'var(--odoo-red)',   ic:'🔴'},
          {l:'In Progress',v:inProgCount,  clr:'var(--odoo-orange)',ic:'🟡'},
          {l:'Resolved',   v:resolvedCount,clr:'var(--odoo-green)', ic:'🟢'},
          {l:'High Priority',v:highCount,  clr:'var(--odoo-red)',   ic:'⚠️'},
        ].map(k=>(
          <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.clr}}>
            <div className="crm-kpi-icon">{k.ic}</div>
            <div className="crm-kpi-val" style={{color:k.clr}}>{k.v}</div>
            <div className="crm-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
        {['All','Open','In Progress','Resolved'].map(s=>(
          <button key={s} onClick={()=>setStatus(s)}
            style={{padding:'4px 12px',borderRadius:'20px',border:'1px solid var(--odoo-border)',
              background:status===s?'var(--odoo-purple)':'#fff',
              color:status===s?'#fff':'var(--odoo-text)',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>
            {s}
          </button>
        ))}
        {['All','High','Medium','Low'].filter(p=>p!=='All'||priority==='All').map(p=>(
          p!=='All'?<button key={p} onClick={()=>setPriority(priority===p?'All':p)}
            style={{padding:'4px 12px',borderRadius:'20px',border:'1px solid var(--odoo-border)',
              background:priority===p?'var(--odoo-red)':'#fff',
              color:priority===p?'#fff':'var(--odoo-text)',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>
            {p}
          </button>:null
        ))}
      </div>

      {/* Filter */}
      <div className="sd-filter-bar">
        <input className="sd-search" placeholder="🔍 Search company or subject…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {/* New Ticket Form */}
      {showForm&&(
        <div className="fi-panel" style={{marginBottom:'14px',border:'2px solid var(--odoo-orange)'}}>
          <div className="fi-panel-hdr"><h3>🎫 New Complaint Ticket</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field">
                <label>Company</label>
                <select value={form.company} onChange={e=>set('company',e.target.value)}>
                  <option value="">Select Customer</option>
                  {CUSTOMERS.map(c=><option key={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="sd-field">
                <label>Contact Person</label>
                <input value={form.contact} onChange={e=>set('contact',e.target.value)} placeholder="Contact name" />
              </div>
              <div className="sd-field">
                <label>Complaint Type</label>
                <select value={form.type} onChange={e=>set('type',e.target.value)}>
                  {['Quality','Delivery','Invoice','Technical','General'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="sd-field">
                <label>Priority</label>
                <select value={form.priority} onChange={e=>set('priority',e.target.value)}>
                  {['High','Medium','Low'].map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="sd-field" style={{gridColumn:'1/-1'}}>
                <label>Subject</label>
                <input value={form.subject} onChange={e=>set('subject',e.target.value)} placeholder="Brief description of the issue" />
              </div>
              <div className="sd-field" style={{gridColumn:'1/-1'}}>
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={e=>set('description',e.target.value)}
                  placeholder="Detailed complaint description…" style={{width:'100%'}} />
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
              <button className="btn btn-p btn-s" onClick={()=>setShowForm(false)}>✓ Create Ticket</button>
              <button className="btn btn-s sd-bsm" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead>
            <tr><th>Ticket ID</th><th>Date</th><th>Company</th><th>Type</th><th>Subject</th><th>Priority</th><th>Status</th><th>Owner</th><th>Resolved</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(t=>(
              <React.Fragment key={t.id}>
                <tr className="sd-tr-hover" onClick={()=>setExpanded(expanded===t.id?null:t.id)}>
                  <td><span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-purple)'}}>{t.id}</span></td>
                  <td style={{fontSize:'12px'}}>{t.date}</td>
                  <td><strong style={{fontSize:'12px'}}>{t.company}</strong><br/><span style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{t.contact}</span></td>
                  <td style={{fontSize:'12px'}}>{t.type}</td>
                  <td style={{fontSize:'12px',maxWidth:'180px'}}>{t.subject}</td>
                  <td><span className={`crm-badge ${TICKET_PRIORITY_COLORS[t.priority]||'crm-badge-new'}`}>{t.priority}</span></td>
                  <td><span className={`crm-badge ${TICKET_STATUS_COLORS[t.status]||'crm-badge-new'}`}>{t.status}</span></td>
                  <td style={{fontSize:'12px'}}>{t.owner}</td>
                  <td style={{fontSize:'12px',color:t.resolvedDate?'var(--odoo-green)':'var(--odoo-gray)'}}>{t.resolvedDate||'—'}</td>
                  <td onClick={e=>e.stopPropagation()}>
                    {t.status!=='Resolved'&&<button className="btn-act-view" onClick={()=>{}}>Resolve</button>}
                  </td>
                </tr>
                {expanded===t.id&&(
                  <tr style={{background:'#F8F9FA'}}>
                    <td colSpan={10} style={{padding:'12px 16px'}}>
                      <div style={{display:'flex',gap:'16px'}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:'700',fontSize:'12px',marginBottom:'4px'}}>Subject: {t.subject}</div>
                          <div style={{fontSize:'12px',color:'var(--odoo-gray)'}}>No additional notes available.</div>
                        </div>
                        <div style={{display:'flex',gap:'8px'}}>
                          <button className="btn btn-s sd-bsm">📝 Add Note</button>
                          {t.status!=='Resolved'&&<button className="btn btn-p btn-s" style={{background:'var(--odoo-green)'}}>✓ Mark Resolved</button>}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filtered.length===0&&<tr><td colSpan={10} style={{textAlign:'center',padding:'32px',color:'var(--odoo-gray)'}}>No tickets found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
