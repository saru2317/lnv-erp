import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LEADS, LEAD_SOURCES, LEAD_STATUSES, LEAD_STATUS_COLORS } from './_crmData'

export default function LeadList() {
  const nav = useNavigate()
  const [status,   setStatus]   = useState('All')
  const [source,   setSource]   = useState('All')
  const [owner,    setOwner]    = useState('All')
  const [search,   setSearch]   = useState('')
  const [view,     setView]     = useState('table') // table | kanban

  const owners = ['All',...new Set(LEADS.map(l=>l.owner))]

  const filtered = LEADS.filter(l =>
    (status==='All'||l.status===status) &&
    (source==='All'||l.source===source) &&
    (owner==='All'||l.owner===owner) &&
    (!search||l.company.toLowerCase().includes(search.toLowerCase())||
              l.contact.toLowerCase().includes(search.toLowerCase()))
  )

  const countByStatus = s => LEADS.filter(l=>l.status===s).length

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Lead Management <small>{filtered.length} leads</small></div>
        <div className="fi-lv-actions">
          <button className={`btn btn-s ${view==='table'?'btn-p':'sd-bsm'}`} onClick={()=>setView('table')}>Table</button>
          <button className={`btn btn-s ${view==='kanban'?'btn-p':'sd-bsm'}`} onClick={()=>setView('kanban')}>⬜ Kanban</button>
          <button className="btn btn-p btn-s" onClick={()=>nav('/crm/leads/new')}>+ New Lead</button>
        </div>
      </div>

      {/* Status summary pills */}
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'14px'}}>
        {['All',...LEAD_STATUSES].map(s=>(
          <button key={s} onClick={()=>setStatus(s)}
            style={{padding:'4px 12px',borderRadius:'20px',border:'1px solid var(--odoo-border)',
              background:status===s?'var(--odoo-purple)':'#fff',
              color:status===s?'#fff':'var(--odoo-text)',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>
            {s} {s!=='All'&&<span style={{opacity:.7}}>({countByStatus(s)})</span>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="sd-filter-bar">
        <input className="sd-search" placeholder="🔍 Search company or contact…" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="sd-select" value={source} onChange={e=>setSource(e.target.value)}>
          <option>All</option>
          {LEAD_SOURCES.map(s=><option key={s}>{s}</option>)}
        </select>
        <select className="sd-select" value={owner} onChange={e=>setOwner(e.target.value)}>
          {owners.map(o=><option key={o}>{o}</option>)}
        </select>
      </div>

      {view === 'table' ? (
        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead>
              <tr>
                <th>Lead ID</th><th>Company</th><th>Contact</th><th>Industry</th>
                <th>Source</th><th>Status</th><th>Owner</th><th>Value</th><th>Next Follow-up</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l=>(
                <tr key={l.id} className="sd-tr-hover" onClick={()=>nav(`/crm/leads/${l.id}`)}>
                  <td><span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-purple)'}}>{l.id}</span></td>
                  <td><strong>{l.company}</strong></td>
                  <td>{l.contact}<br/><span style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{l.phone}</span></td>
                  <td>{l.industry}</td>
                  <td>{l.source}</td>
                  <td><span className={`crm-badge ${LEAD_STATUS_COLORS[l.status]||'crm-badge-new'}`}>{l.status}</span></td>
                  <td>{l.owner}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:'700'}}>
                    {l.value>0?`₹${(l.value/100000).toFixed(1)}L`:'—'}
                  </td>
                  <td style={{color:l.nextFollowup?'var(--odoo-orange)':'var(--odoo-gray)',fontSize:'12px'}}>
                    {l.nextFollowup||'—'}
                  </td>
                  <td onClick={e=>e.stopPropagation()}>
                    <button className="btn-act-edit" onClick={()=>nav(`/crm/leads/${l.id}`)}>View</button>
                    {l.status==='Qualified'&&<button className="btn-act-view" onClick={e=>{e.stopPropagation();nav('/crm/opportunities/new')}}>Convert</button>}
                  </td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={10} style={{textAlign:'center',padding:'32px',color:'var(--odoo-gray)'}}>No leads found</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban view */
        <div style={{display:'flex',gap:'12px',overflowX:'auto',paddingBottom:'8px'}}>
          {LEAD_STATUSES.map(s=>{
            const items = filtered.filter(l=>l.status===s)
            return (
              <div key={s} style={{flex:'0 0 220px',background:'#F8F9FA',borderRadius:'8px',padding:'10px'}}>
                <div style={{fontWeight:'700',fontSize:'12px',marginBottom:'10px',color:'var(--odoo-purple)'}}>
                  {s} <span style={{background:'var(--odoo-purple)',color:'#fff',borderRadius:'10px',padding:'1px 7px',marginLeft:'4px',fontSize:'11px'}}>{items.length}</span>
                </div>
                {items.map(l=>(
                  <div key={l.id} className="crm-kanban-card" onClick={()=>nav(`/crm/leads/${l.id}`)}>
                    <div style={{fontWeight:'700',fontSize:'12px',marginBottom:'3px'}}>{l.company}</div>
                    <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginBottom:'4px'}}>{l.contact} · {l.source}</div>
                    {l.value>0&&<div style={{fontFamily:'DM Mono,monospace',fontSize:'11px',fontWeight:'700',color:'var(--odoo-purple)'}}>₹{(l.value/100000).toFixed(1)}L</div>}
                  </div>
                ))}
                {items.length===0&&<div style={{fontSize:'11px',color:'var(--odoo-gray)',textAlign:'center',padding:'16px 0'}}>No leads</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
