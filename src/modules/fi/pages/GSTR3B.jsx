import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function GSTR3B() {
  const nav = useNavigate()
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">GSTR-3B Summary <small>February 2025 · Monthly Return</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>Feb 2025</option><option>Jan 2025</option><option>Dec 2024</option></select>
          <button className="btn btn-s sd-bsm">⬇️ Download JSON</button>
          <button className="btn btn-p sd-bsm">📤 File on GST Portal</button>
        </div>
      </div>
      <div className="gst-sum-grid">
        {[{cl:'cgst',l:'CGST Output',v:'₹1,62,000',s:'Less ITC ₹81,000 → Pay ₹81,000'},
          {cl:'sgst',l:'SGST Output',v:'₹1,62,000',s:'Less ITC ₹81,000 → Pay ₹81,000'},
          {cl:'igst',l:'IGST Output',v:'₹0',s:'No interstate transactions'},
        ].map(c=>(
          <div key={c.cl} className={`gst-card ${c.cl}`}>
            <label>{c.l}</label><div className="gc-val">{c.v}</div><div className="gc-sub">{c.s}</div>
          </div>
        ))}
      </div>
      <div className="itc-box">
        <h3 style={{fontFamily:'Syne,sans-serif',marginBottom:'10px'}}>Input Tax Credit (ITC) Available</h3>
        {[['ITC on Purchases (CGST)','₹81,000'],['ITC on Purchases (SGST)','₹81,000'],['ITC on Purchases (IGST)','₹0'],['Opening ITC Balance','₹62,000']].map(([l,v])=>(
          <div key={l} className="itc-row"><span>{l}</span><strong>{v}</strong></div>
        ))}
        <div className="itc-row tot"><span>Total ITC Available</span><strong style={{color:'var(--odoo-green)',fontSize:'18px'}}>₹2,24,000</strong></div>
      </div>
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">🧾 Net Tax Computation</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>Tax Head</th><th>Output Tax</th><th>ITC Available</th><th>Net Payable</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td><strong>CGST</strong></td><td>₹1,62,000</td><td className="cr">₹81,000</td><td style={{fontWeight:'700',color:'var(--odoo-purple)'}}>₹81,000</td><td><span className="badge badge-pending">To Pay</span></td></tr>
              <tr><td><strong>SGST</strong></td><td>₹1,62,000</td><td className="cr">₹81,000</td><td style={{fontWeight:'700',color:'var(--odoo-purple)'}}>₹81,000</td><td><span className="badge badge-pending">To Pay</span></td></tr>
              <tr><td><strong>IGST</strong></td><td>₹0</td><td>₹0</td><td>₹0</td><td><span className="badge badge-posted">Nil</span></td></tr>
              <tr style={{background:'#EDE0EA',fontWeight:'700',fontFamily:'Syne,sans-serif'}}>
                <td>TOTAL GST PAYABLE</td><td>₹3,24,000</td><td className="cr">₹1,62,000</td>
                <td style={{color:'var(--odoo-purple)',fontSize:'16px'}}>₹1,62,000</td>
                <td><button className="btn-xs pri" onClick={() => nav('/fi/gst-pay')}>💳 Pay Now</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
