import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DEMO_CS = [
  { id:'CS-2026-0019', date:'17 Mar 2026', prNo:'PR-2026-0041', item:'Battery 12V 65AH × 10',  s1:'Industrial Solar',  s2:'Battery Store',    s3:'—',              selected:'Supplier I',  l1:'₹3,813',  status:'approved', poNo:'PO-2026-0089' },
  { id:'CS-2026-0018', date:'14 Mar 2026', prNo:'PR-2026-0040', item:'Hydraulic Oil × 50 Ltrs', s1:'Chennai Lubricants',s2:'Vega Oil Co.',      s3:'Oil India Dist.',selected:'Supplier II', l1:'₹285',    status:'pending',  poNo:null },
  { id:'CS-2026-0017', date:'08 Mar 2026', prNo:'PR-2026-0037', item:'Thickness Gauge × 2',     s1:'Raj Instruments',  s2:'Metrology Plus',   s3:'Quality Tools',  selected:'Supplier III',l1:'₹4,200',  status:'approved', poNo:'PO-2026-0083' },
  { id:'CS-2026-0016', date:'01 Mar 2026', prNo:'PR-2026-0036', item:'V-Belt A-42 × 10',         s1:'Coimbatore Belt',  s2:'Fenner Dist.',     s3:'SKF Bearings',   selected:'Supplier I',  l1:'₹126',    status:'approved', poNo:'PO-2026-0080' },
  { id:'CS-2026-0015', date:'22 Feb 2026', prNo:'PR-2026-0033', item:'Powder Coat (Silver) × 20',s1:'Akzo Nobel Dist.', s2:'Asian Paints Ind.',s3:'Berger Powder',  selected:'Supplier II', l1:'₹580',    status:'draft',    poNo:null },
]

const STATUS = {
  draft:    {label:'Draft',    bg:'#E2E3E5',color:'#383D41'},
  pending:  {label:'Pending HOD',bg:'#FFF3CD',color:'#856404'},
  approved: {label:'Approved', bg:'#D4EDDA',color:'#155724'},
}

export default function CSList() {
  const nav = useNavigate()
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Comparative Statements <small>Purchase CS Register</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/mm/cs/new')}>+ New CS</button>
        </div>
      </div>
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
        {[
          {cls:'purple',l:'Total CS',   v:DEMO_CS.length,                                s:'This month'},
          {cls:'orange',l:'Pending HOD',v:DEMO_CS.filter(c=>c.status==='pending').length, s:'Awaiting approval'},
          {cls:'green', l:'Approved',   v:DEMO_CS.filter(c=>c.status==='approved').length,s:'PO can be raised'},
          {cls:'blue',  l:'PO Raised',  v:DEMO_CS.filter(c=>c.poNo).length,               s:'Completed'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead>
          <tr>
            <th>CS No.</th><th>Date</th><th>PR No.</th><th>Item</th>
            <th>Supplier I</th><th>Supplier II</th><th>Supplier III</th>
            <th>L1 Cost</th><th>Selected</th><th>Status</th><th>PO No.</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {DEMO_CS.map(cs=>{
            const st = STATUS[cs.status]
            return (
              <tr key={cs.id}>
                <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:12,
                  color:'var(--odoo-purple)',cursor:'pointer'}}
                  onClick={()=>nav('/mm/cs/new')}>{cs.id}</strong></td>
                <td style={{fontSize:12}}>{cs.date}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-gray)'}}>{cs.prNo}</td>
                <td style={{fontSize:12,maxWidth:180}}>{cs.item}</td>
                <td style={{fontSize:11}}>{cs.s1}</td>
                <td style={{fontSize:11}}>{cs.s2}</td>
                <td style={{fontSize:11}}>{cs.s3}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,
                  color:'var(--odoo-green)'}}>{cs.l1}</td>
                <td><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,
                  background:'#EDE0EA',color:'var(--odoo-purple)'}}>{cs.selected}</span></td>
                <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,
                  background:st.bg,color:st.color}}>{st.label}</span></td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-green)'}}>
                  {cs.poNo||<span style={{color:'var(--odoo-gray)'}}>—</span>}
                </td>
                <td>
                  <div style={{display:'flex',gap:4}}>
                    <button className="btn-xs" onClick={()=>nav('/mm/cs/new')}>✏️ Edit</button>
                    <button className="btn-xs" onClick={() => nav('/print/cs')}>Print</button>
                    {cs.status==='approved'&&!cs.poNo&&
                      <button className="btn-xs pri"
                        style={{background:'var(--odoo-green)',color:'#fff'}}
                        onClick={()=>nav('/mm/po/new')}>📋 PO</button>}
                    <button className="btn-xs">Print</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
