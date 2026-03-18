import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACTIVITIES, ACTIVITY_TYPES, ACT_TYPE_COLORS, SALESREPS } from './_crmData'

const TODAY = '2025-03-04'

export default function ActivityLog() {
  const nav = useNavigate()
  const [type,   setType]   = useState('All')
  const [owner,  setOwner]  = useState('All')
  const [status, setStatus] = useState('All')
  const [tab,    setTab]    = useState('all') // all | today | pending
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({type:'Call',company:'',contact:'',notes:'',followup:'',owner:SALESREPS[0].name})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const owners = ['All',...SALESREPS.map(r=>r.name)]

  let filtered = ACTIVITIES.filter(a=>
    (type==='All'||a.type===type)&&
    (owner==='All'||a.owner===owner)&&
    (status==='All'||a.status===status)
  )
  if(tab==='today')   filtered = filtered.filter(a=>a.nextFollowup===TODAY)
  if(tab==='pending') filtered = filtered.filter(a=>a.status==='Pending')

  const todayCount   = ACTIVITIES.filter(a=>a.nextFollowup===TODAY&&a.status==='Pending').length
  const pendingCount = ACTIVITIES.filter(a=>a.status==='Pending').length

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Activity Log <small>Sales activity tracker</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={()=>setShowForm(true)}>+ Log Activity</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'14px'}}>
        {[
          {l:'Total Activities',v:ACTIVITIES.length,     clr:'var(--odoo-purple)',ic:'📋'},
          {l:'Today Follow-ups',v:todayCount,             clr:'var(--odoo-orange)',ic:'📅'},
          {l:'Pending',         v:pendingCount,           clr:'var(--odoo-red)',   ic:'⏳'},
          {l:'Calls This Week', v:ACTIVITIES.filter(a=>a.type==='Call').length, clr:'var(--odoo-blue)',ic:'📞'},
          {l:'Meetings',        v:ACTIVITIES.filter(a=>a.type==='Meeting').length,clr:'var(--odoo-green)',ic:'🤝'},
        ].map(k=>(
          <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.clr}}>
            <div className="crm-kpi-icon">{k.ic}</div>
            <div className="crm-kpi-val" style={{color:k.clr}}>{k.v}</div>
            <div className="crm-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
        {[{k:'all',l:'All Activities'},{k:'today',l:`Today's Follow-ups (${todayCount})`},{k:'pending',l:`Pending (${pendingCount})`}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            style={{padding:'5px 14px',borderRadius:'20px',border:'1px solid var(--odoo-border)',
              background:tab===t.k?'var(--odoo-purple)':'#fff',
              color:tab===t.k?'#fff':'var(--odoo-text)',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="sd-filter-bar">
        <select className="sd-select" value={type} onChange={e=>setType(e.target.value)}>
          <option>All</option>
          {ACTIVITY_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <select className="sd-select" value={owner} onChange={e=>setOwner(e.target.value)}>
          {owners.map(o=><option key={o}>{o}</option>)}
        </select>
        <select className="sd-select" value={status} onChange={e=>setStatus(e.target.value)}>
          <option>All</option><option>Pending</option><option>Completed</option>
        </select>
      </div>

      {/* Log Form */}
      {showForm&&(
        <div className="fi-panel" style={{marginBottom:'14px',border:'2px solid var(--odoo-purple)'}}>
          <div className="fi-panel-hdr"><h3>📝 Log New Activity</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field">
                <label>Activity Type</label>
                <select value={form.type} onChange={e=>set('type',e.target.value)}>
                  {ACTIVITY_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="sd-field">
                <label>Company</label>
                <input value={form.company} onChange={e=>set('company',e.target.value)} placeholder="Company name" />
              </div>
              <div className="sd-field">
                <label>Contact Person</label>
                <input value={form.contact} onChange={e=>set('contact',e.target.value)} placeholder="Contact name" />
              </div>
              <div className="sd-field">
                <label>Assigned To</label>
                <select value={form.owner} onChange={e=>set('owner',e.target.value)}>
                  {SALESREPS.map(r=><option key={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="sd-field">
                <label>Next Follow-up Date</label>
                <input type="date" value={form.followup} onChange={e=>set('followup',e.target.value)} />
              </div>
            </div>
            <div className="sd-field" style={{marginTop:'10px'}}>
              <label>Notes / Summary</label>
              <textarea rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)}
                placeholder="What was discussed? Any commitments made?" style={{width:'100%'}} />
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
              <button className="btn btn-p btn-s" onClick={()=>setShowForm(false)}>✓ Save Activity</button>
              <button className="btn btn-s sd-bsm" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead>
            <tr><th>ID</th><th>Date</th><th>Type</th><th>Company</th><th>Contact</th><th>Owner</th><th>Notes</th><th>Follow-up</th><th>Status</th></tr>
          </thead>
          <tbody>
            {filtered.map(a=>(
              <tr key={a.id} className="sd-tr-hover">
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)',fontWeight:'700'}}>{a.id}</td>
                <td style={{fontSize:'12px'}}>{a.date}</td>
                <td><span className={`crm-act-badge crm-act-${a.type.toLowerCase().replace(/ \//g,'').replace(' ','-')}`}>{a.type}</span></td>
                <td><strong style={{fontSize:'12px'}}>{a.company}</strong></td>
                <td style={{fontSize:'12px'}}>{a.contact}</td>
                <td style={{fontSize:'12px'}}>{a.owner}</td>
                <td style={{fontSize:'12px',maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={a.notes}>{a.notes}</td>
                <td style={{fontSize:'12px',color:a.nextFollowup===TODAY?'var(--odoo-orange)':'var(--odoo-text)',fontWeight:a.nextFollowup===TODAY?'700':'400'}}>
                  {a.nextFollowup||'—'}{a.nextFollowup===TODAY&&' 🔔'}
                </td>
                <td><span className={a.status==='Completed'?'crm-stage-won':'crm-badge-contacted'}>{a.status}</span></td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={9} style={{textAlign:'center',padding:'32px',color:'var(--odoo-gray)'}}>No activities found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
