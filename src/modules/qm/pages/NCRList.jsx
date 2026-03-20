import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NCRS = [
  {id:'NCR-019',date:'28 Feb',source:'PP',mat:'Ring Yarn (30s)',issue:'Twist variation — CV% high (12.4 vs spec ≤10)',severity:'Major',  assignee:'Rajesh Q.',capa:'—',    sb:'badge-open',   sl:'Open'},
  {id:'NCR-018',date:'27 Feb',source:'PP',mat:'OE Yarn (12s)', issue:'Nep count exceeded — 280/km vs spec ≤200',  severity:'Minor',  assignee:'Kavitha M.',capa:'CAPA-012',sb:'badge-wip',    sl:'CAPA Open'},
  {id:'NCR-017',date:'25 Feb',source:'PP',mat:'Ring Yarn (40s)',issue:'Tensile strength below spec — 16 Kg fail',  severity:'Critical',assignee:'Rajesh Q.',capa:'CAPA-011',sb:'badge-critical',sl:'Critical'},
  {id:'NCR-016',date:'18 Feb',source:'MM',mat:'Solvent Chemical',issue:'Purity 78% vs spec ≥85% — supplier batch',severity:'Major',  assignee:'Kavitha M.',capa:'CAPA-010',sb:'badge-wip',    sl:'CAPA Open'},
  {id:'NCR-015',date:'15 Feb',source:'SD',mat:'Ring Yarn (30s)',issue:'Count variation ±0.6 Ne in export lot',      severity:'Minor',  assignee:'Suresh P.', capa:'CAPA-009',sb:'badge-closed', sl:'Closed'},
  {id:'NCR-014',date:'12 Feb',source:'MM',mat:'Cotton Bale',    issue:'Moisture content 11.2% — above 9% limit',    severity:'Minor',  assignee:'Rajesh Q.', capa:'CAPA-008',sb:'badge-closed', sl:'Closed'},
]

const CHIPS = ['All','Open','CAPA Open','Critical','Closed']

export default function NCRList() {
  const nav = useNavigate()
  const [chip, setChip] = useState('All')

  const filtered = chip==='All' ? NCRS : NCRS.filter(n => n.sl===chip)

  const severityClr = s => s==='Critical'?'var(--odoo-red)':s==='Major'?'var(--odoo-orange)':'var(--odoo-blue)'

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">NCR Register <small>Non-Conformance Reports</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/ncr/new')}>Raise NCR</button>
        </div>
      </div>

      <div className="pp-chips">
        {CHIPS.map(c=>(
          <div key={c} className={`pp-chip${chip===c?' on':''}`} onClick={() => setChip(c)}>
            {c} <span>{c==='All'?NCRS.length:NCRS.filter(n=>n.sl===c).length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>NCR No.</th><th>Date</th><th>Source</th><th>Material</th>
          <th>Issue</th><th>Severity</th><th>Assigned To</th><th>CAPA</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map(n=>(
            <tr key={n.id} style={{cursor:'pointer',background:n.severity==='Critical'?'#FFF5F5':'inherit'}}
              onClick={() => nav('/qm/ncr/new')}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{n.id}</strong></td>
              <td>{n.date}</td>
              <td><span style={{background:'#EDE0EA',color:'var(--odoo-purple)',padding:'2px 7px',borderRadius:'4px',fontSize:'11px',fontWeight:'700'}}>{n.source}</span></td>
              <td><strong>{n.mat}</strong></td>
              <td style={{fontSize:'12px',maxWidth:'200px'}}>{n.issue}</td>
              <td><span style={{fontWeight:'700',fontSize:'12px',color:severityClr(n.severity)}}>{''.repeat(n.severity==='Critical'?3:n.severity==='Major'?2:1)} {n.severity}</span></td>
              <td>{n.assignee}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:n.capa==='—'?'var(--odoo-gray)':'var(--odoo-blue)',fontWeight:n.capa==='—'?'400':'700'}}>
                {n.capa}
              </td>
              <td><span className={`badge ${n.sb}`}>{n.sl}</span></td>
              <td onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex',gap:'4px'}}>
                  <button className="btn-xs">View</button>
                  <button className="btn-xs" onClick={() => nav('/print/ncr')}>Print</button>
                  {n.capa==='—' && <button className="btn-xs pri" onClick={() => nav('/qm/capa/new')}>CAPA</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
