import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function BreakdownNew() {
  const nav = useNavigate()
  const [saved, setSaved] = useState(false)
  const [startTime] = useState(new Date().toTimeString().slice(0,5))

  if (saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px',gap:'16px'}}>
      <div style={{fontSize:'48px'}}>🔴</div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:'var(--odoo-red)'}}>BD-2025-009 Reported!</div>
      <div style={{fontSize:'13px',color:'var(--odoo-gray)'}}>Technician notified · Supervisor alerted · Downtime clock started</div>
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/breakdown')}>← Breakdown List</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/pm/workorder')}>🔧 Create Work Order</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Report Breakdown <small>New Breakdown Entry</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/breakdown')}>✕ Cancel</button>
          <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>🔴 Submit Report</button>
        </div>
      </div>

      <div className="pp-alert warn">⚠️ Reporting a breakdown will immediately alert the maintenance supervisor and start the downtime clock.</div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">🔴 Breakdown Details</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>BD Number</label><input className="fi-form-ctrl" defaultValue="BD-2025-009" readOnly/></div>
            <div className="fi-form-grp"><label>Date <span>*</span></label><input type="date" className="fi-form-ctrl" defaultValue="2025-03-01"/></div>
            <div className="fi-form-grp"><label>Breakdown Time <span>*</span></label><input type="time" className="fi-form-ctrl" defaultValue={startTime}/></div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Machine / Equipment <span>*</span></label>
              <select className="fi-form-ctrl">
                <option>WND-01 · Winding Machine</option>
                <option>RFM-01 · Ring Frame Machine 01</option>
                <option>RFM-02 · Ring Frame Machine 02</option>
                <option>OE-02 · Open End Machine</option>
                <option>CSP-01 · Compact Spinning</option>
                <option>CRD-01 · Carding Machine</option>
                <option>BLW-01 · Blow Room</option>
                <option>DRW-01 · Drawing Frame</option>
              </select>
            </div>
            <div className="fi-form-grp"><label>Breakdown Type <span>*</span></label>
              <select className="fi-form-ctrl">
                <option>Mechanical</option><option>Electrical</option>
                <option>Pneumatic</option><option>Electronic / PLC</option>
                <option>Hydraulic</option><option>Other</option>
              </select>
            </div>
            <div className="fi-form-grp"><label>Priority <span>*</span></label>
              <select className="fi-form-ctrl">
                <option>High — Production stopped</option>
                <option>Medium — Partial production</option>
                <option>Low — Minor issue</option>
              </select>
            </div>
          </div>
          <div className="fi-form-grp"><label>Problem Description <span>*</span></label>
            <textarea className="fi-form-ctrl" rows={3} placeholder="Describe the breakdown in detail — symptom, noise, error code, what happened before..."></textarea>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Reported By <span>*</span></label>
              <select className="fi-form-ctrl">
                <option>Rajan K. — Operator Team A</option>
                <option>Murugan S. — Operator Team B</option>
                <option>Selvam P. — Shift Supervisor</option>
              </select>
            </div>
            <div className="fi-form-grp"><label>Assigned Technician</label>
              <select className="fi-form-ctrl">
                <option>Suresh M. — Mechanical</option>
                <option>Ravi K. — Mechanical</option>
                <option>Kannan E. — Electrical</option>
                <option>— Unassigned</option>
              </select>
            </div>
            <div className="fi-form-grp"><label>Work Order in Progress?</label>
              <input type="text" className="fi-form-ctrl" defaultValue="WO-2025-019" readOnly style={{background:'#F8F9FA'}}/>
            </div>
          </div>
        </div>
      </div>

      {/* Spares needed */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📦 Spare Parts Likely Required</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>#</th><th>Spare Part</th><th>Part No.</th><th>Est. Qty</th><th>Stock</th></tr></thead>
            <tbody>
              <tr>
                <td>1</td>
                <td><select style={{width:'200px'}}>
                  <option>Spindle Bearing — 6205 ZZ</option>
                  <option>V-Belt — B68</option>
                  <option>Ring Traveller Set</option>
                  <option>Winding Drum Motor</option>
                </select></td>
                <td><input defaultValue="SP-0042" style={{width:'80px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'4px 6px',fontSize:'12px'}}/></td>
                <td><input type="number" defaultValue="2" style={{width:'60px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'4px 6px',fontSize:'12px'}}/></td>
                <td><span className="badge badge-pass">✅ 5 in stock</span></td>
              </tr>
            </tbody>
          </table>
          <div style={{padding:'10px 14px'}}>
            <button className="btn btn-s sd-bsm">➕ Add Spare Part</button>
          </div>
        </div>
      </div>

      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pm/breakdown')}>✕ Cancel</button>
        <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>🔴 Submit Report</button>
        <div className="fi-status-flow">
          <span className="fi-sf-step act">🔴 Reported</span><span className="fi-sf-arr">›</span>
          <span className="fi-sf-step">🔧 Assigned</span><span className="fi-sf-arr">›</span>
          <span className="fi-sf-step">⚙️ In Repair</span><span className="fi-sf-arr">›</span>
          <span className="fi-sf-step">✅ Resolved</span>
        </div>
      </div>
    </div>
  )
}
