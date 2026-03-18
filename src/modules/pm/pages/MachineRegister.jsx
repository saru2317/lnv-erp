import React, { useState } from 'react'

const MACHINES = [
  {id:'SPG-01',name:'Ring Frame Machine 01',make:'Lakshmi Machine Works',model:'LR6/AX',yr:2018,cap:'480 spindles',util:98,status:'Running',loc:'Spinning Hall A',last:'01 Nov 2024',sb:'badge-pass'},
  {id:'SPG-02',name:'Ring Frame Machine 02',make:'Lakshmi Machine Works',model:'LR6/AX',yr:2019,cap:'480 spindles',util:87,status:'Running',loc:'Spinning Hall A',last:'15 Dec 2024',sb:'badge-pass'},
  {id:'OE-01', name:'OE Spinning Machine 01',make:'Rieter',model:'R35',yr:2020,cap:'240 rotors',util:82,status:'Running',loc:'OE Hall',last:'01 Feb 2025',sb:'badge-pass'},
  {id:'OE-02', name:'OE Spinning Machine 02',make:'Rieter',model:'R35',yr:2020,cap:'240 rotors',util:78,status:'Running',loc:'OE Hall',last:'24 Feb 2025',sb:'badge-pass'},
  {id:'WND-01',name:'Winding Machine',make:'Murata',model:'No. 21C',yr:2017,cap:'60 drums',util:0,status:'Breakdown',loc:'Winding Dept',last:'—',sb:'badge-fail'},
  {id:'CRD-01',name:'Carding Machine',make:'Truetzschler',model:'TC11',yr:2016,cap:'200 Kg/hr',util:76,status:'Running',loc:'Card Room',last:'10 Feb 2025',sb:'badge-pass'},
  {id:'BLW-01',name:'Blow Room Line',make:'Truetzschler',model:'T-SUCOCLEAN',yr:2016,cap:'500 Kg/hr',util:72,status:'Running',loc:'Blow Room',last:'15 Feb 2025',sb:'badge-pass'},
  {id:'DRW-01',name:'Drawing Frame',make:'Rieter',model:'RSB-D45',yr:2019,cap:'400 m/min',util:81,status:'Running',loc:'Draw Frame Area',last:'10 Feb 2025',sb:'badge-pass'},
  {id:'CSP-01',name:'Compact Spinning Unit',make:'Suessen',model:'EliTe®',yr:2021,cap:'336 spindles',util:91,status:'Running',loc:'Spinning Hall B',last:'20 Jan 2025',sb:'badge-pass'},
  {id:'FB-02', name:'Fiber Bundle M/C',make:'Savio',model:'Polar E',yr:2018,cap:'—',util:0,status:'Breakdown',loc:'Prep Area',last:'—',sb:'badge-fail'},
]

export default function MachineRegister() {
  const [expanded, setExpanded] = useState(null)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Machine Register <small>Plant & Equipment Master</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-p sd-bsm">➕ Add Machine</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'16px'}}>
        {[['Total Machines',MACHINES.length,'var(--odoo-purple)'],
          ['Running',MACHINES.filter(m=>m.status==='Running').length,'var(--odoo-green)'],
          ['Breakdown',MACHINES.filter(m=>m.status==='Breakdown').length,'var(--odoo-red)'],
          ['Avg Utilization',`${Math.round(MACHINES.filter(m=>m.util>0).reduce((s,m)=>s+m.util,0)/MACHINES.filter(m=>m.util>0).length)}%`,'var(--odoo-orange)'],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:'#fff',borderRadius:'8px',padding:'12px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',textAlign:'center'}}>
            <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'4px'}}>{l}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'22px',fontWeight:'800',color:c}}>{v}</div>
          </div>
        ))}
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Machine ID</th><th>Name</th><th>Make / Model</th><th>Year</th>
          <th>Capacity</th><th>Utilization</th><th>Location</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>
          {MACHINES.map(m=>(
            <React.Fragment key={m.id}>
              <tr style={{cursor:'pointer',background:m.status==='Breakdown'?'#FFF5F5':'inherit'}}
                onClick={() => setExpanded(expanded===m.id?null:m.id)}>
                <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{m.id}</strong></td>
                <td><strong>{m.name}</strong></td>
                <td style={{fontSize:'12px'}}>{m.make} · {m.model}</td>
                <td>{m.yr}</td>
                <td style={{fontSize:'12px'}}>{m.cap}</td>
                <td>
                  {m.status==='Breakdown' ? (
                    <span style={{color:'var(--odoo-red)',fontWeight:'700'}}>🔴 Down</span>
                  ) : (
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <div style={{background:'#F0EEEB',borderRadius:'4px',height:'8px',width:'70px'}}>
                        <div style={{width:`${m.util}%`,height:'100%',borderRadius:'4px',
                          background:m.util>=85?'var(--odoo-green)':m.util>=70?'var(--odoo-orange)':'var(--odoo-red)'}}></div>
                      </div>
                      <span style={{fontSize:'11px',fontWeight:'700',color:m.util>=85?'var(--odoo-green)':m.util>=70?'var(--odoo-orange)':'var(--odoo-red)'}}>{m.util}%</span>
                    </div>
                  )}
                </td>
                <td style={{fontSize:'12px'}}>{m.loc}</td>
                <td><span className={`badge ${m.sb}`}>{m.status==='Running'?'✅ Running':'🔴 Breakdown'}</span></td>
                <td><button className="btn-xs pri">{expanded===m.id?'▲':'▼'}</button></td>
              </tr>
              {expanded===m.id && (
                <tr><td colSpan={9} style={{background:'#FDF8FC',padding:'14px'}}>
                  <div style={{display:'flex',gap:'24px',flexWrap:'wrap'}}>
                    {[['Asset ID',m.id],['Make',m.make],['Model',m.model],['Year',m.yr],
                      ['Capacity',m.cap],['Location',m.loc],['Last PM',m.last],['Status',m.status]
                    ].map(([l,v])=>(
                      <div key={l}>
                        <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase'}}>{l}</div>
                        <div style={{fontSize:'13px',fontWeight:'700',color:'var(--odoo-dark)'}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </td></tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
