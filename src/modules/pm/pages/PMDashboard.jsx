import React from 'react'
import { useNavigate } from 'react-router-dom'

const BREAKDOWNS = [
  {id:'BD-2025-008',mc:'WND-01',name:'Winding Machine',issue:'Bearing failure — vibration high',hrs:18,tech:'Suresh M.',sb:'badge-hold',cl:'inprogress'},
  {id:'BD-2025-007',mc:'FB-02',name:'Fiber Bundle M/C',issue:'Belt worn — slippage',hrs:4,tech:'Ravi K.',sb:'badge-progress',cl:'inprogress'},
]

const PM_SCHEDULE = [
  {mc:'SPG-01 Ring Frame',type:'Quarterly PM',last:'01 Feb 2025',status:'Overdue 28 days',cls:'dn'},
  {mc:'CB-01 Carding Beater',type:'Monthly PM',last:'15 Feb 2025',status:'Overdue 14 days',cls:'dn'},
  {mc:'OE-01 OE Machine',type:'Monthly PM',last:'01 Mar 2025',status:'Due today',cls:'wn'},
  {mc:'SPG-02 Ring Frame',type:'Quarterly PM',last:'15 Mar 2025',status:'Upcoming',cls:'up'},
]

export default function PMDashboard() {
  const nav = useNavigate()
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">PM Dashboard <small>Plant Maintenance Overview · Feb 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/schedule')}> PM Schedule</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/pm/breakdown/new')}> Report Breakdown</button>
        </div>
      </div>

      {BREAKDOWNS.length > 0 && (
        <div className="pp-alert warn" style={{marginBottom:'14px'}}>
           <strong>{BREAKDOWNS.length} Active Breakdowns!</strong> Total downtime: 22 hrs today — WND-01 & FB-02 down.
        </div>
      )}

      <div className="pm-kpi-grid">
        {[{cls:'red',   ic:'',l:'Active Breakdowns', v:'2', s:'WND-01 · 18 hrs downtime'},
          {cls:'orange',ic:'',l:'PM Overdue',         v:'2', s:'SPG-01 · CB-01 — urgent'},
          {cls:'purple',ic:'',l:'Machine Utilization',v:'76%',s:'Target: 85%'},
          {cls:'blue',  ic:'',l:'Maint. Cost (MTD)',  v:'₹1.8L',s:'Budget: ₹2.0L · 90%'},
        ].map(k=>(
          <div key={k.l} className={`pm-kpi-card ${k.cls}`}>
            <div className="pm-kpi-icon">{k.ic}</div>
            <div className="pm-kpi-label">{k.l}</div>
            <div className="pm-kpi-value">{k.v}</div>
            <div className="pm-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="fi-panel-grid">
        {/* Active Breakdowns */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <h3 style={{fontFamily:'Syne,sans-serif',fontSize:'15px',fontWeight:'700'}}> Active Breakdowns</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/breakdown')}>View All</button>
          </div>
          {BREAKDOWNS.map(b=>(
            <div key={b.id} className={`bd-card ${b.cl}`} onClick={() => nav('/pm/breakdown')}>
              <div className="bd-hdr">
                <div className="bd-title">{b.id} — {b.mc} · {b.name}</div>
                <span className={`badge ${b.sb}`}>Active</span>
              </div>
              <div className="bd-meta">
                <span> {b.issue}</span>
              </div>
              <div className="bd-meta" style={{marginTop:'6px'}}>
                <span>⏱ Downtime: <strong style={{color:'var(--odoo-red)'}}>{b.hrs} hrs</strong></span>
                <span> {b.tech}</span>
              </div>
            </div>
          ))}
          <button className="btn btn-p sd-bsm" style={{width:'100%',marginTop:'4px'}} onClick={() => nav('/pm/breakdown/new')}>
             Report New Breakdown
          </button>
        </div>

        {/* PM Schedule */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3> PM Schedule</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/schedule')}>View All</button>
          </div>
          <div className="fi-panel-body">
            {PM_SCHEDULE.map(p=>(
              <div key={p.mc} className="pm-sched-row">
                <div className="pm-sched-icon" style={{background:p.cls==='dn'?'#F8D7DA':p.cls==='wn'?'#FFF3CD':'#D4EDDA'}}></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',fontWeight:'700'}}>{p.mc}</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{p.type} · Last: {p.last}</div>
                </div>
                <div style={{fontSize:'11px',fontWeight:'700',
                  color:p.cls==='dn'?'var(--odoo-red)':p.cls==='wn'?'var(--odoo-orange)':'var(--odoo-green)',
                  whiteSpace:'nowrap'}}>{p.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MTTR / MTBF Summary */}
      <div className="fi-panel-grid">
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>Reliability Metrics — Feb 2025</h3></div>
          <div className="fi-panel-body">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              {[['MTBF','134 hrs','Mean Time Between Failures','var(--odoo-green)'],
                ['MTTR','4.2 hrs','Mean Time To Repair','var(--odoo-blue)'],
                ['Availability','96.8%','Overall machine availability','var(--odoo-purple)'],
                ['Breakdowns MTD','5','Total breakdown incidents','var(--odoo-red)'],
              ].map(([l,v,s,c])=>(
                <div key={l} style={{background:'#F8F9FA',borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                  <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'4px'}}>{l}</div>
                  <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'20px',color:c}}>{v}</div>
                  <div style={{fontSize:'10px',color:'var(--odoo-gray)',marginTop:'2px'}}>{s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3> Quick Actions</h3></div>
          <div className="fi-panel-body" style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {[['','Report Breakdown','/pm/breakdown/new','btn-p'],
              ['','Create PM Work Order','/pm/workorder','btn-s'],
              ['','Issue Spare Parts','/pm/spares/issue','btn-s'],
              ['','View PM Schedule','/pm/schedule','btn-s'],
              ['','Calibration Due','/pm/calibration','btn-s'],
              ['','Cost Report','/pm/cost','btn-s'],
            ].map(([ic,l,to,cls])=>(
              <button key={l} className={`btn ${cls} sd-bsm`} style={{justifyContent:'flex-start',gap:'8px'}}
                onClick={() => nav(to)}>{ic} {l}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
