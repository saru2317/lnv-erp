import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QUOTATIONS, QT_STATUS_COLORS, fmtFull, fmt } from './_crmData'

export default function QuotationList() {
  const nav = useNavigate()
  const [status, setStatus] = useState('All')
  const [owner,  setOwner]  = useState('All')
  const [search, setSearch] = useState('')

  const owners = ['All',...new Set(QUOTATIONS.map(q=>q.owner))]
  const statuses = ['All','Draft','Sent','Negotiation','Won','Lost','Expired']

  const filtered = QUOTATIONS.filter(q=>
    (status==='All'||q.status===status)&&
    (owner==='All'||q.owner===owner)&&
    (!search||q.company.toLowerCase().includes(search.toLowerCase())||q.id.toLowerCase().includes(search.toLowerCase()))
  )

  const countByStatus = s => QUOTATIONS.filter(q=>q.status===s).length
  const totalSent   = QUOTATIONS.filter(q=>q.status==='Sent'||q.status==='Negotiation').reduce((s,q)=>s+q.finalAmount,0)
  const totalWon    = QUOTATIONS.filter(q=>q.status==='Won').reduce((s,q)=>s+q.finalAmount,0)
  const winRate     = Math.round(QUOTATIONS.filter(q=>q.status==='Won').length / QUOTATIONS.filter(q=>q.status!=='Draft').length * 100) || 0

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Quotations <small>{filtered.length} records</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s" onClick={()=>nav('/crm/quotations/new')}>+ New Quotation</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'14px'}}>
        {[
          {l:'Total Quotations',  v:QUOTATIONS.length,  clr:'var(--odoo-purple)',ic:'📄'},
          {l:'Pending Value',     v:fmt(totalSent),      clr:'var(--odoo-orange)',ic:'⏳'},
          {l:'Won Value',         v:fmt(totalWon),       clr:'var(--odoo-green)', ic:'🏆'},
          {l:'Conversion Rate',   v:winRate+'%',         clr:'var(--odoo-blue)',  ic:'📊'},
        ].map(k=>(
          <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.clr}}>
            <div className="crm-kpi-icon">{k.ic}</div>
            <div className="crm-kpi-val" style={{color:k.clr}}>{k.v}</div>
            <div className="crm-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'14px'}}>
        {statuses.map(s=>(
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
        <input className="sd-search" placeholder="🔍 Search company or quotation ID…" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="sd-select" value={owner} onChange={e=>setOwner(e.target.value)}>
          {owners.map(o=><option key={o}>{o}</option>)}
        </select>
      </div>

      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead>
            <tr><th>Quotation No.</th><th>Date</th><th>Company</th><th>Product</th><th>Gross</th><th>Discount</th><th>Net Amount</th><th>Validity</th><th>Status</th><th>Owner</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(q=>(
              <tr key={q.id} className="sd-tr-hover" onClick={()=>nav(`/crm/quotations/${q.id}`)}>
                <td><span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-purple)'}}>{q.id}</span></td>
                <td style={{fontSize:'12px'}}>{q.date}</td>
                <td><strong style={{fontSize:'12px'}}>{q.company}</strong></td>
                <td style={{fontSize:'12px'}}>{q.product}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{fmtFull(q.amount)}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:q.discount>0?'var(--odoo-orange)':'var(--odoo-gray)'}}>{q.discount}%</td>
                <td style={{fontFamily:'DM Mono,monospace',fontWeight:'700',fontSize:'12px',color:'var(--odoo-purple)'}}>{fmtFull(q.finalAmount)}</td>
                <td style={{fontSize:'12px',color:q.status==='Expired'?'var(--odoo-red)':'var(--odoo-text)'}}>{q.validity}</td>
                <td><span className={`crm-badge ${QT_STATUS_COLORS[q.status]||'crm-badge-new'}`}>{q.status}</span></td>
                <td style={{fontSize:'12px'}}>{q.owner}</td>
                <td onClick={e=>e.stopPropagation()}>
                  <button className="btn-act-edit" onClick={()=>nav(`/crm/quotations/${q.id}`)}>View</button>
                  <button className="btn-xs" onClick={() => nav('/print/quotation')}>Print</button>
                  {(q.status==='Won')&&<button className="btn-act-view" onClick={e=>{e.stopPropagation()}}>→ SO</button>}
                </td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={11} style={{textAlign:'center',padding:'32px',color:'var(--odoo-gray)'}}>No quotations found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
