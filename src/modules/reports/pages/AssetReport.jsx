import React, { useState } from 'react'

const ASSET_SUMMARY = [
  { cat:'Plant & Machinery',    count:28, gross:32000000, depr:12800000, net:19200000, method:'SLM 10%', ytdDepr:3200000 },
  { cat:'Electrical Equipment', count:42, gross:4800000,  depr:1920000,  net:2880000,  method:'SLM 15%', ytdDepr:720000  },
  { cat:'IT Equipment',         count:38, gross:1200000,  depr:800000,   net:400000,   method:'WDV 33%', ytdDepr:264000  },
  { cat:'Furniture & Fixtures', count:34, gross:600000,   depr:120000,   net:480000,   method:'SLM 10%', ytdDepr:60000   },
  { cat:'Vehicles',             count:5,  gross:3500000,  depr:1050000,  net:2450000,  method:'WDV 15%', ytdDepr:367500  },
  { cat:'Office Equipment',     count:22, gross:480000,   depr:192000,   net:288000,   method:'SLM 20%', ytdDepr:96000   },
]

const DEPR_MONTHLY = [
  { m:'Oct', depr:380000 }, { m:'Nov', depr:382000 }, { m:'Dec', depr:380000 },
  { m:'Jan', depr:384000 }, { m:'Feb', depr:382000 }, { m:'Mar', depr:385000 },
]

const fmtL = n => '₹' + (n/100000).toFixed(1) + 'L'
const fmtCr = n => '₹' + (n/10000000).toFixed(2) + 'Cr'

export default function AssetReport() {
  const [view, setView] = useState('summary')
  const totalGross = ASSET_SUMMARY.reduce((s, a) => s + a.gross, 0)
  const totalDepr  = ASSET_SUMMARY.reduce((s, a) => s + a.depr, 0)
  const totalNet   = ASSET_SUMMARY.reduce((s, a) => s + a.net, 0)
  const totalYTD   = ASSET_SUMMARY.reduce((s, a) => s + a.ytdDepr, 0)
  const totalCount = ASSET_SUMMARY.reduce((s, a) => s + a.count, 0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Asset Report <small>AM Module · Fixed Asset Analytics</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>FY 2025-26</option></select>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:16 }}>
        {[
          { cls:'purple', l:'Total Assets',      v:totalCount,     s:'All categories'         },
          { cls:'blue',   l:'Gross Block',        v:fmtCr(totalGross), s:'Purchase value'     },
          { cls:'green',  l:'Net Block',          v:fmtCr(totalNet),   s:'After depreciation' },
          { cls:'orange', l:'YTD Depreciation',  v:fmtL(totalYTD),    s:'FY 2025-26'         },
        ].map(k => (
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[['summary','📋 Category Summary'],['depreciation','📉 Depreciation Trend']].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)}
            style={{ padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:600,
              cursor:'pointer', border:'1px solid var(--odoo-border)',
              background: view===k ? 'var(--odoo-purple)' : '#fff',
              color: view===k ? '#fff' : 'var(--odoo-gray)' }}>
            {l}
          </button>
        ))}
      </div>

      {view === 'summary' && (
        <table className="fi-data-table">
          <thead><tr><th>Category</th><th>Count</th><th>Gross Block</th><th>Acc. Depr.</th><th>Net Block</th><th>Method</th><th>YTD Depr.</th><th>Net %</th></tr></thead>
          <tbody>
            {ASSET_SUMMARY.map((a, i) => {
              const netPct = ((a.net / a.gross) * 100).toFixed(0)
              return (
                <tr key={a.cat} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                  <td style={{ fontWeight:700 }}>{a.cat}</td>
                  <td style={{ textAlign:'center' }}>{a.count}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700 }}>{fmtL(a.gross)}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', color:'var(--odoo-red)' }}>{fmtL(a.depr)}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-green)' }}>{fmtL(a.net)}</td>
                  <td style={{ fontSize:11, color:'var(--odoo-gray)' }}>{a.method}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', color:'var(--odoo-orange)' }}>{fmtL(a.ytdDepr)}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:60, height:5, background:'var(--odoo-border)', borderRadius:3 }}>
                        <div style={{ height:'100%', borderRadius:3,
                          background: parseInt(netPct) > 70 ? 'var(--odoo-green)' : parseInt(netPct) > 40 ? 'var(--odoo-orange)' : 'var(--odoo-red)',
                          width: netPct + '%' }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:600 }}>{netPct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
            <tr style={{ background:'var(--odoo-purple)', color:'#fff', fontWeight:700 }}>
              <td style={{ padding:'10px 12px', fontFamily:'Syne,sans-serif' }}>TOTAL</td>
              <td style={{ padding:'10px 12px', textAlign:'center' }}>{totalCount}</td>
              <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace', fontSize:13 }}>{fmtCr(totalGross)}</td>
              <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace' }}>{fmtCr(totalDepr)}</td>
              <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace', fontSize:13 }}>{fmtCr(totalNet)}</td>
              <td colSpan={2} />
              <td style={{ padding:'10px 12px' }}>{((totalNet/totalGross)*100).toFixed(0)}%</td>
            </tr>
          </tbody>
        </table>
      )}

      {view === 'depreciation' && (
        <div>
          <div style={{ background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
            padding:18, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
            <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:14 }}>
              📉 Monthly Depreciation Charge
            </h4>
            <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:110 }}>
              {DEPR_MONTHLY.map((d, i) => {
                const max = Math.max(...DEPR_MONTHLY.map(x => x.depr))
                const h = (d.depr / max) * 100
                const isLast = i === DEPR_MONTHLY.length - 1
                return (
                  <div key={d.m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                    <span style={{ fontSize:9, color: isLast ? 'var(--odoo-purple)' : 'var(--odoo-gray)', fontWeight: isLast ? 700 : 400 }}>
                      {fmtL(d.depr)}
                    </span>
                    <div style={{ width:'100%', height: h+'%', minHeight:3, borderRadius:'4px 4px 0 0',
                      background: isLast ? 'var(--odoo-purple)' : '#C4A4BB' }} />
                    <span style={{ fontSize:9, color: isLast ? 'var(--odoo-purple)' : 'var(--odoo-gray)', fontWeight: isLast ? 700 : 400 }}>{d.m}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="fi-alert info">
            ℹ️ Total YTD Depreciation posted to GL: <strong>{fmtL(totalYTD)}</strong> · Dr. Depreciation Expense / Cr. Accumulated Depreciation
          </div>
        </div>
      )}
    </div>
  )
}
