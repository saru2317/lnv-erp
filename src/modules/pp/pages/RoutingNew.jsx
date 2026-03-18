import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const WCS = ['BLW-01 · Blow Room','CRD-01 · Carding','DRW-01 · Drawing 1st','DRW-02 · Drawing 2nd','RFM-01 · Ring Frame 01','RFM-02 · Ring Frame 02','OE-02 · Open End','WD-01 · Winding']

export default function RoutingNew() {
  const nav = useNavigate()
  const [ops, setOps] = useState([
    {id:1,seq:10,op:'Blow Room Mixing',wc:'BLW-01 · Blow Room',setup:'30',run:'0.5',uom:'min/Kg'},
    {id:2,seq:20,op:'Carding',wc:'CRD-01 · Carding',setup:'20',run:'0.8',uom:'min/Kg'},
  ])
  const [nid,setNid]=useState(3)
  const [saved,setSaved]=useState(false)

  const add=()=>{setOps([...ops,{id:nid,seq:(ops.length+1)*10,op:'',wc:WCS[0],setup:'',run:'',uom:'min/Kg'}]);setNid(nid+1)}
  const del=id=>setOps(ops.filter(o=>o.id!==id))
  const upd=(id,f,v)=>setOps(ops.map(o=>o.id===id?{...o,[f]:v}:o))

  if(saved) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px',gap:'16px'}}>
      <div style={{fontSize:'48px'}}>✅</div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:'20px',fontWeight:'800',color:'var(--odoo-green)'}}>RTE-005 Created!</div>
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/routing')}>← Routing List</button>
        <button className="btn btn-p sd-bsm" onClick={() => setSaved(false)}>➕ New Routing</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Create Routing <small>CA01 · Define Operations</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/routing')}>✕ Cancel</button>
          <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>💾 Save Routing</button>
        </div>
      </div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">⚙️ Routing Header</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Routing No.</label><input className="fi-form-ctrl" defaultValue="RTE-005" readOnly/></div>
            <div className="fi-form-grp"><label>Routing Name <span>*</span></label><input className="fi-form-ctrl" placeholder="e.g. Premium Ring Yarn Route"/></div>
            <div className="fi-form-grp"><label>Finished Product <span>*</span></label>
              <select className="fi-form-ctrl">
                <option>MAT-FG-001 · Ring Yarn (30s Count)</option>
                <option>MAT-FG-002 · Open End Yarn (12s)</option>
                <option>MAT-FG-005 · Ring Yarn (60s Count)</option>
              </select>
            </div>
          </div>
          <div className="fi-form-grp"><label>Description</label><textarea className="fi-form-ctrl" rows={2} placeholder="Routing description..."></textarea></div>
        </div>
      </div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">⚙️ Operations Sequence</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>#</th><th>Seq</th><th>Operation Name</th><th>Work Centre</th><th>Setup (min)</th><th>Run Time</th><th>UOM</th><th></th></tr></thead>
            <tbody>
              {ops.map((o,i)=>(
                <tr key={o.id}>
                  <td style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)'}}>{i+1}</td>
                  <td><input type="number" value={o.seq} onChange={e=>upd(o.id,'seq',e.target.value)} style={{width:'50px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'4px 6px',fontSize:'12px'}}/></td>
                  <td><input value={o.op} onChange={e=>upd(o.id,'op',e.target.value)} placeholder="Operation name..." style={{width:'160px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'4px 6px',fontSize:'12px'}}/></td>
                  <td><select value={o.wc} onChange={e=>upd(o.id,'wc',e.target.value)} style={{width:'160px'}}>{WCS.map(w=><option key={w}>{w}</option>)}</select></td>
                  <td><input type="number" value={o.setup} onChange={e=>upd(o.id,'setup',e.target.value)} placeholder="0" style={{width:'60px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'4px 6px',fontSize:'12px'}}/></td>
                  <td><input type="number" value={o.run} onChange={e=>upd(o.id,'run',e.target.value)} placeholder="0.0" style={{width:'70px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'4px 6px',fontSize:'12px'}}/></td>
                  <td><select value={o.uom} onChange={e=>upd(o.id,'uom',e.target.value)} style={{width:'90px'}}>
                    <option>min/Kg</option><option>min/Nos</option><option>hr/Batch</option>
                  </select></td>
                  <td><span onClick={()=>del(o.id)} style={{cursor:'pointer',color:'var(--odoo-red)',fontSize:'14px'}}>🗑</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:'10px 14px'}}>
            <button className="btn btn-s sd-bsm" onClick={add}>➕ Add Operation</button>
          </div>
        </div>
      </div>

      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/routing')}>✕ Cancel</button>
        <button className="btn btn-p sd-bsm" onClick={() => setSaved(true)}>💾 Save Routing</button>
      </div>
    </div>
  )
}
