import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CUSTOMERS, fmt } from './_crmData'

export default function CustomerMaster() {
  const nav = useNavigate()
  const [status, setStatus] = useState('All')
  const [industry, setIndustry] = useState('All')
  const [search, setSearch] = useState('')

  const industries = ['All',...new Set(CUSTOMERS.map(c=>c.industry))]
  const filtered = CUSTOMERS.filter(c=>
    (status==='All'||c.status===status)&&
    (industry==='All'||c.industry===industry)&&
    (!search||c.name.toLowerCase().includes(search.toLowerCase())||c.contact.toLowerCase().includes(search.toLowerCase()))
  )

  const totalRevenue = CUSTOMERS.reduce((s,c)=>s+c.annualValue,0)
  const activeCount  = CUSTOMERS.filter(c=>c.status==='Active').length
  const topCustomer  = [...CUSTOMERS].sort((a,b)=>b.annualValue-a.annualValue)[0]

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Customer Master <small>{filtered.length} customers</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p btn-s">+ New Customer</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'14px'}}>
        {[
          {l:'Total Customers', v:CUSTOMERS.length,  clr:'var(--odoo-purple)',ic:'👥'},
          {l:'Active',          v:activeCount,        clr:'var(--odoo-green)', ic:'✅'},
          {l:'Annual Revenue',  v:fmt(totalRevenue),  clr:'var(--odoo-orange)',ic:'💰'},
          {l:'Top Customer',    v:topCustomer.name.split(' ').slice(0,2).join(' '), clr:'var(--odoo-blue)',ic:'🏆'},
        ].map(k=>(
          <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.clr}}>
            <div className="crm-kpi-icon">{k.ic}</div>
            <div className="crm-kpi-val" style={{color:k.clr,fontSize:'16px'}}>{k.v}</div>
            <div className="crm-kpi-lbl">{k.l}</div>
          </div>
        ))}
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
        <input className="sd-search" placeholder="🔍 Search customer or contact…" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="sd-select" value={industry} onChange={e=>setIndustry(e.target.value)}>
          {industries.map(i=><option key={i}>{i}</option>)}
        </select>
      </div>

      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead>
            <tr><th>Cust ID</th><th>Company</th><th>Industry</th><th>Location</th><th>Contact</th><th>Phone</th><th>Annual Value</th><th>Customer Since</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map(c=>(
              <tr key={c.id} className="sd-tr-hover" onClick={()=>nav(`/crm/customers/${c.id}`)}>
                <td><span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-purple)'}}>{c.id}</span></td>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'var(--odoo-purple)',
                      display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',
                      fontSize:'12px',fontWeight:'700',flexShrink:0}}>
                      {c.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
                    </div>
                    <strong style={{fontSize:'12px'}}>{c.name}</strong>
                  </div>
                </td>
                <td style={{fontSize:'12px'}}>{c.industry}</td>
                <td style={{fontSize:'12px'}}>{c.city}, {c.state}</td>
                <td style={{fontSize:'12px'}}>{c.contact}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{c.phone}</td>
                <td>
                  <span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-purple)',fontSize:'12px'}}>{fmt(c.annualValue)}</span>
                  <div style={{background:'#F0EEEB',borderRadius:'2px',height:'4px',marginTop:'3px'}}>
                    <div style={{width:`${c.annualValue/totalRevenue*100}%`,height:'100%',background:'var(--odoo-purple)',borderRadius:'2px'}}></div>
                  </div>
                </td>
                <td style={{fontSize:'12px'}}>Since {c.since}</td>
                <td><span className={c.status==='Active'?'crm-stage-won':'crm-badge-notq'}>{c.status}</span></td>
                <td onClick={e=>e.stopPropagation()}><button className="btn-act-edit" onClick={()=>nav(`/crm/customers/${c.id}`)}>View</button></td>
              </tr>
            ))}
            {filtered.length===0&&<tr><td colSpan={10} style={{textAlign:'center',padding:'32px',color:'var(--odoo-gray)'}}>No customers found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
