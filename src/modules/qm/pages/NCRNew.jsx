import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NCRNew() {
  const nav = useNavigate()
  const [saved, setSaved] = useState(false)

  if (saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px',gap:'16px'}}>
      <div style={{fontSize:'48px'}}>❌</div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:'var(--odoo-orange)'}}>NCR-020 Raised!</div>
      <div style={{fontSize:'13px',color:'var(--odoo-gray)'}}>Assigned to QC team · Email notification sent</div>
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/ncr')}>← NCR List</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/capa/new')}>Create CAPA</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Raise NCR <small>Non-Conformance Report</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/ncr')}>✕ Cancel</button>
          <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>Save NCR</button>
        </div>
      </div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">❌ NCR Details</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>NCR Number</label><input className="fi-form-ctrl" defaultValue="NCR-020" readOnly/></div>
            <div className="fi-form-grp"><label>Date <span>*</span></label><input type="date" className="fi-form-ctrl" defaultValue="2025-03-01"/></div>
            <div className="fi-form-grp"><label>Severity <span>*</span></label>
              <select className="fi-form-ctrl">
                <option>Minor</option><option>Major</option><option>Critical</option>
              </select>
            </div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Source <span>*</span></label>
              <select className="fi-form-ctrl">
                <option>PP — Production</option><option>MM — Incoming GRN</option>
                <option>SD — Pre-shipment</option><option>Customer Complaint</option>
              </select>
            </div>
            <div className="fi-form-grp"><label>Reference (Lot / WO / GRN)</label>
              <select className="fi-form-ctrl">
                <option>QIL-049 · Ring Yarn (30s)</option>
                <option>GRN-2025-019 · Cotton Bale</option>
              </select>
            </div>
            <div className="fi-form-grp"><label>Material / Product <span>*</span></label>
              <select className="fi-form-ctrl">
                <option>Ring Yarn (30s Count)</option><option>Ring Yarn (40s Count)</option>
                <option>OE Yarn (12s)</option><option>Compact Sliver</option>
                <option>Cotton Bale (RM)</option><option>Solvent Chemical</option>
              </select>
            </div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Non-Conforming Qty</label>
              <div style={{display:'flex',gap:'8px'}}>
                <input type="number" className="fi-form-ctrl" placeholder="0" style={{flex:1}}/>
                <select className="fi-form-ctrl" style={{width:'80px'}}><option>Kg</option><option>Nos</option><option>Ltr</option></select>
              </div>
            </div>
            <div className="fi-form-grp"><label>Assigned To</label>
              <select className="fi-form-ctrl">
                <option>Rajesh Q. — QC Inspector</option><option>Kavitha M. — QC Lead</option>
              </select>
            </div>
            <div className="fi-form-grp"><label>Disposition</label>
              <select className="fi-form-ctrl">
                <option>On Hold — Pending Review</option><option>Rework — Return to Production</option>
                <option>Scrap — Write Off</option><option>Use As-Is — Concession</option>
                <option>Return to Vendor</option>
              </select>
            </div>
          </div>
          <div className="fi-form-grp"><label>Non-Conformance Description <span>*</span></label>
            <textarea className="fi-form-ctrl" rows={3} placeholder="Describe the non-conformance in detail — what was found, how many, where in the process..."></textarea>
          </div>
          <div className="fi-form-row2">
            <div className="fi-form-grp"><label>Immediate Action Taken</label>
              <textarea className="fi-form-ctrl" rows={2} placeholder="Immediate containment actions taken..."></textarea>
            </div>
            <div className="fi-form-grp"><label>Root Cause (Initial)</label>
              <textarea className="fi-form-ctrl" rows={2} placeholder="Suspected root cause..."></textarea>
            </div>
          </div>
        </div>
      </div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">Failed Parameters</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>Parameter</th><th>Specification</th><th>Actual Result</th><th>Deviation</th></tr></thead>
            <tbody>
              <tr className="test-row-fail">
                <td>Twist per Inch (TPI)</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>20.5 ± 0.5</td>
                <td><input type="number" defaultValue="22.1" style={{width:'80px',border:'2px solid var(--odoo-red)',borderRadius:'4px',padding:'4px 6px',fontSize:'12px',fontFamily:'DM Mono,monospace'}}/></td>
                <td style={{fontWeight:'700',color:'var(--odoo-red)'}}>+1.1 (High)</td>
              </tr>
            </tbody>
          </table>
          <div style={{padding:'10px 14px'}}>
            <button className="btn btn-s sd-bsm">Add Parameter</button>
          </div>
        </div>
      </div>

      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/ncr')}>✕ Cancel</button>
        <button className="btn btn-s sd-bsm">Save Draft</button>
        <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>Submit NCR</button>
        <div className="fi-status-flow">
          <span className="fi-sf-step act">❌ NCR</span><span className="fi-sf-arr">›</span>
          <span className="fi-sf-step">Root Cause</span><span className="fi-sf-arr">›</span>
          <span className="fi-sf-step">CAPA</span><span className="fi-sf-arr">›</span>
          <span className="fi-sf-step">🔒 Closed</span>
        </div>
      </div>
    </div>
  )
}
