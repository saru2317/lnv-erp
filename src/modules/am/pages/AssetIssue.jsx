import React from 'react'
const ISSUES = [
  { ref:'AI-2026-012', asset:'FA-007 · Dell Laptop', issuedTo:'Priya S.',   dept:'Finance',    date:'01 Jan 2026', retDate:'—',          reason:'Work laptop',       status:'issued' },
  { ref:'AI-2026-011', asset:'FA-004 · Honda Activa',issuedTo:'Dinesh R.', dept:'Admin',      date:'15 Jan 2026', retDate:'—',          reason:'Office errands',    status:'issued' },
  { ref:'AI-2026-010', asset:'FA-003 · Dell Server', issuedTo:'Karthik M.',dept:'IT',         date:'01 Oct 2022', retDate:'—',          reason:'IT Infrastructure', status:'issued' },
  { ref:'AI-2026-009', asset:'FA-008 · Projector',   issuedTo:'Ravi K.',   dept:'Management', date:'10 Feb 2026', retDate:'28 Feb 2026',reason:'Presentation',      status:'returned' },
]
const ST={issued:{label:'Issued',bg:'#D1ECF1',color:'#0C5460'}, returned:{label:'Returned',bg:'#D4EDDA',color:'#155724'}}
import { useNavigate } from 'react-router-dom'
export default function AssetIssue() {
  const nav = useNavigate()
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Asset Issue / Return</div>
        <div className="fi-lv-actions"><button className="btn btn-s sd-bsm" onClick={()=>nav('/print/invoice')}>Print</button>
          <button className="btn btn-p sd-bsm">+ Issue Asset</button></div>
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Ref No.</th><th>Asset</th><th>Issued To</th><th>Department</th><th>Issue Date</th><th>Return Date</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{ISSUES.map(i=>{const st=ST[i.status]; return (<tr key={i.ref}>
          <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)',fontWeight:600}}>{i.ref}</td>
          <td style={{fontSize:12,fontWeight:600}}>{i.asset}</td>
          <td>{i.issuedTo}</td><td style={{fontSize:11}}>{i.dept}</td>
          <td style={{fontSize:11}}>{i.date}</td><td style={{fontSize:11}}>{i.retDate}</td>
          <td style={{fontSize:11}}>{i.reason}</td>
          <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:st.bg,color:st.color}}>{st.label}</span></td>
          <td>{i.status==='issued'&&<button className="btn-xs">↩ Return</button>}</td>
        </tr>)})}</tbody>
      </table>
    </div>
  )
}
