import React, { useState, useMemo } from 'react'
import { MONTHS_FY, MONTH_FULL, KPI_MASTER_DEFAULT, ACTUALS_DEFAULT, EMPLOYEES_DEFAULT, ASSIGNMENTS_DEFAULT, SCORE } from './_kpiData'

export default function Scorecard({ kpiMaster, actuals, employees, assignments }) {
  const master  = kpiMaster  || KPI_MASTER_DEFAULT
  const acts    = actuals    || ACTUALS_DEFAULT
  const emps    = employees  || EMPLOYEES_DEFAULT
  const assigns = assignments|| ASSIGNMENTS_DEFAULT
  const [selEmp, setSelEmp] = useState('')

  const emp = emps.find(e => e.code === selEmp)

  // Get KPIs assigned to this employee's role
  const assignedKPIs = useMemo(() => {
    if (!emp) return []
    const roleAssign = assigns.find(a => a.type === 'role' && a.target === emp.role)
    const deptAssign = assigns.find(a => a.type === 'department')
    const codes = new Set([...(roleAssign?.kpis||[]), ...(deptAssign?.kpis||[])])
    return master.filter(k => codes.has(k.code))
  }, [emp, assigns, master])

  const activeMths = MONTHS_FY.filter(m => Object.values(acts).some(a => a[m] != null))

  const scoreData = useMemo(() => {
    let totalWt=0, totalScore=0
    const rows = assignedKPIs.filter(k=>k.cat==='Major').map(k => {
      const vals = activeMths.map(m => acts[k.code]?.[m] ?? null)
      const validVals = vals.filter(v=>v!=null)
      const cumVal = validVals.length ? validVals.reduce((a,b)=>a+b,0)/validVals.length : null
      const validScores = vals.map(v=>v!=null?SCORE.calc(k.dir,k.tgt,v,k.wt,k.threshold,k.maxOver):null).filter(s=>s!=null)
      const cumScore = validScores.length ? validScores.reduce((a,b)=>a+b,0)/validScores.length : null
      const cumPct = cumVal!=null ? SCORE.pct(k.dir,k.tgt,cumVal) : null
      totalWt += k.wt
      if (cumScore != null) totalScore += cumScore
      return { ...k, cumVal, cumScore, cumPct }
    })
    const achievement = totalWt>0 ? Math.round(totalScore/totalWt*100) : 0
    return { rows, totalWt, totalScore, achievement }
  }, [assignedKPIs, acts, activeMths])

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Individual Scorecard <small>Employee-wise KPI achievement</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" value={selEmp} onChange={e=>setSelEmp(e.target.value)}
            style={{minWidth:200}}>
            <option value="">Select Employee…</option>
            {emps.map(e => <option key={e.code} value={e.code}>{e.name} — {e.dept}</option>)}
          </select>
          {selEmp && <button className="btn btn-s sd-bsm"> Print Scorecard</button>}
        </div>
      </div>

      {!selEmp ? (
        <div style={{background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
          padding:40, textAlign:'center', color:'var(--odoo-gray)'}}>
          <div style={{fontSize:48, marginBottom:12}}></div>
          <div style={{fontSize:14, fontWeight:600}}>Select an employee to view their KPI scorecard</div>
          <div style={{fontSize:12, marginTop:6}}>Individual scores based on role-assigned KPIs</div>
        </div>
      ) : (
        <div>
          {/* Employee header card */}
          <div style={{background:'linear-gradient(135deg,#4A3050,#714B67)', borderRadius:10,
            padding:20, marginBottom:16, display:'flex', gap:20, alignItems:'center'}}>
            <div style={{width:60, height:60, borderRadius:15, background:'rgba(255,255,255,.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'#fff'}}>
              {emp?.name.split(' ').map(n=>n[0]).join('')}
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#fff'}}>{emp?.name}</div>
              <div style={{fontSize:12, color:'rgba(255,255,255,.7)', marginTop:2}}>
                {emp?.dept} · {emp?.role.charAt(0).toUpperCase()+emp?.role.slice(1)} · {emp?.code}
              </div>
            </div>
            {/* Score ring */}
            <div style={{textAlign:'center', background:'rgba(255,255,255,.15)', borderRadius:12, padding:'16px 24px'}}>
              <div style={{fontFamily:'Syne,sans-serif', fontSize:32, fontWeight:800,
                color: scoreData.achievement>=90?'#00FF88':scoreData.achievement>=70?'#F5C518':'#FF6B6B'}}>
                {scoreData.achievement}%
              </div>
              <div style={{fontSize:11, color:'rgba(255,255,255,.7)'}}>Achievement</div>
              <div style={{fontSize:13, color:'#F5C518', fontWeight:700, marginTop:2}}>
                {scoreData.totalScore.toFixed(1)} / {scoreData.totalWt}
              </div>
            </div>
          </div>

          {/* KPI rows */}
          {scoreData.rows.map(k => {
            const cls = SCORE.color(k.cumPct)
            const sc  = SCORE.colorStyle(cls)
            const barW = k.cumPct ? Math.min(k.cumPct, 130) : 0
            return (
              <div key={k.code} style={{background:'#fff', borderRadius:8,
                border:'1px solid var(--odoo-border)', padding:'14px 18px', marginBottom:10,
                boxShadow:'0 1px 4px rgba(0,0,0,.06)', display:'flex', gap:16, alignItems:'center'}}>
                <div style={{fontFamily:'DM Mono,monospace', fontSize:12, fontWeight:700,
                  color:'var(--odoo-purple)', minWidth:50}}>{k.code}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:700, color:'var(--odoo-dark)', marginBottom:4}}>
                    {k.desc}
                    <span style={{marginLeft:8, fontSize:11, color:k.dir==='up'?'#00A09D':'#E06F39', fontWeight:800}}>
                      {k.dir==='up'?'↑ Higher better':'↓ Lower better'}
                    </span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <div style={{flex:1, height:8, background:'#F0F0F0', borderRadius:4, overflow:'hidden'}}>
                      <div style={{height:'100%', borderRadius:4,
                        background: cls==='hi'?'#00A09D':cls==='md'?'#E06F39':'#D9534F',
                        width:`${Math.min(barW, 100)}%`, transition:'width .5s'}}/>
                    </div>
                    <span style={{fontSize:12, fontWeight:700, minWidth:40, ...sc}}>
                      {k.cumPct!=null ? `${k.cumPct}%` : '—'}
                    </span>
                  </div>
                  <div style={{fontSize:10, color:'var(--odoo-gray)', marginTop:3}}>
                    Target: {k.tgt} {k.uom} &nbsp;|&nbsp;
                    Actual (Avg): {k.cumVal!=null ? parseFloat(k.cumVal.toFixed(2)) : '—'} {k.uom}
                  </div>
                </div>
                <div style={{textAlign:'right', minWidth:80}}>
                  <div style={{fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800,
                    ...sc, padding:'4px 10px', borderRadius:8}}>
                    {k.cumScore!=null ? k.cumScore.toFixed(1) : '—'}
                  </div>
                  <div style={{fontSize:10, color:'var(--odoo-gray)', marginTop:2}}>of {k.wt} pts</div>
                </div>
              </div>
            )
          })}

          {/* Total bar */}
          <div style={{background:'#1C1C1C', borderRadius:8, padding:'14px 20px',
            display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
            <div style={{fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#fff'}}>
              TOTAL SCORE — {emp?.name}
            </div>
            <div style={{fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:'#F5C518'}}>
              {scoreData.totalScore.toFixed(2)} / {scoreData.totalWt}
              <span style={{fontSize:13, color:'rgba(255,255,255,.7)', marginLeft:12}}>
                {scoreData.achievement}% Achievement
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
