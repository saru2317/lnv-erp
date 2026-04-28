import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function CashFlow() {
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/cash-flow?month=${month}&year=${year}`, { headers: hdr2() })
      const d = await r.json()
      setData(d)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [month, year])

  useEffect(() => { load() }, [load])

  const Section = ({ title, color, bg, rows, total }) => (
    <div style={{ background:'#fff', border:`1.5px solid ${color}33`, borderRadius:10,
      overflow:'hidden', marginBottom:12 }}>
      <div style={{ background:bg, padding:'10px 16px', display:'flex',
        justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontWeight:800, fontSize:13, color }}>{title}</div>
        <div style={{ fontFamily:'DM Mono,monospace', fontWeight:800, fontSize:15,
          color: total>=0 ? '#155724' : '#DC3545' }}>
          {total>=0?'+':''}{INR(total)}
        </div>
      </div>
      {rows.map(([label, amt, isTotal]) => (
        <div key={label} style={{ display:'flex', justifyContent:'space-between',
          padding:'7px 16px', borderTop:'1px solid #F0EEEB',
          background: isTotal ? '#F8F4F8' : 'transparent',
          fontWeight: isTotal ? 700 : 400 }}>
          <span style={{ fontSize:12, color: isTotal?color:'#495057' }}>{label}</span>
          <span style={{ fontFamily:'DM Mono,monospace', fontSize:12,
            color: amt<0?'#DC3545':isTotal?color:'#333' }}>
            {amt<0?'('+INR(Math.abs(amt))+')':INR(amt)}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Cash Flow Statement
          <small> {MONTHS[month]} {year}</small>
        </div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={month} onChange={e=>setMonth(parseInt(e.target.value))} style={{width:80}}>
            {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="sd-search" value={year} onChange={e=>setYear(parseInt(e.target.value))} style={{width:80}}>
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div>
      : data ? (
        <div>
          {/* Net Cash Flow banner */}
          <div style={{ padding:'16px 20px', borderRadius:10, marginBottom:16,
            background: data.netCF>=0?'#D4EDDA':'#F8D7DA',
            border:`1.5px solid ${data.netCF>=0?'#C3E6CB':'#F5C6CB'}`,
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:800, fontSize:18,
                color:data.netCF>=0?'#155724':'#721C24' }}>
                Net Cash Flow — {MONTHS[month]} {year}
              </div>
              <div style={{ fontSize:12, color:'#6C757D', marginTop:2 }}>
                Operating + Investing + Financing
              </div>
            </div>
            <div style={{ fontFamily:'DM Mono,monospace', fontWeight:800, fontSize:28,
              color:data.netCF>=0?'#155724':'#721C24' }}>
              {data.netCF>=0?'+':''}{INR(data.netCF)}
            </div>
          </div>

          <Section
            title="A. Operating Activities"
            color="#155724" bg="#D4EDDA"
            total={data.operating?.total||0}
            rows={[
              ['Receipts from Customers',     data.operating?.custReceipts||0,  false],
              ['Payments to Vendors',          -(data.operating?.vendPayments||0), false],
              ['Salaries & Wages',             -(data.operating?.salaryPay||0),  false],
              ['Other Operating Expenses',     -(data.operating?.expensePay||0), false],
              ['Net Cash from Operations',     data.operating?.total||0,         true ],
            ]}
          />

          <Section
            title="B. Investing Activities"
            color="#004085" bg="#CCE5FF"
            total={data.investing?.total||0}
            rows={[
              ['Fixed Asset Acquisitions',     -(data.investing?.fasAcq||0),     false],
              ['Net Cash from Investing',       data.investing?.total||0,        true ],
            ]}
          />

          <Section
            title="C. Financing Activities"
            color="#856404" bg="#FFF3CD"
            total={data.financing?.total||0}
            rows={[
              ['Loan Receipts',                data.financing?.loanIn||0,        false],
              ['Loan Repayments',              -(data.financing?.loanOut||0),    false],
              ['Net Cash from Financing',      data.financing?.total||0,         true ],
            ]}
          />
        </div>
      ) : <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>No data</div>}
    </div>
  )
}
