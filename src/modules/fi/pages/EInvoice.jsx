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

export default function EInvoice() {
  const nav = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const now = new Date()
    const m   = now.getMonth()+1
    const y   = now.getFullYear()
    fetch(`${BASE_URL}/fi/gst/gstr1?month=${m}&year=${y}`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setInvoices(d.invoices||d.data?.invoices||[])).catch(()=>[])
      .finally(()=>setLoading(false))
  }, [])

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">E-Invoice <small>IRN Generation · GST Portal</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Sync from Portal</button>
          <button className="btn btn-p sd-bsm">Generate Bulk IRN</button>
        </div>
      </div>

      <div className="fi-alert info">
        E-Invoice mandatory for turnover &gt; ₹5 Cr. IRN generated via NIC portal (IRP). Integration with GST portal API coming soon.
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Invoice No.</th><th>Customer</th><th>GSTIN</th>
          <th style={{textAlign:'right'}}>Amount</th>
          <th>IRN Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={6} style={{padding:30,textAlign:'center'}}>Loading...</td></tr>
          : invoices.length===0 ? <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#6C757D'}}>No invoices found</td></tr>
          : invoices.map((inv,i)=>(
            <tr key={i}>
              <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:12,color:'var(--odoo-purple)'}}>{inv.invoiceNo}</td>
              <td>{inv.customerName||inv.custName}</td>
              <td style={{fontFamily:'DM Mono,monospace',fontSize:11}}>{inv.gstNo||inv.gstin||'B2C'}</td>
              <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(inv.totalAmt||inv.grandTotal||0)}</td>
              <td><span style={{background:'#FFF3CD',color:'#856404',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>Pending IRN</span></td>
              <td><button className="btn-xs">Generate IRN</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ══════════════════════════════════════
// SAVE AS: EWayBill.jsx
// ══════════════════════════════════════
