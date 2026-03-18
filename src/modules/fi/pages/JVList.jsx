import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const JVS = [
  {no:'JV-2025-0148',date:'28 Feb 2025',type:'Sales',   typeB:'badge-filed',   narr:'Sales Invoice INV-2025-042 · ABC Textiles',    dr:'₹2,36,000',cr:'₹2,36,000',sb:'badge-posted',sl:'Posted', src:'SD'},
  {no:'JV-2025-0147',date:'27 Feb 2025',type:'Purchase',typeB:'badge-pending',  narr:'Vendor Invoice VINV-2025-012 · Lakshmi Textiles',dr:'₹2,08,000',cr:'₹2,08,000',sb:'badge-posted',sl:'Posted', src:'MM'},
  {no:'JV-2025-0146',date:'26 Feb 2025',type:'Bank',    typeB:'badge-paid',     narr:'Receipt from XYZ Industries — NEFT',             dr:'₹1,85,000',cr:'₹1,85,000',sb:'badge-posted',sl:'Posted', src:'FI'},
  {no:'JV-2025-0145',date:'25 Feb 2025',type:'Manual JV',typeB:'badge-manual',  narr:'Depreciation — Plant & Machinery Feb 2025',     dr:'₹42,000', cr:'₹42,000', sb:'badge-posted',sl:'Posted', src:'FI'},
  {no:'JV-2025-0144',date:'24 Feb 2025',type:'Sales',   typeB:'badge-filed',   narr:'Sales Invoice INV-2025-041 · MNO Fabrics',      dr:'₹3,54,000',cr:'₹3,54,000',sb:'badge-posted',sl:'Posted', src:'SD'},
  {no:'JV-2025-0143',date:'24 Feb 2025',type:'Manual JV',typeB:'badge-manual', narr:'Salary — Feb 2025 payroll (HCM)',                dr:'₹8,40,000',cr:'₹8,40,000',sb:'badge-draft', sl:'Draft',  src:'HCM'},
  {no:'JV-2025-0142',date:'23 Feb 2025',type:'Production',typeB:'badge-auto',  narr:'COGM — Work Order WO-2025-017 PP Module',       dr:'₹6,20,000',cr:'₹6,20,000',sb:'badge-posted',sl:'Posted', src:'PP'},
  {no:'JV-2025-0141',date:'22 Feb 2025',type:'Maintenance',typeB:'badge-auto', narr:'PM Cost — Machine M-102 breakdown repair',       dr:'₹48,000', cr:'₹48,000', sb:'badge-posted',sl:'Posted', src:'PM'},
  {no:'JV-2025-0140',date:'21 Feb 2025',type:'Stock',   typeB:'badge-auto',    narr:'WM — Goods Issue GI-2025-042 to Production',    dr:'₹1,44,000',cr:'₹1,44,000',sb:'badge-posted',sl:'Posted', src:'WM'},
]

export default function JVList() {
  const nav = useNavigate()
  const [chip, setChip] = useState('All')
  const [modal, setModal] = useState(null)
  const chips = ['All','Sales','Purchase','Bank','Manual JV','Production','Maintenance']

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Journal Entries <small>FB03 · All Postings</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/fi/jv/new')}>New Journal</button>
        </div>
      </div>

      <div className="fi-chips">
        {chips.map(c => (
          <div key={c} className={`fi-chip${chip===c?' on':''}`} onClick={() => setChip(c)}>{c}</div>
        ))}
      </div>

      <div className="fi-filter-bar">
        <div className="fi-filter-search">🔍<input placeholder="Search JV no., account, narration..."/></div>
        <select className="fi-filter-select"><option>All Types</option><option>Sales</option><option>Purchase</option><option>Bank</option><option>Manual JV</option><option>Production</option></select>
        <input type="date" className="fi-filter-select" defaultValue="2025-02-01"/>
        <input type="date" className="fi-filter-select" defaultValue="2025-02-28"/>
        <button className="btn btn-s sd-bsm">🔄 Reset</button>
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th><input type="checkbox"/></th>
          <th>JV No.</th><th>Date</th><th>Type</th><th>Narration</th>
          <th>Source</th><th>Debit (₹)</th><th>Credit (₹)</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>
          {JVS.filter(j => chip==='All' || j.type===chip).map(j => (
            <tr key={j.no} onClick={() => setModal(j)}>
              <td onClick={e=>e.stopPropagation()}><input type="checkbox"/></td>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{j.no}</strong></td>
              <td>{j.date}</td>
              <td><span className={`badge ${j.typeB}`}>{j.type}</span></td>
              <td style={{maxWidth:'260px',fontSize:'12px'}}>{j.narr}</td>
              <td><span className="badge badge-auto" style={{fontSize:'10px'}}>{j.src}</span></td>
              <td className="dr">{j.dr}</td>
              <td className="cr">{j.cr}</td>
              <td><span className={`badge ${j.sb}`}>{j.sl}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                {j.sl==='Draft'
                  ? <button className="btn-xs pri" onClick={() => alert('Posted!')}>Post</button>
                  : <>
                    <button className="btn-xs" onClick={() => setModal(j)}>View</button>
                    <button className="btn-xs" onClick={() => nav('/print/jv')}>Print</button>
                  </>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* JV Detail Modal */}
      {modal && (
        <div className="fi-modal-overlay" onClick={() => setModal(null)}>
          <div className="fi-modal-box" onClick={e=>e.stopPropagation()}>
            <div className="fi-modal-hdr">
              <h3>📓 {modal.no}</h3>
              <span className="fi-modal-close" onClick={() => setModal(null)}>✕</span>
            </div>
            <div className="fi-modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                <div><label style={{fontSize:'11px',color:'var(--odoo-gray)',fontWeight:'700',textTransform:'uppercase',display:'block',marginBottom:'3px'}}>JV Number</label><strong>{modal.no}</strong></div>
                <div><label style={{fontSize:'11px',color:'var(--odoo-gray)',fontWeight:'700',textTransform:'uppercase',display:'block',marginBottom:'3px'}}>Date</label><strong>{modal.date}</strong></div>
                <div><label style={{fontSize:'11px',color:'var(--odoo-gray)',fontWeight:'700',textTransform:'uppercase',display:'block',marginBottom:'3px'}}>Status</label><span className={`badge ${modal.sb}`}>{modal.sl}</span></div>
              </div>
              <div style={{background:'#F8F9FA',padding:'10px 14px',borderRadius:'6px',marginBottom:'16px',fontSize:'13px'}}>
                <strong>Narration:</strong> {modal.narr}
              </div>
              <table className="fi-data-table" style={{marginBottom:'16px'}}>
                <thead><tr><th>#</th><th>Account</th><th>Cost Center</th><th>Debit (₹)</th><th>Credit (₹)</th></tr></thead>
                <tbody>
                  <tr><td>1</td><td>1300 · Accounts Receivable</td><td>Sales</td><td className="dr">{modal.dr}</td><td></td></tr>
                  <tr><td>2</td><td>5100 · Sales Revenue</td><td>Sales</td><td></td><td className="cr" style={{color:'var(--odoo-green)'}}>{modal.cr}</td></tr>
                  <tr style={{background:'#F8F9FA',fontWeight:'700'}}><td colSpan={3}>TOTAL</td><td className="dr">{modal.dr}</td><td className="cr" style={{color:'var(--odoo-green)'}}>{modal.cr}</td></tr>
                </tbody>
              </table>
              <div style={{display:'flex',gap:'8px'}}>
                <button className="btn btn-s sd-bsm" onClick={() => setModal(null)}>Close</button>
                <button className="btn btn-s sd-bsm" style={{color:'var(--odoo-red)',borderColor:'var(--odoo-red)'}} onClick={() => setModal(null)}>↩️ Reverse JV</button>
                <button className="btn btn-p sd-bsm" onClick={() => {nav('/fi/ledger'); setModal(null)}}>📜 View in Ledger</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
