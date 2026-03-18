import React from 'react'
const CALENDAR = [
  {month:'March 2025',items:[{task:'PF Challan (Feb)',due:'15 Mar',type:'PF',status:'Due',sb:'badge-hold'},{task:'ESI Challan (Feb)',due:'15 Mar',type:'ESI',status:'Due',sb:'badge-hold'},{task:'PT Payment (Q4)',due:'31 Mar',type:'PT',status:'Filed',sb:'badge-pass'},{task:'LWF (Annual)',due:'31 Mar',type:'LWF',status:'Filed',sb:'badge-pass'}]},
  {month:'April 2025',items:[{task:'PF Challan (Mar)',due:'15 Apr',type:'PF',status:'Upcoming',sb:'badge-released'},{task:'TDS Form 24Q (Q4)',due:'07 Apr',type:'TDS',status:'Upcoming',sb:'badge-released'},{task:'ESI Return (Oct-Mar)',due:'11 Apr',type:'ESI',status:'Upcoming',sb:'badge-released'},{task:'PF Annual Return',due:'30 Apr',type:'PF',status:'Upcoming',sb:'badge-released'}]},
]
export default function ComplianceCalendar() {
  return (
    <div>
      <div className="fi-lv-hdr"><div className="fi-lv-title">Compliance Calendar <small>All statutory due dates</small></div></div>
      {CALENDAR.map(c=>(
        <div key={c.month} className="fi-panel" style={{marginBottom:'14px'}}>
          <div className="fi-panel-hdr"><h3>📅 {c.month}</h3></div>
          <div style={{padding:'0'}}>
            <table className="fi-data-table" style={{margin:0}}>
              <thead><tr><th>Task</th><th>Type</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{c.items.map(i=>(
                <tr key={i.task}><td><strong>{i.task}</strong></td>
                <td><span style={{background:'#EDE0EA',color:'var(--odoo-purple)',padding:'2px 7px',borderRadius:'4px',fontSize:'11px',fontWeight:'700'}}>{i.type}</span></td>
                <td style={{fontWeight:'700'}}>{i.due}</td>
                <td><span className={`badge ${i.sb}`}>{i.status}</span></td>
                <td><button className="btn-xs">{i.status==='Filed'?'View':'Prepare'}</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
