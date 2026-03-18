import React from 'react'
const PROPS = [
  { code:'PR-001', name:'Main Factory Building',    type:'Factory',     area:'18,000 sqft', location:'SIPCOT, Ranipet',    value:12000000, status:'Owned',  ownership:'Freehold',  doc:'Sale Deed',       tax:'Mar 2027', insurance:'Dec 2026', remarks:'' },
  { code:'PR-002', name:'Admin & Office Block',     type:'Office',      area:'3,200 sqft',  location:'SIPCOT, Ranipet',    value:2500000,  status:'Owned',  ownership:'Freehold',  doc:'Sale Deed',       tax:'Mar 2027', insurance:'Dec 2026', remarks:'' },
  { code:'PR-003', name:'Godown / Raw Material Store',type:'Warehouse', area:'5,500 sqft',  location:'Phase II, Ranipet',  value:0,        status:'Leased', ownership:'Lease',     doc:'Lease Agreement', tax:'N/A',      insurance:'Jun 2026', remarks:'₹45,000/month · 3yr lease expires Dec 2026' },
  { code:'PR-004', name:'Residential Quarter (Guest)',type:'Residential',area:'1,200 sqft', location:'Near Factory',       value:1800000,  status:'Owned',  ownership:'Freehold',  doc:'Sale Deed',       tax:'Mar 2027', insurance:'Dec 2026', remarks:'Used for visiting directors/guests' },
]
const fmt = n => n>0 ? '₹' + (n/100000).toFixed(1) + 'L' : '—'
const ST = { Owned:{bg:'#D4EDDA',color:'#155724'}, Leased:{bg:'#FFF3CD',color:'#856404'} }
export default function PropertyRegister() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Company Property Register</div>
        <div className="fi-lv-actions"><button className="btn btn-p sd-bsm">+ Add Property</button></div>
      </div>
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
        {[
          {cls:'purple',l:'Total Properties',v:'4',         s:'All locations'},
          {cls:'green', l:'Owned Properties', v:'₹1.63Cr',  s:'3 properties'},
          {cls:'orange',l:'Leased',           v:'1',         s:'Exp. Dec 2026'},
          {cls:'blue',  l:'Total Area',       v:'27,900 sqft',s:'Built-up area'},
        ].map(k=>(<div key={k.l} className={`fi-kpi-card ${k.cls}`}><div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div></div>))}
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Code</th><th>Property Name</th><th>Type</th><th>Area</th><th>Location</th><th>Value</th><th>Ownership</th><th>Document</th><th>Property Tax</th><th>Insurance</th><th>Status</th><th>Remarks</th></tr></thead>
        <tbody>{PROPS.map(p=>{const st=ST[p.status];return(<tr key={p.code}>
          <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)',fontWeight:600}}>{p.code}</td>
          <td style={{fontSize:12,fontWeight:700,maxWidth:180}}>{p.name}</td>
          <td style={{fontSize:11}}>{p.type}</td>
          <td style={{fontSize:11,fontFamily:'DM Mono,monospace'}}>{p.area}</td>
          <td style={{fontSize:11}}>{p.location}</td>
          <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',fontWeight:700,color:'var(--odoo-purple)'}}>{fmt(p.value)}</td>
          <td style={{fontSize:11}}>{p.ownership}</td>
          <td style={{fontSize:11}}>{p.doc}</td>
          <td style={{fontSize:11}}>{p.tax}</td>
          <td style={{fontSize:11}}>{p.insurance}</td>
          <td><span style={{padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:st.bg,color:st.color}}>{p.status}</span></td>
          <td style={{fontSize:11,color:'var(--odoo-gray)',maxWidth:180}}>{p.remarks||'—'}</td>
        </tr>)})}</tbody>
      </table>
    </div>
  )
}
