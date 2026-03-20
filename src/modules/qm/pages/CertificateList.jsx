import React, { useState } from 'react'

const CERTS = [
  {id:'COC-2025-048',lot:'QIL-048',date:'28 Feb',cust:'Sunrise Mills Pvt Ltd',  prod:'Ring Yarn (30s)',qty:'394 Kg',yield:'98.5%',type:'COC',sb:'badge-pass',valid:'28 Mar'},
  {id:'TR-2025-047', lot:'QIL-047',date:'27 Feb',cust:'Global Textile Exports', prod:'OE Yarn (12s)',  qty:'580 Kg',yield:'98.6%',type:'Test Report',sb:'badge-pass',valid:'27 Mar'},
  {id:'COC-2025-045',lot:'QIL-045',date:'23 Feb',cust:'Trimurti Fabrics Ltd',   prod:'Cotton Sliver', qty:'792 Kg',yield:'100%', type:'COC',sb:'badge-pass',valid:'23 Mar'},
  {id:'TR-2025-044', lot:'QIL-044',date:'20 Feb',cust:'Internal — Stock',       prod:'Cotton Bale',   qty:'500 Kg',yield:'100%', type:'Test Report',sb:'badge-pass',valid:'20 Mar'},
  {id:'COC-2025-042',lot:'QIL-042',date:'16 Feb',cust:'ABC Textiles (Export)',  prod:'Ring Yarn (30s)',qty:'396 Kg',yield:'99%',  type:'COC + NABL',sb:'badge-pass',valid:'16 Mar'},
  {id:'COC-2025-041',lot:'QIL-041',date:'14 Feb',cust:'Sunrise Mills Pvt Ltd',  prod:'Ring Yarn (30s)',qty:'200 Kg',yield:'100%', type:'COC + NABL',sb:'badge-pass',valid:'14 Mar'},
]

export default function CertificateList() {
  const [modal, setModal] = useState(null)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">COC / Test Certificates <small>Quality Certificates Issued</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Bulk Export</button>
          <button className="btn btn-p sd-bsm">Issue Certificate</button>
        </div>
      </div>

      <div className="fi-filter-bar">
        <div className="fi-filter-search"><input placeholder="Search cert no., lot, customer..."/></div>
        <select className="fi-filter-select"><option>All Types</option><option>COC</option><option>Test Report</option><option>NABL</option></select>
        <input type="date" className="fi-filter-select" defaultValue="2025-02-01"/>
        <input type="date" className="fi-filter-select" defaultValue="2025-02-28"/>
      </div>

      {/* Card view */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px',marginBottom:'20px'}}>
        {CERTS.slice(0,3).map(c=>(
          <div key={c.id} className="cert-card" onClick={() => setModal(c)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
              <div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',color:'var(--odoo-purple)'}}>{c.id}</div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{c.date} Feb 2025</div>
              </div>
              <span style={{background:'#EAF9F6',color:'var(--odoo-green)',padding:'3px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:'700'}}>{c.type}</span>
            </div>
            <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'4px'}}>{c.prod}</div>
            <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginBottom:'8px'}}>{c.cust}</div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px'}}>
              <span>{c.qty}</span>
              <span style={{fontWeight:'700',color:'var(--odoo-green)'}}>Yield: {c.yield}</span>
            </div>
            <div style={{marginTop:'8px',display:'flex',gap:'6px'}}>
              <button className="btn-xs pri" onClick={e=>{e.stopPropagation();setModal(c)}}> View</button>
              <button className="btn-xs" onClick={e=>e.stopPropagation()}>PDF</button>
              <button className="btn-xs" onClick={e=>e.stopPropagation()}> Send</button>
            </div>
          </div>
        ))}
      </div>

      {/* Table view for rest */}
      <table className="fi-data-table">
        <thead><tr>
          <th>Cert No.</th><th>Inspection Lot</th><th>Date</th><th>Customer</th>
          <th>Product</th><th>Qty</th><th>Yield</th><th>Type</th><th>Valid Until</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {CERTS.map(c=>(
            <tr key={c.id}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{c.id}</strong></td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-gray)'}}>{c.lot}</td>
              <td>{c.date} Feb</td>
              <td>{c.cust}</td>
              <td>{c.prod}</td>
              <td>{c.qty}</td>
              <td style={{fontWeight:'700',color:'var(--odoo-green)'}}>{c.yield}</td>
              <td><span style={{background:'#EAF9F6',color:'var(--odoo-green)',padding:'2px 8px',borderRadius:'4px',fontSize:'11px',fontWeight:'700'}}>{c.type}</span></td>
              <td style={{fontSize:'11px'}}>{c.valid}</td>
              <td><div style={{display:'flex',gap:'4px'}}>
                <button className="btn-xs" onClick={()=>setModal(c)}>View</button>
                <button className="btn-xs">PDF</button>
                <button className="btn-xs">Email</button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {modal && (
        <div className="fi-modal-overlay" onClick={() => setModal(null)}>
          <div className="fi-modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:'520px'}}>
            <div className="fi-modal-hdr">
               {modal.id}
              <button className="fi-modal-close" onClick={() => setModal(null)}></button>
            </div>
            <div className="fi-modal-body">
              <div style={{textAlign:'center',padding:'20px 0',borderBottom:'2px solid var(--odoo-border)',marginBottom:'16px'}}>
                <div style={{fontSize:'32px',marginBottom:'8px'}}></div>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:'18px',fontWeight:'800',color:'var(--odoo-purple)'}}>Certificate of Conformance</div>
                <div style={{fontSize:'12px',color:'var(--odoo-gray)'}}>LNV Manufacturing Pvt. Ltd. · Ranipet, Tamil Nadu</div>
              </div>
              {[['Certificate No.',modal.id],['Inspection Lot',modal.lot],['Date',`${modal.date} Feb 2025`],
                ['Customer',modal.cust],['Product',modal.prod],['Quantity',modal.qty],
                ['Test Yield',modal.yield],['Result',' Conforms to specification'],
                ['Valid Until',modal.valid]].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #F5F0F4',fontSize:'13px'}}>
                  <span style={{color:'var(--odoo-gray)',fontWeight:'600'}}>{l}</span>
                  <span style={{fontWeight:'700'}}>{v}</span>
                </div>
              ))}
              <div style={{marginTop:'16px',display:'flex',gap:'10px'}}>
                <button className="btn btn-p sd-bsm" style={{flex:1}}>Download PDF</button>
                <button className="btn btn-s sd-bsm" style={{flex:1}}> Email to Customer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
