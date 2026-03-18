import React, { useState } from 'react'

const MP_DATA = [
  {dept:'Production',     sanctioned:50,actual:45,open:5, plan2025:55,gap:-5, contractors:8,  skillGap:'Ring Frame Operators'},
  {dept:'Quality',        sanctioned:14,actual:12,open:2, plan2025:14,gap:0,  contractors:0,  skillGap:'QC Inspector (Chemical)'},
  {dept:'Maintenance',    sanctioned:10,actual:8, open:2, plan2025:12,gap:-4, contractors:3,  skillGap:'Electrical Technician'},
  {dept:'Accounts',       sanctioned:10,actual:9, open:1, plan2025:10,gap:0,  contractors:0,  skillGap:'—'},
  {dept:'HR & Admin',     sanctioned:6, actual:5, open:1, plan2025:6, gap:0,  contractors:0,  skillGap:'HR Executive'},
  {dept:'Sales',          sanctioned:8, actual:8, open:0, plan2025:10,gap:-2, contractors:0,  skillGap:'Sales Executive'},
  {dept:'Warehouse',      sanctioned:12,actual:11,open:1, plan2025:12,gap:0,  contractors:2,  skillGap:'—'},
  {dept:'Security',       sanctioned:6, actual:6, open:0, plan2025:6, gap:0,  contractors:6,  skillGap:'—'},
  {dept:'Canteen',        sanctioned:4, actual:4, open:0, plan2025:4, gap:0,  contractors:4,  skillGap:'—'},
]

const BUDGET = {target_ecost:1950000,actual_ecost:1840000,headcount_budget:160,headcount_actual:148}

export default function ManpowerPlanning() {
  const total = MP_DATA.reduce((acc,d)=>({
    sanctioned:acc.sanctioned+d.sanctioned,actual:acc.actual+d.actual,
    open:acc.open+d.open,contractors:acc.contractors+d.contractors
  }),{sanctioned:0,actual:0,open:0,contractors:0})

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Manpower Planning <small>Department-wise Headcount 2025</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm">Plan New Year</button>
        </div>
      </div>

      {/* E-Cost Budget */}
      <div style={{background:'var(--odoo-purple)',borderRadius:'10px',padding:'18px',color:'#fff',marginBottom:'16px'}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'16px',marginBottom:'12px'}}>Pay Bill Budget vs Actual — Feb 2025</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px'}}>
          {[['E-Cost Budget',`₹${(BUDGET.target_ecost/100000).toFixed(1)}L`,'month'],
            ['E-Cost Actual',`₹${(BUDGET.actual_ecost/100000).toFixed(1)}L`,'month'],
            ['Headcount Budget',BUDGET.headcount_budget,'employees'],
            ['Headcount Actual',BUDGET.headcount_actual,'employees'],
          ].map(([l,v,s])=>(
            <div key={l} style={{background:'rgba(255,255,255,.12)',borderRadius:'8px',padding:'12px',textAlign:'center'}}>
              <div style={{fontSize:'10px',fontWeight:'700',opacity:.7,textTransform:'uppercase',marginBottom:'4px'}}>{l}</div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'22px'}}>{v}</div>
              <div style={{fontSize:'10px',opacity:.7}}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:'12px',background:'rgba(255,255,255,.1)',borderRadius:'6px',padding:'8px 12px',fontSize:'12px'}}>
          📊 E-Cost utilization: <strong>{Math.round(BUDGET.actual_ecost/BUDGET.target_ecost*100)}%</strong> · 
          Savings: <strong>₹{((BUDGET.target_ecost-BUDGET.actual_ecost)/1000).toFixed(0)}K</strong> this month
        </div>
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Department</th>
          <th>Sanctioned</th><th>Actual (Staff)</th><th>Contractors</th>
          <th>Total Deployed</th><th>Open Positions</th>
          <th>2025 Plan</th><th>Gap</th><th>Skill Gap</th>
        </tr></thead>
        <tbody>
          {MP_DATA.map(d=>{
            const total_deployed = d.actual + d.contractors
            return (
              <tr key={d.dept}>
                <td><strong>{d.dept}</strong></td>
                <td style={{textAlign:'center'}}>{d.sanctioned}</td>
                <td style={{textAlign:'center',fontWeight:'700',color:'var(--odoo-green)'}}>{d.actual}</td>
                <td style={{textAlign:'center',color:'var(--odoo-orange)',fontWeight:d.contractors>0?'700':'400'}}>{d.contractors||'—'}</td>
                <td style={{textAlign:'center',fontWeight:'700',
                  color:total_deployed>=d.sanctioned?'var(--odoo-green)':'var(--odoo-orange)'}}>{total_deployed}</td>
                <td style={{textAlign:'center',color:d.open>0?'var(--odoo-red)':'var(--odoo-green)',fontWeight:'700'}}>{d.open||'—'}</td>
                <td style={{textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:'12px'}}>{d.plan2025}</td>
                <td style={{textAlign:'center',fontWeight:'700',
                  color:d.plan2025-d.actual>0?'var(--odoo-orange)':'var(--odoo-green)'}}>
                  {d.plan2025-d.actual>0?`+${d.plan2025-d.actual} needed`:d.plan2025-d.actual<0?`${d.plan2025-d.actual}`:'✅'}
                </td>
                <td style={{fontSize:'12px',color:d.skillGap==='—'?'var(--odoo-gray)':'var(--odoo-red)',fontWeight:d.skillGap==='—'?'400':'600'}}>{d.skillGap}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{background:'#EDE0EA',fontWeight:'700'}}>
            <td>Total</td>
            <td style={{textAlign:'center'}}>{total.sanctioned}</td>
            <td style={{textAlign:'center',color:'var(--odoo-green)'}}>{total.actual}</td>
            <td style={{textAlign:'center',color:'var(--odoo-orange)'}}>{total.contractors}</td>
            <td style={{textAlign:'center'}}>{total.actual+total.contractors}</td>
            <td style={{textAlign:'center',color:'var(--odoo-red)'}}>{total.open}</td>
            <td colSpan={3}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
