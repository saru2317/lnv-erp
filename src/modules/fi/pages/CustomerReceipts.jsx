import React, { useState } from 'react'
const REC = [
  {no:'REC-2025-031',date:'26 Feb',cust:'XYZ Industries',    inv:'INV-2025-038',amt:'₹1,85,000',mode:'NEFT',  ref:'UTR192837465',sb:'badge-paid',sl:'Cleared'},
  {no:'REC-2025-030',date:'20 Feb',cust:'MNO Fabrics',        inv:'INV-2025-035',amt:'₹8,50,000',mode:'RTGS',  ref:'UTR564738291',sb:'badge-paid',sl:'Cleared'},
  {no:'REC-2025-029',date:'15 Feb',cust:'ABC Textiles',       inv:'INV-2025-031',amt:'₹4,72,000',mode:'Cheque',ref:'CHQ-009832',  sb:'badge-paid',sl:'Cleared'},
  {no:'REC-2025-028',date:'10 Feb',cust:'PQR Spinning',       inv:'INV-2025-026',amt:'₹2,10,000',mode:'NEFT',  ref:'UTR112233445',sb:'badge-pending',sl:'Uncleared'},
]
export default function CustomerReceipts() {
  const [showForm, setShowForm] = useState(false)
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Customer Receipts <small>Incoming Payments Register</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={() => setShowForm(!showForm)}>💰 Record Receipt</button>
        </div>
      </div>
      {showForm && (
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">💰 New Receipt Entry</div>
          <div className="fi-form-sec-body">
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Receipt No.</label><input className="fi-form-ctrl" defaultValue="REC-2025-032" readOnly/></div>
              <div className="fi-form-grp"><label>Customer <span>*</span></label>
                <select className="fi-form-ctrl"><option>ABC Textiles Pvt Ltd</option><option>MNO Fabrics</option><option>XYZ Industries</option></select>
              </div>
              <div className="fi-form-grp"><label>Receipt Date <span>*</span></label><input type="date" className="fi-form-ctrl" defaultValue="2025-02-28"/></div>
            </div>
            <div className="fi-form-row">
              <div className="fi-form-grp"><label>Invoice Reference</label>
                <select className="fi-form-ctrl"><option>INV-2025-042</option><option>INV-2025-041</option></select>
              </div>
              <div className="fi-form-grp"><label>Amount <span>*</span></label><input type="number" className="fi-form-ctrl" placeholder="0"/></div>
              <div className="fi-form-grp"><label>Payment Mode</label>
                <select className="fi-form-ctrl"><option>NEFT</option><option>RTGS</option><option>Cheque</option><option>Cash</option><option>UPI</option></select>
              </div>
            </div>
            <div className="fi-form-row2">
              <div className="fi-form-grp"><label>UTR / Cheque / Ref No.</label><input className="fi-form-ctrl" placeholder="UTR number or cheque number"/></div>
              <div className="fi-form-grp"><label>Bank Account</label>
                <select className="fi-form-ctrl"><option>1200 · Bank HDFC Current</option><option>1100 · Cash in Hand</option></select>
              </div>
            </div>
            <div className="fi-form-acts">
              <button className="btn btn-s sd-bsm" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-p sd-bsm" onClick={() => setShowForm(false)}>✅ Save Receipt</button>
            </div>
          </div>
        </div>
      )}
      <table className="fi-data-table">
        <thead><tr><th>Receipt No.</th><th>Date</th><th>Customer</th><th>Invoice Ref</th><th>Amount</th><th>Mode</th><th>UTR / Ref</th><th>Status</th></tr></thead>
        <tbody>{REC.map(r=>(
          <tr key={r.no}>
            <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.no}</strong></td>
            <td>{r.date}</td><td>{r.cust}</td>
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
