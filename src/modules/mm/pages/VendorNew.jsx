import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function VendorNew() {
  const nav = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">New Vendor <small>MK01 · Create Vendor Master</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/vendors')}>✕ Cancel</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/vendors')}>Save Vendor</button>
        </div>
      </div>
      <div className="mm-fs">
        <div className="mm-fsh">Basic Details</div>
        <div className="mm-fsb">
          <div className="mm-fr3">
            <div className="mm-fg"><label>Vendor Code</label><input className="mm-fc" defaultValue="V-006" readOnly/></div>
            <div className="mm-fg"><label>Vendor Name <span>*</span></label><input className="mm-fc" placeholder="Company / Individual Name"/></div>
            <div className="mm-fg"><label>Vendor Type</label><select className="mm-fc"><option>Company</option><option>Individual</option><option>Partnership</option></select></div>
          </div>
          <div className="mm-fr3">
            <div className="mm-fg"><label>GSTIN <span>*</span></label><input className="mm-fc" placeholder="33XXXXX0000X1Z5"/></div>
            <div className="mm-fg"><label>PAN No.</label><input className="mm-fc" placeholder="XXXXX0000X"/></div>
            <div className="mm-fg"><label>Category</label>
              <select className="mm-fc"><option>Raw Material</option><option>Spares &amp; Consumables</option><option>Packing Material</option><option>Chemicals</option><option>Services</option><option>Capital Goods</option></select></div>
          </div>
        </div>
      </div>
      <div className="mm-fs">
        <div className="mm-fsh">📍 Address &amp; Contact</div>
        <div className="mm-fsb">
          <div className="mm-fr2">
            <div className="mm-fg"><label>Address <span>*</span></label><textarea className="mm-fc mm-fta" placeholder="Street, Area..."/></div>
            <div className="mm-fg"><label>City / State / PIN</label><textarea className="mm-fc mm-fta" placeholder="Coimbatore, Tamil Nadu - 641001"/></div>
          </div>
          <div className="mm-fr3">
            <div className="mm-fg"><label>Contact Person</label><input className="mm-fc" placeholder="Name"/></div>
            <div className="mm-fg"><label>Phone / Mobile</label><input className="mm-fc" placeholder="+91 98xxx xxxxx"/></div>
            <div className="mm-fg"><label>Email</label><input className="mm-fc" placeholder="vendor@example.com"/></div>
          </div>
        </div>
      </div>
      <div className="mm-fs">
        <div className="mm-fsh">Payment &amp; Banking</div>
        <div className="mm-fsb">
          <div className="mm-fr3">
            <div className="mm-fg"><label>Payment Terms</label>
              <select className="mm-fc"><option>Net 30 Days</option><option>Net 45 Days</option><option>Advance</option><option>Against Delivery</option></select></div>
            <div className="mm-fg"><label>Credit Limit (₹)</label><input className="mm-fc" placeholder="0"/></div>
            <div className="mm-fg"><label>Bank Name</label><input className="mm-fc" placeholder="Bank Name"/></div>
          </div>
          <div className="mm-fr3">
            <div className="mm-fg"><label>Account No.</label><input className="mm-fc" placeholder="Account Number"/></div>
            <div className="mm-fg"><label>IFSC Code</label><input className="mm-fc" placeholder="IFSC"/></div>
            <div className="mm-fg"><label>Branch</label><input className="mm-fc" placeholder="Branch Name"/></div>
          </div>
        </div>
      </div>
      <div className="mm-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/vendors')}>✕ Cancel</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/vendors')}>Save Vendor</button>
      </div>
    </div>
  )
}
