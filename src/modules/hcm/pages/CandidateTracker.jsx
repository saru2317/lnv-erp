import React, { useState } from 'react'

const STAGES = {
  'Applied': [
    {id:'C-045',name:'Murugan S.',pos:'Ring Frame Operator',exp:'3 yrs',src:'Naukri',date:'28 Feb'},
    {id:'C-044',name:'Selvam P.',pos:'QC Inspector',exp:'2 yrs',src:'Walk-in',date:'27 Feb'},
    {id:'C-043',name:'Geetha R.',pos:'Maintenance Tech',exp:'5 yrs',src:'Referral',date:'25 Feb'},
  ],
  'Shortlisted': [
    {id:'C-042',name:'Arjun K.',pos:'Ring Frame Operator',exp:'4 yrs',src:'Naukri',date:'20 Feb'},
    {id:'C-041',name:'Ramesh M.',pos:'QC Inspector',exp:'3 yrs',src:'Walk-in',date:'18 Feb'},
  ],
  'Interview': [
    {id:'C-040',name:'Suresh V.',pos:'Warehouse Supervisor',exp:'7 yrs',src:'LinkedIn',date:'15 Feb'},
    {id:'C-039',name:'Kavitha N.',pos:'QC Inspector',exp:'4 yrs',src:'Referral',date:'14 Feb'},
  ],
  'Offer': [
    {id:'C-038',name:'Balamurugan T.',pos:'Ring Frame Operator',exp:'5 yrs',src:'Naukri',date:'10 Feb'},
  ],
  'Joined': [
    {id:'C-037',name:'Vijayalakshmi D.',pos:'Sr. Accounts Exec.',exp:'6 yrs',src:'LinkedIn',date:'01 Feb'},
  ],
}

const STAGE_COLORS = {'Applied':'var(--odoo-gray)','Shortlisted':'var(--odoo-blue)','Interview':'var(--odoo-orange)','Offer':'var(--odoo-purple)','Joined':'var(--odoo-green)'}

export default function CandidateTracker() {
  const [drag, setDrag] = useState(null)
  const total = Object.values(STAGES).flat().length

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Candidate Pipeline <small>{total} candidates total</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm">➕ Add Candidate</button>
        </div>
      </div>

      <div style={{overflowX:'auto'}}>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${Object.keys(STAGES).length},minmax(190px,1fr))`,gap:'12px',minWidth:'900px'}}>
          {Object.entries(STAGES).map(([stage, candidates])=>(
            <div key={stage} className="pipeline-stage">
              <div className="pipeline-hdr" style={{color:STAGE_COLORS[stage],borderBottomColor:STAGE_COLORS[stage]}}>
                {stage}
                <span style={{float:'right',background:`${STAGE_COLORS[stage]}22`,
                  borderRadius:'10px',padding:'1px 8px',fontSize:'11px'}}>{candidates.length}</span>
              </div>
              {candidates.map(c=>(
                <div key={c.id} className="pipeline-card" style={{borderLeftColor:STAGE_COLORS[stage]}}>
                  <div style={{fontWeight:'700',fontSize:'13px'}}>{c.name}</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)',margin:'2px 0'}}>{c.pos}</div>
                  <div style={{fontSize:'11px',display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'4px'}}>
                    <span style={{background:'#F0EEEB',padding:'1px 6px',borderRadius:'4px'}}>{c.exp}</span>
                    <span style={{background:'#F0EEEB',padding:'1px 6px',borderRadius:'4px'}}>{c.src}</span>
                  </div>
                  <div style={{fontSize:'10px',color:'var(--odoo-gray)',marginTop:'4px'}}>{c.id} · {c.date}</div>
                  <div style={{display:'flex',gap:'4px',marginTop:'6px'}}>
                    <button className="btn-xs">View</button>
                    {stage!=='Joined' && <button className="btn-xs pri">→ Move</button>}
                    {stage==='Interview' && <button className="btn-xs">📞 Schedule</button>}
                    {stage==='Offer' && <button className="btn-xs">📄 Offer Letter</button>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Funnel stats */}
      <div className="fi-panel" style={{marginTop:'16px'}}>
        <div className="fi-panel-hdr"><h3>📊 Recruitment Funnel</h3></div>
        <div className="fi-panel-body">
          <div style={{display:'grid',gridTemplateColumns:`repeat(${Object.keys(STAGES).length},1fr)`,gap:'10px'}}>
            {Object.entries(STAGES).map(([stage,list])=>(
              <div key={stage} style={{textAlign:'center',padding:'10px',background:'#F8F9FA',borderRadius:'8px'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'22px',color:STAGE_COLORS[stage]}}>{list.length}</div>
                <div style={{fontSize:'11px',fontWeight:'600',color:'var(--odoo-dark)'}}>{stage}</div>
                <div style={{background:'#F0EEEB',borderRadius:'4px',height:'5px',marginTop:'6px'}}>
                  <div style={{width:`${(list.length/total*100)}%`,height:'100%',borderRadius:'4px',background:STAGE_COLORS[stage]}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
