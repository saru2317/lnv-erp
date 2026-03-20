import React, { useState } from 'react'

const INIT = [
  {mat:'Cotton Sliver (MAT-001)',  bin:'BIN-A12',uom:'Kg',  sys:480, counted:480,  rate:850,  row:'pi-row-ok',  b:'badge-ok',       bl:' Match'},
  {mat:'Ring Yarn (MAT-002)',      bin:'BIN-B04',uom:'Kg',  sys:80,  counted:75,   rate:1200, row:'pi-row-diff', b:'badge-critical',  bl:' Short'},
  {mat:'Packing Boxes (MAT-004)', bin:'BIN-F06',uom:'Nos', sys:850, counted:862,  rate:200,  row:'pi-row-diff', b:'badge-new',       bl:' Surplus'},
  {mat:'Solvent Chemical (MAT-005)',bin:'BIN-E10',uom:'Litre',sys:25,counted:25,  rate:500,  row:'pi-row-ok',  b:'badge-ok',       bl:' Match'},
  {mat:'Lattice Aprons (MAT-003)',  bin:'BIN-C05',uom:'Nos', sys:35,  counted:35,   rate:1050, row:'pi-row-ok',  b:'badge-ok',       bl:' Match'},
]

export default function PhysicalInventory() {
  const [rows, setRows] = useState(INIT)
  const updateCount = (i, v) => {
    const r = [...rows]; r[i] = {...r[i], counted: parseInt(v)||0}; setRows(r)
  }
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Physical Inventory <small>MI01 · Stock Count &amp; Variance</small></div>
        <div className="wm-lv-actions">
          <button className="btn btn-s sd-bsm">Download Count Sheet</button>
          <button className="btn btn-s sd-bsm">Save Count</button>
          <button className="btn btn-p sd-bsm">Post &amp; Adjust</button>
        </div>
      </div>
      <div className="wm-alert warn"> Physical inventory count for Feb 2025. Enter actual counted quantities below. Variances will be auto-adjusted.</div>

      <div className="wm-form-sec">
        <div className="wm-form-sec-hdr">PI Document — PI-2025-004 · 28 Feb 2025</div>
        <div className="wm-form-sec-body" style={{padding:'0'}}>
          <div className="wm-lt-wrap">
            <table className="wm-lt">
              <thead><tr><th>Material</th><th>Bin</th><th>UOM</th><th>System Qty</th><th>Counted Qty</th><th>Variance</th><th>Variance Value</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((r, i) => {
                  const diff = r.counted - r.sys
                  const val  = diff * r.rate
                  const dc = diff === 0 ? 'var(--odoo-green)' : diff < 0 ? 'var(--odoo-red)' : 'var(--odoo-green)'
                  return (
                    <tr key={i} className={r.row}>
                      <td>{r.mat}</td>
                      <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{r.bin}</td>
                      <td>{r.uom}</td>
                      <td style={{fontWeight:'600'}}>{r.sys}</td>
                      <td><input type="number" defaultValue={r.counted} style={{width:'70px'}} onChange={e => updateCount(i, e.target.value)}/></td>
                      <td style={{color:dc,fontWeight:'700'}}>{diff >= 0 ? `+${diff}` : diff}</td>
                      <td style={{color:dc,fontWeight:'600'}}>{val >= 0 ? `+₹${val.toLocaleString()}` : `-₹${Math.abs(val).toLocaleString()}`}</td>
                      <td><span className={`badge ${r.b}`}>{r.bl}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',marginTop:'14px'}}>
            <div style={{background:'#F8F9FA',border:'1px solid var(--odoo-border)',borderRadius:'6px',padding:'14px 18px',minWidth:'260px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'6px'}}><span>Total Items Counted:</span><strong>5</strong></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'6px'}}><span>Matched:</span><strong style={{color:'var(--odoo-green)'}}>3</strong></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'6px'}}><span>Short:</span><strong style={{color:'var(--odoo-red)'}}>1 · -₹6,000</strong></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px'}}><span>Surplus:</span><strong style={{color:'var(--odoo-green)'}}>1 · +₹2,400</strong></div>
              <div style={{borderTop:'1px solid var(--odoo-border)',marginTop:'8px',paddingTop:'8px',display:'flex',justifyContent:'space-between'}}>
                <span style={{fontWeight:'700'}}>Net Variance:</span>
                <strong style={{color:'var(--odoo-red)'}}>-₹3,600</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="wm-form-acts">
        <button className="btn btn-s sd-bsm">Download Sheet</button>
        <button className="btn btn-s sd-bsm">Save Count</button>
        <button className="btn btn-p sd-bsm">Post &amp; Adjust Stock</button>
      </div>
    </div>
  )
}
