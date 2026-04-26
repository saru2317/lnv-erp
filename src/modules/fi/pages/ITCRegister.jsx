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

export default function ITCRegister() {
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [rows,    setRows]    = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/gst/itc?month=${month}&year=${year}`, { headers: hdr2() })
      const d    = await res.json()
      setRows(d.data||[])
      setSummary({ totalCGST:d.totalCGST||0, totalSGST:d.totalSGST||0, totalIGST:d.totalIGST||0, totalITC:d.totalITC||0 })
    } catch {} finally { setLoading(false) }
  }, [month, year])
  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">ITC Register <small>Input Tax Credit — Purchase-wise</small></div>
        <div className="fi-lv-actions">
          <MonthYearPicker month={month} year={year} onChange={(m,y)=>{setMonth(m);setYear(y)}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        <GSTKpi label="Total ITC" cls="green"  value={INR(summary.totalITC||0)}  sub="Eligible credit"/>
        <GSTKpi label="CGST ITC"  cls="purple" value={INR(summary.totalCGST||0)} sub="Central"/>
        <GSTKpi label="SGST ITC"  cls="blue"   value={INR(summary.totalSGST||0)} sub="State"/>
        <GSTKpi label="IGST ITC"  cls="orange" value={INR(summary.totalIGST||0)} sub="Interstate"/>
      </div>

      {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading ITC Register...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>GRN / Bill No.</th><th>Vendor</th><th>Item</th><th>Date</th>
            <th style={{textAlign:'right'}}>Taxable</th>
            <th style={{textAlign:'right'}}>CGST</th>
            <th style={{textAlign:'right'}}>SGST</th>
            <th style={{textAlign:'right'}}>IGST</th>
            <th style={{textAlign:'center'}}>Eligible</th>
          </tr></thead>
          <tbody>
            {rows.length===0 ? (
              <tr><td colSpan={9} style={{padding:40,textAlign:'center',color:'#6C757D'}}>No ITC for {MONTHS[month]} {year}</td></tr>
            ) : rows.map((r,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color:'var(--odoo-purple)'}}>{r.grn?.grnNo||r.id}</td>
                <td style={{fontSize:12}}>{r.grn?.vendorName||'—'}</td>
                <td style={{fontSize:12,maxWidth:180}}>{r.itemName||r.description||'—'}</td>
                <td style={{fontSize:11}}>{r.grn?.grnDate?new Date(r.grn.grnDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(r.taxableAmt||r.amount||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(r.cgst||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(r.sgst||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#0C5460'}}>{INR(r.igst||0)}</td>
                <td style={{textAlign:'center'}}>
                  <span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>Eligible</span>
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length>0&&(
            <tfoot>
              <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #E0D5E0'}}>
                <td colSpan={4} style={{padding:'8px 12px',color:'#714B67'}}>TOTAL ITC</td>
                <td/>
                <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(summary.totalCGST)}</td>
                <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(summary.totalSGST)}</td>
                <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#0C5460'}}>{INR(summary.totalIGST)}</td>
                <td style={{padding:'8px 12px',textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:14,color:'#155724'}}>{INR(summary.totalITC)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// SAVE AS: GSTPayment.jsx
// ══════════════════════════════════════
