import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { JOB_CARDS, JOB_STEPS, PRIORITY_COLORS } from './_ppConfig'

export default function JobCardList() {
  const nav = useNavigate()
  const [search,   setSearch]   = useState('')
  const [statusF,  setStatusF]  = useState('All')
  const [priorityF,setPriorityF]= useState('All')

  const filtered = JOB_CARDS.filter(j=>{
    const matchS = statusF==='All'||j.status===statusF
    const matchP = priorityF==='All'||j.priority===priorityF
    const matchQ = !search||j.id.toLowerCase().includes(search.toLowerCase())||
                   j.customerName.toLowerCase().includes(search.toLowerCase())||
                   j.item.toLowerCase().includes(search.toLowerCase())||
                   j.dcNo.toLowerCase().includes(search.toLowerCase())
    return matchS&&matchP&&matchQ
  })

  const STATUS_COUNTS = ['Pending','In Progress','Completed','On Hold'].map(s=>({
    s, c:JOB_CARDS.filter(j=>j.status===s).length
  }))

  const getStepCount = j => JOB_STEPS[j.id]?.length || 8
  const progressPct  = j => Math.round(((j.currentStep-1)/getStepCount(j))*100)

  const statusColor = s => ({
    'In Progress':'var(--odoo-blue)','Completed':'var(--odoo-green)',
    'Pending':'var(--odoo-orange)','On Hold':'var(--odoo-red)'
  }[s]||'var(--odoo-gray)')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Job Cards <small>{JOB_CARDS.length} total · {JOB_CARDS.filter(j=>j.status==='In Progress').length} active</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" style={{width:'180px'}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Job ID / Customer / Item…" />
          <select className="sd-select" value={statusF} onChange={e=>setStatusF(e.target.value)}>
            <option>All</option>{['Pending','In Progress','Completed','On Hold'].map(s=><option key={s}>{s}</option>)}
          </select>
          <select className="sd-select" value={priorityF} onChange={e=>setPriorityF(e.target.value)}>
            <option>All</option>{['High','Normal','Low'].map(p=><option key={p}>{p}</option>)}
          </select>
          <button className="btn btn-p btn-s" onClick={()=>nav('/pp/job-card/new')}>+ New Job Card</button>
        </div>
      </div>

      {/* Status KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'14px'}}>
        {STATUS_COUNTS.map(({s,c})=>(
          <div key={s} className="crm-kpi-card" style={{borderLeftColor:statusColor(s),cursor:'pointer'}}
               onClick={()=>setStatusF(statusF===s?'All':s)}>
            <div className="crm-kpi-val" style={{color:statusColor(s)}}>{c}</div>
            <div className="crm-kpi-lbl">{s}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead>
            <tr>
              <th>Job ID</th><th>Customer</th><th>DC No.</th><th>Item</th>
              <th>Qty</th><th>Priority</th><th>Current Step</th><th>Progress</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(j=>{
              const pct   = progressPct(j)
              return (
                <tr key={j.id}>
                  <td><strong style={{color:'var(--odoo-purple)',fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{j.id}</strong></td>
                  <td>
                    <div style={{fontSize:'12px',fontWeight:'600'}}>{j.customerName}</div>
                    <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{j.date}</div>
                  </td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{j.dcNo}</td>
                  <td style={{fontSize:'12px'}}>{j.item}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700'}}>{j.qty} {j.unit}</td>
                  <td><span className={PRIORITY_COLORS[j.priority]||'crm-badge-new'}>{j.priority}</span></td>
                  <td>
                    <div style={{fontSize:'11px',fontWeight:'600',color:j.status==='Completed'?'var(--odoo-green)':'var(--odoo-blue)'}}>{JOB_STEPS[j.id]?.[j.currentStep-1]?.step||'—'}</div>
                    <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{j.currentStep}/{getStepCount(j)} steps</div>
                  </td>
                  <td style={{minWidth:'120px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',marginBottom:'3px'}}>
                      <span style={{color:'var(--odoo-gray)'}}>{pct}%</span>
                    </div>
                    <div style={{background:'#F0EEEB',borderRadius:'3px',height:'5px'}}>
                      <div style={{width:`${pct}%`,height:'100%',borderRadius:'3px',
                        background:j.status==='Completed'?'var(--odoo-green)':'var(--odoo-purple)',transition:'width .3s'}}></div>
                    </div>
                  </td>
                  <td>
                    <span style={{padding:'3px 8px',borderRadius:'10px',fontSize:'10px',fontWeight:'700',
                      background:statusColor(j.status)+'22',color:statusColor(j.status)}}>{j.status}</span>
                  </td>
                  <td>
                    <div style={{display:'flex',gap:'4px'}}>
                      <button className="btn-act-view" onClick={()=>nav(`/pp/job-tracker?id=${j.id}`)}>🔍</button>
                  <button className="btn-xs" onClick={()=>nav('/print/labourcard')}>Print</button>
                      <button className="btn-act-edit" onClick={()=>nav(`/pp/process-execution?id=${j.id}`)}>⚙️</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length===0&&<div style={{textAlign:'center',padding:'40px',color:'var(--odoo-gray)'}}>No job cards found for the selected filters.</div>}
    </div>
  )
}
