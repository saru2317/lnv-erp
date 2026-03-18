import React from 'react'
const DEPR = [
  { code:'FA-001', name:'Ring Frame #1', method:'SLM 10%', gross:4200000, accBefore:2100000, thisMonth:35000, accAfter:2135000, net:2065000 },
  { code:'FA-002', name:'OE Spinner',    method:'SLM 10%', gross:2800000, accBefore:1120000, thisMonth:23333, accAfter:1143333, net:1656667 },
  { code:'FA-003', name:'Dell Server',   method:'WDV 33%', gross:180000,  accBefore:120000,  thisMonth:1650,  accAfter:121650,  net:58350 },
  { code:'FA-004', name:'Honda Activa',  method:'WDV 15%', gross:95000,   accBefore:38000,   thisMonth:713,   accAfter:38713,   net:56287 },
  { code:'FA-005', name:'Conf Room AC',  method:'SLM 15%', gross:75000,   accBefore:11250,   thisMonth:938,   accAfter:12188,   net:62813 },
  { code:'FA-006', name:'Weighbridge',   method:'SLM 10%', gross:1200000, accBefore:720000,  thisMonth:10000, accAfter:730000,  net:470000 },
  { code:'FA-007', name:'Dell Laptop',   method:'WDV 33%', gross:85000,   accBefore:28050,   thisMonth:1867,  accAfter:29917,   net:55083 },
]
const fmt = n => '₹' + n.toLocaleString('en-IN')
export default function Depreciation() {
  const totalDepr = DEPR.reduce((s,d)=>s+d.thisMonth,0)
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Depreciation Run <small>March 2026</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Download</button>
          <button className="btn btn-p sd-bsm">Post to GL (FI)</button>
        </div>
      </div>
      <div className="fi-alert info" style={{marginBottom:14}}>ℹ️ Depreciation computed for all active assets. Click "Post to GL" to create journal entry in FI module (Dr. Depreciation Expense / Cr. Accumulated Depreciation).</div>
      <table className="fi-data-table">
        <thead><tr><th>Asset</th><th>Method</th><th>Gross Value</th><th>Acc. Depr. (Before)</th><th>This Month Depr.</th><th>Acc. Depr. (After)</th><th>Net Value</th></tr></thead>
        <tbody>
          {DEPR.map(d=>(<tr key={d.code}>
            <td><div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--odoo-purple)',fontWeight:600}}>{d.code}</div><div style={{fontSize:11}}>{d.name}</div></td>
            <td style={{fontSize:11,color:'var(--odoo-gray)'}}>{d.method}</td>
            <td style={{fontFamily:'DM Mono,monospace',textAlign:'right'}}>{fmt(d.gross)}</td>
            <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',color:'var(--odoo-orange)'}}>{fmt(d.accBefore)}</td>
            <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',fontWeight:700,color:'var(--odoo-red)'}}>{fmt(d.thisMonth)}</td>
            <td style={{fontFamily:'DM Mono,monospace',textAlign:'right'}}>{fmt(d.accAfter)}</td>
            <td style={{fontFamily:'DM Mono,monospace',textAlign:'right',fontWeight:700,color:'var(--odoo-green)'}}>{fmt(d.net)}</td>
          </tr>))}
          <tr style={{background:'#EDE0EA',fontWeight:700}}>
            <td colSpan={4} style={{padding:'10px 12px',fontFamily:'Syne,sans-serif',fontSize:12}}>TOTAL DEPRECIATION — March 2026</td>
            <td style={{fontFamily:'DM Mono,monospace',fontSize:14,padding:'10px 12px',color:'var(--odoo-red)',textAlign:'right'}}>{fmt(totalDepr)}</td>
            <td colSpan={2}></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
