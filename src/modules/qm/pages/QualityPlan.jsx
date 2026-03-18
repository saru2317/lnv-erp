import React, { useState } from 'react'

const PLANS = [
  {id:'QP-001',prod:'Ring Yarn (30s / 40s)',freq:'Every WO',params:6,created:'01 Jan 2025',status:'Active',
   tests:['Count (Ne)','Tensile Strength (CSP)','Twist per Inch','Unevenness U%','Imperfections IPI','Elongation at Break']},
  {id:'QP-002',prod:'Open End Yarn (12s)',freq:'Every WO',params:5,created:'01 Jan 2025',status:'Active',
   tests:['Count (Ne)','Tensile Strength','Nep Count','Unevenness U%','Moisture Content']},
  {id:'QP-003',prod:'Compact Cotton Sliver',freq:'Every WO',params:4,created:'01 Jan 2025',status:'Active',
   tests:['Weight (g/m)','Nep Count','Trash Content','Moisture Content']},
  {id:'QP-004',prod:'Cotton Bale (Incoming)',freq:'Each GRN',params:4,created:'15 Jan 2025',status:'Active',
   tests:['Fibre Length (mm)','Micronaire Value','Strength (g/tex)','Trash Content %']},
  {id:'QP-005',prod:'Solvent Chemical (Incoming)',freq:'Each GRN',params:3,created:'15 Jan 2025',status:'Active',
   tests:['Purity %','Specific Gravity','Flash Point (°C)']},
]

export default function QualityPlan() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Quality Plans <small>Inspection Parameters per Product</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm">➕ New Quality Plan</button>
        </div>
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Plan No.</th><th>Product / Material</th><th>Inspection Freq.</th>
          <th>Parameters</th><th>Created</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {PLANS.map(p=>(
            <React.Fragment key={p.id}>
              <tr style={{cursor:'pointer'}} onClick={() => setExpanded(expanded===p.id?null:p.id)}>
                <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{p.id}</strong></td>
                <td><strong>{p.prod}</strong></td>
                <td>{p.freq}</td>
                <td>{p.params} parameters</td>
                <td>{p.created}</td>
                <td><span className="badge badge-pass">{p.status}</span></td>
                <td onClick={e=>e.stopPropagation()}>
                  <div style={{display:'flex',gap:'4px'}}>
                    <button className="btn-xs pri" onClick={()=>setExpanded(expanded===p.id?null:p.id)}>{expanded===p.id?'▲':'▼'}</button>
                    <button className="btn-xs">Edit</button>
                  </div>
                </td>
              </tr>
              {expanded===p.id && (
                <tr>
                  <td colSpan={7} style={{background:'#FDF8FC',padding:'14px'}}>
                    <div style={{fontWeight:'700',fontSize:'12px',color:'var(--odoo-purple)',marginBottom:'8px'}}>🧪 Test Parameters — {p.id}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                      {p.tests.map((t,i)=>(
                        <span key={t} style={{background:'#fff',border:'1px solid var(--odoo-border)',borderRadius:'6px',
                          padding:'6px 12px',fontSize:'12px',fontWeight:'600',display:'flex',alignItems:'center',gap:'6px'}}>
                          <span style={{fontFamily:'DM Mono,monospace',fontSize:'10px',color:'var(--odoo-gray)'}}>P{i+1}</span>
                          {t}
                        </span>
                      ))}
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
