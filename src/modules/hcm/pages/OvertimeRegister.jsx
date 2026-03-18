import React, { useState } from 'react'

const OT_RECORDS = [
  {id:'OT-2025-082',emp:'EMP-004',name:'Rajesh Kumar',  dept:'Production',type:'Worker',shift:'B',date:'28 Feb',hrs:3.5,approved_hrs:3.5,ot_rate:2,basic_hourly:47.6,ot_pay:333,status:'Approved',sb:'badge-pass'},
  {id:'OT-2025-081',emp:'EMP-003',name:'Suresh M.',     dept:'Maintenance',type:'Worker',shift:'A',date:'27 Feb',hrs:4,approved_hrs:4,ot_rate:2,basic_hourly:56.2,ot_pay:450,status:'Approved',sb:'badge-pass'},
  {id:'OT-2025-080',emp:'EMP-006',name:'Kannan E.',     dept:'Maintenance',type:'Worker',shift:'A',date:'27 Feb',hrs:2,approved_hrs:2,ot_rate:2,basic_hourly:52.4,ot_pay:210,status:'Approved',sb:'badge-pass'},
  {id:'OT-2025-079',emp:'EMP-010',name:'Murugan S.',    dept:'Production',type:'Worker',shift:'B',date:'26 Feb',hrs:2.5,approved_hrs:2.5,ot_rate:2,basic_hourly:42.9,ot_pay:214,status:'Approved',sb:'badge-pass'},
  {id:'OT-2025-078',emp:'EMP-009',name:'Ravi K.',       dept:'Maintenance',type:'Worker',shift:'C',date:'25 Feb',hrs:3,approved_hrs:2.5,ot_rate:2.5,basic_hourly:50,ot_pay:313,status:'Approved',sb:'badge-pass'},
  {id:'OT-2025-077',emp:'EMP-001',name:'Ramesh Kumar',  dept:'Production',type:'Staff',shift:'General',date:'25 Feb',hrs:4,approved_hrs:3,ot_rate:1.5,basic_hourly:108.2,ot_pay:487,status:'Pending',sb:'badge-hold'},
  {id:'OT-2025-076',emp:'EMP-005',name:'Kavitha M.',    dept:'Quality',type:'Staff',shift:'General',date:'24 Feb',hrs:2,approved_hrs:0,ot_rate:1.5,basic_hourly:62.5,ot_pay:0,status:'Pending',sb:'badge-hold'},
]

export default function OvertimeRegister() {
  const [chip, setChip] = useState('All')
  const [records, setRecords] = useState(OT_RECORDS)

  const approve = (id) => setRecords(recs => recs.map(r => r.id===id ? {...r,status:'Approved',approved_hrs:r.hrs,ot_pay:Math.round(r.basic_hourly*r.hrs*r.ot_rate),sb:'badge-pass'} : r))
  const reject = (id) => setRecords(recs => recs.map(r => r.id===id ? {...r,status:'Rejected',sb:'badge-fail'} : r))

  const filtered = chip==='All' ? records : records.filter(r=>r.status===chip)
  const totalOT = records.filter(r=>r.status==='Approved').reduce((s,r)=>s+r.hrs,0)
  const totalPay = records.filter(r=>r.status==='Approved').reduce((s,r)=>s+r.ot_pay,0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Overtime Register <small>February 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm">Push to Payroll</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'16px'}}>
        {[['Total OT Hours',`${totalOT} hrs`,'var(--odoo-purple)'],
          ['Pending Approval',records.filter(r=>r.status==='Pending').length,'var(--odoo-orange)'],
          ['OT Employees',new Set(records.map(r=>r.emp)).size,'var(--odoo-blue)'],
          ['OT Pay (MTD)',`₹${totalPay.toLocaleString()}`,'var(--odoo-green)'],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:'#fff',borderRadius:'8px',padding:'12px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',borderLeft:`4px solid ${c}`}}>
            <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'4px'}}>{l}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:c}}>{v}</div>
          </div>
        ))}
      </div>

      <div className="pp-chips">
        {['All','Approved','Pending','Rejected'].map(c=>(
          <div key={c} className={`pp-chip${chip===c?' on':''}`} onClick={()=>setChip(c)}>
            {c} <span>{c==='All'?records.length:records.filter(r=>r.status===c).length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>OT Ref</th><th>Employee</th><th>Type</th><th>Shift</th><th>Date</th>
          <th>Claimed Hrs</th><th>Approved Hrs</th><th>OT Rate</th><th>OT Pay</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map(r=>(
            <tr key={r.id} style={{background:r.status==='Pending'?'#FFFBF0':'inherit'}}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.id}</strong></td>
              <td>
                <div style={{fontWeight:'700',fontSize:'12px'}}>{r.name}</div>
                <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{r.emp} · {r.dept}</div>
              </td>
              <td><span style={{fontSize:'11px',fontWeight:'700',color:r.type==='Worker'?'var(--odoo-orange)':'var(--odoo-blue)'}}>{r.type}</span></td>
              <td><span className={`shift-${r.shift.toLowerCase().replace('general','gen')}`}>{r.shift}</span></td>
              <td>{r.date}</td>
              <td style={{textAlign:'center',fontWeight:'700',fontFamily:'DM Mono,monospace'}}>{r.hrs} hrs</td>
              <td style={{textAlign:'center',fontWeight:'700',color:r.approved_hrs<r.hrs?'var(--odoo-orange)':'var(--odoo-green)',fontFamily:'DM Mono,monospace'}}>
                {r.approved_hrs || '—'}
              </td>
              <td style={{textAlign:'center',color:'var(--odoo-blue)',fontWeight:'700'}}>{r.ot_rate}×</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',color:r.ot_pay>0?'var(--odoo-green)':'var(--odoo-gray)'}}>
                {r.ot_pay>0?`₹${r.ot_pay}`:'—'}
              </td>
              <td><span className={`badge ${r.sb}`}>{r.status}</span></td>
              <td>
                {r.status==='Pending' && (
                  <div style={{display:'flex',gap:'4px'}}>
                    <button className="btn-xs pri" onClick={()=>approve(r.id)}>Approve</button>
                    <button className="btn-xs" onClick={()=>reject(r.id)} style={{color:'var(--odoo-red)'}}>❌</button>
                  </div>
                )}
                {r.status!=='Pending' && <button className="btn-xs">View</button>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{background:'#F8F9FA',fontWeight:'700'}}>
            <td colSpan={5}>Total Approved OT</td>
            <td colSpan={2} style={{textAlign:'center',fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)'}}>
              {records.filter(r=>r.status==='Approved').reduce((s,r)=>s+r.hrs,0)} hrs
            </td>
            <td></td>
            <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>₹{totalPay.toLocaleString()}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
