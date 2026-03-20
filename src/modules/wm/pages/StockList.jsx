import React, { useState } from 'react'

const STOCKS = [
  {code:'MAT-001',desc:'Compact Cotton Sliver',   cat:'Raw Material',bin:'BIN-A12',uom:'Kg',  op:200,  in_:400, out:120, cur:480,  reord:200, val:'₹4,08,000',b:'badge-ok',       bl:' OK',         cc:''},
  {code:'MAT-002',desc:'Ring Yarn (30s Count)',    cat:'Raw Material',bin:'BIN-B04',uom:'Kg',  op:150,  in_:0,   out:70,  cur:80,   reord:200, val:'₹96,000',  b:'badge-critical',  bl:' Critical',  cc:'var(--odoo-red)'},
  {code:'MAT-003',desc:'Lattice Aprons (Set)',     cat:'Spares',      bin:'BIN-C05',uom:'Nos', op:80,   in_:0,   out:45,  cur:35,   reord:50,  val:'₹36,750',  b:'badge-low',       bl:' Low',       cc:'var(--odoo-orange)'},
  {code:'MAT-004',desc:'Packing Boxes Double Wall',cat:'Packing',     bin:'BIN-F06',uom:'Nos', op:500,  in_:1000,out:650, cur:850,  reord:500, val:'₹1,70,000',b:'badge-ok',        bl:' OK',         cc:''},
  {code:'MAT-005',desc:'Solvent Chemical 30%',     cat:'Chemicals',   bin:'BIN-E10',uom:'Litre',op:70, in_:30,  out:75,  cur:25,   reord:100, val:'₹12,500',  b:'badge-low',       bl:' Low',       cc:'var(--odoo-orange)'},
  {code:'MAT-006',desc:'Open End Yarn (12s)',       cat:'Raw Material',bin:'BIN-A08',uom:'Kg',  op:300,  in_:200, out:180, cur:320,  reord:150, val:'₹2,88,000',b:'badge-ok',        bl:' OK',         cc:''},
  {code:'MAT-007',desc:'Lubricant Oil (Machine)',   cat:'Spares',      bin:'BIN-G02',uom:'Litre',op:40, in_:20,  out:35,  cur:25,   reord:20,  val:'₹6,250',   b:'badge-ok',        bl:' OK',         cc:''},
]

export default function StockList() {
  const [chip, setChip] = useState('all')
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Stock Overview <small>MB52 · Current Inventory</small></div>
        <div className="wm-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/print/stn')}>Print</button>
          <button className="btn btn-s sd-bsm">Report</button>
          <button className="btn btn-p sd-bsm">Issue Stock</button>
        </div>
      </div>
      <div className="wm-chips">
        {[{k:'all',l:'All',n:'86'},{k:'rm',l:'Raw Material',n:'24'},{k:'sp',l:'Spares',n:'18'},{k:'pk',l:'Packing',n:'12'},{k:'low',l:'Low Stock',n:'4',red:true}].map(c => (
          <div key={c.k} className={`wm-chip${chip===c.k?' on':''}`}
            style={c.red && chip!==c.k?{color:'var(--odoo-red)',borderColor:'var(--odoo-red)'}:{}}
            onClick={() => setChip(c.k)}>
            {c.l} <span>{c.n}</span>
          </div>
        ))}
      </div>
      <div className="wm-filter-bar">
        <div className="wm-filter-search"><input placeholder="Search material, code, bin..."/></div>
        <select className="wm-filter-select"><option>All Locations</option><option>Main Store</option><option>Warehouse B</option><option>Production Floor</option></select>
        <select className="wm-filter-select"><option>All Categories</option><option>Raw Material</option><option>Spares</option><option>Packing</option><option>Chemicals</option></select>
        <select className="wm-filter-select"><option>All Stock Status</option><option>OK</option><option>Low</option><option>Critical</option><option>Zero</option></select>
      </div>
      <table className="wm-data-table">
        <thead><tr>
          <th><input type="checkbox"/></th>
          <th>Material Code</th><th>Description</th><th>Category</th>
          <th>Location / Bin</th><th>UOM</th>
          <th>Opening</th><th>In</th><th>Out</th><th>Current Stock</th>
          <th>Reorder Lvl</th><th>Value (₹)</th><th>Status</th>
        </tr></thead>
        <tbody>
          {STOCKS.map(s => (
            <tr key={s.code}>
              <td><input type="checkbox"/></td>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{s.code}</strong></td>
              <td>{s.desc}</td><td>{s.cat}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{s.bin}</td>
              <td>{s.uom}</td>
              <td style={{color:'var(--odoo-gray)'}}>{s.op}</td>
              <td style={{color:'var(--odoo-green)',fontWeight:s.in_>0?'700':'400'}}>{s.in_}</td>
              <td style={{color:'var(--odoo-red)',fontWeight:s.out>0?'700':'400'}}>{s.out}</td>
              <td><strong style={s.cc?{color:s.cc}:{}}>{s.cur}</strong></td>
              <td style={{color:'var(--odoo-gray)'}}>{s.reord}</td>
              <td>{s.val}</td>
              <td><span className={`badge ${s.b}`}>{s.bl}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',fontSize:'12px',color:'var(--odoo-gray)'}}>
        <span>Showing 7 of 86 records · Total Value: <strong>₹42,80,000</strong></span>
        <div style={{display:'flex',gap:'5px'}}>
          <button className="btn btn-s sd-bsm">‹ Prev</button>
          <button className="btn btn-p sd-bsm">1</button>
          <button className="btn btn-s sd-bsm">2</button>
          <button className="btn btn-s sd-bsm">Next ›</button>
        </div>
      </div>
    </div>
  )
}
