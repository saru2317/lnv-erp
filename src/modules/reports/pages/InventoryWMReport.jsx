import React, { useState } from 'react'

const STOCK_SUMMARY = [
  { cat:'Raw Materials',   items:28, qty:12480, value:18720000, minStock:5200, status:'ok'       },
  { cat:'Chemicals',       items:12, qty:840,   value:2100000,  minStock:300,  status:'ok'       },
  { cat:'Consumables',     items:34, qty:2340,  value:468000,   minStock:1200, status:'low'      },
  { cat:'Spare Parts',     items:52, qty:1680,  value:5040000,  minStock:600,  status:'ok'       },
  { cat:'Finished Goods',  items:8,  qty:4820,  value:9640000,  minStock:0,    status:'ok'       },
  { cat:'Packing Materials',items:15,qty:8400,  value:336000,   minStock:3000, status:'ok'       },
  { cat:'Tools & Equipment',items:18,qty:240,   value:720000,   minStock:60,   status:'critical' },
]

const MOVEMENT = [
  { m:'Oct', receipt:8240000, issue:7180000, adj:0 },
  { m:'Nov', receipt:9120000, issue:8340000, adj:-45000 },
  { m:'Dec', receipt:7680000, issue:7050000, adj:0 },
  { m:'Jan', receipt:9840000, issue:8920000, adj:0 },
  { m:'Feb', receipt:8940000, issue:8280000, adj:20000 },
  { m:'Mar', receipt:9450000, issue:8640000, adj:0 },
]

const SLOW_MOVING = [
  { code:'SP-021', desc:'Conveyor Roller Bearing 6210', cat:'Spare Parts', qty:12, value:36000,  days:94 },
  { code:'CH-008', desc:'Primer Coat — White (5L)',     cat:'Chemical',    qty:8,  value:20000,  days:78 },
  { code:'RM-018', desc:'Powder Coat — RAL 5010 Blue',  cat:'Raw Material',qty:45, value:72000,  days:65 },
  { code:'SP-034', desc:'Drive Belt — 2250mm',          cat:'Spare Parts', qty:4,  value:12000,  days:62 },
]

const fmtL = n => '₹' + (n/100000).toFixed(1) + 'L'
const ST = { ok:{bg:'#D4EDDA',c:'#155724',l:'OK'}, low:{bg:'#FFF3CD',c:'#856404',l:'Low Stock'}, critical:{bg:'#F8D7DA',c:'#721C24',l:'Critical'} }

export default function InventoryWMReport() {
  const [view, setView] = useState('summary')
  const totalVal = STOCK_SUMMARY.reduce((s, c) => s + c.value, 0)
  const totalItems = STOCK_SUMMARY.reduce((s, c) => s + c.items, 0)
  const lowCount  = STOCK_SUMMARY.filter(c => c.status !== 'ok').length

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Inventory Report <small>WM Module · Stock Analytics</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>Mar 2026</option><option>Feb 2026</option></select>
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:16 }}>
        {[
          { cls:'purple', l:'Total SKUs',          v:totalItems,          s:'All categories'      },
          { cls:'green',  l:'Total Stock Value',   v:fmtL(totalVal),      s:'At cost price'       },
          { cls:'orange', l:'Low / Critical',      v:lowCount,            s:'Need reorder'        },
          { cls:'blue',   l:'Slow Moving (>60d)',  v:SLOW_MOVING.length,  s:'Review required'     },
        ].map(k => (
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[['summary','📦 Category Summary'],['movement','📊 Stock Movement'],['slow','⚠️ Slow Moving']].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)}
            style={{ padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:600,
              cursor:'pointer', border:'1px solid var(--odoo-border)',
              background: view===k ? 'var(--odoo-purple)' : '#fff',
              color: view===k ? '#fff' : 'var(--odoo-gray)' }}>
            {l}
          </button>
        ))}
      </div>

      {view === 'summary' && (
        <table className="fi-data-table">
          <thead><tr><th>Category</th><th>SKUs</th><th>Total Qty</th><th>Stock Value</th><th>Min Stock</th><th>Coverage</th><th>Status</th></tr></thead>
          <tbody>
            {STOCK_SUMMARY.map((c, i) => {
              const st = ST[c.status]
              const cov = c.minStock > 0 ? ((c.qty / c.minStock) * 100).toFixed(0) : null
              return (
                <tr key={c.cat} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                  <td style={{ fontWeight:700 }}>{c.cat}</td>
                  <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace' }}>{c.items}</td>
                  <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:600 }}>{c.qty.toLocaleString('en-IN')}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-purple)' }}>{fmtL(c.value)}</td>
                  <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace', color:'var(--odoo-gray)' }}>{c.minStock > 0 ? c.minStock.toLocaleString('en-IN') : '—'}</td>
                  <td>
                    {cov ? (
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ flex:1, height:5, background:'var(--odoo-border)', borderRadius:3 }}>
                          <div style={{ height:'100%', borderRadius:3,
                            background: parseInt(cov) > 150 ? 'var(--odoo-green)' : parseInt(cov) > 100 ? 'var(--odoo-orange)' : 'var(--odoo-red)',
                            width: Math.min(parseInt(cov), 100) + '%' }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:600, minWidth:36 }}>{cov}%</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td><span style={{ padding:'3px 8px', borderRadius:10, fontSize:11, fontWeight:600, background:st.bg, color:st.c }}>{st.l}</span></td>
                </tr>
              )
            })}
            <tr style={{ background:'var(--odoo-purple)', color:'#fff', fontWeight:700 }}>
              <td style={{ padding:'10px 12px', fontFamily:'Syne,sans-serif' }}>TOTAL</td>
              <td style={{ padding:'10px 12px', textAlign:'center' }}>{totalItems}</td>
              <td colSpan={1} />
              <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace', fontSize:13 }}>{fmtL(totalVal)}</td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
      )}

      {view === 'movement' && (
        <table className="fi-data-table">
          <thead><tr><th>Month</th><th>Receipts (GRN)</th><th>Issues (MIS)</th><th>Adjustments</th><th>Net Movement</th></tr></thead>
          <tbody>
            {MOVEMENT.map((m, i) => (
              <tr key={m.m} style={{ background: i===MOVEMENT.length-1?'#EDE0EA':'', fontWeight: i===MOVEMENT.length-1?700:400 }}>
                <td style={{ fontWeight:600 }}>{m.m}</td>
                <td style={{ fontFamily:'DM Mono,monospace', color:'var(--odoo-green)', fontWeight:600 }}>{fmtL(m.receipt)}</td>
                <td style={{ fontFamily:'DM Mono,monospace', color:'var(--odoo-orange)', fontWeight:600 }}>{fmtL(m.issue)}</td>
                <td style={{ fontFamily:'DM Mono,monospace', textAlign:'center',
                  color: m.adj < 0 ? 'var(--odoo-red)' : m.adj > 0 ? 'var(--odoo-green)' : 'var(--odoo-gray)' }}>
                  {m.adj !== 0 ? (m.adj > 0 ? '+' : '') + fmtL(m.adj) : '—'}
                </td>
                <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700,
                  color: (m.receipt - m.issue + m.adj) > 0 ? 'var(--odoo-green)' : 'var(--odoo-red)' }}>
                  {fmtL(m.receipt - m.issue + m.adj)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view === 'slow' && (
        <div>
          <div className="fi-alert warn" style={{ marginBottom:14 }}>
            ⚠️ Items with no movement for more than 60 days. Review for disposal or return to supplier.
          </div>
          <table className="fi-data-table">
            <thead><tr><th>Code</th><th>Description</th><th>Category</th><th>Qty</th><th>Value</th><th>Days Since Last Use</th></tr></thead>
            <tbody>
              {SLOW_MOVING.map(s => (
                <tr key={s.code}>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-purple)', fontSize:12 }}>{s.code}</td>
                  <td style={{ fontWeight:600 }}>{s.desc}</td>
                  <td style={{ fontSize:11 }}>{s.cat}</td>
                  <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace', fontWeight:700 }}>{s.qty}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-orange)' }}>₹{s.value.toLocaleString('en-IN')}</td>
                  <td>
                    <span style={{ padding:'3px 10px', borderRadius:10, fontSize:11, fontWeight:700,
                      background: s.days > 90 ? '#F8D7DA' : '#FFF3CD',
                      color: s.days > 90 ? '#721C24' : '#856404' }}>
                      {s.days} days
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
