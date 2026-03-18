import React from 'react'
const BVA = [
  {cat:'Sales Revenue',          budget:'₹50,00,000',actual:'₹48,60,000',var:'₹(1,40,000)',pct:'-2.8%',flag:'warn'},
  {cat:'COGS — Direct Material', budget:'₹25,00,000',actual:'₹26,40,000',var:'₹(1,40,000)',pct:'-5.6%',flag:'danger'},
  {cat:'COGM — Labour',          budget:'₹4,50,000', actual:'₹4,80,000', var:'₹(30,000)',  pct:'-6.7%',flag:'danger'},
  {cat:'COGM — Overhead',        budget:'₹2,50,000', actual:'₹2,60,000', var:'₹(10,000)',  pct:'-4.0%',flag:'warn'},
  {cat:'Salary & Wages',         budget:'₹8,00,000', actual:'₹8,40,000', var:'₹(40,000)',  pct:'-5.0%',flag:'danger'},
  {cat:'Rent & Utilities',       budget:'₹1,20,000', actual:'₹1,20,000', var:'₹0',          pct:'0.0%', flag:'ok'},
  {cat:'Maintenance (PM)',        budget:'₹60,000',   actual:'₹48,000',   var:'₹12,000',     pct:'+20.0%',flag:'ok'},
  {cat:'Freight & Logistics',    budget:'₹90,000',   actual:'₹84,000',   var:'₹6,000',      pct:'+6.7%', flag:'ok'},
  {cat:'Admin & Other Expenses', budget:'₹1,00,000', actual:'₹90,000',   var:'₹10,000',     pct:'+10.0%',flag:'ok'},
  {cat:'NET PROFIT',             budget:'₹8,30,000', actual:'₹10,44,000',var:'₹2,14,000',   pct:'+25.8%',flag:'ok',bold:true},
]
export default function BudgetVsActual() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Budget vs Actual <small>February 2025 · Monthly Comparison</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>Feb 2025</option><option>Q3 FY25</option></select>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        {[{cls:'green',l:'Revenue Actual vs Budget',v:'-2.8%',s:'Below budget by ₹1.4L'},
          {cls:'red',  l:'Total Cost Overrun',v:'+₹2.2L',s:'Over budget'},
          {cls:'green',l:'Net Profit vs Budget',v:'+25.8%',s:'Above target'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Category</th><th>Budget (₹)</th><th>Actual (₹)</th><th>Variance (₹)</th><th>Variance %</th><th>Status</th></tr></thead>
        <tbody>{BVA.map(r=>(
          <tr key={r.cat} style={r.bold?{background:'#EDE0EA',fontFamily:'Syne,sans-serif',fontWeight:'700'}:{}}>
            <td>{r.cat}</td>
            <td>{r.budget}</td>
            <td style={{fontWeight:'700'}}>{r.actual}</td>
            <td style={{fontWeight:'700',color:r.var.startsWith('₹(')?'var(--odoo-red)':r.var==='₹0'?'var(--odoo-gray)':'var(--odoo-green)'}}>{r.var}</td>
            <td style={{fontWeight:'700',color:r.flag==='ok'?'var(--odoo-green)':r.flag==='warn'?'var(--odoo-orange)':'var(--odoo-red)'}}>{r.pct}</td>
            <td><span className={`badge ${r.flag==='ok'?'badge-posted':r.flag==='warn'?'badge-partial':'badge-overdue'}`}>
              {r.flag==='ok'?'On Track':r.flag==='warn'?'Watch':'Over Budget'}
            </span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
