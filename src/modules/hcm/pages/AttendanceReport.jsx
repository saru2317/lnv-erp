import React, { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ Authorization: `Bearer ${getToken()}` })

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// Status display codes (like the PDF format)
const STATUS_CODE = {
  PRESENT:      'P',
  LATE:         'L',
  HALF_DAY:     'HD',
  ABSENT:       'AA',
  LOP:          'LOP',
  OD:           'OD',
  LEAVE:        'SL',
  WEEKLY_OFF:   'WO',
  MISSING_PUNCH:'MP',
  HOLIDAY:      'HOH',
  PERMISSION:   'PE',
}

const STATUS_BG = {
  P:'#D4EDDA',  L:'#FFF3CD',  HD:'#D1ECF1', AA:'#F8D7DA',
  LOP:'#F8D7DA',OD:'#EDE0EA', SL:'#E2D9F3', WO:'#E9ECEF',
  MP:'#FDE8D8', HOH:'#D1ECF1',PE:'#D1ECF1',
}
const STATUS_CLR = {
  P:'#155724',  L:'#856404',  HD:'#0C5460', AA:'#721C24',
  LOP:'#DC3545',OD:'#714B67', SL:'#4A0D67', WO:'#6C757D',
  MP:'#E06F39', HOH:'#0C5460',PE:'#0C5460',
}

const fmt2 = n => String(n||0).padStart(2,'0')
const minsHHMM = m => m?`${fmt2(Math.floor(m/60))}:${fmt2(m%60)}`:'—'
const getDaysInMonth = (y,m) => new Date(y,m,0).getDate()
const getDayOfWeek = (y,m,d) => new Date(y,m-1,d).getDay()

// Build employee summary from records
function buildSummary(records, daysInMonth) {
  const P=records.filter(r=>['PRESENT','LATE'].includes(r.status)).length
  const HD=records.filter(r=>r.status==='HALF_DAY').length
  const AA=records.filter(r=>['ABSENT','LOP'].includes(r.status)).length
  const WO=records.filter(r=>r.status==='WEEKLY_OFF').length
  const SL=records.filter(r=>r.status==='LEAVE').length
  const OD=records.filter(r=>r.status==='OD').length
  const LT=records.filter(r=>r.isLate).length
  const OT=records.reduce((s,r)=>s+(r.otMins||0),0)
  const LOP=records.filter(r=>r.status==='LOP').length
  const MP=records.filter(r=>r.isMissingPunch).length
  const workDays=daysInMonth-WO
  return { P, HD, AA, WO, SL, OD, LT, OT, LOP, MP,
    present: P+(HD*0.5)+OD, workDays }
}

export default function AttendanceReport() {
  const now = new Date()
  const [month,    setMonth]    = useState(now.getMonth()+1)
  const [year,     setYear]     = useState(now.getFullYear())
  const [category, setCategory] = useState('All')
  const [dept,     setDept]     = useState('All')
  const [gender,   setGender]   = useState('All')
  const [view,     setView]     = useState('grid') // grid | summary
  const [empData,  setEmpData]  = useState([]) // [{emp, records:[]}]
  const [depts,    setDepts]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const printRef = useRef()

  const daysInMonth = getDaysInMonth(year, month)
  const days = Array.from({length:daysInMonth},(_,i)=>i+1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch employees + attendance together
      const [empRes, attRes] = await Promise.all([
        fetch(`${BASE_URL}/employees`, { headers:authHdrs() }),
        fetch(`${BASE_URL}/attendance/register?month=${month}&year=${year}`,
          { headers:authHdrs() }),
      ])
      const empJson = await empRes.json()
      const attJson = await attRes.json()

      let employees = empJson.data || []
      const records  = attJson.data || []

      // Get unique depts
      setDepts(['All',...new Set(employees.map(e=>e.department).filter(Boolean))])

      // Apply filters
      if (dept !== 'All')  employees = employees.filter(e=>e.department===dept)
      if (category !== 'All') {
        employees = employees.filter(e => {
          const x = (() => { try { return JSON.parse(e.remarks||'{}') } catch { return {} } })()
          return (x.category||'Worker') === category
        })
      }
      if (gender !== 'All') {
        employees = employees.filter(e => {
          const x = (() => { try { return JSON.parse(e.remarks||'{}') } catch { return {} } })()
          return (x.gender||'Male') === gender
        })
      }

      // Build per-employee day data
      const empData = employees.map(emp => {
        const x = (() => { try { return JSON.parse(emp.remarks||'{}') } catch { return {} } })()
        const empRecords = records.filter(r=>r.empCode===emp.empCode)
        // Build day map
        const dayMap = {}
        empRecords.forEach(r => {
          const d = new Date(r.attendanceDate).getDate()
          dayMap[d] = r
        })
        // Fill weekly offs
        days.forEach(d => {
          if (!dayMap[d]) {
            const dow = getDayOfWeek(year,month,d)
            if (dow === 0) dayMap[d] = { status:'WEEKLY_OFF', dayOfWeek:'SUN' }
          }
        })
        return {
          emp, category: x.category||'Worker',
          gender: x.gender||'Male',
          dayMap, records: empRecords,
          summary: buildSummary(empRecords, daysInMonth)
        }
      })
      setEmpData(empData)
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [month, year, dept, category, gender])

  useEffect(()=>{ fetchData() }, [fetchData])

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML
    const win = window.open('','_blank')
    win.document.write(`
      <html><head>
      <title>Attendance Report - ${MONTHS[month-1]} ${year}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:Arial,sans-serif; font-size:9px; }
        .report-header { text-align:center; margin-bottom:10px; padding:8px; border-bottom:2px solid #333; }
        .report-header h2 { font-size:13px; font-weight:bold; }
        .report-header p  { font-size:10px; color:#555; margin-top:3px; }
        table { width:100%; border-collapse:collapse; }
        th,td { border:1px solid #CCC; padding:2px 3px; font-size:8px; text-align:center; }
        th { background:#F0F0F0; font-weight:bold; }
        .emp-info { text-align:left; font-weight:bold; }
        .wo  { background:#E9ECEF; color:#6C757D; }
        .aa  { background:#F8D7DA; color:#721C24; }
        .sl  { background:#E2D9F3; color:#4A0D67; }
        .p   { background:#D4EDDA; color:#155724; }
        .l   { background:#FFF3CD; color:#856404; }
        .hd  { background:#D1ECF1; color:#0C5460; }
        .od  { background:#EDE0EA; color:#714B67; }
        .mp  { background:#FDE8D8; color:#E06F39; }
        .punch { font-size:7px; color:#333; }
        .ot   { font-size:7px; color:#0C5460; }
        .summary-col { background:#F8F4F8; font-weight:bold; }
        @media print {
          @page { size:A4 landscape; margin:8mm; }
          body { font-size:8px; }
        }
      </style>
      </head><body>
      ${printContent}
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(()=>{ win.print(); win.close() }, 500)
  }

  // Totals row
  const totals = {
    present: empData.reduce((s,e)=>s+e.summary.present,0),
    AA:      empData.reduce((s,e)=>s+e.summary.AA,0),
    WO:      empData.reduce((s,e)=>s+e.summary.WO,0),
    SL:      empData.reduce((s,e)=>s+e.summary.SL,0),
    OD:      empData.reduce((s,e)=>s+e.summary.OD,0),
    LT:      empData.reduce((s,e)=>s+e.summary.LT,0),
    LOP:     empData.reduce((s,e)=>s+e.summary.LOP,0),
    OT:      empData.reduce((s,e)=>s+e.summary.OT,0),
  }

  return (
    <div style={{ padding:16, background:'#F8F7FA', minHeight:'100%' }}>
      {/* ── FILTER BAR ── */}
      <div style={{ background:'#fff', borderRadius:8, border:'1px solid #E0D5E0',
        padding:'12px 16px', marginBottom:14,
        display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:15,
          color:'#714B67', marginRight:8 }}>
          📋 Attendance Report
        </div>

        {/* Month */}
        <select value={month} onChange={e=>setMonth(parseInt(e.target.value))}
          style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
            borderRadius:5, fontSize:12, cursor:'pointer' }}>
          {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </select>

        {/* Year */}
        <select value={year} onChange={e=>setYear(parseInt(e.target.value))}
          style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
            borderRadius:5, fontSize:12, cursor:'pointer' }}>
          {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
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

        {/* Gender */}
        <select value={gender} onChange={e=>setGender(e.target.value)}
          style={{ padding:'6px 10px', border:'1px solid #E0D5E0',
            borderRadius:5, fontSize:12, cursor:'pointer' }}>
          {['All','Male','Female'].map(g=><option key={g}>{g}</option>)}
        </select>

        {/* View toggle */}
        <div style={{ display:'flex', gap:0, borderRadius:6,
          overflow:'hidden', border:'1px solid #E0D5E0' }}>
          {[['grid','📊 Grid'],['summary','📋 Summary']].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)}
              style={{ padding:'6px 12px', border:'none', cursor:'pointer',
                fontSize:11, fontWeight:600,
                background:view===v?'#714B67':'#fff',
                color:view===v?'#fff':'#6C757D' }}>{l}</button>
          ))}
        </div>

        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <span style={{ fontSize:11, color:'#6C757D', alignSelf:'center' }}>
            {empData.length} employees
          </span>
          <button onClick={handlePrint}
            style={{ padding:'6px 16px', background:'#714B67', color:'#fff',
              border:'none', borderRadius:5, fontSize:12, cursor:'pointer',
              fontWeight:700 }}>
            🖨️ Print
          </button>
        </div>
      </div>

      {/* ── LEGEND ── */}
      <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
        {Object.entries(STATUS_CODE).map(([k,v])=>(
          <span key={k} style={{ padding:'2px 8px', borderRadius:10, fontSize:10,
            fontWeight:700, background:STATUS_BG[v]||'#F0EEF0',
            color:STATUS_CLR[v]||'#6C757D' }}>{v} — {k.replace('_',' ')}</span>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>
          ⏳ Loading attendance data...
        </div>
      ) : empData.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ fontWeight:700 }}>No attendance data</div>
          <div style={{ fontSize:12, marginTop:4 }}>
            Process attendance in Attendance Register first
          </div>
        </div>
      ) : (
        <div ref={printRef}>
          {/* Print Header */}
          <div className="report-header" style={{ textAlign:'center',
            marginBottom:12, padding:'8px 0', borderBottom:'2px solid #714B67',
            display:'none' }} id="print-header">
            <h2>Monthly Attendance Detailed Report</h2>
            <p>Month: {MONTHS[month-1]} {year} | Category: {category} |
              Department: {dept} | Gender: {gender}</p>
          </div>

          {/* Screen header */}
          <div style={{ background:'#714B67', color:'#fff', padding:'10px 16px',
            borderRadius:'8px 8px 0 0', display:'flex',
            justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:14 }}>
                Monthly Attendance — {MONTHS[month-1]} {year}
              </div>
              <div style={{ fontSize:11, opacity:.8, marginTop:2 }}>
                {category!=='All'?`Category: ${category} | `:''}
                {dept!=='All'?`Dept: ${dept} | `:''}
                {gender!=='All'?`Gender: ${gender} | `:''}
                Total Records: {empData.length}
              </div>
            </div>
            <div style={{ fontSize:12, opacity:.8 }}>
              {daysInMonth} working days
            </div>
          </div>

          {/* ── GRID VIEW (day-wise like PDF) ── */}
          {view==='grid' && (
            <div style={{ overflowX:'auto', overflowY:'auto',
              maxHeight:'calc(100vh - 320px)',
              border:'1px solid #E0D5E0', borderTop:'none',
              borderRadius:'0 0 8px 8px',
              boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
              <table style={{ borderCollapse:'collapse', fontSize:10,
                background:'#fff', minWidth: daysInMonth*60+400 }}>
                <thead style={{ position:'sticky', top:0, zIndex:20 }}>
                  {/* Day numbers row */}
                  <tr style={{ background:'#F8F4F8' }}>
                    <th rowSpan={2} style={{ padding:'6px 8px', fontSize:10,
                      fontWeight:700, color:'#714B67', textAlign:'left',
                      border:'1px solid #E0D5E0', minWidth:40,
                      position:'sticky', left:0, zIndex:30,
                      background:'#F8F4F8' }}>SNO</th>
                    <th rowSpan={2} style={{ padding:'6px 8px', fontSize:10,
                      fontWeight:700, color:'#714B67', textAlign:'left',
                      border:'1px solid #E0D5E0', minWidth:60,
                      position:'sticky', left:40, zIndex:30,
                      background:'#F8F4F8' }}>Emp Code</th>
                    <th rowSpan={2} style={{ padding:'6px 8px', fontSize:10,
                      fontWeight:700, color:'#714B67', textAlign:'left',
                      border:'1px solid #E0D5E0', minWidth:120,
                      position:'sticky', left:100, zIndex:30,
                      background:'#F8F4F8' }}>Name</th>
                    <th rowSpan={2} style={{ padding:'6px 8px', fontSize:10,
                      fontWeight:700, color:'#714B67', textAlign:'left',
                      border:'1px solid #E0D5E0', minWidth:80,
                      position:'sticky', left:220, zIndex:30,
                      background:'#F8F4F8' }}>Dept</th>
                    {days.map(d=>{
                      const dow = getDayOfWeek(year,month,d)
                      const isWO = dow===0
                      return (
                        <th key={d} style={{ padding:'4px 2px', fontSize:9,
                          fontWeight:700, color: isWO?'#DC3545':'#495057',
                          border:'1px solid #E0D5E0', minWidth:52, maxWidth:52,
                          textAlign:'center',
                          background: isWO?'#FFF5F5':'#F8F4F8' }}>
                          <div>{d}</div>
                          <div style={{ fontSize:8, fontWeight:400,
                            color:isWO?'#DC3545':'#6C757D' }}>
                            {DAYS_SHORT[dow]}
                          </div>
                        </th>
                      )
                    })}
                    {/* Summary headers */}
                    {[['P+OD','Present'],['AA','Absent'],['WO','Week Off'],
                      ['SL','Leave'],['LT','Late'],['OT hrs','OT'],
                      ['LOP','LOP']].map(([code,label])=>(
                      <th key={code} style={{ padding:'4px 4px', fontSize:9,
                        fontWeight:700, color:'#714B67',
                        border:'1px solid #E0D5E0', minWidth:48,
                        background:'#EDE0EA', textAlign:'center' }}>
                        <div>{code}</div>
                        <div style={{ fontSize:8, fontWeight:400,
                          color:'#6C757D' }}>{label}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empData.map((ed,idx)=>(
                    <tr key={ed.emp.empCode}
                      style={{ borderBottom:'2px solid #E0D5E0' }}>
                      {/* Fixed columns */}
                      <td style={{ padding:'4px 6px', fontSize:10,
                        fontWeight:600, color:'#6C757D', textAlign:'center',
                        border:'1px solid #E0D5E0', verticalAlign:'middle',
                        position:'sticky', left:0, zIndex:10,
                        background:'#fff' }}>{idx+1}</td>
                      <td style={{ padding:'4px 6px', fontSize:10,
                        fontFamily:'DM Mono,monospace', fontWeight:700,
                        color:'#714B67', border:'1px solid #E0D5E0',
                        verticalAlign:'middle',
                        position:'sticky', left:40, zIndex:10,
                        background:'#fff' }}>{ed.emp.empCode}</td>
                      <td style={{ padding:'4px 6px', fontSize:11,
                        fontWeight:700, color:'#1C1C1C',
                        border:'1px solid #E0D5E0', verticalAlign:'middle',
                        position:'sticky', left:100, zIndex:10,
                        background:'#fff', whiteSpace:'nowrap' }}>
                        {ed.emp.name}
                        <div style={{ fontSize:9, color:'#6C757D',
                          fontWeight:400 }}>{ed.category}</div>
                      </td>
                      <td style={{ padding:'4px 6px', fontSize:10,
                        color:'#6C757D', border:'1px solid #E0D5E0',
                        verticalAlign:'middle',
                        position:'sticky', left:220, zIndex:10,
                        background:'#fff', whiteSpace:'nowrap' }}>
                        {ed.emp.department}
                      </td>

                      {/* Day cells */}
                      {days.map(d=>{
                        const rec = ed.dayMap[d]
                        const dow = getDayOfWeek(year,month,d)
                        const isWO = dow===0
                        if (!rec) return (
                          <td key={d} style={{ padding:2, textAlign:'center',
                            border:'1px solid #E0D5E0', fontSize:9,
                            background:isWO?'#FFF5F5':'#fff',
                            color:'#CCC', verticalAlign:'middle' }}>
                            {isWO ? <span style={{ color:'#DC3545',
                              fontWeight:700, fontSize:9 }}>WO</span> : '—'}
                          </td>
                        )
                        const code = STATUS_CODE[rec.status] || rec.status
                        const bg   = STATUS_BG[code]  || '#fff'
                        const clr  = STATUS_CLR[code] || '#1C1C1C'
                        return (
                          <td key={d} style={{ padding:2, textAlign:'center',
                            border:'1px solid #E0D5E0', background:bg,
                            verticalAlign:'top', minWidth:52 }}>
                            {/* Status code */}
                            <div style={{ fontSize:9, fontWeight:700,
                              color:clr, marginBottom:1 }}>{code}</div>
                            {/* IN time */}
                            {rec.punchIn && (
                              <div style={{ fontSize:8, color:'#155724',
                                lineHeight:1.2 }}>{rec.punchIn}</div>
                            )}
                            {/* OUT time */}
                            {rec.punchOut && (
                              <div style={{ fontSize:8, color:'#0C5460',
                                lineHeight:1.2 }}>{rec.punchOut}</div>
                            )}
                            {/* OT */}
                            {rec.otMins>0 && (
                              <div style={{ fontSize:8, color:'#714B67',
                                fontWeight:700, lineHeight:1.2 }}>
                                OT:{minsHHMM(rec.otMins)}
                              </div>
                            )}
                            {/* Late */}
                            {rec.lateMins>0 && (
                              <div style={{ fontSize:8, color:'#856404',
                                lineHeight:1.2 }}>L:{rec.lateMins}m</div>
                            )}
                          </td>
                        )
                      })}

                      {/* Summary cells */}
                      {[
                        [ed.summary.present.toFixed(1), '#155724', '#D4EDDA'],
                        [ed.summary.AA, '#721C24', '#F8D7DA'],
                        [ed.summary.WO, '#6C757D', '#E9ECEF'],
                        [ed.summary.SL, '#4A0D67', '#E2D9F3'],
                        [ed.summary.LT, '#856404', '#FFF3CD'],
                        [minsHHMM(ed.summary.OT), '#0C5460', '#D1ECF1'],
                        [ed.summary.LOP, '#DC3545', '#F8D7DA'],
                      ].map(([val,clr,bg],i)=>(
                        <td key={i} style={{ padding:'4px 4px', textAlign:'center',
                          border:'1px solid #E0D5E0', fontWeight:800,
                          fontSize:12, color:clr, background:bg,
                          fontFamily:'DM Mono,monospace',
                          verticalAlign:'middle' }}>{val}</td>
                      ))}
                    </tr>
                  ))}

                  {/* Totals row */}
                  <tr style={{ background:'#F8F4F8',
                    borderTop:'2px solid #714B67' }}>
                    <td colSpan={4} style={{ padding:'6px 10px',
                      fontWeight:800, fontSize:12, color:'#714B67',
                      border:'1px solid #E0D5E0',
                      position:'sticky', left:0, zIndex:10,
                      background:'#F8F4F8' }}>
                      TOTAL ({empData.length} employees)
                    </td>
                    {days.map(d=>(
                      <td key={d} style={{ border:'1px solid #E0D5E0',
                        background:'#F8F4F8' }} />
                    ))}
                    {[
                      [totals.present.toFixed(1),'#155724','#D4EDDA'],
                      [totals.AA,'#721C24','#F8D7DA'],
                      [totals.WO,'#6C757D','#E9ECEF'],
                      [totals.SL,'#4A0D67','#E2D9F3'],
                      [totals.LT,'#856404','#FFF3CD'],
                      [minsHHMM(totals.OT),'#0C5460','#D1ECF1'],
                      [totals.LOP,'#DC3545','#F8D7DA'],
                    ].map(([val,clr,bg],i)=>(
                      <td key={i} style={{ padding:'6px 4px', textAlign:'center',
                        border:'1px solid #E0D5E0', fontWeight:800,
                        fontSize:13, color:clr, background:bg,
                        fontFamily:'DM Mono,monospace' }}>{val}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── SUMMARY VIEW ── */}
          {view==='summary' && (
            <div style={{ overflowX:'auto', overflowY:'auto',
              maxHeight:'calc(100vh - 320px)',
              border:'1px solid #E0D5E0', borderTop:'none',
              borderRadius:'0 0 8px 8px' }}>
              <table style={{ width:'100%', borderCollapse:'collapse',
                background:'#fff', fontSize:12 }}>
                <thead style={{ position:'sticky', top:0, zIndex:10,
                  background:'#F8F4F8',
                  boxShadow:'0 2px 4px rgba(0,0,0,.08)' }}>
                  <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                    {['#','Emp Code','Name','Department','Category',
                      'Work Days','Present','Absent','Leave','Weekly Off',
                      'Late','OT Hours','LOP','Missing Punch'].map(h=>(
                      <th key={h} style={{ padding:'9px 12px', fontSize:10,
                        fontWeight:700, color:'#6C757D', textAlign:'left',
                        textTransform:'uppercase', letterSpacing:.3,
                        border:'1px solid #E0D5E0', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empData.map((ed,i)=>(
                    <tr key={ed.emp.empCode} style={{
                      borderBottom:'1px solid #F0EEF0',
                      background:i%2===0?'#fff':'#FDFBFD' }}>
                      <td style={{ padding:'8px 12px', fontSize:11,
                        color:'#6C757D', textAlign:'center',
                        border:'1px solid #F0EEF0' }}>{i+1}</td>
                      <td style={{ padding:'8px 12px',
                        fontFamily:'DM Mono,monospace', fontWeight:700,
                        color:'#714B67', fontSize:12,
                        border:'1px solid #F0EEF0' }}>{ed.emp.empCode}</td>
                      <td style={{ padding:'8px 12px', fontWeight:700,
                        fontSize:13, border:'1px solid #F0EEF0' }}>
                        {ed.emp.name}</td>
                      <td style={{ padding:'8px 12px', fontSize:12,
                        color:'#6C757D', border:'1px solid #F0EEF0' }}>
                        {ed.emp.department}</td>
                      <td style={{ padding:'8px 12px',
                        border:'1px solid #F0EEF0' }}>
                        <span style={{ padding:'2px 8px', borderRadius:10,
                          fontSize:11, fontWeight:600,
                          background: ed.category==='Worker'?'#FDE8D8':
                            ed.category==='Staff'?'#D1ECF1':'#EDE0EA',
                          color: ed.category==='Worker'?'#E06F39':
                            ed.category==='Staff'?'#0C5460':'#714B67' }}>
                          {ed.category}
                        </span>
                      </td>
                      {[
                        [ed.summary.workDays, '#495057', ''],
                        [ed.summary.present.toFixed(1), '#155724', '#D4EDDA'],
                        [ed.summary.AA, '#721C24', ed.summary.AA>0?'#F8D7DA':''],
                        [ed.summary.SL, '#4A0D67', ed.summary.SL>0?'#E2D9F3':''],
                        [ed.summary.WO, '#6C757D', ''],
                        [ed.summary.LT, '#856404', ed.summary.LT>0?'#FFF3CD':''],
                        [minsHHMM(ed.summary.OT), '#0C5460', ed.summary.OT>0?'#D1ECF1':''],
                        [ed.summary.LOP, '#DC3545', ed.summary.LOP>0?'#F8D7DA':''],
                        [ed.summary.MP, '#E06F39', ed.summary.MP>0?'#FDE8D8':''],
                      ].map(([val,clr,bg],j)=>(
                        <td key={j} style={{ padding:'8px 12px',
                          textAlign:'center', fontWeight:700,
                          fontFamily:'DM Mono,monospace', fontSize:13,
                          color:clr, background:bg||'transparent',
                          border:'1px solid #F0EEF0' }}>{val}</td>
                      ))}
                    </tr>
                  ))}
                  {/* Totals */}
                  <tr style={{ background:'#EDE0EA',
                    borderTop:'2px solid #714B67' }}>
                    <td colSpan={5} style={{ padding:'8px 12px',
                      fontWeight:800, fontSize:13, color:'#714B67',
                      border:'1px solid #E0D5E0' }}>
                      TOTAL ({empData.length} employees)
                    </td>
                    {[
                      ['—','#495057',''],
                      [totals.present.toFixed(1),'#155724','#D4EDDA'],
                      [totals.AA,'#721C24','#F8D7DA'],
                      [totals.SL,'#4A0D67','#E2D9F3'],
                      [totals.WO,'#6C757D','#E9ECEF'],
                      [totals.LT,'#856404','#FFF3CD'],
                      [minsHHMM(totals.OT),'#0C5460','#D1ECF1'],
                      [totals.LOP,'#DC3545','#F8D7DA'],
                      ['—','#E06F39',''],
                    ].map(([val,clr,bg],j)=>(
                      <td key={j} style={{ padding:'8px 12px',
                        textAlign:'center', fontWeight:800, fontSize:14,
                        color:clr, background:bg,
                        fontFamily:'DM Mono,monospace',
                        border:'1px solid #E0D5E0' }}>{val}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
