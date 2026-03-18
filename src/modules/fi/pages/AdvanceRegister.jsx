import React, { useState } from 'react'
const ADV = [
  {no:'ADV-C-001',type:'Customer Advance',party:'ABC Textiles Pvt Ltd',date:'15 Feb',amt:'₹1,48,000',ref:'Sales Order SO-2025-018',adjusted:'₹0',pending:'₹1,48,000',sb:'badge-pending',sl:'Open'},
  {no:'ADV-C-002',type:'Customer Advance',party:'MNO Fabrics Ltd',     date:'10 Jan',amt:'₹2,00,000',ref:'Sales Order SO-2025-012',adjusted:'₹2,00,000',pending:'₹0',       sb:'badge-posted',sl:'Adjusted'},
  {no:'ADV-V-001',type:'Vendor Advance',  party:'Lakshmi Textile Mills',date:'01 Feb',amt:'₹1,20,000',ref:'PO-2025-008',           adjusted:'₹1,20,000',pending:'₹0',       sb:'badge-posted',sl:'Adjusted'},
  {no:'ADV-V-002',type:'Vendor Advance',  party:'Coimbatore Spares Co.',date:'20 Feb',amt:'₹50,000', ref:'PO-2025-011',           adjusted:'₹0',        pending:'₹50,000', sb:'badge-pending',sl:'Open'},
  {no:'ADV-E-001',type:'Employee Advance',party:'Ramesh K. (Operator)', date:'22 Feb',amt:'₹5,000',  ref:'Leave Travel Advance',  adjusted:'₹0',        pending:'₹5,000',  sb:'badge-pending',sl:'Open'},
]
export default function AdvanceRegister() {
  const [tab, setTab] = useState('All')
  const filtered = tab==='All' ? ADV : ADV.filter(a => a.type.startsWith(tab))
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Advance Register <small>Customer / Vendor / Employee Advances</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm">New Advance</button>
        </div>
      </div>
      <div className="fi-chips">
        {['All','Customer','Vendor','Employee'].map(t=>(
          <div key={t} className={`fi-chip${tab===t?' on':''}`} onClick={() => setTab(t)}>{t}</div>
        ))}
      </div>
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        {[{cls:'orange',l:'Open Customer Advances',v:'₹1,48,000',s:'1 pending adjustment'},
          {cls:'red',   l:'Open Vendor Advances',  v:'₹50,000',  s:'1 pending adjustment'},
          {cls:'blue',  l:'Open Employee Advances', v:'₹5,000',  s:'1 employee'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Adv. No.</th><th>Type</th><th>Party</th><th>Date</th><th>Amount</th><th>Reference</th><th>Adjusted</th><th>Pending</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{filtered.map(r=>(
          <tr key={r.no}>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.no}</td>
            <td><span className="badge badge-auto" style={{fontSize:'10px'}}>{r.type}</span></td>
            <td><strong>{r.party}</strong></td><td>{r.date}</td>
            <td style={{fontWeight:'700'}}>{r.amt}</td>
            <td style={{fontSize:'12px',color:'var(--odoo-gray)'}}>{r.ref}</td>
            <td className="cr">{r.adjusted}</td>
            <td className={r.pending!=='₹0'?'dr':''}>{r.pending}</td>
            <td><span className={`badge ${r.sb}`}>{r.sl}</span></td>
            <td>{r.sl==='Open'&&<button className="btn-xs">Adjust</button>}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
