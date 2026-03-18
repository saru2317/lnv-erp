import React, { useState } from 'react'

const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb']
const TARGET_MONTHLY = 1950000

const MONTHLY_DATA = [
  {m:'Apr 2024',budget:1900000,actual:1820000,headcount:142},
  {m:'May',budget:1900000,actual:1835000,headcount:143},
  {m:'Jun',budget:1920000,actual:1850000,headcount:144},
  {m:'Jul',budget:1920000,actual:1860000,headcount:145},
  {m:'Aug',budget:1930000,actual:1858000,headcount:145},
  {m:'Sep',budget:1930000,actual:1872000,headcount:146},
  {m:'Oct',budget:1940000,actual:1875000,headcount:146},
  {m:'Nov',budget:1940000,actual:1880000,headcount:147},
  {m:'Dec',budget:1950000,actual:1890000,headcount:147},
  {m:'Jan 2025',budget:1950000,actual:1830000,headcount:146},
  {m:'Feb',budget:1950000,actual:1840000,headcount:148},
]

const DEPT_ECOST = [
  {dept:'Production',budget:780000,actual:742000,headcount:45,target_hc:50},
  {dept:'Quality',budget:210000,actual:198000,headcount:12,target_hc:14},
  {dept:'Maintenance',budget:160000,actual:152000,headcount:8,target_hc:10},
  {dept:'Accounts',budget:180000,actual:175000,headcount:9,target_hc:10},
  {dept:'HR & Admin',budget:110000,actual:108000,headcount:5,target_hc:6},
  {dept:'Sales',budget:200000,actual:195000,headcount:8,target_hc:8},
  {dept:'Warehouse',budget:180000,actual:170000,headcount:11,target_hc:12},
]

export default function PayBillControl() {
  const [period, setPeriod] = useState('FY 2024-25')

  const feb = MONTHLY_DATA[MONTHLY_DATA.length-1]
  const ytd_actual = MONTHLY_DATA.reduce((s,m)=>s+m.actual,0)
  const ytd_budget = MONTHLY_DATA.reduce((s,m)=>s+m.budget,0)
  const ytd_savings = ytd_budget - ytd_actual

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Pay Bill Control <small>E-Cost Target vs Actual</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" onChange={e=>setPeriod(e.target.value)}>
            <option>FY 2024-25</option><option>Feb 2025</option>
          </select>
          <button className="btn btn-s sd-bsm">Export Report</button>
        </div>
      </div>

      <div className="hcm-kpi-grid">
        {[{cls:'purple',l:'MTD E-Cost Target',v:`₹${(TARGET_MONTHLY/100000).toFixed(1)}L`,s:'All departments'},
          {cls:'green', l:'MTD E-Cost Actual',v:`₹${(feb.actual/100000).toFixed(2)}L`,s:`Savings: ₹${((TARGET_MONTHLY-feb.actual)/1000).toFixed(0)}K`},
          {cls:'blue',  l:'YTD Budget (11 mo)',v:`₹${(ytd_budget/1000000).toFixed(2)}Cr`,s:'Apr 2024 – Feb 2025'},
          {cls:'orange',l:'YTD Savings',v:`₹${(ytd_savings/100000).toFixed(1)}L`,s:`${Math.round(ytd_savings/ytd_budget*100)}% under budget`},
        ].map(k=>(
          <div key={k.l} className={`hcm-kpi-card ${k.cls}`}>
            <div className="hcm-kpi-label">{k.l}</div>
            <div className="hcm-kpi-value">{k.v}</div>
            <div className="hcm-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      {/* Monthly trend chart (CSS bars) */}
      <div className="fi-panel">
        <div className="fi-panel-hdr"><h3>Monthly E-Cost Trend — FY 2024-25</h3></div>
        <div className="fi-panel-body">
          <div style={{display:'flex',gap:'6px',alignItems:'flex-end',height:'120px',paddingBottom:'24px',position:'relative'}}>
            {/* Target line */}
            <div style={{position:'absolute',left:0,right:0,height:'1px',background:'var(--odoo-red)',
              bottom:`${(TARGET_MONTHLY/2200000)*100}%`,opacity:.5}}></div>
            {MONTHLY_DATA.map((m,i)=>{
              const maxV = 2200000, pctB = m.budget/maxV*100, pctA = m.actual/maxV*100
              const under = m.actual <= m.budget
              return (
                <div key={m.m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',height:'100%'}}>
                  <div style={{flex:1,width:'100%',display:'flex',flexDirection:'column',justifyContent:'flex-end',position:'relative'}}>
                    <div style={{height:`${pctB}%`,width:'50%',background:'#EDE0EA',position:'absolute',left:0,bottom:0,borderRadius:'3px 3px 0 0'}}></div>
                    <div style={{height:`${pctA}%`,width:'50%',background:under?'var(--odoo-green)':'var(--odoo-red)',position:'absolute',right:0,bottom:0,borderRadius:'3px 3px 0 0'}}></div>
                  </div>
                  <div style={{fontSize:'9px',fontWeight:'600',color:'var(--odoo-gray)',textAlign:'center'}}>{m.m}</div>
                </div>
              )
            })}
          </div>
          <div style={{display:'flex',gap:'14px',justifyContent:'center',fontSize:'11px',marginTop:'4px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:'12px',height:'12px',background:'#EDE0EA',borderRadius:'2px'}}></span>Budget</div>
            <div style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:'12px',height:'12px',background:'var(--odoo-green)',borderRadius:'2px'}}></span>Actual (Under)</div>
            <div style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:'12px',height:'12px',background:'var(--odoo-red)',borderRadius:'2px'}}></span>Actual (Over)</div>
          </div>
        </div>
      </div>

      {/* Dept-wise */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">🏢 Department-wise E-Cost Control — Feb 2025</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr>
              <th>Department</th><th>Target HC</th><th>Actual HC</th>
              <th>E-Cost Budget</th><th>E-Cost Actual</th><th>Variance</th><th>% Utilization</th>
            </tr></thead>
            <tbody>
              {DEPT_ECOST.map(d=>{
                const variance = d.budget - d.actual
                const pct = Math.round(d.actual/d.budget*100)
                return (
                  <tr key={d.dept}>
                    <td><strong>{d.dept}</strong></td>
                    <td style={{textAlign:'center'}}>{d.target_hc}</td>
                    <td style={{textAlign:'center',color:d.headcount>=d.target_hc?'var(--odoo-green)':'var(--odoo-orange)',fontWeight:'700'}}>{d.headcount}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>₹{d.budget.toLocaleString()}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700'}}>₹{d.actual.toLocaleString()}</td>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px',fontWeight:'700',
                      color:variance>=0?'var(--odoo-green)':'var(--odoo-red)'}}>
                      {variance>=0?'+':''}₹{Math.abs(variance).toLocaleString()}
                    </td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <div style={{background:'#F0EEEB',borderRadius:'4px',height:'7px',width:'60px'}}>
                          <div style={{width:`${Math.min(pct,100)}%`,height:'100%',borderRadius:'4px',
                            background:pct>100?'var(--odoo-red)':pct>90?'var(--odoo-orange)':'var(--odoo-green)'}}></div>
                        </div>
                        <span style={{fontWeight:'700',fontSize:'12px',color:pct>100?'var(--odoo-red)':'var(--odoo-green)'}}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{background:'#EDE0EA',fontWeight:'700'}}>
                <td>Total</td>
                <td style={{textAlign:'center'}}>{DEPT_ECOST.reduce((s,d)=>s+d.target_hc,0)}</td>
                <td style={{textAlign:'center',color:'var(--odoo-green)'}}>{DEPT_ECOST.reduce((s,d)=>s+d.headcount,0)}</td>
                <td style={{fontFamily:'DM Mono,monospace'}}>₹{DEPT_ECOST.reduce((s,d)=>s+d.budget,0).toLocaleString()}</td>
                <td style={{fontFamily:'DM Mono,monospace'}}>₹{DEPT_ECOST.reduce((s,d)=>s+d.actual,0).toLocaleString()}</td>
                <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>
                  +₹{DEPT_ECOST.reduce((s,d)=>s+(d.budget-d.actual),0).toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
