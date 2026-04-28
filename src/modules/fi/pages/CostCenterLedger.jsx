import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const CC_COLORS = {
  'Production':  { color:'#155724', bg:'#D4EDDA' },
  'Admin':       { color:'#004085', bg:'#CCE5FF' },
  'Sales':       { color:'#856404', bg:'#FFF3CD' },
  'Maintenance': { color:'#721C24', bg:'#F8D7DA' },
}

export default function CostCenterLedger() {
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCC,setActiveCC]= useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/cost-center-ledger?month=${month}&year=${year}`, { headers: hdr2() })
      const d = await r.json()
      setData(d)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [month, year])

  useEffect(() => { load() }, [load])

  const rows = (data?.data || []).filter(r =>
    activeCC==='all' || r.cc===activeCC
  )
  const summary = data?.summary || []
  const total   = summary.reduce((a,s)=>a+s.amount,0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Cost Center Ledger
          <small> Expense allocation by department · {MONTHS[month]} {year}</small>
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

      {/* CC Summary cards */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:14}}>
        {summary.map(s=>{
          const cc = CC_COLORS[s.name] || { color:'#714B67', bg:'#EDE0EA' }
          const pct = total>0?Math.round(s.amount/total*100):0
          return (
            <div key={s.name} onClick={()=>setActiveCC(activeCC===s.name?'all':s.name)}
              style={{ background:activeCC===s.name?cc.bg:'#fff',
                border:`2px solid ${activeCC===s.name?cc.color:'#E0D5E0'}`,
                borderRadius:10, padding:'12px 14px', cursor:'pointer', transition:'all .15s' }}>
              <div style={{fontSize:11,fontWeight:700,color:cc.color,marginBottom:4}}>{s.name}</div>
              <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:18,color:cc.color}}>{INR(s.amount)}</div>
              <div style={{marginTop:6,background:'#F0EEEB',borderRadius:4,height:5,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:cc.color,borderRadius:4}}/>
              </div>
              <div style={{fontSize:10,color:'#6C757D',marginTop:3}}>{pct}% of total expenses</div>
            </div>
          )
        })}
      </div>

      {/* Filter chips */}
      <div style={{display:'flex',gap:6,marginBottom:12}}>
        <button onClick={()=>setActiveCC('all')} style={{
          padding:'4px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
          border:'1px solid #E0D5E0',
          background:activeCC==='all'?'#714B67':'#fff',
          color:activeCC==='all'?'#fff':'#6C757D'
        }}>All Departments</button>
        {Object.keys(CC_COLORS).map(cc=>(
          <button key={cc} onClick={()=>setActiveCC(activeCC===cc?'all':cc)} style={{
            padding:'4px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
            border:`1px solid ${activeCC===cc?CC_COLORS[cc].color:'#E0D5E0'}`,
            background:activeCC===cc?CC_COLORS[cc].color:'#fff',
            color:activeCC===cc?'#fff':CC_COLORS[cc].color
          }}>{cc}</button>
        ))}
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>JV No.</th><th>Date</th><th>Description</th>
            <th>Account</th><th>Cost Center</th>
            <th style={{textAlign:'right'}}>Amount</th>
          </tr></thead>
          <tbody>
            {rows.length===0 ? (
              <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No expense entries for {MONTHS[month]} {year}.
                Tag JV narrations with department names (Admin/Sales/Maintenance) for auto-allocation.
              </td></tr>
            ) : rows.map((r,i)=>{
              const cc = CC_COLORS[r.cc]||{color:'#714B67',bg:'#EDE0EA'}
              return (
                <tr key={i}>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{r.jeNo||'—'}</td>
                  <td style={{fontSize:11}}>{r.date?new Date(r.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                  <td style={{fontSize:12,maxWidth:220}}>{r.narration}</td>
                  <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{r.acct}</td>
                  <td>
                    <span style={{background:cc.bg,color:cc.color,
                      padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                      {r.cc}
                    </span>
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR(r.amount)}</td>
                </tr>
              )
            })}
          </tbody>
          {rows.length>0&&(
            <tfoot>
              <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #714B67'}}>
                <td colSpan={5} style={{padding:'9px 12px',color:'#714B67'}}>TOTAL</td>
                <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:14}}>
                  {INR(rows.reduce((a,r)=>a+r.amount,0))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  )
}
