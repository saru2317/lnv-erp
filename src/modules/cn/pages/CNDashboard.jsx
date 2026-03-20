import React from 'react'
const MEALS=[
  {dept:'Production', breakfast:42, lunch:85, dinner:12, tea:120, total:259, deduction:5180},
  {dept:'Maintenance',breakfast:8,  lunch:18, dinner:4,  tea:28,  total:58,  deduction:1160},
  {dept:'Quality',    breakfast:5,  lunch:12, dinner:0,  tea:15,  total:32,  deduction:640},
  {dept:'Admin',      breakfast:10, lunch:22, dinner:0,  tea:30,  total:62,  deduction:1240},
  {dept:'HR',         breakfast:3,  lunch:8,  dinner:0,  tea:10,  total:21,  deduction:420},
]
export default function CNDashboard(){return(<div>
  <div className="fi-lv-hdr"><div className="fi-lv-title">Canteen Dashboard <small>Today</small></div><div className="fi-lv-actions"><button className="btn btn-p sd-bsm">+ Issue Coupons</button></div></div>
  <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
    {[{cls:'purple',l:'Total Meals Today',v:'432',s:'All departments'},{cls:'green',l:'Lunch Count',v:'145',s:'Current day'},{cls:'orange',l:'MTD Deduction',v:'₹94,380',s:'From salary'},{cls:'blue',l:'Canteen Cost MTD',v:'₹1.8L',s:'Total expense'}].map(k=>(<div key={k.l} className={`fi-kpi-card ${k.cls}`}><div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div></div>))}
  </div>
  <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
    <div style={{padding:'12px 16px',borderBottom:'1px solid var(--odoo-border)',fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700}}> Today's Meal Count by Department</div>
    <table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead><tr style={{background:'#F8F9FA'}}>{['Department','Breakfast','Lunch','Dinner','Tea/Snacks','Total Meals','Deduction (₹)'].map(h=>(<th key={h} style={{padding:'8px 12px',fontSize:11,fontWeight:700,color:'var(--odoo-gray)',textAlign:h==='Department'?'left':'center',borderBottom:'1px solid var(--odoo-border)'}}>{h}</th>))}</tr></thead>
      <tbody>{MEALS.map(m=>(<tr key={m.dept} style={{borderBottom:'1px solid var(--odoo-border)'}}>
        <td style={{padding:'10px 12px',fontWeight:700,fontSize:12}}>{m.dept}</td>
        {[m.breakfast,m.lunch,m.dinner,m.tea].map((v,i)=>(<td key={i} style={{padding:'10px 12px',textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:12}}>{v||'—'}</td>))}
        <td style={{padding:'10px 12px',textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:13,fontWeight:700,color:'var(--odoo-purple)'}}>{m.total}</td>
        <td style={{padding:'10px 12px',textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color:'var(--odoo-green)'}}>₹{m.deduction.toLocaleString('en-IN')}</td>
      </tr>))}
      <tr style={{background:'#EDE0EA',fontWeight:700}}>
        <td style={{padding:'10px 12px',fontFamily:'Syne,sans-serif',fontSize:12}}>TOTAL</td>
        {[MEALS.reduce((s,m)=>s+m.breakfast,0),MEALS.reduce((s,m)=>s+m.lunch,0),MEALS.reduce((s,m)=>s+m.dinner,0),MEALS.reduce((s,m)=>s+m.tea,0)].map((v,i)=>(<td key={i} style={{padding:'10px 12px',textAlign:'center',fontFamily:'DM Mono,monospace'}}>{v}</td>))}
        <td style={{padding:'10px 12px',textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:14,color:'var(--odoo-purple)'}}>432</td>
        <td style={{padding:'10px 12px',textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:14,color:'var(--odoo-green)'}}>₹8,640</td>
      </tr>
      </tbody>
    </table>
  </div>
</div>)}
