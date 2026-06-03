import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${tok()}` })

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

const fmtN = n => Number(n||0).toLocaleString('en-IN')

// ── Capacity Calculation Engine ───────────────────────────────────────────────
// Per WO per WC:
//   cycleTimeSec = from routing op (machineTime mins × 60) or WO default
//   cavity       = wo.cavityCount || 1
//   shiftSec     = shiftHrs × 3600
//   outputPerShift = Math.floor(shiftSec / cycleTimeSec) × cavity
//   shiftsNeeded   = Math.ceil(plannedQty / outputPerShift)
//   daysNeeded     = Math.ceil(shiftsNeeded / shiftsPerDay)

function calcCapacity(wo, wc, routings=[]) {
  const plannedQty   = parseFloat(wo.plannedQty   || 0)
  const cavity       = parseInt(wo.cavityCount    || 1)
  const shiftHrs     = parseFloat(wc?.shiftHrs    || 8)
  const shiftsPerDay = wc?.shift === '3' ? 3 : wc?.shift === '2' ? 2 : 1
  const workingDays  = parseFloat(wc?.workingDays || 26)

  // Cycle time priority:
  // 1. Routing op machineTime for this WO's itemCode (with unit conversion)
  // 2. WO industryData (saved from production entry)
  // 3. Default 40s

  // Find routing for this WO's item
  const routing = routings.find(r =>
    r.itemCode === wo.itemCode ||
    r.itemName?.toLowerCase() === (wo.itemName||'').toLowerCase()
  )
  const routingOp = routing?.operations?.find(op =>
    op.wcId === wc?.wcId || op.workCenter === wc?.wcId || !op.wcId
  ) || routing?.operations?.[0]

  let cycleTimeSec = 40 // default
  if (routingOp && parseFloat(routingOp.machineTime||0) > 0) {
    const mt   = parseFloat(routingOp.machineTime)
    const unit = routing?.timeUnit || routingOp.unit || 'MIN'
    // Convert to seconds based on unit
    cycleTimeSec = unit === 'SEC' ? mt
                 : unit === 'HR'  ? mt * 3600
                 : mt * 60  // MIN (default)
  } else {
    // Fallback: WO industryData from production entries
    const lastCycleSec = wo.industryData && typeof wo.industryData === 'object'
      ? parseFloat(wo.industryData?.stdCycleTimeSec || wo.industryData?.cycleTimeSec || 0)
      : 0
    if (lastCycleSec > 0) cycleTimeSec = lastCycleSec
  }

  const shiftSec        = shiftHrs * 3600
  const shotsPerShift   = cycleTimeSec > 0 ? Math.floor(shiftSec / cycleTimeSec) : 0
  const outputPerShift  = shotsPerShift * cavity
  const shiftsNeeded    = outputPerShift > 0 ? Math.ceil(plannedQty / outputPerShift) : 0
  const daysNeeded      = shiftsPerDay > 0 ? Math.ceil(shiftsNeeded / shiftsPerDay) : 0
  const hrsNeeded       = shiftsNeeded * shiftHrs
  const availHrsPerWeek = shiftHrs * shiftsPerDay * (workingDays / 4)

  return {
    plannedQty, cavity, cycleTimeSec, shiftSec,
    shotsPerShift, outputPerShift,
    shiftsNeeded, daysNeeded, hrsNeeded,
    availHrsPerWeek, shiftHrs, shiftsPerDay,
  }
}

export default function CapacityPlan() {
  const nav = useNavigate()
  const now = new Date()

  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [selYear,  setSelYear]  = useState(now.getFullYear())
  const [wcs,      setWCs]      = useState([])
  const [wos,      setWOs]      = useState([])
  const [routings, setRoutings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [view,     setView]     = useState('machine') // machine | wo

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [wcRes, woRes, rtRes] = await Promise.all([
        fetch(`${BASE}/pp/work-centers`, { headers: hdr2() }).then(r => r.json()),
        fetch(`${BASE}/pp/wo?status=DRAFT,RELEASED,IN_PROGRESS`, { headers: hdr2() }).then(r => r.json()),
        fetch(`${BASE}/pp/routing-master`, { headers: hdr2() }).then(r => r.json()).catch(()=>({data:[]})),
      ])
      setWCs(wcRes.data || [])
      setWOs(woRes.data || [])
      setRoutings(rtRes.data || [])
    } catch { toast.error('Failed to load capacity data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const YEARS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  // ── Machine-wise capacity summary ─────────────────────────────────────────
  // WO→WC assignment: match by operation wcId, or machineName contains wcId, or first IMM-type WC
  const immWCs = wcs.filter(wc =>
    (wc.machineType||'').toUpperCase().includes('IMM') ||
    (wc.category||'').toLowerCase().includes('production') ||
    (wc.wcId||'').toUpperCase().includes('IMM')
  )

  const assignWCtoWO = (wo) => {
    // 1. Operation workCenter match (WOOperation uses workCenter field not wcId)
    const opWC = (wo.operations||[]).find(op =>
      (op.workCenter && wcs.find(w => w.wcId === op.workCenter || w.name === op.workCenter)) ||
      (op.machine    && wcs.find(w => w.wcId === op.machine    || w.name === op.machine))
    )
    if (opWC) {
      const matched = wcs.find(w =>
        w.wcId === opWC.workCenter || w.name === opWC.workCenter ||
        w.wcId === opWC.machine    || w.name === opWC.machine
      )
      if (matched) return matched.wcId
    }
    // 2. mouldId or machineName hints
    if (wo.machineName) {
      const found = wcs.find(w => w.name?.toLowerCase().includes(wo.machineName?.toLowerCase()) ||
        wo.machineName?.toLowerCase().includes(w.wcId?.toLowerCase()))
      if (found) return found.wcId
    }
    // 3. Default → first IMM-type WC or first production WC
    return immWCs[0]?.wcId || wcs.find(w => w.status === 'Active')?.wcId || null
  }

  const machineRows = wcs.filter(wc => wc.status !== 'Inactive').map(wc => {
    const shiftHrs     = parseFloat(wc.shiftHrs    || 8)
    const shiftsPerDay = wc.shift === '3' ? 3 : wc.shift === '2' ? 2 : 1
    const workDays     = parseFloat(wc.workingDays || 26)
    const availPerMonth= shiftHrs * shiftsPerDay * workDays

    // WOs assigned to this WC
    const wcWOs = wos.filter(wo =>
      (wo.operations||[]).some(op =>
        op.workCenter === wc.wcId || op.workCenter === wc.name ||
        op.machine    === wc.wcId || op.machine    === wc.name
      ) || assignWCtoWO(wo) === wc.wcId
    )

    const woDetails = wcWOs.map(wo => {
      const cap = calcCapacity(wo, wc, routings)
      return { wo, cap }
    })

    const totalHrsNeeded = woDetails.reduce((s, {cap}) => s + cap.hrsNeeded, 0)
    const utilPct        = availPerMonth > 0 ? (totalHrsNeeded / availPerMonth * 100) : 0

    return { wc, wcWOs, woDetails, availPerMonth, totalHrsNeeded, utilPct }
  })

  // ── WO-wise capacity breakdown ────────────────────────────────────────────
  const woRows = wos.map(wo => {
    // Find primary WC for this WO
    const primaryOp  = (wo.operations||[]).find(op => op.wcId)
    const wc         = wcs.find(w => w.wcId === primaryOp?.wcId)
      || wcs.find(w => w.wcId === assignWCtoWO(wo))
      || wcs.find(w => w.status === 'Active')
    const cap        = calcCapacity(wo, wc, routings)
    const producedQty= parseFloat(wo.producedQty || 0)
    const remaining  = Math.max(0, cap.plannedQty - producedQty)
    const shiftsLeft = cap.outputPerShift > 0
      ? Math.ceil(remaining / cap.outputPerShift) : 0
    const completionPct = cap.plannedQty > 0
      ? Math.min(100, (producedQty / cap.plannedQty * 100)).toFixed(1) : 0

    return { wo, wc, cap, producedQty, remaining, shiftsLeft, completionPct }
  })

  // KPIs
  const totalWOs      = wos.length
  const overloaded    = machineRows.filter(r => r.utilPct > 100).length
  const avgUtil       = machineRows.length > 0
    ? Math.round(machineRows.reduce((s,r) => s+r.utilPct, 0) / machineRows.length) : 0
  const totalShiftsNeeded = woRows.reduce((s,r) => s + r.cap.shiftsNeeded, 0)

  const S = {
    card: { background:'#fff', border:'1.5px solid #E0D5E0', borderRadius:8, overflow:'hidden', marginBottom:14 },
    hdr:  { background:'linear-gradient(135deg,#1A5276,#0C3547)', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' },
    hdrT: { color:'#fff', fontWeight:700, fontSize:13, fontFamily:'Syne,sans-serif' },
  }

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13 }}>

      {/* Page Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Capacity Planning (CM01)
          <small>Injection Moulding — Shots / Shift / Cavity Based</small>
        </div>
        <div className="fi-lv-actions">
          <select className="fi-filter-select" value={selMonth}
            onChange={e => setSelMonth(parseInt(e.target.value))}>
            {MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className="fi-filter-select" value={selYear}
            onChange={e => setSelYear(parseInt(e.target.value))}>
            {YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
          {/* View toggle */}
          <div style={{ display:'flex', border:'1.5px solid #E0D5E0', borderRadius:6, overflow:'hidden' }}>
            {[['machine','🏭 Machine'],['wo','📋 WO-wise']].map(([k,l]) => (
              <button key={k} onClick={() => setView(k)}
                style={{ padding:'5px 12px', fontSize:11, fontWeight:700, border:'none',
                  cursor:'pointer', background: view===k ? '#1A5276' : '#fff',
                  color: view===k ? '#fff' : '#6C757D' }}>{l}</button>
            ))}
          </div>
          <button className="btn btn-s sd-bsm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/gantt')}>📅 Gantt</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        {[
          { l:'Active WOs',         v: totalWOs,              c:'#1A5276', bg:'#EBF5FB' },
          { l:'Total Shifts Needed',v: fmtN(totalShiftsNeeded),c:'#856404', bg:'#FFF3CD' },
          { l:'Avg Machine Util',   v: `${avgUtil}%`,          c: avgUtil>85?'#DC3545':avgUtil>60?'#856404':'#155724',
            bg: avgUtil>85?'#F8D7DA':avgUtil>60?'#FFF3CD':'#D4EDDA' },
          { l:'Overloaded Machines',v: overloaded,             c: overloaded>0?'#DC3545':'#155724',
            bg: overloaded>0?'#F8D7DA':'#D4EDDA' },
        ].map(k => (
          <div key={k.l} style={{ background:k.bg, borderRadius:8, padding:'12px 16px',
            border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, fontWeight:700, color:k.c, textTransform:'uppercase' }}>{k.l}</div>
            <div style={{ fontSize:24, fontWeight:800, color:k.c, fontFamily:'Syne,sans-serif' }}>{loading?'...':k.v}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>Loading capacity data...</div>
      ) : view === 'machine' ? (

        // ── MACHINE VIEW ───────────────────────────────────────────────────────
        <div>
          {machineRows.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>No work centers configured.</div>
          ) : machineRows.map(({ wc, woDetails, availPerMonth, totalHrsNeeded, utilPct }) => (
            <div key={wc.wcId} style={S.card}>
              <div style={S.hdr}>
                <div>
                  <span style={S.hdrT}>{wc.wcId} — {wc.name}</span>
                  <span style={{ color:'rgba(255,255,255,.6)', fontSize:11, marginLeft:12 }}>
                    {wc.machineType||wc.category} · {wc.shiftHrs||8}h/shift · {wc.shift||1} shift(s)/day
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ color:'#fff', fontSize:12 }}>
                    Available: <strong>{Math.round(availPerMonth)}h/month</strong>
                  </span>
                  <span style={{
                    padding:'3px 10px', borderRadius:10, fontSize:11, fontWeight:800,
                    background: utilPct>100?'#DC3545':utilPct>85?'#E67E22':'#28A745',
                    color:'#fff'
                  }}>
                    {utilPct.toFixed(1)}% Utilization
                  </span>
                </div>
              </div>

              {/* Capacity bar */}
              <div style={{ padding:'10px 16px', background:'#F8F9FA', borderBottom:'1px solid #E0D5E0' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                  <span style={{ fontWeight:700, color:'#495057' }}>
                    Load: {Math.round(totalHrsNeeded)}h needed / {Math.round(availPerMonth)}h available
                  </span>
                  <span style={{ fontWeight:700, color: utilPct>100?'#DC3545':utilPct>85?'#856404':'#155724' }}>
                    {utilPct>100 ? `⚠️ OVERLOADED by ${Math.round(totalHrsNeeded-availPerMonth)}h` : `✅ ${Math.round(availPerMonth-totalHrsNeeded)}h free`}
                  </span>
                </div>
                <div style={{ height:8, background:'#E0E0E0', borderRadius:4, overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:4, transition:'width .4s',
                    width:`${Math.min(utilPct,100)}%`,
                    background: utilPct>100?'#DC3545':utilPct>85?'#E67E22':'#28A745'
                  }}/>
                </div>
              </div>

              {/* WO breakdown for this machine */}
              {woDetails.length === 0 ? (
                <div style={{ padding:'16px', color:'#6C757D', fontSize:12, textAlign:'center' }}>
                  No WOs assigned to this machine
                </div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'#F0F4F8', borderBottom:'2px solid #E0D5E0' }}>
                      {['Work Order','Product','Planned Qty','Cavity','Cycle Time','Shots/Shift','Output/Shift','Shifts Needed','Days Needed','Status'].map(h => (
                        <th key={h} style={{ padding:'7px 10px', fontSize:10, fontWeight:700,
                          color:'#6C757D', textAlign:'right', whiteSpace:'nowrap',
                          textTransform:'uppercase' }}
                          className={h==='Work Order'||h==='Product'?'text-left':''}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {woDetails.map(({ wo, cap }, i) => {
                      const produced = parseFloat(wo.producedQty||0)
                      const remShifts= cap.outputPerShift > 0
                        ? Math.ceil(Math.max(0,cap.plannedQty-produced)/cap.outputPerShift) : 0
                      return (
                        <tr key={wo.id} style={{ borderBottom:'1px solid #F0EEF0',
                          background: i%2===0?'#fff':'#FAFAFA',
                          cursor:'pointer' }}
                          onClick={() => nav(`/pp/wo/${wo.id}`)}>
                          <td style={{ padding:'8px 10px' }}>
                            <strong style={{ color:'#1A5276', fontFamily:'DM Mono,monospace', fontSize:12 }}>
                              {wo.woNo}
                            </strong>
                          </td>
                          <td style={{ padding:'8px 10px', fontWeight:600, maxWidth:150 }}>
                            <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {wo.itemName}
                            </div>
                            <div style={{ fontSize:10, color:'#6C757D' }}>{wo.itemCode}</div>
                          </td>
                          <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700 }}>
                            {fmtN(cap.plannedQty)}
                            {produced > 0 && (
                              <div style={{ fontSize:10, color:'#856404' }}>
                                Done: {fmtN(produced)}
                              </div>
                            )}
                          </td>
                          <td style={{ padding:'8px 10px', textAlign:'center', fontWeight:800, color:'#714B67', fontSize:14 }}>
                            {cap.cavity}
                          </td>
                          <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700, color:'#1A5276' }}>
                            {cap.cycleTimeSec}s
                            <div style={{ fontSize:10, color:'#6C757D' }}>{(cap.cycleTimeSec/60).toFixed(2)} min</div>
                          </td>
                          <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700 }}>
                            {fmtN(cap.shotsPerShift)}
                          </td>
                          <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#155724', fontSize:13 }}>
                            {fmtN(cap.outputPerShift)}
                            <div style={{ fontSize:10, color:'#6C757D' }}>pcs/shift</div>
                          </td>
                          <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800,
                            color: remShifts > 10 ? '#DC3545' : remShifts > 5 ? '#856404' : '#155724' }}>
                            {remShifts}
                            <div style={{ fontSize:10, color:'#6C757D' }}>remaining</div>
                          </td>
                          <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800,
                            color: Math.ceil(remShifts/cap.shiftsPerDay) > 7 ? '#DC3545' : '#155724' }}>
                            {Math.ceil(remShifts / Math.max(cap.shiftsPerDay,1))}d
                          </td>
                          <td style={{ padding:'8px 10px', textAlign:'center' }}>
                            <span style={{
                              padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:700,
                              background: wo.status==='IN_PROGRESS'?'#FFF3CD':wo.status==='RELEASED'?'#D1ECF1':'#E9ECEF',
                              color:      wo.status==='IN_PROGRESS'?'#856404':wo.status==='RELEASED'?'#0C5460':'#495057'
                            }}>{wo.status?.replace('_',' ')}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot style={{ background:'#F0F4F8', borderTop:'2px solid #1A5276' }}>
                    <tr>
                      <td colSpan={6} style={{ padding:'8px 10px', fontWeight:700, color:'#1A5276', fontSize:12 }}>
                        Machine Total — {woDetails.length} WO(s)
                      </td>
                      <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#155724' }}>
                        {fmtN(woDetails.reduce((s,{cap})=>s+cap.outputPerShift,0))}/shift
                      </td>
                      <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#1A5276' }}>
                        {woDetails.reduce((s,{cap})=>s+cap.shiftsNeeded,0)} shifts
                      </td>
                      <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#1A5276' }}>
                        {Math.ceil(woDetails.reduce((s,{cap})=>s+cap.shiftsNeeded,0)/Math.max(woDetails[0]?.cap.shiftsPerDay||1,1))}d
                      </td>
                      <td/>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          ))}
        </div>

      ) : (

        // ── WO-WISE VIEW ───────────────────────────────────────────────────────
        <div style={S.card}>
          <div style={S.hdr}>
            <span style={S.hdrT}>WO-wise Capacity Breakdown</span>
            <span style={{ color:'rgba(255,255,255,.6)', fontSize:11 }}>
              {woRows.length} Work Orders
            </span>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#F0F4F8', borderBottom:'2px solid #E0D5E0' }}>
                {['WO No','Product','Machine','Planned','Produced','Remaining',
                  'Cycle\nTime','Cavity','Output/\nShift','Shifts\nLeft','Days\nLeft','% Done'].map(h => (
                  <th key={h} style={{ padding:'7px 10px', fontSize:10, fontWeight:700,
                    color:'#6C757D', textAlign:'right', whiteSpace:'pre',
                    textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {woRows.map(({ wo, wc, cap, producedQty, remaining, shiftsLeft, completionPct }, i) => (
                <tr key={wo.id}
                  style={{ borderBottom:'1px solid #F0EEF0', background:i%2===0?'#fff':'#FAFAFA', cursor:'pointer' }}
                  onClick={() => nav(`/pp/wo/${wo.id}`)}>
                  <td style={{ padding:'8px 10px' }}>
                    <strong style={{ color:'#1A5276', fontFamily:'DM Mono,monospace' }}>{wo.woNo}</strong>
                  </td>
                  <td style={{ padding:'8px 10px', maxWidth:140 }}>
                    <div style={{ fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{wo.itemName}</div>
                    <div style={{ fontSize:10, color:'#6C757D' }}>{wo.itemCode}</div>
                  </td>
                  <td style={{ padding:'8px 10px', fontSize:11 }}>
                    {wc ? <span style={{ fontFamily:'DM Mono,monospace', color:'#714B67', fontWeight:700 }}>{wc.wcId}</span>
                         : <span style={{ color:'#DC3545' }}>Unassigned</span>}
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700 }}>{fmtN(cap.plannedQty)}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700, color:'#155724' }}>{fmtN(producedQty)}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:700,
                    color: remaining > 0 ? '#856404' : '#155724' }}>{fmtN(remaining)}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', color:'#1A5276', fontWeight:700 }}>
                    {cap.cycleTimeSec}s
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'center', fontWeight:800, color:'#714B67', fontSize:14 }}>{cap.cavity}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#155724', fontSize:13 }}>
                    {fmtN(cap.outputPerShift)}
                    <div style={{ fontSize:10, color:'#6C757D' }}>pcs/shift</div>
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800,
                    color: shiftsLeft > 10 ? '#DC3545' : shiftsLeft > 5 ? '#856404' : '#155724' }}>
                    {shiftsLeft}
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800,
                    color: Math.ceil(shiftsLeft/Math.max(cap.shiftsPerDay,1)) > 7 ? '#DC3545' : '#155724' }}>
                    {Math.ceil(shiftsLeft / Math.max(cap.shiftsPerDay,1))}d
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'center', minWidth:100 }}>
                    <div style={{ fontSize:12, fontWeight:800,
                      color: parseFloat(completionPct)>=100?'#155724':parseFloat(completionPct)>50?'#856404':'#1A5276' }}>
                      {completionPct}%
                    </div>
                    <div style={{ height:4, background:'#E0E0E0', borderRadius:2, overflow:'hidden', marginTop:3 }}>
                      <div style={{
                        height:'100%', borderRadius:2,
                        width:`${Math.min(parseFloat(completionPct),100)}%`,
                        background: parseFloat(completionPct)>=100?'#28A745':parseFloat(completionPct)>50?'#FFC107':'#1A5276'
                      }}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ background:'#F0F4F8', borderTop:'2px solid #1A5276' }}>
              <tr>
                <td colSpan={3} style={{ padding:'8px 10px', fontWeight:800, color:'#1A5276', fontSize:12 }}>
                  TOTAL — {woRows.length} WOs
                </td>
                <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800 }}>
                  {fmtN(woRows.reduce((s,r)=>s+r.cap.plannedQty,0))}
                </td>
                <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#155724' }}>
                  {fmtN(woRows.reduce((s,r)=>s+r.producedQty,0))}
                </td>
                <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#856404' }}>
                  {fmtN(woRows.reduce((s,r)=>s+r.remaining,0))}
                </td>
                <td colSpan={3}/>
                <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'DM Mono,monospace', fontWeight:800, color:'#1A5276' }}>
                  {woRows.reduce((s,r)=>s+r.shiftsLeft,0)} shifts
                </td>
                <td colSpan={2}/>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
