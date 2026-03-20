import React from 'react'
import {useNavigate} from 'react-router-dom'
const VISITORS=[
  {id:'VIS-2026-041',name:'Rajesh Kumar',  company:'TVS Motors',       purpose:'Quality Audit',     host:'Ravi K.',  in:'09:15',out:'12:30',badge:'V-041',status:'checked_out'},
  {id:'VIS-2026-042',name:'Priya Sharma',  company:'Ashok Leyland',     purpose:'Delivery — Parts',  host:'Arjun S.', in:'10:00',out:'—',    badge:'V-042',status:'inside'},
  {id:'VIS-2026-043',name:'Govt. Inspector',company:'Pollution Control',purpose:'Factory Inspection', host:'Admin',    in:'11:30',out:'—',    badge:'V-043',status:'inside'},
  {id:'VIS-2026-044',name:'Suresh B.',     company:'Personal',          purpose:'Meet HR',            host:'Kavitha R.',in:'14:00',out:'—',   badge:'V-044',status:'waiting'},
]
const ST={inside:{label:'🟢 Inside',bg:'#D4EDDA',color:'#155724'},checked_out:{label:' Out',bg:'#E2E3E5',color:'#383D41'},waiting:{label:'⏳ Waiting',bg:'#FFF3CD',color:'#856404'}}
export default function VMDashboard(){
  const nav=useNavigate()
  return(<div>
    <div className="fi-lv-hdr"><div className="fi-lv-title">Visitor Management Dashboard</div><div className="fi-lv-actions"><button className="btn btn-p sd-bsm" onClick={()=>nav('/vm/new')}>+ New Visitor</button></div></div>
    <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
      {[{cls:'purple',l:'Today Visitors',v:'4',s:'Total registered'},{cls:'green',l:'Currently Inside',v:'2',s:'On premises'},{cls:'orange',l:'Waiting',v:'1',s:'At gate'},{cls:'blue',l:'Gate Passes',v:'3',s:'Material movement'}].map(k=>(<div key={k.l} className={`fi-kpi-card ${k.cls}`}><div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div></div>))}
    </div>
    <table className="fi-data-table">
      <thead><tr><th>Visitor ID</th><th>Name</th><th>Company</th><th>Purpose</th><th>Host</th><th>In Time</th><th>Out Time</th><th>Badge</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>{VISITORS.map(v=>{const st=ST[v.status];return(<tr key={v.id}>
        <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)',fontWeight:600}}>{v.id}</td>
        <td style={{fontSize:12,fontWeight:600}}>{v.name}</td><td style={{fontSize:11}}>{v.company}</td>
        <td style={{fontSize:11}}>{v.purpose}</td><td style={{fontSize:11}}>{v.host}</td>
        <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{v.in}</td>
        <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{v.out}</td>
        <td style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:600,color:'var(--odoo-blue)'}}>{v.badge}</td>
        <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:st.bg,color:st.color}}>{st.label}</span></td>
        <td>
          {v.status==='inside' && <button className="btn-xs">Check Out</button>}
          {v.status==='waiting' && <button className="btn-xs pri" style={{background:'var(--odoo-green)',color:'#fff'}}>Check In</button>}
        </td>
      </tr>
    )})}</tbody>
    </table>
  </div>)
}
