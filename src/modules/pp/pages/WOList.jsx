import ListViewToggle from '@components/ui/ListViewToggle'
import { useListView } from '@hooks/useListView'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const WOS = [
  {no:'WO-2025-020',prod:'Compact Sliver',        bom:'BOM-001',pqty:'800 Kg', prod2:'80 Kg', start:'26 Feb',due:'05 Mar',mc:'CSP-01',pct:10, pclr:'var(--odoo-blue)',   sb:'badge-released', sl:'Released',    act:'Start'},
  {no:'WO-2025-019',prod:'Ring Yarn (30s)',        bom:'BOM-002',pqty:'500 Kg', prod2:'325 Kg',start:'24 Feb',due:'02 Mar',mc:'RFM-01',pct:65, pclr:'var(--odoo-orange)', sb:'badge-progress', sl:'In Progress',  act:'Entry'},
  {no:'WO-2025-018',prod:'Open End Yarn (12s)',    bom:'BOM-003',pqty:'300 Kg', prod2:'90 Kg', start:'22 Feb',due:'01 Mar',mc:'OE-02', pct:30, pclr:'var(--odoo-red)',    sb:'badge-hold',     sl:' Mat.Short', act:'Reorder'},
  {no:'WO-2025-017',prod:'Ring Yarn (40s)',        bom:'BOM-002',pqty:'200 Kg', prod2:'200 Kg',start:'18 Feb',due:'25 Feb',mc:'RFM-01',pct:100,pclr:'var(--odoo-green)',  sb:'badge-done',     sl:'Completed',    act:'Close'},
  {no:'WO-2025-016',prod:'Compact Sliver',         bom:'BOM-001',pqty:'600 Kg', prod2:'480 Kg',start:'15 Feb',due:'22 Feb',mc:'CSP-01',pct:80, pclr:'var(--odoo-orange)', sb:'badge-progress', sl:'In Progress',  act:'Entry'},
  {no:'WO-2025-015',prod:'Cotton Sliver Grade A',  bom:'BOM-004',pqty:'1000 Kg',prod2:'1000 Kg',start:'10 Feb',due:'18 Feb',mc:'CRD-01',pct:100,pclr:'var(--odoo-green)', sb:'badge-done',     sl:'Completed',    act:'Close'},
  {no:'WO-2025-014',prod:'Ring Yarn (30s)',         bom:'BOM-002',pqty:'400 Kg', prod2:'0 Kg',  start:'01 Mar',due:'08 Mar',mc:'RFM-01',pct:0,  pclr:'var(--odoo-gray)',   sb:'badge-draft',    sl:'Draft',        act:'Release'},
]
const CHIPS = ['All','Draft','Released','In Progress','On Hold','Completed']

export default function WOList() {
  const { viewMode, toggleView } = useListView('PP-WOList')
  const nav = useNavigate()
  const [chip, setChip] = useState('All')

  const filtered = chip==='All' ? WOS : WOS.filter(w => {
    if(chip==='In Progress') return w.sl.includes('Progress')
    if(chip==='On Hold') return w.sl.includes('Mat.Short')
    return w.sl===chip
  })

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Work Orders <small>CO03 · Production Orders</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/gantt')}> Gantt</button>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/pp/wo/new')}>Create WO</button>
        </div>
      </div>

      <div className="pp-chips">
        {CHIPS.map(c=>(
          <div key={c} className={`pp-chip${chip===c?' on':''}`} onClick={() => setChip(c)}>{c}</div>
        ))}
      </div>

      <div className="fi-filter-bar">
        <div className="fi-filter-search"><input placeholder="Search WO no., product, machine..."/></div>
        <select className="fi-filter-select"><option>All Products</option><option>Ring Yarn</option><option>Open End Yarn</option><option>Compact Sliver</option></select>
        <select className="fi-filter-select"><option>All Machines</option><option>RFM-01</option><option>OE-02</option><option>CSP-01</option></select>
        <input type="date" className="fi-filter-select" defaultValue="2025-02-01"/>
        <input type="date" className="fi-filter-select" defaultValue="2025-03-31"/>
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th><input type="checkbox"/></th>
          <th>WO No.</th><th>Product</th><th>BOM</th><th>Planned Qty</th>
          <th>Produced</th><th>Start</th><th>Due Date</th><th>Machine</th>
          <th>Progress</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map(w=>(
            <tr key={w.no} onClick={() => nav('/pp/entry')}>
              <td onClick={e=>e.stopPropagation()}><input type="checkbox"/></td>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{w.no}</strong></td>
              <td>{w.prod}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-gray)'}}>{w.bom}</td>
              <td>{w.pqty}</td>
              <td>{w.prod2}</td>
              <td>{w.start}</td>
              <td style={{fontWeight:w.pct<100&&w.due<'05 Mar'?'700':'400',color:w.pct<100&&w.due<'05 Mar'?'var(--odoo-red)':'inherit'}}>{w.due}</td>
              <td>{w.mc}</td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <div style={{background:'#F0EEEB',borderRadius:'3px',height:'6px',width:'80px'}}>
                    <div style={{width:`${w.pct}%`,height:'100%',background:w.pclr,borderRadius:'3px'}}></div>
                  </div>
                  <span style={{fontSize:'11px',color:w.pclr,fontWeight:'600'}}>{w.pct}%</span>
                </div>
              </td>
              <td><span className={`badge ${w.sb}`}>{w.sl}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',gap:'4px'}}>
                  <button className="btn-xs pri" onClick={() => nav(w.act==='Entry'||w.act==='Start'?'/pp/entry':w.act==='Close'?'/pp/complete':'/pp/wo/new')}>{w.act}</button>
                  <button className="btn-xs">View</button>
                  <button className="btn-xs" onClick={() => nav('/print/jo')}>Print</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
