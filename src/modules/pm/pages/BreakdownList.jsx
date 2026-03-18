import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BDS = [
  {id:'BD-2025-008',date:'28 Feb',mc:'WND-01',name:'Winding Machine',issue:'Bearing failure — vibration high',type:'Mechanical',priority:'High',downtime:18,tech:'Suresh M.',cost:'₹12,400',sb:'badge-hold',sl:'Active'},
  {id:'BD-2025-007',date:'27 Feb',mc:'FB-02',name:'Fiber Bundle M/C',issue:'Belt worn — slippage on drive',type:'Mechanical',priority:'Medium',downtime:4,tech:'Ravi K.',cost:'₹2,800',sb:'badge-progress',sl:'In Progress'},
  {id:'BD-2025-006',date:'24 Feb',mc:'OE-02',name:'OE Spinning M/C',issue:'Rotor bearing noise — replaced',type:'Mechanical',priority:'High',downtime:6,tech:'Suresh M.',cost:'₹8,500',sb:'badge-done',sl:'Resolved'},
  {id:'BD-2025-005',date:'20 Feb',mc:'RFM-01',name:'Ring Frame M/C',issue:'Power trip — control panel fault',type:'Electrical',priority:'High',downtime:3,tech:'Kannan E.',cost:'₹5,200',sb:'badge-done',sl:'Resolved'},
  {id:'BD-2025-004',date:'15 Feb',mc:'BLW-01',name:'Blow Room',issue:'Feed lattice chain break',type:'Mechanical',priority:'Medium',downtime:2,tech:'Ravi K.',cost:'₹1,800',sb:'badge-done',sl:'Resolved'},
  {id:'BD-2025-003',date:'10 Feb',mc:'CRD-01',name:'Carding Machine',issue:'Card flat drive belt slip',type:'Mechanical',priority:'Low',downtime:1.5,tech:'Suresh M.',cost:'₹950',sb:'badge-done',sl:'Resolved'},
]

export default function BreakdownList() {
  const nav = useNavigate()
  const [chip, setChip] = useState('All')

  const filtered = chip==='All' ? BDS : BDS.filter(b => b.sl===chip)
  const totalDown = BDS.reduce((s,b)=>s+b.downtime,0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Breakdown Register <small>Feb 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/pm/breakdown/new')}>🔴 Report Breakdown</button>
        </div>
      </div>

      <div style={{display:'flex',gap:'14px',marginBottom:'16px'}}>
        {[['Total Breakdowns',BDS.length,'var(--odoo-purple)'],
          ['Active',BDS.filter(b=>b.sl==='Active'||b.sl==='In Progress').length,'var(--odoo-red)'],
          ['Total Downtime',`${totalDown} hrs`,'var(--odoo-orange)'],
          ['Avg MTTR',`${(totalDown/BDS.length).toFixed(1)} hrs`,'var(--odoo-blue)'],
        ].map(([l,v,c])=>(
          <div key={l} style={{flex:1,background:'#fff',borderRadius:'8px',padding:'12px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',textAlign:'center'}}>
            <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'4px'}}>{l}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:c}}>{v}</div>
          </div>
        ))}
      </div>

      <div className="pp-chips">
        {['All','Active','In Progress','Resolved'].map(c=>(
          <div key={c} className={`pp-chip${chip===c?' on':''}`} onClick={() => setChip(c)}>
            {c} <span>{c==='All'?BDS.length:BDS.filter(b=>b.sl===c).length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>BD No.</th><th>Date</th><th>Machine</th><th>Issue</th><th>Type</th>
          <th>Priority</th><th>Downtime</th><th>Technician</th><th>Cost</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map(b=>(
            <tr key={b.id} style={{cursor:'pointer',background:b.sl==='Active'?'#FFF5F5':b.sl==='In Progress'?'#FFFBF0':'inherit'}}
              onClick={() => nav('/pm/breakdown/new')}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-red)'}}>{b.id}</strong></td>
              <td>{b.date}</td>
              <td><strong>{b.mc}</strong><div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{b.name}</div></td>
              <td style={{fontSize:'12px',maxWidth:'180px'}}>{b.issue}</td>
              <td><span style={{fontSize:'11px',fontWeight:'600'}}>{b.type}</span></td>
              <td><span style={{fontWeight:'700',fontSize:'12px',
                color:b.priority==='High'?'var(--odoo-red)':b.priority==='Medium'?'var(--odoo-orange)':'var(--odoo-blue)'}}>
                {b.priority==='High'?'🔴':b.priority==='Medium'?'🟡':'🔵'} {b.priority}
              </span></td>
              <td style={{fontWeight:'700',color:b.downtime>8?'var(--odoo-red)':b.downtime>3?'var(--odoo-orange)':'var(--odoo-green)'}}>{b.downtime} hrs</td>
              <td>{b.tech}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{b.cost}</td>
              <td><span className={`badge ${b.sb}`}>{b.sl}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',gap:'4px'}}>
                  <button className="btn-xs">View</button>
                  <button className="btn-xs" onClick={() => nav('/print/breakdown')}>🖨️</button>
                  {b.sl!=='Resolved'&&<button className="btn-xs pri">Resolve</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
