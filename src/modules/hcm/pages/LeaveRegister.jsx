import React, { useState } from 'react'
import { EMPLOYEES } from './_sharedData'

const LEAVE_APPLICATIONS = [
  {id:'LA-2025-082',emp:'EMP-004',name:'Rajesh Kumar', dept:'Production',type:'CL',from:'03 Mar',to:'03 Mar',days:1,reason:'Personal work',status:'Approved',sb:'badge-pass'},
  {id:'LA-2025-081',emp:'EMP-007',name:'Anitha R.',   dept:'HR & Admin', type:'SL',from:'28 Feb',to:'01 Mar',days:2,reason:'Fever - medical certificate attached',status:'Approved',sb:'badge-pass'},
  {id:'LA-2025-080',emp:'EMP-010',name:'Murugan S.',  dept:'Production',type:'CL',from:'05 Mar',to:'05 Mar',days:1,reason:'Family function',status:'Pending',sb:'badge-hold'},
  {id:'LA-2025-079',emp:'EMP-002',name:'Priya Sharma',dept:'Accounts',  type:'EL',from:'10 Mar',to:'14 Mar',days:5,reason:'Annual vacation',status:'Pending',sb:'badge-hold'},
  {id:'LA-2025-078',emp:'EMP-005',name:'Kavitha M.',  dept:'Quality',   type:'SL',from:'20 Feb',to:'21 Feb',days:2,reason:'Viral fever',status:'Approved',sb:'badge-pass'},
]

const BALANCE_DATA = EMPLOYEES.slice(0,6).map(e=>({
  ...e,
  el:12, cl:8, sl:10, fh:5,
  el_availed:3, cl_availed:2, sl_availed:1, fh_availed:0,
}))

export default function LeaveRegister() {
  const [view, setView] = useState('applications')
  const [records, setRecords] = useState(LEAVE_APPLICATIONS)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Leave Register <small>2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" style={{background:view==='balance'?'#EDE0EA':''}} onClick={()=>setView('balance')}>📊 Balances</button>
          <button className="btn btn-s sd-bsm" style={{background:view==='applications'?'#EDE0EA':''}} onClick={()=>setView('applications')}>📋 Applications</button>
          <button className="btn btn-p sd-bsm">➕ Apply Leave</button>
        </div>
      </div>

      {view==='applications' && (
        <table className="fi-data-table">
          <thead><tr>
            <th>Leave ID</th><th>Employee</th><th>Type</th><th>From</th><th>To</th>
            <th>Days</th><th>Reason</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {records.map(r=>(
              <tr key={r.id} style={{background:r.status==='Pending'?'#FFFBF0':'inherit'}}>
                <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.id}</strong></td>
                <td><strong>{r.name}</strong><div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{r.emp} · {r.dept}</div></td>
                <td><span className={`leave-${r.type.toLowerCase()}`}>{r.type}</span></td>
                <td>{r.from}</td><td>{r.to}</td>
                <td style={{textAlign:'center',fontWeight:'700'}}>{r.days} {r.days===1?'day':'days'}</td>
                <td style={{fontSize:'12px',maxWidth:'180px'}}>{r.reason}</td>
                <td><span className={`badge ${r.sb}`}>{r.status}</span></td>
                <td>
                  <div style={{display:'flex',gap:'4px'}}>
                    <button className="btn-xs">View</button>
                    {r.status==='Pending'&&<button className="btn-xs pri"
                      onClick={()=>setRecords(rs=>rs.map(x=>x.id===r.id?{...x,status:'Approved',sb:'badge-pass'}:x))}>Approve</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view==='balance' && (
        <table className="fi-data-table">
          <thead><tr>
            <th>Employee</th><th>Dept</th>
            <th>EL (Earned)</th><th>CL (Casual)</th><th>SL (Sick)</th><th>FH (Festival)</th>
            <th>Total Available</th>
          </tr></thead>
          <tbody>
            {BALANCE_DATA.map(e=>(
              <tr key={e.id}>
                <td><strong>{e.name}</strong><div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{e.id}</div></td>
                <td>{e.dept}</td>
                {[['el','leave-el'],['cl','leave-cl'],['sl','leave-sl'],['fh','leave-fh']].map(([type,cls])=>(
                  <td key={type}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
                      <span style={{fontWeight:'700',color:'var(--odoo-green)',fontSize:'14px'}}>{e[type]-e[`${type}_availed`]}</span>
                      <span className={cls} style={{fontSize:'9px'}}>{e[`${type}_availed`]} used</span>
                    </div>
                  </td>
                ))}
                <td style={{fontWeight:'700',color:'var(--odoo-purple)',textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:'14px'}}>
                  {(e.el-e.el_availed)+(e.cl-e.cl_availed)+(e.sl-e.sl_availed)+(e.fh-e.fh_availed)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
