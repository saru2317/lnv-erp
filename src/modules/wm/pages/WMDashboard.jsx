import React from 'react'
import { useNavigate } from 'react-router-dom'

const MOVEMENTS = [
  { type:'in',       dot:'📥', title:'GRN-2025-018 — Compact Cotton Sliver', sub:'From Vendor · BIN-A12 · 26 Feb 2025', qty:'+400 Kg' },
  { type:'out',      dot:'📤', title:'GI-2025-042 — Ring Yarn Issue to Production', sub:'To PP Floor · BIN-B04 · 26 Feb 2025', qty:'-120 Kg' },
  { type:'transfer', dot:'🔄', title:'Transfer — Lattice Aprons', sub:'BIN-C05 → BIN-D02 · 25 Feb 2025', qty:'50 Nos' },
  { type:'in',       dot:'📥', title:'GRN-2025-017 — Solvent Chemical', sub:'From Vendor · BIN-E10 · 24 Feb 2025', qty:'+30 Litre' },
  { type:'adjust',   dot:'⚖️', title:'Adjustment — Packing Boxes count variance', sub:'Physical count diff · BIN-F06 · 23 Feb 2025', qty:'-15 Nos' },
]

const STOCK_BARS = [
  { name:'Ring Yarn',         b:'badge-critical', bl:'Critical', sub:'80 Kg / Min: 200 Kg', pct:40, color:'var(--odoo-red)' },
  { name:'Lattice Aprons',    b:'badge-low',      bl:'Low',      sub:'35 Nos / Min: 50 Nos',pct:70, color:'var(--odoo-orange)' },
  { name:'Solvent Chemical',  b:'badge-low',      bl:'Low',      sub:'25 L / Min: 100 L',   pct:25, color:'var(--odoo-orange)' },
  { name:'Packing Boxes DW',  b:'badge-ok',       bl:'OK',       sub:'850 Nos / Min: 500 Nos',pct:85,color:'var(--odoo-green)' },
]

export default function WMDashboard() {
  const nav = useNavigate()
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">WM Dashboard <small>Warehouse Overview</small></div>
        <div className="wm-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/goods-receipt')}>📥 Goods Receipt</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/goods-issue')}>📤 Goods Issue</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/wm/transfer')}>🔄 Transfer</button>
        </div>
      </div>

      <div className="wm-alert danger">
        🚨 <strong>4 materials</strong> are below reorder level — immediate purchase required!{' '}
        <span onClick={() => nav('/wm/reorder')} style={{cursor:'pointer',textDecoration:'underline',fontWeight:700}}>View Reorder Alerts →</span>
      </div>

      <div className="wm-kpi-grid">
        {[
          {cls:'purple',ic:'📦',lb:'Total SKUs',        val:'86',    sub:'Across 3 locations'},
          {cls:'green', ic:'💰',lb:'Stock Value',        val:'₹42.8L',sub:'As of today'},
          {cls:'orange',ic:'⚠️',lb:'Low Stock Items',    val:'4',     sub:'Below reorder level'},
          {cls:'red',   ic:'📅',lb:'Expiring (30 days)', val:'2',     sub:'Needs attention'},
        ].map(k => (
          <div key={k.lb} className={`wm-kpi-card ${k.cls}`}>
            <div className="wm-kpi-icon">{k.ic}</div>
            <div className="wm-kpi-label">{k.lb}</div>
            <div className="wm-kpi-value">{k.val}</div>
            <div className="wm-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="wm-panel-grid">
        {/* Recent Movements */}
        <div className="wm-panel">
          <div className="wm-panel-hdr">
            <h3>📜 Recent Stock Movements</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/movement-log')}>View All</button>
          </div>
          <div className="wm-mvt-list">
            {MOVEMENTS.map((m, i) => (
              <div key={i} className="wm-mvt-item">
                <div className={`wm-mvt-dot ${m.type}`}>{m.dot}</div>
                <div className="wm-mvt-info">
                  <div className="wm-mvt-title">{m.title}</div>
                  <div className="wm-mvt-sub">{m.sub}</div>
                </div>
                <div className={`wm-mvt-qty ${m.type}`}>{m.qty}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Stock */}
        <div className="wm-panel">
          <div className="wm-panel-hdr">
            <h3>⚠️ Critical Stock Levels</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/reorder')}>View All</button>
          </div>
          <div className="wm-panel-body">
            {STOCK_BARS.map(s => (
              <div key={s.name} className="wm-sbar-wrap">
                <div className="wm-sbar-info">
                  <span style={{fontSize:'12px',fontWeight:'600'}}>{s.name}</span>
                  <span className={`badge ${s.b}`}>{s.bl}</span>
                </div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginBottom:'4px'}}>{s.sub}</div>
                <div className="wm-sbar-bg">
                  <div className="wm-sbar-fill" style={{width:`${s.pct}%`,background:s.color}}></div>
                </div>
              </div>
            ))}
            <button className="btn btn-s sd-bsm" style={{width:'100%',marginTop:'10px'}} onClick={() => nav('/wm/reorder')}>
              ⚠️ Create Reorder POs
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="wm-panel">
        <div className="wm-panel-hdr"><h3>⚡ Quick Actions</h3></div>
        <div className="wm-panel-body" style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/goods-receipt')}>📥 Goods Receipt</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/goods-issue')}>📤 Goods Issue</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/wm/transfer')}>🔄 Stock Transfer</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/physical-inventory')}>📋 Physical Count</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/wh-map')}>🗺️ Warehouse Map</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/adjustment')}>⚖️ Stock Adjustment</button>
        </div>
      </div>
    </div>
  )
}
