import React from 'react'

const ROWS = [
  { cat:'Raw Material',          skus:24, open:'₹32,40,000', recv:'₹6,20,000', iss:'₹4,80,000', close:'₹33,80,000', turn:'14%' },
  { cat:'Spares & Consumables',  skus:18, open:'₹4,20,000',  recv:'₹1,20,000', iss:'₹80,000',   close:'₹4,60,000',  turn:'19%' },
  { cat:'Packing Material',      skus:12, open:'₹2,80,000',  recv:'₹80,000',   iss:'₹40,000',   close:'₹3,20,000',  turn:'14%' },
  { cat:'Chemicals',             skus:8,  open:'₹60,000',    recv:'₹40,000',   iss:'₹60,000',   close:'₹40,000',    turn:'100%'},
]

export default function StockReport() {
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Stock Report <small>Inventory Analytics</small></div>
        <div className="wm-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export Excel</button>
          <button className="btn btn-s sd-bsm">🖨️ Print Report</button>
        </div>
      </div>

      <div className="wm-filter-bar">
        <select className="wm-filter-select"><option>Feb 2025</option><option>Jan 2025</option><option>Dec 2024</option></select>
        <select className="wm-filter-select"><option>All Categories</option><option>Raw Material</option><option>Spares</option><option>Packing</option><option>Chemicals</option></select>
        <select className="wm-filter-select"><option>All Locations</option><option>Main Store</option><option>Warehouse B</option></select>
        <button className="btn btn-p sd-bsm">🔍 Generate</button>
      </div>

      <div className="wm-kpi-grid">
        {[
          { cls:'purple', ic:'📦', lb:'Total SKUs',      val:'86',     sub:'Active materials' },
          { cls:'green',  ic:'💰', lb:'Stock Value',      val:'₹42.8L', sub:'Current valuation' },
          { cls:'orange', ic:'📥', lb:'Receipts (MTD)',   val:'₹8.6L',  sub:'14 GRNs this month' },
          { cls:'blue',   ic:'📤', lb:'Issues (MTD)',     val:'₹6.2L',  sub:'22 issue movements' },
        ].map(k => (
          <div key={k.lb} className={`wm-kpi-card ${k.cls}`}>
            <div className="wm-kpi-icon">{k.ic}</div>
            <div className="wm-kpi-label">{k.lb}</div>
            <div className="wm-kpi-value">{k.val}</div>
            <div className="wm-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <table className="wm-data-table">
        <thead>
          <tr>
            <th>Category</th><th>SKUs</th><th>Opening Value</th>
            <th>Receipts</th><th>Issues</th><th>Closing Value</th><th>Turnover</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(r => (
            <tr key={r.cat}>
              <td><strong>{r.cat}</strong></td>
              <td style={{textAlign:'center'}}>{r.skus}</td>
              <td>{r.open}</td>
              <td style={{color:'var(--odoo-green)',fontWeight:'600'}}>{r.recv}</td>
              <td style={{color:'var(--odoo-red)',fontWeight:'600'}}>{r.iss}</td>
              <td><strong>{r.close}</strong></td>
              <td style={{fontWeight:'700',color: parseInt(r.turn)>50?'var(--odoo-red)':parseInt(r.turn)>15?'var(--odoo-orange)':'var(--odoo-green)'}}>{r.turn}</td>
            </tr>
          ))}
          <tr style={{background:'#F8F9FA'}}>
            <td><strong>TOTAL</strong></td>
            <td style={{textAlign:'center'}}><strong>62</strong></td>
            <td><strong>₹40,00,000</strong></td>
            <td><strong style={{color:'var(--odoo-green)'}}>₹8,60,000</strong></td>
            <td><strong style={{color:'var(--odoo-red)'}}>₹6,60,000</strong></td>
            <td><strong style={{color:'var(--odoo-purple)',fontSize:'15px'}}>₹42,80,000</strong></td>
            <td><strong>17%</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
