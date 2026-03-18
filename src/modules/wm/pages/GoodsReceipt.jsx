import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function GoodsReceipt() {
  const nav = useNavigate()
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Goods Receipt <small>MIGO · GR from GRN</small></div>
        <div className="wm-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}>✕ Cancel</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/wm/movement-log')}>✅ Post Goods Receipt</button>
        </div>
      </div>
      <div className="wm-alert info">ℹ️ Goods Receipt auto-updates stock after GRN is posted from the MM module.</div>

      <div className="wm-form-sec">
        <div className="wm-form-sec-hdr">📥 Receipt Details</div>
        <div className="wm-form-sec-body">
          <div className="wm-form-row">
            <div className="wm-form-grp"><label>GR Number</label><input className="wm-form-ctrl" defaultValue="GR-2025-042" readOnly/></div>
            <div className="wm-form-grp"><label>GR Date</label><input type="date" className="wm-form-ctrl" defaultValue="2025-02-28"/></div>
            <div className="wm-form-grp"><label>Reference GRN</label>
              <select className="wm-form-ctrl">
                <option>GRN-2025-018 · Lakshmi Textile · 26 Feb</option>
                <option>GRN-2025-017 · Aruna Industries</option>
              </select>
            </div>
          </div>
          <div className="wm-form-row">
            <div className="wm-form-grp"><label>Receiving Location</label>
              <select className="wm-form-ctrl"><option>Coimbatore Main Store</option><option>Warehouse B</option><option>Production Floor</option></select></div>
            <div className="wm-form-grp"><label>Movement Type</label>
              <select className="wm-form-ctrl"><option>101 — GR for PO</option><option>501 — Receipt w/o PO</option></select></div>
            <div className="wm-form-grp"><label>Posting Date</label><input type="date" className="wm-form-ctrl" defaultValue="2025-02-28"/></div>
          </div>
        </div>
      </div>

      <div className="wm-form-sec">
        <div className="wm-form-sec-hdr">📦 Items to Stock</div>
        <div className="wm-form-sec-body" style={{padding:'0'}}>
          <div className="wm-lt-wrap">
            <table className="wm-lt">
              <thead><tr><th>#</th><th>Material</th><th>GRN Qty</th><th>Received Qty</th><th>UOM</th><th>Batch No.</th><th>Bin / Location</th><th>Expiry Date</th></tr></thead>
              <tbody>
                <tr>
                  <td>1</td><td>Compact Cotton Sliver (MAT-001)</td><td>400</td>
                  <td><input type="number" defaultValue="400" style={{width:'70px'}}/></td><td>Kg</td>
                  <td><input defaultValue="BTH-2025-02" style={{width:'100px'}}/></td>
                  <td><select style={{width:'80px'}}><option>BIN-A12</option><option>BIN-A01</option></select></td>
                  <td><input type="date" style={{width:'115px'}}/></td>
                </tr>
                <tr>
                  <td>2</td><td>Lattice Aprons (MAT-003)</td><td>98</td>
                  <td><input type="number" defaultValue="98" style={{width:'70px'}}/></td><td>Nos</td>
                  <td><input defaultValue="BTH-2025-03" style={{width:'100px'}}/></td>
                  <td><select style={{width:'80px'}}><option>BIN-C05</option><option>BIN-C01</option></select></td>
                  <td><input type="date" style={{width:'115px'}}/></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="wm-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}>✕ Cancel</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/wm/movement-log')}>✅ Post GR &amp; Update Stock</button>
        <div className="wm-status-flow">
          <span className="wm-sf-step done">✅ GRN Posted</span><span className="wm-sf-arr">›</span>
          <span className="wm-sf-step act">📥 GR to Stock</span><span className="wm-sf-arr">›</span>
          <span className="wm-sf-step">🧾 Vendor Invoice</span>
        </div>
      </div>
    </div>
  )
}
