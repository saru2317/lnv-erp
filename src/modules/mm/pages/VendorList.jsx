import React from 'react'
import { useNavigate } from 'react-router-dom'

const VENDORS = [
  {id:'V-001',name:'Lakshmi Textile Mills Pvt. Ltd.', gstin:'33AABLM9234B1Z6',city:'Tiruppur, TN', cat:'Raw Material',  bal:'₹1,42,000', balc:'var(--odoo-orange)',b:'mm-bdg-approved',l:'Active'},
  {id:'V-002',name:'Coimbatore Spares Co.',           gstin:'33AABCC2341B1Z1',city:'Coimbatore, TN',cat:'Spares',        bal:'₹88,500',   balc:'var(--odoo-orange)',b:'mm-bdg-approved',l:'Active'},
  {id:'V-003',name:'Sri Murugan Traders',             gstin:'33AABCS9871B1Z4',city:'Erode, TN',    cat:'Packing',        bal:'₹36,200 ⚠️',balc:'var(--odoo-red)',   b:'mm-bdg-approved',l:'Active'},
  {id:'V-004',name:'Aruna Industries',                gstin:'33AABCA5631B1Z2',city:'Salem, TN',    cat:'Chemicals',      bal:'₹0',        balc:'var(--odoo-green)', b:'mm-bdg-approved',l:'Active'},
  {id:'V-005',name:'KG Denim Ltd.',                   gstin:'33AABCK7234B1Z9',city:'Karur, TN',    cat:'Raw Material',   bal:'₹0',        balc:'var(--odoo-gray)',  b:'mm-bdg-draft',   l:'Inactive'},
]

export default function VendorList() {
  const nav = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Vendor Master <small>MK03 · All Vendors</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/mm/vendors/new')}>＋ New Vendor</button>
        </div>
      </div>
      <div className="mm-filt">
        <div className="mm-fs-input">🔍<input placeholder="Search vendor name, GSTIN, city..."/></div>
        <select className="mm-fsel"><option>All Categories</option><option>Raw Material</option><option>Spares</option><option>Packing</option><option>Chemicals</option><option>Services</option></select>
        <select className="mm-fsel"><option>All Status</option><option>Active</option><option>Inactive</option><option>Blocked</option></select>
      </div>
      <table className="mm-tbl">
        <thead><tr><th><input type="checkbox"/></th><th>Code</th><th>Vendor Name</th><th>GSTIN</th><th>City</th><th>Category</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {VENDORS.map(v => (
            <tr key={v.id}>
              <td><input type="checkbox"/></td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{v.id}</td>
              <td><strong>{v.name}</strong></td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{v.gstin}</td>
              <td>{v.city}</td><td>{v.cat}</td>
              <td><strong style={{color:v.balc}}>{v.bal}</strong></td>
              <td><span className={`mm-badge ${v.b}`}>{v.l}</span></td>
              <td onClick={e=>e.stopPropagation()} style={{display:'flex',gap:'4px'}}>
                <button className="btn-xs">Edit</button>
                <button className="btn-xs" onClick={() => nav('/mm/vendors/ledger')}>Ledger</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
