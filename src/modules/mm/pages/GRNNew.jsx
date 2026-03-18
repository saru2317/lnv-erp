import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function GRNNew() {
  const nav = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Record Goods Receipt <small>MIGO · GRN Entry</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/grn')}>✕ Cancel</button>
          <button className="btn btn-s sd-bsm">💾 Save Draft</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/grn')}>✅ Post GRN</button>
        </div>
      </div>

      <div className="mm-fs">
        <div className="mm-fsh">📦 GRN Header — Link to Purchase Order</div>
        <div className="mm-fsb">
          <div className="mm-fr3">
            <div className="mm-fg"><label>GRN Number</label><input className="mm-fc" defaultValue="GRN-2025-019" readOnly/></div>
            <div className="mm-fg"><label>GRN Date <span>*</span></label><input type="date" className="mm-fc" defaultValue="2025-02-28"/></div>
            <div className="mm-fg"><label>Reference PO <span>*</span></label>
              <select className="mm-fc">
                <option value="">-- Select PO --</option>
                <option selected>PO-2025-042 · Lakshmi Textile Mills · ₹4,85,000</option>
                <option>PO-2025-041 · Coimbatore Spares Co. · ₹1,20,000</option>
                <option>PO-2025-039 · Aruna Industries (Pending Balance)</option>
              </select>
            </div>
          </div>
          <div className="mm-fr3">
            <div className="mm-fg"><label>Vendor Name</label><input className="mm-fc" defaultValue="Lakshmi Textile Mills Pvt. Ltd." readOnly/></div>
            <div className="mm-fg"><label>Delivery Challan No.</label><input className="mm-fc" placeholder="DC / Vehicle No."/></div>
            <div className="mm-fg"><label>Received at Location</label>
              <select className="mm-fc"><option>Ranipet Main Store</option><option>Warehouse B</option><option>Production Floor</option></select></div>
          </div>
        </div>
      </div>

      <div className="mm-fs">
        <div className="mm-fsh">📦 Items Received</div>
        <div className="mm-fsb" style={{padding:'0'}}>
          <div className="mm-lt-wrap">
            <table className="mm-lt">
              <thead><tr><th>#</th><th>Material</th><th>PO Qty</th><th>Already Recv.</th><th>Recv. Qty</th><th>Unit</th><th>Quality</th><th>Bin / Loc.</th><th>Remarks</th></tr></thead>
              <tbody>
                <tr>
                  <td>1</td><td>COMPACT COTTON SLIVER</td>
                  <td style={{color:'var(--odoo-gray)'}}>400 Kg</td>
                  <td style={{color:'var(--odoo-gray)'}}>0 Kg</td>
                  <td><input type="number" defaultValue="400" style={{width:'70px'}}/></td>
                  <td>Kg</td>
                  <td><select style={{width:'115px'}}><option>✅ Accepted</option><option>❌ Rejected</option><option>⏳ QC Pending</option></select></td>
                  <td><input defaultValue="BIN-A12" style={{width:'80px'}}/></td>
                  <td><input placeholder="Remarks..." style={{width:'110px'}}/></td>
                </tr>
                <tr>
                  <td>2</td><td>LATTICE APRONS</td>
                  <td style={{color:'var(--odoo-gray)'}}>100 Nos</td>
                  <td style={{color:'var(--odoo-gray)'}}>0 Nos</td>
                  <td><input type="number" defaultValue="98" style={{width:'70px'}}/></td>
                  <td>Nos</td>
                  <td><select style={{width:'115px'}}><option>✅ Accepted</option><option>❌ Rejected</option><option>⏳ QC Pending</option></select></td>
                  <td><input defaultValue="BIN-C05" style={{width:'80px'}}/></td>
                  <td><input defaultValue="2 damaged" style={{width:'110px'}}/></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mm-fs">
        <div className="mm-fsh">📎 Attachments &amp; Notes</div>
        <div className="mm-fsb">
          <div className="mm-fr2">
            <div className="mm-fg"><label>Upload DC / Invoice Copy</label><input type="file" className="mm-fc" accept=".pdf,.jpg,.png"/></div>
            <div className="mm-fg"><label>Internal Notes</label><textarea className="mm-fc mm-fta" placeholder="Inspection notes, quality observations..."/></div>
          </div>
        </div>
      </div>

      <div className="mm-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/grn')}>✕ Cancel</button>
        <button className="btn btn-s sd-bsm">💾 Save Draft</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/grn')}>✅ Post GRN</button>
        <div className="mm-flow">
          <span className="mm-fs-step done">✅ PO Approved</span><span className="mm-fs-arr">›</span>
          <span className="mm-fs-step act">📦 Recording GRN</span><span className="mm-fs-arr">›</span>
          <span className="mm-fs-step">🧾 Vendor Invoice</span><span className="mm-fs-arr">›</span>
          <span className="mm-fs-step">💳 Payment</span>
        </div>
      </div>
    </div>
  )
}
