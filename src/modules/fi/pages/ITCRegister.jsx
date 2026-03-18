import React from 'react'
const ROWS = [
  {date:'01 Feb',part:'Opening Balance b/f',cgst:'₹31,000',sgst:'₹31,000',igst:'₹0',tot:'₹62,000',sb:'badge-posted',sl:'B/F'},
  {date:'22 Feb',part:'ITC from Lakshmi Textile Mills',cgst:'₹10,576',sgst:'₹10,576',igst:'₹0',tot:'₹21,152',sb:'badge-posted',sl:'Availed'},
  {date:'20 Feb',part:'ITC from Coimbatore Spares Co.',cgst:'₹6,750',sgst:'₹6,750',igst:'₹0',tot:'₹13,500',sb:'badge-posted',sl:'Availed'},
  {date:'10 Feb',part:'ITC from Aruna Industries (Partial)',cgst:'₹3,699',sgst:'₹3,699',igst:'₹0',tot:'₹7,398',sb:'badge-partial',sl:'Partial'},
  {date:'28 Feb',part:'ITC Utilized against Output GST',cgst:'(₹81,000)',sgst:'(₹81,000)',igst:'₹0',tot:'(₹1,62,000)',sb:'badge-partial',sl:'Utilized',neg:true},
]
export default function ITCRegister() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">ITC Register <small>Input Tax Credit Ledger</small></div>
      </div>
      <div className="fi-kpi-grid">
        {[{cls:'green',l:'Opening ITC Balance',v:'₹62,000',s:'Brought forward'},
          {cls:'purple',l:'ITC Availed (MTD)',v:'₹42,050',s:'From purchases'},
          {cls:'orange',l:'ITC Utilized',v:'₹1,62,000',s:'Against output tax'},
          {cls:'blue',l:'Closing ITC Balance',v:'₹-57,950',s:'To be adjusted'},
        ].map(k=>(
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div><div className="fi-kpi-value">{k.v}</div><div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>
      <table className="fi-data-table">
        <thead><tr><th>Date</th><th>Particulars</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total ITC</th><th>Type</th></tr></thead>
        <tbody>
          {ROWS.map((r,i)=>(
            <tr key={i} style={r.neg?{color:'var(--odoo-red)'}:{}}>
              <td>{r.date}</td><td>{r.part}</td>
              <td className={r.neg?'dr':'cr'}>{r.cgst}</td>
              <td className={r.neg?'dr':'cr'}>{r.sgst}</td>
              <td>{r.igst}</td>
              <td className={r.neg?'dr':'cr'} style={{fontWeight:'700'}}>{r.tot}</td>
              <td><span className={`badge ${r.sb}`}>{r.sl}</span></td>
            </tr>
          ))}
          <tr style={{background:'#EDE0EA',fontWeight:'700'}}>
            <td colSpan={5} style={{padding:'10px 14px',fontFamily:'Syne,sans-serif'}}>Closing ITC Balance — 28 Feb 2025</td>
            <td className="cr" style={{fontFamily:'Syne,sans-serif',fontSize:'15px'}}>₹62,000</td>
            <td><span className="badge badge-filed">C/F</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
