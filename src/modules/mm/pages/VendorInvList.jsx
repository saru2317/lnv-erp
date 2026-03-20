import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const INVS = [
  {id:'VINV-2025-012',extId:'LTM/2025/0124',vendor:'Lakshmi Textile Mills', po:'PO-2025-037',date:'22 Feb 2025',due:'24 Mar 2025',amt:'₹2,08,000',paid:'₹0',      bal:'₹2,08,000',balc:'var(--odoo-orange)',b:'mm-bdg-pending', l:'Pending', act:'pay'},
  {id:'VINV-2025-011',extId:'CS/INV/025',   vendor:'Coimbatore Spares Co.', po:'PO-2025-036',date:'20 Feb 2025',due:'22 Mar 2025',amt:'₹88,500', paid:'₹0',      bal:'₹88,500',  balc:'var(--odoo-orange)',b:'mm-bdg-pending', l:'Pending', act:'pay'},
  {id:'VINV-2025-010',extId:'SMT/2025/018', vendor:'Sri Murugan Traders',   po:'PO-2025-035',date:'15 Feb 2025',due:'17 Feb 2025',amt:'₹36,200', paid:'₹0',      bal:'₹36,200',  balc:'var(--odoo-red)',   b:'mm-bdg-overdue', l:'Overdue', act:'urgent'},
  {id:'VINV-2025-009',extId:'AI/2025/045',  vendor:'Aruna Industries',       po:'PO-2025-033',date:'10 Feb 2025',due:'12 Mar 2025',amt:'₹48,500', paid:'₹48,500', bal:'₹0',       balc:'var(--odoo-green)', b:'mm-bdg-paid',    l:'Paid',    act:'view'},
]

export default function VendorInvList() {
  const nav = useNavigate()
  const [chip, setChip] = useState('all')
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Vendor Invoices <small>MIRO · Invoice Verification</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/invoices/new')}>＋ Enter Invoice</button>
        </div>
      </div>
      <div className="mm-chips">
        {[{k:'all',l:'All',n:18},{k:'pending',l:'Pending',n:5},{k:'paid',l:'Paid',n:11},{k:'overdue',l:'Overdue',n:2,red:true}].map(c => (
          <div key={c.k} className={`mm-chip${chip===c.k?' on':''}`} style={c.red && chip!==c.k?{color:'var(--odoo-red)',borderColor:'var(--odoo-red)'}:{}} onClick={() => setChip(c.k)}>
            {c.l} <strong style={{marginLeft:'4px'}}>{c.n}</strong>
          </div>
        ))}
      </div>
      <div className="mm-filt">
        <div className="mm-fs-input"><input placeholder="Search Invoice No., Vendor, PO..."/></div>
        <select className="mm-fsel"><option>All Vendors</option><option>Lakshmi Textile Mills</option><option>Coimbatore Spares Co.</option></select>
        <select className="mm-fsel"><option>All Status</option><option>Pending</option><option>Paid</option><option>Overdue</option></select>
      </div>
      <table className="mm-tbl">
        <thead><tr><th><input type="checkbox"/></th><th>Invoice No.</th><th>Vendor Inv No.</th><th>Vendor</th><th>PO Ref</th><th>Inv Date</th><th>Due Date</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {INVS.map(inv => (
            <tr key={inv.id}>
              <td><input type="checkbox"/></td>
              <td><strong style={{color:'var(--odoo-purple)',fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{inv.id}</strong></td>
              <td style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{inv.extId}</td>
              <td>{inv.vendor}</td>
              <td style={{fontSize:'12px',color:'var(--odoo-purple)'}}>{inv.po}</td>
              <td>{inv.date}</td><td>{inv.due}</td>
              <td><strong>{inv.amt}</strong></td>
              <td>{inv.paid}</td>
              <td><strong style={{color:inv.balc}}>{inv.bal}</strong></td>
              <td><span className={`mm-badge ${inv.b}`}>{inv.l}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                {inv.act==='pay'    && <button className="btn-xs suc">Pay</button>}
                {inv.act==='urgent' && <button className="btn-xs dan">Urgent Pay</button>}
                {inv.act==='view'   && <button className="btn-xs">View</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
