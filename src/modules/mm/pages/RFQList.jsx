import React from 'react'
import { useNavigate } from 'react-router-dom'

const RFQS = [
  {id:'RFQ-2025-008',date:'26 Feb 2025',mat:'Cotton Sliver Grade A',qty:'500 Kg',  quoted:'3 / 4',dl:'02 Mar 2025',b:'mm-bdg-new',     l:'Open',      act:'convert'},
  {id:'RFQ-2025-007',date:'22 Feb 2025',mat:'Lattice Aprons (Set)', qty:'200 Nos', quoted:'2 / 3',dl:'28 Feb 2025',b:'mm-bdg-pending',  l:'Pending',   act:'quotes'},
  {id:'RFQ-2025-006',date:'18 Feb 2025',mat:'Packing Boxes DW',     qty:'2000 Nos',quoted:'3 / 3',dl:'23 Feb 2025',b:'mm-bdg-received', l:'Converted', act:'viewpo'},
]

export default function RFQList() {
  const nav = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">RFQ / Enquiries <small>ME41 · Request for Quotation</small></div>
        <div className="lv-acts">
          <button className="btn btn-p sd-bsm">＋ New RFQ</button>
        </div>
      </div>
      <table className="mm-tbl">
        <thead><tr><th>RFQ No.</th><th>Date</th><th>Material</th><th>Qty</th><th>Vendors Quoted</th><th>Deadline</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {RFQS.map(r => (
            <tr key={r.id}>
              <td><strong style={{color:'var(--odoo-purple)',fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{r.id}</strong></td>
              <td>{r.date}</td><td>{r.mat}</td><td>{r.qty}</td>
              <td style={{fontWeight:'600',color:'var(--odoo-blue)'}}>{r.quoted}</td>
              <td>{r.dl}</td>
              <td><span className={`mm-badge ${r.b}`}>{r.l}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                {r.act==='convert' && <button className="btn-xs pri" onClick={() => nav('/mm/po/new')}>Convert to PO</button>}
                {r.act==='quotes'  && <button className="btn-xs">View Quotes</button>}
                {r.act==='viewpo'  && <button className="btn-xs" onClick={() => nav('/mm/po/PO-2025-038')}>View PO</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
