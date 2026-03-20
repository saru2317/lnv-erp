import React from 'react'
import { useNavigate } from 'react-router-dom'

const ACTIVE_WOS = [
  {no:'WO-2025-019',prod:'Ring Yarn (30s Count)',  qty:'500 Kg',due:'02 Mar',mc:'RFM-01',pct:65, cls:'status-progress',pclr:'var(--odoo-orange)',sb:'badge-progress',sl:'In Progress'},
  {no:'WO-2025-018',prod:'Open End Yarn (12s)',     qty:'300 Kg',due:'01 Mar',mc:'OE-02', pct:30, cls:'status-hold',    pclr:'var(--odoo-red)',   sb:'badge-hold',    sl:' Mat. Short'},
  {no:'WO-2025-020',prod:'Compact Sliver',          qty:'800 Kg',due:'05 Mar',mc:'CSP-01',pct:10, cls:'status-released', pclr:'var(--odoo-blue)',  sb:'badge-released',sl:'Released'},
]
const MACHINES = [
  {name:'RFM-01 · Ring Frame Machine', util:85, clr:'var(--odoo-orange)', wo:'WO-2025-019',sb:'badge-progress',sl:'Running'},
  {name:'OE-02 · Open End Machine',    util:30, clr:'var(--odoo-red)',    wo:'WO-2025-018',sb:'badge-hold',    sl:'On Hold'},
  {name:'CSP-01 · Compact Spinning',   util:60, clr:'var(--odoo-green)',  wo:'WO-2025-020',sb:'badge-released',sl:'Running'},
  {name:'WD-01 · Winding Machine',     util:0,  clr:'var(--odoo-gray)',   wo:'—',          sb:'badge-draft',   sl:'Idle'},
]

export default function PPDashboard() {
  const nav = useNavigate()
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">PP Dashboard <small>Production Overview · Feb 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/gantt')}> Gantt</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/mrp')}>MRP Run</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/pp/wo/new')}>New Work Order</button>
        </div>
      </div>

      <div className="pp-alert warn"> <strong>2 Work Orders</strong> behind schedule. <strong>Ring Yarn</strong> material shortage may halt WO-2025-018. <span style={{textDecoration:'underline',cursor:'pointer'}} onClick={() => nav('/pp/mrp')}>Run MRP →</span></div>

      <div className="pp-kpi-grid">
        {[{cls:'purple',ic:'',l:'Active Work Orders',v:'12',s:'3 released · 7 in-progress · 2 on hold'},
          {cls:'green', ic:'',l:'Completed (MTD)',    v:'28',s:'Avg efficiency: 87%'},
          {cls:'orange',ic:'',l:'Machine Utilization',v:'78%',s:'4 active · 1 idle'},
          {cls:'red',   ic:'',l:'Material Shortage',  v:'2', s:'Ring Yarn & Solvent low'},
        ].map(k=>(
          <div key={k.l} className={`pp-kpi-card ${k.cls}`}>
            <div className="pp-kpi-icon">{k.ic}</div>
            <div className="pp-kpi-label">{k.l}</div>
            <div className="pp-kpi-value">{k.v}</div>
            <div className="pp-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="fi-panel-grid">
        {/* Active WOs */}
        <div>
          <div style={{marginBottom:'10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h3 style={{fontFamily:'Syne,sans-serif',fontSize:'15px',fontWeight:'700'}}>Active Work Orders</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/wo')}>View All</button>
          </div>
          {ACTIVE_WOS.map(w=>(
            <div key={w.no} className={`wo-card ${w.cls}`} onClick={() => nav('/pp/entry')}>
              <div className="wo-hdr">
                <div className="wo-title">{w.no} · {w.prod}</div>
                <span className={`badge ${w.sb}`}>{w.sl}</span>
              </div>
              <div className="wo-meta">
                <span>Qty: {w.qty}</span>
                <span> Due: {w.due}</span>
                <span> {w.mc}</span>
              </div>
              <div className="wo-progress-bg">
                <div className="wo-progress-fill" style={{width:`${w.pct}%`,background:w.pclr}}></div>
              </div>
              <div className="wo-progress-label">
                <span style={{color:w.pclr,fontWeight:'600'}}>{w.pct}% Complete</span>
                <span style={{color:'var(--odoo-gray)'}}>Produced: {Math.round(parseInt(w.qty)*w.pct/100)} / {w.qty}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Machine Status */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3> Machine Status</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/machines')}>View All</button>
          </div>
          <div className="fi-panel-body">
            {MACHINES.map(m=>(
              <div key={m.name} style={{marginBottom:'14px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px',fontSize:'12px'}}>
                  <span style={{fontWeight:'600'}}>{m.name}</span>
                  <span className={`badge ${m.sb}`}>{m.sl}</span>
                </div>
                <div className="mc-util-bar"><div className="mc-util-fill" style={{width:`${m.util}%`,background:m.clr}}></div></div>
                <div className="mc-util-label"><span>{m.util}% utilization</span><span>{m.wo}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fi-panel">
        <div className="fi-panel-hdr"><h3> Quick Actions</h3></div>
        <div className="fi-panel-body" style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/pp/wo/new')}>New Work Order</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/entry')}> Production Entry</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/gantt')}> Gantt View</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/mrp')}>Run MRP</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/bom/new')}> Create BOM</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/capacity')}> Capacity Plan</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/report')}> Production Report</button>
        </div>
      </div>
    </div>
  )
}
