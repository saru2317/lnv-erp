import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt  = n => Number(n||0).toLocaleString('en-IN')
const fmtC = n => '₹'+fmt(n)

const STATUS = {
  DRAFT:       { bg:'#F0EEF0', color:'#6C757D', icon:'✏️'  },
  PROCESSING:  { bg:'#FFF3CD', color:'#856404', icon:'⚙️'  },
  COMPLETED:   { bg:'#D1ECF1', color:'#0C5460', icon:'✅'  },
  APPROVED:    { bg:'#D4EDDA', color:'#155724', icon:'👍'  },
  DISBURSED:   { bg:'#EDE0EA', color:'#714B67', icon:'💰'  },
}

export default function PayrollProcess() {
  const now = new Date()
  const [month,      setMonth]      = useState(now.getMonth()+1)
  const [year,       setYear]       = useState(now.getFullYear())
  const [runs,       setRuns]       = useState([])
  const [slips,      setSlips]      = useState([])
  const [selRun,     setSelRun]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [processing, setProcessing] = useState(false)
  const [view,       setView]       = useState('runs') // runs | slips

  const fetchRuns = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/payroll/runs`, { headers:authHdrs2() })
      const data = await res.json()
      setRuns(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  const fetchSlips = useCallback(async (runId) => {
    setLoading(true)
    try {
      const res  = await fetch(
        `${BASE_URL}/payroll/slips?month=${month}&year=${year}${runId?`&runId=${runId}`:''}`,
        { headers:authHdrs2() })
      const data = await res.json()
      setSlips(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [month, year])

  useEffect(()=>{ fetchRuns() }, [])

  const processPayroll = async () => {
    if (!confirm(`Process payroll for ${MONTHS[month-1]} ${year}?\nThis will calculate salary for all active employees.`)) return
    setProcessing(true)
    try {
      const res  = await fetch(`${BASE_URL}/payroll/process`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({ month, year }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      fetchRuns()
      setView('slips')
      fetchSlips()
    } catch(e){ toast.error(e.message) } finally { setProcessing(false) }
  }

  const doAction = async (runId, action) => {
    const labels = { approve:'Approve payroll?', disburse:'Disburse salary to all employees? This cannot be undone!' }
    if (!confirm(labels[action])) return
    try {
      const res  = await fetch(`${BASE_URL}/payroll/runs/${runId}/${action}`,
        { method:'POST', headers:authHdrs(), body:'{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      fetchRuns()
    } catch(e){ toast.error(e.message) }
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Payroll Processing
          <small>Monthly salary calculation engine</small>
        </div>
        <div className="fi-lv-actions">
          {/* View toggle */}
          <div style={{ display:'flex',gap:0,borderRadius:6,
            overflow:'hidden',border:'1px solid #E0D5E0' }}>
            {[['runs','📋 Runs'],['slips','📄 Slips']].map(([v,l])=>(
              <button key={v} onClick={()=>{ setView(v); if(v==='slips') fetchSlips() }}
                style={{ padding:'6px 12px',border:'none',cursor:'pointer',
                  fontSize:11,fontWeight:600,
                  background:view===v?'#714B67':'#fff',
                  color:view===v?'#fff':'#6C757D' }}>{l}</button>
            ))}
          </div>
          <select value={month} onChange={e=>setMonth(parseInt(e.target.value))}
            style={{ padding:'6px 10px',border:'1px solid #E0D5E0',
              borderRadius:5,fontSize:12,cursor:'pointer' }}>
            {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(parseInt(e.target.value))}
            style={{ padding:'6px 10px',border:'1px solid #E0D5E0',
              borderRadius:5,fontSize:12,cursor:'pointer' }}>
            {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
          </select>
          <button onClick={processPayroll} disabled={processing}
            style={{ padding:'8px 18px',background:processing?'#9E7D96':'#714B67',
              color:'#fff',border:'none',borderRadius:6,fontSize:13,
              fontWeight:700,cursor:'pointer' }}>
            {processing?'⚙️ Processing...':'⚙️ Run Payroll'}
          </button>
        </div>
      </div>

      {/* ── PAYROLL RUNS VIEW ── */}
      {view==='runs' && (
        <>
          {loading ? (
            <div style={{ padding:40,textAlign:'center',color:'#6C757D' }}>⏳ Loading...</div>
          ) : runs.length===0 ? (
            <div style={{ padding:60,textAlign:'center',color:'#6C757D',
              background:'#fff',borderRadius:8,border:'2px dashed #E0D5E0' }}>
              <div style={{ fontSize:32,marginBottom:12 }}>💰</div>
              <div style={{ fontWeight:700 }}>No payroll runs yet</div>
              <div style={{ fontSize:12,marginTop:4 }}>
                Select month/year → click "⚙️ Run Payroll"
              </div>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {runs.map(run=>{
                const sc = STATUS[run.status]||{}
                return (
                  <div key={run.id} style={{ background:'#fff',borderRadius:8,
                    border:'1px solid #E0D5E0',padding:'16px 20px',
                    boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',
                      alignItems:'center',flexWrap:'wrap',gap:10 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:14 }}>
                        <span style={{ fontFamily:'DM Mono,monospace',fontSize:13,
                          fontWeight:700,color:'#714B67' }}>{run.runNo}</span>
                        <div>
                          <div style={{ fontWeight:700,fontSize:15 }}>
                            {MONTHS[run.month-1]} {run.year}
                            <span style={{ marginLeft:8,fontSize:11,color:'#6C757D',
                              fontWeight:400 }}>{run.runType}</span>
                          </div>
                          <div style={{ fontSize:12,color:'#6C757D',
                            marginTop:3,display:'flex',gap:16 }}>
                            <span>👥 {run.totalEmployees} employees</span>
                            <span>💵 Gross: <strong>{fmtC(run.totalGross)}</strong></span>
                            <span>📤 Deductions: <strong>{fmtC(run.totalDeductions)}</strong></span>
                            <span style={{ color:'#155724',fontWeight:700 }}>
                              💰 Net: <strong>{fmtC(run.totalNet)}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <span style={{ padding:'4px 12px',borderRadius:10,
                          fontSize:11,fontWeight:700,
                          background:sc.bg,color:sc.color }}>
                          {sc.icon} {run.status}
                        </span>
                        <button onClick={()=>{ setSelRun(run); setView('slips');
                          fetchSlips(run.id) }}
                          style={{ padding:'5px 12px',background:'#fff',
                            color:'#714B67',border:'1.5px solid #714B67',
                            borderRadius:5,fontSize:11,cursor:'pointer',
                            fontWeight:600 }}>📄 View Slips</button>
                        {run.status==='COMPLETED' && (
                          <button onClick={()=>doAction(run.id,'approve')}
                            style={{ padding:'5px 12px',background:'#28A745',
                              color:'#fff',border:'none',borderRadius:5,
                              fontSize:11,cursor:'pointer',fontWeight:700 }}>
                            ✅ Approve</button>
                        )}
                        {run.status==='APPROVED' && (
                          <button onClick={()=>doAction(run.id,'disburse')}
                            style={{ padding:'5px 14px',background:'#714B67',
                              color:'#fff',border:'none',borderRadius:5,
                              fontSize:12,cursor:'pointer',fontWeight:700 }}>
                            💰 Disburse Salary</button>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',
                      gap:10,marginTop:14 }}>
                      {[
                        ['Total Gross',   fmtC(run.totalGross),       '#0C5460','#D1ECF1'],
                        ['Total PF',      fmtC(run.totalPF),          '#714B67','#EDE0EA'],
                        ['Total ESI',     fmtC(run.totalESI),         '#856404','#FFF3CD'],
                        ['Net Payable',   fmtC(run.totalNet),         '#155724','#D4EDDA'],
                      ].map(([l,v,c,bg])=>(
                        <div key={l} style={{ background:bg,borderRadius:6,
                          padding:'8px 12px',textAlign:'center' }}>
                          <div style={{ fontSize:10,color:c,fontWeight:700,
                            textTransform:'uppercase' }}>{l}</div>
                          <div style={{ fontSize:16,fontWeight:800,color:c,
                            fontFamily:'Syne,sans-serif' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── SALARY SLIPS VIEW ── */}
      {view==='slips' && (
        <>
          <div style={{ marginBottom:12,display:'flex',justifyContent:'space-between',
            alignItems:'center' }}>
            <div style={{ fontSize:13,fontWeight:700,color:'#714B67' }}>
              Salary Slips — {MONTHS[month-1]} {year}
              <span style={{ marginLeft:8,fontSize:11,color:'#6C757D',fontWeight:400 }}>
                {slips.length} employees
              </span>
            </div>
            <button onClick={()=>fetchSlips(selRun?.id)}
              style={{ padding:'5px 12px',background:'#fff',color:'#714B67',
                border:'1px solid #714B67',borderRadius:5,fontSize:11,
                cursor:'pointer' }}>🔄 Refresh</button>
          </div>

          {loading ? (
            <div style={{ padding:40,textAlign:'center',color:'#6C757D' }}>⏳ Loading...</div>
          ) : slips.length===0 ? (
            <div style={{ padding:40,textAlign:'center',color:'#6C757D',
              background:'#fff',borderRadius:8,border:'2px dashed #E0D5E0' }}>
              No salary slips. Run payroll first!
            </div>
          ) : (
            <div style={{ border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden' }}>
              <div style={{ maxHeight:'calc(100vh - 320px)',overflowY:'auto',overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse',minWidth:1000 }}>
                  <thead style={{ position:'sticky',top:0,zIndex:10,
                    background:'#F8F4F8',boxShadow:'0 2px 4px rgba(0,0,0,.06)' }}>
                    <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                      {['Emp','Name','Dept','Days','Basic','Gross',
                        'PF','ESI','PT','LOP','Net Pay','Status'].map(h=>(
                        <th key={h} style={{ padding:'9px 12px',fontSize:10,
                          fontWeight:700,color:'#6C757D',textAlign:'left',
                          textTransform:'uppercase',letterSpacing:.3,
                          whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slips.map((s,i)=>(
                      <tr key={s.id} style={{ borderBottom:'1px solid #F0EEF0',
                        background:i%2===0?'#fff':'#FDFBFD' }}>
                        <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                          fontWeight:700,color:'#714B67',fontSize:11 }}>{s.empCode}</td>
                        <td style={{ padding:'9px 12px',fontWeight:600,fontSize:13 }}>
                          {s.empName}</td>
                        <td style={{ padding:'9px 12px',fontSize:11,color:'#6C757D' }}>
                          {s.department}</td>
                        <td style={{ padding:'9px 12px',textAlign:'center',fontSize:12 }}>
                          <span style={{ color:'#155724',fontWeight:700 }}>
                            {parseFloat(s.presentDays||0).toFixed(1)}</span>
                          <span style={{ color:'#6C757D' }}>/{s.workingDays}</span>
                          {parseFloat(s.lopDays||0)>0 && (
                            <div style={{ fontSize:10,color:'#DC3545' }}>
                              LOP:{parseFloat(s.lopDays).toFixed(1)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                          fontSize:12 }}>{fmtC(s.basicSalary)}</td>
                        <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                          fontSize:12,fontWeight:700 }}>{fmtC(s.grossEarnings)}</td>
                        <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                          fontSize:11,color:'#714B67' }}>{fmtC(s.pfEmployee)}</td>
                        <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                          fontSize:11,color:'#856404' }}>{fmtC(s.esiEmployee)}</td>
                        <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                          fontSize:11,color:'#0C5460' }}>{fmtC(s.pt)}</td>
                        <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                          fontSize:11,color:'#DC3545' }}>
                          {parseFloat(s.lopDeduction||0)>0?fmtC(s.lopDeduction):'—'}</td>
                        <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                          fontSize:13,fontWeight:800,color:'#155724' }}>
                          {fmtC(s.netPay)}</td>
                        <td style={{ padding:'9px 12px' }}>
                          <span style={{ padding:'2px 8px',borderRadius:10,
                            fontSize:10,fontWeight:700,
                            background:s.paymentStatus==='PAID'?'#D4EDDA':'#FFF3CD',
                            color:s.paymentStatus==='PAID'?'#155724':'#856404' }}>
                            {s.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals */}
                  <tfoot style={{ background:'#F8F4F8',
                    borderTop:'2px solid #714B67',
                    position:'sticky',bottom:0 }}>
                    <tr>
                      <td colSpan={4} style={{ padding:'9px 12px',fontWeight:800,
                        color:'#714B67',fontSize:12 }}>
                        TOTAL ({slips.length} employees)
                      </td>
                      <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                        fontWeight:800,fontSize:12 }}>
                        {fmtC(slips.reduce((s,sl)=>s+parseFloat(sl.basicSalary||0),0))}</td>
                      <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                        fontWeight:800,fontSize:12 }}>
                        {fmtC(slips.reduce((s,sl)=>s+parseFloat(sl.grossEarnings||0),0))}</td>
                      <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                        fontWeight:800,fontSize:12,color:'#714B67' }}>
                        {fmtC(slips.reduce((s,sl)=>s+parseFloat(sl.pfEmployee||0),0))}</td>
                      <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                        fontWeight:800,fontSize:12,color:'#856404' }}>
                        {fmtC(slips.reduce((s,sl)=>s+parseFloat(sl.esiEmployee||0),0))}</td>
                      <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                        fontWeight:800,fontSize:12,color:'#0C5460' }}>
                        {fmtC(slips.reduce((s,sl)=>s+parseFloat(sl.pt||0),0))}</td>
                      <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                        fontWeight:800,fontSize:12,color:'#DC3545' }}>
                        {fmtC(slips.reduce((s,sl)=>s+parseFloat(sl.lopDeduction||0),0))}</td>
                      <td style={{ padding:'9px 12px',fontFamily:'DM Mono,monospace',
                        fontWeight:800,fontSize:14,color:'#155724' }}>
                        {fmtC(slips.reduce((s,sl)=>s+parseFloat(sl.netPay||0),0))}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
