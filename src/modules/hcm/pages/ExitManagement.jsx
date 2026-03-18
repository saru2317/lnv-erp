import React, { useState } from 'react'
const EXIT_LIST=[
  {id:'EXIT-2025-003',emp:'EMP-012',name:'Ranjith S.',dept:'Production',type:'Resignation',lwd:'28 Feb',notice:'3 months',noticel:'Served',fnf:'Pending',sb:'badge-hold'},
  {id:'EXIT-2025-002',emp:'EMP-008',name:'Vijay A.',dept:'Sales',type:'Retirement',lwd:'31 Mar',notice:'N/A',noticel:'N/A',fnf:'Initiated',sb:'badge-progress'},
]
const CHECKLIST=['Resignation letter accepted','Notice period tracked','Exit interview done','ID card returned','Biometric deactivated','Access cards cancelled','Asset handover completed','Pending claims settled','PF transfer/withdrawal initiated','Form 16 issued','F&F settlement done','Experience letter issued']
export default function ExitManagement() {
  const [checks,setChecks]=useState(CHECKLIST.map((c,i)=>({label:c,done:i<4})))
  return (
    <div>
      <div className="fi-lv-hdr"><div className="fi-lv-title">Exit Management <small>F&F · Separation</small></div>
        <div className="fi-lv-actions"><button className="btn btn-p sd-bsm">New Exit</button></div></div>
      <table className="fi-data-table" style={{marginBottom:'20px'}}>
        <thead><tr><th>Exit ID</th><th>Employee</th><th>Dept</th><th>Type</th><th>Last Working Day</th><th>Notice</th><th>F&F Status</th><th>Actions</th></tr></thead>
        <tbody>{EXIT_LIST.map(e=>(
          <tr key={e.id}><td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{e.id}</strong></td>
          <td><strong>{e.name}</strong><div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{e.emp}</div></td>
          <td>{e.dept}</td><td><span style={{fontWeight:'700',color:e.type==='Resignation'?'var(--odoo-orange)':'var(--odoo-blue)'}}>{e.type}</span></td>
          <td style={{fontWeight:'700'}}>{e.lwd}</td>
          <td><span style={{fontSize:'12px',color:e.noticel==='Served'?'var(--odoo-green)':e.noticel==='N/A'?'var(--odoo-gray)':'var(--odoo-orange)'}}>{e.noticel}</span></td>
          <td><span className={`badge ${e.sb}`}>{e.fnf}</span></td>
          <td><button className="btn-xs pri">Process F&F</button></td></tr>
        ))}</tbody>
      </table>
      <div className="fi-panel"><div className="fi-panel-hdr"><h3>Exit Checklist — EMP-012 Ranjith S.</h3></div>
        <div className="fi-panel-body">
          <div style={{marginBottom:'8px',fontSize:'12px',color:'var(--odoo-gray)'}}>
            Completed: {checks.filter(c=>c.done).length}/{checks.length} items
          </div>
          <div style={{background:'#F0EEEB',borderRadius:'4px',height:'7px',marginBottom:'14px'}}>
            <div style={{width:`${checks.filter(c=>c.done).length/checks.length*100}%`,height:'100%',borderRadius:'4px',background:'var(--odoo-green)'}}></div>
          </div>
          {checks.map((c,i)=>(
            <div key={c.label} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid var(--odoo-border)',
              background:c.done?'#F0FFF8':'inherit',borderRadius:c.done?'4px':'0',paddingLeft:c.done?'8px':'0',transition:'all .2s'}}>
              <input type="checkbox" checked={c.done} onChange={()=>setChecks(cs=>cs.map((x,j)=>j===i?{...x,done:!x.done}:x))}
                style={{width:'18px',height:'18px',accentColor:'var(--odoo-green)',cursor:'pointer'}}/>
              <span style={{fontSize:'13px',fontWeight:'600',textDecoration:c.done?'line-through':'none',color:c.done?'var(--odoo-gray)':'var(--odoo-dark)'}}>{c.label}</span>
              {c.done&&<span style={{marginLeft:'auto',color:'var(--odoo-green)'}}>✅</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
