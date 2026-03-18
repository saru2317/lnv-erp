import React, { useState } from 'react'
const VISITORS=[
  {id:'VIS-082',name:'Suresh Rajan',org:'SKF Bearings Ltd',purpose:'Spare parts delivery',in:'09:15',out:'10:20',badge:'A-12',host:'Suresh M.',sb:'badge-done'},
  {id:'VIS-081',name:'Kavitha Nair',org:'Rajiv Chemicals',purpose:'Commercial visit',in:'11:00',out:'11:45',badge:'B-08',host:'Priya S.',sb:'badge-done'},
  {id:'VIS-080',name:'Audit Team (3)',org:'TN Tax Dept',purpose:'GST Audit',in:'10:00',out:'—',badge:'C-01,02,03',host:'Admin Kumar',sb:'badge-progress'},
]
export default function SecurityLog() {
  const [records,setRecords]=useState(VISITORS)
  return (
    <div>
      <div className="fi-lv-hdr"><div className="fi-lv-title">Security & Gate Log <small>{new Date().toLocaleDateString()}</small></div>
        <div className="fi-lv-actions"><button className="btn btn-p sd-bsm">➕ Visitor Entry</button></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
        {[['Visitors Today',records.length,'var(--odoo-purple)'],['Inside Now',records.filter(v=>v.out==='—').length,'var(--odoo-orange)'],['Exited',records.filter(v=>v.out!=='—').length,'var(--odoo-green)']].map(([l,v,c])=>(
          <div key={l} style={{background:'#fff',borderRadius:'8px',padding:'12px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',borderLeft:`4px solid ${c}`,textAlign:'center'}}>
            <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'4px'}}>{l}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'22px',fontWeight:'800',color:c}}>{v}</div>
          </div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Visitor ID</th><th>Name</th><th>Organization</th><th>Purpose</th><th>In Time</th><th>Out Time</th><th>Badge No.</th><th>Host</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{records.map(v=>(
          <tr key={v.id} style={{background:v.out==='—'?'#EBF5FB':'inherit'}}>
            <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{v.id}</strong></td>
            <td><strong>{v.name}</strong></td><td style={{fontSize:'12px'}}>{v.org}</td><td style={{fontSize:'12px'}}>{v.purpose}</td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-green)'}}>{v.in}</td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:v.out==='—'?'var(--odoo-orange)':'var(--odoo-gray)'}}>{v.out}</td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{v.badge}</td><td>{v.host}</td>
            <td><span className={`badge ${v.sb}`}>{v.out==='—'?'Inside':'Exited'}</span></td>
            <td>{v.out==='—'&&<button className="btn-xs pri" onClick={()=>setRecords(rs=>rs.map(x=>x.id===v.id?{...x,out:new Date().toTimeString().slice(0,5),sb:'badge-done'}:x))}>Exit</button>}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
