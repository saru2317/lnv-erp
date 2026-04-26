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

export default function HSNSummary() {
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/gst/hsn?month=${month}&year=${year}`, { headers: hdr2() })
      const d    = await res.json()
      setRows(d.data||[])
    } catch {} finally { setLoading(false) }
  }, [month, year])
  useEffect(() => { load() }, [load])

  const totVal = rows.reduce((a,r)=>a+parseFloat(r.taxableAmt||0),0)
  const totTax = rows.reduce((a,r)=>a+(r.cgst||0)+(r.sgst||0)+(r.igst||0),0)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">HSN / SAC Summary <small>Mandatory in GSTR-1 · 4-digit HSN</small></div>
        <div className="fi-lv-actions">
          <MonthYearPicker month={month} year={year} onChange={(m,y)=>{setMonth(m);setYear(y)}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm">Push to GSTR-1</button>
        </div>
      </div>

      {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading HSN Summary...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>HSN/SAC Code</th><th>Description</th><th>UOM</th>
            <th style={{textAlign:'right'}}>Qty</th>
            <th style={{textAlign:'right'}}>Taxable Value</th>
            <th style={{textAlign:'right'}}>CGST</th>
            <th style={{textAlign:'right'}}>SGST</th>
            <th style={{textAlign:'right'}}>IGST</th>
            <th style={{textAlign:'right'}}>Total Tax</th>
          </tr></thead>
          <tbody>
            {rows.length===0 ? (
              <tr><td colSpan={9} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No HSN data for {MONTHS[month]} {year}.
                <br/><span style={{fontSize:12}}>Add HSN codes to Item Master to see this report.</span>
              </td></tr>
            ) : rows.map((r,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:13,color:'#714B67'}}>{r.hsn}</td>
                <td style={{fontSize:12}}>{r.description}</td>
                <td style={{fontSize:12}}>{r.uom}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{r.qty?.toLocaleString('en-IN')}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(r.taxableAmt)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(r.cgst||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(r.sgst||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#0C5460'}}>{INR(r.igst||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR((r.cgst||0)+(r.sgst||0)+(r.igst||0))}</td>
              </tr>
            ))}
          </tbody>
          {rows.length>0&&(
            <tfoot>
              <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #E0D5E0'}}>
                <td colSpan={4} style={{padding:'8px 12px',color:'#714B67'}}>TOTAL</td>
                <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(totVal)}</td>
                <td colSpan={3}/>
                <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:14}}>{INR(totTax)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// SAVE AS: RCMRegister.jsx
// ══════════════════════════════════════
