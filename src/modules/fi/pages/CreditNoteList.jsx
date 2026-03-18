import React, { useState } from 'react'
const NOTES = [
  {no:'CN-2025-003',type:'Credit Note',party:'ABC Textiles',  ref:'INV-2025-040',date:'25 Feb',amt:'₹18,000',reason:'Damaged goods return',gst:'₹3,240', net:'₹21,240',sb:'badge-posted',sl:'Posted'},
  {no:'CN-2025-002',type:'Credit Note',party:'XYZ Industries', ref:'INV-2025-035',date:'12 Feb',amt:'₹15,000',reason:'Price correction',      gst:'₹2,700', net:'₹17,700',sb:'badge-posted',sl:'Posted'},
  {no:'CN-2025-001',type:'Credit Note',party:'MNO Fabrics',    ref:'INV-2025-029',date:'04 Feb',amt:'₹12,500',reason:'Quality rejection — 5%', gst:'₹2,250', net:'₹14,750',sb:'badge-posted',sl:'Posted'},
  {no:'DN-2025-001',type:'Debit Note', party:'Lakshmi Textiles',ref:'VINV-2025-009',date:'20 Feb',amt:'₹8,000',reason:'Short supply charged',   gst:'₹1,440', net:'₹9,440', sb:'badge-pending',sl:'Draft'},
]
export default function CreditNoteList() {
  const [tab, setTab] = useState('All')
  const filtered = tab==='All' ? NOTES : NOTES.filter(n=>n.type===tab+' Note')
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Debit / Credit Notes <small>Adjustments Register</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/print/invoice')}>Print</button>
          <button className="btn btn-s sd-bsm">➕ New Credit Note</button>
          <button className="btn btn-p sd-bsm">➕ New Debit Note</button>
        </div>
      </div>
      <div className="fi-chips">
        {['All','Credit','Debit'].map(t=>(
          <div key={t} className={`fi-chip${tab===t?' on':''}`} onClick={() => setTab(t)}>{t}</div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Note No.</th><th>Type</th><th>Party</th><th>Ref Invoice</th><th>Date</th><th>Base Amount</th><th>GST</th><th>Total</th><th>Reason</th><th>Status</th></tr></thead>
        <tbody>{filtered.map(r=>(
          <tr key={r.no}>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.no}</td>
            <td><span className={`badge ${r.type==='Credit Note'?'badge-filed':'badge-pending'}`}>{r.type}</span></td>
            <td><strong>{r.party}</strong></td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{r.ref}</td>
            <td>{r.date}</td>
            <td className={r.type==='Credit Note'?'cr':'dr'}>{r.amt}</td>
            <td>{r.gst}</td>
            <td style={{fontWeight:'700'}}>{r.net}</td>
            <td style={{fontSize:'12px',color:'var(--odoo-gray)'}}>{r.reason}</td>
            <td><span className={`badge ${r.sb}`}>{r.sl}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
