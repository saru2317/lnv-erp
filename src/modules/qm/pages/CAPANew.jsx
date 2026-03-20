import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CAPANew() {
  const nav = useNavigate()
  const [saved, setSaved] = useState(false)

  if (saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px',gap:'16px'}}>
      <div style={{fontSize:'48px'}}></div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:'var(--odoo-green)'}}>CAPA-013 Created!</div>
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/capa')}>← CAPA List</button>
        <button className="btn btn-p sd-bsm" onClick={() => setSaved(false)}>New CAPA</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">New CAPA <small>Corrective / Preventive Action</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/capa')}> Cancel</button>
          <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>Save CAPA</button>
        </div>
      </div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">CAPA Details</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>CAPA No.</label><input className="fi-form-ctrl" defaultValue="CAPA-013" readOnly/></div>
            <div className="fi-form-grp"><label>Type</label>
              <select className="fi-form-ctrl"><option>Corrective</option><option>Preventive</option></select>
            </div>
            <div className="fi-form-grp"><label>NCR Reference</label>
              <select className="fi-form-ctrl">
                <option>NCR-019 · Ring Yarn twist variation</option>
                <option>NCR-018 · OE Yarn nep count</option>
                <option>NCR-017 · Ring Yarn strength</option>
                <option>— No NCR (Preventive)</option>
              </select>
            </div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Owner / Department <span>*</span></label>
              <select className="fi-form-ctrl"><option>QC Dept</option><option>Production</option><option>Maintenance</option><option>Purchase</option><option>Admin</option></select>
            </div>
            <div className="fi-form-grp"><label>Target Completion Date <span>*</span></label>
              <input type="date" className="fi-form-ctrl" defaultValue="2025-03-15"/>
            </div>
            <div className="fi-form-grp"><label>Priority</label>
              <select className="fi-form-ctrl"><option>High</option><option>Medium</option><option>Low</option></select>
            </div>
          </div>
          <div className="fi-form-grp"><label>Root Cause Analysis <span>*</span></label>
            <textarea className="fi-form-ctrl" rows={3} placeholder="5-Why / Fishbone analysis — describe the root cause identified..."></textarea>
          </div>
          <div className="fi-form-grp"><label>Corrective / Preventive Action <span>*</span></label>
            <textarea className="fi-form-ctrl" rows={3} placeholder="Describe the action to be taken, steps, and how it will prevent recurrence..."></textarea>
          </div>
          <div className="fi-form-row2">
            <div className="fi-form-grp"><label>Verification Method</label>
              <select className="fi-form-ctrl">
                <option>Re-inspection of next 3 lots</option>
                <option>Process audit</option>
                <option>Machine calibration report</option>
                <option>Supplier certificate</option>
              </select>
            </div>
            <div className="fi-form-grp"><label>Effectiveness Check Date</label>
              <input type="date" className="fi-form-ctrl" defaultValue="2025-03-22"/>
            </div>
          </div>
        </div>
      </div>

      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/capa')}> Cancel</button>
        <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>Save CAPA</button>
      </div>
    </div>
  )
}
