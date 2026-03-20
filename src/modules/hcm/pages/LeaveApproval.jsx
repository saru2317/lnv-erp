import React, { useState } from 'react'

const PENDING = [
  {id:'LA-2025-080',emp:'EMP-010',name:'Murugan S.',dept:'Production',type:'CL',from:'05 Mar',to:'05 Mar',days:1,shift:'B',reason:'Family function',balance_cl:10,last3:0},
  {id:'LA-2025-079',emp:'EMP-002',name:'Priya Sharma',dept:'Accounts',type:'EL',from:'10 Mar',to:'14 Mar',days:5,shift:'General',reason:'Annual vacation',balance_el:12,last3:0},
  {id:'LA-2025-076',emp:'EMP-009',name:'Ravi K.',dept:'Maintenance',type:'CL',from:'07 Mar',to:'07 Mar',days:1,shift:'C',reason:'Medical check-up',balance_cl:9,last3:1},
]

export default function LeaveApproval() {
  const [items, setItems] = useState(PENDING)
  const act = (id, action) => setItems(is=>is.filter(x=>x.id!==id))

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Leave Approval <small>{items.length} pending</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>setItems([])}>Approve All</button>
        </div>
      </div>
      {items.length===0 && <div className="pp-alert success">No pending leave approvals! All cleared.</div>}
      {items.map(r=>(
        <div key={r.id} style={{background:'#fff',borderRadius:'10px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',marginBottom:'12px',borderLeft:'4px solid var(--odoo-orange)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'10px'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
                <strong style={{fontFamily:'Syne,sans-serif',fontSize:'15px'}}>{r.name}</strong>
                <span className={`leave-${r.type.toLowerCase()}`}>{r.type} — {r.days} day{r.days>1?'s':''}</span>
              </div>
              <div style={{fontSize:'12px',color:'var(--odoo-gray)'}}>{r.emp} · {r.dept} · Shift: {r.shift}</div>
              <div style={{fontSize:'13px',margin:'8px 0'}}> {r.from} → {r.to} · <strong>{r.reason}</strong></div>
              <div style={{display:'flex',gap:'12px',fontSize:'11px'}}>
                <span style={{color:'var(--odoo-green)',fontWeight:'700'}}>
                  Balance: {r[`balance_${r.type.toLowerCase()}`]} {r.type} days remaining
                </span>
                {r.last3>0 && <span style={{color:'var(--odoo-orange)',fontWeight:'700'}}> {r.last3} leave(s) in last 30 days</span>}
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',flexShrink:0}}>
              <button className="btn btn-p sd-bsm" onClick={()=>act(r.id,'approve')}>Approve</button>
              <button className="btn btn-s sd-bsm" style={{borderColor:'var(--odoo-red)',color:'var(--odoo-red)'}} onClick={()=>act(r.id,'reject')}> Reject</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
