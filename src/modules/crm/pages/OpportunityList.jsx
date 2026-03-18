import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OPPORTUNITIES, OPP_STAGES, OPP_STAGE_COLORS, fmt, fmtFull } from './_crmData'

const STAGE_COLORS_HEX = {
  'Requirement Understanding':'#1A73E8','Solution Discussion':'#714B67',
  'Demo / Presentation':'#B7950B','Proposal Submitted':'#E06F39',
  'Negotiation':'#C0392B','Decision Pending':'#7F8C8D','Won':'#00A09D','Lost':'#D9534F'
}

export default function OpportunityList() {
  const nav = useNavigate()
  const [view,   setView]   = useState('kanban')
  const [owner,  setOwner]  = useState('All')
  const [search, setSearch] = useState('')

  const owners = ['All',...new Set(OPPORTUNITIES.map(o=>o.owner))]

  const filtered = OPPORTUNITIES.filter(o=>
    (owner==='All'||o.owner===owner)&&
    (!search||o.company.toLowerCase().includes(search.toLowerCase())||o.product.toLowerCase().includes(search.toLowerCase()))
  )

  const stageOpps = stage => filtered.filter(o=>o.stage===stage)
  const stageVal  = stage => stageOpps(stage).reduce((s,o)=>s+o.value,0)
  const totalPipeline = filtered.filter(o=>o.stage!=='Won'&&o.stage!=='Lost').reduce((s,o)=>s+o.value,0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Opportunities <small>{filtered.length} total · Pipeline {fmt(totalPipeline)}</small></div>
        <div className="fi-lv-actions">
          <button className={`btn btn-s ${view==='kanban'?'btn-p':'sd-bsm'}`} onClick={()=>setView('kanban')}>⬜ Kanban</button>
          <button className={`btn btn-s ${view==='list'?'btn-p':'sd-bsm'}`} onClick={()=>setView('list')}>List</button>
          <button className="btn btn-p btn-s" onClick={()=>nav('/crm/opportunities/new')}>+ New Opportunity</button>
        </div>
      </div>

      {/* Filters */}
      <div className="sd-filter-bar">
        <input className="sd-search" placeholder="🔍 Search opportunities…" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="sd-select" value={owner} onChange={e=>setOwner(e.target.value)}>
          {owners.map(o=><option key={o}>{o}</option>)}
        </select>
      </div>

      {view === 'kanban' ? (
        <div style={{overflowX:'auto',paddingBottom:'8px'}}>
          <div style={{display:'flex',gap:'10px',minWidth:'max-content'}}>
            {OPP_STAGES.map(stage=>{
              const opps = stageOpps(stage)
              const val  = stageVal(stage)
              const clr  = STAGE_COLORS_HEX[stage]
              return (
                <div key={stage} style={{width:'220px',background:'#F8F9FA',borderRadius:'8px',padding:'10px',flexShrink:0}}>
                  <div style={{borderTop:`3px solid ${clr}`,paddingTop:'8px',marginBottom:'10px'}}>
                    <div style={{fontWeight:'700',fontSize:'11px',color:clr,textTransform:'uppercase',marginBottom:'2px'}}>{stage}</div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:'var(--odoo-gray)'}}>
                      <span>{opps.length} opp{opps.length!==1?'s':''}</span>
                      <strong style={{color:clr}}>{val>0?fmt(val):'—'}</strong>
                    </div>
                  </div>
                  {opps.map(o=>(
                    <div key={o.id} className="crm-kanban-card" onClick={()=>nav(`/crm/opportunities/${o.id}`)}>
                      <div style={{fontWeight:'700',fontSize:'12px',marginBottom:'3px'}}>{o.company}</div>
                      <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginBottom:'5px'}}>{o.product}</div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',fontSize:'12px',color:clr}}>{fmt(o.value)}</span>
                        <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                          <div style={{width:'32px',height:'4px',background:'#e0e0e0',borderRadius:'2px'}}>
                            <div style={{width:`${o.winProb}%`,height:'100%',borderRadius:'2px',background:o.winProb>=70?'var(--odoo-green)':o.winProb>=40?'var(--odoo-orange)':'var(--odoo-red)'}}></div>
                          </div>
                          <span style={{fontSize:'10px',fontWeight:'700'}}>{o.winProb}%</span>
                        </div>
                      </div>
                      <div style={{fontSize:'10px',color:'var(--odoo-gray)',marginTop:'4px'}}>👤 {o.owner} · 📅 {o.closeDate}</div>
                    </div>
                  ))}
                  {opps.length===0&&<div style={{fontSize:'11px',color:'var(--odoo-gray)',textAlign:'center',padding:'20px 0'}}>No opportunities</div>}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead>
              <tr>
                <th>Opp ID</th><th>Company</th><th>Product</th><th>Value</th>
                <th>Stage</th><th>Win %</th><th>Owner</th><th>Close Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o=>(
                <tr key={o.id} className="sd-tr-hover" onClick={()=>nav(`/crm/opportunities/${o.id}`)}>
                  <td><span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-purple)'}}>{o.id}</span></td>
                  <td><strong>{o.company}</strong><br/><span style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{o.contact}</span></td>
                  <td>{o.product}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:'700'}}>{fmt(o.value)}</td>
                  <td><span className={OPP_STAGE_COLORS[o.stage]||'crm-badge-new'} style={{fontSize:'10px'}}>{o.stage}</span></td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <div style={{width:'50px',height:'5px',background:'#e0e0e0',borderRadius:'2px'}}>
                        <div style={{width:`${o.winProb}%`,height:'100%',borderRadius:'2px',
                          background:o.winProb>=70?'var(--odoo-green)':o.winProb>=40?'var(--odoo-orange)':'var(--odoo-red)'}}></div>
                      </div>
                      <span style={{fontSize:'12px',fontWeight:'700'}}>{o.winProb}%</span>
                    </div>
                  </td>
                  <td>{o.owner}</td>
                  <td style={{color:'var(--odoo-orange)',fontSize:'12px'}}>{o.closeDate}</td>
                  <td onClick={e=>e.stopPropagation()}><button className="btn-act-edit" onClick={()=>nav(`/crm/opportunities/${o.id}`)}>View</button></td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={9} style={{textAlign:'center',padding:'32px',color:'var(--odoo-gray)'}}>No opportunities found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
