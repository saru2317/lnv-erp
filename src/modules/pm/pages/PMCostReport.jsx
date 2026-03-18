import React, { useState } from 'react'

const COST_DATA = [
  {cat:'Spare Parts',mtd:82400,ytd:184200,budget:100000,clr:'var(--odoo-orange)'},
  {cat:'Labour (Overtime)',mtd:28000,ytd:56000,budget:30000,clr:'var(--odoo-blue)'},
  {cat:'External Agency',mtd:42000,ytd:96000,budget:40000,clr:'var(--odoo-red)'},
  {cat:'Lubrication & Consumables',mtd:12600,ytd:24800,budget:15000,clr:'var(--odoo-green)'},
  {cat:'Capital Repairs',mtd:15000,ytd:95000,budget:150000,clr:'var(--odoo-purple)'},
]

const MACHINE_COST = [
  {mc:'WND-01',name:'Winding Machine',  bds:3,hrs:28,spareCost:21800,labCost:12400,total:34200,clr:'var(--odoo-red)'},
  {mc:'SPG-01',name:'Ring Frame 01',    bds:1,hrs:3, spareCost:1600, labCost:4800, total:6400, clr:'var(--odoo-orange)'},
  {mc:'OE-02', name:'OE Spinning 02',   bds:1,hrs:6, spareCost:8500, labCost:6000, total:14500,clr:'var(--odoo-orange)'},
  {mc:'CRD-01',name:'Carding Machine',  bds:0,hrs:4, spareCost:1200, labCost:3200, total:4400, clr:'var(--odoo-blue)'},
  {mc:'RFM-01',name:'Ring Frame M/C',   bds:1,hrs:1.5,spareCost:800,labCost:1600, total:2400, clr:'var(--odoo-blue)'},
]

export default function PMCostReport() {
  const [month, setMonth] = useState('February 2025')
  const totalMTD = COST_DATA.reduce((s,c)=>s+c.mtd,0)
  const totalBudget = COST_DATA.reduce((s,c)=>s+c.budget,0)
  const budgetPct = Math.round(totalMTD/totalBudget*100)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Maintenance Cost Report <small>{month}</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" onChange={e=>setMonth(e.target.value)}>
            <option>February 2025</option><option>January 2025</option>
          </select>
          <button className="btn btn-s sd-bsm">⬇️ Export PDF</button>
        </div>
      </div>

      <div className="pm-kpi-grid">
        {[{cls:'orange',ic:'💰',l:'Total Maint. Cost (MTD)',v:`₹${(totalMTD/100000).toFixed(1)}L`,s:`Budget: ₹${(totalBudget/100000).toFixed(1)}L · ${budgetPct}% utilized`},
          {cls:'red',  ic:'📦',l:'Spare Parts Cost',v:`₹${(82400/1000).toFixed(0)}K`,s:'48% of total maint. cost'},
          {cls:'blue', ic:'⏱️',l:'Labour Hours',v:'38 hrs',s:'Breakdown + PM combined'},
          {cls:'purple',ic:'🔴',l:'Breakdown Cost',v:`₹${(MACHINE_COST.reduce((s,m)=>s+m.total,0)/1000).toFixed(0)}K`,s:`${MACHINE_COST.reduce((s,m)=>s+m.bds,0)} breakdowns MTD`},
        ].map(k=>(
          <div key={k.l} className={`pm-kpi-card ${k.cls}`}>
            <div className="pm-kpi-icon">{k.ic}</div>
            <div className="pm-kpi-label">{k.l}</div>
            <div className="pm-kpi-value">{k.v}</div>
            <div className="pm-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="fi-panel-grid">
        {/* Cost by category */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>📊 Cost by Category</h3></div>
          <div className="fi-panel-body">
            {COST_DATA.map(c=>{
              const pct = Math.round(c.mtd/c.budget*100)
              return (
                <div key={c.cat} style={{marginBottom:'14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                    <strong>{c.cat}</strong>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:'700',color:pct>100?'var(--odoo-red)':'var(--odoo-dark)'}}>
                      ₹{(c.mtd/1000).toFixed(0)}K / ₹{(c.budget/1000).toFixed(0)}K ({pct}%)
                    </span>
                  </div>
                  <div style={{background:'#F0EEEB',borderRadius:'4px',height:'8px'}}>
                    <div style={{width:`${Math.min(pct,100)}%`,height:'100%',borderRadius:'4px',
                      background:pct>100?'var(--odoo-red)':pct>85?'var(--odoo-orange)':c.clr,transition:'width .3s'}}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cost by machine */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>🏭 Cost by Machine</h3></div>
          <div className="fi-panel-body">
            {MACHINE_COST.sort((a,b)=>b.total-a.total).map(m=>(
              <div key={m.mc} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'8px 0',borderBottom:'1px solid var(--odoo-border)'}}>
                <div>
                  <div style={{fontWeight:'700',fontSize:'13px'}}>{m.mc} — {m.name}</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>
                    {m.bds} breakdown{m.bds!==1?'s':''} · {m.hrs} hrs downtime
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:'14px',fontWeight:'800',color:m.clr}}>₹{m.total.toLocaleString()}</div>
                  <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>spares + labour</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">💰 Budget vs Actual — {month}</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>Category</th><th>Budget</th><th>MTD Actual</th><th>YTD Actual</th><th>Variance</th><th>Budget %</th></tr></thead>
            <tbody>
              {COST_DATA.map(c=>{
                const variance = c.budget - c.mtd
                return (
                  <tr key={c.cat} style={{background:variance<0?'#FFF5F5':'inherit'}}>
                    <td><strong>{c.cat}</strong></td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>₹{c.budget.toLocaleString()}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700'}}>₹{c.mtd.toLocaleString()}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',color:'var(--odoo-gray)'}}>₹{c.ytd.toLocaleString()}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',
                      color:variance>=0?'var(--odoo-green)':'var(--odoo-red)'}}>
                      {variance>=0?'+':''}₹{Math.abs(variance).toLocaleString()}
                    </td>
                    <td>
                      <span style={{fontWeight:'700',fontSize:'12px',
                        color:c.mtd/c.budget>1?'var(--odoo-red)':c.mtd/c.budget>0.85?'var(--odoo-orange)':'var(--odoo-green)'}}>
                        {Math.round(c.mtd/c.budget*100)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{background:'#F8F9FA',fontWeight:'700'}}>
                <td>Total</td>
                <td style={{fontFamily:'DM Mono,monospace'}}>₹{totalBudget.toLocaleString()}</td>
                <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-blue)'}}>₹{totalMTD.toLocaleString()}</td>
                <td></td>
                <td style={{fontFamily:'DM Mono,monospace',color:totalBudget-totalMTD>=0?'var(--odoo-green)':'var(--odoo-red)'}}>
                  {totalBudget-totalMTD>=0?'+':''}₹{Math.abs(totalBudget-totalMTD).toLocaleString()}
                </td>
                <td style={{color:budgetPct>100?'var(--odoo-red)':budgetPct>85?'var(--odoo-orange)':'var(--odoo-green)',fontWeight:'800'}}>{budgetPct}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
