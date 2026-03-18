import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { OPPORTUNITIES, ACTIVITIES, QUOTATIONS, OPP_STAGES, OPP_STAGE_COLORS, fmt, fmtFull } from './_crmData'

export default function OpportunityView() {
  const nav = useNavigate()
  const { id } = useParams()
  const opp = OPPORTUNITIES.find(o=>o.id===id) || OPPORTUNITIES[0]
  const activities = ACTIVITIES.filter(a=>a.oppId===opp.id)
  const quotes = QUOTATIONS.filter(q=>q.oppId===opp.id)
  const [stage, setStage] = useState(opp.stage)
  const [actForm, setActForm] = useState({show:false,type:'Call',notes:'',followup:''})

  const stageIdx = OPP_STAGES.indexOf(stage)
  const isWon    = stage === 'Won'
  const isLost   = stage === 'Lost'

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--odoo-purple)',marginRight:'6px'}} onClick={()=>nav('/crm/opportunities')}>← Opportunities</button>
          {opp.company} <small>{opp.id}</small>
        </div>
        <div className="fi-lv-actions">
          {!isWon&&!isLost&&<><button className="btn btn-s sd-bsm" onClick={()=>setActForm(f=>({...f,show:true}))}>+ Activity</button>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/quotations/new')}>Create Quotation</button>
          <button className="btn btn-p btn-s" style={{background:'var(--odoo-green)'}} onClick={()=>setStage('Won')}>🏆 Mark Won</button>
          <button className="btn btn-s" style={{background:'var(--odoo-red)',color:'#fff'}} onClick={()=>setStage('Lost')}>✗ Mark Lost</button></>}
        </div>
      </div>

      {/* Won/Lost Banner */}
      {isWon&&<div className="pp-alert" style={{background:'#D4EDDA',borderColor:'var(--odoo-green)',marginBottom:'14px'}}>🏆 <strong>Deal Won!</strong> — Congratulations! This opportunity has been closed as WON. <button className="btn btn-s btn-p" style={{marginLeft:'8px'}} onClick={()=>nav('/crm/quotations/new')}>Create Sales Order →</button></div>}
      {isLost&&<div className="pp-alert warn" style={{marginBottom:'14px'}}>❌ <strong>Deal Lost</strong> — This opportunity was marked as Lost. {opp.lostReason&&`Reason: ${opp.lostReason}`}</div>}

      {/* Stage Stepper */}
      {!isWon&&!isLost&&(
        <div className="crm-stage-stepper" style={{marginBottom:'16px'}}>
          {OPP_STAGES.filter(s=>s!=='Won'&&s!=='Lost').map((s,i)=>(
            <div key={s} className={`crm-step ${stage===s?'crm-step-active':i<stageIdx?'crm-step-done':''}`}
              onClick={()=>setStage(s)} style={{cursor:'pointer'}}>
              <div className="crm-step-dot">{i<stageIdx?'✓':i+1}</div>
              <div className="crm-step-lbl">{s}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'16px'}}>
        {/* Left */}
        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>Opportunity Details</h3></div>
            <div className="fi-panel-body">
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>
                {[
                  ['Company',opp.company],['Contact',opp.contact],['Product',opp.product],
                  ['Value',fmtFull(opp.value)],['Close Date',opp.closeDate],['Owner',opp.owner],
                  ['Win Probability',opp.winProb+'%'],['Competitor',opp.competitor||'—'],['Activities',opp.activities+' logged'],
                ].map(([k,v])=>(
                  <div key={k} style={{padding:'8px 10px',background:'#F8F9FA',borderRadius:'6px'}}>
                    <div style={{fontSize:'10px',color:'var(--odoo-gray)',fontWeight:'700',textTransform:'uppercase',marginBottom:'3px'}}>{k}</div>
                    <div style={{fontSize:'13px',fontWeight:'600'}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quotations linked */}
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr">
              <h3>Linked Quotations</h3>
              <button className="btn btn-s sd-bsm" onClick={()=>nav('/crm/quotations/new')}>+ New Quotation</button>
            </div>
            <div className="fi-panel-body" style={{padding:'0'}}>
              {quotes.length===0
                ? <div style={{padding:'20px',textAlign:'center',color:'var(--odoo-gray)'}}>No quotations yet. <button className="btn btn-s btn-p" onClick={()=>nav('/crm/quotations/new')}>Create First</button></div>
                : quotes.map(q=>(
                  <div key={q.id} className="crm-list-row" onClick={()=>nav(`/crm/quotations/${q.id}`)}>
                    <div style={{flex:1}}>
                      <span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-purple)',marginRight:'8px'}}>{q.id}</span>
                      <strong style={{fontSize:'12px'}}>{q.product}</strong>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:'DM Mono,monospace',fontWeight:'700',fontSize:'12px'}}>{fmtFull(q.finalAmount)}</div>
                      <span className={`crm-badge ${q.status==='Won'?'crm-stage-won':q.status==='Lost'?'crm-stage-lost':'crm-badge-contacted'}`}>{q.status}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Activity log form */}
          {actForm.show&&(
            <div className="fi-panel" style={{marginBottom:'14px',border:'2px solid var(--odoo-purple)'}}>
              <div className="fi-panel-hdr"><h3>📝 Log Activity</h3></div>
              <div className="fi-panel-body">
                <div className="sd-form-grid">
                  <div className="sd-field">
                    <label>Type</label>
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
                    placeholder="Discussion summary…" style={{width:'100%'}} />
                </div>
                <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                  <button className="btn btn-p btn-s" onClick={()=>setActForm(f=>({...f,show:false}))}>Save</button>
                  <button className="btn btn-s sd-bsm" onClick={()=>setActForm(f=>({...f,show:false}))}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>📅 Activity History</h3></div>
            <div className="fi-panel-body">
              {activities.length===0
                ? <div style={{textAlign:'center',padding:'24px',color:'var(--odoo-gray)'}}>No activities logged yet.</div>
                : <div style={{paddingLeft:'16px',borderLeft:'2px solid var(--odoo-border)'}}>
                    {activities.map(a=>(
                      <div key={a.id} style={{position:'relative',paddingBottom:'14px'}}>
                        <div style={{position:'absolute',left:'-21px',top:'3px',width:'10px',height:'10px',
                          borderRadius:'50%',background:'var(--odoo-orange)',border:'2px solid #fff',boxShadow:'0 0 0 2px var(--odoo-orange)'}}></div>
                        <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'3px'}}>
                          <span className={`crm-act-badge crm-act-${a.type.toLowerCase().replace(' ','-')}`}>{a.type}</span>
                          <span style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{a.date} · {a.owner}</span>
                        </div>
                        <div style={{fontSize:'12px'}}>{a.notes}</div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        </div>

        {/* Right */}
        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>🤖 AI Win Analysis</h3></div>
            <div className="fi-panel-body">
              <div style={{textAlign:'center',marginBottom:'12px'}}>
                <div style={{fontSize:'36px',fontWeight:'800',fontFamily:'Syne,sans-serif',
                  color:opp.winProb>=70?'var(--odoo-green)':opp.winProb>=40?'var(--odoo-orange)':'var(--odoo-red)'}}>
                  {opp.winProb}%
                </div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>Win Probability</div>
                <div style={{background:'#e0e0e0',borderRadius:'6px',height:'8px',marginTop:'8px'}}>
                  <div style={{width:`${opp.winProb}%`,height:'100%',borderRadius:'6px',
                    background:opp.winProb>=70?'var(--odoo-green)':opp.winProb>=40?'var(--odoo-orange)':'var(--odoo-red)',
                    transition:'width .3s'}}></div>
                </div>
              </div>
              <div style={{background:'#EDE0EA',borderRadius:'6px',padding:'10px',fontSize:'12px',lineHeight:'1.7'}}>
                <div style={{fontWeight:'700',color:'var(--odoo-purple)',marginBottom:'4px'}}>AI Recommendations</div>
                {opp.competitor
                  ? <div>Competitor <strong>{opp.competitor}</strong> detected. Focus on <strong>quality differentiation</strong> and after-sales support.</div>
                  : <div>No competitor noted. <strong>Good position!</strong> Emphasize delivery timeline and technical support.</div>
                }
                <div style={{marginTop:'6px'}}>Next best action: <strong>{stage==='Proposal Submitted'?'Follow up in 3 days':stage==='Negotiation'?'Offer final terms':'Advance to next stage'}</strong></div>
              </div>
            </div>
          </div>

          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>⚡ Quick Actions</h3></div>
            <div className="fi-panel-body" style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              <button className="btn btn-p btn-s" style={{width:'100%'}} onClick={()=>nav('/crm/quotations/new')}>Create Quotation</button>
              <button className="btn btn-s sd-bsm" style={{width:'100%'}} onClick={()=>setActForm(f=>({...f,show:true,type:'Call'}))}>📞 Log Call</button>
              <button className="btn btn-s sd-bsm" style={{width:'100%'}} onClick={()=>setActForm(f=>({...f,show:true,type:'Meeting'}))}>🤝 Log Meeting</button>
              <button className="btn btn-s sd-bsm" style={{width:'100%'}} onClick={()=>setActForm(f=>({...f,show:true,type:'Demo'}))}>Log Demo</button>
            </div>
          </div>

          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>Similar Wins</h3></div>
            <div className="fi-panel-body">
              <div style={{fontSize:'12px',color:'var(--odoo-gray)',marginBottom:'8px'}}>Deals similar to this in your history:</div>
              {OPPORTUNITIES.filter(o=>o.stage==='Won'&&o.id!==opp.id).map(w=>(
                <div key={w.id} style={{padding:'6px 0',borderBottom:'1px solid var(--odoo-border)',fontSize:'12px'}}>
                  <div style={{fontWeight:'700'}}>{w.company}</div>
                  <div style={{color:'var(--odoo-gray)'}}>{w.product} · {fmt(w.value)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
