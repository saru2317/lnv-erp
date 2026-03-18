import React, { useState } from 'react'
const PAY = [
  {no:'PAY-2025-022',date:'27 Feb',vend:'Aruna Industries',    inv:'VINV-2025-009',amt:'₹48,500', mode:'RTGS',  ref:'UTR987654321',sb:'badge-paid',sl:'Cleared'},
  {no:'PAY-2025-021',date:'25 Feb',vend:'Lakshmi Textiles',    inv:'VINV-2025-010',amt:'₹66,000', mode:'NEFT',  ref:'UTR123456789',sb:'badge-paid',sl:'Cleared'},
  {no:'PAY-2025-020',date:'20 Feb',vend:'Coimbatore Spares',   inv:'VINV-2025-008',amt:'₹32,000', mode:'Cheque',ref:'CHQ-004521',  sb:'badge-paid',sl:'Cleared'},
  {no:'PAY-2025-019',date:'15 Feb',vend:'Sri Murugan Traders', inv:'VINV-2025-006',amt:'₹18,200', mode:'NEFT',  ref:'UTR998877665',sb:'badge-pending',sl:'Processing'},
]
export default function VendorPayments() {
  const [showForm, setShowForm] = useState(false)
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Vendor Payments <small>Outgoing Payments Register</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={() => setShowForm(!showForm)}>Record Payment</button>
        </div>
      </div>
      {showForm && (
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">New Vendor Payment</div>
          <div className="fi-form-sec-body">
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Payment No.</label><input className="fi-form-ctrl" defaultValue="PAY-2025-023" readOnly/></div>
              <div className="fi-form-grp"><label>Vendor <span>*</span></label>
                <select className="fi-form-ctrl"><option>Lakshmi Textile Mills</option><option>Coimbatore Spares</option><option>Aruna Industries</option></select>
              </div>
              <div className="fi-form-grp"><label>Payment Date <span>*</span></label><input type="date" className="fi-form-ctrl" defaultValue="2025-02-28"/></div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Vendor Invoice Ref</label>
                <select className="fi-form-ctrl"><option>VINV-2025-012</option><option>VINV-2025-011</option></select>
              </div>
              <div className="fi-form-grp"><label>TDS Applicable</label>
                <select className="fi-form-ctrl"><option>No TDS</option><option>Sec 194C (1%)</option><option>Sec 194J (10%)</option><option>Sec 194H (5%)</option></select>
              </div>
              <div className="fi-form-grp"><label>Net Amount <span>*</span></label><input type="number" className="fi-form-ctrl" placeholder="0"/></div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Payment Mode</label>
                <select className="fi-form-ctrl"><option>NEFT</option><option>RTGS</option><option>Cheque</option><option>Cash</option></select>
              </div>
              <div className="fi-form-grp"><label>Bank Account</label>
                <select className="fi-form-ctrl"><option>1200 · Bank HDFC Current</option><option>1100 · Cash in Hand</option></select>
              </div>
              <div className="fi-form-grp"><label>UTR / Cheque No.</label><input className="fi-form-ctrl" placeholder="Reference number"/></div>
            </div>
            <div className="fi-form-acts">
              <button className="btn btn-s sd-bsm" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-p sd-bsm" onClick={() => setShowForm(false)}>Save Payment</button>
            </div>
          </div>
        </div>
      )}
      <table className="fi-data-table">
        <thead><tr><th>Payment No.</th><th>Date</th><th>Vendor</th><th>Invoice Ref</th><th>Amount</th><th>Mode</th><th>UTR / Ref</th><th>Status</th></tr></thead>
        <tbody>{PAY.map(r=>(
          <tr key={r.no}>
            <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.no}</strong></td>
            <td>{r.date}</td><td>{r.vend}</td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{r.inv}</td>
            <td style={{fontWeight:'700'}}>{r.amt}</td><td>{r.mode}</td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{r.ref}</td>
            <td><span className={`badge ${r.sb}`}>{r.sl}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
