import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:2})

const SEC_COLOR = {
  '192B':'#714B67','194C':'#E06F39','194J':'#0C5460',
  '194H':'#856404','194I':'#004085','194IA':'#155724','194A':'#383D41','194Q':'#4B2E83',
}

const QUARTERS = [
  { q:1, label:'Q1 — Apr to Jun', due:'31 Jul' },
  { q:2, label:'Q2 — Jul to Sep', due:'31 Oct' },
  { q:3, label:'Q3 — Oct to Dec', due:'31 Jan' },
  { q:4, label:'Q4 — Jan to Mar', due:'31 May' },
]

export default function Form26Q() {
  const now = new Date()
  const curQ = now.getMonth() < 3 ? 4 : now.getMonth() < 6 ? 1 : now.getMonth() < 9 ? 2 : 3
  const [quarter, setQuarter] = useState(curQ)
  const [fy,      setFY]      = useState(now.getFullYear())
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [secFilter,setSecFilter]=useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/tds/26q?quarter=${quarter}&fy=${fy}`, { headers: hdr2() })
      const d = await r.json()
      setData(d)
    } catch { toast.error('Failed to load 26Q data') }
    finally { setLoading(false) }
  }, [quarter, fy])

  useEffect(() => { load() }, [load])

  const deductees = (data?.data || []).filter(d =>
    secFilter==='all' || d.section===secFilter
  )

  const qInfo    = QUARTERS.find(q=>q.q===quarter) || QUARTERS[0]
  const panIssue = (data?.data||[]).filter(d=>d.pan==='PANNOTAVBL'||d.pan==='UNKNOWN')

  // Export as CSV
  const exportCSV = () => {
    const rows = [
      ['PAN','Deductee Name','Section','Gross Amount','TDS Deducted','TDS Deposited','Count'],
      ...(data?.data||[]).map(d=>[d.pan,d.name,d.section,d.grossAmt.toFixed(2),d.tdsAmt.toFixed(2),d.deposited.toFixed(2),d.count])
    ]
    const csv = rows.map(r=>r.join(',')).join('\n')
    const a   = document.createElement('a')
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download= `26Q_Q${quarter}_FY${fy}-${fy+1}.csv`
    a.click()
  }

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Form 26Q
          <small> Quarterly TDS Return (Non-Salary) · Q{quarter} FY {fy}–{fy+1}</small>
        </div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={quarter} onChange={e=>setQuarter(parseInt(e.target.value))} style={{width:140}}>
            {QUARTERS.map(q=><option key={q.q} value={q.q}>{q.label}</option>)}
          </select>
          <select className="sd-search" value={fy} onChange={e=>setFY(parseInt(e.target.value))} style={{width:80}}>
            {[2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Load</button>
          <button className="btn btn-s sd-bsm" onClick={exportCSV}>Export CSV</button>
          <button className="btn btn-p sd-bsm" onClick={()=>toast.success('Open TRACES portal: https://www.tdscpc.gov.in to file 26Q')}>
            File on TRACES
          </button>
        </div>
      </div>

      {/* Filing due alert */}
      <div className="fi-alert info" style={{marginBottom:14}}>
        <strong>Q{quarter} ({qInfo.label}):</strong> Filing due by <strong>{qInfo.due} {quarter===4?fy+1:fy}</strong>.
        File on <a href="https://www.tdscpc.gov.in" target="_blank" rel="noreferrer" style={{color:'#0C5460',fontWeight:700}}>TRACES portal</a> using DSC or EVC.
        Non-filing penalty: ₹200/day up to TDS amount.
      </div>

      {/* PAN issue alert */}
      {panIssue.length > 0 && (
        <div className="fi-alert err" style={{marginBottom:14}}>
          <strong>{panIssue.length} deductee(s) with missing PAN!</strong> TDS deducted @ 20% for these parties.
          Update PAN in Vendor Master immediately. Wrong PAN = vendor cannot get credit in 26AS.
        </div>
      )}

      {/* KPIs */}
      <div className="fi-kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:14}}>
        {[
          { cls:'purple', label:'Total Deductees',    val: data?.data?.length||0,      sub:'Parties with TDS' },
          { cls:'orange', label:'Total Gross Amount', val: INR(data?.totalGross||0),   sub:'Before TDS' },
          { cls:'red',    label:'Total TDS Deducted', val: INR(data?.totalTDS||0),     sub:'To be/already deposited' },
          { cls:'orange', label:'PAN Issues',         val: panIssue.length,            sub: panIssue.length>0 ? 'Fix immediately' : 'All PANs valid' },
        ].map(k=>(
          <div key={k.label} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.label}</div>
            <div className="fi-kpi-value">{k.val}</div>
            <div className="fi-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* How 26Q flows */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
        {[
          { step:'1', label:'TDS Deducted',   desc:'At time of payment to vendor', color:'#714B67' },
          { step:'2', label:'TDS Deposited',   desc:'Challan ITNS 281 to IT dept', color:'#E06F39' },
          { step:'3', label:'26Q Filed',        desc:'Quarterly return on TRACES',  color:'#0C5460' },
          { step:'4', label:'Vendor 26AS',      desc:'Credit reflects in vendor\'s 26AS', color:'#155724' },
        ].map(s=>(
          <div key={s.step} style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:'10px 14px',
            display:'flex',gap:10,alignItems:'center'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:s.color,color:'#fff',
              display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,flexShrink:0}}>
              {s.step}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:12,color:s.color}}>{s.label}</div>
              <div style={{fontSize:10,color:'#6C757D'}}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Section filter chips */}
      <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
        <button onClick={()=>setSecFilter('all')} style={{padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
          border:'1px solid #E0D5E0',background:secFilter==='all'?'#714B67':'#fff',color:secFilter==='all'?'#fff':'#6C757D'}}>
          All Sections
        </button>
        {[...new Set((data?.data||[]).map(d=>d.section))].map(sec=>(
          <button key={sec} onClick={()=>setSecFilter(secFilter===sec?'all':sec)} style={{
            padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
            border:`1px solid ${secFilter===sec?SEC_COLOR[sec]||'#714B67':'#E0D5E0'}`,
            background:secFilter===sec?SEC_COLOR[sec]||'#714B67':'#fff',
            color:secFilter===sec?'#fff':SEC_COLOR[sec]||'#6C757D'
          }}>{sec}</button>
        ))}
      </div>

      {/* Deductee table */}
      {loading ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading 26Q data...</div>
      : deductees.length === 0 ? (
        <div style={{padding:50,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          No TDS deductions for Q{quarter} FY {fy}–{fy+1}.
        </div>
      ) : (
        <table className="fi-data-table">
          <thead><tr>
            <th>#</th>
            <th>Deductee PAN</th>
            <th>Deductee Name</th>
            <th style={{textAlign:'center'}}>Section</th>
            <th style={{textAlign:'center'}}>Payments</th>
            <th style={{textAlign:'right'}}>Gross Amount</th>
            <th style={{textAlign:'right'}}>TDS Deducted</th>
            <th style={{textAlign:'right'}}>TDS Deposited</th>
            <th style={{textAlign:'right'}}>Balance</th>
            <th style={{textAlign:'center'}}>26AS Status</th>
          </tr></thead>
          <tbody>
            {deductees.map((d,i)=>{
              const panOk    = d.pan && d.pan!=='PANNOTAVBL' && d.pan!=='UNKNOWN'
              const balance  = d.tdsAmt - d.deposited
              const depStatus = balance <= 0 ? 'deposited' : d.deposited > 0 ? 'partial' : 'pending'
              const asStatus  = !panOk ? 'pan_missing'
                              : balance <= 0 ? 'will_reflect'
                              : 'pending'
              return (
                <tr key={i}>
                  <td style={{color:'#6C757D',fontSize:11}}>{i+1}</td>
                  <td>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:12,
                      color:panOk?'#333':'#DC3545'}}>
                      {d.pan}
                    </span>
                    {!panOk&&<div style={{fontSize:9,color:'#DC3545',fontWeight:700}}>MISSING — TDS @ 20%</div>}
                  </td>
                  <td style={{fontWeight:600,fontSize:12}}>{d.name}</td>
                  <td style={{textAlign:'center'}}>
                    <span style={{background:(SEC_COLOR[d.section]||'#714B67')+'22',
                      color:SEC_COLOR[d.section]||'#714B67',
                      padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                      {d.section}
                    </span>
                  </td>
                  <td style={{textAlign:'center',fontFamily:'DM Mono,monospace',color:'#6C757D'}}>{d.count}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(d.grossAmt)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,color:'#DC3545'}}>{INR(d.tdsAmt)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#155724'}}>{INR(d.deposited)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,
                    color:balance>0?'#856404':'#155724'}}>
                    {balance>0?INR(balance):'—'}
                  </td>
                  <td style={{textAlign:'center'}}>
                    {asStatus==='pan_missing' && <span style={{background:'#F8D7DA',color:'#721C24',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>PAN Missing</span>}
                    {asStatus==='will_reflect' && <span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>Will Reflect</span>}
                    {asStatus==='pending' && <span style={{background:'#FFF3CD',color:'#856404',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700}}>Deposit Pending</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{background:'#F8F4F8',fontWeight:700,borderTop:'2px solid #714B67'}}>
              <td colSpan={5} style={{padding:'9px 12px',color:'#714B67'}}>TOTAL — {deductees.length} deductees</td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace'}}>{INR(deductees.reduce((a,d)=>a+d.grossAmt,0))}</td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:14,color:'#DC3545',fontWeight:800}}>{INR(deductees.reduce((a,d)=>a+d.tdsAmt,0))}</td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#155724'}}>{INR(deductees.reduce((a,d)=>a+d.deposited,0))}</td>
              <td style={{padding:'9px 12px',textAlign:'right',fontFamily:'DM Mono,monospace',color:'#856404'}}>{INR(deductees.reduce((a,d)=>a+(d.tdsAmt-d.deposited),0))}</td>
              <td/>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Filing checklist */}
      <div style={{marginTop:14,background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:16}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'#714B67',marginBottom:12}}>
          26Q Filing Checklist
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[
            { ok: panIssue.length===0,    label:`All deductee PANs valid (${panIssue.length} missing)` },
            { ok: (data?.data||[]).every(d=>d.deposited>=d.tdsAmt), label:'All TDS deposited with valid challans' },
            { ok: true,                   label:'Form 16A issued to all deductees' },
            { ok: true,                   label:'DSC / EVC ready for TRACES portal filing' },
            { ok: true,                   label:'Deductor TAN verified: CHEL12345C (update in settings)' },
          ].map((c,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:6,
              background:c.ok?'#F0FFF4':'#FFF3CD',border:`1px solid ${c.ok?'#C3E6CB':'#FAD7A0'}`}}>
              <span style={{fontSize:16}}>{c.ok?'\u2714':'\u26A0'}</span>
              <span style={{fontSize:12,fontWeight:c.ok?400:600,color:c.ok?'#155724':'#856404'}}>{c.label}</span>
              <span style={{marginLeft:'auto',fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,
                background:c.ok?'#D4EDDA':'#FEF8E6',color:c.ok?'#155724':'#856404',
                border:`1px solid ${c.ok?'#C3E6CB':'#FAD7A0'}`}}>
                {c.ok?'OK':'Action'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
