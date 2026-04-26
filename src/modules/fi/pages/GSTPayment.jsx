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

export default function GSTPayment() {
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [gstr3b,  setGstr3b]  = useState(null)
  const [cgst,    setCgst]    = useState(0)
  const [sgst,    setSgst]    = useState(0)
  const [igst,    setIgst]    = useState(0)
  const [bankAcct,setBankAcct]= useState('1200')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [paying,  setPaying]  = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/fi/gst/gstr3b?month=${month}&year=${year}`, { headers: hdr2() })
      const d   = await res.json()
      if (d.data) {
        setGstr3b(d.data)
        setCgst(d.data.netCGST || 0)
        setSgst(d.data.netSGST || 0)
        setIgst(d.data.netIGST || 0)
      }
    } catch {}
  }, [month, year])
  useEffect(() => { load() }, [load])

  const total = parseFloat(cgst||0) + parseFloat(sgst||0) + parseFloat(igst||0)

  const pay = async () => {
    if (total <= 0) return toast.error('No GST payable')
    setPaying(true)
    try {
      const res  = await fetch(`${BASE_URL}/fi/gst/payment`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ cgst, sgst, igst, bankAcct, paymentDate:payDate, period:`${MONTHS[month]}-${year}` })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
    } catch (e) { toast.error(e.message) }
    finally { setPaying(false) }
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">GST Payment <small>Monthly Tax Challan</small></div>
        <div className="fi-lv-actions">
          <MonthYearPicker month={month} year={year} onChange={(m,y)=>{setMonth(m);setYear(y)}}/>
          <button className="btn btn-s sd-bsm" onClick={load}>Load from GSTR-3B</button>
        </div>
      </div>

      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">GST Payment Challan — {MONTHS[month]} {year}</div>
        <div className="fi-form-sec-body">

          {gstr3b && (
            <div style={{background:'#D1ECF1',borderRadius:6,padding:'8px 14px',marginBottom:14,fontSize:12,color:'#0C5460'}}>
              Auto-loaded from GSTR-3B: Output CGST {INR(gstr3b.outputCGST)} − ITC {INR(gstr3b.itcCGST)} = Net {INR(gstr3b.netCGST)}
            </div>
          )}

          <table className="fi-data-table" style={{marginBottom:16}}>
            <thead><tr>
              <th>Tax Head</th>
              <th style={{textAlign:'right'}}>Output Tax</th>
              <th style={{textAlign:'right'}}>ITC Available</th>
              <th style={{textAlign:'right'}}>Net Payable (₹)</th>
              <th>Payment Mode</th>
            </tr></thead>
            <tbody>
              {[
                ['CGST', gstr3b?.outputCGST||0, gstr3b?.itcCGST||0, cgst, setCgst],
                ['SGST', gstr3b?.outputSGST||0, gstr3b?.itcSGST||0, sgst, setSgst],
                ['IGST', gstr3b?.outputIGST||0, gstr3b?.itcIGST||0, igst, setIgst],
              ].map(([head,out,itc,val,setVal])=>(
                <tr key={head}>
                  <td><strong>{head}</strong></td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(out)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#155724'}}>{INR(itc)}</td>
                  <td style={{textAlign:'right'}}>
                    <input type="number" className="fi-form-ctrl"
                      value={val} onChange={e=>setVal(parseFloat(e.target.value)||0)}
                      style={{width:120,textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}/>
                  </td>
                  <td>Electronic Cash Ledger (NEFT)</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:'#F8F4F8',fontWeight:800,borderTop:'2px solid #714B67'}}>
                <td colSpan={3} style={{padding:'10px 12px',color:'#714B67',fontSize:14}}>TOTAL PAYABLE</td>
                <td style={{padding:'10px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:18,color:total>0?'#856404':'#155724'}}>{INR(total)}</td>
                <td/>
              </tr>
            </tfoot>
          </table>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:'#495057',display:'block',marginBottom:4,textTransform:'uppercase'}}>Pay From Bank A/C</label>
              <select className="fi-form-ctrl" value={bankAcct} onChange={e=>setBankAcct(e.target.value)}>
                <option value="1200">1200 · Bank — Primary Account</option>
                <option value="1210">1210 · Bank — OD Account</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:'#495057',display:'block',marginBottom:4,textTransform:'uppercase'}}>Payment Date</label>
              <input type="date" className="fi-form-ctrl" value={payDate} onChange={e=>setPayDate(e.target.value)}/>
            </div>
            <div style={{display:'flex',alignItems:'flex-end'}}>
              <button className="btn btn-p sd-bsm" disabled={paying||total<=0} onClick={pay} style={{width:'100%',padding:'10px'}}>
                {paying ? 'Posting...' : `Pay ${INR(total)} & Post JV`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// SAVE AS: HSNSummary.jsx
// ══════════════════════════════════════
