import React from 'react'
const ROWS = [
  {date:'26 Feb',desc:'Receipt from XYZ Industries',  bkDr:'',bkCr:'₹1,85,000',bnkDr:'',bnkCr:'₹1,85,000',sb:'badge-posted',sl:'✅ Matched'},
  {date:'27 Feb',desc:'Payment to Aruna Industries',  bkDr:'₹48,500',bkCr:'',bnkDr:'₹48,500',bnkCr:'',sb:'badge-posted',sl:'✅ Matched'},
  {date:'28 Feb',desc:'Bank charges (in ERP only)',   bkDr:'₹58,500',bkCr:'',bnkDr:'',bnkCr:'',sb:'badge-overdue',sl:'❌ Not in Bank'},
  {date:'28 Feb',desc:'Interest credit (bank only)',  bkDr:'',bkCr:'',bnkDr:'',bnkCr:'₹17,000',sb:'badge-overdue',sl:'❌ Not in Books'},
  {date:'20 Feb',desc:'Receipt from MNO Fabrics',     bkDr:'',bkCr:'₹8,50,000',bnkDr:'',bnkCr:'₹8,50,000',sb:'badge-posted',sl:'✅ Matched'},
]
export default function BankRecon() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Bank Reconciliation <small>HDFC Current Account · Feb 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Import Bank Statement</button>
          <button className="btn btn-p sd-bsm">Reconcile</button>
        </div>
      </div>
      <div className="fi-panel-eq" style={{maxWidth:'700px'}}>
        {[{cls:'green',l:'Book Balance (ERP Ledger)',v:'₹27,56,000',s:'As per LNV ERP'},
          {cls:'blue', l:'Bank Statement Balance',   v:'₹27,14,500',s:'As per bank statement'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>
      <div className="fi-alert warn">⚠️ Difference: <strong>₹41,500</strong> — 2 unmatched transactions. Please review and post adjusting entries.</div>
      <table className="fi-data-table">
        <thead><tr>
          <th>Date</th><th>Description</th>
          <th>Book Dr</th><th>Book Cr</th>
          <th>Bank Dr</th><th>Bank Cr</th>
          <th>Match Status</th><th>Action</th>
        </tr></thead>
        <tbody>{ROWS.map((r,i)=>(
          <tr key={i}>
            <td>{r.date}</td><td>{r.desc}</td>
            <td className="dr">{r.bkDr}</td><td className="cr">{r.bkCr}</td>
            <td className="dr">{r.bnkDr}</td><td className="cr">{r.bnkCr}</td>
            <td><span className={`badge ${r.sb}`}>{r.sl}</span></td>
            <td>
              {r.sl.includes('❌') && <button className="btn-xs pri">Post JV</button>}
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
