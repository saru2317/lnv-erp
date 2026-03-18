import React, { useState } from 'react'
const MEALS=['Breakfast','Lunch','Dinner/Snack']
const DEPTS=['Production','Quality','Maintenance','Accounts','HR & Admin','Security']
const DATA={Breakfast:[42,12,8,9,5,6],Lunch:[45,12,8,9,5,6],['Dinner/Snack']:[38,10,6,5,4,6]}
export default function CanteenRegister() {
  const [meal,setMeal]=useState('Lunch')
  const counts=DATA[meal]
  const total=counts.reduce((s,c)=>s+c,0)
  const cost_per=81
  return (
    <div>
      <div className="fi-lv-hdr"><div className="fi-lv-title">Canteen Register <small>Daily Meal Tracking</small></div>
        <div className="fi-lv-actions"><button className="btn btn-p sd-bsm">📋 Mark Today</button></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
        {[["Today's Meals",`${Object.values(DATA).flat().reduce((s,c)=>s+c,0)/3|0}`,'var(--odoo-purple)'],
          ['Monthly Cost',`₹${(total*cost_per*26/1000).toFixed(0)}K`,'var(--odoo-orange)'],
          ['Per Meal Avg',`₹${cost_per}`,'var(--odoo-green)']].map(([l,v,c])=>(
          <div key={l} style={{background:'#fff',borderRadius:'8px',padding:'12px',boxShadow:'0 1px 4px rgba(0,0,0,.08)',borderLeft:`4px solid ${c}`}}>
            <div style={{fontSize:'10px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'4px'}}>{l}</div>
            <div style={{fontFamily:'Syne,sans-serif',fontSize:'22px',fontWeight:'800',color:c}}>{v}</div>
          </div>
        ))}
      </div>
      <div className="pp-chips">{MEALS.map(m=><div key={m} className={`pp-chip${meal===m?' on':''}`} onClick={()=>setMeal(m)}>{m}</div>)}</div>
      <table className="fi-data-table">
        <thead><tr><th>Department</th><th>Headcount</th><th>Meals Today</th><th>Cost</th></tr></thead>
        <tbody>{DEPTS.map((d,i)=>(
          <tr key={d}><td><strong>{d}</strong></td><td style={{textAlign:'center'}}>{[45,12,8,9,5,6][i]}</td>
          <td style={{textAlign:'center',fontWeight:'700',color:'var(--odoo-green)'}}>{counts[i]}</td>
          <td style={{fontFamily:'DM Mono,monospace',fontSize:'12px'}}>₹{(counts[i]*cost_per).toLocaleString()}</td></tr>
        ))}</tbody>
        <tfoot><tr style={{background:'#F8F9FA',fontWeight:'700'}}><td>Total</td><td></td>
          <td style={{textAlign:'center',color:'var(--odoo-purple)',fontFamily:'DM Mono,monospace'}}>{total}</td>
          <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-blue)'}}>₹{(total*cost_per).toLocaleString()}</td></tr></tfoot>
      </table>
    </div>
  )
}
