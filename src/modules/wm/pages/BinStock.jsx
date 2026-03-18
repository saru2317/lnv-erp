import React from 'react'

const BINS = [
  { bin:'BIN-A12', loc:'Main Store · Row A', mat:'Cotton Sliver',   qty:480, uom:'Kg',    batch:'BTH-2025-01', val:'₹4,08,000', pct:78, pc:'var(--odoo-green)' },
  { bin:'BIN-B04', loc:'Main Store · Row B', mat:'Ring Yarn',        qty:80,  uom:'Kg',    batch:'BTH-2024-12', val:'₹96,000',   pct:35, pc:'var(--odoo-orange)' },
  { bin:'BIN-C05', loc:'Main Store · Row C', mat:'Lattice Aprons',   qty:35,  uom:'Nos',   batch:'BTH-2025-02', val:'₹36,750',   pct:65, pc:'var(--odoo-green)' },
  { bin:'BIN-E10', loc:'Main Store · Row E', mat:'Solvent Chemical', qty:25,  uom:'Litre', batch:'BTH-2024-88', val:'₹12,500',   pct:25, pc:'var(--odoo-red)' },
  { bin:'BIN-F06', loc:'Main Store · Row F', mat:'Packing Boxes DW', qty:850, uom:'Nos',   batch:'BTH-2025-01', val:'₹1,70,000', pct:85, pc:'var(--odoo-green)' },
]

export default function BinStock() {
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Bin / Location Stock <small>LS26 · Bin-wise Inventory</small></div>
        <div className="wm-lv-actions">
          <select className="wm-filter-select">
            <option>All Locations</option><option>Main Store</option><option>Warehouse B</option>
          </select>
        </div>
      </div>
      <table className="wm-data-table">
        <thead>
          <tr>
            <th>Bin</th><th>Location</th><th>Material</th>
            <th>Qty</th><th>UOM</th><th>Batch</th><th>Value (₹)</th><th>Capacity %</th>
          </tr>
        </thead>
        <tbody>
          {BINS.map(b => (
            <tr key={b.bin}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{b.bin}</strong></td>
              <td style={{fontSize:'12px',color:'var(--odoo-gray)'}}>{b.loc}</td>
              <td><strong>{b.mat}</strong></td>
              <td style={{fontWeight:'600'}}>{b.qty}</td>
              <td>{b.uom}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{b.batch}</td>
              <td>{b.val}</td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <div className="wm-sbar-bg" style={{width:'80px'}}>
                    <div className="wm-sbar-fill" style={{width:`${b.pct}%`,background:b.pc}}></div>
                  </div>
                  <span style={{fontSize:'11px',color:b.pc,fontWeight:'600'}}>{b.pct}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
