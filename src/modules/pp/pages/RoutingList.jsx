import React from 'react'
import { useNavigate } from 'react-router-dom'

const ROUTES = [
  {id:'RTE-001',name:'Standard Ring Yarn Route',prod:'Ring Yarn (30s/40s)',ops:5,time:'28.2 hrs/100kg',status:'Active',
   steps:['10 · Mixing & Blow Room → BLW-01','20 · Carding → CRD-01','30 · Drawing (1st Pass) → DRW-01','40 · Ring Spinning → RFM-01','50 · Winding & Packing → WD-01']},
  {id:'RTE-002',name:'Open End Yarn Route',prod:'Open End Yarn (12s)',ops:4,time:'18.5 hrs/100kg',status:'Active',
   steps:['10 · Blow Room → BLW-01','20 · Carding → CRD-01','30 · OE Spinning → OE-02','40 · Winding → WD-01']},
  {id:'RTE-003',name:'Compact Sliver Route',prod:'Compact Cotton Sliver',ops:3,time:'12.0 hrs/100kg',status:'Active',
   steps:['10 · Blow Room → BLW-01','20 · Carding → CRD-01','30 · Drawing → DRW-01']},
  {id:'RTE-004',name:'Premium Ring Yarn Route',prod:'Ring Yarn (60s Count)',ops:6,time:'36.0 hrs/100kg',status:'Draft',
   steps:['10 · Mixing → BLW-01','20 · Carding → CRD-01','30 · Drawing 1st → DRW-01','40 · Drawing 2nd → DRW-02','50 · Ring Spinning → RFM-02','60 · Winding → WD-01']},
]

export default function RoutingList() {
  const nav = useNavigate()
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Routing List <small>CA03 · Production Routing</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={() => nav('/pp/routing/new')}>Create Routing</button>
        </div>
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Routing No.</th><th>Name</th><th>Product</th><th>Operations</th><th>Std Time</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {ROUTES.map(r=>(
            <tr key={r.id}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.id}</strong></td>
              <td><strong>{r.name}</strong>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginTop:'3px'}}>{r.steps.map(s=><span key={s} style={{marginRight:'6px',display:'inline-block'}}>{s}</span>)}</div>
              </td>
              <td>{r.prod}</td>
              <td style={{textAlign:'center'}}>{r.ops} ops</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'600',color:'var(--odoo-blue)'}}>{r.time}</td>
              <td><span className={`badge ${r.status==='Active'?'badge-done':'badge-draft'}`}>{r.status}</span></td>
              <td><div style={{display:'flex',gap:'4px'}}>
                <button className="btn-xs">Edit</button>
                <button className="btn-xs">Copy</button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
