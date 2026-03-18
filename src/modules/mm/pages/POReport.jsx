import React from 'react'

const ROWS = [
  {vendor:'Lakshmi Textile Mills',  pos:5, pov:'₹10,42,000',grn:'₹8,58,000', inv:'₹8,58,000', paid:'₹7,16,000',out:'₹1,42,000',outc:'var(--odoo-red)',   ot:'80%'},
  {vendor:'Coimbatore Spares Co.',  pos:4, pov:'₹4,85,000', grn:'₹4,85,000', inv:'₹4,85,000', paid:'₹3,96,500',out:'₹88,500',  outc:'var(--odoo-orange)',ot:'95%'},
  {vendor:'Sri Murugan Traders',    pos:3, pov:'₹7,36,000', grn:'₹7,36,000', inv:'₹7,36,000', paid:'₹6,99,800',out:'₹36,200',  outc:'var(--odoo-red)',   ot:'100%'},
  {vendor:'Aruna Industries',       pos:4, pov:'₹3,88,000', grn:'₹2,60,500', inv:'₹2,60,500', paid:'₹2,60,500',out:'₹0',       outc:'var(--odoo-green)', ot:'75%'},
  {vendor:'KG Denim Ltd.',          pos:2, pov:'₹1,89,000', grn:'₹1,21,000', inv:'₹0',        paid:'₹0',       out:'₹1,21,000',outc:'var(--odoo-gray)',  ot:'50%'},
]

export default function POReport() {
  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Purchase Register <small>ME2N · Purchase Analytics</small></div>
        <div className="lv-acts">
          <button className="btn btn-s sd-bsm">⬇️ Export Excel</button>
          <button className="btn btn-s sd-bsm">🖨️ Print Report</button>
        </div>
      </div>
      <div className="mm-filt">
        <select className="mm-fsel"><option>Feb 2025</option><option>Jan 2025</option><option>Dec 2024</option></select>
        <select className="mm-fsel"><option>All Vendors</option><option>Lakshmi Textile Mills</option><option>Coimbatore Spares Co.</option></select>
        <select className="mm-fsel"><option>All Categories</option><option>Raw Material</option><option>Spares</option></select>
        <button className="btn btn-p sd-bsm">🔍 Generate Report</button>
      </div>

      <div className="mm-kpi-grid" style={{marginBottom:'14px'}}>
        {[
          {cls:'pur',ic:'📋',lb:'Total POs',       val:'18',     sub:'Feb 2025'},
          {cls:'orn',ic:'💰',lb:'PO Value',         val:'₹28.4L', sub:'Gross purchase value'},
          {cls:'grn',ic:'📦',lb:'GRN Done',         val:'₹21.6L', sub:'76% of PO value received'},
          {cls:'blu',ic:'🧾',lb:'Invoiced',          val:'₹18.2L', sub:'64% invoiced'},
        ].map(k => (
          <div key={k.lb} className={`mm-kpi ${k.cls}`}>
            <div className="mm-kpi-ic">{k.ic}</div>
            <div className="mm-kpi-lb">{k.lb}</div>
            <div className="mm-kpi-val">{k.val}</div>
            <div className="mm-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <table className="mm-tbl">
        <thead><tr><th>Vendor</th><th>No. of POs</th><th>PO Value</th><th>GRN Value</th><th>Invoiced</th><th>Paid</th><th>Outstanding</th><th>On-time %</th></tr></thead>
        <tbody>
          {ROWS.map(r => (
            <tr key={r.vendor}>
              <td><strong>{r.vendor}</strong></td>
              <td style={{textAlign:'center'}}>{r.pos}</td>
              <td>{r.pov}</td><td>{r.grn}</td><td>{r.inv}</td><td>{r.paid}</td>
              <td><strong style={{color:r.outc}}>{r.out}</strong></td>
              <td style={{fontWeight:'700',color: parseInt(r.ot)>=90?'var(--odoo-green)':parseInt(r.ot)>=75?'var(--odoo-orange)':'var(--odoo-red)'}}>{r.ot}</td>
            </tr>
          ))}
          <tr style={{background:'#F8F9FA',fontWeight:'700'}}>
            <td>TOTAL</td><td style={{textAlign:'center'}}>18</td>
            <td>₹28,40,000</td><td>₹24,60,500</td><td>₹23,39,500</td><td>₹20,72,800</td>
            <td><strong style={{color:'var(--odoo-red)'}}>₹3,87,700</strong></td><td>80%</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
