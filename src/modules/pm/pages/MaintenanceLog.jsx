import React, { useState } from 'react'

const LOGS = [
  {id:'PMW-2025-011',date:'24 Feb',mc:'OE-02',type:'Breakdown',work:'Rotor bearing replaced — 6205 ZZ bearing fitted',tech:'Suresh M.',hrs:3.5,spares:'₹4,200',total:'₹5,800',sb:'badge-done'},
  {id:'PMW-2025-010',date:'22 Feb',mc:'RFM-01',type:'Breakdown',work:'Control panel fuse replaced, wiring check done',tech:'Kannan E.',hrs:1.5,spares:'₹800',total:'₹2,100',sb:'badge-done'},
  {id:'PMW-2025-009',date:'18 Feb',mc:'CRD-01',type:'Monthly PM',work:'Full monthly PM — lubrication, belt inspection, flat cleaning',tech:'Ravi K.',hrs:4.0,spares:'₹1,200',total:'₹3,400',sb:'badge-done'},
  {id:'PMW-2025-008',date:'15 Feb',mc:'BLW-01',type:'Routine',work:'Feed lattice chain replaced, drive alignment done',tech:'Suresh M.',hrs:2.0,spares:'₹2,400',total:'₹3,800',sb:'badge-done'},
  {id:'PMW-2025-007',date:'10 Feb',mc:'DRW-01',type:'Monthly PM',work:'Drawing frame monthly PM — roll clearance set',tech:'Ravi K.',hrs:3.0,spares:'₹600',total:'₹1,800',sb:'badge-done'},
  {id:'PMW-2025-006',date:'05 Feb',mc:'WND-01',type:'Corrective',work:'Drum drive motor capacitor replaced',tech:'Kannan E.',hrs:2.5,spares:'₹3,200',total:'₹4,600',sb:'badge-done'},
]

export default function MaintenanceLog() {
  const [filter, setFilter] = useState('All')
  const filtered = filter==='All' ? LOGS : LOGS.filter(l=>l.type===filter)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Maintenance Log <small>All completed maintenance activities</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
        </div>
      </div>

      <div className="pp-chips">
        {['All','Breakdown','Monthly PM','Corrective','Routine'].map(c=>(
          <div key={c} className={`pp-chip${filter===c?' on':''}`} onClick={() => setFilter(c)}>{c}</div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>WO No.</th><th>Date</th><th>Machine</th><th>Type</th><th>Work Done</th>
          <th>Technician</th><th>Labour Hrs</th><th>Spares Cost</th><th>Total Cost</th><th>Status</th>
        </tr></thead>
        <tbody>
          {filtered.map(l=>(
            <tr key={l.id}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{l.id}</strong></td>
              <td>{l.date}</td>
              <td><strong>{l.mc}</strong></td>
              <td><span style={{fontSize:'11px',fontWeight:'600',
                color:l.type==='Breakdown'?'var(--odoo-red)':l.type.includes('PM')?'var(--odoo-blue)':'var(--odoo-orange)'}}>{l.type}</span></td>
              <td style={{fontSize:'12px',maxWidth:'200px'}}>{l.work}</td>
              <td>{l.tech}</td>
              <td style={{textAlign:'center'}}>{l.hrs} hrs</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{l.spares}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',color:'var(--odoo-blue)'}}>{l.total}</td>
              <td><span className={`badge ${l.sb}`}>Done</span></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{background:'#F8F9FA',fontWeight:'700'}}>
            <td colSpan={6}>Total ({filtered.length} records)</td>
            <td style={{textAlign:'center'}}>{filtered.reduce((s,l)=>s+l.hrs,0)} hrs</td>
            <td></td>
            <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-blue)'}}>₹{(filtered.reduce((s,l)=>s+parseInt(l.total.replace(/[₹,]/g,'')),0)/100).toFixed(0)}K</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
