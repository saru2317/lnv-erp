import React, { useState } from 'react'
const TASKS=[
  {id:'HK-001',area:'Production Floor A',task:'Sweep & mop entire floor',freq:'Daily',assign:'Mani K.',status:'Done',time:'7:00 AM',sb:'badge-pass'},
  {id:'HK-002',area:'Restrooms (All)',task:'Clean & sanitize',freq:'2x Daily',assign:'Selvi R.',status:'Done',time:'8:00 AM',sb:'badge-pass'},
  {id:'HK-003',area:'Office Block',task:'Vacuum, wipe desks',freq:'Daily',assign:'Mani K.',status:'Pending',time:'9:00 AM',sb:'badge-hold'},
  {id:'HK-004',area:'Canteen',task:'Deep clean kitchen area',freq:'Weekly',assign:'Contractor',status:'Done',time:'6:00 AM',sb:'badge-pass'},
  {id:'HK-005',area:'Machine Area',task:'Oil/grease floor cleanup',freq:'After each shift',assign:'Selvi R.',status:'Pending',time:'2:00 PM',sb:'badge-hold'},
]
export default function HousekeepingLog() {
  const [tasks,setTasks]=useState(TASKS)
  return (
    <div>
      <div className="fi-lv-hdr"><div className="fi-lv-title">Housekeeping Log <small>Today — {new Date().toLocaleDateString()}</small></div>
        <div className="fi-lv-actions"><button className="btn btn-p sd-bsm">Add Task</button></div></div>
      <table className="fi-data-table">
        <thead><tr><th>Task ID</th><th>Area</th><th>Task</th><th>Frequency</th><th>Assigned</th><th>Scheduled</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{tasks.map(t=>(
          <tr key={t.id} style={{background:t.status==='Pending'?'#FFFBF0':'inherit'}}>
            <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{t.id}</strong></td>
            <td><strong>{t.area}</strong></td><td style={{fontSize:'12px'}}>{t.task}</td>
            <td style={{fontSize:'11px'}}>{t.freq}</td><td>{t.assign}</td><td style={{fontSize:'12px'}}>{t.time}</td>
            <td><span className={`badge ${t.sb}`}>{t.status}</span></td>
            <td>{t.status==='Pending'&&<button className="btn-xs pri" onClick={()=>setTasks(ts=>ts.map(x=>x.id===t.id?{...x,status:'Done',sb:'badge-pass'}:x))}>Mark Done</button>}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
