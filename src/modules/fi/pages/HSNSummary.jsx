import React from 'react'
const HSN_DATA = [
  {hsn:'7210',desc:'Flat-rolled products of iron / steel',  uom:'KGS', qty:12500, val:2187500,  cgst:196875, sgst:196875, igst:0,      total:393750},
  {hsn:'8421',desc:'Centrifuges / filtering machinery',     uom:'NOS', qty:8,     val:560000,   cgst:50400,  sgst:50400,  igst:0,      total:100800},
  {hsn:'3208',desc:'Paints / varnishes (powder coating)',   uom:'KGS', qty:2200,  val:1540000,  cgst:0,      sgst:0,      igst:277200, total:277200},
  {hsn:'8484',desc:'Gaskets and similar joints',            uom:'NOS', qty:4500,  val:225000,   cgst:20250,  sgst:20250,  igst:0,      total:40500},
  {hsn:'9032',desc:'Automatic regulating instruments',      uom:'NOS', qty:12,    val:96000,    cgst:8640,   sgst:8640,   igst:0,      total:17280},
  {hsn:'9403',desc:'Furniture (office)',                    uom:'NOS', qty:5,     val:75000,    cgst:6750,   sgst:6750,   igst:0,      total:13500},
]
export default function HSNSummary() {
  const totVal  = HSN_DATA.reduce((s,h)=>s+h.val,0)
  const totTax  = HSN_DATA.reduce((s,h)=>s+h.total,0)
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">HSN / SAC Summary <small>Mandatory in GSTR-1 from FY 2022-23 · 4-digit HSN for turnover &gt; ₹5Cr</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>Mar 2026</option><option>Feb 2026</option></select>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm">Push to GSTR-1</button>
        </div>
      </div>
      <table className="fi-data-table">
        <thead><tr><th>HSN Code</th><th>Description</th><th>UOM</th><th>Qty</th><th>Taxable Value</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total Tax</th></tr></thead>
        <tbody>
          {HSN_DATA.map(h=>(
            <tr key={h.hsn}>
              <td><strong style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)'}}>{h.hsn}</strong></td>
              <td style={{fontSize:12}}>{h.desc}</td>
              <td>{h.uom}</td>
              <td style={{fontFamily:'DM Mono,monospace'}}>{h.qty.toLocaleString('en-IN')}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontWeight:600}}>₹{h.val.toLocaleString('en-IN')}</td>
              <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>{h.cgst>0?`₹${h.cgst.toLocaleString('en-IN')}`:'—'}</td>
              <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>{h.sgst>0?`₹${h.sgst.toLocaleString('en-IN')}`:'—'}</td>
              <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-blue)'}}>{h.igst>0?`₹${h.igst.toLocaleString('en-IN')}`:'—'}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-dark)'}}>₹{h.total.toLocaleString('en-IN')}</td>
            </tr>
          ))}
          <tr style={{background:'#EDE0EA',fontWeight:700}}>
            <td colSpan={4} style={{fontFamily:'Syne,sans-serif'}}>TOTAL</td>
            <td style={{fontFamily:'DM Mono,monospace'}}>₹{totVal.toLocaleString('en-IN')}</td>
            <td colSpan={3}></td>
            <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)',fontSize:14}}>₹{totTax.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
