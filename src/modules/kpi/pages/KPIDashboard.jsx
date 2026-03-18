import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { KPI_MASTER, ACTUALS, MONTHS_FY, SCORE, getActiveMths, INC_TIERS, EMPLOYEES } from './_kpiData'

export default function KPIDashboard() {
  const nav = useNavigate()
  const activeMths = useMemo(() => getActiveMths(), [])
  const displayMths = activeMths.length ? activeMths : ['Apr']
  const lastMth = displayMths[displayMths.length - 1]

  const majors = KPI_MASTER.filter(k => k.cat === 'Major')

  const { totalWt, totalScore, greenCt, yellowCt, redCt } = useMemo(() => {
    let tw=0, ts=0, g=0, y=0, r=0
    majors.forEach(k => {
      const cumVal = SCORE.cumAvg(k.code, displayMths)
      const scores = displayMths.map(m => {
        const v = ACTUALS[k.code]?.[m]
        return v != null ? SCORE.calc(k.dir, k.tgt, v, k.wt, k.threshold, k.maxOver) : null
      }).filter(s => s != null)
      const cumScore = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null
      const pct = SCORE.pct(k.dir, k.tgt, cumVal)
      tw += k.wt
      if (cumScore != null) ts += cumScore
      if (pct != null) { if(pct>=90)g++; else if(pct>=70)y++; else r++ }
    })
    return { totalWt:tw, totalScore:ts, greenCt:g, yellowCt:y, redCt:r }
  }, [majors, displayMths])

  const overallPct = totalWt > 0 ? Math.round(totalScore / totalWt * 100) : 0
  const tier = INC_TIERS.find(t => overallPct >= t.minScore && overallPct <= t.maxScore)

  // Top KPIs by achievement
  const kpiStatus = majors.map(k => {
    const cumVal = SCORE.cumAvg(k.code, displayMths)
    const pct    = SCORE.pct(k.dir, k.tgt, cumVal)
    return { ...k, cumVal, pct }
  }).filter(k => k.pct != null).sort((a,b) => (a.pct||0) - (b.pct||0))

  const worstKPIs = kpiStatus.slice(0, 4)
  const bestKPIs  = kpiStatus.slice(-4).reverse()

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">KRA / KPI Dashboard <small>FY 2025-26 · As on {lastMth} 2026</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/kpi/entry')}>Enter Actuals</button>
          <button className="btn btn-p sd-bsm" onClick={()=>nav('/kpi/report')}>Full Report</button>
        </div>
      </div>

      {/* Score summary */}
      <div style={{background:`linear-gradient(135deg,#4A3050,#714B67)`, borderRadius:10,
        padding:20, marginBottom:18, display:'grid', gridTemplateColumns:'auto 1fr auto', gap:20, alignItems:'center'}}>
        {/* Score donut-style */}
        <div style={{textAlign:'center', padding:'0 10px'}}>
          <div style={{fontFamily:'Syne,sans-serif', fontSize:48, fontWeight:800, color:'#FFD700', lineHeight:1}}>
            {overallPct}%
          </div>
          <div style={{fontSize:12, color:'rgba(255,255,255,.7)', marginTop:4}}>Overall Achievement</div>
          <div style={{fontSize:11, color:'rgba(255,255,255,.5)'}}>Score: {totalScore.toFixed(1)} / {totalWt}</div>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
            <span style={{fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, color:'#fff'}}>Grand Cumulative Score</span>
            <span style={{fontFamily:'DM Mono,monospace', fontSize:14, fontWeight:700, color:'#FFD700'}}>{totalScore.toFixed(2)} / {totalWt}</span>
          </div>
          <div style={{height:20, background:'rgba(255,255,255,.15)', borderRadius:10, overflow:'hidden', marginBottom:10}}>
            <div style={{height:'100%', width:`${Math.min(overallPct,100)}%`, borderRadius:10,
              background: overallPct>=90?'#00A09D':overallPct>=70?'#F5C518':'#D9534F',
              transition:'width 1s ease'}}/>
          </div>
          <div style={{display:'flex', gap:16}}>
            {[['✅ Green',greenCt,'#00A09D'],['⚠️ Yellow',yellowCt,'#F5C518'],['🔴 Red',redCt,'#D9534F']].map(([l,v,c])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:5}}>
                <div style={{width:10,height:10,borderRadius:2,background:c}}/>
                <span style={{fontSize:11,color:'rgba(255,255,255,.8)'}}>{l}: <strong style={{color:'#fff'}}>{v}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Incentive tier */}
        <div style={{textAlign:'center', padding:'12px 20px', borderRadius:10,
          background: tier?.color ? `${tier.color}33` : 'rgba(255,255,255,.1)',
          border:`2px solid ${tier?.color || 'rgba(255,255,255,.2)'}`,
          minWidth:140}}>
          <div style={{fontSize:28, marginBottom:4}}>💰</div>
          <div style={{fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:800,
            color: tier?.color || 'rgba(255,255,255,.5)'}}>
            {tier?.label || '—'}
          </div>
          <div style={{fontSize:11, color:'rgba(255,255,255,.7)', marginTop:4}}>
            Incentive: <strong style={{color:'#FFD700'}}>{tier?.incPct||0}%</strong> of salary
          </div>
        </div>
      </div>

      {/* KPI trend grid */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14}}>
        {/* Needs attention */}
        <div style={{background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'10px 16px', borderBottom:'1px solid var(--odoo-border)',
            background:'#FDF0EA', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h4 style={{fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#721C24'}}>
              🔴 KPIs Needing Attention
            </h4>
            <span style={{fontSize:10, color:'var(--odoo-gray)'}}>Lowest achievement</span>
          </div>
          {worstKPIs.map(k => {
            const cs = SCORE.colorStyle(k.pct)
            return (
              <div key={k.code} style={{padding:'10px 16px', borderBottom:'1px solid var(--odoo-border)',
                display:'flex', alignItems:'center', gap:10}}>
                <div style={{fontFamily:'DM Mono,monospace', fontSize:10, fontWeight:700,
                  color:'var(--odoo-purple)', minWidth:40}}>{k.code}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11, fontWeight:600, color:'var(--odoo-dark)'}}>{k.desc}</div>
                  <div style={{height:5, background:'var(--odoo-border)', borderRadius:3, marginTop:4}}>
                    <div style={{height:'100%', borderRadius:3, background:cs.color,
                      width:`${Math.min(k.pct||0, 100)}%`, transition:'width .8s'}}/>
                  </div>
                </div>
                <div style={{padding:'3px 8px', borderRadius:8, fontSize:11, fontWeight:700,
                  background:cs.bg, color:cs.color, minWidth:45, textAlign:'center'}}>
                  {k.pct}%
                </div>
              </div>
            )
          })}
        </div>

        {/* On track */}
        <div style={{background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'10px 16px', borderBottom:'1px solid var(--odoo-border)',
            background:'#F0FFF4', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h4 style={{fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#155724'}}>
              ✅ KPIs On Track
            </h4>
            <span style={{fontSize:10, color:'var(--odoo-gray)'}}>Highest achievement</span>
          </div>
          {bestKPIs.map(k => {
            const cs = SCORE.colorStyle(k.pct)
            return (
              <div key={k.code} style={{padding:'10px 16px', borderBottom:'1px solid var(--odoo-border)',
                display:'flex', alignItems:'center', gap:10}}>
                <div style={{fontFamily:'DM Mono,monospace', fontSize:10, fontWeight:700,
                  color:'var(--odoo-purple)', minWidth:40}}>{k.code}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11, fontWeight:600, color:'var(--odoo-dark)'}}>{k.desc}</div>
                  <div style={{height:5, background:'var(--odoo-border)', borderRadius:3, marginTop:4}}>
                    <div style={{height:'100%', borderRadius:3, background:cs.color,
                      width:`${Math.min(k.pct||0, 100)}%`, transition:'width .8s'}}/>
                  </div>
                </div>
                <div style={{padding:'3px 8px', borderRadius:8, fontSize:11, fontWeight:700,
                  background:cs.bg, color:cs.color, minWidth:45, textAlign:'center'}}>
                  {k.pct}%
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Employee incentive preview */}
      <div style={{background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
        overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{padding:'12px 16px', borderBottom:'1px solid var(--odoo-border)',
          display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h4 style={{fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700}}>Incentive Preview — Eligible Employees</h4>
          <button onClick={()=>nav('/kpi/incentive')} style={{fontSize:11,color:'var(--odoo-purple)',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>
            Full Calculator →
          </button>
        </div>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#F8F9FA'}}>
            {['Employee','Dept','Salary','Score','Tier','Incentive Amt'].map(h=>(
              <th key={h} style={{padding:'8px 14px',fontSize:11,fontWeight:700,color:'var(--odoo-gray)',textAlign:'left',borderBottom:'1px solid var(--odoo-border)'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {EMPLOYEES.filter(e=>e.incElig).map(emp => {
              const empTier = tier
              const incAmt = empTier ? Math.round(emp.sal * empTier.incPct / 100) : 0
              return (
                <tr key={emp.code} style={{borderBottom:'1px solid var(--odoo-border)'}}>
                  <td style={{padding:'10px 14px', fontWeight:600, fontSize:12}}>{emp.name}</td>
                  <td style={{padding:'10px 14px', fontSize:11}}>{emp.dept}</td>
                  <td style={{padding:'10px 14px', fontFamily:'DM Mono,monospace', fontSize:12}}>₹{emp.sal.toLocaleString('en-IN')}</td>
                  <td style={{padding:'10px 14px', fontFamily:'DM Mono,monospace', fontSize:12, fontWeight:700, color:'var(--odoo-purple)'}}>{overallPct}%</td>
                  <td style={{padding:'10px 14px'}}>
                    {tier && <span style={{padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600, background:tier.bg, color:tier.color}}>{tier.label}</span>}
                  </td>
                  <td style={{padding:'10px 14px', fontFamily:'DM Mono,monospace', fontSize:13, fontWeight:800, color:'var(--odoo-green)'}}>
                    ₹{incAmt.toLocaleString('en-IN')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
