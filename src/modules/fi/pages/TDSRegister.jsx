import React from 'react'
const TDS = [
  {party:'Lakshmi Textile Mills',pan:'AABLM9234B',sec:'194C',rate:'1%',gross:'₹2,08,000',tds:'₹2,080',net:'₹2,05,920',month:'Feb 2025',sb:'badge-pending',sl:'To Deposit'},
  {party:'Coimbatore Spares Co.',pan:'AABCC2341B',sec:'194C',rate:'1%',gross:'₹89,250', tds:'₹893',   net:'₹88,357', month:'Feb 2025',sb:'badge-pending',sl:'To Deposit'},
  {party:'Aruna Industries',      pan:'AABCA5631B',sec:'194C',rate:'1%',gross:'₹48,500', tds:'₹485',   net:'₹48,015', month:'Feb 2025',sb:'badge-pending',sl:'To Deposit'},
  {party:'Salary — All Employees',pan:'Multiple',  sec:'192B',rate:'Slab',gross:'₹8,40,000',tds:'₹42,000',net:'₹7,98,000',month:'Feb 2025',sb:'badge-pending',sl:'To Deposit'},
  {party:'Lakshmi Textile Mills',pan:'AABLM9234B',sec:'194C',rate:'1%',gross:'₹1,76,271',tds:'₹1,763',net:'₹1,74,508',month:'Jan 2025',sb:'badge-posted',sl:'Deposited'},
  {party:'Salary — All Employees',pan:'Multiple',  sec:'192B',rate:'Slab',gross:'₹8,40,000',tds:'₹42,000',net:'₹7,98,000',month:'Jan 2025',sb:'badge-posted',sl:'Deposited'},
]
export default function TDSRegister() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">TDS Register <small>Tax Deducted at Source · Form 26Q</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Form 26Q Export</button>
          <button className="btn btn-p sd-bsm">Deposit TDS to IT Dept</button>
        </div>
      </div>
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        {[{cls:'red',l:'TDS Payable (Feb)',v:'₹45,458',s:'4 deductions this month'},
          {cls:'green',l:'TDS Deposited (Jan)',v:'₹43,763',s:'Challan generated'},
          {cls:'purple',l:'YTD TDS Deducted',v:'₹3,42,000',s:'FY 2024-25'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>
      <div className="fi-alert warn"> TDS for Feb 2025 (₹45,458) must be deposited by 07 Mar 2025. Avoid interest @ 1.5% per month.</div>
      <table className="fi-data-table">
        <thead><tr><th>Party Name</th><th>PAN</th><th>Section</th><th>Rate</th><th>Gross Amount</th><th>TDS Deducted</th><th>Net Paid</th><th>Month</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{TDS.map((r,i)=>(
          <tr key={i}>
            <td><strong>{r.party}</strong></td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{r.pan}</td>
            <td><span className="badge badge-auto">{r.sec}</span></td>
            <td>{r.rate}</td>
            <td>{r.gross}</td>
            <td className="dr" style={{fontWeight:'700'}}>{r.tds}</td>
            <td>{r.net}</td>
            <td>{r.month}</td>
            <td><span className={`badge ${r.sb}`}>{r.sl}</span></td>
            <td>{r.sl==='To Deposit' && <button className="btn-xs pri">Deposit</button>}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
