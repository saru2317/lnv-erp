import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MONTHLY = [
  {wo:'WO-2025-017',prod:'Ring Yarn (40s)',planned:200,produced:200,scrap:4,eff:94,mc:'RFM-01',status:'Closed'},
  {wo:'WO-2025-016',prod:'Compact Sliver',planned:600,produced:585,scrap:15,eff:97,mc:'CSP-01',status:'Closed'},
  {wo:'WO-2025-015',prod:'Cotton Sliver Grade A',planned:1000,produced:1000,scrap:8,eff:98,mc:'CRD-01',status:'Closed'},
  {wo:'WO-2025-014',prod:'Ring Yarn (30s)',planned:400,produced:388,scrap:12,eff:97,mc:'RFM-01',status:'Closed'},
  {wo:'WO-2025-013',prod:'Open End Yarn (12s)',planned:300,produced:272,scrap:28,eff:91,mc:'OE-02',status:'Closed'},
  {wo:'WO-2025-012',prod:'Compact Sliver',planned:500,produced:495,scrap:5,eff:99,mc:'CSP-01',status:'Closed'},
]

export default function PPReport() {
  const nav = useNavigate()
  const totalPlanned = MONTHLY.reduce((s,r)=>s+r.planned,0)
  const totalProduced = MONTHLY.reduce((s,r)=>s+r.produced,0)
  const totalScrap = MONTHLY.reduce((s,r)=>s+r.scrap,0)
  const avgEff = Math.round(MONTHLY.reduce((s,r)=>s+r.eff,0)/MONTHLY.length)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Production Report <small>February 2025</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>February 2025</option><option>January 2025</option><option>March 2025</option></select>
          <button className="btn btn-s sd-bsm">Export PDF</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/efficiency')}>Efficiency Report</button>
        </div>
      </div>

      <div className="pp-kpi-grid">
        {[{cls:'purple',ic:'',l:'Total Production (MTD)',v:`${totalProduced.toLocaleString()} Kg`,s:'28 work orders closed'},
          {cls:'green', ic:'',l:'Avg Efficiency',         v:`${avgEff}%`,s:'Target: 90%'},
          {cls:'red',   ic:'',l:'Total Scrap',            v:`${totalScrap} Kg`,s:`Scrap Rate: ${(totalScrap/totalPlanned*100).toFixed(1)}%`},
          {cls:'blue',  ic:'',l:'Machine Uptime',         v:'91%',s:'5 breakdowns this month'},
        ].map(k=>(
          <div key={k.l} className={`pp-kpi-card ${k.cls}`}>
            <div className="pp-kpi-icon">{k.ic}</div>
            <div className="pp-kpi-label">{k.l}</div>
            <div className="pp-kpi-value">{k.v}</div>
            <div className="pp-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      {/* Bar chart - simple CSS */}
      <div className="fi-panel" style={{marginBottom:'16px'}}>
        <div className="fi-panel-hdr"><h3>Production vs Target by Product</h3></div>
        <div className="fi-panel-body">
          <div style={{display:'flex',gap:'14px',alignItems:'flex-end',height:'140px',padding:'0 10px'}}>
            {[['Ring Yarn',588,600,'var(--odoo-purple)'],['Compact Sliver',1080,1100,'var(--odoo-orange)'],
              ['Cotton Sliver',1000,1000,'var(--odoo-green)'],['OE Yarn',272,300,'var(--odoo-red)']
            ].map(([l,a,t,c])=>(
              <div key={l} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                <div style={{fontSize:'11px',fontWeight:'600',color:c}}>{a}</div>
                <div style={{width:'100%',display:'flex',gap:'3px',alignItems:'flex-end',height:'100px'}}>
                  <div style={{flex:1,background:c,height:`${a/t*100}%`,borderRadius:'4px 4px 0 0',opacity:.9}}></div>
                  <div style={{flex:1,background:'#E8E0E6',height:'100%',borderRadius:'4px 4px 0 0'}}></div>
                </div>
                <div style={{fontSize:'10px',color:'var(--odoo-gray)',textAlign:'center'}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:'14px',padding:'6px 10px 0',fontSize:'11px',color:'var(--odoo-gray)'}}>
            <span>■ Actual &nbsp; □ Target</span>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">Work Order-wise Summary</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr>
              <th>Work Order</th><th>Product</th><th>Machine</th><th>Planned</th>
              <th>Produced</th><th>Scrap</th><th>Efficiency</th><th>Status</th>
            </tr></thead>
            <tbody>
              {MONTHLY.map(r=>(
                <tr key={r.wo}>
                  <td><strong style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-purple)'}}>{r.wo}</strong></td>
                  <td>{r.prod}</td>
                  <td>{r.mc}</td>
                  <td>{r.planned} Kg</td>
                  <td style={{fontWeight:'600',color:'var(--odoo-green)'}}>{r.produced} Kg</td>
                  <td style={{fontWeight:'600',color:'var(--odoo-red)'}}>{r.scrap} Kg</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <div style={{background:'#F0EEEB',borderRadius:'3px',height:'6px',width:'60px'}}>
                        <div style={{width:`${r.eff}%`,height:'100%',background:r.eff>=95?'var(--odoo-green)':r.eff>=90?'var(--odoo-orange)':'var(--odoo-red)',borderRadius:'3px'}}></div>
                      </div>
                      <span style={{fontSize:'11px',fontWeight:'700',color:r.eff>=95?'var(--odoo-green)':r.eff>=90?'var(--odoo-orange)':'var(--odoo-red)'}}>{r.eff}%</span>
                    </div>
                  </td>
                  <td><span className="badge badge-done">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:'#F8F9FA',fontWeight:'700'}}>
                <td colSpan={3}>Total</td>
                <td>{totalPlanned} Kg</td>
                <td style={{color:'var(--odoo-green)'}}>{totalProduced} Kg</td>
                <td style={{color:'var(--odoo-red)'}}>{totalScrap} Kg</td>
                <td style={{color:'var(--odoo-green)'}}>{avgEff}% avg</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
