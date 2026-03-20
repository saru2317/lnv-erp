import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const INIT_LINES = [
  {no:1,mat:'MAT-001 · Cotton Sliver',avail:'480 Kg',qty:150,uom:'Kg',bin:'BIN-A12',batch:'BTH-2025-01',avc:'var(--odoo-green)'},
  {no:2,mat:'MAT-004 · Packing Boxes',avail:'850 Nos',qty:200,uom:'Nos',bin:'BIN-F06',batch:'BTH-2025-01',avc:'var(--odoo-green)'},
]

export default function GoodsIssue() {
  const nav = useNavigate()
  const [lines, setLines] = useState(INIT_LINES)
  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">Goods Issue <small>MIGO · Issue Stock to Production / Sales</small></div>
        <div className="wm-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}> Cancel</button>
          <button className="btn btn-s sd-bsm">Save Draft</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/wm/movement-log')}>Post Goods Issue</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/print/mis')}>Print MIS</button>
        </div>
      </div>

      <div className="wm-form-sec">
        <div className="wm-form-sec-hdr">Issue Details</div>
        <div className="wm-form-sec-body">
          <div className="wm-form-row">
            <div className="wm-form-grp"><label>GI Number</label><input className="wm-form-ctrl" defaultValue="GI-2025-043" readOnly/></div>
            <div className="wm-form-grp"><label>Issue Date <span>*</span></label><input type="date" className="wm-form-ctrl" defaultValue="2025-02-28"/></div>
            <div className="wm-form-grp"><label>Movement Type</label>
              <select className="wm-form-ctrl">
                <option>201 — GI for Production Order</option>
                <option>261 — GI for Sales Order</option>
                <option>551 — Scrapping</option>
                <option>901 — Sample Issue</option>
              </select></div>
          </div>
          <div className="wm-form-row">
            <div className="wm-form-grp"><label>Issue To (Cost Center)</label>
              <select className="wm-form-ctrl"><option>PP · Production Floor</option><option>SD · Sales / Dispatch</option><option>Admin</option><option>QC Lab</option></select></div>
            <div className="wm-form-grp"><label>Reference (Work Order / SO)</label><input className="wm-form-ctrl" placeholder="WO-2025-018 / SO-2025-042"/></div>
            <div className="wm-form-grp"><label>Issued By</label><input className="wm-form-ctrl" defaultValue="Admin Kumar" readOnly/></div>
          </div>
        </div>
      </div>

      <div className="wm-form-sec">
        <div className="wm-form-sec-hdr">Items to Issue</div>
        <div className="wm-form-sec-body" style={{padding:'0'}}>
          <div className="wm-lt-wrap">
            <table className="wm-lt">
              <thead><tr><th>#</th><th>Material</th><th>Available Stock</th><th>Issue Qty</th><th>UOM</th><th>From Bin</th><th>Batch</th><th>Remarks</th><th></th></tr></thead>
              <tbody>
                {lines.map(l => (
                  <tr key={l.no}>
                    <td>{l.no}</td>
                    <td><select style={{width:'180px'}}><option>{l.mat}</option><option>MAT-002 · Ring Yarn</option><option>MAT-003 · Lattice Aprons</option></select></td>
                    <td style={{color:l.avc,fontWeight:'600'}}>{l.avail}</td>
                    <td><input type="number" defaultValue={l.qty} style={{width:'70px'}}/></td>
                    <td>{l.uom}</td>
                    <td><select style={{width:'80px'}}><option>{l.bin}</option><option>BIN-A01</option></select></td>
                    <td><input defaultValue={l.batch} style={{width:'100px'}}/></td>
                    <td><input placeholder="Notes..." style={{width:'110px'}}/></td>
                    <td><span className="li-del" onClick={() => setLines(lines.filter(x=>x.no!==l.no))}></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="wm-lt-add">
              <button className="btn btn-s sd-bsm" onClick={() => setLines([...lines,{no:lines.length+1,mat:'MAT-001 · Cotton Sliver',avail:'480 Kg',qty:10,uom:'Kg',bin:'BIN-A12',batch:'BTH-2025-01',avc:'var(--odoo-green)'}])}>
                 Add Item
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="wm-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}> Cancel</button>
        <button className="btn btn-p sd-bsm" onClick={() => nav('/wm/movement-log')}>Post Goods Issue</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/print/mis')}>Print MIS</button>
        <div className="wm-status-flow">
          <span className="wm-sf-step act">Issue Entry</span><span className="wm-sf-arr">›</span>
          <span className="wm-sf-step">Stock Reduced</span><span className="wm-sf-arr">›</span>
          <span className="wm-sf-step">Cost Booked</span>
        </div>
      </div>
    </div>
  )
}
