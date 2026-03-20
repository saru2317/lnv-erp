import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LEADS, OPPORTUNITIES, QUOTATIONS, ACTIVITIES, SALESREPS, fmt, fmtFull } from './_crmData'

const TODAY = '2025-03-04'

const PIPELINE_STAGES = [
  {stage:'Requirement Understanding', color:'var(--odoo-blue)'},
  {stage:'Solution Discussion',       color:'var(--odoo-purple)'},
  {stage:'Demo / Presentation',       color:'#B7950B'},
  {stage:'Proposal Submitted',        color:'var(--odoo-orange)'},
  {stage:'Negotiation',               color:'#C0392B'},
  {stage:'Decision Pending',          color:'var(--odoo-gray)'},
]

export default function CRMDashboard() {
  const nav = useNavigate()
  const [role, setRole] = useState('manager')

  const activeOpps   = OPPORTUNITIES.filter(o => o.stage !== 'Won' && o.stage !== 'Lost')
  const wonOpps      = OPPORTUNITIES.filter(o => o.stage === 'Won')
  const pipelineVal  = activeOpps.reduce((s,o) => s + o.value, 0)
  const wonVal       = wonOpps.reduce((s,o) => s + o.value, 0)
  const newLeads     = LEADS.filter(l => l.status === 'New Lead').length
  const qualLeads    = LEADS.filter(l => l.status === 'Qualified').length
  const todayActs    = ACTIVITIES.filter(a => a.nextFollowup === TODAY && a.status === 'Pending')
  const sentQuotes   = QUOTATIONS.filter(q => q.status === 'Sent' || q.status === 'Negotiation').length

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">CRM Dashboard <small>Sales Intelligence & Pipeline Overview</small></div>
        <div className="fi-lv-actions">
          <select className="crm-role-toggle" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="salesperson"> Salesperson View</option>
            <option value="manager"> Manager View</option>
            <option value="ceo"> CEO View</option>
          </select>
          <button className="btn btn-p btn-s" onClick={()=>nav('/crm/leads/new')}>+ New Lead</button>
        </div>
      </div>

      {/* Today's Follow-up Alert */}
      {todayActs.length > 0 && (
        <div className="pp-alert warn" style={{cursor:'pointer'}} onClick={()=>nav('/crm/activities')}>
           <strong>{todayActs.length} follow-up{todayActs.length>1?'s':''} pending today</strong>
          {' — '}{todayActs.map(a=>a.company).join(', ')}
          <span style={{float:'right',fontWeight:'700'}}>View All →</span>
        </div>
      )}

      {/* KPI Cards */}
      {role === 'salesperson' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'18px'}}>
          {[
            {l:'My Leads',       v:LEADS.filter(l=>l.owner==='Vijay A.').length, clr:'var(--odoo-purple)',ic:'',path:'/crm/leads'},
            {l:'My Opportunities',v:activeOpps.filter(o=>o.owner==='Vijay A.').length,clr:'var(--odoo-orange)',ic:'',path:'/crm/opportunities'},
            {l:"Today's Followups",v:todayActs.filter(a=>a.owner==='Vijay A.').length,clr:'var(--odoo-red)',ic:'',path:'/crm/activities'},
            {l:'Pending Quotes',  v:sentQuotes,                                  clr:'var(--odoo-blue)',ic:'',path:'/crm/quotations'},
            {l:'Monthly Sales',   v:'₹42 L',                                     clr:'var(--odoo-green)',ic:'',path:'/crm/reports'},
          ].map(k=>(
            <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.clr}} onClick={()=>nav(k.path)}>
              <div className="crm-kpi-icon">{k.ic}</div>
              <div className="crm-kpi-val" style={{color:k.clr}}>{typeof k.v==='number'?k.v:k.v}</div>
              <div className="crm-kpi-lbl">{k.l}</div>
            </div>
          ))}
        </div>
      )}

      {role === 'manager' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'18px'}}>
          {[
            {l:'Total Leads',      v:LEADS.length,    clr:'var(--odoo-purple)', ic:'', path:'/crm/leads'},
            {l:'Active Pipeline',  v:activeOpps.length,clr:'var(--odoo-orange)',ic:'', path:'/crm/opportunities'},
            {l:'Pipeline Value',   v:fmt(pipelineVal), clr:'var(--odoo-blue)',  ic:'', path:'/crm/opportunities'},
            {l:'Won This Month',   v:fmt(wonVal),      clr:'var(--odoo-green)', ic:'', path:'/crm/reports'},
            {l:'Qualified Leads',  v:qualLeads,        clr:'#B7950B',           ic:'', path:'/crm/leads'},
          ].map(k=>(
            <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.clr}} onClick={()=>nav(k.path)}>
              <div className="crm-kpi-icon">{k.ic}</div>
              <div className="crm-kpi-val" style={{color:k.clr}}>{k.v}</div>
              <div className="crm-kpi-lbl">{k.l}</div>
            </div>
          ))}
        </div>
      )}

      {role === 'ceo' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'18px'}}>
          {[
            {l:'Total Revenue',    v:'₹1.05 Cr',       clr:'var(--odoo-green)', ic:''},
            {l:'Pipeline Value',   v:fmt(pipelineVal), clr:'var(--odoo-purple)',ic:''},
            {l:'Win Rate',         v:'62%',             clr:'var(--odoo-blue)',  ic:''},
            {l:'New Customers',    v:'4 this month',    clr:'var(--odoo-orange)',ic:''},
            {l:'Forecast Q1',      v:'₹1.5 Cr',        clr:'#B7950B',          ic:''},
          ].map(k=>(
            <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.clr}}>
              <div className="crm-kpi-icon">{k.ic}</div>
              <div className="crm-kpi-val" style={{color:k.clr}}>{k.v}</div>
              <div className="crm-kpi-lbl">{k.l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="fi-panel-grid">
        {/* Pipeline Funnel */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3>Sales Pipeline</h3>
            <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/opportunities')}>View All</button>
          </div>
          <div className="fi-panel-body">
            {PIPELINE_STAGES.map(ps => {
              const opps = OPPORTUNITIES.filter(o=>o.stage===ps.stage)
              const val  = opps.reduce((s,o)=>s+o.value,0)
              const pct  = OPPORTUNITIES.length>0 ? opps.length/OPPORTUNITIES.length*100 : 0
              return (
                <div key={ps.stage} style={{marginBottom:'10px',cursor:'pointer'}} onClick={()=>nav('/crm/opportunities')}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'3px'}}>
                    <strong>{ps.stage}</strong>
                    <span style={{color:'var(--odoo-gray)'}}>{opps.length} opp{opps.length!==1?'s':''} · <strong style={{color:ps.color}}>{fmt(val)}</strong></span>
                  </div>
                  <div style={{background:'#F0EEEB',borderRadius:'4px',height:'8px'}}>
                    <div style={{width:`${Math.max(pct,2)}%`,height:'100%',borderRadius:'4px',background:ps.color,transition:'width .3s'}}></div>
                  </div>
                </div>
              )
            })}
            <div style={{marginTop:'12px',padding:'10px 12px',background:'#F0EEEB',borderRadius:'6px',display:'flex',justifyContent:'space-between'}}>
              <span style={{fontWeight:'700',fontSize:'12px'}}>Total Pipeline</span>
              <span style={{fontFamily:'DM Mono,monospace',fontWeight:'800',color:'var(--odoo-purple)'}}>{fmtFull(pipelineVal)}</span>
            </div>
          </div>
        </div>

        {/* Right col */}
        <div>
          {/* Recent Leads */}
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr">
              <h3>Recent Leads</h3>
              <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/leads')}>View All</button>
            </div>
            <div className="fi-panel-body" style={{padding:'0'}}>
              {LEADS.slice(0,5).map(l=>(
                <div key={l.id} className="crm-list-row" onClick={()=>nav(`/crm/leads/${l.id}`)}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:'700',fontSize:'12px',marginBottom:'2px'}}>{l.company}</div>
                    <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{l.source} · {l.owner}</div>
                  </div>
                  <span className={`crm-badge ${l.status==='Qualified'?'crm-badge-qualified':l.status==='New Lead'?'crm-badge-new':l.status==='Contacted'?'crm-badge-contacted':l.status==='Junk Lead'?'crm-badge-junk':'crm-badge-notq'}`}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Rep Performance */}
          <div className="fi-panel">
            <div className="fi-panel-hdr">
              <h3> Team Performance</h3>
              <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/targets')}>Details</button>
            </div>
            <div className="fi-panel-body">
              {SALESREPS.map(r=>{
                const pct = Math.round(r.achieved/r.target*100)
                return (
                  <div key={r.id} style={{marginBottom:'12px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                      <strong>{r.name}</strong>
                      <span style={{color:pct>=90?'var(--odoo-green)':pct>=70?'var(--odoo-orange)':'var(--odoo-red)',fontWeight:'700'}}>{pct}%</span>
                    </div>
                    <div style={{background:'#F0EEEB',borderRadius:'4px',height:'7px'}}>
                      <div style={{width:`${pct}%`,height:'100%',borderRadius:'4px',
                        background:pct>=90?'var(--odoo-green)':pct>=70?'var(--odoo-orange)':'var(--odoo-red)'}}></div>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',color:'var(--odoo-gray)',marginTop:'2px'}}>
                      <span>{fmt(r.achieved)} achieved</span><span>Target: {fmt(r.target)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Won vs Lost + Activity Summary */}
      <div className="fi-panel-grid" style={{marginTop:'14px'}}>
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3> Recent Wins & Losses</h3></div>
          <div className="fi-panel-body" style={{padding:'0'}}>
            {OPPORTUNITIES.filter(o=>o.stage==='Won'||o.stage==='Lost').map(o=>(
              <div key={o.id} className="crm-list-row" onClick={()=>nav(`/crm/opportunities/${o.id}`)}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:'700',fontSize:'12px'}}>{o.company}</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{o.product} · {o.owner}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'DM Mono,monospace',fontWeight:'700',fontSize:'12px'}}>{fmt(o.value)}</div>
                  <span className={o.stage==='Won'?'crm-stage-won':'crm-stage-lost'}>{o.stage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3> Upcoming Activities</h3>
            <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/activities')}>View All</button>
          </div>
          <div className="fi-panel-body" style={{padding:'0'}}>
            {ACTIVITIES.filter(a=>a.status==='Pending').map(a=>(
              <div key={a.id} className="crm-list-row" onClick={()=>nav('/crm/activities')}>
                <span className={`crm-act-badge crm-act-${a.type.toLowerCase().replace(' ','-').replace('/','')}`}>{a.type}</span>
                <div style={{flex:1,marginLeft:'8px'}}>
                  <div style={{fontWeight:'700',fontSize:'12px'}}>{a.company}</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{a.contact} · {a.nextFollowup}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
