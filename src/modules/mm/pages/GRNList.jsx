import React from 'react'
import { useNavigate } from 'react-router-dom'

const GRNS = [
  {id:'GRN-2025-018',po:'PO-2025-040',vendor:'Sri Murugan Traders', date:'26 Feb 2025',mat:'Packing Boxes',     ord:'1000 Nos',recv:'1000 Nos',qc:'mm-bdg-approved',ql:'Accepted', sb:'mm-bdg-received',sl:'Fully Received'},
  {id:'GRN-2025-017',po:'PO-2025-039',vendor:'Aruna Industries',     date:'24 Feb 2025',mat:'Solvent Chemical',  ord:'50 Litre', recv:'30 Litre', qc:'mm-bdg-approved',ql:'Accepted', sb:'mm-bdg-partial', sl:'Partial Receipt'},
  {id:'GRN-2025-016',po:'PO-2025-037',vendor:'Shree Cotton Mills',   date:'21 Feb 2025',mat:'Cotton Sliver',     ord:'300 Kg',   recv:'295 Kg',   qc:'mm-bdg-pending', ql:'QC Pending',sb:'mm-bdg-received',sl:'Fully Received'},
]

export default function GRNList() {
  const nav = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Goods Receipt Notes <small>MB51 · GRN Register</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/grn/new')}>＋ Record GRN</button>
        </div>
      </div>
      <div className="mm-filt">
        <div className="mm-fs-input">🔍<input placeholder="Search GRN No., PO No., Vendor..."/></div>
        <select className="mm-fsel"><option>All Vendors</option><option>Lakshmi Textile Mills</option><option>Sri Murugan Traders</option><option>Aruna Industries</option></select>
        <select className="mm-fsel"><option>All Status</option><option>Fully Received</option><option>Partial</option><option>Quality Hold</option></select>
      </div>
      <table className="mm-tbl">
        <thead><tr><th><input type="checkbox"/></th><th>GRN No.</th><th>PO No.</th><th>Vendor</th><th>GRN Date</th><th>Material</th><th>Ordered Qty</th><th>Received Qty</th><th>Quality</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {GRNS.map(g => (
            <tr key={g.id}>
              <td><input type="checkbox"/></td>
              <td><strong style={{color:'var(--odoo-purple)',fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{g.id}</strong></td>
              <td style={{color:'var(--odoo-purple)',fontSize:'12px'}}>{g.po}</td>
              <td>{g.vendor}</td><td>{g.date}</td><td>{g.mat}</td><td>{g.ord}</td><td>{g.recv}</td>
              <td><span className={`mm-badge ${g.qc}`}>{g.ql}</span></td>
              <td><span className={`mm-badge ${g.sb}`}>{g.sl}</span></td>
              <td><div style={{display:'flex',gap:4}}><button className="btn-xs">View</button><button className="btn-xs" onClick={() => nav('/print/grn')}>Print</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
