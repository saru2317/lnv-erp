import React, { useState } from 'react'

const BY_CUSTOMER = [
  {name:'ABC Textiles Pvt Ltd', rev:'₹11,80,000',cogs:'₹6,20,000',gp:'₹5,60,000',gpm:'47.5%',netP:'₹3,40,000',npm:'28.8%'},
  {name:'MNO Fabrics Ltd',       rev:'₹17,70,000',cogs:'₹9,40,000',gp:'₹8,30,000',gpm:'46.9%',netP:'₹4,80,000',npm:'27.1%'},
  {name:'XYZ Industries',         rev:'₹9,25,000', cogs:'₹5,10,000',gp:'₹4,15,000',gpm:'44.9%',netP:'₹2,20,000',npm:'23.8%'},
  {name:'PQR Spinning Mills',     rev:'₹9,85,000', cogs:'₹5,70,000',gp:'₹4,15,000',gpm:'42.1%',netP:'₹2,04,000',npm:'20.7%'},
]
const BY_PRODUCT = [
  {name:'Ring Yarn (30s)',     qty:'500 Kg', rev:'₹12,00,000',cogs:'₹8,32,000',gp:'₹3,68,000',gpm:'30.7%'},
  {name:'Open End Yarn (12s)',qty:'800 Kg', rev:'₹18,00,000',cogs:'₹12,78,000',gp:'₹5,22,000',gpm:'29.0%'},
  {name:'Cotton Sliver A',    qty:'1200 Kg',rev:'₹10,80,000',cogs:'₹10,62,000',gp:'₹18,000',  gpm:'1.7%'},
  {name:'Surface Treatment',  qty:'42 Jobs',rev:'₹7,80,000', cogs:'₹2,88,000',gp:'₹4,92,000',gpm:'63.1%'},
]

export default function ProfitabilityReport() {
  const [view, setView] = useState('customer')
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Profitability Analysis <small>Feb 2025 · Customer & Product Wise</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>Feb 2025</option><option>Q3 FY25</option></select>
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
        </div>
      </div>
      <div className="fi-chips">
        {[['customer','By Customer'],['product','By Product']].map(([k,l])=>(
          <div key={k} className={`fi-chip${view===k?' on':''}`} onClick={() => setView(k)}>{l}</div>
        ))}
      </div>

      {view==='customer' ? (
        <table className="fi-data-table">
          <thead><tr><th>Customer</th><th>Revenue</th><th>COGS</th><th>Gross Profit</th><th>Gross Margin</th><th>Net Profit</th><th>Net Margin</th></tr></thead>
          <tbody>
            {BY_CUSTOMER.map(r=>(
              <tr key={r.name}>
                <td><strong>{r.name}</strong></td>
                <td style={{fontWeight:'700'}}>{r.rev}</td>
                <td className="dr">{r.cogs}</td>
                <td className="cr">{r.gp}</td>
                <td><strong style={{color:parseFloat(r.gpm)>45?'var(--odoo-green)':'var(--odoo-orange)'}}>{r.gpm}</strong></td>
                <td className="cr">{r.netP}</td>
                <td><strong style={{color:parseFloat(r.npm)>25?'var(--odoo-green)':'var(--odoo-orange)'}}>{r.npm}</strong></td>
              </tr>
            ))}
            <tr style={{background:'#EDE0EA',fontWeight:'700',fontFamily:'Syne,sans-serif'}}>
              <td>TOTAL</td><td>₹48,60,000</td><td className="dr">₹26,40,000</td>
              <td className="cr">₹22,20,000</td><td>45.7%</td><td className="cr">₹12,44,000</td><td>25.6%</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <table className="fi-data-table">
          <thead><tr><th>Product</th><th>Qty Produced</th><th>Revenue</th><th>COGM</th><th>Gross Profit</th><th>Gross Margin</th></tr></thead>
          <tbody>
            {BY_PRODUCT.map(r=>(
              <tr key={r.name}>
                <td><strong>{r.name}</strong></td>
                <td>{r.qty}</td>
                <td style={{fontWeight:'700'}}>{r.rev}</td>
                <td className="dr">{r.cogs}</td>
                <td className="cr">{r.gp}</td>
                <td><strong style={{color:parseFloat(r.gpm)>30?'var(--odoo-green)':parseFloat(r.gpm)>10?'var(--odoo-orange)':'var(--odoo-red)'}}>{r.gpm}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
