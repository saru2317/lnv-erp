import React, { useState, useCallback } from 'react'
import { MONTHS_FY, MONTH_FULL, KPI_MASTER_DEFAULT, ACTUALS_DEFAULT, SCORE } from './_kpiData'

export default function MonthlyEntry({ kpiMaster, actuals, onSave }) {
  const master = kpiMaster || KPI_MASTER_DEFAULT
  const [month,   setMonth]   = useState('Feb')
  const [vals,    setVals]    = useState({})
  const [saved,   setSaved]   = useState(false)

  // Merge saved vals with defaults
  const getVal = (code) => {
    if (vals[code] !== undefined) return vals[code]
    return actuals?.[code]?.[month] ?? ''
  }

  const updVal = (code, val) => setVals(v => ({...v, [code]: val === '' ? '' : parseFloat(val)}))

  const handleSave = () => {
    setSaved(true)
    onSave?.(month, vals)
    setTimeout(() => setSaved(false), 2000)
  }

  const inp = { width:'100%', padding:'5px 8px', border:'1.5px solid var(--odoo-border)',
    borderRadius:5, fontFamily:'DM Mono,monospace', fontSize:12, textAlign:'right',
    outline:'none', background:'#FFFDE7', boxSizing:'border-box' }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Monthly KPI Data Entry
          <small>Enter actual values · Scores auto-calculated</small>
        </div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" value={month} onChange={e=>setMonth(e.target.value)}>
            {MONTHS_FY.map(m => <option key={m} value={m}>{MONTH_FULL[m]} 2026</option>)}
          </select>
          <button className="btn btn-p sd-bsm"
            style={saved ? {background:'#155724',color:'#fff'} : {}}
            onClick={handleSave}>
            {saved ? ' Saved!' : ' Save Entry'}
          </button>
        </div>
      </div>

      <div className="fi-alert info" style={{marginBottom:14}}>
        ℹ Enter actual values for <strong>{MONTH_FULL[month]} 2026</strong>. Achievement % and Score are auto-calculated.
        Blue cells = input. ↑ = Higher is better. ↓ = Lower is better.
      </div>

      <div style={{background:'#fff', borderRadius:8, border:'1px solid var(--odoo-border)',
        overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <div style={{padding:'12px 16px', borderBottom:'1px solid var(--odoo-border)',
          fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700}}>
           Actuals Entry — {MONTH_FULL[month]} 2026
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#714B67'}}>
                {['KPI Code','Category','Description','UoM','Dir','Wt','Target','Actual Value','Achievement %','Score'].map(h=>(
                  <th key={h} style={{padding:'9px 10px', color:'#fff', fontSize:10, fontWeight:700,
                    textAlign: h==='Description' ? 'left' : 'center',
                    textTransform:'uppercase', letterSpacing:.3, border:'1px solid #5A3A56',
                    whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Major section */}
              <tr>
                <td colSpan={10} style={{padding:'7px 12px', background:'#1C1C1C',
                  color:'#fff', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:11}}>
                   MAJOR KPIs
                </td>
              </tr>
              {master.filter(k=>k.cat==='Major').map((k,i) => {
                const actual  = getVal(k.code)
                const numActual = actual !== '' && actual != null ? parseFloat(actual) : null
                const pct    = numActual != null ? SCORE.pct(k.dir, k.tgt, numActual) : null
                const score  = numActual != null ? SCORE.calc(k.dir, k.tgt, numActual, k.wt, k.threshold, k.maxOver) : null
                const cls    = SCORE.color(pct)
                const sc     = SCORE.colorStyle(cls)
                return (
                  <tr key={k.code} style={{background: i%2===0 ? '#fff' : '#FAFAFA',
                    borderBottom:'1px solid var(--odoo-border)'}}>
                    <td style={{padding:'8px 10px', fontFamily:'DM Mono,monospace', fontWeight:700,
                      color:'var(--odoo-purple)', textAlign:'center'}}>{k.code}</td>
                    <td style={{padding:'8px 10px', textAlign:'center'}}>
                      <span style={{padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:700,
                        background:'#EDE0EA', color:'#714B67'}}>Major</span>
                    </td>
                    <td style={{padding:'8px 10px', fontWeight:600, fontSize:12}}>{k.desc}</td>
                    <td style={{padding:'8px 10px', fontFamily:'DM Mono,monospace', textAlign:'center'}}>{k.uom}</td>
                    <td style={{padding:'8px 10px', textAlign:'center', fontWeight:700,
                      color: k.dir==='up' ? '#00A09D' : '#E06F39', fontSize:16}}>
                      {k.dir==='up' ? '↑' : '↓'}
                    </td>
                    <td style={{padding:'8px 10px', textAlign:'center', fontWeight:800,
                      color:'var(--odoo-purple)', fontSize:13}}>{k.wt}</td>
                    <td style={{padding:'8px 10px', fontFamily:'DM Mono,monospace', textAlign:'right',
                      color:'var(--odoo-gray)'}}>{k.tgt}</td>
                    <td style={{padding:'4px 8px', minWidth:130}}>
                      <input type="number" step="0.01"
                        value={actual === '' ? '' : actual ?? ''}
                        onChange={e => updVal(k.code, e.target.value)}
                        placeholder="Enter actual"
                        style={inp}
                        onFocus={e => { e.target.style.borderColor='var(--odoo-purple)'; e.target.style.boxShadow='0 0 0 2px rgba(113,75,103,.15)' }}
                        onBlur={e  => { e.target.style.borderColor='var(--odoo-border)'; e.target.style.boxShadow='none' }}
                      />
                    </td>
                    <td style={{padding:'8px 10px', textAlign:'center',
                      fontFamily:'DM Mono,monospace', fontWeight:700, ...sc}}>
                      {pct != null ? `${pct}%` : '—'}
                    </td>
                    <td style={{padding:'8px 10px', textAlign:'center',
                      fontFamily:'DM Mono,monospace', fontWeight:700, fontSize:13, ...sc}}>
                      {score != null ? score.toFixed(2) : '—'}
                    </td>
                  </tr>
                )
              })}

              {/* Minor section */}
              <tr>
                <td colSpan={10} style={{padding:'7px 12px', background:'#1A5276',
                  color:'#fff', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:11}}>
                   MINOR KPIs — Tracking Only
                </td>
              </tr>
              {master.filter(k=>k.cat==='Minor').map((k,i) => {
                const actual   = getVal(k.code)
                const numActual = actual !== '' && actual != null ? parseFloat(actual) : null
                const pct     = numActual != null ? SCORE.pct(k.dir, k.tgt, numActual) : null
                const cls     = SCORE.color(pct)
                return (
                  <tr key={k.code} style={{background:'#EFF6FF', borderBottom:'1px solid var(--odoo-border)'}}>
                    <td style={{padding:'8px 10px', fontFamily:'DM Mono,monospace', fontWeight:700,
                      color:'#1A5276', textAlign:'center'}}>{k.code}</td>
                    <td style={{padding:'8px 10px', textAlign:'center'}}>
                      <span style={{padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:700,
                        background:'#D1ECF1', color:'#0C5460'}}>Minor</span>
                    </td>
                    <td style={{padding:'8px 10px', fontWeight:600, fontSize:12}}>{k.desc}</td>
                    <td style={{padding:'8px 10px', fontFamily:'DM Mono,monospace', textAlign:'center'}}>{k.uom}</td>
                    <td style={{padding:'8px 10px', textAlign:'center', fontWeight:700,
                      color: k.dir==='up' ? '#00A09D' : '#E06F39', fontSize:16}}>
                      {k.dir==='up' ? '↑' : '↓'}
                    </td>
                    <td style={{padding:'8px 10px', textAlign:'center', color:'#999'}}>—</td>
                    <td style={{padding:'8px 10px', fontFamily:'DM Mono,monospace', textAlign:'right',
                      color:'var(--odoo-gray)'}}>{k.tgt}</td>
                    <td style={{padding:'4px 8px', minWidth:130}}>
                      <input type="number" step="0.01"
                        value={actual === '' ? '' : actual ?? ''}
                        onChange={e => updVal(k.code, e.target.value)}
                        placeholder="Enter actual"
                        style={{...inp, background:'#F0F8FF'}}
                        onFocus={e => { e.target.style.borderColor='#1A5276'; e.target.style.boxShadow='0 0 0 2px rgba(26,82,118,.15)' }}
                        onBlur={e  => { e.target.style.borderColor='var(--odoo-border)'; e.target.style.boxShadow='none' }}
                      />
                    </td>
                    <td style={{padding:'8px 10px', textAlign:'center',
                      fontFamily:'DM Mono,monospace', fontWeight:700, ...SCORE.colorStyle(cls)}}>
                      {pct != null ? `${pct}%` : '—'}
                    </td>
                    <td style={{padding:'8px 10px', textAlign:'center', color:'#999', fontStyle:'italic', fontSize:11}}>
                      Tracking
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
