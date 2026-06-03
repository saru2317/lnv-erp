import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n  => '₹' + Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2 })
const minsToHr = m => {
  const h = Math.floor((m||0)/60)
  const min = (m||0) % 60
  return h > 0 ? `${h}h ${min > 0 ? min+'m' : ''}` : `${min}m`
}

export default function OvertimeRegister() {
  const now  = new Date()
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [chip,    setChip]    = useState('All')
  const [search,  setSearch]  = useState('')

  useEffect(() => { load() }, [month, year])

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch(
        `${BASE}/attendance/summary?month=${month}&year=${year}`,
        { headers: hdr2() }
      )
      const data = await res.json()
      // Filter only employees with OT
      const withOT = (data.data || data || []).filter(r =>
        parseFloat(r.totalOTMins || r.otMins || 0) > 0
      )
      setRecords(withOT)
    } catch { toast.error('Failed to load OT data') }
    finally { setLoading(false) }
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec']

  const filtered = records.filter(r => {
    const matchChip = chip === 'All' ||
      (chip === 'Pending'  && r.otStatus === 'PENDING') ||
      (chip === 'Approved' && r.otStatus === 'APPROVED')
    const matchSearch = !search ||
      r.empName?.toLowerCase().includes(search.toLowerCase()) ||
      r.empCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.department?.toLowerCase().includes(search.toLowerCase())
    return matchChip && matchSearch
  })

  const totalOTMins = filtered.reduce((s,r) => s + parseFloat(r.totalOTMins || r.otMins || 0), 0)
  const totalOTPay  = filtered.reduce((s,r) => s + parseFloat(r.otPay || 0), 0)

  return (
    <div>
      <div className="hcm-pg-hdr">
        <div>
          <h2 className="hcm-pg-title">Overtime Register</h2>
          <p className="hcm-pg-sub">OT hours & pay — {MONTHS[month-1]} {year}</p>
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
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          ['Employees with OT', filtered.length,          '#714B67','#EDE0EA'],
          ['Total OT Hours',    minsToHr(totalOTMins),    '#0C5460','#D1ECF1'],
          ['OT Pay Estimate',   fmtC(totalOTPay),         '#155724','#D4EDDA'],
          ['Pending Approval',  records.filter(r=>r.otStatus==='PENDING').length, '#856404','#FFF3CD'],
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

      {/* Chips + Search */}
      <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
        {['All','Approved','Pending'].map(c => (
          <button key={c} onClick={() => setChip(c)}
            style={{ padding:'5px 14px', borderRadius:14, fontSize:11,
              fontWeight:700, cursor:'pointer',
              background: chip===c ? '#714B67' : '#F8F4F8',
              color:      chip===c ? '#fff'    : '#714B67',
              border:    `1.5px solid ${chip===c ? '#714B67' : '#E0D5E0'}` }}>
            {c}
          </button>
        ))}
        <input placeholder="Search employee..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:'6px 12px', border:'1.5px solid #E0D5E0',
            borderRadius:5, fontSize:12, outline:'none',
            marginLeft:'auto', width:220 }} />
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:8,
        border:'1.5px solid #E0D5E0', overflow:'hidden' }}>
        <table className="hcm-table">
          <thead>
            <tr>
              <th>Emp Code</th><th>Employee</th><th>Department</th>
              <th>Type</th><th style={{ textAlign:'center' }}>OT Days</th>
              <th style={{ textAlign:'right' }}>Total OT Hrs</th>
              <th style={{ textAlign:'right' }}>Hourly Rate</th>
              <th style={{ textAlign:'right' }}>OT Pay Est.</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding:30, textAlign:'center',
                color:'#6C757D' }}>Loading OT data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding:30, textAlign:'center',
                color:'#6C757D' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>⏰</div>
                No overtime recorded for {MONTHS[month-1]} {year}
              </td></tr>
            ) : filtered.map(r => {
              const otMins  = parseFloat(r.totalOTMins || r.otMins || 0)
              const otDays  = r.ot || Math.ceil(otMins/60/2)
              const hourly  = parseFloat(r.basicHourly || r.hourlyRate || 0)
              const otPay   = parseFloat(r.otPay || (otMins/60 * hourly * 2).toFixed(0))
              const status  = r.otStatus || 'APPROVED'
              return (
                <tr key={r.empCode || r.id}>
                  <td style={{ fontFamily:'DM Mono,monospace',
                    fontWeight:700, color:'#714B67', fontSize:12 }}>
                    {r.empCode}
                  </td>
                  <td><strong style={{ fontSize:12 }}>{r.empName}</strong></td>
                  <td style={{ fontSize:11, color:'#6C757D' }}>{r.department}</td>
                  <td>
                    <span style={{ fontSize:11, fontWeight:700,
                      color: r.empType==='Worker' ? '#856404' : '#0C5460' }}>
                      {r.empType || 'Staff'}
                    </span>
                  </td>
                  <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace',
                    fontWeight:700 }}>
                    {otDays}
                  </td>
                  <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                    fontWeight:700, color:'#0C5460' }}>
                    {minsToHr(otMins)}
                  </td>
                  <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                    fontSize:12, color:'#6C757D' }}>
                    {hourly > 0 ? fmtC(hourly) : '—'}
                  </td>
                  <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                    fontWeight:700, color:'#155724' }}>
                    {otPay > 0 ? fmtC(otPay) : '—'}
                  </td>
                  <td>
                    <span style={{
                      padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700,
                      background: status==='APPROVED' ? '#D4EDDA'
                                : status==='PENDING'  ? '#FFF3CD' : '#F8D7DA',
                      color:      status==='APPROVED' ? '#155724'
                                : status==='PENDING'  ? '#856404' : '#721C24',
                    }}>{status}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ background:'#EDE0EA', fontWeight:700 }}>
                <td colSpan={5} style={{ padding:'8px 12px' }}>
                  Total — {filtered.length} employees
                </td>
                <td style={{ textAlign:'right', padding:'8px 12px',
                  fontFamily:'DM Mono,monospace', color:'#0C5460' }}>
                  {minsToHr(totalOTMins)}
                </td>
                <td />
                <td style={{ textAlign:'right', padding:'8px 12px',
                  fontFamily:'DM Mono,monospace', fontWeight:800,
                  color:'#155724', fontSize:13 }}>
                  {fmtC(totalOTPay)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
