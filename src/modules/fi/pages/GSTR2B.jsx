import React from 'react'
const ROWS = [
  {vinv:'LTM/2025/0124',vend:'Lakshmi Textile Mills',   gstin:'33AABLM9234B1Z6',date:'22 Feb',txbl:'₹1,76,271',cgst:'₹10,576',sgst:'₹10,576',itc:'₹21,152',sb:'badge-posted',sl:'✅ Matched'},
  {vinv:'CS/INV/025',   vend:'Coimbatore Spares Co.',   gstin:'33AABCC2341B1Z1',date:'20 Feb',txbl:'₹75,000', cgst:'₹6,750', sgst:'₹6,750', itc:'₹13,500',sb:'badge-posted',sl:'✅ Matched'},
  {vinv:'AI/2025/045',  vend:'Aruna Industries',         gstin:'33AABCA5631B1Z2',date:'10 Feb',txbl:'₹41,102', cgst:'₹3,699', sgst:'₹3,699', itc:'₹7,398', sb:'badge-partial',sl:'⚠️ Partial'},
]
export default function GSTR2B() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">GSTR-2B <small>Inward Supply Register · Feb 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Download</button>
          <button className="btn btn-p sd-bsm">🔄 Match ITC</button>
        </div>
      </div>
      <div className="fi-alert info">ℹ️ GSTR-2B auto-populated from supplier filings. Verify and match with your purchase register before claiming ITC.</div>
      <table className="fi-data-table">
        <thead><tr><th>Vendor Invoice</th><th>Vendor</th><th>GSTIN</th><th>Invoice Date</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>ITC Eligible</th><th>Match Status</th></tr></thead>
        <tbody>{ROWS.map(r=>(
          <tr key={r.vinv}>
            <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{r.vinv}</strong></td>
            <td>{r.vend}</td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{r.gstin}</td>
            <td>{r.date}</td><td>{r.txbl}</td>
            <td className="cr">{r.cgst}</td><td className="cr">{r.sgst}</td>
            <td style={{color:'var(--odoo-green)',fontWeight:'600'}}>{r.itc}</td>
            <td><span className={`badge ${r.sb}`}>{r.sl}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
