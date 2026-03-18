import React, { useState, useMemo } from 'react'
import { MONTHS_FY, MONTH_FULL, KPI_MASTER_DEFAULT, ACTUALS_DEFAULT, SCORE } from './_kpiData'

const S = (cls) => SCORE.colorStyle(cls)

export default function KPIReport({ kpiMaster, actuals, fy = '2025-26' }) {
  const master   = kpiMaster  || KPI_MASTER_DEFAULT
  const acts     = actuals    || ACTUALS_DEFAULT
  const [filterRole, setFilterRole] = useState('all')

  // Active months (have data)
  const activeMths = useMemo(() =>
    MONTHS_FY.filter(m => Object.values(acts).some(a => a[m] != null)), [acts])

  // Compute report data
  const reportData = useMemo(() => {
    const majors = master.filter(k => k.cat === 'Major')
    const minors  = master.filter(k => k.cat === 'Minor')

    let totalWt = 0, totalScore = 0, greenCt = 0, yellowCt = 0, redCt = 0

    const majorRows = majors.map(k => {
      const vals = activeMths.map(m => acts[k.code]?.[m] ?? null)
      const validVals   = vals.filter(v => v != null)
      const cumVal      = validVals.length ? validVals.reduce((a,b) => a+b, 0) / validVals.length : null
      const monthScores = vals.map(v => v != null ? SCORE.calc(k.dir, k.tgt, v, k.wt, k.threshold, k.maxOver) : null)
      const validScores = monthScores.filter(s => s != null)
      const cumScore    = validScores.length ? validScores.reduce((a,b) => a+b, 0) / validScores.length : null
      const cumPct      = cumVal != null ? SCORE.pct(k.dir, k.tgt, cumVal) : null
      const cumPctCls   = SCORE.color(cumPct)

      totalWt    += k.wt
      if (cumScore != null) totalScore += cumScore
      if (cumPct != null) {
        if (cumPct >= 90) greenCt++
        else if (cumPct >= 70) yellowCt++
        else redCt++
      }
      return { ...k, vals, monthScores, cumVal, cumScore, cumPct, cumPctCls }
    })

    const minorRows = minors.map(k => {
      const vals    = activeMths.map(m => acts[k.code]?.[m] ?? null)
      const validVals = vals.filter(v => v != null)
      const cumVal  = validVals.length ? validVals.reduce((a,b) => a+b, 0) / validVals.length : null
      const cumPct  = cumVal != null ? SCORE.pct(k.dir, k.tgt, cumVal) : null
      return { ...k, vals, cumVal, cumPct }
    })

    const overallPct = totalWt > 0 ? Math.round(totalScore / totalWt * 100) : 0
    return { majorRows, minorRows, totalWt, totalScore, overallPct, greenCt, yellowCt, redCt }
  }, [master, acts, activeMths])

  const { majorRows, minorRows, totalWt, totalScore, overallPct, greenCt, yellowCt, redCt } = reportData
  const lastMth = activeMths[activeMths.length - 1] || 'Jan'

  const thStyle = { padding:'7px 8px', background:'#714B67', color:'#fff', fontSize:10,
    fontWeight:700, textTransform:'uppercase', letterSpacing:.3, border:'1px solid #5A3A56',
    whiteSpace:'nowrap', textAlign:'center' }
  const tdBase  = { padding:'6px 8px', border:'1px solid var(--odoo-border)', fontSize:11,
    textAlign:'center', verticalAlign:'middle' }

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          KPI Performance Report
          <small>FY {fy} · Cumulative as on {MONTH_FULL[lastMth]} 2026</small>
        </div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" value={filterRole} onChange={e=>setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="plant">Plant Manager</option>
            <option value="accounts">Accounts</option>
            <option value="sales">Sales Officer</option>
            <option value="hr">HR Manager</option>
            <option value="production">Production</option>
          </select>
          <button className="btn btn-s sd-bsm">⬇️ Export</button>
          <button className="btn btn-s sd-bsm">🖨️ Print Report</button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18}}>
        {[
          { icon:'🎯', label:'Cumulative Score',   val:`${totalScore.toFixed(1)} / ${totalWt}`, sub:`${overallPct}% achievement`, color:'#714B67', bg:'#EDE0EA' },
          { icon:'✅', label:'Green KPIs (≥ 90%)', val:greenCt,   sub:'On track',        color:'#00A09D', bg:'#D4EDDA' },
          { icon:'⚠️', label:'Yellow (70–89%)',     val:yellowCt,  sub:'Needs attention', color:'#856404', bg:'#FFF3CD' },
          { icon:'🔴', label:'Red KPIs (< 70%)',   val:redCt,     sub:'Immediate action',color:'#D9534F', bg:'#F8D7DA' },
        ].map(t => (
          <div key={t.label} style={{background:'#fff', borderRadius:10, padding:'14px 16px',
            border:`1px solid var(--odoo-border)`, boxShadow:'0 1px 4px rgba(0,0,0,.06)',
            position:'relative', overflow:'hidden'}}>
            <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:t.color}} />
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
              <div style={{width:36, height:36, borderRadius:8, background:t.bg,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18}}>{t.icon}</div>
              <div style={{fontSize:10, fontWeight:700, color:'var(--odoo-gray)',
                textTransform:'uppercase', letterSpacing:.5}}>{t.label}</div>
            </div>
            <div style={{fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800,
              color:t.color, lineHeight:1}}>{t.val}</div>
            <div style={{fontSize:11, color:'var(--odoo-gray)', marginTop:4}}>{t.sub}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{display:'flex', gap:16, marginBottom:10, flexWrap:'wrap'}}>
        {[['#D4EDDA','#155724','≥ 90% — On Track'],['#FFF3CD','#856404','70–89% — Needs Attention'],['#F8D7DA','#721C24','< 70% — Below Target']].map(([bg,c,l]) => (
          <div key={l} style={{display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--odoo-gray)'}}>
            <div style={{width:12, height:12, borderRadius:2, background:bg, border:`1px solid ${c}44`}} />
            {l}
          </div>
        ))}
      </div>

      {/* Main KPI Table */}
      <div style={{background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
        overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{padding:'12px 16px', borderBottom:'1px solid var(--odoo-border)',
          display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h4 style={{fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700}}>
            📋 KPI Performance — FY {fy}
          </h4>
          <div style={{fontSize:11, color:'var(--odoo-gray)'}}>
            ↑ Up = Higher is better &nbsp;|&nbsp; ↓ Down = Lower is better
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', minWidth:900}}>
            <thead>
              <tr>
                <th style={{...thStyle, textAlign:'left', minWidth:30}}>Sl</th>
                <th style={{...thStyle, textAlign:'left', minWidth:60}}>KPI No.</th>
                <th style={{...thStyle, textAlign:'left', minWidth:60}}>Cat</th>
                <th style={{...thStyle, textAlign:'left', minWidth:220}}>Description</th>
                <th style={thStyle}>UoM</th>
                <th style={thStyle}>Wt</th>
                <th style={thStyle}>Target</th>
                <th style={thStyle}>Cum Value</th>
                <th style={{...thStyle, background:'#5A3A56'}} colSpan={2}>Score (Cum)</th>
                {activeMths.map(m => (
                  <th key={m} style={{...thStyle, background:'#4A3050'}} colSpan={2}>{m}</th>
                ))}
              </tr>
              <tr>
                <th colSpan={8} style={{...thStyle, background:'#F8F9FA', color:'#999', fontSize:9}}></th>
                <th style={{...thStyle, background:'#EDE0EA', color:'#714B67', fontSize:9}}>Value</th>
                <th style={{...thStyle, background:'#EDE0EA', color:'#714B67', fontSize:9}}>Mark</th>
                {activeMths.map(m => (
                  <React.Fragment key={m}>
                    <th style={{...thStyle, background:'#F8F9FA', color:'#999', fontSize:9}}>Val</th>
                    <th style={{...thStyle, background:'#F8F9FA', color:'#999', fontSize:9}}>Sc</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* MAJOR section header */}
              <tr>
                <td colSpan={10 + activeMths.length * 2}
                  style={{padding:'8px 12px', background:'#1C1C1C', color:'#fff',
                    fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:11}}>
                  📊 MAJOR KPIs — Weighted Scoring
                </td>
              </tr>

              {majorRows.map((k, i) => (
                <tr key={k.code} style={{background: i%2===0 ? '#fff' : '#FAFAFA'}}>
                  <td style={{...tdBase, fontWeight:600}}>{i+1}</td>
                  <td style={{...tdBase, fontFamily:'DM Mono,monospace', fontWeight:700,
                    color:'var(--odoo-purple)', textAlign:'left'}}>{k.code}</td>
                  <td style={{...tdBase}}>
                    <span style={{padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:700,
                      background:'#EDE0EA', color:'#714B67'}}>Major</span>
                  </td>
                  <td style={{...tdBase, textAlign:'left', fontWeight:600}}>
                    {k.desc}
                    <span style={{marginLeft:6, fontSize:10, fontWeight:700,
                      color: k.dir==='up' ? '#00A09D' : '#E06F39'}}>
                      {k.dir==='up' ? '↑' : '↓'}
                    </span>
                  </td>
                  <td style={{...tdBase, fontFamily:'DM Mono,monospace'}}>{k.uom}</td>
                  <td style={{...tdBase, fontWeight:800, fontSize:13, color:'var(--odoo-purple)'}}>{k.wt}</td>
                  <td style={{...tdBase, fontFamily:'DM Mono,monospace'}}>{k.tgt}</td>
                  <td style={{...tdBase, fontFamily:'DM Mono,monospace', ...S(k.cumPctCls)}}>
                    {k.cumVal != null ? parseFloat(k.cumVal.toFixed(2)) : '—'}
                  </td>
                  {/* Cumulative % */}
                  <td style={{...tdBase, background:'#F5EDFA', ...S(k.cumPctCls)}}>
                    {k.cumPct != null ? `${k.cumPct}%` : '—'}
                  </td>
                  {/* Cumulative Score */}
                  <td style={{...tdBase, background:'#F5EDFA', fontFamily:'DM Mono,monospace',
                    fontWeight:700, fontSize:12,
                    ...SCORE.colorStyle(k.cumScore != null ? (k.cumScore >= k.wt*0.9 ? 'hi' : k.cumScore >= k.wt*0.7 ? 'md' : 'lo') : 'zero')}}>
                    {k.cumScore != null ? k.cumScore.toFixed(2) : '—'}
                  </td>
                  {/* Monthly cells */}
                  {activeMths.map((m, mi) => {
                    const v = k.vals[mi]
                    const s = k.monthScores[mi]
                    const pct = v != null ? SCORE.pct(k.dir, k.tgt, v) : null
                    const cls = SCORE.color(pct)
                    return (
                      <React.Fragment key={m}>
                        <td style={{...tdBase, fontFamily:'DM Mono,monospace', ...S(cls)}}>
                          {v != null ? parseFloat(v.toFixed ? v.toFixed(2) : v) : ''}
                        </td>
                        <td style={{...tdBase, fontFamily:'DM Mono,monospace', fontSize:10,
                          ...SCORE.colorStyle(s != null ? (s >= k.wt*0.9 ? 'hi' : s >= k.wt*0.7 ? 'md' : 'lo') : 'zero')}}>
                          {s != null ? s.toFixed(1) : ''}
                        </td>
                      </React.Fragment>
                    )
                  })}
                </tr>
              ))}

              {/* Major Total Row */}
              <tr style={{background:'#EDE0EA', fontWeight:800}}>
                <td colSpan={5} style={{...tdBase, textAlign:'left', fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:800}}>
                  MAJOR KPI TOTAL
                </td>
                <td style={{...tdBase, fontSize:14, color:'var(--odoo-purple)', fontFamily:'Syne,sans-serif'}}>{totalWt}</td>
                <td style={tdBase}></td>
                <td style={tdBase}></td>
                <td style={{...tdBase, background:'#EDE0EA'}}></td>
                <td style={{...tdBase, background:'#EDE0EA', fontFamily:'DM Mono,monospace', fontSize:14,
                  ...SCORE.colorStyle(totalScore >= totalWt*0.9 ? 'hi' : totalScore >= totalWt*0.7 ? 'md' : 'lo')}}>
                  {totalScore.toFixed(2)}
                </td>
                {activeMths.map(m => (
                  <React.Fragment key={m}><td style={tdBase}></td><td style={tdBase}></td></React.Fragment>
                ))}
              </tr>

              {/* MINOR section */}
              <tr>
                <td colSpan={10 + activeMths.length * 2}
                  style={{padding:'8px 12px', background:'#1A5276', color:'#fff',
                    fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:11}}>
                  📋 MINOR KPIs — Actual Tracking (No Weightage)
                </td>
              </tr>

              {minorRows.map((k, i) => (
                <tr key={k.code} style={{background:'#EFF6FF'}}>
                  <td style={{...tdBase, fontWeight:600}}>{i+1}</td>
                  <td style={{...tdBase, fontFamily:'DM Mono,monospace', fontWeight:700,
                    color:'#1A5276', textAlign:'left'}}>{k.code}</td>
                  <td style={tdBase}>
                    <span style={{padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:700,
                      background:'#D1ECF1', color:'#0C5460'}}>Minor</span>
                  </td>
                  <td style={{...tdBase, textAlign:'left', fontWeight:600}}>
                    {k.desc}
                    <span style={{marginLeft:6, fontSize:10, fontWeight:700,
                      color: k.dir==='up' ? '#00A09D' : '#E06F39'}}>
                      {k.dir==='up' ? '↑' : '↓'}
                    </span>
                  </td>
                  <td style={{...tdBase, fontFamily:'DM Mono,monospace'}}>{k.uom}</td>
                  <td style={{...tdBase, color:'#999'}}>—</td>
                  <td style={{...tdBase, fontFamily:'DM Mono,monospace'}}>{k.tgt}</td>
                  <td style={{...tdBase, fontFamily:'DM Mono,monospace', ...S(SCORE.color(k.cumPct))}}>
                    {k.cumVal != null ? parseFloat(k.cumVal.toFixed(2)) : '—'}
                  </td>
                  <td colSpan={2} style={{...tdBase, color:'#999', fontStyle:'italic', fontSize:10}}>
                    Tracking only
                  </td>
                  {activeMths.map((m, mi) => {
                    const v = k.vals[mi]
                    const pct = v != null ? SCORE.pct(k.dir, k.tgt, v) : null
                    return (
                      <React.Fragment key={m}>
                        <td style={{...tdBase, fontFamily:'DM Mono,monospace', ...S(SCORE.color(pct))}}>
                          {v != null ? parseFloat(v.toFixed ? v.toFixed(2) : v) : ''}
                        </td>
                        <td style={{...tdBase}}></td>
                      </React.Fragment>
                    )
                  })}
                </tr>
              ))}

              {/* Grand Total */}
              <tr style={{background:'#1C1C1C'}}>
                <td colSpan={9} style={{...tdBase, color:'#fff', fontFamily:'Syne,sans-serif',
                  fontSize:12, fontWeight:800, borderColor:'#444', textAlign:'left', padding:'12px 14px'}}>
                  GRAND CUMULATIVE SCORE (Major KPIs) — FY {fy}
                </td>
                <td style={{...tdBase, background:'#1C1C1C', borderColor:'#444',
                  fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:800, color:'#F5C518'}}>
                  {totalScore.toFixed(2)} / {totalWt}
                  <div style={{fontSize:11, color:'rgba(255,255,255,.6)', fontWeight:400}}>
                    {overallPct}% Achievement
                  </div>
                </td>
                {activeMths.map(m => (
                  <React.Fragment key={m}>
                    <td style={{...tdBase, background:'#1C1C1C', borderColor:'#444'}}></td>
                    <td style={{...tdBase, background:'#1C1C1C', borderColor:'#444'}}></td>
                  </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
