import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PLAN = [
  {week:'Week 1 (1–7 Mar)', prod:'Ring Yarn 30s',  qty:'500 Kg', mc:'RFM-01',start:'01 Mar',end:'05 Mar',so:'SO-2025-042',sb:'badge-released',sl:'Planned'},
  {week:'Week 1 (1–7 Mar)', prod:'Compact Sliver',  qty:'800 Kg', mc:'CSP-01',start:'01 Mar',end:'07 Mar',so:'SO-2025-043',sb:'badge-released',sl:'Planned'},
  {week:'Week 2 (8–14 Mar)',prod:'Open End Yarn 12s',qty:'300 Kg', mc:'OE-02', start:'08 Mar',end:'12 Mar',so:'SO-2025-044',sb:'badge-draft',  sl:'Draft'},
  {week:'Week 2 (8–14 Mar)',prod:'Ring Yarn 40s',   qty:'400 Kg', mc:'RFM-01',start:'09 Mar',end:'14 Mar',so:'SO-2025-045',sb:'badge-draft',  sl:'Draft'},
  {week:'Week 3 (15–21 Mar)',prod:'Compact Sliver', qty:'600 Kg', mc:'CSP-01',start:'15 Mar',end:'19 Mar',so:'SO-2025-046',sb:'badge-draft',  sl:'Draft'},
  {week:'Week 3 (15–21 Mar)',prod:'Ring Yarn 30s',  qty:'500 Kg', mc:'RFM-02',start:'15 Mar',end:'20 Mar',so:'SO-2025-047',sb:'badge-draft',  sl:'Draft'},
  {week:'Week 4 (22–31 Mar)',prod:'Open End Yarn 12s',qty:'400 Kg',mc:'OE-02',start:'22 Mar',end:'28 Mar',so:'SO-2025-048',sb:'badge-draft',  sl:'Draft'},
]

export default function ProductionPlan() {
  const nav = useNavigate()
  const [chip, setChip] = useState('All')
  const weeks = [...new Set(PLAN.map(p=>p.week))]
  const filtered = chip==='All'?PLAN:PLAN.filter(p=>p.sl===chip)

  // Group by week
  const grouped = weeks.reduce((acc,w)=>{
    const items = filtered.filter(p=>p.week===w)
    if(items.length) acc[w]=items
    return acc
  },{})

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Production Plan <small>March 2025 Schedule</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/capacity')}>⚡ Capacity Check</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/mrp')}>📊 MRP Run</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/pp/wo/new')}>➕ Create WO from Plan</button>
        </div>
      </div>

      <div className="pp-chips">
        {['All','Planned','Draft'].map(c=>(
          <div key={c} className={`pp-chip${chip===c?' on':''}`} onClick={() => setChip(c)}>{c}</div>
        ))}
      </div>

      {Object.entries(grouped).map(([week, items])=>(
        <div key={week} style={{marginBottom:'20px'}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:'700',fontSize:'14px',color:'var(--odoo-purple)',
            padding:'8px 14px',background:'#EDE0EA',borderRadius:'6px',marginBottom:'8px'}}>
            📅 {week}
          </div>
          <table className="fi-data-table">
            <thead><tr>
              <th>Product</th><th>Planned Qty</th><th>Machine</th><th>Start</th><th>End</th><th>Sales Order</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {items.map((p,i)=>(
                <tr key={i}>
                  <td><strong>{p.prod}</strong></td>
                  <td>{p.qty}</td>
                  <td>{p.mc}</td>
                  <td>{p.start}</td>
                  <td>{p.end}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-blue)'}}>{p.so}</td>
                  <td><span className={`badge ${p.sb}`}>{p.sl}</span></td>
                  <td>
                    <div style={{display:'flex',gap:'4px'}}>
                      <button className="btn-xs pri" onClick={() => nav('/pp/wo/new')}>Create WO</button>
                      {p.sl==='Draft'&&<button className="btn-xs">Approve</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
