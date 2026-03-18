import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LEADS, ACTIVITIES, LEAD_STATUS_COLORS, ACT_TYPE_COLORS, LEAD_STATUSES } from './_crmData'

export default function LeadView() {
  const nav = useNavigate()
  const { id } = useParams()
  const lead = LEADS.find(l=>l.id===id) || LEADS[0]
  const activities = ACTIVITIES.filter(a=>a.company===lead.company)
  const [status, setStatus] = useState(lead.status)
  const [actForm, setActForm] = useState({show:false,type:'Call',notes:'',followup:''})
  const [converted, setConverted] = useState(false)

  if(converted) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px',textAlign:'center'}}>
      <div style={{fontSize:'48px',marginBottom:'16px'}}>🚀</div>
      <h2 style={{fontFamily:'Syne,sans-serif',color:'var(--odoo-green)',marginBottom:'8px'}}>Lead Converted!</h2>
      <div style={{color:'var(--odoo-gray)',marginBottom:'24px'}}>{lead.company} has been converted to an Opportunity.</div>
      <div style={{display:'flex',gap:'12px'}}>
        <button className="btn btn-p btn-s" onClick={()=>nav('/crm/opportunities')}>View Opportunity →</button>
        <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/leads')}>← Back to Leads</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--odoo-purple)',marginRight:'6px'}} onClick={()=>nav('/crm/leads')}>← Leads</button>
          {lead.company} <small>{lead.id}</small>
        </div>
        <div className="fi-lv-actions">
          <select value={status} onChange={e=>setStatus(e.target.value)} className="sd-select"
            style={{background:status==='Qualified'?'#D4EDDA':status==='Not Qualified'?'#F8D7DA':status==='Junk Lead'?'#F0EEEB':'#FFF3CD'}}>
            {LEAD_STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={()=>setActForm(f=>({...f,show:true}))}>+ Log Activity</button>
          {status==='Qualified'&&<button className="btn btn-p btn-s" onClick={()=>setConverted(true)}>🚀 Convert to Opportunity</button>}
        </div>
      </div>

      {/* Status stepper */}
      <div className="crm-stage-stepper" style={{marginBottom:'16px'}}>
        {LEAD_STATUSES.filter(s=>s!=='Junk Lead'&&s!=='Not Qualified').map((s,i)=>(
          <div key={s} className={`crm-step ${status===s?'crm-step-active':LEAD_STATUSES.indexOf(status)>LEAD_STATUSES.indexOf(s)?'crm-step-done':''}`}
            onClick={()=>setStatus(s)} style={{cursor:'pointer'}}>
            <div className="crm-step-dot">{LEAD_STATUSES.indexOf(status)>i?'✓':i+1}</div>
            <div className="crm-step-lbl">{s}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'16px'}}>
        {/* Left */}
        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>🏢 Lead Information</h3></div>
            <div className="fi-panel-body">
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
                {[
                  ['Company',lead.company],['Contact',lead.contact],['Phone',lead.phone],
                  ['Email',lead.email],['Industry',lead.industry],['Source',lead.source],
                  ['Lead Owner',lead.owner],['Date',lead.date],['Est. Value',lead.value>0?`₹${(lead.value/100000).toFixed(1)}L`:'—'],
                ].map(([k,v])=>(
                  <div key={k} style={{padding:'8px 10px',background:'#F8F9FA',borderRadius:'6px'}}>
                    <div style={{fontSize:'10px',color:'var(--odoo-gray)',fontWeight:'700',textTransform:'uppercase',marginBottom:'3px'}}>{k}</div>
                    <div style={{fontSize:'13px',fontWeight:'600'}}>{v||'—'}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:'12px',padding:'10px',background:'#F0EEEB',borderRadius:'6px'}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-purple)',marginBottom:'4px'}}>REQUIREMENT</div>
                <div style={{fontSize:'13px'}}>{lead.requirement||'Not specified'}</div>
              </div>
            </div>
          </div>

          {/* Activity log form */}
          {actForm.show && (
            <div className="fi-panel" style={{marginBottom:'14px',border:'2px solid var(--odoo-purple)'}}>
              <div className="fi-panel-hdr"><h3>📝 Log Activity</h3></div>
              <div className="fi-panel-body">
                <div className="sd-form-grid">
                  <div className="sd-field">
                    <label>Activity Type</label>
                    <select value={actForm.type} onChange={e=>setActForm(f=>({...f,type:e.target.value}))}>
                      {['Call','Meeting','Email','Demo','Site Visit','Technical Discussion'].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="sd-field">
                    <label>Next Follow-up</label>
                    <input type="date" value={actForm.followup} onChange={e=>setActForm(f=>({...f,followup:e.target.value}))} />
                  </div>
                </div>
                <div className="sd-field" style={{marginTop:'8px'}}>
                  <label>Notes</label>
                  <textarea rows={2} value={actForm.notes} onChange={e=>setActForm(f=>({...f,notes:e.target.value}))}
                    placeholder="What happened? What was discussed?" style={{width:'100%'}} />
                </div>
                <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                  <button className="btn btn-p btn-s" onClick={()=>setActForm(f=>({...f,show:false}))}>✓ Save Activity</button>
                  <button className="btn btn-s sd-bsm" onClick={()=>setActForm(f=>({...f,show:false}))}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>📅 Activity Timeline</h3></div>
            <div className="fi-panel-body">
              {activities.length===0 ? (
                <div style={{textAlign:'center',padding:'24px',color:'var(--odoo-gray)'}}>
                  No activities yet. <button className="btn btn-s btn-p" onClick={()=>setActForm(f=>({...f,show:true}))}>Log first activity</button>
                </div>
              ) : (
                <div style={{paddingLeft:'16px',borderLeft:'2px solid var(--odoo-border)'}}>
                  {activities.map(a=>(
                    <div key={a.id} style={{position:'relative',paddingBottom:'16px'}}>
                      <div style={{position:'absolute',left:'-21px',top:'3px',width:'10px',height:'10px',
                        borderRadius:'50%',background:'var(--odoo-purple)',border:'2px solid #fff',boxShadow:'0 0 0 2px var(--odoo-purple)'}}></div>
                      <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'4px'}}>
                        <span className={`crm-act-badge crm-act-${a.type.toLowerCase().replace(' ','-')}`}>{a.type}</span>
                        <span style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{a.date} · {a.owner}</span>
                        <span className={a.status==='Completed'?'crm-stage-won':'crm-badge-contacted'} style={{fontSize:'10px'}}>{a.status}</span>
                      </div>
                      <div style={{fontSize:'12px',color:'var(--odoo-text)'}}>{a.notes}</div>
                      {a.nextFollowup&&<div style={{fontSize:'11px',color:'var(--odoo-orange)',marginTop:'3px'}}>📅 Follow-up: {a.nextFollowup}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>📊 Lead Score</h3></div>
            <div className="fi-panel-body" style={{textAlign:'center'}}>
              <div style={{fontSize:'36px',fontWeight:'800',fontFamily:'Syne,sans-serif',
                color:status==='Qualified'?'var(--odoo-green)':status==='Contacted'?'var(--odoo-orange)':'var(--odoo-red)'}}>
                {status==='Qualified'?'82':status==='Contacted'?'55':'28'}
              </div>
              <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginBottom:'12px'}}>Lead Score / 100</div>
              <div style={{background:'#F0EEEB',borderRadius:'6px',padding:'10px',textAlign:'left',fontSize:'12px'}}>
                <div style={{fontWeight:'700',marginBottom:'6px'}}>Scoring Factors</div>
                {[
                  {l:'Budget identified',done:status==='Qualified'},
                  {l:'Decision maker contact',done:true},
                  {l:'Requirement clarity',done:!!lead.requirement},
                  {l:'Timeline discussed',done:status==='Qualified'},
                ].map(f=>(
                  <div key={f.l} style={{display:'flex',gap:'6px',alignItems:'center',marginBottom:'4px'}}>
                    <span style={{color:f.done?'var(--odoo-green)':'var(--odoo-gray)'}}>{f.done?'✓':'○'}</span>
                    <span style={{color:f.done?'var(--odoo-text)':'var(--odoo-gray)'}}>{f.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>📞 Quick Actions</h3></div>
            <div className="fi-panel-body" style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              <button className="btn btn-p btn-s" style={{width:'100%'}} onClick={()=>setActForm(f=>({...f,show:true,type:'Call'}))}>📞 Log Call</button>
              <button className="btn btn-s sd-bsm" style={{width:'100%'}} onClick={()=>setActForm(f=>({...f,show:true,type:'Meeting'}))}>🤝 Log Meeting</button>
              <button className="btn btn-s sd-bsm" style={{width:'100%'}} onClick={()=>setActForm(f=>({...f,show:true,type:'Email'}))}>📧 Log Email</button>
              {status==='Qualified'&&(
                <button className="btn btn-p btn-s" style={{width:'100%',background:'var(--odoo-green)'}} onClick={()=>setConverted(true)}>🚀 Convert to Opp</button>
              )}
            </div>
          </div>

          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>🤖 AI Insights</h3></div>
            <div className="fi-panel-body">
              <div style={{background:'#EDE0EA',borderRadius:'6px',padding:'10px',fontSize:'12px',lineHeight:'1.7'}}>
                <div style={{fontWeight:'700',color:'var(--odoo-purple)',marginBottom:'6px'}}>Win Probability: <strong style={{fontSize:'16px'}}>{status==='Qualified'?'72%':status==='Contacted'?'45%':'20%'}</strong></div>
                <div>Best next action: <strong>{status==='Qualified'?'Schedule plant demo':'Make qualification call'}</strong></div>
                <div style={{marginTop:'6px',color:'var(--odoo-gray)'}}>Similar leads from {lead.industry||'this industry'} close in avg <strong>18 days</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
