import React, { useState } from 'react'

const VEHICLES = [
  { reg:'TN38 AB 1234', type:'Innova Crysta',  cat:'Staff/Director',  fuel:'Petrol', cap:'7 Pax',     driver:'Murugan D.',  ins:'31 Dec 2026', fc:'30 Jun 2026', tax:'30 Jun 2026', permit:'31 Dec 2026', odo:48250,  status:'active' },
  { reg:'TN38 CD 5678', type:'10T Lorry',       cat:'Goods Carrier',   fuel:'Diesel', cap:'10 Tonnes', driver:'Selvam D.',   ins:'31 Oct 2026', fc:'30 Sep 2026', tax:'30 Jun 2026', permit:'30 Sep 2026', odo:82100,  status:'on_trip' },
  { reg:'TN38 EF 9012', type:'Mini Van',         cat:'Multi Purpose',   fuel:'Diesel', cap:'5 Pax/1T',  driver:'Rajan K.',   ins:'31 Dec 2026', fc:'30 Sep 2026', tax:'31 Dec 2026', permit:'31 Dec 2026', odo:31500,  status:'active' },
  { reg:'TN38 GH 3456', type:'Bolero',           cat:'Staff/Business',  fuel:'Diesel', cap:'7 Pax',     driver:'Kumar V.',   ins:'30 Jun 2026', fc:'31 Dec 2026', tax:'30 Jun 2026', permit:'31 Dec 2026', odo:62800,  status:'active' },
  { reg:'TN38 IJ 7890', type:'Three Wheeler',    cat:'Courier/Local',   fuel:'CNG',    cap:'150 kg',    driver:'Dinesh R.',  ins:'17 Mar 2026', fc:'17 Mar 2026', tax:'17 Mar 2026', permit:'17 Apr 2026', odo:18400,  status:'due_soon' },
]

const ST = { active:{label:'🟢 Active',bg:'#D4EDDA',color:'#155724'}, on_trip:{label:'🚚 On Trip',bg:'#D1ECF1',color:'#0C5460'}, due_soon:{label:'⚠️ Docs Due',bg:'#FFF3CD',color:'#856404'}, maintenance:{label:'🔧 In Maintenance',bg:'#F8D7DA',color:'#721C24'} }

function isDue(dateStr) {
  const d = new Date(dateStr.split(' ').reverse().join('-').replace(/(\d+) (\w+) (\d+)/,'$3-$2-$1'))
  const diff = (new Date(dateStr) - new Date()) / (1000*60*60*24)
  return diff < 30
}
function docColor(dateStr) {
  // Simple: check if date string contains current or near month
  return dateStr === '17 Mar 2026' ? {color:'var(--odoo-red)',fontWeight:700} : {color:'var(--odoo-dark)'}
}

export default function VehicleMaster() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Vehicle Master <small>Fleet Register & Compliance</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm">+ Add Vehicle</button>
        </div>
      </div>
      <div className="fi-alert warn" style={{marginBottom:14}}>
        ⚠️ <strong>1 vehicle</strong> has documents expiring today/overdue — TN38 IJ 7890. Renew immediately.
      </div>
      <table className="fi-data-table">
        <thead>
          <tr>
            <th>Reg. No.</th><th>Type / Category</th><th>Fuel</th><th>Capacity</th><th>Driver</th>
            <th>Insurance</th><th>FC (Fitness)</th><th>Road Tax</th><th>Permit</th>
            <th>Odometer</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {VEHICLES.map(v=>{
            const st = ST[v.status]
            return (
              <tr key={v.reg}>
                <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{v.reg}</strong></td>
                <td><div style={{fontSize:12,fontWeight:600}}>{v.type}</div><div style={{fontSize:10,color:'var(--odoo-gray)'}}>{v.cat}</div></td>
                <td>{v.fuel}</td>
                <td style={{fontSize:11}}>{v.cap}</td>
                <td style={{fontSize:12}}>{v.driver}</td>
                {[v.ins,v.fc,v.tax,v.permit].map((d,i)=>(
                  <td key={i} style={{fontFamily:'DM Mono,monospace',fontSize:11,...docColor(d)}}>{d}</td>
                ))}
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{v.odo.toLocaleString('en-IN')} km</td>
                <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:st.bg,color:st.color}}>{st.label}</span></td>
                <td><div style={{display:'flex',gap:4}}><button className="btn-xs">✏️ Edit</button><button className="btn-xs">📋 History</button></div></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
