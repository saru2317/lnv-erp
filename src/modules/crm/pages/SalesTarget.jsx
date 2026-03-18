import React, { useState } from 'react'
import { SALESREPS, OPPORTUNITIES, fmtFull, fmt } from './_crmData'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHLY_DATA = {
  'Vijay A.':    [320000,380000,420000,450000,0,0,0,0,0,0,0,0],
  'Ravi Kumar':  [280000,310000,380000,0,0,0,0,0,0,0,0,0],
  'Preethi S.':  [240000,265000,315000,0,0,0,0,0,0,0,0,0],
  'Suresh M.':   [180000,200000,210000,0,0,0,0,0,0,0,0,0],
}

export default function SalesTarget() {
  const [rep, setRep] = useState('all')
  const [period, setPeriod] = useState('monthly')

  const displayReps = rep==='all' ? SALESREPS : SALESREPS.filter(r=>r.name===rep)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Sales Targets <small>Rep-wise performance tracker</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p btn-s">+ Set Target</button>
        </div>
      </div>

      {/* Overall KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'14px'}}>
        {[
          {l:'Total Target FY',  v:fmt(SALESREPS.reduce((s,r)=>s+r.target,0)*12/3),  clr:'var(--odoo-purple)',ic:'🎯'},
          {l:'Total Achieved',   v:fmt(SALESREPS.reduce((s,r)=>s+r.achieved,0)),      clr:'var(--odoo-green)', ic:'✅'},
          {l:'Team Avg Achievement',v:Math.round(SALESREPS.reduce((s,r)=>s+r.achieved/r.target,0)/SALESREPS.length*100)+'%',clr:'var(--odoo-orange)',ic:'📊'},
          {l:'Deals in Pipeline', v:OPPORTUNITIES.filter(o=>o.stage!=='Won'&&o.stage!=='Lost').length,clr:'var(--odoo-blue)',ic:'📈'},
        ].map(k=>(
          <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.clr}}>
            <div className="crm-kpi-icon">{k.ic}</div>
            <div className="crm-kpi-val" style={{color:k.clr,fontSize:'16px'}}>{k.v}</div>
            <div className="crm-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="sd-filter-bar">
        <select className="sd-select" value={rep} onChange={e=>setRep(e.target.value)}>
          <option value="all">All Sales Reps</option>
          {SALESREPS.map(r=><option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
        <select className="sd-select" value={period} onChange={e=>setPeriod(e.target.value)}>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
      </div>

      {/* Rep Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'14px',marginBottom:'18px'}}>
        {displayReps.map(r=>{
          const pct = Math.round(r.achieved/r.target*100)
          const clr = pct>=90?'var(--odoo-green)':pct>=70?'var(--odoo-orange)':'var(--odoo-red)'
          const myOpps = OPPORTUNITIES.filter(o=>o.owner===r.name&&o.stage!=='Won'&&o.stage!=='Lost')
          const pipeline = myOpps.reduce((s,o)=>s+o.value,0)
          return (
            <div key={r.id} className="fi-panel">
              <div className="fi-panel-hdr">
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'var(--odoo-purple)',
                    display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:'700',fontSize:'13px'}}>
                    {r.name.split(' ').map(w=>w[0]).join('')}
                  </div>
                  <div>
                    <div style={{fontWeight:'700',fontSize:'13px'}}>{r.name}</div>
                    <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>📍 {r.region} · {r.email}</div>
                  </div>
                </div>
                <div style={{fontSize:'22px',fontWeight:'800',fontFamily:'Syne,sans-serif',color:clr}}>{pct}%</div>
              </div>
              <div className="fi-panel-body">
                {/* Progress bar */}
                <div style={{marginBottom:'12px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                    <span>Achievement</span>
                    <span><strong style={{color:clr}}>{fmtFull(r.achieved)}</strong> / {fmtFull(r.target)}</span>
                  </div>
                  <div style={{background:'#F0EEEB',borderRadius:'6px',height:'10px'}}>
                    <div style={{width:`${Math.min(pct,100)}%`,height:'100%',borderRadius:'6px',background:clr,transition:'width .3s'}}></div>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'12px'}}>
                  {[
                    ['Gap',fmt(Math.max(0,r.target-r.achieved)),'var(--odoo-red)'],
                    ['Pipeline',fmt(pipeline),'var(--odoo-orange)'],
                    ['Active Opps',myOpps.length,'var(--odoo-blue)'],
                  ].map(([l,v,c])=>(
                    <div key={l} style={{textAlign:'center',padding:'8px',background:'#F8F9FA',borderRadius:'6px'}}>
                      <div style={{fontWeight:'800',color:c,fontFamily:'Syne,sans-serif'}}>{v}</div>
                      <div style={{fontSize:'10px',color:'var(--odoo-gray)',fontWeight:'700',textTransform:'uppercase'}}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Monthly trend */}
                <div>
                  <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',marginBottom:'6px'}}>MONTHLY TREND</div>
                  <div style={{display:'flex',gap:'4px',alignItems:'flex-end',height:'50px'}}>
                    {(MONTHLY_DATA[r.name]||[]).slice(0,6).map((v,i)=>{
                      const maxV = Math.max(...(MONTHLY_DATA[r.name]||[]))
                      const h = maxV>0 ? (v/maxV)*44 : 0
                      return (
                        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
                          <div style={{width:'100%',height:`${h}px`,background:v>0?'var(--odoo-purple)':'#e0e0e0',borderRadius:'2px 2px 0 0',transition:'height .3s'}}></div>
                          <div style={{fontSize:'9px',color:'var(--odoo-gray)'}}>{MONTHS[i]}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Table */}
      <div className="fi-panel">
        <div className="fi-panel-hdr"><h3>Team Summary</h3></div>
        <div className="fi-panel-body" style={{padding:'0'}}>
          <table className="sd-table">
            <thead><tr><th>Sales Rep</th><th>Region</th><th>Target</th><th>Achieved</th><th>%</th><th>Gap</th><th>Pipeline</th><th>Won Deals</th><th>Status</th></tr></thead>
            <tbody>
              {SALESREPS.map(r=>{
                const pct = Math.round(r.achieved/r.target*100)
                const clr = pct>=90?'var(--odoo-green)':pct>=70?'var(--odoo-orange)':'var(--odoo-red)'
                const won = OPPORTUNITIES.filter(o=>o.owner===r.name&&o.stage==='Won').length
                const pipeline = OPPORTUNITIES.filter(o=>o.owner===r.name&&o.stage!=='Won'&&o.stage!=='Lost').reduce((s,o)=>s+o.value,0)
                return (
                  <tr key={r.id} className="sd-tr-hover">
                    <td><strong style={{fontSize:'12px'}}>{r.name}</strong></td>
                    <td style={{fontSize:'12px'}}>{r.region}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{fmtFull(r.target)}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700'}}>{fmtFull(r.achieved)}</td>
                    <td>
                      <span style={{fontWeight:'800',color:clr,fontFamily:'DM Mono,monospace'}}>{pct}%</span>
                    </td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-red)'}}>{fmtFull(Math.max(0,r.target-r.achieved))}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-orange)'}}>{fmt(pipeline)}</td>
                    <td style={{textAlign:'center'}}><span style={{fontWeight:'700',color:'var(--odoo-green)'}}>{won}</span></td>
                    <td><span className={pct>=90?'crm-stage-won':pct>=70?'crm-badge-contacted':'crm-badge-notq'}>{pct>=90?'On Track':pct>=70?'At Risk':'Below Target'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
