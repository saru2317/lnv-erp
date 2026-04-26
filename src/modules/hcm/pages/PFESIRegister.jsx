import React, { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ Authorization: `Bearer ${getToken()}` })

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const FMT  = n => Number(n||0).toLocaleString('en-IN')
const FMTC = n => '₹'+FMT(n)

export default function PFESIRegister() {
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [view,    setView]    = useState('pf') // pf | esi | challan
  const [slips,   setSlips]   = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(
        `${BASE_URL}/payroll/pf-esi?month=${month}&year=${year}`,
        { headers:authHdrs() })
      const data = await res.json()
      setSlips(data.data||[])
      setSummary(data.summary||null)
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [month, year])

  useEffect(()=>{ fetchData() }, [fetchData])

  const pfSlips  = slips.filter(s=>parseFloat(s.pfEmployee||0)>0)
  const esiSlips = slips.filter(s=>parseFloat(s.esiEmployee||0)>0)

  const pfTotals = {
    empContrib: pfSlips.reduce((s,sl)=>s+parseFloat(sl.pfEmployee||0),0),
    erContrib:  pfSlips.reduce((s,sl)=>s+parseFloat(sl.pfEmployer||0),0),
    total:      pfSlips.reduce((s,sl)=>
      s+parseFloat(sl.pfEmployee||0)+parseFloat(sl.pfEmployer||0),0),
    wages:      pfSlips.reduce((s,sl)=>s+parseFloat(sl.basicSalary||0),0),
  }
  const esiTotals = {
    empContrib: esiSlips.reduce((s,sl)=>s+parseFloat(sl.esiEmployee||0),0),
    erContrib:  esiSlips.reduce((s,sl)=>s+parseFloat(sl.esiEmployer||0),0),
    total:      esiSlips.reduce((s,sl)=>
      s+parseFloat(sl.esiEmployee||0)+parseFloat(sl.esiEmployer||0),0),
    wages:      esiSlips.reduce((s,sl)=>s+parseFloat(sl.grossEarnings||0),0),
  }

  const handlePrint = () => {
    const w = window.open('','_blank')
    w.document.write(`<html><head>
      <title>${view.toUpperCase()} Register ${MONTHS[month-1]} ${year}</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:9px;margin:10px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ccc;padding:3px 6px}
        th{background:#714B67;color:#fff;text-align:center}
        td{text-align:right}
        .left{text-align:left}
        .total{background:#EDE0EA;font-weight:bold}
        h2,h3{text-align:center;margin:4px 0}
        @media print{@page{size:A4 landscape;margin:8mm}}
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>`)
    w.document.close(); w.focus()
    setTimeout(()=>{ w.print(); w.close() }, 500)
  }

  return (
    <div style={{ padding:16, background:'#F8F7FA', minHeight:'100%' }}>
      {/* Header */}
      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
        padding:'12px 16px', marginBottom:14,
        display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800,
          fontSize:15, color:'#714B67' }}>🏛️ PF & ESI Register</div>

        <select value={month} onChange={e=>setMonth(parseInt(e.target.value))}
          style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
            borderRadius:5, fontSize:12, cursor:'pointer' }}>
          {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </select>
        <select value={year} onChange={e=>setYear(parseInt(e.target.value))}
          style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
            borderRadius:5, fontSize:12, cursor:'pointer' }}>
          {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
        </select>

        {/* View toggle */}
        <div style={{ display:'flex', gap:0, borderRadius:6,
          overflow:'hidden', border:'1px solid #E0D5E0' }}>
          {[['pf','🏦 PF Register'],['esi','🏥 ESI Register'],
            ['challan','📋 Challan']].map(([v,l])=>(
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

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        gap:10, marginBottom:14 }}>
        {(view==='pf' ? [
          { l:'PF Eligible Employees', v:pfSlips.length,         c:'#714B67', bg:'#EDE0EA' },
          { l:'PF Wage (Basic)',        v:FMTC(pfTotals.wages),  c:'#0C5460', bg:'#D1ECF1' },
          { l:'Employee PF (12%)',      v:FMTC(pfTotals.empContrib),c:'#856404',bg:'#FFF3CD'},
          { l:'Employer PF (12.5%)',    v:FMTC(pfTotals.erContrib), c:'#155724',bg:'#D4EDDA'},
        ] : view==='esi' ? [
          { l:'ESI Eligible Employees', v:esiSlips.length,          c:'#714B67', bg:'#EDE0EA' },
          { l:'ESI Gross Wages',         v:FMTC(esiTotals.wages),   c:'#0C5460', bg:'#D1ECF1' },
          { l:'Employee ESI (0.75%)',    v:FMTC(esiTotals.empContrib),c:'#856404',bg:'#FFF3CD'},
          { l:'Employer ESI (3.25%)',    v:FMTC(esiTotals.erContrib), c:'#155724',bg:'#D4EDDA'},
        ] : [
          { l:'Total PF Challan',  v:FMTC(pfTotals.total),  c:'#714B67', bg:'#EDE0EA' },
          { l:'Total ESI Challan', v:FMTC(esiTotals.total), c:'#0C5460', bg:'#D1ECF1' },
          { l:'PT Challan',
            v:FMTC(slips.reduce((s,sl)=>s+parseFloat(sl.pt||0),0)),
            c:'#856404', bg:'#FFF3CD' },
          { l:'Total Statutory',
            v:FMTC(pfTotals.total+esiTotals.total+
              slips.reduce((s,sl)=>s+parseFloat(sl.pt||0),0)),
            c:'#155724', bg:'#D4EDDA' },
        ]).map(k=>(
          <div key={k.l} style={{ background:k.bg, borderRadius:8,
            padding:'10px 14px', border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c, fontWeight:700,
              textTransform:'uppercase', letterSpacing:.4 }}>{k.l}</div>
            <div style={{ fontSize:18, fontWeight:800, color:k.c,
              fontFamily:'Syne,sans-serif', marginTop:3 }}>{k.v}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
          ⏳ Loading...
        </div>
      ) : slips.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🏛️</div>
          <div style={{ fontWeight:700 }}>No payroll data for {MONTHS[month-1]} {year}</div>
          <div style={{ fontSize:12, marginTop:4 }}>Run payroll first!</div>
        </div>
      ) : (
        <div ref={printRef}>
          {/* Print header */}
          <div style={{ textAlign:'center', marginBottom:10 }}>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:14,
              fontWeight:800, color:'#714B67', margin:0 }}>
              LNV Manufacturing Pvt Ltd
            </h2>
            <h3 style={{ fontSize:12, fontWeight:600, margin:'3px 0',
              color:'#495057' }}>
              {view==='pf'?'Provident Fund Register':
               view==='esi'?'ESI Register':
               'Statutory Challan Summary'} —
              {MONTHS[month-1]} {year}
            </h3>
          </div>

          {/* ── PF REGISTER ── */}
          {view==='pf' && (
            <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
              overflow:'hidden' }}>
              <div style={{ maxHeight:'calc(100vh - 380px)',
                overflowY:'auto', overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse',
                  fontSize:12, minWidth:900 }}>
                  <thead style={{ position:'sticky', top:0, zIndex:10,
                    background:'#F8F4F8',
                    boxShadow:'0 2px 4px rgba(0,0,0,.06)' }}>
                    <tr style={{ borderBottom:'2px solid #714B67' }}>
                      {['#','Emp Code','Name','Department',
                        'UAN No','PF Wages (Basic)',
                        'Emp PF 12%','Empr PF 3.67%',
                        'Empr EPS 8.33%','Empr PF Admin 0.5%',
                        'Empr EDLI 0.5%','Total Challan'].map(h=>(
                        <th key={h} style={{ padding:'9px 12px', fontSize:10,
                          fontWeight:700, color:'#6C757D', textAlign:'center',
                          textTransform:'uppercase', letterSpacing:.3,
                          whiteSpace:'nowrap', background:'#F8F4F8' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pfSlips.map((s,i)=>{
                      const basic   = parseFloat(s.basicSalary||0)
                      const pfWage  = Math.min(basic, 15000)
                      const empPF   = parseFloat(s.pfEmployee||0)
                      const eps     = Math.round(pfWage * 0.0833)
                      const epf     = Math.round(pfWage * 0.0367)
                      const admin   = Math.round(pfWage * 0.005)
                      const edli    = Math.round(pfWage * 0.005)
                      const total   = empPF + epf + eps + admin + edli
                      return (
                        <tr key={s.id} style={{ borderBottom:'1px solid #F0EEF0',
                          background:i%2===0?'#fff':'#FDFBFD' }}>
                          <td style={{ padding:'8px 12px', textAlign:'center',
                            color:'#6C757D', fontSize:11 }}>{i+1}</td>
                          <td style={{ padding:'8px 12px',
                            fontFamily:'DM Mono,monospace',
                            fontWeight:700, color:'#714B67',
                            fontSize:11 }}>{s.empCode}</td>
                          <td style={{ padding:'8px 12px',
                            fontWeight:600, fontSize:13 }}>{s.empName}</td>
                          <td style={{ padding:'8px 12px',
                            fontSize:11, color:'#6C757D' }}>{s.department}</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'center', fontSize:11,
                            color:'#6C757D' }}>—</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            fontSize:12 }}>{FMTC(pfWage)}</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            fontWeight:700, fontSize:12,
                            color:'#714B67' }}>{FMTC(empPF)}</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            fontSize:11 }}>{FMTC(epf)}</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            fontSize:11 }}>{FMTC(eps)}</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            fontSize:11 }}>{FMTC(admin)}</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            fontSize:11 }}>{FMTC(edli)}</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            fontWeight:800, fontSize:13,
                            color:'#155724' }}>{FMTC(total)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot style={{ background:'#EDE0EA',
                    borderTop:'2px solid #714B67',
                    position:'sticky', bottom:0 }}>
                    <tr>
                      <td colSpan={5} style={{ padding:'9px 12px',
                        fontWeight:800, color:'#714B67',
                        fontSize:13 }}>
                        TOTAL ({pfSlips.length} employees)
                      </td>
                      <td style={{ padding:'9px 12px', textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        fontWeight:800 }}>{FMTC(pfTotals.wages)}</td>
                      <td style={{ padding:'9px 12px', textAlign:'right',
                        fontFamily:'DM Mono,monospace', fontWeight:800,
                        color:'#714B67' }}>{FMTC(pfTotals.empContrib)}</td>
                      <td style={{ padding:'9px 12px', textAlign:'right',
                        fontFamily:'DM Mono,monospace', fontWeight:800 }}>
                        {FMTC(pfSlips.reduce((s,sl)=>
                          s+Math.round(Math.min(parseFloat(sl.basicSalary||0),15000)*0.0367),0))}
                      </td>
                      <td style={{ padding:'9px 12px', textAlign:'right',
                        fontFamily:'DM Mono,monospace', fontWeight:800 }}>
                        {FMTC(pfSlips.reduce((s,sl)=>
                          s+Math.round(Math.min(parseFloat(sl.basicSalary||0),15000)*0.0833),0))}
                      </td>
                      <td style={{ padding:'9px 12px', textAlign:'right',
                        fontFamily:'DM Mono,monospace', fontWeight:800 }}>
                        {FMTC(pfSlips.reduce((s,sl)=>
                          s+Math.round(Math.min(parseFloat(sl.basicSalary||0),15000)*0.005),0))}
                      </td>
                      <td style={{ padding:'9px 12px', textAlign:'right',
                        fontFamily:'DM Mono,monospace', fontWeight:800 }}>
                        {FMTC(pfSlips.reduce((s,sl)=>
                          s+Math.round(Math.min(parseFloat(sl.basicSalary||0),15000)*0.005),0))}
                      </td>
                      <td style={{ padding:'9px 12px', textAlign:'right',
                        fontFamily:'DM Mono,monospace', fontWeight:800,
                        fontSize:14, color:'#155724' }}>
                        {FMTC(pfTotals.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── ESI REGISTER ── */}
          {view==='esi' && (
            <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
              overflow:'hidden' }}>
              <div style={{ maxHeight:'calc(100vh - 380px)',
                overflowY:'auto', overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse',
                  fontSize:12, minWidth:800 }}>
                  <thead style={{ position:'sticky', top:0, zIndex:10,
                    background:'#F8F4F8',
                    boxShadow:'0 2px 4px rgba(0,0,0,.06)' }}>
                    <tr style={{ borderBottom:'2px solid #0C5460' }}>
                      {['#','Emp Code','Name','Department',
                        'ESI No','Gross Wages',
                        'Emp ESI 0.75%','Empr ESI 3.25%',
                        'Total ESI'].map(h=>(
                        <th key={h} style={{ padding:'9px 12px', fontSize:10,
                          fontWeight:700, color:'#6C757D', textAlign:'center',
                          textTransform:'uppercase', letterSpacing:.3,
                          whiteSpace:'nowrap',
                          background:'#F8F4F8' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {esiSlips.map((s,i)=>{
                      const gross   = parseFloat(s.grossEarnings||0)
                      const empESI  = parseFloat(s.esiEmployee||0)
                      const erESI   = parseFloat(s.esiEmployer||0)
                      const total   = empESI + erESI
                      return (
                        <tr key={s.id} style={{ borderBottom:'1px solid #F0EEF0',
                          background:i%2===0?'#fff':'#FDFBFD' }}>
                          <td style={{ padding:'8px 12px',
                            textAlign:'center', color:'#6C757D',
                            fontSize:11 }}>{i+1}</td>
                          <td style={{ padding:'8px 12px',
                            fontFamily:'DM Mono,monospace',
                            fontWeight:700, color:'#714B67',
                            fontSize:11 }}>{s.empCode}</td>
                          <td style={{ padding:'8px 12px',
                            fontWeight:600, fontSize:13 }}>{s.empName}</td>
                          <td style={{ padding:'8px 12px',
                            fontSize:11, color:'#6C757D' }}>{s.department}</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'center', fontSize:11,
                            color:'#6C757D' }}>—</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            fontSize:12 }}>{FMTC(gross)}</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            fontWeight:700, fontSize:12,
                            color:'#0C5460' }}>{FMTC(empESI)}</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            fontSize:12,
                            color:'#155724' }}>{FMTC(erESI)}</td>
                          <td style={{ padding:'8px 12px',
                            textAlign:'right',
                            fontFamily:'DM Mono,monospace',
                            fontWeight:800, fontSize:13,
                            color:'#0C5460' }}>{FMTC(total)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot style={{ background:'#D1ECF1',
                    borderTop:'2px solid #0C5460',
                    position:'sticky', bottom:0 }}>
                    <tr>
                      <td colSpan={5} style={{ padding:'9px 12px',
                        fontWeight:800, color:'#0C5460',
                        fontSize:13 }}>
                        TOTAL ({esiSlips.length} employees)
                      </td>
                      <td style={{ padding:'9px 12px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        fontWeight:800 }}>{FMTC(esiTotals.wages)}</td>
                      <td style={{ padding:'9px 12px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        fontWeight:800, color:'#0C5460' }}>
                        {FMTC(esiTotals.empContrib)}</td>
                      <td style={{ padding:'9px 12px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        fontWeight:800, color:'#155724' }}>
                        {FMTC(esiTotals.erContrib)}</td>
                      <td style={{ padding:'9px 12px',
                        textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        fontWeight:800, fontSize:14,
                        color:'#0C5460' }}>
                        {FMTC(esiTotals.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── CHALLAN SUMMARY ── */}
          {view==='challan' && (
            <div style={{ maxWidth:700, margin:'0 auto' }}>
              {/* PF Challan */}
              <div style={{ background:'#fff', borderRadius:8,
                border:'2px solid #714B67', marginBottom:16,
                overflow:'hidden' }}>
                <div style={{ background:'#714B67', padding:'10px 16px',
                  color:'#fff', fontWeight:800, fontSize:13,
                  fontFamily:'Syne,sans-serif' }}>
                  🏦 EPF Challan — {MONTHS[month-1]} {year}
                </div>
                <div style={{ padding:16 }}>
                  {[
                    ['No. of Employees',     pfSlips.length,            false],
                    ['PF Wages (Total Basic)',FMTC(pfTotals.wages),     false],
                    ['─────────────────',    '─────────',               false],
                    ['Employee PF (12%)',     FMTC(pfTotals.empContrib),true ],
                    ['Employer EPF (3.67%)',
                      FMTC(pfSlips.reduce((s,sl)=>
                        s+Math.round(Math.min(parseFloat(sl.basicSalary||0),15000)*0.0367),0)),
                      true],
                    ['Employer EPS (8.33%)',
                      FMTC(pfSlips.reduce((s,sl)=>
                        s+Math.round(Math.min(parseFloat(sl.basicSalary||0),15000)*0.0833),0)),
                      true],
                    ['Admin Charges (0.5%)',
                      FMTC(pfSlips.reduce((s,sl)=>
                        s+Math.round(Math.min(parseFloat(sl.basicSalary||0),15000)*0.005),0)),
                      true],
                    ['EDLI Charges (0.5%)',
                      FMTC(pfSlips.reduce((s,sl)=>
                        s+Math.round(Math.min(parseFloat(sl.basicSalary||0),15000)*0.005),0)),
                      true],
                  ].map(([l,v,indent])=>(
                    <div key={l} style={{ display:'flex',
                      justifyContent:'space-between',
                      padding:'7px 0',
                      borderBottom:'1px solid #F0EEF0',
                      paddingLeft:indent?16:0 }}>
                      <span style={{ fontSize:12, color:'#495057',
                        fontWeight:indent?400:600 }}>{l}</span>
                      <span style={{ fontFamily:'DM Mono,monospace',
                        fontSize:12, fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between',
                    padding:'12px 0 4px', marginTop:4,
                    borderTop:'2px solid #714B67' }}>
                    <span style={{ fontSize:14, fontWeight:800,
                      color:'#714B67' }}>Total PF Challan</span>
                    <span style={{ fontFamily:'DM Mono,monospace',
                      fontSize:16, fontWeight:800,
                      color:'#714B67' }}>{FMTC(pfTotals.total)}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#6C757D', marginTop:8,
                    background:'#F8F4F8', padding:'6px 10px', borderRadius:5 }}>
                    📅 Due Date: 15th of following month |
                    Remit to: EPFO ECR Portal
                  </div>
                </div>
              </div>

              {/* ESI Challan */}
              <div style={{ background:'#fff', borderRadius:8,
                border:'2px solid #0C5460', marginBottom:16,
                overflow:'hidden' }}>
                <div style={{ background:'#0C5460', padding:'10px 16px',
                  color:'#fff', fontWeight:800, fontSize:13,
                  fontFamily:'Syne,sans-serif' }}>
                  🏥 ESI Challan — {MONTHS[month-1]} {year}
                </div>
                <div style={{ padding:16 }}>
                  {[
                    ['No. of Employees',       esiSlips.length,            false],
                    ['ESI Wages (Gross)',        FMTC(esiTotals.wages),     false],
                    ['─────────────────',        '─────────',               false],
                    ['Employee ESI (0.75%)',     FMTC(esiTotals.empContrib),true ],
                    ['Employer ESI (3.25%)',     FMTC(esiTotals.erContrib), true ],
                  ].map(([l,v,indent])=>(
                    <div key={l} style={{ display:'flex',
                      justifyContent:'space-between',
                      padding:'7px 0',
                      borderBottom:'1px solid #F0EEF0',
                      paddingLeft:indent?16:0 }}>
                      <span style={{ fontSize:12, color:'#495057',
                        fontWeight:indent?400:600 }}>{l}</span>
                      <span style={{ fontFamily:'DM Mono,monospace',
                        fontSize:12, fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between',
                    padding:'12px 0 4px', marginTop:4,
                    borderTop:'2px solid #0C5460' }}>
                    <span style={{ fontSize:14, fontWeight:800,
                      color:'#0C5460' }}>Total ESI Challan</span>
                    <span style={{ fontFamily:'DM Mono,monospace',
                      fontSize:16, fontWeight:800,
                      color:'#0C5460' }}>{FMTC(esiTotals.total)}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#6C757D', marginTop:8,
                    background:'#F0FFFE', padding:'6px 10px', borderRadius:5 }}>
                    📅 Due Date: 15th of following month |
                    Remit to: ESIC Portal
                  </div>
                </div>
              </div>

              {/* PT Challan */}
              <div style={{ background:'#fff', borderRadius:8,
                border:'2px solid #856404', overflow:'hidden' }}>
                <div style={{ background:'#856404', padding:'10px 16px',
                  color:'#fff', fontWeight:800, fontSize:13,
                  fontFamily:'Syne,sans-serif' }}>
                  📋 Professional Tax — {MONTHS[month-1]} {year}
                </div>
                <div style={{ padding:16 }}>
                  {[
                    ['No. of Employees',
                      slips.filter(s=>parseFloat(s.pt||0)>0).length, false],
                    ['PT Amount',
                      FMTC(slips.reduce((s,sl)=>s+parseFloat(sl.pt||0),0)), false],
                  ].map(([l,v,indent])=>(
                    <div key={l} style={{ display:'flex',
                      justifyContent:'space-between',
                      padding:'7px 0',
                      borderBottom:'1px solid #F0EEF0' }}>
                      <span style={{ fontSize:12, color:'#495057',
                        fontWeight:600 }}>{l}</span>
                      <span style={{ fontFamily:'DM Mono,monospace',
                        fontSize:12, fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between',
                    padding:'12px 0 4px', marginTop:4,
                    borderTop:'2px solid #856404' }}>
                    <span style={{ fontSize:14, fontWeight:800,
                      color:'#856404' }}>Total PT Challan</span>
                    <span style={{ fontFamily:'DM Mono,monospace',
                      fontSize:16, fontWeight:800, color:'#856404' }}>
                      {FMTC(slips.reduce((s,sl)=>s+parseFloat(sl.pt||0),0))}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:'#6C757D', marginTop:8,
                    background:'#FFFDF0', padding:'6px 10px', borderRadius:5 }}>
                    📅 Due Date: Last day of month |
                    State: Tamil Nadu
                  </div>
                </div>
              </div>

              {/* Grand Total Challan */}
              <div style={{ background:'#EDE0EA', borderRadius:8,
                padding:'14px 20px', marginTop:16,
                border:'2px solid #714B67',
                display:'flex', justifyContent:'space-between',
                alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:11, color:'#714B67',
                    fontWeight:700, textTransform:'uppercase' }}>
                    Grand Total Statutory Remittance
                  </div>
                  <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>
                    PF + ESI + PT for {MONTHS[month-1]} {year}
                  </div>
                </div>
                <div style={{ fontSize:24, fontWeight:800,
                  fontFamily:'Syne,sans-serif', color:'#714B67' }}>
                  {FMTC(pfTotals.total + esiTotals.total +
                    slips.reduce((s,sl)=>s+parseFloat(sl.pt||0),0))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
