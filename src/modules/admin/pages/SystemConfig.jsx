import React, { useState } from 'react'

export default function SystemConfig() {
  const [saved, setSaved] = useState(false)
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">System Configuration <small>LNV ERP Settings</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>Save Config</button>
        </div>
      </div>
      {saved && <div className="pp-alert success">Configuration saved successfully!</div>}

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">Company Info</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Company Name</label><input className="fi-form-ctrl" defaultValue="LNV Manufacturing Pvt. Ltd."/></div>
            <div className="fi-form-grp"><label>GSTIN</label><input className="fi-form-ctrl" defaultValue="33AABCL1234M1Z5" style={{fontFamily:'DM Mono,monospace'}}/></div>
            <div className="fi-form-grp"><label>Financial Year</label>
              <select className="fi-form-ctrl"><option>April – March</option><option>January – December</option></select>
            </div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Currency</label><select className="fi-form-ctrl"><option>INR — ₹</option></select></div>
            <div className="fi-form-grp"><label>Date Format</label><select className="fi-form-ctrl"><option>DD MMM YYYY</option><option>DD/MM/YYYY</option></select></div>
            <div className="fi-form-grp"><label>Timezone</label><select className="fi-form-ctrl"><option>Asia/Kolkata (IST +5:30)</option></select></div>
          </div>
        </div>
      </div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">Audit Trail Settings</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Audit Log Retention</label>
              <select className="fi-form-ctrl"><option>2 Years</option><option>1 Year</option><option>Forever</option></select>
            </div>
            <div className="fi-form-grp"><label>Log Level</label>
              <select className="fi-form-ctrl"><option>All (Create/Update/Delete/Login/Export)</option><option>Critical only (Delete/Login failures)</option></select>
            </div>
            <div className="fi-form-grp"><label>Email Alert on Delete</label>
              <select className="fi-form-ctrl"><option>Yes — notify admin</option><option>No</option></select>
            </div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Failed Login Alert (attempts)</label>
              <input type="number" className="fi-form-ctrl" defaultValue="3"/>
            </div>
            <div className="fi-form-grp"><label>Session Timeout (minutes)</label>
              <input type="number" className="fi-form-ctrl" defaultValue="60"/>
            </div>
            <div className="fi-form-grp"><label>Auto-lock after idle</label>
              <select className="fi-form-ctrl"><option>30 minutes</option><option>1 hour</option><option>Never</option></select>
            </div>
          </div>
        </div>
      </div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr"> Security Settings</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Min Password Length</label><input type="number" className="fi-form-ctrl" defaultValue="8"/></div>
            <div className="fi-form-grp"><label>Password Expiry (days)</label><input type="number" className="fi-form-ctrl" defaultValue="90"/></div>
            <div className="fi-form-grp"><label>Max Login Attempts</label><input type="number" className="fi-form-ctrl" defaultValue="5"/></div>
          </div>
        </div>
      </div>
    </div>
  )
}
