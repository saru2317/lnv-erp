import React, { useState } from 'react'

const MCS = [
  {id:'RFM-01',name:'Ring Frame Machine 01',type:'Spinning',loc:'Shop Floor A',util:85,eff:94,wo:'WO-2025-019',status:'Running',sb:'badge-progress',
   specs:[['Capacity','500 Kg/day'],['Spindles','480'],['Last PM','15 Feb 2025'],['Next PM','15 Mar 2025']]},
  {id:'RFM-02',name:'Ring Frame Machine 02',type:'Spinning',loc:'Shop Floor A',util:72,eff:91,wo:'WO-2025-021 (Planned)',status:'Running',sb:'badge-progress',
   specs:[['Capacity','500 Kg/day'],['Spindles','480'],['Last PM','20 Feb 2025'],['Next PM','20 Mar 2025']]},
  {id:'OE-02', name:'Open End Machine',type:'OE Spinning',loc:'Shop Floor B',util:30,eff:45,wo:'WO-2025-018 (Hold)',status:'On Hold',sb:'badge-hold',
   specs:[['Capacity','300 Kg/day'],['Rotors','192'],['Last PM','10 Feb 2025'],['Next PM','10 Mar 2025']]},
  {id:'CSP-01',name:'Compact Spinning',type:'Compact Spin',loc:'Shop Floor B',util:60,eff:88,wo:'WO-2025-020',status:'Running',sb:'badge-released',
   specs:[['Capacity','800 Kg/day'],['Spindles','960'],['Last PM','01 Feb 2025'],['Next PM','01 Mar 2025']]},
  {id:'WD-01', name:'Winding Machine',type:'Winding',loc:'Shop Floor C',util:0,eff:0,wo:'—',status:'Idle',sb:'badge-draft',
   specs:[['Capacity','1200 Kg/day'],['Drums','48'],['Last PM','05 Feb 2025'],['Next PM','05 Mar 2025']]},
  {id:'CRD-01',name:'Carding Machine',type:'Carding',loc:'Preparatory',util:55,eff:96,wo:'Multiple WOs',status:'Running',sb:'badge-progress',
   specs:[['Capacity','400 Kg/day'],['Flats','86'],['Last PM','25 Jan 2025'],['Next PM','25 Feb 2025']]},
  {id:'BLW-01',name:'Blow Room',type:'Blow Room',loc:'Preparatory',util:70,eff:98,wo:'Multiple WOs',status:'Running',sb:'badge-progress',
   specs:[['Capacity','2000 Kg/day'],['Lines','2'],['Last PM','20 Jan 2025'],['Next PM','20 Feb 2025']]},
  {id:'DRW-01',name:'Drawing Frame',type:'Drawing',loc:'Preparatory',util:48,eff:95,wo:'Multiple WOs',status:'Running',sb:'badge-released',
   specs:[['Capacity','600 Kg/day'],['Deliveries','6'],['Last PM','15 Jan 2025'],['Next PM','15 Feb 2025']]},
]

export default function Machines() {
  const [sel, setSel] = useState(null)
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Machines / Work Centres <small>Capacity & Status</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">➕ Add Machine</button>
          <button className="btn btn-s sd-bsm">📋 PM Schedule</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px'}}>
        {MCS.map(m=>(
          <div key={m.id} className="mc-card" onClick={() => setSel(sel===m.id?null:m.id)}
            style={{cursor:'pointer',border:`2px solid ${sel===m.id?'var(--odoo-purple)':'transparent'}`,transition:'all .15s'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
              <div>
                <div className="mc-name">{m.id} · {m.name}</div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{m.type} · {m.loc}</div>
              </div>
              <span className={`badge ${m.sb}`}>{m.status}</span>
            </div>
            <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginBottom:'6px'}}>
              🏭 {m.wo}
            </div>
            <div className="mc-util-bar">
              <div className="mc-util-fill" style={{
                width:`${m.util}%`,
                background: m.util>90?'var(--odoo-red)':m.util>70?'var(--odoo-orange)':m.util>40?'var(--odoo-green)':'var(--odoo-gray)'
              }}></div>
            </div>
            <div className="mc-util-label">
              <span>Utilization: <strong>{m.util}%</strong></span>
              <span>Efficiency: <strong>{m.eff>0?m.eff+'%':'—'}</strong></span>
            </div>
            {sel===m.id && (
              <div style={{marginTop:'10px',paddingTop:'10px',borderTop:'1px solid var(--odoo-border)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                {m.specs.map(([l,v])=>(
                  <div key={l} style={{fontSize:'11px'}}>
                    <span style={{color:'var(--odoo-gray)',fontWeight:'600'}}>{l}: </span>
                    <span style={{fontWeight:'700'}}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
