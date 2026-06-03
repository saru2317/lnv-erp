import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const authHdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('lnv_token')}` })

// ── Master Data ───────────────────────────────────────────────────────────────
const SHIFTS = [
  { key: 'A', label: 'Shift A (06:00 – 14:00)', start: '06:00', end: '14:00' },
  { key: 'B', label: 'Shift B (14:00 – 22:00)', start: '14:00', end: '22:00' },
  { key: 'C', label: 'Shift C (22:00 – 06:00)', start: '22:00', end: '06:00' },
  { key: 'G', label: 'General (08:00 – 17:00)', start: '08:00', end: '17:00' },
]

const IDLE_REASONS = [
  { code: 'IR01', label: 'Machine Breakdown'         },
  { code: 'IR02', label: 'Mould Change / Setup'      },
  { code: 'IR03', label: 'Power Failure'             },
  { code: 'IR04', label: 'Material Shortage'         },
  { code: 'IR05', label: 'Operator Absence'          },
  { code: 'IR06', label: 'Quality Hold'              },
  { code: 'IR07', label: 'Maintenance / PM'          },
  { code: 'IR08', label: 'Trial / Development Run'   },
  { code: 'IR09', label: 'Lunch / Tea Break'         },
  { code: 'IR10', label: 'No Production Order'       },
  { code: 'IR11', label: 'Chiller / Cooling Issue'   },
  { code: 'IR12', label: 'Other (specify in remarks)'},
]

const REJECTION_REASONS = [
  { code: 'RJ01', label: 'Short Moulding'        },
  { code: 'RJ02', label: 'Flash / Burr'          },
  { code: 'RJ03', label: 'Sink Mark'             },
  { code: 'RJ04', label: 'Warpage / Deformation' },
  { code: 'RJ05', label: 'Weld Line'             },
  { code: 'RJ06', label: 'Colour Mismatch'       },
  { code: 'RJ07', label: 'Gate Mark / Vestige'   },
  { code: 'RJ08', label: 'Air Trap / Void'       },
  { code: 'RJ09', label: 'Dimensional Reject'    },
  { code: 'RJ10', label: 'Surface Scratch'       },
  { code: 'RJ11', label: 'Black Spot / Burn'     },
  { code: 'RJ12', label: 'Other'                 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const today   = () => new Date().toISOString().split('T')[0]
const timeNow = () => new Date().toTimeString().slice(0, 5)

function diffMins(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins < 0) mins += 1440 // overnight
  return mins
}

function minsToHM(mins) {
  if (!mins || mins <= 0) return '0h 0m'
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  inp: { width:'100%', padding:'7px 10px', fontSize:12, border:'1.5px solid #D0D7DE', borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif', background:'#fff' },
  sel: { width:'100%', padding:'7px 10px', fontSize:12, border:'1.5px solid #D0D7DE', borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif', background:'#fff', cursor:'pointer' },
  lbl: { fontSize:10, fontWeight:700, color:'#444', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:.5 },
  card:{ background:'#fff', border:'1.5px solid #E0D5E0', borderRadius:8, padding:16, marginBottom:14 },
  hdr: { fontSize:11, fontWeight:800, color:'#1A5276', textTransform:'uppercase', letterSpacing:.6, marginBottom:12, paddingBottom:6, borderBottom:'2px solid #EBF5FB', display:'flex', alignItems:'center', gap:6 },
}

const BLANK_IDLE = { reasonCode:'IR01', startTime:'', endTime:'', mins:0, remarks:'' }
const BLANK_FORM = {
  entryDate: today(), shift:'A', startTime:'06:00', endTime:'14:00',
  woNo:'', woId:null, wcId:'', machineName:'', mouldId:'', itemCode:'', itemName:'',
  stdCycleTimeSec:0, stdCavity:1, rmConsumption:[],
  plannedQty:0, goodQty:'', rejectedQty:'', reworkQty:'',
  rejectionReason:'RJ01', rejectionRemarks:'',
  shots:'', cycleTimeSec:'', materialUsedKg:'',
  operatorName:'', operatorCode:'', supervisorName:'',
  remarks:'', finalConfirm: false,
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ProductionEntry() {
  const [form,     setForm]     = useState({ ...BLANK_FORM })
  const [idleRows, setIdleRows] = useState([])
  const [wos,      setWos]      = useState([])
  const [wcs,      setWcs]      = useState([])
  const [entries,  setEntries]  = useState([])

  const [saving,   setSaving]   = useState(false)
  const [selWO,    setSelWO]    = useState(null)
  const [rmLines,  setRmLines]  = useState([]) // RM consumption from BOM
  const [stockMap,  setStockMap]  = useState({}) // itemCode/itemName → balanceQty
  const [producedSoFar, setProducedSoFar] = useState(0) // already produced in prev entries

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Fetch WOs + Work Centers ─────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE_URL}/pp/wo?status=RELEASED,IN_PROGRESS`, { headers: authHdrs() })
      .then(r => r.json()).then(d => setWos(d.data || [])).catch(() => {})
    fetch(`${BASE_URL}/pp/work-centers`, { headers: authHdrs() })
      .then(r => r.json()).then(d => setWcs(d.data || [])).catch(() => {})

    // Stock map — fetch from correct location based on PP Config rmMethod
    const ppCfg = (() => { try { return JSON.parse(sessionStorage.getItem('pp_config')||'{}') } catch { return {} } })()
    const stockLoc = ppCfg.rmMethod === 'twostep' ? 'SHOP-FLOOR' : 'RM-STORE'
    fetch(`${BASE_URL}/wm/stock?location=${stockLoc}`, { headers: authHdrs() })
      .then(r=>r.json()).then(d => {
        const map = {}
        ;(d.data||[]).forEach(i => {
          if (i.itemCode) map[i.itemCode] = parseFloat(i.balanceQty||0)
          if (i.itemName) map[i.itemName] = parseFloat(i.balanceQty||0)
        })
        setStockMap(map)
      }).catch(()=>{})

    fetchEntries()
  }, [])

  const fetchEntries = (date) => {
    const d = date || today()
    fetch(`${BASE_URL}/pp/production-entry?date=${d}`, { headers: authHdrs() })
      .then(r => r.json()).then(d => setEntries(d.data || [])).catch(() => {})
  }

  // ── Auto-fill on WO select ───────────────────────────────────────────────
  const onWOSelect = async (woNo) => {
    const woCached = wos.find(w => w.woNo === woNo)
    if (!woCached) { setSelWO(null); setForm(f => ({ ...f, woNo:'', woId:null, itemCode:'', itemName:'', plannedQty:0, stdCycleTimeSec:0, stdCavity:1 })); setRmLines([]); return }

    // Fetch fresh WO data from API to get latest producedQty
    let wo = woCached
    try {
      const r = await fetch(`${BASE_URL}/pp/wo/${woCached.id}`, { headers: authHdrs() })
      const d = await r.json()
      if (d.data) wo = d.data
    } catch {}

    setSelWO(wo)
    const alreadyProduced = parseFloat(wo.producedQty || 0)
    setProducedSoFar(alreadyProduced)
    setForm(f => ({
      ...f, woNo,
      woId:       wo.id        || null,
      itemCode:   wo.itemCode  || '',
      itemName:   wo.itemName  || '',
      plannedQty: wo.plannedQty|| 0,
      stdCavity:  wo.cavityCount || 1,
      mouldId:    wo.mouldId   || f.mouldId,
    }))

    // Fetch materialIssues for RM consumption display
    try {
      const woIdInt = parseInt(wo.id)
      const r = await fetch(`${BASE_URL}/pp/material-issues?woId=${woIdInt}`, { headers: authHdrs() })
      const d = await r.json()
      const issues = (d.data||[]).filter(i => i.woId === woIdInt && !i.isByProduct)

      // Consolidate duplicate rows for same item (same itemCode/itemName)
      const consolidated = {}
      issues.forEach(iss => {
        const key = iss.itemCode || iss.itemName
        if (!consolidated[key]) {
          consolidated[key] = {
            itemCode:  iss.itemCode,
            itemName:  iss.itemName,
            bomQty:    0,
            issuedQty: 0,
            uom:       iss.uom,
          }
        }
        consolidated[key].bomQty    += parseFloat(iss.bomQty    || 0)
        consolidated[key].issuedQty += parseFloat(iss.issuedQty || 0)
      })

      // Enrich with live stock availability
      const enriched = Object.values(consolidated).map(rm => ({
        ...rm,
        availQty: (() => {
          if (rm.itemCode && stockMap[rm.itemCode] !== undefined) return stockMap[rm.itemCode]
          if (rm.itemName && stockMap[rm.itemName] !== undefined) return stockMap[rm.itemName]
          return null // null = not fetched yet
        })()
      }))
      setRmLines(enriched)
    } catch { setRmLines([]) }

    // Fetch routing for std cycle time (machineTime from routing ops for this WO's itemCode)
    try {
      const r2 = await fetch(`${BASE_URL}/pp/routing?itemCode=${wo.itemCode||''}`, { headers: authHdrs() })
      const d2 = await r2.json()
      const routing = (d2.data||[])[0]
      if (routing?.operations?.length) {
        // Find op matching current wcId or first op
        const op = routing.operations.find(o => o.wcId === form.wcId) || routing.operations[0]
        const machTimeMins = parseFloat(op?.machineTime || 0)
        const cavity       = wo.cavityCount || 1
        // stdCycleTimeSec = machineTime (mins per unit) × 60 / cavity
        const stdCycle = machTimeMins > 0 ? Math.round((machTimeMins * 60) / cavity) : 0
        setForm(f => ({ ...f, stdCycleTimeSec: stdCycle, cycleTimeSec: stdCycle || f.cycleTimeSec }))
      }
    } catch {}
  }

  // ── Auto-fill on Work Center select ─────────────────────────────────────
  const onWCSelect = (val) => {
    const wc = wcs.find(w => (w.wcId||String(w.id)) === val)
    if (wc) setForm(f => ({ ...f, wcId: wc.wcId||val, machineName: wc.name||wc.wcName||'' }))
    else setForm(f => ({ ...f, wcId: val }))
  }

  // ── Shift auto-fill times ────────────────────────────────────────────────
  const onShiftChange = (key) => {
    const s = SHIFTS.find(x => x.key === key)
    setForm(f => ({ ...f, shift: key, startTime: s?.start || '', endTime: s?.end || '' }))
  }

  // ── Calculated values ────────────────────────────────────────────────────
  const possibleQty  = Math.max(0, parseFloat(form.plannedQty||0) - producedSoFar)
  const totalMins    = diffMins(form.startTime, form.endTime)
  // Standard calculations
  const cycSec       = parseFloat(form.cycleTimeSec || form.stdCycleTimeSec || 0)
  const cavity       = parseInt(form.stdCavity || 1)
  const calcShots    = cycSec > 0 ? Math.floor((Math.max(0, totalMins - (diffMins(form.startTime,form.endTime) > 0 ? 0 : 0)) * 60) / cycSec) : 0
  const prodShotsCalc= cycSec > 0 ? Math.floor(((diffMins(form.startTime, form.endTime) - idleRows.reduce((s,r)=>s+(parseInt(r.mins)||0),0)) * 60) / cycSec) : 0
  const expectedOutput = prodShotsCalc * cavity
  const totalIdleMins= idleRows.reduce((s, r) => s + (parseInt(r.mins) || 0), 0)
  const prodMins     = Math.max(0, totalMins - totalIdleMins)
  const efficiency   = totalMins > 0 ? ((prodMins / totalMins) * 100).toFixed(1) : '0.0'
  const totalQty     = parseInt(form.goodQty || 0)  // Only good qty counts toward WO completion
  const totalProcessed = (parseInt(form.goodQty||0) + parseInt(form.rejectedQty||0) + parseInt(form.reworkQty||0)) // total shots processed
  const rejPct       = totalProcessed > 0 ? ((parseInt(form.rejectedQty || 0) / totalProcessed) * 100).toFixed(1) : '0.0'

  // ── Idle row handlers ────────────────────────────────────────────────────
  const addIdle = () => setIdleRows(r => [...r, { ...BLANK_IDLE }])
  const setIdle = (i, k, v) => setIdleRows(r => {
    const updated = [...r]
    updated[i] = { ...updated[i], [k]: v }
    if (k === 'startTime' || k === 'endTime') {
      updated[i].mins = diffMins(updated[i].startTime, updated[i].endTime)
    }
    return updated
  })
  const delIdle = (i) => setIdleRows(r => r.filter((_, idx) => idx !== i))

  // ── Submit ───────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!form.wcId)     return toast.error('Select Work Center / Machine')
    if (!form.goodQty && form.goodQty !== 0) return toast.error('Enter Good Qty (can be 0)')
    const totalProcNow = parseInt(form.goodQty||0) + parseInt(form.rejectedQty||0) + parseInt(form.reworkQty||0)
    if (form.woNo && totalProcNow > possibleQty)
      return toast.error(`Total processed (Good ${form.goodQty} + Rejected ${form.rejectedQty||0} + Rework ${form.reworkQty||0} = ${totalProcNow}) exceeds material issued for ${possibleQty} pcs!`)
    if (!form.operatorName) return toast.error('Operator name required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        goodQty:     parseFloat(form.goodQty     || 0),
        rejectedQty: parseFloat(form.rejectedQty || 0),
        reworkQty:   parseFloat(form.reworkQty   || 0),
        shots:       parseFloat(form.shots||0) || prodShotsCalc,
        cycleTimeSec:parseFloat(form.cycleTimeSec|| 0),
        materialUsedKg: parseFloat(form.materialUsedKg || 0),
        totalMins, prodMins, totalIdleMins,
        efficiency: parseFloat(efficiency),
        industryData: {
          idleRows,
          shots:          prodShotsCalc,
          cycleTimeSec:   form.cycleTimeSec || form.stdCycleTimeSec,
          stdCycleTimeSec:form.stdCycleTimeSec,
          stdCavity:      form.stdCavity,
          expectedOutput,
          materialUsedKg: form.materialUsedKg,
          mouldId:        form.mouldId,
          rmConsumption:  rmLines.map(rm => {
            const goodQ = parseFloat(form.goodQty||0)
            const planQ = parseFloat(form.plannedQty||1)
            return { ...rm, shiftConsumed: planQ>0?(goodQ/planQ)*rm.bomQty:0 }
          }),
        }
      }
      const res  = await fetch(`${BASE_URL}/pp/production-entry`, { method:'POST', headers: authHdrs(), body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(`✅ ${data.message || 'Production Entry saved!'}`)
      // Refresh producedSoFar from fresh WO data
      if (form.woId) {
        try {
          const r2 = await fetch(`${BASE_URL}/pp/wo/${form.woId}`, { headers: authHdrs() })
          const d2 = await r2.json()
          if (d2.data) {
            const freshProduced = parseFloat(d2.data.producedQty || 0)
            setProducedSoFar(freshProduced)
            setSelWO(d2.data)
          }
        } catch {}
      }
      setForm({ ...BLANK_FORM, entryDate: form.entryDate, shift: form.shift, wcId: form.wcId, machineName: form.machineName, operatorName: form.operatorName })
      setIdleRows([])
      fetchEntries()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ── Efficiency color ─────────────────────────────────────────────────────
  const effColor = parseFloat(efficiency) >= 80 ? '#155724' : parseFloat(efficiency) >= 60 ? '#856404' : '#721C24'
  const effBg    = parseFloat(efficiency) >= 80 ? '#D4EDDA' : parseFloat(efficiency) >= 60 ? '#FFF3CD' : '#F8D7DA'

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13 }}>

      {/* Page Header */}
      <div className="fi-lv-hdr" style={{ marginBottom:12 }}>
        <div className="fi-lv-title">
          Production Entry (CO11N)
          <small>Injection Moulding — Shift-wise Confirmation</small>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#6C757D' }}>Today's Entries:</span>
          <span style={{ fontWeight:800, fontSize:16, color:'#1A5276' }}>{entries.length}</span>
          <span style={{ fontWeight:800, fontSize:16, color:'#155724', marginLeft:8 }}>
            ✅ {entries.reduce((s,e) => s + parseFloat(e.goodQty||0), 0)} Good
          </span>
          <span style={{ fontWeight:800, fontSize:16, color:'#721C24', marginLeft:8 }}>
            ❌ {entries.reduce((s,e) => s + parseFloat(e.rejectedQty||0), 0)} Rejected
          </span>
          <button onClick={fetchEntries}
            style={{ padding:'5px 12px', background:'#F0F0F0', border:'none', borderRadius:5, fontSize:11, cursor:'pointer', marginLeft:8 }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── ENTRY FORM — always visible ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:14 }}>

          {/* LEFT — Main form */}
          <div>

            {/* BLOCK 1 — Order & Date */}
            <div style={S.card}>
              <div style={S.hdr}>📋 Order & Date</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px 12px' }}>
                <div>
                  <label style={S.lbl}>Entry Date *</label>
                  <input style={S.inp} type="date" value={form.entryDate}
                    onChange={e => { set('entryDate', e.target.value); fetchEntries(e.target.value) }} />
                </div>
                <div>
                  <label style={S.lbl}>Shift *</label>
                  <select style={S.sel} value={form.shift} onChange={e => onShiftChange(e.target.value)}>
                    {SHIFTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.lbl}>Work Order No.</label>
                  <select style={S.sel} value={form.woNo} onChange={e => onWOSelect(e.target.value)}>
                    <option value="">— Select WO (optional) —</option>
                    {wos.map(w => <option key={w.id} value={w.woNo}>{w.woNo} | {w.itemName}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.lbl}>Item / Product</label>
                  <input style={{ ...S.inp, background:'#F8F9FA' }} value={form.itemName}
                    onChange={e => set('itemName', e.target.value)} placeholder="Auto-filled from WO" />
                </div>
              </div>
            </div>

            {/* BLOCK 2 — Machine & Mould */}
            <div style={S.card}>
              <div style={S.hdr}>🏭 Machine & Mould</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px 12px' }}>
                <div>
                  <label style={S.lbl}>Work Center / Machine *</label>
                  <select style={S.sel} value={form.wcId} onChange={e => onWCSelect(e.target.value)}>
                    <option value="">— Select Machine —</option>
                    {wcs.length > 0
                      ? wcs.map(w => <option key={w.id} value={w.wcId||w.id}>{w.wcId||w.id} — {w.name}</option>)
                      : ['IMM-150T','IMM-200T','IMM-80T'].map(m => <option key={m} value={m}>{m}</option>)
                    }
                  </select>
                </div>
                <div>
                  <label style={S.lbl}>Mould ID / Tool No.</label>
                  <input style={S.inp} value={form.mouldId} onChange={e => set('mouldId', e.target.value)} placeholder="MLD-001" />
                </div>
                <div>
                  <label style={S.lbl}>No. of Shots</label>
                  <input style={S.inp} type="number" value={form.shots} onChange={e => set('shots', e.target.value)} placeholder="0" min="0" />
                </div>
                <div>
                  <label style={S.lbl}>Avg Cycle Time (sec)</label>
                  <input style={S.inp} type="number" value={form.cycleTimeSec} onChange={e => set('cycleTimeSec', e.target.value)} placeholder="0" min="0" />
                </div>
                <div>
                  <label style={S.lbl}>Material Used (kg)</label>
                  <input style={S.inp} type="number" value={form.materialUsedKg} onChange={e => set('materialUsedKg', e.target.value)} placeholder="0.00" step="0.01" />
                </div>
                <div>
                  <label style={S.lbl}>Planned Qty</label>
                  <input style={{ ...S.inp, background:'#F8F9FA', fontWeight:700 }} value={form.plannedQty} readOnly />
                </div>
                <div>
                  <label style={S.lbl}>Std Cycle Time (sec)</label>
                  <div style={{ display:'flex', gap:4 }}>
                    <input style={{ ...S.inp, flex:1, background: form.stdCycleTimeSec>0?'#EBF5FB':'#fff',
                      fontWeight:700, color:'#1A5276' }}
                      type="number" value={form.cycleTimeSec}
                      onChange={e => set('cycleTimeSec', e.target.value)}
                      placeholder={form.stdCycleTimeSec||'0'} />
                  </div>
                  {form.stdCycleTimeSec>0 && (
                    <div style={{fontSize:9,color:'#1A5276',marginTop:2}}>
                      Std: {form.stdCycleTimeSec}s (from Routing)
                    </div>
                  )}
                </div>
                <div>
                  <label style={S.lbl}>Std Cavity Count</label>
                  <input style={{ ...S.inp, background:'#EBF5FB', fontWeight:700, color:'#1A5276' }}
                    type="number" value={form.stdCavity}
                    onChange={e => set('stdCavity', e.target.value)} min="1" />
                </div>
                <div>
                  <label style={S.lbl}>Total Shots (calc)</label>
                  <div style={{ padding:'7px 10px', background: prodShotsCalc>0?'#D4EDDA':'#F8F9FA',
                    borderRadius:5, fontWeight:800, fontSize:14,
                    color: prodShotsCalc>0?'#155724':'#6C757D',
                    border:'1.5px solid #A9DFBF', fontFamily:'DM Mono,monospace' }}>
                    {prodShotsCalc.toLocaleString('en-IN')}
                    <span style={{fontSize:10,fontWeight:400,color:'#6C757D',marginLeft:4}}>shots</span>
                  </div>
                </div>
                <div>
                  <label style={S.lbl}>Expected Output (calc)</label>
                  <div style={{ padding:'7px 10px', background: expectedOutput>0?'#D1ECF1':'#F8F9FA',
                    borderRadius:5, fontWeight:800, fontSize:14,
                    color: expectedOutput>0?'#0C5460':'#6C757D',
                    border:'1.5px solid #AED6F1', fontFamily:'DM Mono,monospace' }}>
                    {expectedOutput.toLocaleString('en-IN')}
                    <span style={{fontSize:10,fontWeight:400,color:'#6C757D',marginLeft:4}}>pcs</span>
                  </div>
                  {form.plannedQty>0 && expectedOutput>0 && (
                    <div style={{fontSize:9,marginTop:2,
                      color: expectedOutput>=form.plannedQty?'#155724':'#856404'}}>
                      {expectedOutput>=form.plannedQty?'✅':'⚠️'} Planned: {form.plannedQty} pcs
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BLOCK 3 — Time Recording */}
            <div style={S.card}>
              <div style={S.hdr}>⏱️ Time Recording</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px 12px', marginBottom:14 }}>
                <div>
                  <label style={S.lbl}>Shift Start *</label>
                  <input style={S.inp} type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
                </div>
                <div>
                  <label style={S.lbl}>Shift End *</label>
                  <input style={S.inp} type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
                </div>
                <div>
                  <label style={S.lbl}>Total Shift Time</label>
                  <div style={{ padding:'7px 10px', background:'#EBF5FB', borderRadius:5, fontSize:12, fontWeight:700, color:'#1A5276', border:'1.5px solid #AED6F1' }}>
                    {minsToHM(totalMins)}
                  </div>
                </div>
                <div>
                  <label style={S.lbl}>Total Idle Time</label>
                  <div style={{ padding:'7px 10px', background: totalIdleMins > 0 ? '#FFF3CD' : '#F8F9FA', borderRadius:5, fontSize:12, fontWeight:700, color: totalIdleMins > 0 ? '#856404' : '#6C757D', border:'1.5px solid #E0D5E0' }}>
                    {minsToHM(totalIdleMins)}
                  </div>
                </div>
                <div>
                  <label style={S.lbl}>Production Time</label>
                  <div style={{ padding:'7px 10px', background:'#D4EDDA', borderRadius:5, fontSize:12, fontWeight:700, color:'#155724', border:'1.5px solid #A9DFBF' }}>
                    {minsToHM(prodMins)}
                  </div>
                </div>
              </div>

              {/* Idle Time Rows */}
              <div style={{ background:'#FFFBF0', border:'1.5px solid #F9E79F', borderRadius:7, padding:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#856404' }}>⚠️ Idle / Downtime Entries</span>
                  <button onClick={addIdle}
                    style={{ padding:'4px 12px', fontSize:11, fontWeight:700, background:'#856404', color:'#fff', border:'none', borderRadius:5, cursor:'pointer' }}>
                    + Add Idle Entry
                  </button>
                </div>

                {idleRows.length === 0 && (
                  <div style={{ fontSize:11, color:'#856404', opacity:.6, textAlign:'center', padding:'8px 0' }}>
                    No idle time — good! Click "+ Add Idle Entry" if machine was idle during shift.
                  </div>
                )}

                {idleRows.map((row, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto 2fr auto', gap:8, marginBottom:8, alignItems:'end' }}>
                    <div>
                      {i === 0 && <label style={S.lbl}>Idle Reason</label>}
                      <select style={S.sel} value={row.reasonCode} onChange={e => setIdle(i, 'reasonCode', e.target.value)}>
                        {IDLE_REASONS.map(r => <option key={r.code} value={r.code}>{r.code} — {r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      {i === 0 && <label style={S.lbl}>From</label>}
                      <input style={S.inp} type="time" value={row.startTime} onChange={e => setIdle(i, 'startTime', e.target.value)} />
                    </div>
                    <div>
                      {i === 0 && <label style={S.lbl}>To</label>}
                      <input style={S.inp} type="time" value={row.endTime} onChange={e => setIdle(i, 'endTime', e.target.value)} />
                    </div>
                    <div>
                      {i === 0 && <label style={S.lbl}>Mins</label>}
                      <div style={{ padding:'7px 8px', background:'#FFF3CD', borderRadius:5, fontWeight:700, color:'#856404', fontSize:12, minWidth:40, textAlign:'center', border:'1.5px solid #F9E79F' }}>
                        {row.mins || 0}
                      </div>
                    </div>
                    <div>
                      {i === 0 && <label style={S.lbl}>Remarks</label>}
                      <input style={S.inp} value={row.remarks} onChange={e => setIdle(i, 'remarks', e.target.value)} placeholder="Optional details..." />
                    </div>
                    <div style={{ display:'flex', alignItems: i === 0 ? 'flex-end' : 'center' }}>
                      <button onClick={() => delIdle(i)}
                        style={{ padding:'6px 8px', background:'#F8D7DA', color:'#721C24', border:'none', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:12 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BLOCK 4 — Production Quantities */}
            <div style={S.card}>
              <div style={S.hdr}>📦 Production Quantities</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px 12px', marginBottom:12 }}>
                <div>
                  <label style={S.lbl}>Good Qty *
                    {form.woNo && (
                      <span style={{ marginLeft:6, fontWeight:600, color:'#1A5276',
                        textTransform:'none', fontSize:10 }}>
                        (Max: {possibleQty.toLocaleString('en-IN')} {selWO?.uom||''})
                      </span>
                    )}
                  </label>
                  <input
                    style={{ ...S.inp, fontSize:14, fontWeight:700,
                      borderColor: form.woNo && (parseInt(form.goodQty||0)+parseInt(form.rejectedQty||0)+parseInt(form.reworkQty||0)) > possibleQty
                        ? '#DC3545'
                        : parseFloat(form.goodQty||0) > 0 ? '#28A745' : '#D0D7DE' }}
                    type="number" min="0"
                    max={form.woNo ? possibleQty : undefined}
                    value={form.goodQty}
                    onChange={e => {
                      const val = e.target.value
                      const proc = parseInt(val||0) + parseInt(form.rejectedQty||0) + parseInt(form.reworkQty||0)
                      if (form.woNo && proc > possibleQty) {
                        toast.error(`Total processed (${proc}) will exceed material issued for ${possibleQty} pcs!`)
                      }
                      set('goodQty', val)
                    }}
                    placeholder="0" />
                  {form.woNo && producedSoFar > 0 && (
                    <div style={{ fontSize:10, marginTop:3, color:'#856404' }}>
                      Already produced: {producedSoFar.toLocaleString('en-IN')} · Remaining: {possibleQty.toLocaleString('en-IN')}
                    </div>
                  )}
                  {form.woNo && (parseInt(form.goodQty||0)+parseInt(form.rejectedQty||0)+parseInt(form.reworkQty||0)) > possibleQty && (
                    <div style={{ fontSize:10, marginTop:2, color:'#DC3545', fontWeight:700 }}>
                      ⛔ Total processed ({parseInt(form.goodQty||0)+parseInt(form.rejectedQty||0)+parseInt(form.reworkQty||0)}) exceeds material issued for {possibleQty} pcs
                    </div>
                  )}
                </div>
                <div>
                  <label style={S.lbl}>Rejected Qty</label>
                  <input style={{ ...S.inp,
                    borderColor: form.woNo && (parseInt(form.goodQty||0)+parseInt(form.rejectedQty||0)+parseInt(form.reworkQty||0)) > possibleQty
                      ? '#DC3545' : parseInt(form.rejectedQty) > 0 ? '#DC3545' : '#D0D7DE' }}
                    type="number" value={form.rejectedQty}
                    onChange={e => {
                      const proc = parseInt(form.goodQty||0) + parseInt(e.target.value||0) + parseInt(form.reworkQty||0)
                      if (form.woNo && proc > possibleQty)
                        toast.error(`Total processed (${proc}) exceeds material issued for ${possibleQty} pcs!`)
                      set('rejectedQty', e.target.value)
                    }} placeholder="0" min="0" />
                </div>
                <div>
                  <label style={S.lbl}>Rework Qty</label>
                  <input style={{ ...S.inp,
                    borderColor: form.woNo && (parseInt(form.goodQty||0)+parseInt(form.rejectedQty||0)+parseInt(form.reworkQty||0)) > possibleQty
                      ? '#DC3545' : parseInt(form.reworkQty) > 0 ? '#FFC107' : '#D0D7DE' }}
                    type="number" value={form.reworkQty}
                    onChange={e => {
                      const proc = parseInt(form.goodQty||0) + parseInt(form.rejectedQty||0) + parseInt(e.target.value||0)
                      if (form.woNo && proc > possibleQty)
                        toast.error(`Total processed (${proc}) exceeds material issued for ${possibleQty} pcs!`)
                      set('reworkQty', e.target.value)
                    }} placeholder="0" min="0" />
                </div>
                <div>
                  <label style={S.lbl}>Total Processed</label>
                  <div style={{ padding:'7px 10px', background:'#F8F9FA', borderRadius:5,
                    fontWeight:800, fontSize:15, color:'#1A5276', border:'1.5px solid #D0D7DE' }}>
                    {totalProcessed}
                    <div style={{fontSize:9,fontWeight:400,color:'#6C757D',marginTop:2}}>
                      Good {parseInt(form.goodQty||0)} + Rej {parseInt(form.rejectedQty||0)} + Rework {parseInt(form.reworkQty||0)}
                    </div>
                  </div>
                </div>
                <div>
                  <label style={S.lbl}>WO Completion</label>
                  <div style={{ padding:'7px 10px', borderRadius:5, fontWeight:800, fontSize:13,
                    border:'1.5px solid',
                    background: parseInt(form.goodQty||0) >= possibleQty && possibleQty > 0
                      ? '#D4EDDA' : parseInt(form.goodQty||0) > 0 ? '#EBF5FB' : '#F8F9FA',
                    color: parseInt(form.goodQty||0) >= possibleQty && possibleQty > 0
                      ? '#155724' : '#1A5276',
                    borderColor: parseInt(form.goodQty||0) >= possibleQty && possibleQty > 0
                      ? '#A9DFBF' : '#AED6F1' }}>
                    {form.plannedQty > 0
                      ? `${Math.min(100,((parseInt(form.goodQty||0)+producedSoFar)/parseFloat(form.plannedQty||1)*100).toFixed(1))}%`
                      : '—'}
                    <div style={{fontSize:9,fontWeight:400,color:'#6C757D',marginTop:2}}>
                      {parseInt(form.goodQty||0)+producedSoFar} / {form.plannedQty} good pcs
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection reason — shows only if rejected qty > 0 */}
              {parseInt(form.rejectedQty) > 0 && (
                <div style={{ background:'#FDF2F8', border:'1.5px solid #F1948A', borderRadius:7, padding:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#922B21', marginBottom:8 }}>🔴 Rejection Details</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 12px' }}>
                    <div>
                      <label style={S.lbl}>Rejection Reason *</label>
                      <select style={S.sel} value={form.rejectionReason} onChange={e => set('rejectionReason', e.target.value)}>
                        {REJECTION_REASONS.map(r => <option key={r.code} value={r.code}>{r.code} — {r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.lbl}>Rejection Remarks</label>
                      <input style={S.inp} value={form.rejectionRemarks} onChange={e => set('rejectionRemarks', e.target.value)} placeholder="Details about rejection..." />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BLOCK 5 — RM Consumption */}
            {rmLines.length > 0 && (
              <div style={S.card}>
                <div style={S.hdr}>🧪 RM Consumption (Backflush Preview)</div>
                <div style={{ fontSize:11, color:'#6C757D', marginBottom:10 }}>
                  Based on Good Qty entered — actual consumption vs BOM standard.
                  This is auto-posted on WO Close (Movement 261).
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
                      {[
                        {h:'Material',          a:'left'},
                        {h:'BOM Qty (WO)',      a:'right'},
                        {h:'Already Issued',    a:'right'},
                        {h:'Balance Remaining', a:'right'},
                        {h:'In Store',          a:'right'},
                        {h:'This Shift Est.',   a:'right'},
                        {h:'UOM',               a:'center'},
                        {h:'Status',            a:'center'},
                      ].map(col=>(
                        <th key={col.h} style={{ padding:'6px 10px', fontSize:10, fontWeight:700,
                          color:'#6C757D', textAlign:col.a, textTransform:'uppercase' }}>{col.h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rmLines.map((rm, i) => {
                      const goodQ        = parseFloat(form.goodQty || 0)
                      const planQ        = parseFloat(form.plannedQty || 1)
                      // This shift estimate = (goodQty / plannedQty) × bomQty
                      const shiftEst     = planQ > 0 && goodQ > 0
                        ? parseFloat(((goodQ / planQ) * rm.bomQty).toFixed(3)) : 0
                      // Balance to issue = bomQty - issuedQty (can be negative if over-issued)
                      const balance      = parseFloat((rm.bomQty - rm.issuedQty).toFixed(3))
                      const overIssued   = rm.issuedQty > rm.bomQty
                      const fullyIssued  = Math.abs(balance) < 0.001
                      return (
                        <tr key={i} style={{ borderBottom:'1px solid #F0EEF0',
                          background: overIssued ? '#FFF5F5'
                            : fullyIssued ? '#F0FFF8'
                            : i%2===0 ? '#fff' : '#FDFBFD' }}>
                          <td style={{ padding:'7px 10px', fontWeight:600 }}>
                            {rm.itemName}
                            {rm.itemCode && <div style={{fontSize:10,color:'#714B67',fontFamily:'DM Mono,monospace'}}>{rm.itemCode}</div>}
                          </td>
                          {/* BOM Qty */}
                          <td style={{ padding:'7px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace', fontWeight:700, color:'#1A5276' }}>
                            {rm.bomQty.toFixed(3)}
                          </td>
                          {/* Already Issued */}
                          <td style={{ padding:'7px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace', fontWeight:700,
                            color: overIssued ? '#DC3545' : rm.issuedQty>0 ? '#856404' : '#6C757D' }}>
                            {rm.issuedQty.toFixed(3)}
                            {overIssued && <div style={{fontSize:9,color:'#DC3545',fontWeight:700}}>
                              ⚠️ Over by {(rm.issuedQty-rm.bomQty).toFixed(3)}
                            </div>}
                          </td>
                          {/* Balance Remaining */}
                          <td style={{ padding:'7px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace', fontWeight:800,
                            color: overIssued ? '#DC3545' : fullyIssued ? '#155724' : '#856404',
                            background: overIssued ? '#FFF5F5' : fullyIssued ? '#F0FFF8' : '#FFFBF0' }}>
                            {overIssued
                              ? <span style={{color:'#DC3545',fontSize:11}}>Excess {Math.abs(balance).toFixed(3)}</span>
                              : fullyIssued
                                ? <span style={{color:'#155724'}}>✅ Fully Issued</span>
                                : balance.toFixed(3)}
                          </td>
                          {/* In Store — live stock */}
                          <td style={{ padding:'7px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace', fontWeight:700,
                            color: rm.availQty === null ? '#6C757D'
                              : rm.availQty <= 0 ? '#DC3545'
                              : rm.availQty < balance ? '#856404'
                              : '#155724',
                            background: rm.availQty === null ? 'transparent'
                              : rm.availQty <= 0 ? '#FFF5F5'
                              : rm.availQty < balance ? '#FFFBF0'
                              : '#F0FFF8' }}>
                            {rm.availQty === null ? '...'
                              : rm.availQty <= 0
                                ? <span style={{color:'#DC3545',fontWeight:800}}>⛔ 0</span>
                                : rm.availQty.toFixed(3)}
                            {rm.availQty !== null && rm.availQty > 0 && rm.availQty < balance && (
                              <div style={{fontSize:9,color:'#856404',fontWeight:700}}>
                                Short by {(balance-rm.availQty).toFixed(3)}
                              </div>
                            )}
                          </td>
                          {/* This Shift Estimate */}
                          <td style={{ padding:'7px 10px', textAlign:'right',
                            fontFamily:'DM Mono,monospace', fontWeight:700,
                            color: '#1A5276',
                            background: shiftEst>0 ? '#EBF5FB' : 'transparent' }}>
                            {shiftEst > 0 ? shiftEst.toFixed(3) : '—'}
                          </td>
                          <td style={{ padding:'7px 10px', textAlign:'center',
                            color:'#6C757D', fontSize:11 }}>{rm.uom}</td>
                          <td style={{ padding:'7px 10px', textAlign:'center' }}>
                            {overIssued
                              ? <span style={{background:'#F8D7DA',color:'#721C24',padding:'2px 8px',borderRadius:8,fontSize:10,fontWeight:700}}>⚠️ Over Issued</span>
                              : fullyIssued
                                ? <span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',borderRadius:8,fontSize:10,fontWeight:700}}>✅ Issued</span>
                                : <span style={{background:'#FFF3CD',color:'#856404',padding:'2px 8px',borderRadius:8,fontSize:10,fontWeight:700}}>Pending</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:'#F8F4F8', borderTop:'2px solid #E0D5E0', fontWeight:800 }}>
                      <td colSpan={5} style={{ padding:'8px 10px', color:'#714B67', fontSize:12 }}>
                        Total RM for {form.goodQty||0} good pcs produced this shift (estimate)
                      </td>
                      <td style={{ padding:'8px 10px', textAlign:'right',
                        fontFamily:'DM Mono,monospace', color:'#155724', fontSize:13 }}>
                        {rmLines.reduce((s, rm) => {
                          const goodQ = parseFloat(form.goodQty||0)
                          const planQ = parseFloat(form.plannedQty||1)
                          return s + (planQ>0 && goodQ>0 ? (goodQ/planQ)*rm.bomQty : 0)
                        }, 0).toFixed(3)} {rmLines[0]?.uom||'kg'} (est.)
                      </td>
                      <td colSpan={2}/>
                    </tr>

                  </tfoot>
                </table>
              </div>
            )}

            {/* BLOCK 6 — Operator */}
            <div style={S.card}>
              <div style={S.hdr}>👷 Operator Details</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px 12px' }}>
                <div>
                  <label style={S.lbl}>Operator Name *</label>
                  <input style={S.inp} value={form.operatorName} onChange={e => set('operatorName', e.target.value)} placeholder="Operator Name" />
                </div>
                <div>
                  <label style={S.lbl}>Operator Code / Emp ID</label>
                  <input style={S.inp} value={form.operatorCode} onChange={e => set('operatorCode', e.target.value)} placeholder="EMP-001" />
                </div>
                <div>
                  <label style={S.lbl}>Supervisor / Incharge</label>
                  <input style={S.inp} value={form.supervisorName} onChange={e => set('supervisorName', e.target.value)} placeholder="Supervisor Name" />
                </div>
                <div style={{ gridColumn:'span 3' }}>
                  <label style={S.lbl}>Shift Remarks</label>
                  <input style={S.inp} value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Any special notes for this shift..." />
                </div>
              </div>
            </div>

            {/* Final Confirm checkbox (SAP-style) */}
            <div style={{ ...S.card, background:'#F0F8FF', border:'1.5px solid #1A5276' }}>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <input type="checkbox" checked={form.finalConfirm} onChange={e => set('finalConfirm', e.target.checked)}
                  style={{ width:16, height:16, cursor:'pointer' }} />
                <span style={{ fontSize:12, fontWeight:700, color:'#1A5276' }}>
                  ✅ Final Confirmation — This entry is complete and cannot be edited after save
                </span>
              </label>
            </div>

            {/* Submit */}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setForm({...BLANK_FORM}); setIdleRows([]) }}
                style={{ padding:'9px 22px', background:'#fff', color:'#6C757D', border:'1.5px solid #DEE2E6', borderRadius:6, fontSize:13, cursor:'pointer' }}>
                🔄 Reset
              </button>
              <button onClick={submit} disabled={saving}
                style={{ padding:'9px 28px', background: saving ? '#6C757D' : '#1A5276', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? '⏳ Saving...' : '💾 Save Production Entry'}
              </button>
            </div>
          </div>

          {/* RIGHT — Live Summary Panel */}
          <div style={{ position:'sticky', top:80, alignSelf:'start' }}>

            {/* Efficiency Card */}
            <div style={{ background: effBg, border:`2px solid ${effColor}`, borderRadius:10, padding:16, marginBottom:12, textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, color: effColor, textTransform:'uppercase', letterSpacing:.5 }}>Machine Efficiency</div>
              <div style={{ fontSize:48, fontWeight:900, color: effColor, fontFamily:'DM Mono,monospace', lineHeight:1.1 }}>{efficiency}%</div>
              <div style={{ fontSize:11, color: effColor, opacity:.75 }}>Production Time / Shift Time</div>
            </div>

            {/* Time Summary */}
            <div style={{ ...S.card, padding:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#1A5276', marginBottom:10 }}>⏱️ Time Summary</div>
              {[
                { label:'Shift Duration', val: minsToHM(totalMins),      c:'#1A5276' },
                { label:'Idle Time',      val: minsToHM(totalIdleMins),  c:'#856404' },
                { label:'Prod. Time',     val: minsToHM(prodMins),       c:'#155724' },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F0F0F0', fontSize:12 }}>
                  <span style={{ color:'#6C757D' }}>{r.label}</span>
                  <span style={{ fontWeight:700, color: r.c, fontFamily:'DM Mono,monospace' }}>{r.val}</span>
                </div>
              ))}
            </div>

            {/* Qty Summary */}
            <div style={{ ...S.card, padding:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#1A5276', marginBottom:10 }}>📦 Qty Summary</div>
              {[
                { label:'Planned',   val: form.plannedQty || 0,             c:'#1A5276' },
                { label:'Produced',  val: producedSoFar,                    c:'#856404' },
                { label:'Possible',  val: possibleQty,                      c:'#0C5460' },
                { label:'Good',      val: parseInt(form.goodQty    || 0),   c:'#155724' },
                { label:'Rejected',  val: parseInt(form.rejectedQty || 0),   c:'#721C24' },
                { label:'Rework',    val: parseInt(form.reworkQty   || 0),   c:'#856404' },
                { label:'Processed', val: totalProcessed,                    c:'#1A5276' },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F0F0F0', fontSize:12 }}>
                  <span style={{ color:'#6C757D' }}>{r.label}</span>
                  <span style={{ fontWeight:700, color: r.c, fontFamily:'DM Mono,monospace' }}>{r.val}</span>
                </div>
              ))}
              <div style={{ marginTop:8, background: parseFloat(rejPct) > 5 ? '#F8D7DA' : '#D4EDDA', borderRadius:5, padding:'5px 10px', display:'flex', justifyContent:'space-between', fontSize:12 }}>
                <span style={{ fontWeight:600 }}>Rejection %</span>
                <span style={{ fontWeight:800, fontFamily:'DM Mono,monospace', color: parseFloat(rejPct) > 5 ? '#721C24' : '#155724' }}>{rejPct}%</span>
              </div>
            </div>

            {/* Idle Summary */}
            {idleRows.length > 0 && (
              <div style={{ ...S.card, padding:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#856404', marginBottom:8 }}>⚠️ Idle Breakdown</div>
                {idleRows.map((r, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'4px 0', borderBottom:'1px solid #FEF9C3' }}>
                    <span style={{ color:'#6C757D' }}>{IDLE_REASONS.find(x => x.code === r.reasonCode)?.label || r.reasonCode}</span>
                    <span style={{ fontWeight:700, color:'#856404' }}>{r.mins}m</span>
                  </div>
                ))}
                <div style={{ marginTop:6, display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:800, color:'#856404' }}>
                  <span>Total Idle</span><span>{totalIdleMins}m</span>
                </div>
              </div>
            )}
          </div>

      </div>

      {/* ── TODAY'S ENTRIES — always visible below form ── */}
      <div style={{ marginTop:20 }}>

        {/* KPI Summary Row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:12 }}>
          {[
            { label:'Total Entries',    value: entries.length,                                                                       bg:'#EBF5FB', c:'#1A5276' },
            { label:'Total Good Qty',   value: entries.reduce((s,e)=>s+parseFloat(e.goodQty||0),0),                                  bg:'#D4EDDA', c:'#155724' },
            { label:'Total Rejected',   value: entries.reduce((s,e)=>s+parseFloat(e.rejectedQty||0),0),                              bg:'#F8D7DA', c:'#721C24' },
            { label:'Avg Efficiency',   value: entries.length ? (entries.reduce((s,e)=>s+parseFloat(e.efficiency||0),0)/entries.length).toFixed(1)+'%' : '—', bg:'#FFF3CD', c:'#856404' },
            { label:'Total Idle (min)', value: entries.reduce((s,e)=>s+parseFloat(e.totalIdleMins||0),0),                            bg:'#F4ECF7', c:'#6C3483' },
          ].map(k => (
            <div key={k.label} style={{ background:k.bg, border:`1px solid ${k.c}22`, borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:k.c, textTransform:'uppercase', letterSpacing:.4 }}>{k.label}</div>
              <div style={{ fontSize:22, fontWeight:800, color:k.c, fontFamily:'Syne,sans-serif' }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Entries Table */}
        <div style={{ border:'1.5px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
          <div style={{ background:'#1A5276', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>📋 Today's Production Entries</span>
            <span style={{ color:'rgba(255,255,255,.6)', fontSize:11 }}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short',year:'numeric'})}</span>
          </div>
          <div style={{ overflowX:'auto', maxHeight:320, overflowY:'auto' }}>
            <table className="fi-data-table" style={{ width:'100%', minWidth:900 }}>
              <thead style={{ position:'sticky', top:0, background:'#F8F9FA', zIndex:5 }}>
                <tr>
                  <th>Log No</th>
                  <th>Shift</th>
                  <th>Machine</th>
                  <th>WO No</th>
                  <th>Good Qty</th>
                  <th>Rejected</th>
                  <th>Rework</th>
                  <th>Rej %</th>
                  <th>Idle (min)</th>
                  <th>Efficiency</th>
                  <th>Operator</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={12} style={{ textAlign:'center', padding:30, color:'#6C757D', fontSize:12 }}>
                      📝 No entries yet today — fill the form above and save your first entry!
                    </td>
                  </tr>
                )}
                {entries.map((e, i) => {
                  const tot = parseFloat(e.goodQty||0) + parseFloat(e.rejectedQty||0)
                  const rp  = tot > 0 ? ((parseFloat(e.rejectedQty||0)/tot)*100).toFixed(1) : '0.0'
                  const eff = parseFloat(e.efficiency||0)
                  const effC= eff>=80?'#155724':eff>=60?'#856404':'#721C24'
                  const effB= eff>=80?'#D4EDDA':eff>=60?'#FFF3CD':'#F8D7DA'
                  return (
                    <tr key={e.id||i} style={{ background: i%2===0?'#fff':'#FAFAFA' }}>
                      <td style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:'#1A5276', fontWeight:700 }}>{e.logNo||`#${i+1}`}</td>
                      <td>
                        <span style={{ padding:'2px 8px', borderRadius:8, background:'#EBF5FB', color:'#1A5276', fontSize:10, fontWeight:700 }}>
                          Shift {e.shift}
                        </span>
                      </td>
                      <td style={{ fontSize:11, fontWeight:600 }}>{e.machineName||e.wcId||'—'}</td>
                      <td style={{ fontSize:11, fontFamily:'DM Mono,monospace', color:'#6C757D' }}>{e.woNo||'—'}</td>
                      <td style={{ fontWeight:800, color:'#155724', fontSize:13 }}>{e.goodQty||0}</td>
                      <td style={{ fontWeight:700, color: parseFloat(e.rejectedQty)>0?'#721C24':'#6C757D' }}>{e.rejectedQty||0}</td>
                      <td style={{ fontWeight:700, color: parseFloat(e.reworkQty)>0?'#856404':'#6C757D' }}>{e.reworkQty||0}</td>
                      <td>
                        <span style={{ padding:'2px 8px', borderRadius:8, fontSize:10, fontWeight:700,
                          background: parseFloat(rp)>5?'#F8D7DA':'#D4EDDA',
                          color:      parseFloat(rp)>5?'#721C24':'#155724' }}>
                          {rp}%
                        </span>
                      </td>
                      <td style={{ fontWeight:700, color: parseFloat(e.totalIdleMins)>30?'#856404':'#6C757D', fontSize:11 }}>
                        {e.totalIdleMins||0}m
                      </td>
                      <td>
                        <span style={{ padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:800, background:effB, color:effC }}>
                          {e.efficiency||0}%
                        </span>
                      </td>
                      <td style={{ fontSize:11 }}>{e.operatorName||'—'}</td>
                      <td style={{ fontSize:10, color:'#6C757D' }}>
                        {e.startTime} – {e.endTime}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {entries.length > 0 && (
                <tfoot style={{ background:'#1A5276', color:'#fff' }}>
                  <tr>
                    <td colSpan={4} style={{ padding:'8px 12px', fontWeight:700, fontSize:12 }}>Day Total</td>
                    <td style={{ fontWeight:800, fontSize:13, color:'#A9DFBF' }}>{entries.reduce((s,e)=>s+parseFloat(e.goodQty||0),0)}</td>
                    <td style={{ fontWeight:800, color:'#F1948A' }}>{entries.reduce((s,e)=>s+parseFloat(e.rejectedQty||0),0)}</td>
                    <td style={{ fontWeight:800, color:'#F9E79F' }}>{entries.reduce((s,e)=>s+parseFloat(e.reworkQty||0),0)}</td>
                    <td colSpan={5}></td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
