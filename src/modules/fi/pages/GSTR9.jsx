import React from 'react'

export default function GSTR9() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">GSTR-9 Annual Return <small>FY 2025–26 · Due: 31 Dec 2026</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">⬇️ Download</button>
          <button className="btn btn-p sd-bsm">📤 File on Portal</button>
        </div>
      </div>
      <div className="fi-alert info" style={{marginBottom:16}}>
        ℹ️ GSTR-9 is the annual summary of all monthly/quarterly returns filed during the year. Reconcile any differences before filing.
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {/* Outward Supplies */}
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">📤 Outward Supplies (Sales)</div>
          <table className="fi-data-table" style={{fontSize:12}}>
            <thead><tr><th>Nature</th><th>Taxable Value</th><th>IGST</th><th>CGST</th><th>SGST</th></tr></thead>
            <tbody>
              {[
                ['Taxable (B2B)',         '₹1,82,45,000','₹0',      '₹16,42,050','₹16,42,050'],
                ['Taxable (B2C)',         '₹22,14,000', '₹0',      '₹1,99,260', '₹1,99,260'],
                ['Zero-Rated Exports',    '₹8,50,000',  '₹0',      '₹0',        '₹0'],
                ['Nil Rated / Exempt',    '₹3,20,000',  '₹0',      '₹0',        '₹0'],
                ['RCM (received by us)', '₹3,43,000',  '₹61,740', '₹0',        '₹0'],
              ].map(([n,...v])=>(
                <tr key={n}><td style={{fontWeight:600}}>{n}</td>{v.map((x,i)=><td key={i} style={{fontFamily:'DM Mono,monospace'}}>{x}</td>)}</tr>
              ))}
              <tr style={{background:'#EDE0EA',fontWeight:700}}>
                <td>Total</td><td style={{fontFamily:'DM Mono,monospace'}}>₹2,19,72,000</td>
                <td style={{fontFamily:'DM Mono,monospace'}}>₹61,740</td>
                <td style={{fontFamily:'DM Mono,monospace'}}>₹18,41,310</td>
                <td style={{fontFamily:'DM Mono,monospace'}}>₹18,41,310</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* ITC Summary */}
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">📥 ITC Summary (Annual)</div>
          <table className="fi-data-table" style={{fontSize:12}}>
            <thead><tr><th>Nature</th><th>IGST</th><th>CGST</th><th>SGST</th></tr></thead>
          <tbody>
            {[
              ['ITC on Inputs',       '₹0',     '₹8,14,500','₹8,14,500'],
              ['ITC on Capital Goods','₹0',     '₹52,200',  '₹52,200'],
              ['ITC on Services',     '₹61,740','₹1,20,000','₹1,20,000'],
              ['Less: Blocked (17(5)','₹0',     '(₹92,400)','(₹92,400)'],
              ['Less: Reversed',      '₹0',     '(₹24,000)','(₹24,000)'],
            ].map(([n,...v])=>(
              <tr key={n}><td style={{fontWeight:600}}>{n}</td>{v.map((x,i)=><td key={i} style={{fontFamily:'DM Mono,monospace',color:x.startsWith('(')? 'var(--odoo-red)':'var(--odoo-green)'}}>{x}</td>)}</tr>
            ))}
            <tr style={{background:'#EDE0EA',fontWeight:700}}>
              <td>Net ITC</td>
              <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>₹61,740</td>
              <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>₹8,70,300</td>
              <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>₹8,70,300</td>
            </tr>
          </tbody>
          </table>
        </div>
        {/* Tax payable */}
        <div className="fi-form-sec" style={{gridColumn:'1/-1'}}>
          <div className="fi-form-sec-hdr">💳 Net Tax Payable (Annual)</div>
          <table className="fi-data-table" style={{fontSize:12}}>
            <thead><tr><th>Tax Head</th><th>Output Tax</th><th>ITC Available</th><th>Net Payable</th><th>Paid via Cash</th><th>Difference</th></tr></thead>
            <tbody>
              {[
                ['CGST','₹18,41,310','₹8,70,300','₹9,71,010','₹9,71,010','₹0'],
                ['SGST','₹18,41,310','₹8,70,300','₹9,71,010','₹9,71,010','₹0'],
                ['IGST','₹61,740',   '₹61,740',  '₹0',       '₹0',       '₹0'],
                ['Cess', '₹0',       '₹0',        '₹0',       '₹0',       '₹0'],
              ].map(([n,...v])=>(
                <tr key={n}><td style={{fontWeight:700}}>{n}</td>{v.map((x,i)=><td key={i} style={{fontFamily:'DM Mono,monospace'}}>{x}</td>)}</tr>
              ))}
              <tr style={{background:'#EDE0EA',fontWeight:700}}>
                <td>TOTAL</td><td style={{fontFamily:'DM Mono,monospace'}}>₹37,44,360</td>
                <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)'}}>₹18,02,340</td>
                <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)',fontSize:14}}>₹19,42,020</td>
                <td style={{fontFamily:'DM Mono,monospace'}}>₹19,42,020</td>
                <td style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-green)',fontWeight:700}}>₹0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
