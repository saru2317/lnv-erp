import React from 'react'
const AP = [
  {vend:'Lakshmi Textile Mills',  inv:'VINV-2025-012',due:'24 Mar',amt:'₹2,08,000',d0:'₹2,08,000',d31:'—',d60:'—',sb:'badge-pending',sl:'Current'},
  {vend:'Coimbatore Spares Co.',  inv:'VINV-2025-011',due:'10 Mar',amt:'₹89,250', d0:'₹89,250', d31:'—',d60:'—',sb:'badge-pending',sl:'Current'},
  {vend:'Sri Murugan Traders',    inv:'VINV-2025-010',due:'17 Feb',amt:'₹36,200', d0:'—',        d31:'—',d60:'₹36,200',sb:'badge-overdue',sl:'Overdue'},
  {vend:'Aruna Industries',        inv:'VINV-2024-098',due:'10 Jan',amt:'₹24,800', d0:'—',        d31:'—',d60:'₹24,800',sb:'badge-overdue',sl:'Overdue'},
]
export default function APAging() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">AP Aging <small>Accounts Payable · Payment Due Analysis</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm">💳 Record Payment</button>
        </div>
      </div>
      <div className="fi-kpi-grid">
        {[{cls:'green',l:'Current (0-30 days)',v:'₹2,97,250',s:'2 invoices'},
          {cls:'orange',l:'31-60 days',v:'₹0',s:'—'},
          {cls:'red',l:'>60 days',v:'₹61,000',s:'2 invoices — pay now'},
          {cls:'purple',l:'Total AP Outstanding',v:'₹3,58,250',s:'4 vendors'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Vendor</th><th>Invoice</th><th>Due Date</th><th>Amount</th><th>0-30 Days</th><th>31-60 Days</th><th>&gt;60 Days</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{AP.map(r=>(
          <tr key={r.inv}>
            <td><strong>{r.vend}</strong></td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)'}}>{r.inv}</td>
            <td>{r.due}</td><td style={{fontWeight:'700'}}>{r.amt}</td>
            <td style={{color:'var(--odoo-green)',fontWeight:'600'}}>{r.d0}</td>
            <td>{r.d31}</td>
            <td style={{color:'var(--odoo-red)',fontWeight:'600'}}>{r.d60}</td>
            <td><span className={`badge ${r.sb}`}>{r.sl}</span></td>
            <td><button className="btn-xs" style={r.sl==='Overdue'?{background:'var(--odoo-red)',color:'#fff',borderColor:'var(--odoo-red)'}:{}}>
              {r.sl==='Overdue'?'Pay Now':'Schedule'}
            </button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
