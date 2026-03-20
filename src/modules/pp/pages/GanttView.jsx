import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const WEEKS = ['W1 Mar 1–7','W2 Mar 8–14','W3 Mar 15–21','W4 Mar 22–31']

const GANTT_DATA = [
  {no:'WO-2025-019',prod:'Ring Yarn (30s)',mc:'RFM-01',start:0,len:35,pct:65,clr:'var(--odoo-orange)',sb:'badge-progress'},
  {no:'WO-2025-018',prod:'Open End Yarn (12s)',mc:'OE-02',start:0,len:25,pct:30,clr:'var(--odoo-red)',sb:'badge-hold'},
  {no:'WO-2025-020',prod:'Compact Sliver',mc:'CSP-01',start:0,len:50,pct:10,clr:'var(--odoo-blue)',sb:'badge-released'},
  {no:'WO-2025-021',prod:'Ring Yarn (40s)',mc:'RFM-01',start:40,len:40,pct:0,clr:'var(--odoo-purple)',sb:'badge-draft'},
  {no:'WO-2025-022',prod:'Open End Yarn (20s)',mc:'OE-02',start:30,len:35,pct:0,clr:'var(--odoo-green)',sb:'badge-draft'},
  {no:'WO-2025-023',prod:'Cotton Sliver A',mc:'CRD-01',start:55,len:30,pct:0,clr:'var(--odoo-blue)',sb:'badge-draft'},
]

export default function GanttView() {
  const nav = useNavigate()
  const [view, setView] = useState('month')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Gantt View <small>Production Schedule · March 2025</small></div>
        <div className="fi-lv-actions">
          {['week','month','quarter'].map(v=>(
            <button key={v} className={`btn ${view===v?'btn-p':'btn-s'} sd-bsm`} onClick={()=>setView(v)}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
          ))}
          <button className="btn btn-p sd-bsm" onClick={() => nav('/pp/wo/new')}>New WO</button>
        </div>
      </div>

      <div className="pp-alert info"> Drag bars to reschedule (view only in this build). <strong>RFM-01 overloaded in Week 2</strong> — WO-2025-021 may need rescheduling.</div>

      <div className="gantt-wrap">
        {/* Week header */}
        <div className="gantt-week">
          {WEEKS.map(w=>(
            <div key={w} className="gantt-week-lbl">{w}</div>
          ))}
        </div>
        {/* Today line marker */}
        <div style={{position:'relative',minWidth:'900px'}}>
          <div style={{position:'absolute',left:'calc(200px + 15%)',top:0,bottom:0,width:'2px',background:'var(--odoo-red)',zIndex:10,opacity:.6}}>
            <div style={{position:'absolute',top:0,left:'4px',fontSize:'10px',fontWeight:'700',color:'var(--odoo-red)',whiteSpace:'nowrap'}}>Today</div>
          </div>
          {GANTT_DATA.map(g=>(
            <div key={g.no} className="gantt-row" onClick={() => nav('/pp/entry')} style={{cursor:'pointer'}}>
              <div className="gantt-label">
                <div style={{fontWeight:'700',fontSize:'12px',color:'var(--odoo-purple)'}}>{g.no}</div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{g.mc} · {g.prod}</div>
              </div>
              <div className="gantt-track">
                {/* Background progress fill */}
                <div style={{
                  position:'absolute',left:`${g.start}%`,width:`${g.len}%`,height:'100%',
                  background:'#E8E0E6',borderRadius:'4px',
                }}></div>
                {/* Actual progress */}
                <div className="gantt-bar" style={{
                  left:`${g.start}%`,width:`${g.len * g.pct / 100}%`,
                  background:g.clr,minWidth:g.pct>0?'20px':'0',
                }}>
                  {g.pct>10?`${g.pct}%`:''}
                </div>
                {/* WO label on bar */}
                <div style={{
                  position:'absolute',left:`${g.start + 0.5}%`,top:'50%',transform:'translateY(-50%)',
                  fontSize:'11px',fontWeight:'600',color:g.pct>40?'#fff':'var(--odoo-dark)',
                  pointerEvents:'none',whiteSpace:'nowrap',
                }}>
                  {g.pct===0 ? g.prod.substring(0,18) : ''}
                </div>
              </div>
              <div style={{width:'80px',flexShrink:0,paddingLeft:'10px'}}>
                <span className={`badge ${g.sb}`} style={{fontSize:'10px'}}>{g.pct>0?`${g.pct}%`:'Planned'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Machine Load Summary */}
        <div style={{marginTop:'20px',borderTop:'1px solid var(--odoo-border)',paddingTop:'14px'}}>
          <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'10px',fontFamily:'Syne,sans-serif'}}> Machine Load — March 2025</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
            {[{mc:'RFM-01',load:102,clr:'var(--odoo-red)'},{mc:'OE-02',load:75,clr:'var(--odoo-orange)'},
              {mc:'CSP-01',load:60,clr:'var(--odoo-green)'},{mc:'CRD-01',load:45,clr:'var(--odoo-blue)'}].map(m=>(
              <div key={m.mc} style={{background:'#fff',borderRadius:'6px',padding:'10px',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
                <div style={{fontWeight:'700',fontSize:'12px',marginBottom:'6px'}}>{m.mc}</div>
                <div className="mc-util-bar">
                  <div className="mc-util-fill" style={{width:`${Math.min(m.load,100)}%`,background:m.clr}}></div>
                </div>
                <div style={{fontSize:'11px',fontWeight:'700',color:m.clr,marginTop:'2px'}}>{m.load}% {m.load>100?' OVERLOADED':''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
