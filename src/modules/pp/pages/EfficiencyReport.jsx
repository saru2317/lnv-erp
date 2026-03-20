import React, { useState } from 'react'

const MACHINES = [
  {mc:'RFM-01',avail:672,running:580,downtime:62,maint:30,oee:95.5,util:89,sb:'badge-done',  grade:'Good'},
  {mc:'OE-02', avail:672,running:350,downtime:280,maint:42,oee:93.8,util:64,sb:'badge-progress',grade:'Low'},
  {mc:'CSP-01',avail:672,running:500,downtime:148,maint:24,oee:96.4,util:84,sb:'badge-done',  grade:'Good'},
  {mc:'WD-01', avail:672,running:580,downtime:68, maint:24,oee:96.4,util:91,sb:'badge-done',  grade:'Good'},
  {mc:'CRD-01',avail:672,running:620,downtime:32, maint:20,oee:97.0,util:96,sb:'badge-done',  grade:'Excellent'},
  {mc:'BLW-01',avail:672,running:640,downtime:24, maint:8, oee:98.8,util:98,sb:'badge-done',  grade:'Excellent'},
  {mc:'DRW-01',avail:672,running:540,downtime:108,maint:24,oee:96.0,util:84,sb:'badge-done',  grade:'Good'},
]

const DOWNTIME = [
  {cat:'Machine Fault / Breakdown',hrs:42,clr:'var(--odoo-red)'},
  {cat:'Material Shortage / Waiting',hrs:280,clr:'var(--odoo-orange)'},
  {cat:'Setup & Changeover',hrs:68,clr:'var(--odoo-blue)'},
  {cat:'Planned Maintenance',hrs:172,clr:'var(--odoo-green)'},
  {cat:'Power Failure / Utilities',hrs:18,clr:'var(--odoo-gray)'},
]
const totalDT = DOWNTIME.reduce((s,d)=>s+d.hrs,0)

export default function EfficiencyReport() {
  const [month, setMonth] = useState('February 2025')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Machine Efficiency Report <small>{month}</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" onChange={e=>setMonth(e.target.value)}>
            <option>February 2025</option><option>January 2025</option><option>March 2025</option>
          </select>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="pp-kpi-grid">
        {[{cls:'green', ic:'',l:'Overall OEE',   v:'96.1%', s:'Target: 95%'},
          {cls:'orange',ic:'',l:'Avg Utilization',v:'86.6%',s:'All machines'},
          {cls:'red',   ic:'',l:'Total Downtime', v:'580 hrs',s:'Feb 2025'},
          {cls:'blue',  ic:'',l:'Breakdowns',     v:'5',    s:'MTBF: 134 hrs'},
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
        {/* Downtime Breakdown */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>⏱ Downtime Analysis (hrs)</h3></div>
          <div className="fi-panel-body">
            {DOWNTIME.map(d=>(
              <div key={d.cat} style={{marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                  <span>{d.cat}</span>
                  <strong style={{color:d.clr}}>{d.hrs} hrs ({(d.hrs/totalDT*100).toFixed(0)}%)</strong>
                </div>
                <div className="mc-util-bar">
                  <div className="mc-util-fill" style={{width:`${d.hrs/totalDT*100}%`,background:d.clr}}></div>
                </div>
              </div>
            ))}
            <div style={{borderTop:'1px solid var(--odoo-border)',paddingTop:'8px',display:'flex',justifyContent:'space-between',fontSize:'12px',fontWeight:'700'}}>
              <span>Total Downtime</span><span style={{color:'var(--odoo-red)'}}>{totalDT} hrs</span>
            </div>
          </div>
        </div>

        {/* OEE by Machine bars */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>OEE by Machine</h3></div>
          <div className="fi-panel-body">
            {MACHINES.map(m=>(
              <div key={m.mc} style={{marginBottom:'10px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'3px'}}>
                  <strong>{m.mc}</strong>
                  <span style={{fontWeight:'700',color:m.oee>=96?'var(--odoo-green)':m.oee>=90?'var(--odoo-orange)':'var(--odoo-red)'}}>{m.oee}%</span>
                </div>
                <div className="mc-util-bar">
                  <div className="mc-util-fill" style={{width:`${m.oee}%`,background:m.oee>=96?'var(--odoo-green)':m.oee>=90?'var(--odoo-orange)':'var(--odoo-red)'}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',overflow:'hidden'}}>
        <table className="fi-data-table">
          <thead><tr>
            <th>Machine</th><th>Available (hrs)</th><th>Running (hrs)</th>
            <th>Downtime (hrs)</th><th>Maintenance (hrs)</th>
            <th>OEE %</th><th>Utilization %</th><th>Grade</th>
          </tr></thead>
          <tbody>
            {MACHINES.map(m=>(
              <tr key={m.mc}>
                <td><strong>{m.mc}</strong></td>
                <td>{m.avail}</td>
                <td style={{color:'var(--odoo-green)',fontWeight:'600'}}>{m.running}</td>
                <td style={{color:'var(--odoo-red)',fontWeight:'600'}}>{m.downtime}</td>
                <td style={{color:'var(--odoo-orange)'}}>{m.maint}</td>
                <td>
                  <span style={{fontWeight:'700',color:m.oee>=96?'var(--odoo-green)':m.oee>=90?'var(--odoo-orange)':'var(--odoo-red)'}}>{m.oee}%</span>
                </td>
                <td>
                  <span style={{fontWeight:'700',color:m.util>=90?'var(--odoo-green)':m.util>=70?'var(--odoo-orange)':'var(--odoo-red)'}}>{m.util}%</span>
                </td>
                <td><span className={`badge ${m.sb}`}>{m.grade}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
