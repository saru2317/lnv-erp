import React, { useState } from 'react'

const ENTRIES = [
  { date:'17 Mar', veh:'TN38 AB 1234', driver:'Murugan D.', ltrs:45, rate:102, odo:48250, trip:'TRP-2026-048', station:'HP Pump - Gandhipuram' },
  { date:'16 Mar', veh:'TN38 CD 5678', driver:'Selvam D.',  ltrs:80, rate:92,  odo:82100, trip:'TRP-2026-047', station:'BPCL - Avinashi Rd' },
  { date:'15 Mar', veh:'TN38 EF 9012', driver:'Rajan K.',   ltrs:35, rate:92,  odo:31500, trip:'TRP-2026-046', station:'IndianOil - Ukkadam' },
  { date:'14 Mar', veh:'TN38 GH 3456', driver:'Kumar V.',   ltrs:50, rate:92,  odo:62800, trip:'TRP-2026-044', station:'HP Pump - Singanallur' },
]

const SUMMARY = [
  {veh:'TN38 AB 1234', trips:3, ltrs:135,  cost:13770, avg_mileage:'6.2', total_km:840},
  {veh:'TN38 CD 5678', trips:1, ltrs:80,   cost:7360,  avg_mileage:'4.8', total_km:384},
  {veh:'TN38 EF 9012', trips:2, ltrs:70,   cost:6440,  avg_mileage:'7.1', total_km:497},
  {veh:'TN38 GH 3456', trips:1, ltrs:50,   cost:4600,  avg_mileage:'6.8', total_km:340},
]

export default function FuelLog() {
  const [view, setView] = useState('log')
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Fuel Log <small>Monthly tracking & mileage</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>Mar 2026</option><option>Feb 2026</option></select>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/print/fuellog')}>Print Report</button>
          <button className="btn btn-p sd-bsm">Add Fuel Entry</button>
        </div>
      </div>
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
        {[
          {cls:'purple',l:'Total Fuel Cost',  v:'₹42,170', s:'This month'},
          {cls:'blue',  l:'Total Litres',      v:'335 L',   s:'18 fill-ups'},
          {cls:'green', l:'Best Mileage',      v:'7.1 km/L',s:'TN38 EF 9012'},
          {cls:'orange',l:'Total KMs',         v:'2,061',   s:'All vehicles'},
        ].map(k=>(<div key={k.l} className={`fi-kpi-card ${k.cls}`}><div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div></div>))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {[['log','📋 Fuel Entries'],['summary','📊 Vehicle Summary']].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{padding:'6px 16px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid var(--odoo-border)',background:view===k?'var(--odoo-purple)':'#fff',color:view===k?'#fff':'var(--odoo-gray)'}}>{l}</button>
        ))}
      </div>
      {view==='log' && (
        <table className="fi-data-table">
          <thead><tr><th>Date</th><th>Vehicle</th><th>Driver</th><th>Litres</th><th>Rate/L</th><th>Amount</th><th>Odometer</th><th>Trip Ref.</th><th>Bunk / Station</th></tr></thead>
          <tbody>{ENTRIES.map((e,i)=>(<tr key={i}>
            <td>{e.date}</td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:600,color:'var(--odoo-purple)'}}>{e.veh}</td>
            <td>{e.driver}</td>
            <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',color:'var(--odoo-blue)',fontWeight:600}}>{e.ltrs} L</td>
            <td style={{fontFamily:'DM Mono,monospace',textAlign:'right'}}>₹{e.rate}</td>
            <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',fontWeight:700,color:'var(--odoo-dark)'}}>₹{(e.ltrs*e.rate).toLocaleString('en-IN')}</td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{e.odo.toLocaleString('en-IN')} km</td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)'}}>{e.trip}</td>
            <td style={{fontSize:11}}>{e.station}</td>
          </tr>))}</tbody>
        </table>
      )}
      {view==='summary' && (
        <table className="fi-data-table">
          <thead><tr><th>Vehicle</th><th>Trips</th><th>Fuel (L)</th><th>Fuel Cost</th><th>Avg Mileage</th><th>Total KMs</th><th>Cost/km</th></tr></thead>
          <tbody>{SUMMARY.map(s=>(<tr key={s.veh}>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color:'var(--odoo-purple)'}}>{s.veh}</td>
            <td style={{textAlign:'center'}}>{s.trips}</td>
            <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',color:'var(--odoo-blue)'}}>{s.ltrs} L</td>
            <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',fontWeight:700}}>₹{s.cost.toLocaleString('en-IN')}</td>
            <td style={{textAlign:'center',fontWeight:700,color:'var(--odoo-green)'}}>{s.avg_mileage} km/L</td>
            <td style={{fontFamily:'DM Mono,monospace',textAlign:'right'}}>{s.total_km.toLocaleString('en-IN')} km</td>
            <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',color:'var(--odoo-orange)'}}>₹{(s.cost/s.total_km).toFixed(1)}/km</td>
          </tr>))}</tbody>
        </table>
      )}
    </div>
  )
}
