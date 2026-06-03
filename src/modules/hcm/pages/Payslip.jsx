import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n  => '₹' + Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2 })

export default function Payslip() {
  const now   = new Date()
  const [month,    setMonth]    = useState(now.getMonth() + 1)
  const [year,     setYear]     = useState(now.getFullYear())
  const [runs,     setRuns]     = useState([])
  const [selRun,   setSelRun]   = useState('')
  const [slips,    setSlips]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [selSlip,  setSelSlip]  = useState(null)
  const [search,   setSearch]   = useState('')

  // Load payroll runs
  useEffect(() => {
    fetch(`${BASE}/payroll/runs`, { headers: hdr2() })
      .then(r => r.json())
      .then(d => {
        const r = d.data || d || []
        setRuns(r)
        if (r.length) setSelRun(r[0].id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (month && year) loadSlips()
  }, [month, year, selRun])

  const loadSlips = async () => {
    setLoading(true)
    try {
      const q   = `month=${month}&year=${year}${selRun ? `&runId=${selRun}` : ''}`
      const res = await fetch(`${BASE}/payroll/slips?${q}`, { headers: hdr2() })
      const d   = await res.json()
      setSlips(d.data || d || [])
    } catch { toast.error('Failed to load payslips') }
    finally { setLoading(false) }
  }

  const filtered = slips.filter(s =>
    !search ||
    s.empName?.toLowerCase().includes(search.toLowerCase()) ||
    s.empCode?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase())
  )

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div>
      <div className="hcm-pg-hdr">
        <div>
          <h2 className="hcm-pg-title">Payslips</h2>
          <p className="hcm-pg-sub">Employee payslip view & download</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
            style={{ padding:'6px 10px', border:'1.5px solid #E0D5E0',
              borderRadius:5, fontSize:12, outline:'none' }}>
            {MONTHS.map((m,i) => (
              <option key={i} value={i+1}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            style={{ padding:'6px 10px', border:'1.5px solid #E0D5E0',
              borderRadius:5, fontSize:12, outline:'none' }}>
            {[2024,2025,2026].map(y => (
              <option key={y}>{y}</option>
            ))}
          </select>
          {runs.length > 0 && (
            <select value={selRun} onChange={e => setSelRun(e.target.value)}
              style={{ padding:'6px 10px', border:'1.5px solid #E0D5E0',
                borderRadius:5, fontSize:12, outline:'none' }}>
              <option value="">All Runs</option>
              {runs.map(r => (
                <option key={r.id} value={r.id}>
                  {r.runNo || `Run ${r.id}`} — {r.status}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          ['Total Employees',   filtered.length,                        '#714B67','#EDE0EA'],
          ['Total Gross',       fmtC(filtered.reduce((s,e)=>s+parseFloat(e.grossPay||0),0)), '#155724','#D4EDDA'],
          ['Total Deductions',  fmtC(filtered.reduce((s,e)=>s+parseFloat(e.totalDeductions||0),0)), '#721C24','#F8D7DA'],
          ['Net Payable',       fmtC(filtered.reduce((s,e)=>s+parseFloat(e.netPay||0),0)),  '#0C5460','#D1ECF1'],
        ].map(([l,v,c,bg]) => (
          <div key={l} style={{ background:bg, borderRadius:8,
            padding:'10px 14px', textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800, color:c,
              fontFamily:'DM Mono,monospace' }}>{v}</div>
            <div style={{ fontSize:10, fontWeight:700, color:c,
              textTransform:'uppercase', opacity:.8 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom:10 }}>
        <input placeholder="Search employee name, code, department..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:'7px 12px', border:'1.5px solid #E0D5E0',
            borderRadius:5, fontSize:12, outline:'none', width:300 }} />
      </div>

      {/* Payslip list */}
      <div style={{ background:'#fff', borderRadius:8,
        border:'1.5px solid #E0D5E0', overflow:'hidden' }}>
        <table className="hcm-table">
          <thead>
            <tr>
              <th>Emp Code</th><th>Employee</th><th>Department</th>
              <th style={{ textAlign:'right' }}>Basic</th>
              <th style={{ textAlign:'right' }}>Gross Pay</th>
              <th style={{ textAlign:'right' }}>Deductions</th>
              <th style={{ textAlign:'right' }}>Net Pay</th>
              <th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding:30, textAlign:'center',
                color:'#6C757D' }}>Loading payslips...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding:30, textAlign:'center',
                color:'#6C757D' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>🧾</div>
                No payslips for {MONTHS[month-1]} {year}.
                {slips.length === 0 &&
                  <div style={{ fontSize:12, marginTop:4, color:'#856404' }}>
                    Run payroll first from Payroll Processing.
                  </div>}
              </td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} style={{ cursor:'pointer' }}
                onClick={() => setSelSlip(s)}>
                <td style={{ fontFamily:'DM Mono,monospace',
                  fontWeight:700, color:'#714B67', fontSize:12 }}>
                  {s.empCode}
                </td>
                <td><strong style={{ fontSize:12 }}>{s.empName}</strong></td>
                <td style={{ fontSize:11, color:'#6C757D' }}>{s.department}</td>
                <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                  fontSize:12 }}>{fmtC(s.basicPay || s.basic)}</td>
                <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                  fontWeight:700, color:'#155724' }}>{fmtC(s.grossPay)}</td>
                <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                  color:'#DC3545' }}>{fmtC(s.totalDeductions)}</td>
                <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                  fontWeight:800, color:'#714B67', fontSize:13 }}>{fmtC(s.netPay)}</td>
                <td>
                  <span style={{
                    padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700,
                    background: s.status==='PAID' ? '#D4EDDA'
                              : s.status==='APPROVED' ? '#D1ECF1' : '#FFF3CD',
                    color: s.status==='PAID' ? '#155724'
                         : s.status==='APPROVED' ? '#0C5460' : '#856404',
                  }}>{s.status || 'DRAFT'}</span>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn-xs" onClick={() => setSelSlip(s)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payslip Detail Modal */}
      {selSlip && (
        <div className="hcm-modal-overlay" onClick={() => setSelSlip(null)}>
          <div className="hcm-modal" onClick={e => e.stopPropagation()}
            style={{ maxWidth:600 }}>
            <div className="hcm-modal-hdr">
              <h3>Payslip — {selSlip.empName}</h3>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#6C757D' }}>
                  {MONTHS[month-1]} {year}
                </span>
                <span onClick={() => setSelSlip(null)}
                  style={{ cursor:'pointer', fontSize:18 }}>✕</span>
              </div>
            </div>
            <div style={{ padding:'16px 20px' }}>
              {/* Header */}
              <div style={{ background:'#714B67', color:'#fff',
                borderRadius:8, padding:'12px 16px', marginBottom:16,
                display:'grid', gridTemplateColumns:'1fr 1fr' }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:14 }}>{selSlip.empName}</div>
                  <div style={{ fontSize:11, opacity:.8 }}>{selSlip.empCode} · {selSlip.designation}</div>
                  <div style={{ fontSize:11, opacity:.8 }}>{selSlip.department}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, opacity:.8 }}>Pay Period</div>
                  <div style={{ fontWeight:700 }}>{MONTHS[month-1]} {year}</div>
                  <div style={{ fontSize:11, opacity:.8 }}>
                    Days: {selSlip.workingDays} worked / {selSlip.totalDays} total
                  </div>
                </div>
              </div>

              {/* Earnings vs Deductions */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {/* Earnings */}
                <div>
                  <div style={{ fontWeight:700, fontSize:12,
                    color:'#155724', marginBottom:8 }}>
                    💰 Earnings
                  </div>
                  {(selSlip.earnings || [
                    { name:'Basic Salary',        amount: selSlip.basicPay || selSlip.basic || 0 },
                    { name:'House Rent Allowance', amount: selSlip.hra || 0 },
                    { name:'Transport Allowance',  amount: selSlip.ta  || 0 },
                    { name:'Other Allowances',     amount: selSlip.otherAllowances || 0 },
                  ]).filter(e => parseFloat(e.amount) > 0).map((e, i) => (
                    <div key={i} style={{ display:'flex',
                      justifyContent:'space-between', padding:'4px 0',
                      borderBottom:'1px solid #F0F0F0', fontSize:12 }}>
                      <span>{e.name}</span>
                      <span style={{ fontFamily:'DM Mono,monospace',
                        fontWeight:700 }}>{fmtC(e.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between',
                    padding:'6px 0', fontWeight:800, fontSize:13,
                    color:'#155724', marginTop:4 }}>
                    <span>Gross Pay</span>
                    <span style={{ fontFamily:'DM Mono,monospace' }}>
                      {fmtC(selSlip.grossPay)}
                    </span>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <div style={{ fontWeight:700, fontSize:12,
                    color:'#721C24', marginBottom:8 }}>
                    📉 Deductions
                  </div>
                  {(selSlip.deductions || [
                    { name:'PF (Employee 12%)', amount: selSlip.pfEmployee || 0 },
                    { name:'ESI (Employee 0.75%)', amount: selSlip.esiEmployee || 0 },
                    { name:'Professional Tax',    amount: selSlip.professionalTax || 0 },
                    { name:'TDS / Income Tax',    amount: selSlip.tds || 0 },
                    { name:'LOP Deduction',       amount: selSlip.lopDeduction || 0 },
                  ]).filter(d => parseFloat(d.amount) > 0).map((d, i) => (
                    <div key={i} style={{ display:'flex',
                      justifyContent:'space-between', padding:'4px 0',
                      borderBottom:'1px solid #F0F0F0', fontSize:12 }}>
                      <span>{d.name}</span>
                      <span style={{ fontFamily:'DM Mono,monospace',
                        fontWeight:700, color:'#DC3545' }}>{fmtC(d.amount)}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between',
                    padding:'6px 0', fontWeight:800, fontSize:13,
                    color:'#721C24', marginTop:4 }}>
                    <span>Total Deductions</span>
                    <span style={{ fontFamily:'DM Mono,monospace' }}>
                      {fmtC(selSlip.totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div style={{ background:'#714B67', color:'#fff',
                borderRadius:8, padding:'12px 16px', marginTop:16,
                display:'flex', justifyContent:'space-between',
                alignItems:'center' }}>
                <span style={{ fontWeight:700, fontSize:14 }}>
                  Net Salary Payable
                </span>
                <span style={{ fontFamily:'Syne,sans-serif',
                  fontWeight:800, fontSize:22 }}>
                  {fmtC(selSlip.netPay)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
