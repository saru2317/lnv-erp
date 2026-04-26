import React, { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ Authorization: `Bearer ${getToken()}` })

const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
const MONTHS_FULL = ['April','May','June','July','August','September',
  'October','November','December','January','February','March']
const FMT  = n => Number(n||0).toLocaleString('en-IN')
const FMTL = n => (Number(n||0)/100000).toFixed(2) // in Lakhs
const FMTC = n => '₹'+FMT(n)

export default function PayBillControl() {
  const fyStart = new Date().getMonth() >= 3
    ? new Date().getFullYear() : new Date().getFullYear()-1
  const [fy,       setFY]       = useState(fyStart)
  const [slips,    setSlips]    = useState([])
  const [employees,setEmployees]= useState([])
  const [loading,  setLoading]  = useState(true)
  const [view,     setView]     = useState('monthwise') // monthwise | empwise | summary
  const [category, setCategory] = useState('All')
  const [dept,     setDept]     = useState('All')
  const printRef = useRef()

  // FY months: Apr(4) to Mar(3) of next year
  const fyMonths = [4,5,6,7,8,9,10,11,12,1,2,3]
  const fyLabel  = `${fy}-${String(fy+1).slice(2)}`

  const getYearForMonth = m => m >= 4 ? fy : fy+1

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all slips for FY
      const allSlips = []
      for (const m of fyMonths) {
        const y = getYearForMonth(m)
        const res = await fetch(
          `${BASE_URL}/payroll/slips?month=${m}&year=${y}`,
          { headers:authHdrs() })
        const data = await res.json()
        if (data.data) allSlips.push(...data.data)
      }
      setSlips(allSlips)

      const eRes = await fetch(`${BASE_URL}/employees`, { headers:authHdrs() })
      const eData = await eRes.json()
      setEmployees(eData.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [fy])

  useEffect(()=>{ fetchData() }, [fetchData])

  // Build month-wise summary
  const monthSummary = fyMonths.map((m,idx) => {
    const monthSlips = slips.filter(s=>s.month===m && s.year===getYearForMonth(m))
    const filtered   = monthSlips.filter(s =>
      (category==='All'||s.category===category) &&
      (dept==='All'||s.department===dept))
    return {
      month: MONTHS[idx],
      monthNo: m,
      employees: filtered.length,
      gross:     filtered.reduce((s,sl)=>s+parseFloat(sl.grossEarnings||0),0),
      pf:        filtered.reduce((s,sl)=>s+parseFloat(sl.pfEmployee||0),0),
      esi:       filtered.reduce((s,sl)=>s+parseFloat(sl.esiEmployee||0),0),
      pt:        filtered.reduce((s,sl)=>s+parseFloat(sl.pt||0),0),
      lop:       filtered.reduce((s,sl)=>s+parseFloat(sl.lopDeduction||0),0),
      net:       filtered.reduce((s,sl)=>s+parseFloat(sl.netPay||0),0),
      paid:      filtered.filter(s=>s.paymentStatus==='PAID').length,
      pending:   filtered.filter(s=>s.paymentStatus==='PENDING').length,
    }
  })

  // Build employee-wise FY summary
  const empMap = {}
  slips.forEach(s => {
    if (!empMap[s.empCode]) {
      empMap[s.empCode] = {
        empCode:s.empCode, empName:s.empName,
        department:s.department, category:s.category,
        months:{}, totalGross:0, totalNet:0, totalPF:0, totalESI:0
      }
    }
    const mIdx = fyMonths.indexOf(s.month)
    if (mIdx>=0) empMap[s.empCode].months[mIdx] = parseFloat(s.netPay||0)
    empMap[s.empCode].totalGross += parseFloat(s.grossEarnings||0)
    empMap[s.empCode].totalNet   += parseFloat(s.netPay||0)
    empMap[s.empCode].totalPF    += parseFloat(s.pfEmployee||0)
    empMap[s.empCode].totalESI   += parseFloat(s.esiEmployee||0)
  })
  const empList = Object.values(empMap).filter(e =>
    (category==='All'||e.category===category) &&
    (dept==='All'||e.department===dept))

  // Overall totals
  const totals = {
    gross: monthSummary.reduce((s,m)=>s+m.gross,0),
    net:   monthSummary.reduce((s,m)=>s+m.net,0),
    pf:    monthSummary.reduce((s,m)=>s+m.pf,0),
    esi:   monthSummary.reduce((s,m)=>s+m.esi,0),
    lop:   monthSummary.reduce((s,m)=>s+m.lop,0),
  }

  const depts = ['All',...new Set(employees.map(e=>e.department).filter(Boolean))]

  const handlePrint = () => {
    const w = window.open('','_blank')
    w.document.write(`<html><head>
      <title>Pay Bill Control ${fyLabel}</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:9px;margin:10px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ccc;padding:3px 5px;text-align:right}
        th{background:#714B67;color:#fff;text-align:center}
        .left{text-align:left}
        .total{background:#EDE0EA;font-weight:bold}
        @media print{@page{size:A3 landscape;margin:8mm}}
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>`)
    w.document.close(); w.focus()
    setTimeout(()=>{w.print();w.close()},500)
  }

  return (
    <div style={{ padding:16, background:'#F8F7FA', minHeight:'100%' }}>
      {/* Header */}
      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
        padding:'12px 16px', marginBottom:14,
        display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800,
          fontSize:16, color:'#714B67' }}>
          💰 Employee Cost Control Plan
        </div>
        <div style={{ fontSize:12, color:'#6C757D',
          background:'#EDE0EA', padding:'3px 10px', borderRadius:10,
          fontWeight:700 }}>FY {fyLabel}</div>

        {/* FY selector */}
        <select value={fy} onChange={e=>setFY(parseInt(e.target.value))}
          style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
            borderRadius:5, fontSize:12, cursor:'pointer' }}>
          {[2023,2024,2025,2026].map(y=>(
            <option key={y} value={y}>{y}-{String(y+1).slice(2)}</option>
          ))}
        </select>

        {/* Category */}
        <select value={category} onChange={e=>setCategory(e.target.value)}
          style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
            borderRadius:5, fontSize:12, cursor:'pointer' }}>
          {['All','Worker','Staff','Contractor'].map(c=><option key={c}>{c}</option>)}
        </select>

        {/* Dept */}
        <select value={dept} onChange={e=>setDept(e.target.value)}
          style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
            borderRadius:5, fontSize:12, cursor:'pointer' }}>
          {depts.map(d=><option key={d}>{d}</option>)}
        </select>

        {/* View toggle */}
        <div style={{ display:'flex', gap:0, borderRadius:6,
          overflow:'hidden', border:'1px solid #E0D5E0' }}>
          {[['monthwise','📅 Month Wise'],['empwise','👤 Emp Wise'],
            ['summary','📊 Summary']].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)}
              style={{ padding:'6px 12px', border:'none', cursor:'pointer',
                fontSize:11, fontWeight:600,
                background:view===v?'#714B67':'#fff',
                color:view===v?'#fff':'#6C757D' }}>{l}</button>
          ))}
        </div>

        <button onClick={handlePrint}
          style={{ marginLeft:'auto', padding:'6px 16px',
            background:'#714B67', color:'#fff', border:'none',
            borderRadius:5, fontSize:12, cursor:'pointer', fontWeight:700 }}>
          🖨️ Print
        </button>
      </div>

      {/* FY KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          { l:'Total Gross (FY)',    v:FMTC(totals.gross), c:'#0C5460', bg:'#D1ECF1' },
          { l:'Total PF (FY)',       v:FMTC(totals.pf),    c:'#714B67', bg:'#EDE0EA' },
          { l:'Total ESI (FY)',      v:FMTC(totals.esi),   c:'#856404', bg:'#FFF3CD' },
          { l:'LOP Deductions (FY)', v:FMTC(totals.lop),   c:'#DC3545', bg:'#F8D7DA' },
          { l:'Net Paid (FY)',       v:FMTC(totals.net),   c:'#155724', bg:'#D4EDDA' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg, borderRadius:8,
            padding:'10px 14px', border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c, fontWeight:700,
              textTransform:'uppercase', letterSpacing:.4 }}>{k.l}</div>
            <div style={{ fontSize:16, fontWeight:800, color:k.c,
              fontFamily:'Syne,sans-serif', marginTop:2 }}>{k.v}</div>
            <div style={{ fontSize:10, color:k.c, opacity:.7 }}>
              ₹{FMTL(totals.net)} L
            </div>
          </div>
        ))}
      </div>

      <div ref={printRef}>
        {/* Print title */}
        <div style={{ textAlign:'center', marginBottom:10,
          padding:'6px 0', borderBottom:'2px solid #714B67' }}>
          <div style={{ fontWeight:800, fontSize:14 }}>
            Employee Cost Control Plan — FY {fyLabel}
          </div>
          <div style={{ fontSize:11, color:'#6C757D' }}>
            {category!=='All'?`Category: ${category} | `:''}
            {dept!=='All'?`Dept: ${dept}`:'All Departments'} |
            Value in ₹
          </div>
        </div>

        {/* ── MONTH WISE VIEW ── */}
        {view==='monthwise' && (
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
            overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead style={{ background:'#714B67' }}>
                <tr>
                  {['Month','Employees','Gross Salary','PF Dedn',
                    'ESI Dedn','PT','LOP Dedn','Total Dedn',
                    'Net Payable','Paid','Pending','Status'].map(h=>(
                    <th key={h} style={{ padding:'10px 12px', fontSize:10,
                      fontWeight:700, color:'#fff', textAlign:'center',
                      whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthSummary.map((m,i)=>(
                  <tr key={m.month} style={{ borderBottom:'1px solid #F0EEF0',
                    background: m.net===0?'#F8F9FA':i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'9px 12px', fontWeight:700,
                      color:'#714B67', fontSize:13 }}>{m.month}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center',
                      fontWeight:600 }}>{m.employees||'—'}</td>
                    <td style={{ padding:'9px 12px', textAlign:'right',
                      fontFamily:'DM Mono,monospace', fontSize:12 }}>
                      {m.gross>0?FMTC(m.gross):'—'}</td>
                    <td style={{ padding:'9px 12px', textAlign:'right',
                      fontFamily:'DM Mono,monospace', fontSize:11,
                      color:'#714B67' }}>
                      {m.pf>0?FMTC(m.pf):'—'}</td>
                    <td style={{ padding:'9px 12px', textAlign:'right',
                      fontFamily:'DM Mono,monospace', fontSize:11,
                      color:'#856404' }}>
                      {m.esi>0?FMTC(m.esi):'—'}</td>
                    <td style={{ padding:'9px 12px', textAlign:'right',
                      fontFamily:'DM Mono,monospace', fontSize:11,
                      color:'#0C5460' }}>
                      {m.pt>0?FMTC(m.pt):'—'}</td>
                    <td style={{ padding:'9px 12px', textAlign:'right',
                      fontFamily:'DM Mono,monospace', fontSize:11,
                      color:'#DC3545' }}>
                      {m.lop>0?FMTC(m.lop):'—'}</td>
                    <td style={{ padding:'9px 12px', textAlign:'right',
                      fontFamily:'DM Mono,monospace', fontSize:11,
                      color:'#721C24' }}>
                      {m.gross>0?FMTC(m.pf+m.esi+m.pt+m.lop):'—'}</td>
                    <td style={{ padding:'9px 12px', textAlign:'right',
                      fontFamily:'DM Mono,monospace', fontSize:13,
                      fontWeight:800, color:'#155724' }}>
                      {m.net>0?FMTC(m.net):'—'}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center',
                      fontWeight:700, color:'#155724' }}>
                      {m.paid>0?m.paid:'—'}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center',
                      fontWeight:700,
                      color:m.pending>0?'#856404':'#6C757D' }}>
                      {m.pending>0?m.pending:'—'}</td>
                    <td style={{ padding:'9px 12px', textAlign:'center' }}>
                      {m.net===0 ? (
                        <span style={{ fontSize:10, color:'#6C757D' }}>—</span>
                      ) : m.pending===0 ? (
                        <span style={{ padding:'2px 8px', borderRadius:10,
                          fontSize:10, fontWeight:700,
                          background:'#D4EDDA', color:'#155724' }}>✅ PAID</span>
                      ) : (
                        <span style={{ padding:'2px 8px', borderRadius:10,
                          fontSize:10, fontWeight:700,
                          background:'#FFF3CD', color:'#856404' }}>⏳ PENDING</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals row */}
              <tfoot style={{ background:'#EDE0EA',
                borderTop:'2px solid #714B67' }}>
                <tr>
                  <td style={{ padding:'10px 12px', fontWeight:800,
                    color:'#714B67', fontSize:13 }}>
                    ANNUAL TOTAL
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'center',
                    fontWeight:800, color:'#714B67' }}>
                    {monthSummary.reduce((s,m)=>s+m.employees,0)}
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'right',
                    fontFamily:'DM Mono,monospace', fontWeight:800,
                    fontSize:13 }}>{FMTC(totals.gross)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right',
                    fontFamily:'DM Mono,monospace', fontWeight:800,
                    color:'#714B67' }}>{FMTC(totals.pf)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right',
                    fontFamily:'DM Mono,monospace', fontWeight:800,
                    color:'#856404' }}>{FMTC(totals.esi)}</td>
                  <td />
                  <td style={{ padding:'10px 12px', textAlign:'right',
                    fontFamily:'DM Mono,monospace', fontWeight:800,
                    color:'#DC3545' }}>{FMTC(totals.lop)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right',
                    fontFamily:'DM Mono,monospace', fontWeight:800 }}>
                    {FMTC(totals.pf+totals.esi+totals.lop)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right',
                    fontFamily:'DM Mono,monospace', fontWeight:800,
                    fontSize:14, color:'#155724' }}>{FMTC(totals.net)}</td>
                  <td colSpan={3} style={{ padding:'10px 12px',
                    textAlign:'center', fontSize:11, color:'#714B67',
                    fontWeight:700 }}>₹{FMTL(totals.net)} Lakhs</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── EMP WISE VIEW (like Autocats format) ── */}
        {view==='empwise' && (
          <div style={{ overflowX:'auto', border:'1px solid #E0D5E0',
            borderRadius:8, overflow:'hidden' }}>
            <table style={{ borderCollapse:'collapse', fontSize:11,
              background:'#fff', minWidth:1400 }}>
              <thead style={{ background:'#714B67',
                position:'sticky', top:0, zIndex:10 }}>
                <tr>
                  <th style={{ padding:'8px 10px', color:'#fff',
                    fontSize:10, fontWeight:700, textAlign:'left',
                    minWidth:40 }}>Sl</th>
                  <th style={{ padding:'8px 10px', color:'#fff',
                    fontSize:10, fontWeight:700, textAlign:'left',
                    minWidth:60 }}>Emp Code</th>
                  <th style={{ padding:'8px 10px', color:'#fff',
                    fontSize:10, fontWeight:700, textAlign:'left',
                    minWidth:140 }}>Employee Name</th>
                  <th style={{ padding:'8px 10px', color:'#fff',
                    fontSize:10, fontWeight:700, textAlign:'left',
                    minWidth:80 }}>Dept</th>
                  <th style={{ padding:'8px 10px', color:'#fff',
                    fontSize:10, fontWeight:700, textAlign:'center',
                    minWidth:50 }}>Cat</th>
                  {MONTHS.map(m=>(
                    <th key={m} style={{ padding:'8px 6px', color:'#fff',
                      fontSize:9, fontWeight:700, textAlign:'right',
                      minWidth:70 }}>{m}</th>
                  ))}
                  <th style={{ padding:'8px 10px', color:'#FFD700',
                    fontSize:10, fontWeight:800, textAlign:'right',
                    minWidth:90 }}>FY Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={18} style={{ padding:40,
                    textAlign:'center', color:'#6C757D' }}>⏳ Loading...</td></tr>
                ) : empList.length===0 ? (
                  <tr><td colSpan={18} style={{ padding:40,
                    textAlign:'center', color:'#6C757D' }}>
                    No payroll data for FY {fyLabel}. Run payroll first!
                  </td></tr>
                ) : empList.map((e,i)=>(
                  <tr key={e.empCode} style={{ borderBottom:'1px solid #F0EEF0',
                    background:i%2===0?'#fff':'#FDFBFD' }}>
                    <td style={{ padding:'7px 10px', color:'#6C757D',
                      textAlign:'center', fontSize:10 }}>{i+1}</td>
                    <td style={{ padding:'7px 10px',
                      fontFamily:'DM Mono,monospace', fontWeight:700,
                      color:'#714B67', fontSize:10 }}>{e.empCode}</td>
                    <td style={{ padding:'7px 10px', fontWeight:600,
                      fontSize:12 }}>{e.empName}</td>
                    <td style={{ padding:'7px 10px', fontSize:10,
                      color:'#6C757D' }}>{e.department}</td>
                    <td style={{ padding:'7px 10px', textAlign:'center' }}>
                      <span style={{ padding:'1px 6px', borderRadius:10,
                        fontSize:9, fontWeight:700,
                        background:e.category==='Worker'?'#FDE8D8':
                          e.category==='Staff'?'#D1ECF1':'#EDE0EA',
                        color:e.category==='Worker'?'#E06F39':
                          e.category==='Staff'?'#0C5460':'#714B67' }}>
                        {e.category?.slice(0,2)||'WK'}
                      </span>
                    </td>
                    {fyMonths.map((_,idx)=>{
                      const val = e.months[idx]||0
                      return (
                        <td key={idx} style={{ padding:'7px 6px',
                          textAlign:'right',
                          fontFamily:'DM Mono,monospace', fontSize:10,
                          color:val>0?'#1C1C1C':'#CCC' }}>
                          {val>0?FMT(val):'—'}
                        </td>
                      )
                    })}
                    <td style={{ padding:'7px 10px', textAlign:'right',
                      fontFamily:'DM Mono,monospace', fontSize:12,
                      fontWeight:800, color:'#155724',
                      background:'#F0FFF4' }}>
                      {FMTC(e.totalNet)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals */}
              {empList.length>0 && (
                <tfoot style={{ background:'#EDE0EA',
                  borderTop:'2px solid #714B67',
                  position:'sticky', bottom:0 }}>
                  <tr>
                    <td colSpan={5} style={{ padding:'8px 10px',
                      fontWeight:800, color:'#714B67', fontSize:12 }}>
                      TOTAL ({empList.length} employees)
                    </td>
                    {fyMonths.map((_,idx)=>{
                      const monthTotal = empList.reduce((s,e)=>s+(e.months[idx]||0),0)
                      return (
                        <td key={idx} style={{ padding:'8px 6px',
                          textAlign:'right',
                          fontFamily:'DM Mono,monospace', fontSize:11,
                          fontWeight:800,
                          color:monthTotal>0?'#155724':'#CCC' }}>
                          {monthTotal>0?FMT(monthTotal):'—'}
                        </td>
                      )
                    })}
                    <td style={{ padding:'8px 10px', textAlign:'right',
                      fontFamily:'DM Mono,monospace', fontSize:13,
                      fontWeight:800, color:'#155724',
                      background:'#D4EDDA' }}>
                      {FMTC(empList.reduce((s,e)=>s+e.totalNet,0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* ── SUMMARY VIEW (category wise like pay bill) ── */}
        {view==='summary' && (
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
            overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead style={{ background:'#714B67' }}>
                <tr>
                  <th style={{ padding:'10px 12px', color:'#fff',
                    textAlign:'left', fontSize:10 }}>Category</th>
                  <th style={{ padding:'10px 12px', color:'#fff',
                    textAlign:'center', fontSize:10 }}>Employees</th>
                  {MONTHS.map(m=>(
                    <th key={m} style={{ padding:'10px 8px', color:'#fff',
                      textAlign:'right', fontSize:9 }}>{m}</th>
                  ))}
                  <th style={{ padding:'10px 12px', color:'#FFD700',
                    textAlign:'right', fontSize:10, fontWeight:800 }}>FY Total</th>
                </tr>
              </thead>
              <tbody>
                {['Worker','Staff','Contractor'].map((cat,ci)=>{
                  const catSlips = slips.filter(s=>s.category===cat)
                  const catMonths = fyMonths.map(m=>{
                    const ms = catSlips.filter(s=>s.month===m && s.year===getYearForMonth(m))
                    return ms.reduce((s,sl)=>s+parseFloat(sl.netPay||0),0)
                  })
                  const catTotal = catMonths.reduce((s,v)=>s+v,0)
                  const catEmps  = new Set(catSlips.map(s=>s.empCode)).size
                  if (catEmps===0) return null
                  return (
                    <tr key={cat} style={{ borderBottom:'1px solid #F0EEF0',
                      background:ci%2===0?'#fff':'#FDFBFD' }}>
                      <td style={{ padding:'9px 12px', fontWeight:700,
                        fontSize:13, color:'#714B67' }}>{cat}</td>
                      <td style={{ padding:'9px 12px', textAlign:'center',
                        fontWeight:700 }}>{catEmps}</td>
                      {catMonths.map((v,idx)=>(
                        <td key={idx} style={{ padding:'9px 8px',
                          textAlign:'right',
                          fontFamily:'DM Mono,monospace', fontSize:10,
                          color:v>0?'#1C1C1C':'#CCC' }}>
                          {v>0?FMTL(v):'—'}
                        </td>
                      ))}
                      <td style={{ padding:'9px 12px', textAlign:'right',
                        fontFamily:'DM Mono,monospace', fontSize:13,
                        fontWeight:800, color:'#155724' }}>
                        ₹{FMTL(catTotal)}L
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot style={{ background:'#EDE0EA',
                borderTop:'2px solid #714B67' }}>
                <tr>
                  <td style={{ padding:'10px 12px', fontWeight:800,
                    color:'#714B67', fontSize:13 }}>TOTAL</td>
                  <td style={{ padding:'10px 12px', textAlign:'center',
                    fontWeight:800 }}>
                    {new Set(slips.map(s=>s.empCode)).size}
                  </td>
                  {fyMonths.map((m,idx)=>{
                    const ms = slips.filter(s=>s.month===m &&
                      s.year===getYearForMonth(m))
                    const v  = ms.reduce((s,sl)=>s+parseFloat(sl.netPay||0),0)
                    return (
                      <td key={idx} style={{ padding:'10px 8px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace', fontSize:11,
                        fontWeight:800, color:'#155724' }}>
                        {v>0?FMTL(v):'—'}
                      </td>
                    )
                  })}
                  <td style={{ padding:'10px 12px', textAlign:'right',
                    fontFamily:'DM Mono,monospace', fontSize:14,
                    fontWeight:800, color:'#155724' }}>
                    ₹{FMTL(totals.net)}L
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
