import React, { useState } from 'react'

const WO_DATA = [
  {wo:'WO-2025-017',prod:'Ring Yarn 30s — Lot 42',qty:'500 Kg',mat:'₹6,20,000',lab:'₹1,44,000',ovh:'₹68,000',total:'₹8,32,000',unit:'₹1,664/Kg',status:'Completed'},
  {wo:'WO-2025-016',prod:'Open End Yarn 12s — Lot 38',qty:'800 Kg',mat:'₹9,60,000',lab:'₹2,16,000',ovh:'₹1,02,000',total:'₹12,78,000',unit:'₹1,597/Kg',status:'Completed'},
  {wo:'WO-2025-015',prod:'Cotton Sliver Grade A — Lot 22',qty:'1200 Kg',mat:'₹7,80,000',lab:'₹1,92,000',ovh:'₹90,000',total:'₹10,62,000',unit:'₹885/Kg',status:'Completed'},
  {wo:'WO-2025-014',prod:'Polyester Blend Yarn — Lot 9',qty:'400 Kg',mat:'₹4,40,000',lab:'₹96,000',ovh:'₹46,000',total:'₹5,82,000',unit:'₹1,455/Kg',status:'In Progress'},
]

export default function COGMReport() {
  const [sel, setSel] = useState(null)
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">COGM Report <small>Cost of Goods Manufactured · from PP Module</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>Feb 2025</option><option>Jan 2025</option><option>Q3 FY25</option></select>
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
        </div>
      </div>

      <div className="fi-alert info">ℹ️ COGM data auto-captured from PP Work Orders. Each closed work order posts a Journal Entry to account 6110 · COGM — Manufacturing Cost.</div>

      <div className="fi-kpi-grid">
        {[{cls:'purple',l:'Total COGM (Feb 2025)',v:'₹37,54,000',s:'4 work orders'},
          {cls:'orange',l:'Direct Material',v:'₹28,00,000',s:'74.6% of COGM'},
          {cls:'blue',  l:'Direct Labour (HCM)',v:'₹6,48,000',s:'17.3% of COGM'},
          {cls:'green', l:'Manufacturing Overhead',v:'₹3,06,000',s:'8.1% of COGM'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Work Order</th><th>Product</th><th>Qty Produced</th>
          <th>Direct Material</th><th>Direct Labour</th><th>Overhead</th>
          <th>Total COGM</th><th>Unit Cost</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>
          {WO_DATA.map(r=>(
            <tr key={r.wo} onClick={() => setSel(r)}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.wo}</strong></td>
              <td><strong>{r.prod}</strong></td>
              <td>{r.qty}</td>
              <td>{r.mat}</td>
              <td style={{color:'var(--odoo-blue)'}}>{r.lab}</td>
              <td>{r.ovh}</td>
              <td style={{fontWeight:'700',fontFamily:'Syne,sans-serif',color:'var(--odoo-purple)'}}>{r.total}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-green)'}}>{r.unit}</td>
              <td><span className={`badge ${r.status==='Completed'?'badge-posted':'badge-pending'}`}>{r.status}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                <button className="btn-xs" onClick={() => setSel(r)}>Drill ▼</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Drill-down Modal */}
      {sel && (
        <div className="fi-modal-overlay" onClick={() => setSel(null)}>
          <div className="fi-modal-box" onClick={e=>e.stopPropagation()}>
            <div className="fi-modal-hdr">
              <h3>🏭 {sel.wo} — Cost Drill-Down</h3>
              <span className="fi-modal-close" onClick={() => setSel(null)}>✕</span>
            </div>
            <div className="fi-modal-body">
              <div style={{background:'#F8F9FA',padding:'10px 14px',borderRadius:'6px',marginBottom:'16px'}}>
                <strong>Product:</strong> {sel.prod} &nbsp;|&nbsp; <strong>Qty:</strong> {sel.qty} &nbsp;|&nbsp; <strong>Unit Cost:</strong> {sel.unit}
              </div>
              <table className="fi-data-table" style={{marginBottom:'16px'}}>
                <thead><tr><th>Cost Component</th><th>GL Account</th><th>Amount</th><th>% of Total</th></tr></thead>
                <tbody>
                  <tr><td>Direct Material (WM → PP Issue)</td><td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>6100 · COGS — Direct Material</td><td>{sel.mat}</td><td>74.5%</td></tr>
                  <tr><td>Direct Labour (HCM Payroll)</td><td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>6110 · COGM — Direct Labour</td><td style={{color:'var(--odoo-blue)'}}>{sel.lab}</td><td>17.3%</td></tr>
                  <tr><td>Power & Fuel</td><td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>6130 · COGM — Power & Fuel</td><td>₹24,000</td><td>2.9%</td></tr>
                  <tr><td>Machine Depreciation</td><td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>6400 · Depreciation</td><td>₹14,000</td><td>1.7%</td></tr>
                  <tr><td>Maintenance (PM)</td><td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>6700 · Maintenance Expense</td><td>₹30,000</td><td>3.6%</td></tr>
                  <tr style={{background:'#EDE0EA',fontWeight:'700'}}>
                    <td colSpan={2}>Total COGM</td>
                    <td style={{fontFamily:'Syne,sans-serif',color:'var(--odoo-purple)'}}>{sel.total}</td>
                    <td>100%</td>
                  </tr>
                </tbody>
              </table>
              <div className="fi-alert info" style={{fontSize:'12px'}}>
                📓 Auto-posted as JV when Work Order closed. View in Journal List — Source: PP
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
