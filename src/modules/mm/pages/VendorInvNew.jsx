import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function VendorInvNew() {
  const nav = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Enter Vendor Invoice <small>MIRO · Invoice Verification</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/invoices')}>✕ Cancel</button>
          <button className="btn btn-s sd-bsm">Save Draft</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/invoices')}>Post Invoice</button>
        </div>
      </div>
      <div className="mm-fs">
        <div className="mm-fsh">Invoice Header</div>
        <div className="mm-fsb">
          <div className="mm-fr3">
            <div className="mm-fg"><label>Invoice No. (Internal)</label><input className="mm-fc" defaultValue="VINV-2025-013" readOnly/></div>
            <div className="mm-fg"><label>Vendor Invoice No. <span>*</span></label><input className="mm-fc" placeholder="e.g. LTM/2025/0125"/></div>
            <div className="mm-fg"><label>Invoice Date <span>*</span></label><input type="date" className="mm-fc" defaultValue="2025-02-28"/></div>
          </div>
          <div className="mm-fr3">
            <div className="mm-fg"><label>Reference PO / GRN <span>*</span></label>
              <select className="mm-fc">
                <option>-- Select PO/GRN --</option>
                <option selected>PO-2025-040 / GRN-2025-018 · Sri Murugan Traders</option>
                <option>PO-2025-037 / GRN-2025-016 · Shree Cotton Mills</option>
              </select></div>
            <div className="mm-fg"><label>Vendor</label><input className="mm-fc" defaultValue="Sri Murugan Traders" readOnly/></div>
            <div className="mm-fg"><label>Due Date</label><input type="date" className="mm-fc" defaultValue="2025-03-30"/></div>
          </div>
          <div className="mm-fr3">
            <div className="mm-fg"><label>Vendor GSTIN</label><input className="mm-fc" defaultValue="33AABCS9871B1Z4" readOnly/></div>
            <div className="mm-fg"><label>Place of Supply</label>
              <select className="mm-fc"><option>33 - Tamil Nadu (Intrastate)</option><option>27 - Maharashtra</option></select></div>
            <div className="mm-fg"><label>Payment Method</label>
              <select className="mm-fc"><option>Bank Transfer (NEFT/RTGS)</option><option>Cheque</option><option>UPI</option><option>Cash</option></select></div>
          </div>
        </div>
      </div>
      <div className="mm-fs">
        <div className="mm-fsh">Invoice Line Items (from GRN)</div>
        <div className="mm-fsb" style={{padding:'0'}}>
          <div className="mm-lt-wrap">
            <table className="mm-lt">
              <thead><tr><th>#</th><th>HSN</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Taxable</th><th>GST%</th><th>CGST</th><th>SGST</th><th>Total</th><th>PO Match</th></tr></thead>
              <tbody>
                <tr>
                  <td>1</td><td>4819 10 10</td><td>Packing Boxes — Double Wall</td>
                  <td>1000</td><td>Nos</td><td>₹200</td><td>₹2,00,000</td><td>18%</td>
                  <td>₹18,000</td><td>₹18,000</td><td><strong>₹2,36,000</strong></td>
                  <td><span className="mm-badge mm-bdg-approved">Matched</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <div className="mm-tot-box" style={{width:'280px'}}>
              <div className="mm-tot-row"><span className="tl">Subtotal</span><span>₹2,00,000</span></div>
              <div className="mm-tot-row"><span className="tl">CGST (18%)</span><span>₹18,000</span></div>
              <div className="mm-tot-row"><span className="tl">SGST (18%)</span><span>₹18,000</span></div>
              <div className="mm-tot-row"><span className="tl">TDS Deductible</span><span><input type="number" style={{width:'80px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'3px 7px'}} defaultValue="0"/></span></div>
              <div className="mm-tot-row grand"><span className="tl"><strong>Invoice Total</strong></span><span className="tv">₹2,36,000</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="mm-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/invoices')}>✕ Cancel</button>
        <button className="btn btn-s sd-bsm">Save Draft</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/invoices')}>Post Invoice</button>
        <div className="mm-flow">
          <span className="mm-fs-step done">GRN Done</span><span className="mm-fs-arr">›</span>
          <span className="mm-fs-step act">Invoice Entry</span><span className="mm-fs-arr">›</span>
          <span className="mm-fs-step">Verification</span><span className="mm-fs-arr">›</span>
          <span className="mm-fs-step">Payment</span>
        </div>
      </div>
    </div>
  )
}
