import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })
const hdr  = () => ({ 'Content-Type':'application/json', Authorization: `Bearer ${getToken()}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function MonthYearPicker({ month, year, onChange }) {
  return (
    <div style={{display:'flex',gap:6,alignItems:'center'}}>
      <select className="sd-search" value={month} onChange={e=>onChange(parseInt(e.target.value),year)} style={{width:90}}>
        {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
      </select>
      <select className="sd-search" value={year} onChange={e=>onChange(month,parseInt(e.target.value))} style={{width:80}}>
        {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
      </select>
    </div>
  )
}

function GSTKpi({ label, value, sub, cls }) {
  return (
    <div className={`fi-kpi-card ${cls}`}>
      <div className="fi-kpi-label">{label}</div>
      <div className="fi-kpi-value">{value}</div>
      <div className="fi-kpi-sub">{sub}</div>
    </div>
  )
}

export default function RCMRegister() {
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [rows,    setRows]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/gst/rcm?month=${month}&year=${year}`, { headers: hdr2() })
      const d    = await res.json()
      setRows(d.data||[])
      setTotal(d.totalRCM||0)
    } catch {} finally { setLoading(false) }
  }, [month, year])
  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">RCM Register <small>Reverse Charge Mechanism — Unregistered Purchases</small></div>
        <div className="fi-lv-actions">
          <MonthYearPicker month={month} year={year} onChange={(m,y)=>{setMonth(m);setYear(y)}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
        </div>
      </div>

      <div className="fi-alert warn">
        RCM applies when purchasing from unregistered vendors. You must pay GST on their behalf and report in GSTR-3B Table 3.1(d).
      </div>

      {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>GRN No.</th><th>Vendor (Unregistered)</th><th>Date</th>
            <th style={{textAlign:'right'}}>Taxable</th>
            <th style={{textAlign:'right'}}>RCM CGST</th>
            <th style={{textAlign:'right'}}>RCM SGST</th>
            <th style={{textAlign:'right'}}>Total RCM</th>
          </tr></thead>
          <tbody>
            {rows.length===0 ? (
              <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No RCM purchases for {MONTHS[month]} {year}
              </td></tr>
            ) : rows.map((r,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:12,color:'var(--odoo-purple)'}}>{r.grnNo}</td>
                <td style={{fontWeight:600,fontSize:12}}>{r.vendorName}</td>
                <td style={{fontSize:11}}>{r.grnDate?new Date(r.grnDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(r.taxableAmt||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(r.rcmCGST||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(r.rcmSGST||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR((r.rcmCGST||0)+(r.rcmSGST||0))}</td>
              </tr>
            ))}
          </tbody>
          {rows.length>0&&(
            <tfoot>
              <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #E0D5E0'}}>
                <td colSpan={6} style={{padding:'8px 12px',color:'#714B67'}}>TOTAL RCM LIABILITY</td>
                <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:14}}>{INR(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// SAVE AS: GSTR9.jsx (Annual — computed from monthly data)
// ══════════════════════════════════════
