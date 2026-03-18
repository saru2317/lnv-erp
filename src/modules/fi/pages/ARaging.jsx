import React, { useState } from 'react'

const AR_DATA = [
  {cust:'ABC Textiles Pvt Ltd',   inv:'INV-2025-042',idate:'28 Feb',due:'30 Mar',amt:'₹2,36,000',d0:'₹2,36,000',d31:'—',d61:'—',d90:'—',sb:'badge-pending',sl:'Current',  act:'Remind'},
  {cust:'MNO Fabrics Ltd',         inv:'INV-2025-041',idate:'24 Feb',due:'26 Mar',amt:'₹3,54,000',d0:'₹3,54,000',d31:'—',d61:'—',d90:'—',sb:'badge-pending',sl:'Current',  act:'Remind'},
  {cust:'XYZ Industries',           inv:'INV-2025-036',idate:'28 Jan',due:'27 Feb',amt:'₹1,85,000',d0:'—',d31:'₹1,85,000',d61:'—',d90:'—',sb:'badge-overdue',sl:'Overdue',  act:'Follow Up'},
  {cust:'PQR Spinning Mills',       inv:'INV-2025-028',idate:'05 Jan',due:'04 Feb',amt:'₹1,80,000',d0:'—',d31:'—',d61:'₹1,80,000',d90:'—',sb:'badge-overdue',sl:'Overdue',  act:'Legal Notice'},
  {cust:'DEF Mills Pvt Ltd',        inv:'INV-2024-412',idate:'18 Nov',due:'17 Dec',amt:'₹40,000', d0:'—',d31:'—',d61:'—',d90:'₹40,000',sb:'badge-overdue',sl:'Bad Debt Risk',act:'Write Off?'},
]

export default function ARaging() {
  const [modal, setModal] = useState(null)
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">AR Aging <small>Accounts Receivable · Overdue Analysis</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm">💰 Record Receipt</button>
        </div>
      </div>
      <div className="fi-kpi-grid">
        {[{cls:'green',l:'Current (0-30 days)',v:'₹5,90,000',s:'2 invoices — on track'},
          {cls:'orange',l:'31-60 days',v:'₹1,85,000',s:'1 invoice — follow up'},
          {cls:'red',l:'61-90 days',v:'₹1,80,000',s:'1 invoice — urgent'},
          {cls:'red',l:'>90 days',v:'₹40,000',s:'1 invoice — bad debt risk'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr>
          <th>Customer</th><th>Invoice</th><th>Inv Date</th><th>Due Date</th><th>Amount</th>
          <th>0–30 Days</th><th>31–60 Days</th><th>61–90 Days</th><th>&gt;90 Days</th>
          <th>Status</th><th>Action</th>
        </tr></thead>
        <tbody>{AR_DATA.map(r=>(
          <tr key={r.inv} onClick={() => setModal(r)}>
            <td><strong>{r.cust}</strong></td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)'}}>{r.inv}</td>
            <td>{r.idate}</td><td>{r.due}</td>
            <td style={{fontWeight:'700'}}>{r.amt}</td>
            <td style={{color:'var(--odoo-green)',fontWeight:'600'}}>{r.d0}</td>
            <td style={{color:'var(--odoo-orange)',fontWeight:'600'}}>{r.d31}</td>
            <td style={{color:'var(--odoo-red)',fontWeight:'600'}}>{r.d61}</td>
            <td style={{color:'var(--odoo-red)',fontWeight:'600'}}>{r.d90}</td>
            <td><span className={`badge ${r.sb}`}>{r.sl}</span></td>
            <td onClick={e=>e.stopPropagation()}>
              <button className="btn-xs" style={r.sl!=='Current'?{background:'var(--odoo-red)',color:'#fff',borderColor:'var(--odoo-red)'}:{}}>{r.act}</button>
            </td>
          </tr>
        ))}</tbody>
      </table>

      {modal && (
        <div className="fi-modal-overlay" onClick={() => setModal(null)}>
          <div className="fi-modal-box" onClick={e=>e.stopPropagation()}>
            <div className="fi-modal-hdr">
              <h3>📋 {modal.inv} · {modal.cust}</h3>
              <span className="fi-modal-close" onClick={() => setModal(null)}>✕</span>
            </div>
            <div className="fi-modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                {[['Customer',modal.cust],['Invoice Date',modal.idate],['Due Date',modal.due],['Amount',modal.amt],['Status',modal.sl],['Overdue >90',modal.d90]].map(([l,v])=>(
                  <div key={l}><label style={{fontSize:'11px',color:'var(--odoo-gray)',fontWeight:'700',textTransform:'uppercase',display:'block',marginBottom:'3px'}}>{l}</label><strong>{v}</strong></div>
                ))}
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
                <button className="btn btn-s sd-bsm" onClick={() => setModal(null)}>Close</button>
                <button className="btn btn-p sd-bsm">💰 Record Receipt</button>
                <button className="btn btn-s sd-bsm">📧 Send Reminder Email</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
