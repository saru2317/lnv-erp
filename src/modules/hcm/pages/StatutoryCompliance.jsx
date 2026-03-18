import React from 'react'
const ITEMS = [
  {type:'Professional Tax (PT)',authority:'TN Commercial Tax',employees:148,amount:'₹22,200',due:'31 Mar 2025',filed:'✅ Filed',sb:'badge-pass'},
  {type:'TDS on Salary (Form 24Q)',authority:'Income Tax Dept',employees:12,amount:'₹48,600',due:'07 Apr 2025',filed:'— Pending',sb:'badge-hold'},
  {type:'Labour Welfare Fund (LWF)',authority:'TN Labour Dept',employees:148,amount:'₹1,480',due:'31 Jan 2025',filed:'✅ Filed',sb:'badge-pass'},
  {type:'Minimum Wages Register',authority:'TN Labour Dept',employees:148,amount:'Display only',due:'Always current',filed:'✅ Maintained',sb:'badge-pass'},
  {type:'ESI Return (Form 5)',authority:'ESIC',employees:62,amount:'₹12,400',due:'11 Apr 2025',filed:'— Pending',sb:'badge-hold'},
  {type:'PF Annual Return',authority:'EPFO',employees:148,amount:'Annual',due:'30 Apr 2025',filed:'— Pending',sb:'badge-hold'},
]
export default function StatutoryCompliance() {
  return (
    <div>
      <div className="fi-lv-hdr"><div className="fi-lv-title">PT / TDS / LWF Compliance <small>Statutory Obligations</small></div></div>
      <div className="pp-alert info">🏛️ Tamil Nadu applicable statutes: PT · LWF · ESI · PF · TDS · Shops & Establishment · Factories Act · Minimum Wages</div>
      <table className="fi-data-table">
        <thead><tr><th>Statute</th><th>Authority</th><th>Employees</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{ITEMS.map(i=>(
          <tr key={i.type} style={{background:i.filed.includes('Pending')?'#FFFBF0':'inherit'}}>
            <td><strong>{i.type}</strong></td><td style={{fontSize:'12px'}}>{i.authority}</td>
            <td style={{textAlign:'center'}}>{i.employees}</td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{i.amount}</td>
            <td style={{fontWeight:i.filed.includes('Pending')?'700':'400',color:i.filed.includes('Pending')?'var(--odoo-orange)':'inherit'}}>{i.due}</td>
            <td><span className={`badge ${i.sb}`}>{i.filed}</span></td>
            <td><button className="btn-xs pri">{i.filed.includes('Pending')?'File Now':'View'}</button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
