import React, { useState } from 'react'

const DEPT_HC = [
  {dept:'Production',  hc:45,target:50,cost:742000,  clr:'#8E44AD'},
  {dept:'Quality',     hc:12,target:14,cost:198000,  clr:'#117A65'},
  {dept:'Maintenance', hc:8, target:10,cost:152000,  clr:'#E06F39'},
  {dept:'Accounts',    hc:9, target:10,cost:175000,  clr:'#196F3D'},
  {dept:'HR & Admin',  hc:5, target:6, cost:108000,  clr:'#2874A6'},
  {dept:'Sales',       hc:8, target:8, cost:195000,  clr:'#B7950B'},
  {dept:'Warehouse',   hc:11,target:12,cost:170000,  clr:'#784212'},
  {dept:'Others',      hc:50,target:50,cost:100000,  clr:'#717D7E'},
]

const ATT_TREND = [
  {m:'Sep',pct:94.8},{m:'Oct',pct:95.2},{m:'Nov',pct:93.6},{m:'Dec',pct:96.1},
  {m:'Jan',pct:92.4},{m:'Feb',pct:93.2}
]

const TURNOVER = [
  {m:'Sep',joins:1,exits:0},{m:'Oct',joins:2,exits:1},{m:'Nov',joins:0,exits:1},
  {m:'Dec',joins:3,exits:0},{m:'Jan',joins:1,exits:2},{m:'Feb',joins:2,exits:1}
]

export default function HCMReport() {
  const [month, setMonth] = useState('February 2025')

  const totalHC = DEPT_HC.reduce((s,d) => s+d.hc, 0)
  const totalCost = DEPT_HC.reduce((s,d) => s+d.cost, 0)
  const openPositions = DEPT_HC.reduce((s,d) => s+(d.target-d.hc), 0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">HR Analytics Report <small>{month}</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" onChange={e=>setMonth(e.target.value)}>
            <option>February 2025</option><option>January 2025</option>
          </select>
          <button className="btn btn-s sd-bsm">⬇️ Export PDF</button>
          <button className="btn btn-s sd-bsm">📧 Email to MD</button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="hcm-kpi-grid">
        {[{cls:'purple',ic:'👥',l:'Total Headcount',    v:'148',         s:'↑ 2 vs Jan · Target: 160',tc:'up'},
          {cls:'green', ic:'✅',l:'Attendance Rate',    v:'93.2%',       s:'Target: ≥ 95%',tc:'wn'},
          {cls:'blue',  ic:'💰',l:'Gross Pay Bill',     v:'₹18.4L',      s:'E-cost: ₹21.8L/mo',tc:'up'},
          {cls:'orange',ic:'📋',l:'Attrition (MTD)',    v:'0.67%',       s:'1 exit · Annualized: 8%',tc:'wn'},
        ].map(k => (
          <div key={k.l} className={`hcm-kpi-card ${k.cls}`}>
            <div className="hcm-kpi-icon">{k.ic}</div>
            <div className="hcm-kpi-label">{k.l}</div>
            <div className="hcm-kpi-value">{k.v}</div>
            <div className={`hcm-kpi-trend ${k.tc}`}>{k.s}</div>
          </div>
        ))}
      </div>

      <div className="fi-panel-grid">

        {/* Headcount by Dept */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>👥 Headcount vs Target — Dept Wise</h3></div>
          <div className="fi-panel-body">
            {DEPT_HC.map(d => (
              <div key={d.dept} style={{marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                  <strong>{d.dept}</strong>
                  <span>
                    <strong style={{color:d.hc>=d.target?'var(--odoo-green)':'var(--odoo-orange)'}}>{d.hc}</strong>
                    <span style={{color:'var(--odoo-gray)'}}> / {d.target}</span>
                    {d.hc < d.target && <span style={{color:'var(--odoo-red)',fontSize:'10px',marginLeft:'4px'}}>(-{d.target-d.hc} open)</span>}
                  </span>
                </div>
                <div style={{background:'#F0EEEB',borderRadius:'4px',height:'8px'}}>
                  <div style={{width:`${d.hc/d.target*100}%`,height:'100%',borderRadius:'4px',background:d.clr,maxWidth:'100%'}}></div>
                </div>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px',background:'#EDE0EA',borderRadius:'6px',marginTop:'8px',fontSize:'12px',fontWeight:'700'}}>
              <span>Total: {totalHC} employees</span>
              <span style={{color:'var(--odoo-red)'}}>{openPositions} open positions</span>
            </div>
          </div>
        </div>

        {/* Attendance Trend */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>📊 Attendance Trend — Last 6 Months</h3></div>
          <div className="fi-panel-body">
            <div style={{display:'flex',gap:'8px',alignItems:'flex-end',height:'100px',marginBottom:'8px'}}>
              {ATT_TREND.map(t => {
                const pct = (t.pct - 88) / 10 * 100
                return (
                  <div key={t.m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',height:'100%'}}>
                    <div style={{flex:1,width:'100%',display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
                      <div style={{
                        height:`${pct}%`,background:t.pct>=95?'var(--odoo-green)':t.pct>=92?'var(--odoo-orange)':'var(--odoo-red)',
                        borderRadius:'4px 4px 0 0',position:'relative',minHeight:'4px'}}>
                        <div style={{position:'absolute',top:'-16px',left:'50%',transform:'translateX(-50%)',
                          fontSize:'9px',fontWeight:'700',whiteSpace:'nowrap',color:'var(--odoo-dark)'}}>{t.pct}%</div>
                      </div>
                    </div>
                    <div style={{fontSize:'10px',fontWeight:'600',color:'var(--odoo-gray)'}}>{t.m}</div>
                  </div>
                )
              })}
            </div>
            <div style={{background:'#FFF3CD',borderRadius:'6px',padding:'8px 10px',fontSize:'11px',color:'#856404'}}>
              ⚠️ Feb at 93.2% — below 95% target. Top absentee dept: Production (14 abs days)
            </div>
          </div>
        </div>
      </div>

      {/* Turnover & Payroll Analysis */}
      <div className="fi-panel-grid">
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>🔄 Joins vs Exits — Last 6 Months</h3></div>
          <div className="fi-panel-body">
            <div style={{display:'flex',gap:'8px',alignItems:'flex-end',height:'80px',marginBottom:'12px'}}>
              {TURNOVER.map(t => (
                <div key={t.m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',height:'100%'}}>
                  <div style={{flex:1,width:'100%',display:'flex',flexDirection:'column',justifyContent:'flex-end',gap:'2px'}}>
                    <div style={{height:`${t.joins*25}%`,background:'var(--odoo-green)',borderRadius:'3px',minHeight:'4px'}}></div>
                    <div style={{height:`${t.exits*25}%`,background:'var(--odoo-red)',borderRadius:'3px',minHeight:t.exits>0?'4px':'0'}}></div>
                  </div>
                  <div style={{fontSize:'10px',fontWeight:'600',color:'var(--odoo-gray)'}}>{t.m}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'14px',fontSize:'11px',justifyContent:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:'10px',height:'10px',background:'var(--odoo-green)',borderRadius:'2px'}}></span>Joins ({TURNOVER.reduce((s,t)=>s+t.joins,0)})</div>
              <div style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:'10px',height:'10px',background:'var(--odoo-red)',borderRadius:'2px'}}></span>Exits ({TURNOVER.reduce((s,t)=>s+t.exits,0)})</div>
            </div>
          </div>
        </div>

        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>📊 HR Summary Metrics</h3></div>
          <div className="fi-panel-body">
            {[['Average Tenure','4.2 years'],
              ['Gender Ratio','Male 76% · Female 24%'],
              ['Staff / Worker / Contractor','42 / 88 / 18'],
              ['On Probation','8 employees'],
              ['Leave Utilization (Feb)','2.4 days avg/emp'],
              ['OT % of Workers','12.4% availed OT'],
              ['Training Hrs (YTD)','18 hrs/emp'],
              ['Open Positions','4 vacancies'],
              ['Payroll Compliance','PF ✅ ESI ✅ PT ✅'],
              ['Annual Attrition Rate','8.1% (industry: 12%)'],
            ].map(([l,v]) => (
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',
                borderBottom:'1px solid var(--odoo-border)',fontSize:'12px'}}>
                <span style={{color:'var(--odoo-gray)',fontWeight:'600'}}>{l}</span>
                <strong style={{textAlign:'right',maxWidth:'55%'}}>{v}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* E-Cost summary */}
      <div className="fi-panel">
        <div className="fi-panel-hdr"><h3>💰 E-Cost by Department — Feb 2025</h3></div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr><th>Department</th><th>Headcount</th><th>Gross Pay</th><th>E-Cost (Total)</th><th>Avg E-Cost/Emp</th><th>vs Budget</th></tr></thead>
            <tbody>
              {DEPT_HC.map(d => {
                const avgCost = Math.round(d.cost / d.hc)
                const budget = Math.round(d.cost * 1.06)
                const variance = budget - d.cost
                return (
                  <tr key={d.dept}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <div style={{width:'10px',height:'10px',borderRadius:'2px',background:d.clr,flexShrink:0}}></div>
                        <strong>{d.dept}</strong>
                      </div>
                    </td>
                    <td style={{textAlign:'center'}}>{d.hc}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>₹{Math.round(d.cost*0.82).toLocaleString()}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',color:'var(--odoo-orange)'}}>₹{d.cost.toLocaleString()}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'var(--odoo-gray)'}}>₹{avgCost.toLocaleString()}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',color:'var(--odoo-green)'}}>
                      +₹{variance.toLocaleString()} ✅
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{background:'#EDE0EA',fontWeight:'700'}}>
                <td>Total</td>
                <td style={{textAlign:'center'}}>{totalHC}</td>
                <td style={{fontFamily:'DM Mono,monospace'}}>₹{Math.round(totalCost*0.82).toLocaleString()}</td>
                <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-orange)'}}>₹{totalCost.toLocaleString()}</td>
                <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-gray)'}}>₹{Math.round(totalCost/totalHC).toLocaleString()}</td>
                <td style={{color:'var(--odoo-green)'}}>Under Budget ✅</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
