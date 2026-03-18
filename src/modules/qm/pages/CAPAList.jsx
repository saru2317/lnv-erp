import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CAPAS = [
  {id:'CAPA-012',ncr:'NCR-018',type:'Corrective',issue:'Nep count control',action:'Overhaul carding machine flat settings',owner:'Maintenance',due:'10 Mar',progress:40,sb:'badge-wip',sl:'In Progress'},
  {id:'CAPA-011',ncr:'NCR-017',type:'Corrective',issue:'Ring yarn strength',action:'Review ring traveller size & spindle speed',owner:'Production',due:'05 Mar',progress:70,sb:'badge-wip',sl:'In Progress'},
  {id:'CAPA-010',ncr:'NCR-016',type:'Corrective',issue:'Solvent purity',action:'Change supplier + incoming QC protocol',owner:'Purchase',due:'08 Mar',progress:90,sb:'badge-wip',sl:'In Progress'},
  {id:'CAPA-009',ncr:'NCR-015',type:'Preventive',issue:'Count variation in export',action:'Calibrate auto-coner count sensor monthly',owner:'QC Dept',due:'28 Feb',progress:100,sb:'badge-closed',sl:'Closed'},
  {id:'CAPA-008',ncr:'NCR-014',type:'Preventive',issue:'Cotton moisture content',action:'Install humidity sensor in RM store',owner:'Admin',due:'25 Feb',progress:100,sb:'badge-closed',sl:'Closed'},
]

export default function CAPAList() {
  const nav = useNavigate()
  const [chip, setChip] = useState('All')
  const filtered = chip==='All'?CAPAS:CAPAS.filter(c=>c.sl===chip)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">CAPA List <small>Corrective & Preventive Actions</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/capa/new')}>➕ New CAPA</button>
        </div>
      </div>

      <div className="pp-chips">
        {['All','In Progress','Closed'].map(c=>(
          <div key={c} className={`pp-chip${chip===c?' on':''}`} onClick={() => setChip(c)}>
            {c} <span>{c==='All'?CAPAS.length:CAPAS.filter(x=>x.sl===c).length}</span>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>CAPA No.</th><th>NCR Ref</th><th>Type</th><th>Issue</th>
          <th>Action</th><th>Owner</th><th>Due</th><th>Progress</th><th>Status</th>
        </tr></thead>
        <tbody>
          {filtered.map(c=>(
            <tr key={c.id} style={{cursor:'pointer'}} onClick={() => nav('/qm/capa/new')}>
              <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{c.id}</strong></td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-orange)'}}>{c.ncr}</td>
              <td><span style={{background:c.type==='Corrective'?'#F8D7DA':'#D4EDDA',color:c.type==='Corrective'?'#721C24':'#155724',
                padding:'2px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:'700'}}>{c.type}</span></td>
              <td style={{fontSize:'12px'}}>{c.issue}</td>
              <td style={{fontSize:'12px'}}>{c.action}</td>
              <td>{c.owner}</td>
              <td style={{color:c.due<'10 Mar'&&c.sl!=='Closed'?'var(--odoo-red)':'inherit',fontWeight:c.due<'10 Mar'&&c.sl!=='Closed'?'700':'400'}}>{c.due}</td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <div className="yield-bar" style={{width:'60px'}}>
                    <div className="yield-fill" style={{width:`${c.progress}%`,background:c.progress===100?'var(--odoo-green)':c.progress>=70?'var(--odoo-orange)':'var(--odoo-blue)'}}></div>
                  </div>
                  <span style={{fontSize:'11px',fontWeight:'700'}}>{c.progress}%</span>
                </div>
              </td>
              <td><span className={`badge ${c.sb}`}>{c.sl}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
