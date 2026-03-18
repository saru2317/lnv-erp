import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LOTS = [
  {lot:'QIL-048',date:'28 Feb',source:'PP',wo:'WO-2025-019',mat:'Ring Yarn (30s)',qty:400,tested:400,pass:394,fail:6,yield:98.5,ncr:'—',sb:'badge-pass',sl:'Pass'},
  {lot:'QIL-047',date:'27 Feb',source:'PP',wo:'WO-2025-018',mat:'OE Yarn (12s)',qty:588,tested:588,pass:580,fail:8,yield:98.6,ncr:'NCR-018',sb:'badge-pass',sl:'Pass'},
  {lot:'QIL-046',date:'25 Feb',source:'PP',wo:'WO-2025-016',mat:'Ring Yarn (40s)',qty:384,tested:384,pass:368,fail:16,yield:95.8,ncr:'NCR-017',sb:'badge-review',sl:'Review'},
  {lot:'QIL-045',date:'23 Feb',source:'PP',wo:'WO-2025-015',mat:'Cotton Sliver',qty:792,tested:792,pass:792,fail:0,yield:100,ncr:'—',sb:'badge-pass',sl:'Pass'},
  {lot:'QIL-044',date:'20 Feb',source:'MM',wo:'GRN-2025-018',mat:'Cotton Bale (RM)',qty:500,tested:500,pass:500,fail:0,yield:100,ncr:'—',sb:'badge-pass',sl:'Pass'},
  {lot:'QIL-043',date:'18 Feb',source:'MM',wo:'GRN-2025-017',mat:'Solvent Chemical',qty:100,tested:100,pass:80,fail:20,yield:80.0,ncr:'NCR-016',sb:'badge-fail',sl:'Fail'},
  {lot:'QIL-042',date:'16 Feb',source:'PP',wo:'WO-2025-014',mat:'Ring Yarn (30s)',qty:400,tested:400,pass:396,fail:4,yield:99.0,ncr:'—',sb:'badge-pass',sl:'Pass'},
  {lot:'QIL-041',date:'14 Feb',source:'SD',wo:'DO-2025-022',mat:'Ring Yarn (30s) — Pre-shipment',qty:200,tested:200,pass:200,fail:0,yield:100,ncr:'—',sb:'badge-pass',sl:'Pass'},
]

const CHIPS = ['All','Pass','Review','Fail']
const SOURCE = ['All Sources','PP — Production','MM — Incoming','SD — Pre-shipment']

export default function InspectionList() {
  const nav = useNavigate()
  const [chip, setChip] = useState('All')
  const [src, setSrc] = useState('All Sources')

  const filtered = LOTS.filter(l =>
    (chip==='All' || l.sl===chip) &&
    (src==='All Sources' || l.source===src.split(' ')[0])
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Inspection Lots <small>QA03 · Inspection Register</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/inspection/new')}>➕ New Inspection</button>
        </div>
      </div>

      <div className="pp-chips">
        {CHIPS.map(c=>(
          <div key={c} className={`pp-chip${chip===c?' on':''}`} onClick={() => setChip(c)}>{c}
            <span>{c==='All'?LOTS.length:LOTS.filter(l=>l.sl===c).length}</span>
          </div>
        ))}
      </div>

      <div className="fi-filter-bar">
        <div className="fi-filter-search">🔍<input placeholder="Search lot, material, WO..."/></div>
        <select className="fi-filter-select" onChange={e=>setSrc(e.target.value)}>
          {SOURCE.map(s=><option key={s}>{s}</option>)}
        </select>
        <input type="date" className="fi-filter-select" defaultValue="2025-02-01"/>
        <input type="date" className="fi-filter-select" defaultValue="2025-02-28"/>
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Lot No.</th><th>Date</th><th>Source</th><th>Ref (WO/GRN)</th>
          <th>Material</th><th>Qty</th><th>Pass</th><th>Fail</th>
          <th>Yield %</th><th>NCR</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map(l=>(
            <tr key={l.lot} style={{cursor:'pointer'}} onClick={() => nav('/qm/inspection/new')}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{l.lot}</strong></td>
              <td>{l.date}</td>
              <td><span style={{background:'#EDE0EA',color:'var(--odoo-purple)',padding:'2px 7px',borderRadius:'4px',fontSize:'11px',fontWeight:'700'}}>{l.source}</span></td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-gray)'}}>{l.wo}</td>
              <td><strong>{l.mat}</strong></td>
              <td>{l.qty} Kg</td>
              <td style={{color:'var(--odoo-green)',fontWeight:'600'}}>{l.pass}</td>
              <td style={{color:l.fail>0?'var(--odoo-red)':'var(--odoo-gray)',fontWeight:l.fail>0?'700':'400'}}>{l.fail||'—'}</td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                  <div className="yield-bar" style={{width:'50px'}}>
                    <div className="yield-fill" style={{width:`${l.yield}%`,background:l.yield>=98?'var(--odoo-green)':l.yield>=95?'var(--odoo-orange)':'var(--odoo-red)'}}></div>
                  </div>
                  <span style={{fontSize:'11px',fontWeight:'700',color:l.yield>=98?'var(--odoo-green)':l.yield>=95?'var(--odoo-orange)':'var(--odoo-red)'}}>{l.yield}%</span>
                </div>
              </td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:l.ncr==='—'?'var(--odoo-gray)':'var(--odoo-red)',fontWeight:l.ncr==='—'?'400':'700'}}>{l.ncr}</td>
              <td><span className={`badge ${l.sb}`}>{l.sl==='Pass'?'✅ Pass':l.sl==='Fail'?'❌ Fail':'⚠️ Review'}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',gap:'4px'}}>
                  <button className="btn-xs">View</button>
                  <button className="btn-xs" onClick={() => nav('/print/ir')}>Print</button>
                  {l.sl==='Review' && <button className="btn-xs pri" onClick={() => nav('/qm/ncr/new')}>Raise NCR</button>}
                  {l.sl==='Pass' && <button className="btn-xs" onClick={() => nav('/qm/certificates')}>🏅 Cert</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{background:'#F8F9FA',fontWeight:'700'}}>
            <td colSpan={5}>Total ({filtered.length} lots)</td>
            <td>{filtered.reduce((s,l)=>s+l.qty,0)} Kg</td>
            <td style={{color:'var(--odoo-green)'}}>{filtered.reduce((s,l)=>s+l.pass,0)}</td>
            <td style={{color:'var(--odoo-red)'}}>{filtered.reduce((s,l)=>s+l.fail,0)}</td>
            <td style={{color:'var(--odoo-green)'}}>{(filtered.reduce((s,l)=>s+l.yield,0)/filtered.length).toFixed(1)}% Avg</td>
            <td colSpan={3}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
