import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BOMS = [
  {id:'BOM-001',prod:'Compact Cotton Sliver',ver:'v2.0',comps:4,created:'01 Jan 2025',status:'Active',
   items:[{seq:10,mat:'Cotton Bale (MAT-002)',qty:1.10,uom:'Kg/Kg',cost:'₹45/Kg'},
          {seq:20,mat:'Card Clothing (MAT-007)',qty:0.002,uom:'Set/Kg',cost:'₹1,200/Set'},
          {seq:30,mat:'Lubricant (MAT-009)',qty:0.005,uom:'Ltr/Kg',cost:'₹80/Ltr'},
          {seq:40,mat:'Packing Bags (MAT-004)',qty:0.01,uom:'Nos/Kg',cost:'₹12/Nos'}]},
  {id:'BOM-002',prod:'Ring Yarn (30s / 40s Count)',ver:'v2.1',comps:5,created:'01 Jan 2025',status:'Active',
   items:[{seq:10,mat:'Cotton Sliver (MAT-001)',qty:1.10,uom:'Kg/Kg',cost:'₹38/Kg'},
          {seq:20,mat:'Lattice Aprons (MAT-003)',qty:0.01,uom:'Nos/Kg',cost:'₹250/Nos'},
          {seq:30,mat:'Ring Bobbins (MAT-008)',qty:0.5,uom:'Nos/Kg',cost:'₹8/Nos'},
          {seq:40,mat:'Ring Travellers (MAT-010)',qty:2.0,uom:'Nos/Kg',cost:'₹2/Nos'},
          {seq:50,mat:'Packing Cones (MAT-011)',qty:0.5,uom:'Nos/Kg',cost:'₹15/Nos'}]},
  {id:'BOM-003',prod:'Open End Yarn (12s)',ver:'v1.5',comps:4,created:'15 Jan 2025',status:'Active',
   items:[{seq:10,mat:'Cotton Bale (MAT-002)',qty:1.12,uom:'Kg/Kg',cost:'₹45/Kg'},
          {seq:20,mat:'OE Rotors (MAT-006)',qty:0.002,uom:'Nos/Kg',cost:'₹2,400/Nos'},
          {seq:30,mat:'Solvent Chemical (MAT-005)',qty:0.003,uom:'Ltr/Kg',cost:'₹120/Ltr'},
          {seq:40,mat:'Packing Cones (MAT-011)',qty:0.5,uom:'Nos/Kg',cost:'₹15/Nos'}]},
  {id:'BOM-004',prod:'Cotton Sliver Grade A',ver:'v1.0',comps:3,created:'01 Feb 2025',status:'Active',
   items:[{seq:10,mat:'Cotton Bale (MAT-002)',qty:1.05,uom:'Kg/Kg',cost:'₹45/Kg'},
          {seq:20,mat:'Card Clothing (MAT-007)',qty:0.001,uom:'Set/Kg',cost:'₹1,200/Set'},
          {seq:30,mat:'Lubricant (MAT-009)',qty:0.003,uom:'Ltr/Kg',cost:'₹80/Ltr'}]},
]

export default function BOMList() {
  const nav = useNavigate()
  const [expanded, setExpanded] = useState(null)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Bill of Materials <small>CS03 · BOM List</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/pp/bom/new')}>➕ Create BOM</button>
        </div>
      </div>

      <div className="fi-filter-bar">
        <div className="fi-filter-search">🔍<input placeholder="Search BOM, product..."/></div>
        <select className="fi-filter-select"><option>All Products</option><option>Ring Yarn</option><option>Open End Yarn</option><option>Compact Sliver</option></select>
        <select className="fi-filter-select"><option>Active</option><option>Obsolete</option><option>Draft</option></select>
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>BOM No.</th><th>Finished Product</th><th>Version</th><th>Components</th><th>Created</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {BOMS.map(b=>(
            <React.Fragment key={b.id}>
              <tr style={{cursor:'pointer'}} onClick={() => setExpanded(expanded===b.id?null:b.id)}>
                <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{b.id}</strong></td>
                <td><strong>{b.prod}</strong></td>
                <td><span style={{background:'#EDE0EA',color:'var(--odoo-purple)',padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'700'}}>{b.ver}</span></td>
                <td>{b.comps} components</td>
                <td>{b.created}</td>
                <td><span className="badge badge-done">{b.status}</span></td>
                <td onClick={e=>e.stopPropagation()}>
                  <div style={{display:'flex',gap:'4px'}}>
                    <button className="btn-xs pri" onClick={()=>setExpanded(expanded===b.id?null:b.id)}>
                      {expanded===b.id?'▲ Hide':'▼ View'}
                    </button>
                    <button className="btn-xs">Edit</button>
                    <button className="btn-xs">Copy</button>
                  </div>
                </td>
              </tr>
              {expanded===b.id && (
                <tr>
                  <td colSpan={7} style={{padding:'0',background:'#FDF8FC'}}>
                    <div style={{padding:'14px'}}>
                      <div style={{fontWeight:'700',fontSize:'12px',color:'var(--odoo-purple)',marginBottom:'10px'}}>🔩 Components — {b.id}</div>
                      <table className="fi-data-table" style={{margin:0}}>
                        <thead><tr><th>Seq</th><th>Component / Material</th><th>Qty per FG Unit</th><th>UOM</th><th>Std Cost</th></tr></thead>
                        <tbody>
                          {b.items.map(it=>(
                            <tr key={it.seq}>
                              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-purple)',fontWeight:'700'}}>{it.seq}</td>
                              <td><strong>{it.mat}</strong></td>
                              <td>{it.qty}</td>
                              <td style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{it.uom}</td>
                              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{it.cost}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
