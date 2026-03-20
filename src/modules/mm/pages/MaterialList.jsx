import React from 'react'

const MATS = [
  {code:'MAT-001',desc:'Compact Cotton Sliver',        hsn:'5513 11 90',uom:'Kg',    cat:'Raw Material',gst:'12%',reorder:'500 Kg'},
  {code:'MAT-002',desc:'Lattice Aprons (Set)',          hsn:'8448 59 90',uom:'Nos',   cat:'Spares',       gst:'18%',reorder:'50 Nos'},
  {code:'MAT-003',desc:'Packing Boxes Double Wall',     hsn:'4819 10 10',uom:'Nos',   cat:'Packing',      gst:'18%',reorder:'1000 Nos'},
  {code:'MAT-004',desc:'Solvent Chemical 30%',          hsn:'2901 10 00',uom:'Litre', cat:'Chemicals',    gst:'18%',reorder:'100 Litre'},
  {code:'MAT-005',desc:'Powder Coat (RAL 9003)',         hsn:'3208 20 10',uom:'Kg',    cat:'Chemicals',    gst:'18%',reorder:'200 Kg'},
  {code:'MAT-006',desc:'Phosphating Chemical',          hsn:'2811 19 90',uom:'Litre', cat:'Chemicals',    gst:'18%',reorder:'50 Litre'},
]

export default function MaterialList() {
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Material Master <small>MM03 · Item Catalogue</small></div>
        <div className="lv-acts"><button className="btn btn-p sd-bsm">＋ New Material</button></div>
      </div>
      <div className="mm-filt">
        <div className="mm-fs-input"><input placeholder="Search code, description, HSN..."/></div>
        <select className="mm-fsel"><option>All Categories</option><option>Raw Material</option><option>Spares</option><option>Packing</option><option>Chemicals</option></select>
      </div>
      <table className="mm-tbl">
        <thead><tr><th>Material Code</th><th>Description</th><th>HSN Code</th><th>UOM</th><th>Category</th><th>GST Rate</th><th>Reorder Level</th><th>Actions</th></tr></thead>
        <tbody>
          {MATS.map(m => (
            <tr key={m.code}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{m.code}</strong></td>
              <td>{m.desc}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{m.hsn}</td>
              <td>{m.uom}</td>
              <td><span className="mm-badge mm-bdg-sent">{m.cat}</span></td>
              <td style={{fontWeight:'700',color:'var(--odoo-blue)'}}>{m.gst}</td>
              <td>{m.reorder}</td>
              <td onClick={e=>e.stopPropagation()}><button className="btn-xs">Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
