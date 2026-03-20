import React from 'react'
import { useNavigate } from 'react-router-dom'

const PENDING = [
  {id:'PO-2025-042',vendor:'Lakshmi Textile Mills',  ord:'25 Feb 2025',exp:'05 Mar 2025',days:'On time',     dayc:'var(--odoo-gray)', amt:'₹4,85,000',act:'grn'},
  {id:'PO-2025-041',vendor:'Coimbatore Spares Co.',   ord:'24 Feb 2025',exp:'03 Mar 2025',days:'On time',     dayc:'var(--odoo-gray)', amt:'₹1,20,000',act:'grn'},
  {id:'PO-2025-038',vendor:'KG Denim Ltd.',           ord:'18 Feb 2025',exp:'28 Feb 2025',days:'2 days late', dayc:'var(--odoo-red)',   amt:'₹6,42,000',act:'followup'},
]

export default function PendingPO() {
  const nav = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Pending GRN — Purchase Orders <small>Awaiting Receipt</small></div>
      </div>
      <div className="mm-alert warn"> The following POs have not received GRN within the expected delivery date. Please follow up with vendors.</div>
      <table className="mm-tbl">
        <thead><tr><th>PO No.</th><th>Vendor</th><th>Order Date</th><th>Expected Delivery</th><th>Days Overdue</th><th>Amount</th><th>Actions</th></tr></thead>
        <tbody>
          {PENDING.map(p => (
            <tr key={p.id}>
              <td><strong style={{color:'var(--odoo-purple)',fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{p.id}</strong></td>
              <td>{p.vendor}</td><td>{p.ord}</td><td>{p.exp}</td>
              <td style={{color:p.dayc,fontWeight: p.days!=='On time'?'700':'400'}}>{p.days}</td>
              <td><strong>{p.amt}</strong></td>
              <td onClick={e=>e.stopPropagation()}>
                {p.act==='grn'     && <button className="btn-xs suc" onClick={() => nav('/mm/grn/new')}>Record GRN</button>}
                {p.act==='followup'&& <button className="btn-xs dan">Follow Up</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
