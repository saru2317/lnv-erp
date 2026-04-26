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

export default function GSTR1() {
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/gst/gstr1?month=${month}&year=${year}`, { headers: hdr2() })
      const d    = await res.json()
      setData(d.data ? d : null)
    } catch {} finally { setLoading(false) }
  }, [month, year])
  useEffect(() => { load() }, [load])

  const invoices = data?.invoices || []
  const b2b = invoices.filter(i=>i.gstNo||i.gstin)
  const b2c = invoices.filter(i=>!i.gstNo&&!i.gstin)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">GSTR-1 <small>Outward Supply Register</small></div>
        <div className="fi-lv-actions">
          <MonthYearPicker month={month} year={year} onChange={(m,y)=>{setMonth(m);setYear(y)}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm">Download JSON</button>
          <button className="btn btn-p sd-bsm">File GSTR-1</button>
        </div>
      </div>

      <div className="fi-kpi-grid">
        <GSTKpi label="B2B Invoices"     cls="purple" value={b2b.length}     sub={`${INR(data?.totalTaxable||0)} taxable`}/>
        <GSTKpi label="B2C Invoices"     cls="orange" value={b2c.length}     sub="Small consumers"/>
        <GSTKpi label="Total Output GST" cls="green"  value={INR((data?.totalCGST||0)+(data?.totalSGST||0)+(data?.totalIGST||0))} sub="CGST + SGST + IGST"/>
        <GSTKpi label="IGST (Interstate)"cls="blue"   value={INR(data?.totalIGST||0)} sub="Cross-state supplies"/>
      </div>

      {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading GSTR-1...</div> : (
        <table className="fi-data-table">
          <thead><tr>
            <th>Invoice No.</th><th>Customer</th><th>GSTIN</th><th>Date</th>
            <th style={{textAlign:'right'}}>Taxable</th>
            <th style={{textAlign:'right'}}>CGST</th>
            <th style={{textAlign:'right'}}>SGST</th>
            <th style={{textAlign:'right'}}>IGST</th>
            <th style={{textAlign:'right'}}>Total</th>
            <th>Status</th>
          </tr></thead>
          <tbody>
            {invoices.length===0 ? (
              <tr><td colSpan={10} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No invoices for {MONTHS[month]} {year}
              </td></tr>
            ) : invoices.map((inv,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'var(--odoo-purple)',fontSize:12}}>{inv.invoiceNo}</td>
                <td style={{fontWeight:600,fontSize:12}}>{inv.customerName||inv.custName}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{inv.gstNo||inv.gstin||'B2C'}</td>
                <td style={{fontSize:11}}>{inv.invoiceDate?new Date(inv.invoiceDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'—'}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(inv.taxableAmt||inv.amount||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(inv.cgst||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(inv.sgst||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#0C5460'}}>{INR(inv.igst||0)}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR(inv.totalAmt||inv.grandTotal||0)}</td>
                <td><span className="badge badge-posted">Filed</span></td>
              </tr>
            ))}
          </tbody>
          {invoices.length>0&&(
            <tfoot>
              <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #E0D5E0'}}>
                <td colSpan={4} style={{padding:'8px 12px',color:'#714B67'}}>TOTAL — {invoices.length} invoices</td>
                <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(data?.totalTaxable||0)}</td>
                <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(data?.totalCGST||0)}</td>
                <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#714B67'}}>{INR(data?.totalSGST||0)}</td>
                <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#0C5460'}}>{INR(data?.totalIGST||0)}</td>
                <td style={{padding:'8px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:14}}>{INR((data?.totalCGST||0)+(data?.totalSGST||0)+(data?.totalIGST||0))}</td>
                <td/>
              </tr>
            </tfoot>
          )}
        </table>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// SAVE AS: GSTR2B.jsx
// ══════════════════════════════════════
