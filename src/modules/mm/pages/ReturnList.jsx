import React from 'react'

const RETURNS = [
  {id:'RTV-2025-003',date:'24 Feb 2025',grn:'GRN-2025-017',vendor:'Aruna Industries',        mat:'Solvent Chemical',  qty:'5 Litre', reason:'Quality Rejection',      b:'mm-bdg-cancelled',l:'Returned'},
  {id:'RTV-2025-002',date:'18 Feb 2025',grn:'GRN-2025-014',vendor:'Coimbatore Spares Co.',   mat:'Lattice Aprons',    qty:'10 Nos',  reason:'Damaged in Transit',    b:'mm-bdg-cancelled',l:'Returned'},
]

export default function ReturnList() {
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Purchase Returns <small>MIGO-RE · Return to Vendor</small></div>
        <div className="lv-acts"><button className="btn btn-p sd-bsm">＋ New Return</button></div>
      </div>
      <table className="mm-tbl">
        <thead><tr><th>Return No.</th><th>Date</th><th>GRN Ref</th><th>Vendor</th><th>Material</th><th>Return Qty</th><th>Reason</th><th>Status</th></tr></thead>
        <tbody>
          {RETURNS.map(r => (
            <tr key={r.id}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.id}</strong></td>
              <td>{r.date}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{r.grn}</td>
              <td>{r.vendor}</td><td>{r.mat}</td><td>{r.qty}</td>
              <td style={{fontSize:'12px',color:'var(--odoo-orange)'}}>{r.reason}</td>
              <td><span className={`mm-badge ${r.b}`}>{r.l}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
