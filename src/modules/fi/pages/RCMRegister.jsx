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
  const [note,    setNote]    = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/gst/rcm?month=${month}&year=${year}`, { headers: hdr2() })
      const d    = await res.json()
      setRows(d.data||[])
      setTotal(d.totalRCM||0)
      setNote(d.note||null)
      if (d.zeroRecords > 0) {
        toast(`⚠️ ${d.zeroRecords} record(s) hidden — GSTIN missing but amount is ₹0 (bad data). Fix in Vendor Master.`, { icon:'⚠️', duration:5000 })
      }
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
        RCM applies when purchasing from unregistered vendors (no GSTIN). You must pay GST on their behalf and report in GSTR-3B Table 3.1(d). ITC can be claimed in Table 4 if item is eligible.
      </div>

      {note && (
        <div style={{ background:'#D1ECF1', border:'1px solid #BEE5EB', borderRadius:6,
          padding:'10px 14px', marginBottom:12, fontSize:12, color:'#0C5460' }}>
          ℹ️ {note}
        </div>
      )}

      {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>Ref No.</th><th>Vendor</th><th>GST Status</th><th>Date</th>
            <th style={{textAlign:'right'}}>Taxable</th>
            <th style={{textAlign:'right'}}>RCM CGST</th>
            <th style={{textAlign:'right'}}>RCM SGST</th>
            <th style={{textAlign:'right'}}>Total RCM</th>
          </tr></thead>
          <tbody>
            {rows.length===0 ? (
              <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No RCM purchases for {MONTHS[month]} {year}.<br/>
                <span style={{fontSize:11}}>Only vendors with blank GSTIN appear here.</span>
              </td></tr>
            ) : rows.map((r,i)=>(
              <tr key={i} style={{background:(r.rcmTotal||0)===0?'#FFFBF0':'transparent'}}>
                <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:12,color:'var(--odoo-purple)'}}>
                  {r.refNo || r.grnNo}
                  {r.source && <div><span style={{fontSize:9,background:'#F0EEEB',padding:'1px 4px',borderRadius:3,color:'#6C757D'}}>{r.source}</span></div>}
                </td>
                <td style={{fontWeight:600,fontSize:12}}>{r.vendorName}</td>
                <td><span style={{background:'#F8D7DA',color:'#721C24',padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:700}}>UNREGISTERED</span></td>
                <td style={{fontSize:11}}>{(r.date||r.grnDate)?new Date(r.date||r.grnDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(r.taxableAmt||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(r.rcmCGST||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(r.rcmSGST||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:(r.rcmTotal||0)>0?'#155724':'#856404'}}>{INR(r.rcmTotal||0)}</td>
              </tr>
            ))}
          </tbody>
          {rows.length>0&&(
            <tfoot>
              <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #E0D5E0'}}>
                <td colSpan={7} style={{padding:'8px 12px',color:'#714B67'}}>TOTAL RCM LIABILITY</td>
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
