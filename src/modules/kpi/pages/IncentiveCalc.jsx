import React, { useState, useMemo } from 'react'
import { KPI_MASTER_DEFAULT, ACTUALS_DEFAULT, EMPLOYEES_DEFAULT, ASSIGNMENTS_DEFAULT, MONTHS_FY, INC_TIERS_DEFAULT, SCORE } from './_kpiData'

function calcEmployeeScore(emp, assigns, master, acts) {
  const activeMths = MONTHS_FY.filter(m => Object.values(acts).some(a => a[m] != null))
  const roleAssign = assigns.find(a => a.type==='role' && a.target===emp.role)
  const deptAssign = assigns.find(a => a.type==='department')
  const codes = new Set([...(roleAssign?.kpis||[]), ...(deptAssign?.kpis||[])])
  const kpis = master.filter(k => codes.has(k.code) && k.cat==='Major')
  let totalWt=0, totalScore=0
  kpis.forEach(k => {
    const vals = activeMths.map(m => acts[k.code]?.[m] ?? null)
    const validScores = vals.filter(v=>v!=null).map(v=>SCORE.calc(k.dir,k.tgt,v,k.wt,k.threshold,k.maxOver)).filter(s=>s!=null)
    totalWt += k.wt
    if (validScores.length) totalScore += validScores.reduce((a,b)=>a+b,0)/validScores.length
  })
  const pct = totalWt>0 ? Math.round(totalScore/totalWt*100) : 0
  return { totalScore: parseFloat(totalScore.toFixed(2)), totalWt, pct }
}

export default function IncentiveCalc({ kpiMaster, actuals, employees, assignments, tiers }) {
  const master  = kpiMaster  || KPI_MASTER_DEFAULT
  const acts    = actuals    || ACTUALS_DEFAULT
  const emps    = employees  || EMPLOYEES_DEFAULT
  const assigns = assignments|| ASSIGNMENTS_DEFAULT
  const incTiers= tiers      || INC_TIERS_DEFAULT
  const [selEmp, setSelEmp] = useState('')
  const [manualScore, setManualScore] = useState('')

  const scores = useMemo(() =>
    emps.map(e => ({ ...e, ...calcEmployeeScore(e, assigns, master, acts) }))
  , [emps, assigns, master, acts])

  const selectedEmpScore = scores.find(e=>e.code===selEmp)
  const useScore = manualScore !== '' ? parseFloat(manualScore) : (selectedEmpScore?.pct ?? 0)

  const getTier = (pct) => incTiers.find(t => pct >= t.minScore && pct <= t.maxScore)
  const tier = getTier(useScore)
  const incAmt = selectedEmpScore && tier ? Math.round(selectedEmpScore.sal * tier.incPct / 100) : 0

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">KPI-Based Incentive Calculator <small>Score → Incentive tier</small></div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16}}>
        {/* Tier config */}
        <div style={{background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'12px 16px', borderBottom:'1px solid var(--odoo-border)',
            fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700}}> Incentive Tiers</div>
          <div style={{padding:16}}>
            {incTiers.map((t,i) => (
              <div key={i} style={{display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                borderRadius:8, marginBottom:8, border:`1.5px solid ${t.color}33`,
                background:`${t.color}11`}}>
                <div style={{width:10, height:10, borderRadius:3, background:t.color, flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:700, color:'var(--odoo-dark)'}}>{t.label}</div>
                  <div style={{fontSize:11, color:'var(--odoo-gray)'}}>Score: {t.minScore} – {t.maxScore}%</div>
                </div>
                <div style={{fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:t.color}}>
                  {t.incPct}%
                </div>
                <div style={{fontSize:11, color:'var(--odoo-gray)'}}>of salary</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live calculator */}
        <div style={{background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
          <div style={{padding:'12px 16px', borderBottom:'1px solid var(--odoo-border)',
            fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700}}> Live Incentive Calculator</div>
          <div style={{padding:20}}>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11, fontWeight:700, color:'var(--odoo-gray)', textTransform:'uppercase',
                letterSpacing:.5, marginBottom:6, display:'block'}}>Employee</label>
              <select value={selEmp} onChange={e=>{setSelEmp(e.target.value); setManualScore('')}}
                style={{width:'100%', padding:'8px 12px', border:'1.5px solid var(--odoo-border)',
                  borderRadius:5, fontSize:12, outline:'none', background:'#FFFDE7'}}>
                <option value="">Select employee…</option>
                {emps.filter(e=>e.incElig).map(e=><option key={e.code} value={e.code}>{e.name}</option>)}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:11, fontWeight:700, color:'var(--odoo-gray)', textTransform:'uppercase',
                letterSpacing:.5, marginBottom:6, display:'block'}}>Achievement % (auto or override)</label>
              <input type="number" min="0" max="100"
                value={manualScore !== '' ? manualScore : (selectedEmpScore?.pct ?? '')}
                onChange={e=>setManualScore(e.target.value)}
                placeholder="Auto from KPI score"
                style={{width:'100%', padding:'10px 14px', border:'1.5px solid var(--odoo-border)',
                  borderRadius:5, fontFamily:'DM Mono,monospace', fontSize:20, fontWeight:700,
                  outline:'none', background:'#FFFDE7', boxSizing:'border-box', textAlign:'center'}}/>
            </div>

            {/* Result */}
            {(selEmp || manualScore) && tier ? (
              <div style={{background:`${tier.color}11`, border:`2px solid ${tier.color}`,
                borderRadius:10, padding:16, textAlign:'center'}}>
                <div style={{fontSize:12, fontWeight:700, color:'var(--odoo-gray)', marginBottom:4}}>
                  Achievement: {useScore}%
                </div>
                <div style={{fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800,
                  color:tier.color, marginBottom:4}}>{tier.label}</div>
                <div style={{fontSize:12, color:'var(--odoo-gray)', marginBottom:8}}>
                  Incentive: {tier.incPct}% of salary
                </div>
                {selectedEmpScore && (
                  <>
                    <div style={{fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:800,
                      color:'var(--odoo-dark)'}}>
                      ₹{incAmt.toLocaleString('en-IN')}
                    </div>
                    <div style={{fontSize:11, color:'var(--odoo-gray)', marginTop:4}}>
                      Based on salary ₹{selectedEmpScore.sal.toLocaleString('en-IN')}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{padding:24, textAlign:'center', color:'var(--odoo-gray)', fontSize:12}}>
                Select employee & enter score to calculate
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div style={{background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
        overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{padding:'12px 16px', borderBottom:'1px solid var(--odoo-border)',
          fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700}}>
           Incentive Summary — All Employees
        </div>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#714B67'}}>
              {['Employee','Role','Score','Max Score','Achievement%','Tier','Incentive (₹)','Status'].map(h=>(
                <th key={h} style={{padding:'9px 12px', color:'#fff', fontSize:10, fontWeight:700,
                  textAlign: h==='Employee'||h==='Role' ? 'left':'center',
                  border:'1px solid #5A3A56', whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scores.map((e,i) => {
              const t = getTier(e.pct)
              const inc = e.incElig && t ? Math.round(e.sal * t.incPct / 100) : 0
              return (
                <tr key={e.code} style={{background:i%2===0?'#fff':'#FAFAFA', borderBottom:'1px solid var(--odoo-border)'}}>
                  <td style={{padding:'10px 12px', fontWeight:700, fontSize:12}}>{e.name}</td>
                  <td style={{padding:'10px 12px', fontSize:11, color:'var(--odoo-gray)'}}>{e.dept}</td>
                  <td style={{padding:'10px 12px', textAlign:'center', fontFamily:'DM Mono,monospace',
                    fontWeight:700, color:'var(--odoo-purple)'}}>{e.totalScore.toFixed(1)}</td>
                  <td style={{padding:'10px 12px', textAlign:'center', fontFamily:'DM Mono,monospace'}}>{e.totalWt}</td>
                  <td style={{padding:'10px 12px', textAlign:'center'}}>
                    <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'center'}}>
                      <div style={{width:60, height:6, background:'#F0F0F0', borderRadius:3}}>
                        <div style={{height:'100%', borderRadius:3,
                          background: e.pct>=90?'#00A09D':e.pct>=70?'#E06F39':'#D9534F',
                          width:`${Math.min(e.pct,100)}%`}}/>
                      </div>
                      <span style={{fontWeight:700, fontSize:12, minWidth:36,
                        color: e.pct>=90?'#155724':e.pct>=70?'#856404':'#721C24'}}>
                        {e.pct}%
                      </span>
                    </div>
                  </td>
                  <td style={{padding:'10px 12px', textAlign:'center'}}>
                    {t ? <span style={{padding:'3px 10px', borderRadius:10, fontSize:11,
                      fontWeight:700, background:`${t.color}22`, color:t.color}}>{t.label}</span> : '—'}
                  </td>
                  <td style={{padding:'10px 12px', textAlign:'center',
                    fontFamily:'DM Mono,monospace', fontWeight:700,
                    color:inc>0?'var(--odoo-green)':'var(--odoo-gray)'}}>
                    {e.incElig ? `₹${inc.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td style={{padding:'10px 12px', textAlign:'center'}}>
                    <span style={{padding:'3px 8px', borderRadius:10, fontSize:11, fontWeight:600,
                      background:e.incElig?'#D4EDDA':'#F8F9FA',
                      color:e.incElig?'#155724':'#999'}}>
                      {e.incElig ? ' Eligible' : '— Not eligible'}
                    </span>
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
