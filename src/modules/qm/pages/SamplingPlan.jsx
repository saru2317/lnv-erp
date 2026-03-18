import React from 'react'

const AQL_TABLE = [
  {lotSize:'2–8',    code:'A',n:2, ac:0,re:1},
  {lotSize:'9–15',   code:'B',n:3, ac:0,re:1},
  {lotSize:'16–25',  code:'C',n:5, ac:0,re:1},
  {lotSize:'26–50',  code:'D',n:8, ac:0,re:1},
  {lotSize:'51–90',  code:'E',n:13,ac:1,re:2},
  {lotSize:'91–150', code:'F',n:20,ac:1,re:2},
  {lotSize:'151–280',code:'G',n:32,ac:2,re:3},
  {lotSize:'281–500',code:'H',n:50,ac:3,re:4},
  {lotSize:'501–1200',code:'J',n:80,ac:5,re:6},
]

export default function SamplingPlan() {
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Sampling Plans <small>AQL 1.5 — MIL-STD-1916 Level II</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">📋 Configure AQL</button>
        </div>
      </div>

      <div className="pp-alert info">💡 LNV uses <strong>AQL 1.5 Level II</strong> for finished goods inspection and <strong>AQL 2.5 Level II</strong> for incoming raw material inspection. Sample size is auto-calculated when creating inspection lots.</div>

      <div className="fi-panel-grid">
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>📊 AQL Sampling Table (Level II · AQL 1.5)</h3></div>
          <div style={{padding:'0'}}>
            <table className="fi-data-table" style={{margin:0}}>
              <thead><tr><th>Lot Size</th><th>Code</th><th>Sample Size (n)</th><th>Accept (Ac)</th><th>Reject (Re)</th></tr></thead>
              <tbody>
                {AQL_TABLE.map(r=>(
                  <tr key={r.code}>
                    <td>{r.lotSize}</td>
                    <td><strong style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)'}}>{r.code}</strong></td>
                    <td style={{fontWeight:'700',color:'var(--odoo-blue)'}}>{r.n}</td>
                    <td style={{fontWeight:'700',color:'var(--odoo-green)'}}>{r.ac}</td>
                    <td style={{fontWeight:'700',color:'var(--odoo-red)'}}>{r.re}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="fi-panel" style={{marginBottom:'14px'}}>
            <div className="fi-panel-hdr"><h3>⚙️ Active Sampling Rules</h3></div>
            <div className="fi-panel-body">
              {[['Finished Goods (FG)','AQL 1.5 Level II','Every production lot'],
                ['Incoming Raw Material','AQL 2.5 Level II','Each GRN lot'],
                ['Pre-shipment Inspection','AQL 1.0 Level II','Every export order'],
                ['In-process (Mid WO)','Fixed 5% sample','Every 4 hours'],
              ].map(([cat,aql,when])=>(
                <div key={cat} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--odoo-border)',fontSize:'12px'}}>
                  <div>
                    <div style={{fontWeight:'700'}}>{cat}</div>
                    <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>{when}</div>
                  </div>
                  <span style={{fontFamily:'DM Mono,monospace',fontSize:'11px',fontWeight:'700',color:'var(--odoo-blue)',
                    background:'#EBF5FB',padding:'2px 8px',borderRadius:'10px',alignSelf:'center'}}>{aql}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="fi-panel">
            <div className="fi-panel-hdr"><h3>🧮 Sample Size Calculator</h3></div>
            <div className="fi-panel-body">
              <div className="fi-form-grp" style={{marginBottom:'10px'}}>
                <label>Lot Size (Kg / Nos)</label>
                <input type="number" className="fi-form-ctrl" defaultValue="400" placeholder="Enter lot size"/>
              </div>
              <div className="fi-form-grp" style={{marginBottom:'10px'}}>
                <label>AQL Level</label>
                <select className="fi-form-ctrl"><option>AQL 1.5 Level II</option><option>AQL 2.5 Level II</option></select>
              </div>
              <div style={{background:'#EDE0EA',borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                <div style={{fontSize:'11px',color:'var(--odoo-purple)',fontWeight:'700',textTransform:'uppercase',marginBottom:'4px'}}>Recommended Sample Size</div>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:'28px',fontWeight:'800',color:'var(--odoo-purple)'}}>50 units</div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>Code H · Accept ≤3 · Reject ≥4</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
