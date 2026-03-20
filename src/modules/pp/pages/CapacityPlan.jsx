import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CAPACITY = [
  {mc:'RFM-01',avail:500,weeks:[420,510,380,350],unit:'Kg/day'},
  {mc:'RFM-02',avail:500,weeks:[360,470,400,280],unit:'Kg/day'},
  {mc:'OE-02', avail:300,weeks:[90, 220,280,300],unit:'Kg/day'},
  {mc:'CSP-01',avail:800,weeks:[480,600,700,400],unit:'Kg/day'},
  {mc:'CRD-01',avail:400,weeks:[220,300,260,200],unit:'Kg/day'},
  {mc:'BLW-01',avail:2000,weeks:[1400,1800,1600,1200],unit:'Kg/day'},
]
const WEEKS = ['W1 Mar 1–7','W2 Mar 8–14','W3 Mar 15–21','W4 Mar 22–31']

export default function CapacityPlan() {
  const nav = useNavigate()
  const [month, setMonth] = useState('March 2025')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Capacity Planning <small>{month} — Load vs Available</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" onChange={e=>setMonth(e.target.value)}>
            <option>March 2025</option><option>April 2025</option><option>May 2025</option>
          </select>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/gantt')}> Gantt View</button>
        </div>
      </div>

      <div className="pp-alert warn"> <strong>RFM-01 is at 102% capacity</strong> in Week 2 of March — consider rescheduling WO-2025-021.</div>

      {/* Summary KPIs */}
      <div className="pp-kpi-grid" style={{marginBottom:'20px'}}>
        {[{cls:'green',ic:'',l:'Machines Available',v:'8',s:'All work centres'},
          {cls:'red',  ic:'',l:'Overloaded',        v:'1',s:'RFM-01 in W2'},
          {cls:'orange',ic:'',l:'Avg Utilization',  v:'68%',s:'Across all machines'},
          {cls:'blue', ic:'',l:'Planned Orders',    v:'6',s:'March 2025'},
        ].map(k=>(
          <div key={k.l} className={`pp-kpi-card ${k.cls}`}>
            <div className="pp-kpi-icon">{k.ic}</div>
            <div className="pp-kpi-label">{k.l}</div>
            <div className="pp-kpi-value">{k.v}</div>
            <div className="pp-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      {/* Capacity Table */}
      <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',overflow:'hidden'}}>
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>Machine</th>
              <th>Available (Kg/day)</th>
              {WEEKS.map(w=><th key={w}>{w}</th>)}
            </tr>
          </thead>
          <tbody>
            {CAPACITY.map(c=>(
              <tr key={c.mc}>
                <td><strong>{c.mc}</strong></td>
                <td style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:'var(--odoo-green)'}}>{c.avail}</td>
                {c.weeks.map((w,i)=>{
                  const pct = Math.round(w/c.avail*100)
                  const overloaded = pct > 100
                  const clr = pct>95?'var(--odoo-red)':pct>80?'var(--odoo-orange)':pct>50?'var(--odoo-green)':'var(--odoo-blue)'
                  return (
                    <td key={i} style={{background:overloaded?'#FFF5F5':'inherit'}}>
                      <div style={{fontSize:'12px',fontWeight:'700',color:clr}}>{w} Kg</div>
                      <div style={{background:'#F0EEEB',borderRadius:'3px',height:'5px',marginTop:'3px'}}>
                        <div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:clr,borderRadius:'3px'}}></div>
                      </div>
                      <div style={{fontSize:'10px',color:clr,fontWeight:'600',marginTop:'2px'}}>{pct}% {overloaded?' Over':''}</div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
