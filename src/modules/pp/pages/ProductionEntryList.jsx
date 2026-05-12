import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

// ── Helpers ───────────────────────────────────────────────────────────────────
const today     = () => new Date().toISOString().split('T')[0]
const thisMonth = () => new Date().getMonth() + 1
const thisYear  = () => new Date().getFullYear()
const fmtDate   = (d) => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'
const INR       = v => parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const YEARS  = [2024,2025,2026,2027]
const SHIFTS = ['All','A','B','C','G']

// ── Styles ────────────────────────────────────────────────────────────────────
const chip = (active) => ({
  padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', border:'none',
  background: active ? '#1A5276' : '#F0F0F0',
  color:       active ? '#fff'    : '#6C757D',
})
const effColor = e => parseFloat(e)>=80?'#155724':parseFloat(e)>=60?'#856404':'#721C24'
const effBg    = e => parseFloat(e)>=80?'#D4EDDA':parseFloat(e)>=60?'#FFF3CD':'#F8D7DA'

// ══════════════════════════════════════════════════════════════════════════════
// DETAIL MODAL
// ══════════════════════════════════════════════════════════════════════════════
function DetailModal({ entry, onClose }) {
  if (!entry) return null
  const idle = (() => { try { return JSON.parse(entry.industryData||'{}').idleRows || [] } catch { return [] } })()
  const tot  = parseFloat(entry.goodQty||0) + parseFloat(entry.rejectedQty||0)
  const rp   = tot > 0 ? ((parseFloat(entry.rejectedQty||0)/tot)*100).toFixed(1) : '0.0'

  const Row = ({l,v,mono}) => (
    <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #F0F0F0',fontSize:12}}>
      <span style={{color:'#6C757D',minWidth:160}}>{l}</span>
      <span style={{fontWeight:600,fontFamily:mono?'DM Mono,monospace':'inherit'}}>{v||'—'}</span>
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
      <div style={{background:'#fff',borderRadius:10,width:'96%',maxWidth:820,maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>

        {/* Header */}
        <div style={{background:'#1A5276',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{color:'#fff',fontWeight:800,fontSize:15,fontFamily:'Syne,sans-serif'}}>
              Production Entry Detail — {entry.logNo}
            </div>
            <div style={{color:'rgba(255,255,255,.6)',fontSize:11,marginTop:2}}>
              {fmtDate(entry.entryDate)} · Shift {entry.shift} · {entry.machineName||entry.wcId}
            </div>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <div style={{background:effBg(entry.efficiency||0),color:effColor(entry.efficiency||0),padding:'6px 16px',borderRadius:20,fontWeight:800,fontSize:14}}>
              {entry.efficiency||0}% Efficiency
            </div>
            <span onClick={onClose} style={{color:'#fff',cursor:'pointer',fontSize:20}}>✕</span>
          </div>
        </div>

        <div style={{overflowY:'auto',flex:1,padding:20}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

            {/* Left */}
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'#1A5276',textTransform:'uppercase',marginBottom:8}}>📋 Order Info</div>
              <Row l="Log No"       v={entry.logNo}         mono />
              <Row l="Work Order"   v={entry.woNo}          mono />
              <Row l="Item"         v={entry.itemName} />
              <Row l="Item Code"    v={entry.itemCode}      mono />
              <Row l="Entry Date"   v={fmtDate(entry.entryDate)} />
              <Row l="Shift"        v={`Shift ${entry.shift}`} />

              <div style={{fontSize:11,fontWeight:700,color:'#1A5276',textTransform:'uppercase',margin:'14px 0 8px'}}>🏭 Machine Info</div>
              <Row l="Machine"      v={entry.machineName||entry.wcId} />
              <Row l="Mould / Tool" v={entry.mouldId}      mono />
              <Row l="No. of Shots" v={INR(entry.shots)} />
              <Row l="Avg Cycle Time" v={entry.cycleTimeSec ? `${entry.cycleTimeSec} sec` : '—'} />
              <Row l="Material Used" v={entry.materialUsedKg ? `${entry.materialUsedKg} kg` : '—'} />

              <div style={{fontSize:11,fontWeight:700,color:'#1A5276',textTransform:'uppercase',margin:'14px 0 8px'}}>👷 Operator</div>
              <Row l="Operator"     v={entry.operatorName} />
              <Row l="Emp Code"     v={entry.operatorCode} mono />
              <Row l="Supervisor"   v={entry.supervisorName} />
              <Row l="Remarks"      v={entry.remarks} />
            </div>

            {/* Right */}
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'#1A5276',textTransform:'uppercase',marginBottom:8}}>⏱️ Time Analysis</div>
              <Row l="Shift Start"    v={entry.startTime} />
              <Row l="Shift End"      v={entry.endTime} />
              <Row l="Total Shift"    v={`${entry.totalMins||0} mins`} />
              <Row l="Total Idle"     v={`${entry.totalIdleMins||0} mins`} />
              <Row l="Prod. Time"     v={`${entry.prodMins||0} mins`} />

              <div style={{fontSize:11,fontWeight:700,color:'#1A5276',textTransform:'uppercase',margin:'14px 0 8px'}}>📦 Production Qty</div>
              <Row l="Planned Qty"    v={INR(entry.plannedQty)} />
              <Row l="Good Qty"       v={<span style={{color:'#155724',fontWeight:800}}>{INR(entry.goodQty)}</span>} />
              <Row l="Rejected Qty"   v={<span style={{color:'#721C24',fontWeight:700}}>{INR(entry.rejectedQty)}</span>} />
              <Row l="Rework Qty"     v={<span style={{color:'#856404',fontWeight:700}}>{INR(entry.reworkQty)}</span>} />
              <Row l="Rejection %"    v={<span style={{color:parseFloat(rp)>5?'#721C24':'#155724',fontWeight:800}}>{rp}%</span>} />
              <Row l="Rejection Reason" v={entry.rejectionReason} />
              <Row l="Rej. Remarks"   v={entry.rejectionRemarks} />

              {/* Idle breakdown */}
              {idle.length > 0 && (
                <>
                  <div style={{fontSize:11,fontWeight:700,color:'#856404',textTransform:'uppercase',margin:'14px 0 8px'}}>⚠️ Idle Time Breakdown</div>
                  <div style={{background:'#FFFBF0',border:'1px solid #F9E79F',borderRadius:6,overflow:'hidden'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                      <thead>
                        <tr style={{background:'#FEF9C3'}}>
                          <th style={{padding:'5px 10px',textAlign:'left',fontWeight:700}}>Reason</th>
                          <th style={{padding:'5px 10px',textAlign:'center'}}>From</th>
                          <th style={{padding:'5px 10px',textAlign:'center'}}>To</th>
                          <th style={{padding:'5px 10px',textAlign:'right'}}>Mins</th>
                        </tr>
                      </thead>
                      <tbody>
                        {idle.map((r,i)=>(
                          <tr key={i} style={{borderTop:'1px solid #FEF9C3'}}>
                            <td style={{padding:'5px 10px',color:'#6C757D'}}>{r.reasonCode} — {r.remarks||''}</td>
                            <td style={{padding:'5px 10px',textAlign:'center',fontFamily:'DM Mono,monospace'}}>{r.startTime}</td>
                            <td style={{padding:'5px 10px',textAlign:'center',fontFamily:'DM Mono,monospace'}}>{r.endTime}</td>
                            <td style={{padding:'5px 10px',textAlign:'right',fontWeight:700,color:'#856404'}}>{r.mins}m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{padding:'10px 20px',borderTop:'1px solid #E0D5E0',background:'#F8F9FA',display:'flex',justifyContent:'flex-end'}}>
          <button onClick={onClose}
            style={{padding:'8px 24px',background:'#1A5276',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN LIST SCREEN
// ══════════════════════════════════════════════════════════════════════════════
export default function ProductionEntryList() {
  const navigate = useNavigate()

  // ── Filters ────────────────────────────────────────────────────────────────
  const [mode,     setMode]     = useState('today')  // today | month | range
  const [fromDate, setFromDate] = useState(today())
  const [toDate,   setToDate]   = useState(today())
  const [month,    setMonth]    = useState(thisMonth())
  const [year,     setYear]     = useState(thisYear())
  const [machine,  setMachine]  = useState('All')
  const [shift,    setShift]    = useState('All')
  const [search,   setSearch]   = useState('')

  // ── Data ───────────────────────────────────────────────────────────────────
  const [entries,  setEntries]  = useState([])
  const [machines, setMachines] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [detail,   setDetail]   = useState(null)

  // ── Fetch machines ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/pp/work-centers`, { headers: authHdrs() })
      .then(r=>r.json()).then(d=>setMachines(d.data||[])).catch(()=>{})
  }, [])

  // ── Fetch entries ──────────────────────────────────────────────────────────
  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (mode === 'today') {
        params.set('date', today())
      } else if (mode === 'month') {
        const y = year, m = String(month).padStart(2,'0')
        params.set('fromDate', `${y}-${m}-01`)
        params.set('toDate',   `${y}-${m}-31`)
      } else {
        params.set('fromDate', fromDate)
        params.set('toDate',   toDate)
      }
      if (machine !== 'All') params.set('wcId', machine)
      if (shift   !== 'All') params.set('shift', shift)

      const res  = await fetch(`${BASE_URL}/pp/production-entry?${params}`, { headers: authHdrs() })
      const data = await res.json()
      setEntries(data.data || [])
    } catch { toast.error('Failed to load entries') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchEntries() }, [mode, fromDate, toDate, month, year, machine, shift])

  // ── Filter by search ───────────────────────────────────────────────────────
  const filtered = entries.filter(e =>
    !search ||
    e.logNo?.toLowerCase().includes(search.toLowerCase()) ||
    e.woNo?.toLowerCase().includes(search.toLowerCase()) ||
    e.operatorName?.toLowerCase().includes(search.toLowerCase()) ||
    e.machineName?.toLowerCase().includes(search.toLowerCase())
  )

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalGood     = filtered.reduce((s,e) => s + parseFloat(e.goodQty||0), 0)
  const totalRejected = filtered.reduce((s,e) => s + parseFloat(e.rejectedQty||0), 0)
  const totalRework   = filtered.reduce((s,e) => s + parseFloat(e.reworkQty||0), 0)
  const totalIdle     = filtered.reduce((s,e) => s + parseFloat(e.totalIdleMins||0), 0)
  const avgEff        = filtered.length ? (filtered.reduce((s,e)=>s+parseFloat(e.efficiency||0),0)/filtered.length).toFixed(1) : '0.0'
  const rejPct        = (totalGood+totalRejected) > 0 ? ((totalRejected/(totalGood+totalRejected))*100).toFixed(1) : '0.0'

  // ── Machine-wise summary ───────────────────────────────────────────────────
  const machineWise = Object.values(
    filtered.reduce((acc, e) => {
      const key = e.machineName || e.wcId || 'Unknown'
      if (!acc[key]) acc[key] = { machine:key, entries:0, good:0, rejected:0, idle:0, effSum:0 }
      acc[key].entries++
      acc[key].good     += parseFloat(e.goodQty||0)
      acc[key].rejected += parseFloat(e.rejectedQty||0)
      acc[key].idle     += parseFloat(e.totalIdleMins||0)
      acc[key].effSum   += parseFloat(e.efficiency||0)
      return acc
    }, {})
  ).map(m => ({ ...m, avgEff: m.entries ? (m.effSum/m.entries).toFixed(1) : '0.0' }))

  return (
    <div style={{fontFamily:'DM Sans,sans-serif',fontSize:13}}>

      {/* ── Page Header ── */}
      <div className="fi-lv-hdr" style={{marginBottom:14}}>
        <div className="fi-lv-title">
          Production Entry Register
          <small>SAP: CO11N / COOIS — {filtered.length} records</small>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={fetchEntries}
            style={{padding:'7px 14px',background:'#F0F0F0',border:'none',borderRadius:6,fontSize:12,cursor:'pointer',fontWeight:600}}>
            🔄 Refresh
          </button>
          <button onClick={() => navigate('/pp/entry')}
            style={{padding:'7px 20px',background:'#1A5276',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            + New Entry
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{background:'#fff',border:'1.5px solid #E0D5E0',borderRadius:8,padding:14,marginBottom:14}}>

        {/* Mode selector */}
        <div style={{display:'flex',gap:6,marginBottom:12,alignItems:'center'}}>
          <span style={{fontSize:11,fontWeight:700,color:'#6C757D',marginRight:4}}>View:</span>
          {[
            {key:'today', label:'Today'},
            {key:'month', label:'This Month'},
            {key:'range', label:'Date Range'},
          ].map(m=>(
            <button key={m.key} onClick={()=>setMode(m.key)} style={chip(mode===m.key)}>{m.label}</button>
          ))}
        </div>

        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end'}}>

          {/* Month/Year filters */}
          {mode === 'month' && (
            <>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'#6C757D',marginBottom:3}}>MONTH</div>
                <select value={month} onChange={e=>setMonth(parseInt(e.target.value))}
                  style={{padding:'6px 10px',border:'1.5px solid #D0D7DE',borderRadius:5,fontSize:12,outline:'none',cursor:'pointer'}}>
                  {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'#6C757D',marginBottom:3}}>YEAR</div>
                <select value={year} onChange={e=>setYear(parseInt(e.target.value))}
                  style={{padding:'6px 10px',border:'1.5px solid #D0D7DE',borderRadius:5,fontSize:12,outline:'none',cursor:'pointer'}}>
                  {YEARS.map(y=><option key={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Date range */}
          {mode === 'range' && (
            <>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'#6C757D',marginBottom:3}}>FROM DATE</div>
                <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}
                  style={{padding:'6px 10px',border:'1.5px solid #D0D7DE',borderRadius:5,fontSize:12,outline:'none'}} />
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'#6C757D',marginBottom:3}}>TO DATE</div>
                <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}
                  style={{padding:'6px 10px',border:'1.5px solid #D0D7DE',borderRadius:5,fontSize:12,outline:'none'}} />
              </div>
            </>
          )}

          {/* Machine filter */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#6C757D',marginBottom:3}}>MACHINE</div>
            <select value={machine} onChange={e=>setMachine(e.target.value)}
              style={{padding:'6px 10px',border:'1.5px solid #D0D7DE',borderRadius:5,fontSize:12,outline:'none',cursor:'pointer',minWidth:160}}>
              <option value="All">All Machines</option>
              {machines.length > 0
                ? machines.map(m=><option key={m.id} value={m.wcId}>{m.wcId} — {m.name}</option>)
                : ['IMM-150T','IMM-200T','IMM-80T'].map(m=><option key={m} value={m}>{m}</option>)
              }
            </select>
          </div>

          {/* Shift filter */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#6C757D',marginBottom:3}}>SHIFT</div>
            <div style={{display:'flex',gap:4}}>
              {SHIFTS.map(s=>(
                <button key={s} onClick={()=>setShift(s)} style={chip(shift===s)}>{s==='All'?'All Shifts':`Shift ${s}`}</button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{marginLeft:'auto'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#6C757D',marginBottom:3}}>SEARCH</div>
            <input placeholder="Log No / WO / Operator..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{padding:'6px 12px',border:'1.5px solid #D0D7DE',borderRadius:5,fontSize:12,outline:'none',width:220}} />
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,marginBottom:14}}>
        {[
          {label:'Total Entries',  value:filtered.length,  bg:'#EBF5FB', c:'#1A5276'},
          {label:'Good Qty',       value:INR(totalGood),   bg:'#D4EDDA', c:'#155724'},
          {label:'Rejected Qty',   value:INR(totalRejected),bg:'#F8D7DA',c:'#721C24'},
          {label:'Rework Qty',     value:INR(totalRework), bg:'#FFF3CD', c:'#856404'},
          {label:'Rejection %',    value:`${rejPct}%`,     bg: parseFloat(rejPct)>5?'#F8D7DA':'#D4EDDA', c:parseFloat(rejPct)>5?'#721C24':'#155724'},
          {label:'Avg Efficiency', value:`${avgEff}%`,     bg:effBg(avgEff), c:effColor(avgEff)},
        ].map(k=>(
          <div key={k.label} style={{background:k.bg,border:`1px solid ${k.c}22`,borderRadius:8,padding:'10px 14px'}}>
            <div style={{fontSize:10,fontWeight:700,color:k.c,textTransform:'uppercase',letterSpacing:.4}}>{k.label}</div>
            <div style={{fontSize:20,fontWeight:800,color:k.c,fontFamily:'Syne,sans-serif'}}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Machine-wise Summary ── */}
      {machineWise.length > 0 && (
        <div style={{background:'#fff',border:'1.5px solid #E0D5E0',borderRadius:8,padding:14,marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#1A5276',textTransform:'uppercase',marginBottom:10}}>🏭 Machine-wise Summary</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {machineWise.map(m=>(
              <div key={m.machine} style={{background:'#F8F9FA',border:'1.5px solid #E0D5E0',borderRadius:8,padding:'10px 16px',minWidth:160}}>
                <div style={{fontWeight:800,fontSize:13,color:'#1A5276',marginBottom:4}}>{m.machine}</div>
                <div style={{display:'flex',gap:12,fontSize:11}}>
                  <span style={{color:'#155724',fontWeight:700}}>✅ {INR(m.good)}</span>
                  <span style={{color:'#721C24',fontWeight:700}}>❌ {INR(m.rejected)}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:11}}>
                  <span style={{color:'#6C757D'}}>{m.entries} entries</span>
                  <span style={{fontWeight:700,color:effColor(m.avgEff)}}>{m.avgEff}% eff</span>
                </div>
                {parseFloat(m.idle) > 0 && (
                  <div style={{fontSize:10,color:'#856404',marginTop:2}}>⚠️ {m.idle}m idle</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Table ── */}
      <div style={{border:'1.5px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
        <div style={{background:'#1A5276',padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'#fff',fontWeight:700,fontSize:13}}>
            📋 Production Entries
            {mode==='today'  && ' — Today'}
            {mode==='month'  && ` — ${MONTHS[month-1]} ${year}`}
            {mode==='range'  && ` — ${fromDate} to ${toDate}`}
          </span>
          <span style={{color:'rgba(255,255,255,.6)',fontSize:11}}>{filtered.length} records</span>
        </div>

        <div style={{overflowX:'auto',maxHeight:'calc(100vh - 460px)',overflowY:'auto'}}>
          <table className="fi-data-table" style={{width:'100%',minWidth:1100}}>
            <thead style={{position:'sticky',top:0,background:'#F8F9FA',zIndex:5}}>
              <tr>
                <th>Log No</th>
                <th>Date</th>
                <th>Shift</th>
                <th>Machine</th>
                <th>WO No</th>
                <th>Item</th>
                <th>Good Qty</th>
                <th>Rejected</th>
                <th>Rework</th>
                <th>Rej %</th>
                <th>Idle (min)</th>
                <th>Efficiency</th>
                <th>Operator</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={14} style={{textAlign:'center',padding:40,color:'#6C757D'}}>⏳ Loading...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={14} style={{textAlign:'center',padding:50,color:'#6C757D',fontSize:13}}>
                  📝 No entries found for selected filters
                  <br/><br/>
                  <button onClick={()=>navigate('/pp/entry')}
                    style={{padding:'8px 20px',background:'#1A5276',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                    + Create First Entry
                  </button>
                </td></tr>
              )}
              {!loading && filtered.map((e,i) => {
                const tot = parseFloat(e.goodQty||0) + parseFloat(e.rejectedQty||0)
                const rp  = tot > 0 ? ((parseFloat(e.rejectedQty||0)/tot)*100).toFixed(1) : '0.0'
                const eff = parseFloat(e.efficiency||0)
                return (
                  <tr key={e.id||i} style={{background:i%2===0?'#fff':'#FAFAFA',cursor:'pointer'}}
                    onClick={()=>setDetail(e)}>
                    <td style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#1A5276',fontWeight:700}}>{e.logNo||`#${i+1}`}</td>
                    <td style={{fontSize:11}}>{fmtDate(e.entryDate)}</td>
                    <td><span style={{padding:'2px 8px',borderRadius:8,background:'#EBF5FB',color:'#1A5276',fontSize:10,fontWeight:700}}>Shift {e.shift}</span></td>
                    <td style={{fontSize:11,fontWeight:600}}>{e.machineName||e.wcId||'—'}</td>
                    <td style={{fontSize:11,fontFamily:'DM Mono,monospace',color:'#6C757D'}}>{e.woNo||'—'}</td>
                    <td style={{fontSize:11,maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.itemName||'—'}</td>
                    <td style={{fontWeight:800,color:'#155724',fontSize:13}}>{INR(e.goodQty)}</td>
                    <td style={{fontWeight:700,color:parseFloat(e.rejectedQty)>0?'#721C24':'#6C757D'}}>{INR(e.rejectedQty)}</td>
                    <td style={{fontWeight:700,color:parseFloat(e.reworkQty)>0?'#856404':'#6C757D'}}>{INR(e.reworkQty)}</td>
                    <td><span style={{padding:'2px 8px',borderRadius:8,fontSize:10,fontWeight:700,background:parseFloat(rp)>5?'#F8D7DA':'#D4EDDA',color:parseFloat(rp)>5?'#721C24':'#155724'}}>{rp}%</span></td>
                    <td style={{fontWeight:700,color:parseFloat(e.totalIdleMins)>30?'#856404':'#6C757D',fontSize:11}}>{e.totalIdleMins||0}m</td>
                    <td><span style={{padding:'3px 10px',borderRadius:8,fontSize:11,fontWeight:800,background:effBg(eff),color:effColor(eff)}}>{eff}%</span></td>
                    <td style={{fontSize:11}}>{e.operatorName||'—'}</td>
                    <td onClick={ev=>ev.stopPropagation()}>
                      <button onClick={()=>setDetail(e)}
                        style={{padding:'3px 10px',fontSize:10,fontWeight:700,borderRadius:4,border:'1px solid #1A5276',background:'#EBF5FB',color:'#1A5276',cursor:'pointer'}}>
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot style={{background:'#1A5276',color:'#fff',position:'sticky',bottom:0}}>
                <tr>
                  <td colSpan={6} style={{padding:'8px 12px',fontWeight:700,fontSize:12}}>
                    Total ({filtered.length} entries)
                  </td>
                  <td style={{fontWeight:800,fontSize:13,color:'#A9DFBF'}}>{INR(totalGood)}</td>
                  <td style={{fontWeight:800,color:'#F1948A'}}>{INR(totalRejected)}</td>
                  <td style={{fontWeight:800,color:'#F9E79F'}}>{INR(totalRework)}</td>
                  <td style={{fontWeight:800,color:parseFloat(rejPct)>5?'#F1948A':'#A9DFBF'}}>{rejPct}%</td>
                  <td style={{fontWeight:800,color:'#F9E79F'}}>{totalIdle}m</td>
                  <td style={{fontWeight:800,color:effBg(avgEff)===effBg(80)?'#A9DFBF':'#F9E79F'}}>{avgEff}%</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detail && <DetailModal entry={detail} onClose={()=>setDetail(null)} />}
    </div>
  )
}
