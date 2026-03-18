import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LINES_INIT = [
  {no:1,hsn:'5513 11 90',mat:'COMPACT COTTON SLIVER',qty:200,unit:'Kg',   rate:850, disc:0,  taxable:'1,70,000',gst:'12%',cgst:'10,200',sgst:'10,200',igst:'0',total:'1,90,400'},
  {no:2,hsn:'8448 59 90',mat:'LATTICE APRONS',       qty:50, unit:'Nos',  rate:1200,disc:5,  taxable:'57,000',  gst:'18%',cgst:'5,130',  sgst:'5,130', igst:'0',total:'67,260'},
]

export default function PONew() {
  const nav = useNavigate()
  const [lines, setLines] = useState(LINES_INIT)
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">New Purchase Order <small>ME21N · Create PO</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/po')}>✕ Cancel</button>
          <button className="btn btn-s sd-bsm">Save Draft</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/po')}>Approve &amp; Send</button>
        </div>
      </div>
      <div className="mm-alert info">ℹ️ PO Number will be auto-generated on save. Reference: <strong>PO-2025-043</strong></div>

      {/* Header */}
      <div className="mm-fs">
        <div className="mm-fsh">Purchase Order Header</div>
        <div className="mm-fsb">
          <div className="mm-fr3">
            <div className="mm-fg"><label>PO Number</label><input className="mm-fc" defaultValue="PO-2025-043" readOnly/></div>
            <div className="mm-fg"><label>PO Date <span>*</span></label><input type="date" className="mm-fc" defaultValue="2025-02-28"/></div>
            <div className="mm-fg"><label>Delivery Date <span>*</span></label><input type="date" className="mm-fc" defaultValue="2025-03-10"/></div>
          </div>
          <div className="mm-fr3">
            <div className="mm-fg"><label>Vendor <span>*</span></label>
              <select className="mm-fc"><option value="">-- Select Vendor --</option><option selected>Lakshmi Textile Mills</option><option>Coimbatore Spares Co.</option><option>Sri Murugan Traders</option><option>Aruna Industries</option></select></div>
            <div className="mm-fg"><label>Vendor GSTIN</label><input className="mm-fc" defaultValue="33AABLM9234B1Z6" readOnly/></div>
            <div className="mm-fg"><label>Purchase Category</label>
              <select className="mm-fc"><option>Raw Material</option><option>Spares &amp; Consumables</option><option>Packing Material</option><option>Chemicals</option><option>Capital Goods</option></select></div>
          </div>
          <div className="mm-fr3">
            <div className="mm-fg"><label>Delivery Location</label>
              <select className="mm-fc"><option>Ranipet Main Store</option><option>Warehouse B</option><option>Production Floor</option></select></div>
            <div className="mm-fg"><label>Payment Terms</label>
              <select className="mm-fc"><option>Net 30 Days</option><option>Net 45 Days</option><option>Advance</option><option>Against Delivery</option></select></div>
            <div className="mm-fg"><label>Reference / Enquiry No.</label><input className="mm-fc" placeholder="ENQ-2025-012"/></div>
          </div>
        </div>
      </div>

      {/* Vendor Details */}
      <div className="mm-fs">
        <div className="mm-fsh">Vendor Details</div>
        <div className="mm-fsb">
          <div className="mm-vc">
            <div className="mm-va">LT</div>
            <div className="mm-vi"><p>Lakshmi Textile Mills Pvt. Ltd.</p><span>33AABLM9234B1Z6 · Net 30 · Tiruppur, Tamil Nadu</span></div>
            <div style={{marginLeft:'auto',textAlign:'right'}}>
              <span className="mm-badge mm-bdg-approved">Approved Vendor</span>
              <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginTop:'4px'}}>Outstanding: ₹1,42,000</div>
            </div>
          </div>
          <div className="mm-fr2">
            <div className="mm-fg"><label>Vendor Address</label><textarea className="mm-fc mm-fta" defaultValue="No. 45, Textile Nagar, Tiruppur - 641601, Tamil Nadu"/></div>
            <div className="mm-fg"><label>Special Instructions</label><textarea className="mm-fc mm-fta" placeholder="Packing instructions, delivery notes..."/></div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="mm-fs">
        <div className="mm-fsh">Line Items</div>
        <div className="mm-fsb" style={{padding:'0'}}>
          <div className="mm-lt-wrap">
            <table className="mm-lt">
              <thead><tr><th>#</th><th>HSN/SAC</th><th>Material</th><th>Qty</th><th>Unit</th><th>Rate (₹)</th><th>Disc%</th><th>Taxable</th><th>GST%</th><th>CGST</th><th>SGST</th><th>Total (₹)</th><th></th></tr></thead>
              <tbody>
                {lines.map(l => (
                  <tr key={l.no}>
                    <td>{l.no}</td>
                    <td><input defaultValue={l.hsn} style={{width:'90px'}}/></td>
                    <td><select style={{width:'160px'}}><option>{l.mat}</option><option>COMPACT COTTON SLIVER</option><option>LATTICE APRONS</option><option>RING YARN</option></select></td>
                    <td><input type="number" defaultValue={l.qty} style={{width:'65px'}}/></td>
                    <td><select style={{width:'55px'}}><option>{l.unit}</option><option>Kg</option><option>Nos</option><option>Litre</option></select></td>
                    <td><input type="number" defaultValue={l.rate} style={{width:'85px'}}/></td>
                    <td><input type="number" defaultValue={l.disc} style={{width:'45px'}}/></td>
                    <td><input defaultValue={l.taxable} readOnly style={{width:'88px'}}/></td>
                    <td><select style={{width:'60px'}}><option>{l.gst}</option><option>12%</option><option>18%</option><option>5%</option></select></td>
                    <td><input defaultValue={l.cgst} readOnly style={{width:'72px'}}/></td>
                    <td><input defaultValue={l.sgst} readOnly style={{width:'72px'}}/></td>
                    <td><input defaultValue={l.total} readOnly style={{width:'92px',fontWeight:'700'}}/></td>
                    <td><span className="li-del" onClick={() => setLines(lines.filter(x=>x.no!==l.no))}>🗑</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mm-lt-add">
              <button className="btn btn-s sd-bsm" onClick={() => setLines([...lines,{no:lines.length+1,hsn:'',mat:'',qty:0,unit:'Kg',rate:0,disc:0,taxable:'0',gst:'18%',cgst:'0',sgst:'0',igst:'0',total:'0'}])}>＋ Add Line Item</button>
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <div className="mm-tot-box">
              <div className="mm-tot-row"><span className="tl">Subtotal (Taxable)</span><span>₹2,27,000</span></div>
              <div className="mm-tot-row"><span className="tl">CGST</span><span>₹15,330</span></div>
              <div className="mm-tot-row"><span className="tl">SGST</span><span>₹15,330</span></div>
              <div className="mm-tot-row"><span className="tl">IGST</span><span>₹0</span></div>
              <div className="mm-tot-row"><span className="tl">Freight / Other</span><span><input type="number" style={{width:'90px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'3px 7px'}} defaultValue="2500"/></span></div>
              <div className="mm-tot-row grand"><span className="tl"><strong>Grand Total</strong></span><span className="tv">₹2,60,160</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions + Flow */}
      <div className="mm-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/mm/po')}>✕ Cancel</button>
        <button className="btn btn-s sd-bsm">Save Draft</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/po')}>Approve &amp; Send</button>
        <div className="mm-flow">
          <span className="mm-fs-step act">📝 Draft</span><span className="mm-fs-arr">›</span>
          <span className="mm-fs-step">Sent</span><span className="mm-fs-arr">›</span>
          <span className="mm-fs-step">Approved</span><span className="mm-fs-arr">›</span>
          <span className="mm-fs-step">GRN</span><span className="mm-fs-arr">›</span>
          <span className="mm-fs-step">Invoiced</span>
        </div>
      </div>
    </div>
  )
}
