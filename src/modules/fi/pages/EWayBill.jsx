import React, { useState } from 'react'

const EWBS = [
  { no:'EWB-2026-0041', inv:'INV-2026-0082', party:'Ashok Leyland',      mode:'Road',    veh:'TN38AK1234', from:'Ranipet',    to:'Chennai',     val:391680, date:'05 Mar', exp:'08 Mar', status:'active'  },
  { no:'EWB-2026-0042', inv:'INV-2026-0083', party:'TVS Motors',          mode:'Road',    veh:'TN38BK5678', from:'Ranipet',    to:'Hosur',       val:812160, date:'08 Mar', exp:'11 Mar', status:'active'  },
  { no:'EWB-2026-0043', inv:'INV-2026-0081', party:'Coimbatore Spinners', mode:'Road',    veh:'TN37CK9012', from:'Ranipet',    to:'Coimbatore',  val:142800, date:'01 Mar', exp:'04 Mar', status:'expired' },
  { no:'EWB-2026-0044', inv:'PO-2026-0051',  party:'Rajesh Chemicals',    mode:'Rail',    veh:'RAIL-XXXXXX',from:'Chennai',    to:'Ranipet',     val:95000,  date:'10 Mar', exp:'15 Mar', status:'transit' },
  { no:'EWB-2026-0045', inv:'INV-2026-0084', party:'ARS Cotton Mills',    mode:'Road',    veh:'TN38DK3456', from:'Ranipet',    to:'Erode',       val:282068, date:'12 Mar', exp:'15 Mar', status:'delivered'},
]

const ST = {
  active:   {label:'🟢 Active',    bg:'#D4EDDA',color:'#155724'},
  expired:  {label:'🔴 Expired',   bg:'#F8D7DA',color:'#721C24'},
  transit:  {label:'🔵 In Transit',bg:'#D1ECF1',color:'#0C5460'},
  delivered:{label:'✅ Delivered', bg:'#E2E3E5',color:'#383D41'},
}

export default function EWayBill() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">E-Way Bill <small>Goods Movement · Mandatory for value &gt; ₹50,000</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">🔄 Sync Portal</button>
          <button className="btn btn-p sd-bsm">+ Generate EWB</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
        {[
          {cls:'green',  l:'Active EWBs',   v:'2', s:'In transit'},
          {cls:'red',    l:'Expired',        v:'1', s:'Needs extension'},
          {cls:'blue',   l:'Delivered',      v:'1', s:'Completed'},
          {cls:'orange', l:'Expiring Today', v:'2', s:'Action needed'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead>
          <tr><th>EWB No.</th><th>Invoice</th><th>Party</th><th>Mode</th><th>Vehicle</th><th>From</th><th>To</th><th>Value</th><th>Valid Till</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          {EWBS.map(e=>{
            const s=ST[e.status]
            return(
              <tr key={e.no}>
                <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--odoo-purple)'}}>{e.no}</strong></td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{e.inv}</td>
                <td style={{fontSize:12,fontWeight:600}}>{e.party}</td>
                <td>{e.mode}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{e.veh}</td>
                <td>{e.from}</td><td>{e.to}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:600}}>₹{e.val.toLocaleString('en-IN')}</td>
                <td style={{color:e.status==='expired'?'var(--odoo-red)':'var(--odoo-dark)',fontWeight:e.status==='expired'?700:400}}>{e.exp}</td>
                <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:s.bg,color:s.color}}>{s.label}</span></td>
                <td style={{display:'flex',gap:4}}>
                  {e.status==='active'&&<button className="btn-xs">Extend</button>}
                  {e.status==='expired'&&<button className="btn-xs pri">🔄 Renew</button>}
                  <button className="btn-xs">📄 Print</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
