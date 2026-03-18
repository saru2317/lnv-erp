import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BINS = [
  // Row A
  {id:'A-01',cls:'mid', pct:'78%'},{id:'A-02',cls:'mid', pct:'92%'},{id:'A-03',cls:'high',pct:'45%'},
  {id:'A-04',cls:'full',pct:'100%'},{id:'A-05',cls:'mid',pct:'62%'},{id:'A-06',cls:'empty',pct:'—'},
  // Row B
  {id:'B-01',cls:'full',pct:'98%'},{id:'B-02',cls:'high',pct:'40%'},{id:'B-03',cls:'mid', pct:'71%'},
  {id:'B-04',cls:'high',pct:'35%'},{id:'B-05',cls:'mid', pct:'55%'},{id:'B-06',cls:'empty',pct:'—'},
  // Row C
  {id:'C-01',cls:'mid', pct:'68%'},{id:'C-02',cls:'mid', pct:'80%'},{id:'C-03',cls:'high',pct:'30%'},
  {id:'C-04',cls:'high',pct:'42%'},{id:'C-05',cls:'mid', pct:'65%'},{id:'C-06',cls:'empty',pct:'—'},
  // Row D
  {id:'D-01',cls:'empty',pct:'—'},{id:'D-02',cls:'mid', pct:'55%'},{id:'D-03',cls:'full',pct:'100%'},
  {id:'D-04',cls:'mid', pct:'74%'},{id:'D-05',cls:'high',pct:'28%'},{id:'D-06',cls:'empty',pct:'—'},
]

// Stock data per bin
const BIN_STOCK = {
  'A-01': [{ mat:'Compact Cotton Sliver',code:'MAT-001',qty:480,uom:'Kg',   batch:'BTH-2025-01',expiry:'Jan 2026',b:'badge-ok',bl:'OK'}],
  'A-02': [{ mat:'Open End Yarn (12s)',  code:'MAT-006',qty:320,uom:'Kg',   batch:'BTH-2025-02',expiry:'Mar 2026',b:'badge-ok',bl:'OK'}],
  'A-03': [{ mat:'Ring Yarn (30s)',      code:'MAT-002',qty:80, uom:'Kg',   batch:'BTH-2024-12',expiry:'Dec 2025',b:'badge-critical',bl:'Critical'}],
  'A-04': [{ mat:'Cotton Sliver Grade B',code:'MAT-008',qty:600,uom:'Kg',   batch:'BTH-2025-03',expiry:'N/A',    b:'badge-ok',bl:'OK'}],
  'A-05': [{ mat:'Polyester Yarn',       code:'MAT-009',qty:240,uom:'Kg',   batch:'BTH-2025-04',expiry:'Jun 2026',b:'badge-ok',bl:'OK'}],
  'A-06': [],
  'B-01': [{ mat:'Ring Yarn Stock B',    code:'MAT-002',qty:290,uom:'Kg',   batch:'BTH-2024-11',expiry:'Nov 2025',b:'badge-low',bl:'Low'}],
  'B-02': [{ mat:'Lattice Aprons',       code:'MAT-003',qty:35, uom:'Nos',  batch:'BTH-2025-02',expiry:'N/A',    b:'badge-low',bl:'Low'}],
  'B-03': [{ mat:'Lubricant Oil',        code:'MAT-007',qty:25, uom:'Litre',batch:'BTH-2024-91',expiry:'Mar 2025',b:'badge-ok',bl:'OK'}],
  'B-04': [{ mat:'Ring Yarn (30s)',       code:'MAT-002',qty:80, uom:'Kg',   batch:'BTH-2024-12',expiry:'Dec 2025',b:'badge-critical',bl:'Critical'}],
  'B-05': [{ mat:'Spare Bearings',       code:'MAT-010',qty:18, uom:'Nos',  batch:'BTH-2025-01',expiry:'N/A',    b:'badge-ok',bl:'OK'}],
  'B-06': [],
  'C-01': [{ mat:'Packing Tape',         code:'MAT-011',qty:500,uom:'Roll', batch:'BTH-2025-01',expiry:'N/A',    b:'badge-ok',bl:'OK'}],
  'C-02': [{ mat:'Packing Boxes DW',     code:'MAT-004',qty:850,uom:'Nos',  batch:'BTH-2025-01',expiry:'N/A',    b:'badge-ok',bl:'OK'}],
  'C-03': [{ mat:'Stretch Film',         code:'MAT-012',qty:40, uom:'Roll', batch:'BTH-2025-02',expiry:'N/A',    b:'badge-low',bl:'Low'}],
  'C-04': [{ mat:'Bubble Wrap',          code:'MAT-013',qty:30, uom:'Roll', batch:'BTH-2025-01',expiry:'N/A',    b:'badge-low',bl:'Low'}],
  'C-05': [{ mat:'Lattice Aprons',       code:'MAT-003',qty:35, uom:'Nos',  batch:'BTH-2025-02',expiry:'N/A',    b:'badge-low',bl:'Low'}],
  'C-06': [],
  'D-01': [],
  'D-02': [{ mat:'Lattice Aprons (Transferred)',code:'MAT-003',qty:20,uom:'Nos',batch:'BTH-2025-01',expiry:'N/A',b:'badge-ok',bl:'OK'}],
  'D-03': [
    { mat:'Solvent Chemical 30%', code:'MAT-005',qty:10, uom:'Litre',batch:'BTH-2024-88',expiry:'01 Mar 2025',b:'badge-critical',bl:'Expiring!'},
    { mat:'Phosphating Chemical', code:'MAT-014',qty:45, uom:'Litre',batch:'BTH-2025-01',expiry:'Jun 2026',  b:'badge-ok',bl:'OK'},
  ],
  'D-04': [{ mat:'Solvent Chemical 30%', code:'MAT-005',qty:15, uom:'Litre',batch:'BTH-2025-05',expiry:'Sep 2025',b:'badge-ok',bl:'OK'}],
  'D-05': [{ mat:'Lubricant Oil Bulk',   code:'MAT-007',qty:8,  uom:'Litre',batch:'BTH-2024-91',expiry:'Mar 2025',b:'badge-low',bl:'Expiring Soon'}],
  'D-06': [],
}

export default function WHMap() {
  const nav = useNavigate()
  const [selected, setSelected] = useState(null)

  const handleBinClick = (binId) => {
    setSelected(binId)
  }

  const stockRows = selected ? (BIN_STOCK[selected] || []) : []
  const isEmpty = stockRows.length === 0

  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Warehouse Map <small>Visual Layout — Coimbatore Main Store</small></div>
        <div className="wm-lv-actions">
          <select className="wm-filter-select">
            <option>Coimbatore Main Store</option>
            <option>Warehouse B</option>
            <option>Production Floor</option>
          </select>
        </div>
      </div>

      {/* Map */}
      <div className="wh-map-wrap">
        <div className="wh-map-title">
          <span>🏗️ Storage Layout — Click a bin to view stock</span>
          <div style={{display:'flex',gap:'8px'}}>
            <span className="badge badge-ok">✅ Healthy: 28</span>
            <span className="badge badge-low">⚠️ Low: 8</span>
            <span className="badge badge-critical">🔴 Critical: 4</span>
            <span className="badge badge-draft">Empty: 12</span>
          </div>
        </div>
        <div className="wh-layout">
          {BINS.map(b => (
            <div
              key={b.id}
              className={`bin-cell ${b.cls}${selected===b.id?' selected':''}`}
              onClick={() => handleBinClick(b.id)}
            >
              <div className="bin-label">{b.id}</div>
              <div className="bin-pct">{b.pct}</div>
            </div>
          ))}
        </div>
        <div className="wh-legend">
          <div className="wh-leg-item"><div className="wh-leg-dot" style={{background:'#FDEDEC',border:'1px solid #F5B7B1'}}></div>Full (90–100%)</div>
          <div className="wh-leg-item"><div className="wh-leg-dot" style={{background:'#FEF5E7',border:'1px solid #FAD7A0'}}></div>Medium (30–89%)</div>
          <div className="wh-leg-item"><div className="wh-leg-dot" style={{background:'#EAF9F6',border:'1px solid #A2DED0'}}></div>Good (&gt;60%)</div>
          <div className="wh-leg-item"><div className="wh-leg-dot" style={{background:'#F8F9FA',border:'1px solid var(--odoo-border)'}}></div>Empty</div>
        </div>
      </div>

      {/* Bin Detail Panel */}
      {selected === null ? (
        <div className="wm-alert info" style={{textAlign:'center',justifyContent:'center'}}>
          🗺️ Click any bin above to view its stock details
        </div>
      ) : (
        <div className="wm-panel">
          <div className="wm-panel-hdr">
            <h3>📦 BIN {selected} — Stock Details</h3>
            <div style={{display:'flex',gap:'8px'}}>
              {isEmpty
                ? <span className="badge badge-draft">Empty Bin</span>
                : <span className="badge badge-ok">{stockRows.length} Material{stockRows.length>1?'s':''}</span>
              }
              <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/transfer')}>🔄 Transfer</button>
              <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/goods-issue')}>📤 Issue</button>
              <button className="btn btn-s sd-bsm" onClick={() => setSelected(null)}>✕ Close</button>
            </div>
          </div>

          {isEmpty ? (
            <div className="wm-panel-body" style={{textAlign:'center',padding:'28px',color:'var(--odoo-gray)'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>📭</div>
              <div style={{fontSize:'13px',fontWeight:'600'}}>BIN {selected} is currently empty</div>
              <div style={{fontSize:'11px',marginTop:'4px'}}>No stock stored in this location</div>
              <button className="btn btn-p sd-bsm" style={{marginTop:'12px'}} onClick={() => nav('/wm/goods-receipt')}>
                📥 Receive Stock Here
              </button>
            </div>
          ) : (
            <div className="wm-panel-body" style={{padding:'0'}}>
              <table className="wm-data-table" style={{borderRadius:'0',boxShadow:'none'}}>
                <thead>
                  <tr>
                    <th>Material Code</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>UOM</th>
                    <th>Batch No.</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stockRows.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>
                          {r.code}
                        </strong>
                      </td>
                      <td><strong>{r.mat}</strong></td>
                      <td>
                        <strong style={{fontFamily:'Syne,sans-serif',fontSize:'15px'}}>
                          {r.qty}
                        </strong>
                      </td>
                      <td>{r.uom}</td>
                      <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{r.batch}</td>
                      <td style={{
                        fontSize:'12px',
                        color: r.expiry==='N/A' ? 'var(--odoo-gray)'
                             : r.bl==='Expiring!' ? 'var(--odoo-red)'
                             : r.bl==='Expiring Soon' ? 'var(--odoo-orange)'
                             : 'var(--odoo-dark)',
                        fontWeight: r.bl.includes('Expir') ? '700' : '400'
                      }}>
                        {r.expiry}
                      </td>
                      <td><span className={`badge ${r.b}`}>{r.bl}</span></td>
                      <td onClick={e=>e.stopPropagation()} style={{display:'flex',gap:'4px'}}>
                        <button className="btn-xs" onClick={() => nav('/wm/goods-issue')}>📤 Issue</button>
                        <button className="btn-xs" onClick={() => nav('/wm/transfer')}>🔄 Move</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
