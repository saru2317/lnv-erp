import React, { useState } from 'react'

const MONTHLY = [
  { m:'Oct', inspected:38400, passed:37920, rejected:480, ppm:12500, rework:312, scrapped:168, copq:184000 },
  { m:'Nov', inspected:44200, passed:43680, rejected:520, ppm:11765, rework:340, scrapped:180, copq:198000 },
  { m:'Dec', inspected:35600, passed:35120, rejected:480, ppm:13483, rework:310, scrapped:170, copq:178000 },
  { m:'Jan', inspected:48000, passed:47440, rejected:560, ppm:11667, rework:370, scrapped:190, copq:214000 },
  { m:'Feb', inspected:44800, passed:44280, rejected:520, ppm:11607, rework:340, scrapped:180, copq:198000 },
  { m:'Mar', inspected:51200, passed:50620, rejected:580, ppm:11328, rework:380, scrapped:200, copq:222000 },
]

const DEFECT_TYPES = [
  { defect:'Coating Thickness <60μ',    count:124, pct:21.4, trend:'down', module:'PP' },
  { defect:'Surface Defects (pinholes)',count:98,  pct:16.9, trend:'down', module:'PP' },
  { defect:'Adhesion Failure',          count:87,  pct:15.0, trend:'stable',module:'PP' },
  { defect:'Colour Mismatch',           count:62,  pct:10.7, trend:'down', module:'PP' },
  { defect:'Substrate Contamination',   count:74,  pct:12.8, trend:'up',   module:'RM' },
  { defect:'Curing Defects',            count:58,  pct:10.0, trend:'down', module:'PP' },
  { defect:'Dimensional Non-conformity',count:44,  pct:7.6,  trend:'stable',module:'PP' },
  { defect:'Customer Returns',          count:32,  pct:5.5,  trend:'down', module:'SD' },
]

const NCR_STATUS = [
  { ncrNo:'NCR-2026-089', date:'17 Mar', product:'Brackets — Type A', defect:'Pinholes',       severity:'Minor', status:'Closed',   daysOpen:3  },
  { ncrNo:'NCR-2026-088', date:'15 Mar', product:'Flanges 50mm',      defect:'Adhesion',       severity:'Major', status:'Open',     daysOpen:5  },
  { ncrNo:'NCR-2026-087', date:'12 Mar', product:'Coating Batch',     defect:'Thickness',      severity:'Minor', status:'Closed',   daysOpen:2  },
  { ncrNo:'NCR-2026-086', date:'10 Mar', product:'MS Brackets',       defect:'Contamination',  severity:'Major', status:'CAPA Due',  daysOpen:9  },
  { ncrNo:'NCR-2026-085', date:'05 Mar', product:'OE Parts',          defect:'Colour Mismatch',severity:'Minor', status:'Closed',   daysOpen:4  },
]

const fmtL = n => '₹' + (n / 100000).toFixed(1) + 'L'
const maxInsp = Math.max(...MONTHLY.map(m => m.inspected))

export default function QualityReport() {
  const [view, setView] = useState('monthly')
  const last = MONTHLY[MONTHLY.length - 1]
  const passRate = ((last.passed / last.inspected) * 100).toFixed(2)
  const totalDefects = DEFECT_TYPES.reduce((s, d) => s + d.count, 0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Quality Report <small>QM Module · Inspection Analytics</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select"><option>FY 2025-26</option><option>Q4 FY26</option></select>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{ gridTemplateColumns:'repeat(5,1fr)', marginBottom:16 }}>
        {[
          { cls:'purple', l:'Inspected MTD',  v:last.inspected.toLocaleString('en-IN'), s:'Mar 2026' },
          { cls:'green',  l:'Pass Rate',       v:passRate+'%', s:'Quality level'           },
          { cls:'red',    l:'Rejections',      v:last.rejected, s:'This month'             },
          { cls:'orange', l:'PPM',             v:last.ppm.toLocaleString('en-IN'), s:'Defects per million' },
          { cls:'blue',   l:'COPQ',            v:fmtL(last.copq), s:'Cost of poor quality' },
        ].map(k => (
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[['monthly','📊 Monthly Trend'],['defects','🔴 Defect Analysis'],['ncr','📋 NCR Register']].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)}
            style={{ padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:600,
              cursor:'pointer', border:'1px solid var(--odoo-border)',
              background: view===k ? 'var(--odoo-purple)' : '#fff',
              color: view===k ? '#fff' : 'var(--odoo-gray)' }}>
            {l}
          </button>
        ))}
      </div>

      {view === 'monthly' && (
        <div>
          <div style={{ background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
            padding:18, marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
            <h4 style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, marginBottom:14 }}>
              📈 Rejection Trend (PPM)
            </h4>
            <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:110 }}>
              {MONTHLY.map((m, i) => {
                const h = (m.ppm / Math.max(...MONTHLY.map(x=>x.ppm))) * 100
                const isLast = i === MONTHLY.length - 1
                return (
                  <div key={m.m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                    <span style={{ fontSize:9, fontWeight:700, color: isLast ? 'var(--odoo-red)' : 'var(--odoo-gray)' }}>
                      {m.ppm.toLocaleString('en-IN')}
                    </span>
                    <div style={{ width:'100%', height:h+'%', minHeight:3, borderRadius:'4px 4px 0 0',
                      background: isLast ? 'var(--odoo-purple)' : '#C4A4BB' }} />
                    <span style={{ fontSize:9, color: isLast ? 'var(--odoo-purple)' : 'var(--odoo-gray)',
                      fontWeight: isLast ? 700 : 400 }}>{m.m}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <table className="fi-data-table">
            <thead>
              <tr><th>Month</th><th>Inspected</th><th>Passed</th><th>Rejected</th>
                <th>Pass Rate</th><th>Rework</th><th>Scrapped</th><th>PPM</th><th>COPQ</th></tr>
            </thead>
            <tbody>
              {MONTHLY.map((m, i) => {
                const pr = ((m.passed / m.inspected) * 100).toFixed(2)
                return (
                  <tr key={m.m} style={{ background: i === MONTHLY.length-1 ? '#EDE0EA' : '', fontWeight: i === MONTHLY.length-1 ? 700 : 400 }}>
                    <td style={{ fontWeight:600 }}>{m.m}</td>
                    <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace' }}>{m.inspected.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace', color:'var(--odoo-green)', fontWeight:600 }}>{m.passed.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace', color:'var(--odoo-red)', fontWeight:600 }}>{m.rejected}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ flex:1, height:5, background:'var(--odoo-border)', borderRadius:3 }}>
                          <div style={{ height:'100%', borderRadius:3, background:'var(--odoo-green)', width: pr+'%' }} />
                        </div>
                        <span style={{ fontSize:11, fontWeight:600 }}>{pr}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign:'center' }}>{m.rework}</td>
                    <td style={{ textAlign:'center', color:'var(--odoo-red)' }}>{m.scrapped}</td>
                    <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace', color:'var(--odoo-orange)', fontWeight:600 }}>{m.ppm.toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily:'DM Mono,monospace', color:'var(--odoo-red)' }}>{fmtL(m.copq)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'defects' && (
        <table className="fi-data-table">
          <thead><tr><th>Defect Type</th><th>Count</th><th>% of Total</th><th>Pareto Bar</th><th>Trend</th><th>Source</th></tr></thead>
          <tbody>
            {DEFECT_TYPES.map(d => (
              <tr key={d.defect}>
                <td style={{ fontWeight:700 }}>{d.defect}</td>
                <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-red)' }}>{d.count}</td>
                <td style={{ textAlign:'center', fontWeight:600 }}>{d.pct}%</td>
                <td style={{ minWidth:120 }}>
                  <div style={{ height:8, background:'var(--odoo-border)', borderRadius:4 }}>
                    <div style={{ height:'100%', borderRadius:4, background:'var(--odoo-red)', width: d.pct + '%' }} />
                  </div>
                </td>
                <td style={{ textAlign:'center' }}>
                  <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600,
                    background: d.trend==='down'?'#D4EDDA':d.trend==='up'?'#F8D7DA':'#FFF3CD',
                    color: d.trend==='down'?'#155724':d.trend==='up'?'#721C24':'#856404' }}>
                    {d.trend==='down'?'↓ Improving':d.trend==='up'?'↑ Worsening':'→ Stable'}
                  </span>
                </td>
                <td style={{ fontSize:11 }}>{d.module}</td>
              </tr>
            ))}
            <tr style={{ background:'var(--odoo-purple)', color:'#fff', fontWeight:700 }}>
              <td style={{ padding:'10px 12px', fontFamily:'Syne,sans-serif' }}>TOTAL</td>
              <td style={{ padding:'10px 12px', textAlign:'center', fontFamily:'DM Mono,monospace', fontSize:13 }}>{totalDefects}</td>
              <td colSpan={4} />
            </tr>
          </tbody>
        </table>
      )}

      {view === 'ncr' && (
        <table className="fi-data-table">
          <thead><tr><th>NCR No.</th><th>Date</th><th>Product</th><th>Defect</th><th>Severity</th><th>Days Open</th><th>Status</th></tr></thead>
          <tbody>
            {NCR_STATUS.map(n => (
              <tr key={n.ncrNo}>
                <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:'var(--odoo-purple)', fontSize:12 }}>{n.ncrNo}</td>
                <td style={{ fontSize:11 }}>{n.date}</td>
                <td style={{ fontWeight:600, fontSize:12 }}>{n.product}</td>
                <td style={{ fontSize:11 }}>{n.defect}</td>
                <td>
                  <span style={{ padding:'3px 8px', borderRadius:10, fontSize:11, fontWeight:600,
                    background: n.severity==='Major'?'#F8D7DA':'#FFF3CD',
                    color: n.severity==='Major'?'#721C24':'#856404' }}>
                    {n.severity}
                  </span>
                </td>
                <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace',
                  color: n.daysOpen > 7 ? 'var(--odoo-red)' : 'var(--odoo-gray)', fontWeight: n.daysOpen > 7 ? 700 : 400 }}>
                  {n.daysOpen}d
                </td>
                <td>
                  <span style={{ padding:'3px 8px', borderRadius:10, fontSize:11, fontWeight:600,
                    background: n.status==='Closed'?'#D4EDDA':n.status==='Open'?'#F8D7DA':'#FFF3CD',
                    color: n.status==='Closed'?'#155724':n.status==='Open'?'#721C24':'#856404' }}>
                    {n.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
