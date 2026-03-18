import React, { useState } from 'react'
import { KPI_MASTER, ACTUALS, MONTHS_FY, MONTH_FULL, SCORE } from './_kpiData'

export default function KPIEntry() {
  const [month, setMonth]   = useState('Feb')
  const [values, setValues] = useState(() => {
    const init = {}
    KPI_MASTER.forEach(k => {
      init[k.code] = ACTUALS[k.code]?.[month] != null ? String(ACTUALS[k.code][month]) : ''
    })
    return init
  })
  const [saved, setSaved] = useState(false)

  const changeMonth = (m) => {
    setMonth(m)
    const init = {}
    KPI_MASTER.forEach(k => {
      init[k.code] = ACTUALS[k.code]?.[m] != null ? String(ACTUALS[k.code][m]) : ''
    })
    setValues(init)
    setSaved(false)
  }

  const handleSave = () => { setSaved(true); setTimeout(()=>setSaved(false), 2500) }

  const inp = (k) => {
    const v  = values[k.code] !== '' ? parseFloat(values[k.code]) : null
    const pct = SCORE.pct(k.dir, k.tgt, v)
    const cs  = SCORE.colorStyle(pct)
    const sc  = v != null ? SCORE.calc(k.dir, k.tgt, v, k.wt, k.threshold, k.maxOver) : null
    return { v, pct, cs, sc }
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Monthly KPI Data Entry <small>Enter actual values for scoring</small></div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" value={month} onChange={e=>changeMonth(e.target.value)}>
            {MONTHS_FY.map(m=><option key={m} value={m}>{MONTH_FULL[m]} 2026</option>)}
          </select>
          <button className="btn btn-p sd-bsm" onClick={handleSave}
            style={saved?{background:'#155724',color:'#fff'}:{}}>
            {saved ? '✅ Saved!' : '💾 Save Actuals'}
          </button>
        </div>
      </div>

      {saved && (
        <div style={{background:'#D4EDDA',border:'1px solid #C3E6CB',borderRadius:6,
          padding:'10px 16px',marginBottom:16,fontSize:13,color:'#155724',fontWeight:600}}>
          ✅ Actuals for {MONTH_FULL[month]} saved successfully!
        </div>
      )}

      <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',
        overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr style={{background:'var(--odoo-purple)'}}>
              {['#','Code','Category','KPI Description','UOM','Dir','Target','Actual (Enter)','Ach %','Score','Status'].map(h=>(
                <th key={h} style={{padding:'9px 10px',color:'#fff',fontSize:10,fontWeight:700,
                  textAlign:h==='KPI Description'?'left':'center',
                  border:'1px solid rgba(255,255,255,.2)',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Major */}
            <tr>
              <td colSpan={11} style={{padding:'7px 14px',background:'var(--odoo-dark)',color:'#fff',
                fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11}}>
                📊 MAJOR KPIs — Weighted (Affects Score)
              </td>
            </tr>
            {KPI_MASTER.filter(k=>k.cat==='Major').map((k,i)=>{
              const {v,pct,cs,sc} = inp(k)
              return (
                <tr key={k.code} style={{background:i%2===0?'#fff':'#F8F9FA',borderBottom:'1px solid var(--odoo-border)'}}>
                  <td style={{padding:'7px 10px',textAlign:'center',color:'var(--odoo-gray)',fontSize:10}}>{i+1}</td>
                  <td style={{padding:'7px 10px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:10}}>{k.code}</td>
                  <td style={{padding:'7px 10px',textAlign:'center'}}>
                    <span style={{padding:'2px 6px',borderRadius:8,fontSize:9,fontWeight:700,background:'#EDE0EA',color:'var(--odoo-purple)'}}>Major</span>
                  </td>
                  <td style={{padding:'7px 10px',fontWeight:600}}>{k.desc}</td>
                  <td style={{padding:'7px 10px',textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:10}}>{k.uom}</td>
                  <td style={{padding:'7px 10px',textAlign:'center',fontWeight:700,
                    color:k.dir==='up'?'var(--odoo-blue)':'var(--odoo-red)',fontSize:12}}>
                    {k.dir==='up'?'↑':'↓'}
                  </td>
                  <td style={{padding:'7px 10px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700}}>{k.tgt}</td>
                  <td style={{padding:'5px 8px',textAlign:'center'}}>
                    <input type="number" step="0.01"
                      value={values[k.code]}
                      onChange={e=>setValues(prev=>({...prev,[k.code]:e.target.value}))}
                      placeholder="Enter"
                      style={{width:90,padding:'5px 8px',border:`2px solid ${values[k.code]?'var(--odoo-purple)':'var(--odoo-border)'}`,
                        borderRadius:5,fontSize:12,fontFamily:'DM Mono,monospace',textAlign:'right',
                        outline:'none',background:'#FFFDE7',boxSizing:'border-box'}}
                      onFocus={e=>e.target.style.borderColor='var(--odoo-purple)'}
                      onBlur={e=>e.target.style.borderColor=values[k.code]?'var(--odoo-purple)':'var(--odoo-border)'}
                    />
                  </td>
                  <td style={{padding:'7px 10px',textAlign:'center',fontFamily:'DM Mono,monospace',
                    fontWeight:700,background:v!=null?cs.bg:'',color:v!=null?cs.color:'var(--odoo-gray)'}}>
                    {pct != null ? `${pct}%` : '—'}
                  </td>
                  <td style={{padding:'7px 10px',textAlign:'center',fontFamily:'DM Mono,monospace',
                    fontWeight:800,fontSize:13,
                    background:sc!=null?(sc>=k.wt*0.9?'#D4EDDA':sc>=k.wt*0.7?'#FFF3CD':'#F8D7DA'):'',
                    color:sc!=null?(sc>=k.wt*0.9?'#155724':sc>=k.wt*0.7?'#856404':'#721C24'):'var(--odoo-gray)'}}>
                    {sc != null ? sc.toFixed(2) : '—'}
                  </td>
                  <td style={{padding:'7px 10px',textAlign:'center'}}>
                    {v != null ? (
                      <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                        background:cs.bg,color:cs.color}}>
                        {(pct||0)>=90?'On Target':(pct||0)>=70?'Near Target':'Below'}
                      </span>
                    ) : <span style={{color:'var(--odoo-gray)',fontSize:11}}>Not Entered</span>}
                  </td>
                </tr>
              )
            })}
            {/* Minor */}
            <tr>
              <td colSpan={11} style={{padding:'7px 14px',background:'#1A5276',color:'#fff',
                fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:11}}>
                📋 MINOR KPIs — Tracking Only
              </td>
            </tr>
            {KPI_MASTER.filter(k=>k.cat==='Minor').map((k,i)=>{
              const {v,pct,cs} = inp(k)
              return (
                <tr key={k.code} style={{background:'#EFF6FF',borderBottom:'1px solid var(--odoo-border)'}}>
                  <td style={{padding:'7px 10px',textAlign:'center',color:'var(--odoo-gray)',fontSize:10}}>{i+1}</td>
                  <td style={{padding:'7px 10px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#1A5276',fontSize:10}}>{k.code}</td>
                  <td style={{padding:'7px 10px',textAlign:'center'}}>
                    <span style={{padding:'2px 6px',borderRadius:8,fontSize:9,fontWeight:700,background:'#D1ECF1',color:'#0C5460'}}>Minor</span>
                  </td>
                  <td style={{padding:'7px 10px',fontWeight:600}}>{k.desc}</td>
                  <td style={{padding:'7px 10px',textAlign:'center',fontFamily:'DM Mono,monospace',fontSize:10}}>{k.uom}</td>
                  <td style={{padding:'7px 10px',textAlign:'center',fontWeight:700,color:k.dir==='up'?'var(--odoo-blue)':'var(--odoo-red)',fontSize:12}}>{k.dir==='up'?'↑':'↓'}</td>
                  <td style={{padding:'7px 10px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700}}>{k.tgt}</td>
                  <td style={{padding:'5px 8px',textAlign:'center'}}>
                    <input type="number" step="0.01"
                      value={values[k.code]}
                      onChange={e=>setValues(prev=>({...prev,[k.code]:e.target.value}))}
                      placeholder="Enter"
                      style={{width:90,padding:'5px 8px',border:`2px solid ${values[k.code]?'#1A5276':'var(--odoo-border)'}`,
                        borderRadius:5,fontSize:12,fontFamily:'DM Mono,monospace',textAlign:'right',
                        outline:'none',background:'#FFFDE7',boxSizing:'border-box'}}/>
                  </td>
                  <td style={{padding:'7px 10px',textAlign:'center',fontFamily:'DM Mono,monospace',
                    fontWeight:700,background:v!=null?cs.bg:'',color:v!=null?cs.color:'var(--odoo-gray)'}}>
                    {pct != null ? `${pct}%` : '—'}
                  </td>
                  <td style={{padding:'7px 10px',textAlign:'center',color:'var(--odoo-gray)',fontSize:10}}>Tracking</td>
                  <td style={{padding:'7px 10px',textAlign:'center'}}>
                    {v != null ? <span style={{padding:'3px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:cs.bg,color:cs.color}}>{(pct||0)>=90?'On Target':(pct||0)>=70?'Near Target':'Below'}</span>
                      : <span style={{color:'var(--odoo-gray)',fontSize:11}}>Not Entered</span>}
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
