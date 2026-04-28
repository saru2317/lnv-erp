import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ProfitabilityReport() {
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/profitability?month=${month}&year=${year}`, { headers: hdr2() })
      const d = await r.json()
      setData(d)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [month, year])

  useEffect(() => { load() }, [load])

  const rows = data?.data || []

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Profitability Report
          <small> Customer-wise · {MONTHS[month]} {year}</small>
        </div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={month} onChange={e=>setMonth(parseInt(e.target.value))} style={{width:80}}>
            {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="sd-search" value={year} onChange={e=>setYear(parseInt(e.target.value))} style={{width:80}}>
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-alert info" style={{marginBottom:14}}>
        GP% is estimated at 35% (standard costing). Link PP Work Orders for actual product cost.
      </div>

      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:14}}>
        {[
          { cls:'purple', label:'Total Revenue',   val:INR(data?.totalRevenue||0), sub:`${rows.length} customers` },
          { cls:'orange', label:'Total Cost',      val:INR(data?.totalCost||0),    sub:'Estimated COGS' },
          { cls:'green',  label:'Gross Profit',    val:INR(data?.totalGP||0),      sub:`${data?.totalGPPct||0}% GP%` },
          { cls:'blue',   label:'Top Customer',    val:rows[0]?.name||'—',         sub:rows[0]?INR(rows[0].revenue):'' },
        ].map(k=>(
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value" style={{fontSize:rows[0]?.name===k.val?13:undefined}}>{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>#</th>
            <th>Customer</th>
            <th style={{textAlign:'center'}}>Invoices</th>
            <th style={{textAlign:'right'}}>Revenue</th>
            <th style={{textAlign:'right'}}>Est. Cost</th>
            <th style={{textAlign:'right'}}>Gross Profit</th>
            <th style={{textAlign:'center'}}>GP %</th>
            <th style={{width:140}}>Revenue Share</th>
          </tr></thead>
          <tbody>
            {rows.length===0 ? (
              <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No invoices for {MONTHS[month]} {year}
              </td></tr>
            ) : rows.map((r,i)=>{
              const share = data?.totalRevenue>0 ? Math.round(r.revenue/data.totalRevenue*100) : 0
              const gpColor = r.gpPct>=30?'#155724':r.gpPct>=20?'#856404':'#DC3545'
              return (
                <tr key={i}>
                  <td style={{color:'#6C757D',fontSize:11}}>{i+1}</td>
                  <td style={{fontWeight:700,fontSize:12}}>{r.name}</td>
                  <td style={{textAlign:'center',fontFamily:'DM Mono,monospace'}}>{r.invoices}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR(r.revenue)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#6C757D'}}>{INR(r.cost)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,color:'#155724'}}>{INR(r.gp)}</td>
                  <td style={{textAlign:'center'}}>
                    <span style={{background:gpColor+'22',color:gpColor,
                      padding:'2px 10px',borderRadius:10,fontSize:12,fontWeight:800}}>
                      {r.gpPct}%
                    </span>
                  </td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{flex:1,background:'#F0EEEB',borderRadius:3,height:7,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${share}%`,background:'#714B67',borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:11,fontFamily:'DM Mono,monospace',color:'#714B67',minWidth:28}}>{share}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {rows.length>0&&(
            <tfoot>
              <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #714B67'}}>
                <td colSpan={3} style={{padding:'9px 12px',color:'#714B67'}}>TOTAL</td>
                <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(data?.totalRevenue)}</td>
                <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#6C757D'}}>{INR(data?.totalCost)}</td>
                <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:14,color:'#155724'}}>{INR(data?.totalGP)}</td>
                <td style={{padding:'9px 12px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:800,color:'#155724'}}>{data?.totalGPPct}%</td>
                <td/>
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  )
}
