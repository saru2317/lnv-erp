import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PRODUCTS = [
  {id:'p1',label:'MAT-FG-001 · Ring Yarn (30s Count)',bom:'BOM-002 · Ring Yarn v2.1',route:'RTE-001 · Standard Ring Yarn Route',mc:'RFM-01 · Ring Frame Machine 01',
   comps:[{seq:1,mat:'Cotton Sliver (MAT-001)',reqQty:440,uom:'Kg',avail:480,status:'available'},
          {seq:2,mat:'Lattice Aprons (MAT-003)',reqQty:4,uom:'Nos',avail:35,status:'available'},
          {seq:3,mat:'Ring Yarn Bobbin (MAT-008)',reqQty:200,uom:'Nos',avail:350,status:'available'}],
   ops:[{seq:10,op:'Mixing & Blow Room',wc:'BLW-01',setup:'30 min',run:'0.5 min/Kg',total:'230 min'},
        {seq:20,op:'Carding',wc:'CRD-01',setup:'20 min',run:'0.8 min/Kg',total:'340 min'},
        {seq:30,op:'Drawing (1st Pass)',wc:'DRW-01',setup:'15 min',run:'0.4 min/Kg',total:'175 min'},
        {seq:40,op:'Ring Spinning',wc:'RFM-01',setup:'45 min',run:'2.0 min/Kg',total:'845 min'},
        {seq:50,op:'Winding & Packing',wc:'WD-01',setup:'20 min',run:'0.3 min/Kg',total:'140 min'}]},
  {id:'p2',label:'MAT-FG-002 · Open End Yarn (12s)',bom:'BOM-003 · Open End Yarn v1.5',route:'RTE-002 · Open End Route',mc:'OE-02 · Open End Machine',
   comps:[{seq:1,mat:'Cotton Bale (MAT-002)',reqQty:330,uom:'Kg',avail:80,status:'short'},
          {seq:2,mat:'OE Rotors (MAT-006)',reqQty:12,uom:'Nos',avail:24,status:'available'}],
   ops:[{seq:10,op:'Blow Room',wc:'BLW-01',setup:'20 min',run:'0.4 min/Kg',total:'140 min'},
        {seq:20,op:'Carding',wc:'CRD-01',setup:'20 min',run:'0.8 min/Kg',total:'260 min'},
        {seq:30,op:'OE Spinning',wc:'OE-02',setup:'30 min',run:'1.5 min/Kg',total:'480 min'},
        {seq:40,op:'Winding',wc:'WD-01',setup:'15 min',run:'0.2 min/Kg',total:'75 min'}]},
  {id:'p3',label:'MAT-FG-003 · Compact Cotton Sliver',bom:'BOM-001 · Compact Sliver v2.0',route:'RTE-003 · Compact Sliver Route',mc:'CSP-01 · Compact Spinning',
   comps:[{seq:1,mat:'Cotton Bale (MAT-002)',reqQty:880,uom:'Kg',avail:480,status:'available'},
          {seq:2,mat:'Card Clothing (MAT-007)',reqQty:2,uom:'Set',avail:5,status:'available'}],
   ops:[{seq:10,op:'Blow Room',wc:'BLW-01',setup:'30 min',run:'0.5 min/Kg',total:'430 min'},
        {seq:20,op:'Carding',wc:'CRD-01',setup:'20 min',run:'0.6 min/Kg',total:'500 min'},
        {seq:30,op:'Drawing',wc:'DRW-01',setup:'15 min',run:'0.3 min/Kg',total:'255 min'}]},
]

export default function WONew() {
  const nav = useNavigate()
  const [prod, setProd] = useState(PRODUCTS[0])
  const [qty, setQty] = useState(400)
  const [done, setDone] = useState(false)

  if(done) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'60px',gap:'16px'}}>
      <div style={{fontSize:'48px'}}></div>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:'22px',fontWeight:'800',color:'var(--odoo-green)'}}>WO-2025-021 Created & Released!</div>
      <div style={{fontSize:'13px',color:'var(--odoo-gray)'}}>Stock reserved · Shop floor notified · FI auto-journal queued</div>
      <div style={{display:'flex',gap:'10px'}}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/wo')}>← Work Orders</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/pp/entry')}> Production Entry</button>
      </div>
    </div>
  )

  const hasShort = prod.comps.some(c=>c.status==='short')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Create Work Order <small>CO01 · New Production Order</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/wo')}> Cancel</button>
          <button className="btn btn-s sd-bsm">Save Draft</button>
          <button className="btn btn-p sd-bsm" onClick={() => setDone(true)}>Create & Release</button>
        </div>
      </div>

      {hasShort && <div className="pp-alert warn"> <strong>Material shortage detected!</strong> Some components have insufficient stock. Consider running MRP before releasing.</div>}

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">Work Order Header</div>
        <div className="fi-form-sec-body">
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>WO Number</label><input className="fi-form-ctrl" defaultValue="WO-2025-021" readOnly/></div>
            <div className="fi-form-grp"><label>Production Date <span>*</span></label><input type="date" className="fi-form-ctrl" defaultValue="2025-03-01"/></div>
            <div className="fi-form-grp"><label>Due Date <span>*</span></label><input type="date" className="fi-form-ctrl" defaultValue="2025-03-08"/></div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Finished Product <span>*</span></label>
              <select className="fi-form-ctrl" onChange={e => setProd(PRODUCTS.find(p=>p.id===e.target.value)||PRODUCTS[0])}>
                {PRODUCTS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div className="fi-form-grp"><label>Planned Quantity <span>*</span></label>
              <div style={{display:'flex',gap:'8px'}}>
                <input type="number" className="fi-form-ctrl" value={qty} style={{flex:1}} onChange={e=>setQty(e.target.value)}/>
                <select className="fi-form-ctrl" style={{width:'80px'}}><option>Kg</option><option>Nos</option><option>Mtr</option></select>
              </div>
            </div>
            <div className="fi-form-grp"><label>BOM (Auto-loaded)</label>
              <input className="fi-form-ctrl" value={prod.bom} readOnly/>
            </div>
          </div>
          <div className="fi-form-row">
            <div className="fi-form-grp"><label>Machine / Work Centre <span>*</span></label>
              <input className="fi-form-ctrl" value={prod.mc} readOnly/>
            </div>
            <div className="fi-form-grp"><label>Routing</label>
              <input className="fi-form-ctrl" value={prod.route} readOnly/>
            </div>
            <div className="fi-form-grp"><label>Priority</label>
              <select className="fi-form-ctrl"><option>Normal</option><option>High</option><option>Urgent</option></select>
            </div>
          </div>
          <div className="fi-form-grp"><label>Remarks / Notes</label>
            <textarea className="fi-form-ctrl" rows={2} placeholder="Special instructions, quality notes..."></textarea>
          </div>
        </div>
      </div>

      {/* Components from BOM */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr"> Component Requirements (from BOM)</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>#</th><th>Component</th><th>Required Qty</th><th>UOM</th><th>Available Stock</th><th>To Issue</th><th>Short</th><th>Status</th></tr></thead>
            <tbody>
              {prod.comps.map(c=>(
                <tr key={c.seq}>
                  <td>{c.seq}</td>
                  <td>{c.mat}</td>
                  <td>{c.reqQty}</td>
                  <td>{c.uom}</td>
                  <td style={{fontWeight:'600',color:c.avail>=c.reqQty?'var(--odoo-green)':'var(--odoo-red)'}}>{c.avail} {c.uom}</td>
                  <td><input type="number" defaultValue={c.reqQty} style={{width:'70px',border:'1px solid var(--odoo-border)',borderRadius:'4px',padding:'4px 6px',fontSize:'12px'}}/></td>
                  <td style={{color:c.avail>=c.reqQty?'var(--odoo-green)':'var(--odoo-red)',fontWeight:'600'}}>
                    {c.avail>=c.reqQty ? '—' : `${c.reqQty-c.avail} ${c.uom}`}
                  </td>
                  <td><span className={`badge ${c.status==='available'?'badge-done':'badge-hold'}`}>{c.status==='available'?' Available':' Short'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!hasShort && <div className="pp-alert success" style={{margin:'14px'}}>All components available. Stock will be reserved on release.</div>}
        </div>
      </div>

      {/* Operations from Routing */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr"> Operations Sequence (from Routing)</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>Seq</th><th>Operation</th><th>Work Centre</th><th>Setup Time</th><th>Run Time / Unit</th><th>Total Time</th></tr></thead>
            <tbody>
              {prod.ops.map(o=>(
                <tr key={o.seq}>
                  <td><span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',fontWeight:'700',color:'var(--odoo-purple)'}}>{o.seq}</span></td>
                  <td><strong>{o.op}</strong></td>
                  <td>{o.wc}</td>
                  <td>{o.setup}</td>
                  <td>{o.run}</td>
                  <td style={{fontWeight:'600',color:'var(--odoo-blue)'}}>{o.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/wo')}> Cancel</button>
        <button className="btn btn-s sd-bsm">Save Draft</button>
        <button className="btn btn-s sd-bsm">Release Only</button>
        <button className="btn btn-p sd-bsm" onClick={() => setDone(true)}>Create & Release</button>
        <div className="fi-status-flow">
          <span className="fi-sf-step act"> Create</span><span className="fi-sf-arr">›</span>
          <span className="fi-sf-step">Released</span><span className="fi-sf-arr">›</span>
          <span className="fi-sf-step">In Progress</span><span className="fi-sf-arr">›</span>
          <span className="fi-sf-step">Closed</span>
        </div>
      </div>
    </div>
  )
}
