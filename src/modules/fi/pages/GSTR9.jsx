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

export default function GSTR9() {
  const [year,    setYear]    = useState(new Date().getFullYear())
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Load all 12 months and aggregate
      const results = await Promise.all(
        Array.from({length:12},(_,i)=>i+1).map(m =>
          fetch(`${BASE_URL}/fi/gst/gstr3b?month=${m}&year=${m<=3?year+1:year}`, { headers: hdr2() })
            .then(r=>r.json()).catch(()=>({data:null}))
        )
      )
      const agg = { outputCGST:0, outputSGST:0, outputIGST:0, itcCGST:0, itcSGST:0, itcIGST:0, totalPayable:0 }
      results.forEach(r => {
        if (!r.data) return
        agg.outputCGST   += r.data.outputCGST  ||0
        agg.outputSGST   += r.data.outputSGST  ||0
        agg.outputIGST   += r.data.outputIGST  ||0
        agg.itcCGST      += r.data.itcCGST     ||0
        agg.itcSGST      += r.data.itcSGST     ||0
        agg.itcIGST      += r.data.itcIGST     ||0
        agg.totalPayable += r.data.totalPayable ||0
      })
      setData(agg)
    } catch {} finally { setLoading(false) }
  }, [year])
  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">GSTR-9 <small>Annual GST Return — FY {year}–{year+1}</small></div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={year} onChange={e=>setYear(parseInt(e.target.value))} style={{width:100}}>
            {[2023,2024,2025,2026].map(y=><option key={y}>FY {y}-{y+1}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Compute</button>
          <button className="btn btn-s sd-bsm">Download JSON</button>
          <button className="btn btn-p sd-bsm">File GSTR-9</button>
        </div>
      </div>

      {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Computing Annual Summary...</div>
      : data ? (
        <div>
          <div className="fi-kpi-grid">
            <GSTKpi label="Total Output GST" cls="red"    value={INR((data.outputCGST)+(data.outputSGST)+(data.outputIGST))} sub="Full year"/>
            <GSTKpi label="Total ITC Claimed" cls="green" value={INR((data.itcCGST)+(data.itcSGST)+(data.itcIGST))} sub="Input credit"/>
            <GSTKpi label="Net GST Paid"      cls="orange"value={INR(data.totalPayable)} sub="Cash + ITC"/>
          </div>

          <table className="fi-data-table" style={{marginTop:14}}>
            <thead><tr>
              <th>Table</th><th>Description</th>
              <th style={{textAlign:'right'}}>CGST (₹)</th>
              <th style={{textAlign:'right'}}>SGST (₹)</th>
              <th style={{textAlign:'right'}}>IGST (₹)</th>
              <th style={{textAlign:'right'}}>Total (₹)</th>
            </tr></thead>
            <tbody>
              {[
                ['4A', 'Outward Taxable Supplies',    data.outputCGST, data.outputSGST, data.outputIGST],
                ['6A', 'ITC on Inward Supplies',      data.itcCGST,    data.itcSGST,    data.itcIGST],
                ['9',  'Net Tax Payable',              Math.max(0,data.outputCGST-data.itcCGST), Math.max(0,data.outputSGST-data.itcSGST), Math.max(0,data.outputIGST-data.itcIGST)],
                ['9',  'Total Tax Paid (Cash Ledger)', Math.max(0,data.outputCGST-data.itcCGST), Math.max(0,data.outputSGST-data.itcSGST), Math.max(0,data.outputIGST-data.itcIGST)],
              ].map(([tbl,desc,cgst,sgst,igst])=>(
                <tr key={tbl+desc}>
                  <td style={{fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67'}}>{tbl}</td>
                  <td style={{fontWeight:600}}>{desc}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(cgst||0)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(sgst||0)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(igst||0)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>{INR((cgst||0)+(sgst||0)+(igst||0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>No data found</div>}
    </div>
  )
}

// ══════════════════════════════════════
// SAVE AS: ITCReconciliation.jsx  (keep existing excellent UI, add live summary)
// ══════════════════════════════════════
