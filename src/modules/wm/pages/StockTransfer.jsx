import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function StockTransfer() {
  const nav = useNavigate()
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Stock Transfer <small>MB1B · Bin to Bin / Location to Location</small></div>
        <div className="wm-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}>✕ Cancel</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/wm/movement-log')}>Post Transfer</button>
        </div>
      </div>

      <div className="wm-form-sec">
        <div className="wm-form-sec-hdr">🔄 Transfer Details</div>
        <div className="wm-form-sec-body">
          <div className="wm-form-row">
            <div className="wm-form-grp"><label>Transfer Ref No.</label><input className="wm-form-ctrl" defaultValue="TR-2025-018" readOnly/></div>
            <div className="wm-form-grp"><label>Transfer Date</label><input type="date" className="wm-form-ctrl" defaultValue="2025-02-28"/></div>
            <div className="wm-form-grp"><label>Transfer Type</label>
              <select className="wm-form-ctrl">
                <option>311 — Bin to Bin (Same Location)</option>
                <option>312 — Location to Location</option>
                <option>313 — Warehouse Transfer</option>
              </select></div>
          </div>
          <div className="wm-form-row2">
            <div className="wm-form-grp"><label>From Location / Warehouse</label>
              <select className="wm-form-ctrl"><option>Coimbatore Main Store</option><option>Warehouse B</option><option>Production Floor</option></select></div>
            <div className="wm-form-grp"><label>To Location / Warehouse</label>
              <select className="wm-form-ctrl"><option>Production Floor</option><option>Warehouse B</option><option>Coimbatore Main Store</option></select></div>
          </div>
        </div>
      </div>

      <div className="wm-form-sec">
        <div className="wm-form-sec-hdr">Items to Transfer</div>
        <div className="wm-form-sec-body" style={{padding:'0'}}>
          <div className="wm-lt-wrap">
            <table className="wm-lt">
              <thead><tr><th>#</th><th>Material</th><th>Available</th><th>Transfer Qty</th><th>UOM</th><th>From Bin</th><th>To Bin</th><th>Batch</th><th></th></tr></thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td><select style={{width:'170px'}}><option>MAT-003 · Lattice Aprons</option><option>MAT-001 · Cotton Sliver</option></select></td>
                  <td style={{color:'var(--odoo-orange)',fontWeight:'600'}}>35 Nos</td>
                  <td><input type="number" defaultValue="20" style={{width:'65px'}}/></td>
                  <td>Nos</td>
                  <td><select style={{width:'80px'}}><option>BIN-C05</option><option>BIN-C01</option></select></td>
                  <td><select style={{width:'80px'}}><option>BIN-D02</option><option>BIN-D01</option></select></td>
                  <td><input defaultValue="BTH-2025-01" style={{width:'100px'}}/></td>
                  <td><span className="li-del">🗑</span></td>
                </tr>
              </tbody>
            </table>
            <div className="wm-lt-add"><button className="btn btn-s sd-bsm">Add Item</button></div>
          </div>
        </div>
      </div>

      <div className="wm-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}>✕ Cancel</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/wm/movement-log')}>Post Transfer</button>
      </div>
    </div>
  )
}
