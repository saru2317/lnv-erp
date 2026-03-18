import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function MRPRun() {
  const nav = useNavigate()
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const run = () => {
    setRunning(true)
    setTimeout(() => { setRunning(false); setDone(true) }, 2000)
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">MRP Run <small>MD01 · Material Requirements Planning</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/mrp/results')}>📋 View Last Results</button>
          <button className="btn btn-p sd-bsm" onClick={run} disabled={running}>
            {running ? '⏳ Running MRP...' : '▶️ Execute MRP'}
          </button>
        </div>
      </div>

      {done && (
        <div className="pp-alert success">
          ✅ <strong>MRP Executed Successfully!</strong> 4 planned orders created · 2 urgent POs flagged.&nbsp;
          <span style={{textDecoration:'underline',cursor:'pointer',fontWeight:'700'}} onClick={() => nav('/pp/mrp/results')}>View Results →</span>
        </div>
      )}

      {running && (
        <div className="pp-alert info">
          ⏳ <strong>MRP Running...</strong> Calculating requirements for all active work orders and sales demand...
        </div>
      )}

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">⚙️ MRP Parameters</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Planning Horizon</label>
              <select className="fi-form-ctrl"><option>4 Weeks</option><option>6 Weeks</option><option>8 Weeks</option><option>12 Weeks</option></select>
            </div>
            <div className="fi-form-grp"><label>Planning Date</label>
              <input type="date" className="fi-form-ctrl" defaultValue="2025-03-01"/>
            </div>
            <div className="fi-form-grp"><label>Safety Stock Days</label>
              <input type="number" className="fi-form-ctrl" defaultValue="3"/>
            </div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Consider Open POs</label>
              <select className="fi-form-ctrl"><option>Yes</option><option>No</option></select>
            </div>
            <div className="fi-form-grp"><label>Consider Open SOs</label>
              <select className="fi-form-ctrl"><option>Yes</option><option>No</option></select>
            </div>
            <div className="fi-form-grp"><label>Lot Size Method</label>
              <select className="fi-form-ctrl"><option>Exact Qty</option><option>Fixed Lot</option><option>Min-Max</option></select>
            </div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Include Work Orders</label>
              <select className="fi-form-ctrl"><option>All Active WOs</option><option>Released Only</option><option>Specific WO</option></select>
            </div>
            <div className="fi-form-grp"><label>Lead Time Buffer (days)</label>
              <input type="number" className="fi-form-ctrl" defaultValue="2"/>
            </div>
            <div className="fi-form-grp"><label>Run Type</label>
              <select className="fi-form-ctrl"><option>Full Regenerative</option><option>Net Change</option></select>
            </div>
          </div>
        </div>
      </div>

      {/* What MRP Considers */}
      <div className="fi-panel-grid">
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>📥 Demand Sources</h3></div>
          <div className="fi-panel-body">
            {[['Active Work Orders','12 WOs','var(--odoo-purple)'],
              ['Open Sales Orders','8 SOs','var(--odoo-blue)'],
              ['Safety Stock Requirements','All items','var(--odoo-orange)'],
              ['Minimum Reorder Points','6 materials','var(--odoo-green)'],
            ].map(([l,v,c])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--odoo-border)',fontSize:'13px'}}>
                <span>{l}</span><strong style={{color:c}}>{v}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>📤 Supply Sources</h3></div>
          <div className="fi-panel-body">
            {[['Current Stock (WM)','14 materials','var(--odoo-green)'],
              ['Open Purchase Orders','5 POs in transit','var(--odoo-blue)'],
              ['Scheduled Receipts','3 deliveries','var(--odoo-orange)'],
              ['Production Output (WOs)','Planned FG','var(--odoo-purple)'],
            ].map(([l,v,c])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--odoo-border)',fontSize:'13px'}}>
                <span>{l}</span><strong style={{color:c}}>{v}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/mrp/results')}>📋 Last Results</button>
        <button className="btn btn-p sd-bsm" onClick={run} disabled={running}>
          {running ? '⏳ Running...' : '▶️ Execute MRP Now'}
        </button>
      </div>
    </div>
  )
}
