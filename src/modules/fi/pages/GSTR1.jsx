import React from 'react'

const ROWS = [
  {inv:'INV-2025-042',cust:'ABC Textiles Pvt Ltd',  gstin:'33AABCA5631B1Z2',date:'28 Feb',txbl:'₹2,00,000',cgst:'₹18,000',sgst:'₹18,000',igst:'₹0',tot:'₹2,36,000',sb:'badge-posted',sl:'Filed'},
  {inv:'INV-2025-041',cust:'MNO Fabrics Ltd',        gstin:'33AABCM7841B1Z8',date:'24 Feb',txbl:'₹3,00,000',cgst:'₹27,000',sgst:'₹27,000',igst:'₹0',tot:'₹3,54,000',sb:'badge-posted',sl:'Filed'},
  {inv:'INV-2025-040',cust:'XYZ Industries',          gstin:'33AABCX9241B1Z6',date:'22 Feb',txbl:'₹1,57,000',cgst:'₹14,130',sgst:'₹14,130',igst:'₹0',tot:'₹1,85,260',sb:'badge-pending',sl:'Pending'},
  {inv:'INV-2025-039',cust:'PQR Spinning Mills',      gstin:'33AABCP4321B1Z1',date:'18 Feb',txbl:'₹4,20,000',cgst:'₹37,800',sgst:'₹37,800',igst:'₹0',tot:'₹4,95,600',sb:'badge-posted',sl:'Filed'},
]

export default function GSTR1() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">GSTR-1 <small>Outward Supply Register · Feb 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Download JSON</button>
          <button className="btn btn-p sd-bsm">File GSTR-1</button>
        </div>
      </div>
      <div className="fi-kpi-grid">
        {[{cls:'purple',v:'42',l:'B2B Invoices',s:'₹41,20,000 taxable'},
          {cls:'orange',v:'18',l:'B2C Invoices',s:'₹7,40,000 taxable'},
          {cls:'green', v:'₹3,24,000',l:'Total Output GST',s:'CGST + SGST'},
          {cls:'blue',  v:'₹48,000',l:'Credit Notes',s:'3 credit notes'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Invoice No.</th><th>Customer</th><th>GSTIN</th><th>Date</th><th>Taxable Value</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          {ROWS.map(r=>(
            <tr key={r.inv}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.inv}</strong></td>
              <td>{r.cust}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{r.gstin}</td>
              <td>{r.date}</td><td>{r.txbl}</td>
              <td className="cr">{r.cgst}</td><td className="cr">{r.sgst}</td><td>{r.igst}</td>
              <td style={{fontWeight:'700'}}>{r.tot}</td>
              <td><span className={`badge ${r.sb}`}>{r.sl}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
