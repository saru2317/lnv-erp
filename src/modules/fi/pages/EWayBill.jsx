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

export default function EWayBill() {
  const [bills, setBills] = useState([])
  const [loading,setLoading] = useState(true)

  useEffect(() => {
    // Load from sales invoices (dispatch data)
    const now = new Date()
    fetch(`${BASE_URL}/fi/gst/gstr1?month=${now.getMonth()+1}&year=${now.getFullYear()}`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setBills(d.invoices||[])).catch(()=>[])
      .finally(()=>setLoading(false))
  },[])

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">E-Way Bill <small>Consignment &gt; ₹50,000</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Sync</button>
          <button className="btn btn-p sd-bsm">Generate EWB</button>
        </div>
      </div>

      <div className="fi-alert info">
        E-Way Bill required for goods movement &gt; ₹50,000. Generate on NIC portal (ewaybillgst.gov.in). API integration pending.
      </div>

      <table className="fi-data-table">
        <thead><tr>
          <th>Invoice No.</th><th>Customer</th>
          <th style={{textAlign:'right'}}>Value</th>
          <th>EWB Status</th><th>Valid Till</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={6} style={{padding:30,textAlign:'center'}}>Loading...</td></tr>
          : bills.filter(b=>parseFloat(b.totalAmt||b.grandTotal||0)>=50000).length===0
          ? <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#6C757D'}}>No invoices above ₹50,000 this month</td></tr>
          : bills.filter(b=>parseFloat(b.totalAmt||b.grandTotal||0)>=50000).map((b,i)=>(
            <tr key={i}>
              <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:12,color:'var(--odoo-purple)'}}>{b.invoiceNo}</td>
              <td>{b.customerName||b.custName}</td>
              <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR(b.totalAmt||b.grandTotal||0)}</td>
              <td><span style={{background:'#FFF3CD',color:'#856404',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>Not Generated</span></td>
              <td style={{color:'#6C757D',fontSize:12}}>—</td>
              <td><button className="btn-xs">Generate EWB</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
