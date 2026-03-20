import React from 'react'

const MOVEMENTS = [
  {doc:'GR-2025-041', b:'badge-in',       bl:' GR',       date:'26 Feb',mat:'Cotton Sliver',    qty:'+400',qc:'var(--odoo-green)', uom:'Kg',   from:'Vendor', to:'BIN-A12',ref:'GRN-2025-018',by:'Admin Kumar'},
  {doc:'GI-2025-042', b:'badge-out',      bl:' GI',       date:'26 Feb',mat:'Ring Yarn',         qty:'-120', qc:'var(--odoo-red)',   uom:'Kg',   from:'BIN-B04',to:'PP Floor', ref:'WO-2025-017', by:'Admin Kumar'},
  {doc:'TR-2025-017', b:'badge-transfer', bl:' Transfer', date:'25 Feb',mat:'Lattice Aprons',    qty:'50',   qc:'var(--odoo-purple)',uom:'Nos',  from:'BIN-C05',to:'BIN-D02', ref:'Manual',      by:'Storekeeper'},
  {doc:'GR-2025-040', b:'badge-in',       bl:' GR',       date:'24 Feb',mat:'Solvent Chemical',  qty:'+30',  qc:'var(--odoo-green)', uom:'Litre',from:'Vendor', to:'BIN-E10',ref:'GRN-2025-017',by:'Admin Kumar'},
  {doc:'ADJ-2025-004',b:'badge-pending',  bl:' Adjust',  date:'23 Feb',mat:'Packing Boxes',      qty:'-15',  qc:'var(--odoo-red)',   uom:'Nos',  from:'BIN-F06',to:'BIN-F06',ref:'PI-2025-003', by:'Storekeeper'},
  {doc:'GI-2025-041', b:'badge-out',      bl:' GI',       date:'22 Feb',mat:'Cotton Sliver',     qty:'-80',  qc:'var(--odoo-red)',   uom:'Kg',   from:'BIN-A12',to:'PP Floor',ref:'WO-2025-015', by:'Admin Kumar'},
]

export default function MovementLog() {
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Movement Log <small>MB51 · All Stock Movements</small></div>
        <div className="wm-lv-actions"><button className="btn btn-s sd-bsm">Export</button></div>
      </div>
      <div className="wm-filter-bar">
        <div className="wm-filter-search"><input placeholder="Search material, document no..."/></div>
        <select className="wm-filter-select"><option>All Types</option><option>GR (101)</option><option>GI (201/261)</option><option> Transfer (311)</option><option> Adjustment</option></select>
        <input type="date" className="wm-filter-select" defaultValue="2025-02-01"/>
        <input type="date" className="wm-filter-select" defaultValue="2025-02-28"/>
        <button className="btn btn-s sd-bsm"> Reset</button>
      </div>
      <table className="wm-data-table">
        <thead><tr><th>Doc No.</th><th>Type</th><th>Date</th><th>Material</th><th>Qty</th><th>UOM</th><th>From</th><th>To</th><th>Ref</th><th>Posted By</th></tr></thead>
        <tbody>
          {MOVEMENTS.map(m => (
            <tr key={m.doc}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{m.doc}</strong></td>
              <td><span className={`badge ${m.b}`}>{m.bl}</span></td>
              <td>{m.date}</td><td>{m.mat}</td>
              <td><strong style={{color:m.qc}}>{m.qty}</strong></td>
              <td>{m.uom}</td><td>{m.from}</td><td>{m.to}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)'}}>{m.ref}</td>
              <td style={{color:'var(--odoo-gray)'}}>{m.by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
