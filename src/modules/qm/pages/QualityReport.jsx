import React, { useState } from 'react'

const MONTHLY_DATA = [
  {prod:'Ring Yarn (30s)',lots:18,qty:7200,pass:7130,fail:70,yield:98.5,ncrs:1,certs:18},
  {prod:'Ring Yarn (40s)',lots:12,qty:4800,pass:4610,fail:190,yield:95.8,ncrs:2,certs:12},
  {prod:'OE Yarn (12s)', lots:8, qty:4704,pass:4640,fail:64, yield:98.6,ncrs:1,certs:8},
  {prod:'Compact Sliver',lots:10,qty:7920,pass:7920,fail:0,  yield:100, ncrs:0,certs:10},
]

const DEFECT_TYPES = [
  {type:'Twist Variation',cnt:28,pct:45,clr:'var(--odoo-red)'},
  {type:'Strength Below Spec',cnt:16,pct:26,clr:'var(--odoo-orange)'},
  {type:'Nep Count High',cnt:12,pct:19,clr:'var(--odoo-blue)'},
  {type:'Count Variation',cnt:6,pct:10,clr:'var(--odoo-purple)'},
]

export default function QualityReport() {
  const [month, setMonth] = useState('February 2025')

  const totals = MONTHLY_DATA.reduce((acc,r) => ({
    lots:acc.lots+r.lots, qty:acc.qty+r.qty,
    pass:acc.pass+r.pass, fail:acc.fail+r.fail,
    ncrs:acc.ncrs+r.ncrs, certs:acc.certs+r.certs
  }), {lots:0,qty:0,pass:0,fail:0,ncrs:0,certs:0})
  const avgYield = (totals.pass/totals.qty*100).toFixed(1)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Quality Report <small>{month}</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" onChange={e=>setMonth(e.target.value)}>
            <option>February 2025</option><option>January 2025</option><option>March 2025</option>
          </select>
          <button className="btn btn-s sd-bsm">Export PDF</button>
        </div>
      </div>

      <div className="qm-kpi-grid">
        {[{cls:'green', ic:'🔬',l:'Avg Yield Rate',  v:`${avgYield}%`, s:`${totals.lots} lots · ${(totals.qty/1000).toFixed(1)} T inspected`},
          {cls:'red',   ic:'❌',l:'Total Rejections', v:`${totals.fail} Kg`,s:`${(totals.fail/totals.qty*100).toFixed(2)}% rejection rate`},
          {cls:'orange',ic:'📋',l:'NCRs Raised',      v:totals.ncrs,  s:'4 closed · 4 open'},
          {cls:'blue',  ic:'🏅',l:'Certs Issued',     v:totals.certs, s:'COC + Test Reports'},
        ].map(k=>(
          <div key={k.l} className={`qm-kpi-card ${k.cls}`}>
            <div className="qm-kpi-icon">{k.ic}</div>
            <div className="qm-kpi-label">{k.l}</div>
            <div className="qm-kpi-value">{k.v}</div>
            <div className="qm-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="fi-panel-grid">
        {/* Yield by product */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>Yield by Product</h3></div>
          <div className="fi-panel-body">
            {MONTHLY_DATA.map(r=>(
              <div key={r.prod} style={{marginBottom:'14px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                  <strong>{r.prod}</strong>
                  <span style={{fontWeight:'700',color:r.yield>=98?'var(--odoo-green)':r.yield>=95?'var(--odoo-orange)':'var(--odoo-red)'}}>{r.yield}%</span>
                </div>
                <div className="yield-bar">
                  <div className="yield-fill" style={{width:`${r.yield}%`,background:r.yield>=98?'var(--odoo-green)':r.yield>=95?'var(--odoo-orange)':'var(--odoo-red)'}}></div>
                </div>
                <div style={{fontSize:'11px',color:'var(--odoo-gray)',marginTop:'2px'}}>{r.lots} lots · {r.qty} Kg inspected</div>
              </div>
            ))}
          </div>
        </div>

        {/* Defect Pareto */}
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>Defect Pareto Analysis</h3></div>
          <div className="fi-panel-body">
            {DEFECT_TYPES.map(d=>(
              <div key={d.type} style={{marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                  <span>{d.type}</span>
                  <strong style={{color:d.clr}}>{d.cnt} Kg ({d.pct}%)</strong>
                </div>
                <div className="yield-bar">
                  <div className="yield-fill" style={{width:`${d.pct}%`,background:d.clr}}></div>
                </div>
              </div>
            ))}
            <div className="pp-alert info" style={{marginTop:'12px',padding:'8px 12px',fontSize:'11px'}}>
              💡 Top 2 defects account for 71% of rejections → focus CAPA on twist variation & strength control
            </div>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">Product-wise Quality Summary — {month}</div>
        <div style={{padding:'0'}}>
          <table className="fi-data-table">
            <thead><tr>
              <th>Product</th><th>Lots</th><th>Total Qty (Kg)</th>
              <th>Pass</th><th>Fail</th><th>Yield %</th><th>NCRs</th><th>Certificates</th>
            </tr></thead>
            <tbody>
              {MONTHLY_DATA.map(r=>(
                <tr key={r.prod}>
                  <td><strong>{r.prod}</strong></td>
                  <td style={{textAlign:'center'}}>{r.lots}</td>
                  <td>{r.qty.toLocaleString()}</td>
                  <td style={{color:'var(--odoo-green)',fontWeight:'600'}}>{r.pass.toLocaleString()}</td>
                  <td style={{color:r.fail>0?'var(--odoo-red)':'var(--odoo-gray)',fontWeight:r.fail>0?'700':'400'}}>{r.fail||'—'}</td>
                  <td>
                    <span style={{fontWeight:'700',color:r.yield>=98?'var(--odoo-green)':r.yield>=95?'var(--odoo-orange)':'var(--odoo-red)'}}>{r.yield}%</span>
                  </td>
                  <td style={{color:r.ncrs>0?'var(--odoo-red)':'var(--odoo-green)',fontWeight:'700',textAlign:'center'}}>{r.ncrs||'—'}</td>
                  <td style={{textAlign:'center'}}>{r.certs}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:'#F8F9FA',fontWeight:'700'}}>
                <td>Total</td>
                <td style={{textAlign:'center'}}>{totals.lots}</td>
                <td>{totals.qty.toLocaleString()}</td>
                <td style={{color:'var(--odoo-green)'}}>{totals.pass.toLocaleString()}</td>
                <td style={{color:'var(--odoo-red)'}}>{totals.fail}</td>
                <td style={{color:'var(--odoo-green)'}}>{avgYield}% avg</td>
                <td style={{color:'var(--odoo-orange)',textAlign:'center'}}>{totals.ncrs}</td>
                <td style={{textAlign:'center'}}>{totals.certs}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
