import React, { useState } from 'react'
const JOBS = [
  {id:'J-2026-047', item:'Epoxy Coat — TVS Bracket',   batch:500,  done:500,  rej:8,   eff:98.4, days:3, cost:42000,  status:'completed'},
  {id:'J-2026-046', item:'Powder Coat RAL9005 — Ashok',batch:1200, done:1200, rej:14,  eff:98.8, days:2, cost:98400,  status:'completed'},
  {id:'J-2026-045', item:'Zinc Plate — Sri Lakshmi',   batch:800,  done:750,  rej:12,  eff:98.4, days:5, cost:61600,  status:'in_progress'},
  {id:'J-2026-044', item:'Surface Treat — Rajesh Tex', batch:600,  done:600,  rej:6,   eff:99.0, days:2, cost:43200,  status:'completed'},
  {id:'J-2026-043', item:'Epoxy — Karan Industries',   batch:400,  done:320,  rej:8,   eff:97.5, days:4, cost:31200,  status:'in_progress'},
]
const MONTHLY = [
  {m:'Oct',jobs:42, qty:38400, rej:480, eff:98.7, cost:3240000},
  {m:'Nov',jobs:48, qty:44200, rej:520, eff:98.8, cost:3720000},
  {m:'Dec',jobs:38, qty:35600, rej:480, eff:98.7, cost:2980000},
  {m:'Jan',jobs:52, qty:48000, rej:560, eff:98.8, cost:4020000},
  {m:'Feb',jobs:48, qty:44800, rej:520, eff:98.8, cost:3760000},
  {m:'Mar',jobs:55, qty:51200, rej:580, eff:98.9, cost:4280000},
]
const ST={completed:{label:'✅ Done',bg:'#D4EDDA',c:'#155724'},in_progress:{label:'🔄 WIP',bg:'#D1ECF1',c:'#0C5460'}}
const fmtL=n=>'₹'+(n/100000).toFixed(1)+'L'
export default function ProductionReport(){
  const [view,setView]=useState('summary')
  return(
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Production Report <small>PP Module · Job Analytics</small></div>
        <div className="fi-lv-actions"><button className="btn btn-s sd-bsm">⬇️ Export</button></div>
      </div>
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:16}}>
        {[
          {cls:'purple',l:'Jobs MTD',       v:'55',     s:'Mar 2026'},
          {cls:'green', l:'Qty Processed',  v:'51,200', s:'Units this month'},
          {cls:'blue',  l:'Quality Pass',   v:'98.9%',  s:'Rejection rate 1.1%'},
          {cls:'orange',l:'Avg Cycle Time', v:'2.8 days',s:'Per job'},
          {cls:'red',   l:'Production Cost',v:fmtL(4280000),s:'MTD'},
        ].map(k=>(<div key={k.l} className={`fi-kpi-card ${k.cls}`}><div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div></div>))}
      </div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {[['summary','📊 Monthly'],['jobs','🏭 Job-wise']].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{padding:'6px 16px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid var(--odoo-border)',background:view===k?'var(--odoo-purple)':'#fff',color:view===k?'#fff':'var(--odoo-gray)'}}>{l}</button>
        ))}
      </div>
      {view==='summary'&&(
        <table className="fi-data-table">
          <thead><tr><th>Month</th><th>Jobs</th><th>Qty Processed</th><th>Rejections</th><th>Efficiency</th><th>Production Cost</th></tr></thead>
          <tbody>{MONTHLY.map((m,i)=>(
            <tr key={m.m} style={{background:i===MONTHLY.length-1?'#EDE0EA':'',fontWeight:i===MONTHLY.length-1?700:400}}>
              <td style={{fontWeight:600}}>{m.m}</td>
              <td style={{textAlign:'center'}}>{m.jobs}</td>
              <td style={{fontFamily:'DM Mono,monospace',textAlign:'right'}}>{m.qty.toLocaleString('en-IN')}</td>
              <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',color:'var(--odoo-red)'}}>{m.rej}</td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:70,height:5,background:'var(--odoo-border)',borderRadius:3}}>
                    <div style={{height:'100%',borderRadius:3,background:'var(--odoo-green)',width:`${m.eff}%`}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:'var(--odoo-green)'}}>{m.eff}%</span>
                </div>
              </td>
              <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)'}}>{fmtL(m.cost)}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
      {view==='jobs'&&(
        <table className="fi-data-table">
          <thead><tr><th>Job No.</th><th>Item</th><th>Batch Qty</th><th>Done</th><th>Rejected</th><th>Efficiency</th><th>Cycle (days)</th><th>Cost</th><th>Status</th></tr></thead>
          <tbody>{JOBS.map(j=>{const st=ST[j.status];return(
            <tr key={j.id}>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)',fontWeight:600}}>{j.id}</td>
              <td style={{fontSize:12,fontWeight:600,maxWidth:200}}>{j.item}</td>
              <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{j.batch}</td>
              <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'var(--odoo-green)',fontWeight:600}}>{j.done}</td>
              <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:j.rej>0?'var(--odoo-red)':'var(--odoo-green)'}}>{j.rej}</td>
              <td style={{color:'var(--odoo-green)',fontWeight:600}}>{j.eff}%</td>
              <td style={{textAlign:'center'}}>{j.days}d</td>
              <td style={{fontFamily:'DM Mono,monospace',fontWeight:700}}>{fmtL(j.cost)}</td>
              <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:st.bg,color:st.c}}>{st.label}</span></td>
            </tr>
          )})}</tbody>
        </table>
      )}
    </div>
  )
}
