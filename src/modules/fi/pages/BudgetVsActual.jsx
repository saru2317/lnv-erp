import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

export default function BudgetVsActual() {
  const [year,    setYear]    = useState(new Date().getFullYear())
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/budget-vs-actual?year=${year}`, { headers: hdr2() })
      const d = await r.json()
      setData(d.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [year])

  useEffect(() => { load() }, [load])

  const VAR_COLOR = (v, type) => {
    if (type==='expense') return v<0?'#155724':'#DC3545'  // less expense = good
    return v>=0?'#155724':'#DC3545'  // more revenue/profit = good
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Budget vs Actual
          <small> FY {year}–{year+1}</small>
        </div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={year} onChange={e=>setYear(parseInt(e.target.value))} style={{width:100}}>
            {[2023,2024,2025,2026].map(y=><option key={y} value={y}>FY {y}-{y+1}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-alert info" style={{marginBottom:14}}>
        Budget is set at 115% of revenue target and 90% expense target. Configure a Budget Master to set custom budgets.
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>Category</th>
            <th style={{textAlign:'right'}}>Budget</th>
            <th style={{textAlign:'right'}}>Actual</th>
            <th style={{textAlign:'right'}}>Variance</th>
            <th style={{textAlign:'right'}}>Variance %</th>
            <th style={{width:180}}>Achievement</th>
          </tr></thead>
          <tbody>
            {data.map(r => {
              const pct      = r.budget>0 ? Math.min(150,Math.round(r.actual/r.budget*100)) : 0
              const varColor = VAR_COLOR(r.variance, r.type)
              const barColor = r.type==='expense'
                ? (pct<=100?'#28A745':'#DC3545')
                : (pct>=100?'#28A745':pct>=80?'#FFC107':'#DC3545')
              return (
                <tr key={r.category} style={{
                  fontWeight: r.category.includes('Profit')?700:400,
                  background: r.category.includes('Net')?'#F8F4F8':'transparent'
                }}>
                  <td style={{fontWeight:600}}>{r.category}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(r.budget)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR(r.actual)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:varColor}}>
                    {r.variance>=0?'+':''}{INR(r.variance)}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:varColor}}>
                    {r.variancePct>=0?'+':''}{r.variancePct}%
                  </td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,background:'#F0EEEB',borderRadius:4,height:8,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${Math.min(100,pct)}%`,
                          background:barColor,borderRadius:4,transition:'width .4s'}}/>
                      </div>
                      <span style={{fontSize:11,fontFamily:'DM Mono,monospace',
                        fontWeight:700,color:barColor,minWidth:36}}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
