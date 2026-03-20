import React, { useState } from 'react'

const ASSETS = [
  {code:'FA-001',name:'Ring Frame Machine M-001',cat:'Plant & Machinery',purc:'01 Apr 2020',cost:'₹18,00,000',life:'15 Yrs',method:'SLM',rate:'6.67%',depYr:'₹1,20,060',accDep:'₹5,40,270',wdv:'₹12,59,730',status:'Active'},
  {code:'FA-002',name:'Combing Machine M-002',   cat:'Plant & Machinery',purc:'15 Jun 2019',cost:'₹12,00,000',life:'15 Yrs',method:'SLM',rate:'6.67%',depYr:'₹80,040', accDep:'₹4,80,240',wdv:'₹7,19,760', status:'Active'},
  {code:'FA-003',name:'Spinning Machine M-003',  cat:'Plant & Machinery',purc:'01 Apr 2021',cost:'₹22,00,000',life:'15 Yrs',method:'SLM',rate:'6.67%',depYr:'₹1,46,740',accDep:'₹4,40,220',wdv:'₹17,59,780',status:'Active'},
  {code:'FA-004',name:'Air Compressor M-004',    cat:'Plant & Machinery',purc:'01 Jan 2022',cost:'₹3,50,000', life:'10 Yrs',method:'SLM',rate:'10%',  depYr:'₹35,000',  accDep:'₹1,09,375',wdv:'₹2,40,625', status:'Active'},
  {code:'FA-005',name:'Electric Motor M-005',    cat:'Plant & Machinery',purc:'10 Mar 2018',cost:'₹4,00,000', life:'10 Yrs',method:'SLM',rate:'10%',  depYr:'₹40,000',  accDep:'₹2,80,000',wdv:'₹1,20,000', status:'Under Repair'},
  {code:'FA-006',name:'Office Furniture Set',    cat:'Furniture',         purc:'01 Apr 2022',cost:'₹1,80,000', life:'10 Yrs',method:'SLM',rate:'10%',  depYr:'₹18,000',  accDep:'₹52,500',  wdv:'₹1,27,500', status:'Active'},
  {code:'FA-007',name:'Laptops & Computers x5',  cat:'IT Equipment',      purc:'01 Sep 2023',cost:'₹3,50,000', life:'5 Yrs', method:'SLM',rate:'20%',  depYr:'₹70,000',  accDep:'₹63,333',  wdv:'₹2,86,667', status:'Active'},
  {code:'FA-008',name:'Old Winding Machine M-008',cat:'Plant & Machinery',purc:'01 Apr 2010',cost:'₹6,00,000', life:'15 Yrs',method:'SLM',rate:'6.67%',depYr:'₹40,020',  accDep:'₹6,00,000',wdv:'₹0',         status:'Fully Depreciated'},
]

export default function FixedAssetRegister() {
  const [sel, setSel] = useState(null)
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Fixed Asset Register <small>As of 28 Feb 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Depreciation Schedule</button>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm">Add Asset</button>
        </div>
      </div>
      <div className="fi-kpi-grid">
        {[{cls:'purple',l:'Gross Block',v:'₹70,80,000',s:'8 assets'},
          {cls:'orange',l:'Accumulated Depreciation',v:'₹25,65,938',s:'All assets'},
          {cls:'green', l:'Net Block (WDV)',v:'₹45,14,062',s:'Book value'},
          {cls:'blue',  l:'Depreciation (Feb)',v:'₹42,000',s:'This month'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr>
          <th>Asset Code</th><th>Asset Name</th><th>Category</th><th>Purchased</th>
          <th>Cost</th><th>Method</th><th>Dep/Year</th><th>Acc. Dep</th><th>WDV</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>
          {ASSETS.map(a=>(
            <tr key={a.code} onClick={() => setSel(a)}>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{a.code}</td>
              <td><strong>{a.name}</strong></td>
              <td>{a.cat}</td><td>{a.purc}</td><td>{a.cost}</td>
              <td>{a.method} {a.rate}</td>
              <td style={{color:'var(--odoo-orange)'}}>{a.depYr}</td>
              <td className="dr">{a.accDep}</td>
              <td style={{fontWeight:'700',fontFamily:'Syne,sans-serif',color: a.wdv==='₹0'?'var(--odoo-red)':'var(--odoo-green)'}}>{a.wdv}</td>
              <td><span className={`badge ${a.status==='Active'?'badge-posted':a.status==='Under Repair'?'badge-partial':'badge-draft'}`}>{a.status}</span></td>
              <td onClick={e=>e.stopPropagation()}><button className="btn-xs" onClick={() => setSel(a)}>Detail</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {sel && (
        <div className="fi-modal-overlay" onClick={() => setSel(null)}>
          <div className="fi-modal-box" onClick={e=>e.stopPropagation()}>
            <div className="fi-modal-hdr">
              <h3>{sel.code} — {sel.name}</h3>
              <span className="fi-modal-close" onClick={() => setSel(null)}></span>
            </div>
            <div className="fi-modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                {[['Asset Code',sel.code],['Category',sel.cat],['Purchase Date',sel.purc],
                  ['Cost',sel.cost],['Useful Life',sel.life],['Method',`${sel.method} @ ${sel.rate}`],
                  ['Annual Depreciation',sel.depYr],['Accumulated Dep.',sel.accDep],['WDV (Book Value)',sel.wdv]
                ].map(([l,v])=>(
                  <div key={l}><label style={{fontSize:'11px',color:'var(--odoo-gray)',fontWeight:'700',textTransform:'uppercase',display:'block',marginBottom:'3px'}}>{l}</label><strong>{v}</strong></div>
                ))}
              </div>
              <div className="fi-alert info" style={{fontSize:'12px'}}> Monthly depreciation JV auto-posted to: 6400 · Depreciation (Dr) / 1500 · Accumulated Depreciation (Cr)</div>
              <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
                <button className="btn btn-s sd-bsm" onClick={() => setSel(null)}>Close</button>
                <button className="btn btn-s sd-bsm">Depreciation Schedule</button>
                <button className="btn btn-s sd-bsm" style={{color:'var(--odoo-red)',borderColor:'var(--odoo-red)'}}> Dispose Asset</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
