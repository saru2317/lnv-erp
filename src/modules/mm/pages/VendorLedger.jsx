import React from 'react'
import { useNavigate } from 'react-router-dom'

const ROWS = [
  {date:'01 Jan 2025',part:'Opening Balance',          ref:'—',    dr:'',          cr:'',          bal:'₹0',         bc:'',                  b:'mm-bdg-draft',    l:'—'},
  {date:'15 Jan 2025',part:'Purchase — PO-2025-029',   ref:'VINV-2025-001',dr:'₹1,85,000',cr:'',   bal:'₹1,85,000',  bc:'',                  b:'mm-bdg-paid',     l:'Paid'},
  {date:'30 Jan 2025',part:'Payment — NEFT',           ref:'PAY-2025-001', dr:'',         cr:'₹1,85,000',bal:'₹0',    bc:'',                  b:'mm-bdg-paid',     l:'Cleared'},
  {date:'21 Feb 2025',part:'Purchase — PO-2025-037',   ref:'VINV-2025-010',dr:'₹2,08,000',cr:'',   bal:'₹2,08,000',  bc:'',                  b:'mm-bdg-pending',  l:'Pending'},
  {date:'25 Feb 2025',part:'Advance Payment',          ref:'PAY-2025-018', dr:'',         cr:'₹66,000',  bal:'₹1,42,000',bc:'var(--odoo-orange)',b:'mm-bdg-partial', l:'Partial'},
]

export default function VendorLedger() {
  const nav = useNavigate()
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Vendor Ledger <small>Outstanding &amp; Transaction History</small></div>
        <div className="lv-acts">
          <select className="mm-fsel" style={{marginRight:'4px'}}>
            <option>Lakshmi Textile Mills</option><option>Coimbatore Spares Co.</option><option>Sri Murugan Traders</option>
          </select>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm">Record Payment</button>
        </div>
      </div>

      {/* Vendor Summary Card */}
      <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',padding:'20px',marginBottom:'14px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px'}}>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'18px',fontWeight:'700'}}>Lakshmi Textile Mills Pvt. Ltd.</div>
            <div style={{fontSize:'12px',color:'var(--odoo-gray)'}}>V-001 · 33AABLM9234B1Z6 · Tiruppur, Tamil Nadu</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'12px',color:'var(--odoo-gray)'}}>Total Outstanding</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'28px',fontWeight:'800',color:'var(--odoo-red)'}}>₹1,42,000</div>
            <div style={{fontSize:'11px',color:'var(--odoo-red)'}}> Overdue since 22 Feb 2025</div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <table className="mm-tbl mm-ldg">
        <thead><tr><th>Date</th><th>Particulars</th><th>Ref No.</th><th>Debit (₹)</th><th>Credit (₹)</th><th>Balance (₹)</th><th>Status</th></tr></thead>
        <tbody>
          {ROWS.map((r,i) => (
            <tr key={i} style={i===ROWS.length-1?{background:'#FEF9E7'}:{}}>
              <td>{r.date}</td><td>{r.part}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{r.ref}</td>
              <td className="dr">{r.dr}</td>
              <td className="cr">{r.cr}</td>
              <td className="bal" style={r.bc?{color:r.bc}:{}}>{r.bal}</td>
              <td><span className={`mm-badge ${r.b}`}>{r.l}</span></td>
            </tr>
          ))}
          <tr style={{background:'#FEF9E7'}}>
            <td colSpan={7} style={{padding:'12px 14px',fontSize:'12px',fontWeight:'700',color:'var(--odoo-orange)'}}>
              Outstanding Balance: ₹1,42,000 — Due by 24 Mar 2025
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{display:'flex',gap:'10px',marginTop:'14px'}}>
        <button className="btn btn-p sd-bsm">Pay ₹1,42,000 (Full)</button>
        <button className="btn btn-s sd-bsm">Partial Payment</button>
      </div>
    </div>
  )
}
