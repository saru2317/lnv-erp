import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const POS = [
  {id:'PO-2025-042',date:'25 Feb 2025',vendor:'Lakshmi Textile Mills', cat:'Raw Material',  amt:'₹4,10,000',gst:'₹75,000', total:'₹4,85,000',b:'mm-bdg-approved',l:'Approved',   grn:true},
  {id:'PO-2025-041',date:'24 Feb 2025',vendor:'Coimbatore Spares Co.', cat:'Spares',         amt:'₹1,01,695',gst:'₹18,305',total:'₹1,20,000',b:'mm-bdg-sent',    l:'Sent',        grn:false},
  {id:'PO-2025-040',date:'22 Feb 2025',vendor:'Sri Murugan Traders',   cat:'Packing',        amt:'₹2,00,000',gst:'₹36,000',total:'₹2,36,000',b:'mm-bdg-received', l:'GRN Done',    inv:true},
  {id:'PO-2025-039',date:'20 Feb 2025',vendor:'Aruna Industries',       cat:'Chemicals',      amt:'₹74,745',  gst:'₹13,455',total:'₹88,200',  b:'mm-bdg-partial',  l:'Partial GRN', grn:true},
  {id:'PO-2025-038',date:'18 Feb 2025',vendor:'KG Denim Ltd.',          cat:'Raw Material',   amt:'₹5,44,068',gst:'₹97,932',total:'₹6,42,000',b:'mm-bdg-draft',    l:'Draft',       approve:true},
]

export default function POList() {
  const nav = useNavigate()
  const [chip, setChip] = useState('all')
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Purchase Orders <small>ME2M · All POs</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/po/new')}>＋ New PO</button>
        </div>
      </div>
      <div className="mm-chips">
        {[{k:'all',l:'All',n:18},{k:'draft',l:'Draft',n:3},{k:'approved',l:'Approved',n:8},{k:'received',l:'GRN Done',n:5},{k:'pending',l:'Pending GRN',n:5,red:true}].map(c => (
          <div key={c.k} className={`mm-chip${chip===c.k?' on':''}`} style={c.red && chip!==c.k?{color:'var(--odoo-red)',borderColor:'var(--odoo-red)'}:{}} onClick={() => setChip(c.k)}>
            {c.l} <strong style={{marginLeft:'4px'}}>{c.n}</strong>
          </div>
        ))}
      </div>
      <div className="mm-filt">
        <div className="mm-fs-input">🔍<input placeholder="Search PO No., Vendor, Material..." /></div>
        <select className="mm-fsel"><option>All Vendors</option><option>Lakshmi Textile Mills</option><option>Coimbatore Spares Co.</option><option>Sri Murugan Traders</option></select>
        <select className="mm-fsel"><option>All Status</option><option>Draft</option><option>Approved</option><option>GRN Done</option><option>Partial GRN</option></select>
        <select className="mm-fsel"><option>Feb 2025</option><option>Jan 2025</option><option>Dec 2024</option></select>
      </div>
      <table className="mm-tbl">
        <thead><tr><th><input type="checkbox"/></th><th>PO No.</th><th>Date</th><th>Vendor</th><th>Category</th><th>Amount</th><th>GST</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {POS.map(p => (
            <tr key={p.id} onClick={() => nav(`/mm/po/${p.id}`)}>
              <td onClick={e=>e.stopPropagation()}><input type="checkbox"/></td>
              <td><strong style={{color:'var(--odoo-purple)',fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{p.id}</strong></td>
              <td>{p.date}</td><td>{p.vendor}</td><td>{p.cat}</td>
              <td>{p.amt}</td><td>{p.gst}</td><td><strong>{p.total}</strong></td>
              <td><span className={`mm-badge ${p.b}`}>{p.l}</span></td>
              <td onClick={e=>e.stopPropagation()} style={{display:'flex',gap:'4px'}}>
                <button className="btn-xs" onClick={() => nav(`/mm/po/${p.id}`)}>View</button>
                <button className="btn-xs" onClick={() => nav('/print/po')}>Print</button>
                {p.grn    && <button className="btn-xs suc" onClick={() => nav('/mm/grn/new')}>GRN</button>}
                {p.inv    && <button className="btn-xs" onClick={() => nav('/mm/invoices/new')}>Invoice</button>}
                {p.approve&& <button className="btn-xs pri">Approve</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
