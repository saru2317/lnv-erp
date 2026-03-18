import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function StockAdjustment() {
  const nav = useNavigate()
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Stock Adjustment <small>Manual Correction Entry</small></div>
        <div className="wm-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}>✕ Cancel</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/wm/movement-log')}>✅ Post Adjustment</button>
        </div>
      </div>

      <div className="wm-form-sec">
        <div className="wm-form-sec-hdr">⚖️ Adjustment Entry</div>
        <div className="wm-form-sec-body">
          <div className="wm-form-row">
            <div className="wm-form-grp"><label>Adjustment No.</label><input className="wm-form-ctrl" defaultValue="ADJ-2025-005" readOnly/></div>
            <div className="wm-form-grp"><label>Date</label><input type="date" className="wm-form-ctrl" defaultValue="2025-02-28"/></div>
            <div className="wm-form-grp"><label>Reason</label>
              <select className="wm-form-ctrl">
                <option>Physical Count Variance</option>
                <option>Damage / Write-off</option>
                <option>Production Loss</option>
                <option>Sample / Testing</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="wm-form-row2">
            <div className="wm-form-grp"><label>Material <span>*</span></label>
              <select className="wm-form-ctrl">
                <option>MAT-002 · Ring Yarn</option>
                <option>MAT-001 · Cotton Sliver</option>
                <option>MAT-003 · Lattice Aprons</option>
                <option>MAT-004 · Packing Boxes</option>
                <option>MAT-005 · Solvent Chemical</option>
              </select>
            </div>
            <div className="wm-form-grp"><label>Remarks</label>
              <input className="wm-form-ctrl" placeholder="Reason for adjustment..."/>
            </div>
          </div>
          <div className="wm-form-row4">
            <div className="wm-form-grp"><label>Current Stock</label><input className="wm-form-ctrl" defaultValue="80 Kg" readOnly/></div>
            <div className="wm-form-grp"><label>Adjustment Qty <span>*</span></label><input type="number" className="wm-form-ctrl" placeholder="-5 or +10"/></div>
            <div className="wm-form-grp"><label>New Stock (after)</label><input className="wm-form-ctrl" defaultValue="75 Kg" readOnly/></div>
            <div className="wm-form-grp"><label>Adjustment Type</label>
              <select className="wm-form-ctrl">
                <option>➖ Negative (Reduce)</option>
                <option>➕ Positive (Increase)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="wm-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}>✕ Cancel</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/wm/movement-log')}>✅ Post Adjustment</button>
      </div>
    </div>
  )
}
