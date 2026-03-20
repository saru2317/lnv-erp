import React from 'react'
import { useNavigate } from 'react-router-dom'

const ITEMS = [
  { mat:'Ring Yarn (MAT-002)',       cat:'Raw Material',cur:'80 Kg',   curc:'var(--odoo-red)',   reord:'200 Kg',  moq:'300 Kg',  vendor:'Shree Cotton Mills',   short:'-120 Kg',  shortc:'var(--odoo-red)',   pb:'badge-critical', pl:' Urgent', act:'danger' },
  { mat:'Solvent Chemical (MAT-005)',cat:'Chemicals',   cur:'25 Litre',curc:'var(--odoo-orange)',reord:'100 Litre',moq:'200 Litre',vendor:'Aruna Industries',      short:'-75 Litre',shortc:'var(--odoo-red)',   pb:'badge-critical', pl:' Urgent', act:'danger' },
  { mat:'Lattice Aprons (MAT-003)',  cat:'Spares',      cur:'35 Nos',  curc:'var(--odoo-orange)',reord:'50 Nos',  moq:'100 Nos', vendor:'Coimbatore Spares Co.', short:'-15 Nos',  shortc:'var(--odoo-orange)',pb:'badge-low',     pl:' Low',   act:'warn' },
  { mat:'Lubricant Oil (MAT-007)',   cat:'Spares',      cur:'25 Litre',curc:'var(--odoo-orange)',reord:'20 Litre',moq:'50 Litre', vendor:'Local Supplier',        short:'+5 Litre', shortc:'var(--odoo-green)', pb:'badge-ok',      pl:' OK',     act:'ok' },
]

export default function ReorderList() {
  const nav = useNavigate()
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Reorder Alerts <small>Below Minimum Stock Level</small></div>
        <div className="wm-lv-actions">
          <button className="btn btn-p sd-bsm">Create Reorder POs</button>
        </div>
      </div>

      <div className="wm-alert danger">
         <strong>4 items</strong> are below reorder level. Raise purchase orders immediately to avoid production stoppage!
      </div>

      <table className="wm-data-table">
        <thead>
          <tr>
            <th><input type="checkbox"/></th>
            <th>Material</th><th>Category</th>
            <th>Current Stock</th><th>Reorder Level</th><th>Min Order Qty</th>
            <th>Preferred Vendor</th><th>Shortage</th><th>Priority</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {ITEMS.map(it => (
            <tr key={it.mat}>
              <td><input type="checkbox" defaultChecked={it.act!=='ok'}/></td>
              <td><strong>{it.mat}</strong></td>
              <td>{it.cat}</td>
              <td style={{color:it.curc,fontWeight:'700'}}>{it.cur}</td>
              <td>{it.reord}</td>
              <td>{it.moq}</td>
              <td>{it.vendor}</td>
              <td style={{color:it.shortc,fontWeight:'700'}}>{it.short}</td>
              <td><span className={`badge ${it.pb}`}>{it.pl}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                {it.act==='danger' && <button className="btn-xs dan" onClick={() => nav('/mm/po/new')}>Raise PO</button>}
                {it.act==='warn'   && <button className="btn-xs" style={{borderColor:'var(--odoo-orange)',color:'var(--odoo-orange)'}} onClick={() => nav('/mm/po/new')}>Raise PO</button>}
                {it.act==='ok'     && <button className="btn-xs">Review</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
