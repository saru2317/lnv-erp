import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MATERIALS = ['Cotton Bale (MAT-002)','Cotton Sliver (MAT-001)','Lattice Aprons (MAT-003)',
  'Ring Bobbins (MAT-008)','Ring Travellers (MAT-010)','OE Rotors (MAT-006)',
  'Solvent Chemical (MAT-005)','Card Clothing (MAT-007)','Lubricant (MAT-009)',
  'Packing Cones (MAT-011)','Packing Boxes (MAT-004)']
const UOMS = ['Kg','Nos','Ltr','Set','Mtr','Box']

export default function BOMNew() {
  const nav = useNavigate()
  const [lines, setLines] = useState([
    {id:1,mat:'Cotton Sliver (MAT-001)',qty:'1.10',uom:'Kg',scrap:'2'},
    {id:2,mat:'Lattice Aprons (MAT-003)',qty:'0.01',uom:'Nos',scrap:'0'},
  ])
  const [nid, setNid] = useState(3)
  const [saved, setSaved] = useState(false)

  const addLine = () => { setLines([...lines,{id:nid,mat:MATERIALS[0],qty:'',uom:'Kg',scrap:'0'}]); setNid(nid+1) }
  const del = id => setLines(lines.filter(l=>l.id!==id))
  const upd = (id,f,v) => setLines(lines.map(l=>l.id===id?{...l,[f]:v}:l))

  if(saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px',gap:'16px'}}>
      <div style={{fontSize:'48px'}}></div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:'var(--odoo-green)'}}>BOM-005 Created!</div>
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/bom')}>← BOM List</button>
        <button className="btn btn-p sd-bsm" onClick={() => setSaved(false)}>Create Another</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Create BOM <small>CS01 · Bill of Materials</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/bom')}> Cancel</button>
          <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>Save BOM</button>
        </div>
      </div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr"> BOM Header</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>BOM Number</label><input className="fi-form-ctrl" defaultValue="BOM-005" readOnly/></div>
            <div className="fi-form-grp"><label>Finished Product <span>*</span></label>
              <select className="fi-form-ctrl">
                <option>-- Select Product --</option>
                <option>MAT-FG-001 · Ring Yarn (30s Count)</option>
                <option>MAT-FG-002 · Open End Yarn (12s)</option>
                <option>MAT-FG-003 · Compact Cotton Sliver</option>
                <option>MAT-FG-004 · New Product</option>
              </select>
            </div>
            <div className="fi-form-grp"><label>BOM Version</label><input className="fi-form-ctrl" defaultValue="v1.0"/></div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Base Quantity</label>
              <div style={{display:'flex',gap:'8px'}}>
                <input type="number" className="fi-form-ctrl" defaultValue="1" style={{flex:1}}/>
                <select className="fi-form-ctrl" style={{width:'80px'}}><option>Kg</option><option>Nos</option></select>
              </div>
            </div>
            <div className="fi-form-grp"><label>Valid From</label><input type="date" className="fi-form-ctrl" defaultValue="2025-03-01"/></div>
            <div className="fi-form-grp"><label>Valid To</label><input type="date" className="fi-form-ctrl" defaultValue="2025-12-31"/></div>
          </div>
          <div className="fi-form-grp"><label>Description / Notes</label>
            <textarea className="fi-form-ctrl" rows={2} placeholder="BOM description, revision notes..."></textarea>
          </div>
        </div>
      </div>

      {/* Component Lines */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">Components</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>#</th><th>Component / Material</th><th>Qty per Base</th><th>UOM</th><th>Scrap %</th><th>Effective Qty</th><th></th></tr></thead>
            <tbody>
              {lines.map((l,i)=>(
                <tr key={l.id}>
                  <td style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)'}}>{i+1}</td>
                  <td>
                    <select value={l.mat} onChange={e=>upd(l.id,'mat',e.target.value)} style={{width:'220px'}}>
                      {MATERIALS.map(m=><option key={m}>{m}</option>)}
                    </select>
                  </td>
                  <td><input type="number" value={l.qty} onChange={e=>upd(l.id,'qty',e.target.value)} style={{width:'70px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'4px 6px',fontSize:'12px'}}/></td>
                  <td>
                    <select value={l.uom} onChange={e=>upd(l.id,'uom',e.target.value)} style={{width:'70px'}}>
                      {UOMS.map(u=><option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td><input type="number" value={l.scrap} onChange={e=>upd(l.id,'scrap',e.target.value)} style={{width:'50px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'4px 6px',fontSize:'12px'}}/>%</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-blue)',fontWeight:'600'}}>
                    {l.qty ? (parseFloat(l.qty) * (1 + (parseFloat(l.scrap)||0)/100)).toFixed(3) : '—'} {l.uom}
                  </td>
                  <td><span onClick={()=>del(l.id)} style={{cursor:'pointer',color:'var(--odoo-red)',fontSize:'14px'}}></span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:'10px 14px'}}>
            <button className="btn btn-s sd-bsm" onClick={addLine}>Add Component</button>
          </div>
        </div>
      </div>

      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/bom')}> Cancel</button>
        <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>Save BOM</button>
      </div>
    </div>
  )
}
