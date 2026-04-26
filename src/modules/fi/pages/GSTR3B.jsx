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

export default function GSTR3B() {
  const nav = useNavigate()
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying,  setPaying]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/fi/gst/gstr3b?month=${month}&year=${year}`, { headers: hdr2() })
      const d   = await res.json()
      setData(d.data || null)
    } catch {} finally { setLoading(false) }
  }, [month, year])
  useEffect(() => { load() }, [load])

  const payGST = async () => {
    if (!data) return
    setPaying(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/gst/payment`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({
          cgst: data.netCGST, sgst: data.netSGST, igst: data.netIGST,
          bankAcct:'1200', period:`${MONTHS[month]}-${year}`,
          paymentDate: new Date().toISOString().split('T')[0],
        })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      load()
    } catch (e) { toast.error(e.message) }
    finally { setPaying(false) }
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">GSTR-3B <small>Monthly GST Return Summary</small></div>
        <div className="fi-lv-actions">
          <MonthYearPicker month={month} year={year} onChange={(m,y)=>{setMonth(m);setYear(y)}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm">Download JSON</button>
          <button className="btn btn-p sd-bsm">File on GST Portal</button>
        </div>
      </div>

      {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading GSTR-3B...</div>
      : data ? (
        <div>
          {/* Output GST */}
          <div style={{fontWeight:800,color:'#714B67',fontSize:13,marginBottom:10,marginTop:4}}>
            3.1 — Output Tax Liability
          </div>
          <div className="gst-sum-grid">
            {[
              {cl:'cgst',l:'CGST Output',  v:INR(data.outputCGST), s:`ITC: ${INR(data.itcCGST)} → Net: ${INR(data.netCGST)}`},
              {cl:'sgst',l:'SGST Output',  v:INR(data.outputSGST), s:`ITC: ${INR(data.itcSGST)} → Net: ${INR(data.netSGST)}`},
              {cl:'igst',l:'IGST Output',  v:INR(data.outputIGST), s:`ITC: ${INR(data.itcIGST)} → Net: ${INR(data.netIGST)}`},
            ].map(c=>(
              <div key={c.cl} className={`gst-card ${c.cl}`}>
                <label>{c.l}</label>
                <div className="gc-val">{c.v}</div>
                <div className="gc-sub">{c.s}</div>
              </div>
            ))}
          </div>

          {/* ITC Summary */}
          <div style={{fontWeight:800,color:'#714B67',fontSize:13,marginBottom:10,marginTop:16}}>
            4 — Eligible ITC
          </div>
          <div className="itc-box">
            {[
              ['ITC on Purchases (CGST)', INR(data.itcCGST)],
              ['ITC on Purchases (SGST)', INR(data.itcSGST)],
              ['ITC on Purchases (IGST)', INR(data.itcIGST)],
              ['Total ITC Available',     INR((data.itcCGST||0)+(data.itcSGST||0)+(data.itcIGST||0))],
            ].map(([l,v])=>(
              <div key={l} className="itc-row"><span>{l}</span><strong>{v}</strong></div>
            ))}
          </div>

          {/* Net payable */}
          <div style={{background: data.totalPayable>0?'#FFF3CD':'#D4EDDA',
            border:`1px solid ${data.totalPayable>0?'#FFEEBA':'#C3E6CB'}`,
            borderRadius:8, padding:'14px 20px', marginTop:16,
            display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:data.totalPayable>0?'#856404':'#155724'}}>
                {data.totalPayable>0 ? 'GST Payable' : 'No GST Due'}
              </div>
              <div style={{fontSize:12,color:'#6C757D',marginTop:4}}>
                Due by 20th of next month
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:24,color:data.totalPayable>0?'#856404':'#155724'}}>
                {INR(data.totalPayable||0)}
              </div>
              {data.totalPayable > 0 && (
                <button className="btn btn-p sd-bsm" disabled={paying} onClick={payGST} style={{marginTop:8}}>
                  {paying ? 'Posting...' : 'Pay & Post JV'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>No data for {MONTHS[month]} {year}</div>
      )}
    </div>
  )
}

// ══════════════════════════════════════
// SAVE AS: ITCRegister.jsx
// ══════════════════════════════════════
