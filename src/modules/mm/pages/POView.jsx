import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function POView() {
  const nav = useNavigate()
  const { id } = useParams()
  const poId = id || 'PO-2025-042'
  return (
    <div>
      <div className="lv-hdr">
        <div><div className="lv-ttl">{poId} <span className="mm-badge mm-bdg-approved" style={{fontSize:'14px',marginLeft:'8px'}}>Approved</span></div></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/po')}>← Back</button>
          <button className="btn btn-s sd-bsm">🖨️ Print PO</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/grn/new')}>Record GRN</button>
        </div>
      </div>
      <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',padding:'20px',marginBottom:'14px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          <div>
            <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',marginBottom:'4px'}}>VENDOR</div>
            <div style={{fontSize:'14px',fontWeight:'700'}}>Lakshmi Textile Mills Pvt. Ltd.</div>
            <div style={{fontSize:'12px',color:'var(--odoo-gray)'}}>33AABLM9234B1Z6 · Tiruppur, TN</div>
          </div>
          <div>
            <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',marginBottom:'4px'}}>DELIVERY TO</div>
            <div style={{fontSize:'14px',fontWeight:'700'}}>Ranipet Main Store</div>
            <div style={{fontSize:'12px',color:'var(--odoo-gray)'}}>LNV Manufacturing, Ranipet - 632401</div>
          </div>
          <div>
            <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',marginBottom:'4px'}}>ORDER DETAILS</div>
            <div style={{fontSize:'13px'}}>PO Date: <strong>25 Feb 2025</strong></div>
            <div style={{fontSize:'13px'}}>Delivery: <strong>10 Mar 2025</strong></div>
            <div style={{fontSize:'13px'}}>Terms: <strong>Net 30 Days</strong></div>
          </div>
        </div>
        <table className="mm-tbl" style={{marginBottom:'14px'}}>
          <thead><tr><th>#</th><th>HSN</th><th>Material</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Taxable</th><th>GST%</th><th>GST Amt</th><th>Total</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>5513 11 90</td><td>Compact Cotton Sliver</td><td>400</td><td>Kg</td><td>₹850</td><td>₹3,40,000</td><td>12%</td><td>₹40,800</td><td><strong>₹3,80,800</strong></td></tr>
            <tr><td>2</td><td>8448 59 90</td><td>Lattice Aprons</td><td>100</td><td>Nos</td><td>₹900</td><td>₹90,000</td><td>18%</td><td>₹16,200</td><td><strong>₹1,06,200</strong></td></tr>
          </tbody>
        </table>
        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <div className="mm-tot-box" style={{width:'280px'}}>
            <div className="mm-tot-row"><span className="tl">Subtotal</span><span>₹4,30,000</span></div>
            <div className="mm-tot-row"><span className="tl">Total GST</span><span>₹57,000</span></div>
            <div className="mm-tot-row grand"><span className="tl"><strong>Grand Total</strong></span><span className="tv">₹4,87,000</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
