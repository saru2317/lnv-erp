import React, { useState } from 'react'

const VENDORS = [
  {id:'V-001',name:'Sri Lakshmi Textiles',material:'Cotton Bale',lots:8,pass:8,ncrs:0,rating:98.5,grade:'A',clr:'var(--odoo-green)'},
  {id:'V-002',name:'Rajiv Chemicals',material:'Solvent Chemical',lots:6,pass:4,ncrs:2,rating:72.0,grade:'C',clr:'var(--odoo-red)'},
  {id:'V-003',name:'Coimbatore Fibers',material:'Cotton Sliver',lots:5,pass:5,ncrs:0,rating:97.0,grade:'A',clr:'var(--odoo-green)'},
  {id:'V-004',name:'Aruna Industries',material:'Solvent Chemical',lots:4,pass:3,ncrs:1,rating:81.5,grade:'B',clr:'var(--odoo-orange)'},
  {id:'V-005',name:'KG Spare Parts',material:'Mechanical Spares',lots:10,pass:10,ncrs:0,rating:99.0,grade:'A+',clr:'var(--odoo-green)'},
  {id:'V-006',name:'Prabhu Polymers',material:'Packing Materials',lots:7,pass:7,ncrs:0,rating:100,grade:'A+',clr:'var(--odoo-green)'},
]

export default function VendorQuality() {
  const [sel, setSel] = useState(null)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Vendor Quality Rating <small>Supplier Performance — Feb 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-s sd-bsm">📧 Send Reports</button>
        </div>
      </div>

      <div className="pp-alert info">📊 Vendor ratings are calculated based on: Inspection pass rate (50%) + On-time delivery (30%) + NCR count (20%). Rating is auto-updated after each GRN inspection.</div>

      {/* Score Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px',marginBottom:'20px'}}>
        {VENDORS.map(v=>(
          <div key={v.id} style={{background:'#fff',borderRadius:'8px',padding:'16px',
            boxShadow:'0 1px 4px rgba(0,0,0,.08)',cursor:'pointer',
            border:`2px solid ${sel===v.id?'var(--odoo-purple)':'transparent'}`,
            transition:'all .15s'}} onClick={() => setSel(sel===v.id?null:v.id)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
              <div>
                <div style={{fontWeight:'700',fontSize:'13px'}}>{v.name}</div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{v.material}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'20px',color:v.clr,lineHeight:1}}>{v.grade}</div>
                <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>Grade</div>
              </div>
            </div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'26px',color:v.clr,marginBottom:'4px'}}>{v.rating}%</div>
            <div className="yield-bar" style={{marginBottom:'6px'}}>
              <div className="yield-fill" style={{width:`${v.rating}%`,background:v.clr}}></div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:'var(--odoo-gray)'}}>
              <span>✅ {v.pass}/{v.lots} lots passed</span>
              <span style={{color:v.ncrs>0?'var(--odoo-red)':'var(--odoo-green)',fontWeight:'700'}}>
                {v.ncrs>0?`❌ ${v.ncrs} NCR`:'✅ No NCR'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Table */}
      <table className="fi-data-table">
        <thead><tr>
          <th>Vendor</th><th>Material</th><th>Lots Received</th><th>Passed</th>
          <th>NCRs</th><th>Quality Rating</th><th>Grade</th><th>Status</th>
        </tr></thead>
        <tbody>
          {VENDORS.map(v=>(
            <tr key={v.id}>
              <td><strong>{v.name}</strong><div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{v.id}</div></td>
              <td>{v.material}</td>
              <td style={{textAlign:'center'}}>{v.lots}</td>
              <td style={{color:'var(--odoo-green)',fontWeight:'600',textAlign:'center'}}>{v.pass}</td>
              <td style={{color:v.ncrs>0?'var(--odoo-red)':'var(--odoo-green)',fontWeight:'700',textAlign:'center'}}>{v.ncrs||'—'}</td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <div className="yield-bar" style={{width:'80px'}}>
                    <div className="yield-fill" style={{width:`${v.rating}%`,background:v.clr}}></div>
                  </div>
                  <span style={{fontWeight:'700',color:v.clr}}>{v.rating}%</span>
                </div>
              </td>
              <td><span style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'16px',color:v.clr}}>{v.grade}</span></td>
              <td><span className={`badge ${v.rating>=90?'badge-pass':v.rating>=75?'badge-review':'badge-fail'}`}>
                {v.rating>=90?'✅ Approved':v.rating>=75?'⚠️ Conditional':'❌ Review Required'}
              </span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
