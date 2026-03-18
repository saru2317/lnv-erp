import React from 'react'

const PAYS = [
  {id:'PAY-2025-018',date:'25 Feb 2025',vendor:'Lakshmi Textile Mills',   inv:'VINV-2025-010',amt:'₹66,000', method:'NEFT',   ref:'UTR123456789', b:'mm-bdg-paid',l:'Cleared'},
  {id:'PAY-2025-017',date:'20 Feb 2025',vendor:'Aruna Industries',         inv:'VINV-2025-009',amt:'₹48,500', method:'RTGS',   ref:'UTR987654321', b:'mm-bdg-paid',l:'Cleared'},
  {id:'PAY-2025-016',date:'15 Feb 2025',vendor:'Coimbatore Spares Co.',    inv:'VINV-2025-008',amt:'₹32,000', method:'Cheque', ref:'CHQ-004521',   b:'mm-bdg-paid',l:'Cleared'},
]

export default function PaymentList() {
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Vendor Payments <small>Payment Register</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm">Record Payment</button>
        </div>
      </div>
      <table className="mm-tbl">
        <thead><tr><th>Payment No.</th><th>Date</th><th>Vendor</th><th>Invoice Ref</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th></tr></thead>
        <tbody>
          {PAYS.map(p => (
            <tr key={p.id}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{p.id}</strong></td>
              <td>{p.date}</td><td>{p.vendor}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)'}}>{p.inv}</td>
              <td><strong>{p.amt}</strong></td>
              <td><span className="mm-badge mm-bdg-sent">{p.method}</span></td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{p.ref}</td>
              <td><span className={`mm-badge ${p.b}`}>{p.l}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
