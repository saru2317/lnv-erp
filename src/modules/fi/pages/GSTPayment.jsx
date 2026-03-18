import React from 'react'
export default function GSTPayment() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">GST Payment <small>Monthly Tax Payment — Feb 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm">💳 Pay via NEFT/RTGS</button>
        </div>
      </div>
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">💳 GST Payment Challan</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>GSTIN</label><input className="fi-form-ctrl" defaultValue="33AABLNV1234B1Z5" readOnly/></div>
            <div className="fi-form-grp"><label>Return Period</label><input className="fi-form-ctrl" defaultValue="02/2025" readOnly/></div>
            <div className="fi-form-grp"><label>Payment Date</label><input type="date" className="fi-form-ctrl" defaultValue="2025-03-20"/></div>
          </div>
          <table className="fi-data-table" style={{marginTop:'10px'}}>
            <thead><tr><th>Tax Head</th><th>Tax Amount (₹)</th><th>Interest (₹)</th><th>Late Fee (₹)</th><th>Total (₹)</th><th>Payment Mode</th></tr></thead>
            <tbody>
              {[['CGST','81,000'],['SGST','81,000'],['IGST','0']].map(([h,v])=>(
                <tr key={h}>
                  <td><strong>{h}</strong></td>
                  <td><input className="fi-form-ctrl" defaultValue={v} style={{width:'100px'}}/></td>
                  <td><input className="fi-form-ctrl" defaultValue="0" style={{width:'80px'}}/></td>
                  <td><input className="fi-form-ctrl" defaultValue="0" style={{width:'80px'}}/></td>
                  <td style={{fontWeight:'700',color:'var(--odoo-purple)'}}>₹{v}</td>
                  <td><select className="fi-form-ctrl" style={{width:'140px'}}><option>NEFT/RTGS</option><option>Net Banking</option><option>OTC</option></select></td>
                </tr>
              ))}
              <tr style={{background:'#EDE0EA',fontWeight:'700'}}>
                <td>TOTAL</td><td>₹1,62,000</td><td>₹0</td><td>₹0</td>
                <td style={{fontFamily:'Syne,sans-serif',fontSize:'16px',color:'var(--odoo-purple)'}}>₹1,62,000</td><td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="fi-form-acts">
        <button className="btn btn-p sd-bsm">💳 Generate Challan & Pay</button>
      </div>
    </div>
  )
}
