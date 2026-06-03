import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${tok()}` })

const STATUS_COLOR = {
  DRAFT:       '#9B59B6',
  RELEASED:    '#2980B9',
  IN_PROGRESS: '#E67E22',
  COMPLETED:   '#27AE60',
  CANCELLED:   '#E74C3C',
  ON_HOLD:     '#714B67',
}

const STATUS_BG = {
  DRAFT:       '#F4ECF7',
  RELEASED:    '#EBF5FB',
  IN_PROGRESS: '#FEF9E7',
  COMPLETED:   '#EAFAF1',
  CANCELLED:   '#FDEDEC',
  ON_HOLD:     '#EDE0EA',
}

const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '—'

export default function GanttView() {
  const nav = useNavigate()

  const [wos,      setWOs]      = useState([])
  const [wcs,      setWCs]      = useState([])
  const [loading,  setLoading]  = useState(true)
  const [view,     setView]     = useState('month')
  const [filter,   setFilter]   = useState('All')
  const [rangeStart, setRangeStart] = useState(null)
  const [rangeEnd,   setRangeEnd]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [woRes, wcRes] = await Promise.all([
        fetch(`${BASE}/pp/wo?status=DRAFT,RELEASED,IN_PROGRESS,COMPLETED,ON_HOLD`, { headers: hdr2() })
          .then(r => r.json()),
        fetch(`${BASE}/pp/work-centers`, { headers: hdr2() })
          .then(r => r.json()).catch(() => ({ data:[] }))
      ])

      const woList = woRes.data || []
      setWOs(woList)
      setWCs(wcRes.data || [])

      // Compute date range from WO schedule
      const dates = woList
        .flatMap(w => [w.scheduledStart, w.scheduledEnd])
        .filter(Boolean)
        .map(d => new Date(d))

      if (dates.length) {
        const minD = new Date(Math.min(...dates))
        const maxD = new Date(Math.max(...dates))
        // Expand by 7 days on each side
        minD.setDate(minD.getDate() - 3)
        maxD.setDate(maxD.getDate() + 7)
        setRangeStart(minD)
        setRangeEnd(maxD)
      } else {
        // Default: current month
        const now = new Date()
        setRangeStart(new Date(now.getFullYear(), now.getMonth(), 1))
        setRangeEnd(new Date(now.getFullYear(), now.getMonth() + 1, 0))
      }
    } catch { toast.error('Failed to load Gantt data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Compute total range days
  const totalDays = rangeStart && rangeEnd
    ? Math.max(1, Math.ceil((rangeEnd - rangeStart) / 86400000))
    : 30

  // Convert date to % position on Gantt
  const dateToX = (d) => {
    if (!d || !rangeStart) return 0
    const dt   = new Date(d)
    const days = (dt - rangeStart) / 86400000
    return Math.max(0, Math.min(100, (days / totalDays) * 100))
  }

  const dateToDays = (start, end) => {
    if (!start || !end) return 5
    const diff = (new Date(end) - new Date(start)) / 86400000
    return Math.max(1, diff)
  }

  const barWidth = (start, end) =>
    (dateToDays(start, end) / totalDays) * 100

  const pct = w => {
    const planned  = parseFloat(w.plannedQty  || 0)
    const produced = parseFloat(w.producedQty || 0)
    return planned > 0 ? Math.min(100, Math.round((produced / planned) * 100)) : 0
  }

  // Generate week/day labels for header
  const getHeaderLabels = () => {
    if (!rangeStart || !rangeEnd) return []
    const labels = []
    const cur = new Date(rangeStart)

    if (view === 'month') {
      // Week labels
      while (cur <= rangeEnd) {
        const weekStart = new Date(cur)
        cur.setDate(cur.getDate() + 7)
        const weekEnd = new Date(Math.min(cur, rangeEnd))
        const left = dateToX(weekStart)
        const right = dateToX(weekEnd)
        labels.push({
          label: `${fmtD(weekStart)} – ${fmtD(weekEnd)}`,
          left,
          width: right - left
        })
      }
    } else if (view === 'week') {
      // Day labels
      while (cur <= rangeEnd) {
        const day = new Date(cur)
        const left = dateToX(day)
        cur.setDate(cur.getDate() + 1)
        labels.push({
          label: fmtD(day),
          left,
          width: (1 / totalDays) * 100
        })
      }
    } else {
      // Month labels
      const seen = new Set()
      const c2 = new Date(rangeStart)
      while (c2 <= rangeEnd) {
        const key = `${c2.getFullYear()}-${c2.getMonth()}`
        if (!seen.has(key)) {
          seen.add(key)
          const monthStart = new Date(c2.getFullYear(), c2.getMonth(), 1)
          const monthEnd   = new Date(c2.getFullYear(), c2.getMonth() + 1, 0)
          labels.push({
            label: monthStart.toLocaleDateString('en-IN', { month:'long', year:'numeric' }),
            left:  dateToX(monthStart),
            width: (dateToDays(monthStart, monthEnd) / totalDays) * 100
          })
        }
        c2.setDate(c2.getDate() + 7)
      }
    }
    return labels
  }

  // Machine load calculation
  const machineLoad = () => {
    const loadMap = {}
    wos.forEach(w => {
      if (['COMPLETED','CANCELLED'].includes(w.status)) return
      const ops = w.operations || []
      ops.forEach(op => {
        const wc = op.workCenter || op.wcId || 'Unknown'
        if (!loadMap[wc]) loadMap[wc] = { wc, hours: 0, wos: 0 }
        loadMap[wc].hours += parseFloat(op.runTime || 0) * parseFloat(w.plannedQty || 0) / 60
        loadMap[wc].wos++
      })
    })
    return Object.values(loadMap).sort((a, b) => b.hours - a.hours).slice(0, 6)
  }

  // Today marker position
  const todayX = dateToX(new Date())
  const isToday = todayX > 0 && todayX < 100

  const STATUS_CHIPS = ['All','DRAFT','RELEASED','IN_PROGRESS','COMPLETED']
  const filtered = filter === 'All' ? wos : wos.filter(w => w.status === filter)
  const headerLabels = getHeaderLabels()
  const loads = machineLoad()

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Gantt View
          <small>
            Production Schedule ·&nbsp;
            {rangeStart ? fmtD(rangeStart) : '—'} → {rangeEnd ? fmtD(rangeEnd) : '—'}
          </small>
        </div>
        <div className="fi-lv-actions">
          {['week','month','quarter'].map(v => (
            <button key={v}
              className={`btn ${view===v ? 'btn-p' : 'btn-s'} sd-bsm`}
              onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <button className="btn btn-s sd-bsm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/pp/wo/new')}>+ New WO</button>
        </div>
      </div>

      {/* Status chips */}
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        {STATUS_CHIPS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding:'4px 12px', borderRadius:14, fontSize:11,
              fontWeight:700, cursor:'pointer', border:'1.5px solid',
              background: filter===s ? (STATUS_COLOR[s]||'#714B67') : '#F8F4F8',
              color:      filter===s ? '#fff' : (STATUS_COLOR[s]||'#714B67'),
              borderColor: STATUS_COLOR[s] || '#E0D5E0',
            }}>
            {s.replace('_',' ')}
            <span style={{ marginLeft:5, opacity:.8 }}>
              ({s==='All' ? wos.length : wos.filter(w=>w.status===s).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
          Loading production schedule...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
          <div style={{ fontSize:40, marginBottom:8 }}>📅</div>
          No work orders found.
          <button className="btn-xs pri" style={{ marginLeft:8 }}
            onClick={() => nav('/pp/wo/new')}>
            Create WO
          </button>
        </div>
      ) : (
        <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
          borderRadius:8, overflow:'hidden', marginBottom:16 }}>

          {/* Gantt Table */}
          <div style={{ overflowX:'auto' }}>
            <div style={{ minWidth:900 }}>

              {/* Header Row */}
              <div style={{ display:'flex', background:'#714B67',
                borderBottom:'2px solid #5C3B55' }}>
                {/* Label column */}
                <div style={{ width:220, flexShrink:0, padding:'8px 12px',
                  fontSize:10, fontWeight:700, color:'#fff',
                  textTransform:'uppercase' }}>
                  Work Order / Item
                </div>
                {/* Timeline header */}
                <div style={{ flex:1, position:'relative', height:34 }}>
                  {headerLabels.map((lbl, i) => (
                    <div key={i} style={{
                      position:'absolute',
                      left:`${lbl.left}%`,
                      width:`${lbl.width}%`,
                      height:'100%',
                      padding:'8px 4px',
                      fontSize:10, fontWeight:700, color:'#fff',
                      borderLeft: i > 0 ? '1px solid rgba(255,255,255,.2)' : 'none',
                      overflow:'hidden', whiteSpace:'nowrap',
                    }}>
                      {lbl.label}
                    </div>
                  ))}
                </div>
                {/* Status column */}
                <div style={{ width:80, flexShrink:0, padding:'8px 6px',
                  fontSize:10, fontWeight:700, color:'#fff',
                  textTransform:'uppercase' }}>
                  Status
                </div>
              </div>

              {/* WO Rows */}
              {filtered.map((w, i) => {
                const p      = pct(w)
                const startX = dateToX(w.scheduledStart)
                const wBar   = barWidth(w.scheduledStart, w.scheduledEnd)
                const col    = STATUS_COLOR[w.status] || '#714B67'
                const bgCol  = STATUS_BG[w.status]   || '#F8F4F8'
                const isActive = ['RELEASED','IN_PROGRESS'].includes(w.status)

                return (
                  <div key={w.id}
                    style={{
                      display:'flex', alignItems:'center',
                      borderBottom:'1px solid #F0F0F0',
                      background: i%2===0 ? '#fff' : '#FAFAFA',
                      cursor: isActive ? 'pointer' : 'default',
                    }}
                    onClick={() => isActive && nav(`/pp/entry?woId=${w.id}`)}>

                    {/* Label */}
                    <div style={{ width:220, flexShrink:0,
                      padding:'8px 12px', borderRight:'1px solid #F0F0F0' }}>
                      <div style={{ fontWeight:700, fontSize:12,
                        color:'#714B67', fontFamily:'DM Mono,monospace' }}>
                        {w.woNo}
                      </div>
                      <div style={{ fontSize:11, color:'#495057',
                        marginTop:2, fontWeight:600 }}>
                        {w.itemName}
                      </div>
                      {w.itemCode && (
                        <div style={{ fontSize:10, color:'#6C757D',
                          fontFamily:'DM Mono,monospace' }}>
                          {w.itemCode}
                        </div>
                      )}
                    </div>

                    {/* Gantt Bar Track */}
                    <div style={{ flex:1, position:'relative',
                      height:44, cursor:'inherit' }}>

                      {/* Today line */}
                      {isToday && (
                        <div style={{
                          position:'absolute',
                          left:`${todayX}%`,
                          top:0, bottom:0, width:2,
                          background:'#DC3545',
                          zIndex:5, opacity:.6,
                        }} />
                      )}

                      {/* Bar track (background) */}
                      {wBar > 0 && (
                        <div style={{
                          position:'absolute',
                          left:`${startX}%`,
                          width:`${wBar}%`,
                          top:'25%', height:'50%',
                          background: bgCol,
                          borderRadius:4,
                          border:`1px solid ${col}40`,
                        }} />
                      )}

                      {/* Progress fill */}
                      {wBar > 0 && p > 0 && (
                        <div style={{
                          position:'absolute',
                          left:`${startX}%`,
                          width:`${wBar * p / 100}%`,
                          top:'25%', height:'50%',
                          background: col,
                          borderRadius:4,
                          transition:'width .3s',
                        }} />
                      )}

                      {/* Bar label */}
                      {wBar > 5 && (
                        <div style={{
                          position:'absolute',
                          left:`${startX + 0.5}%`,
                          top:'50%', transform:'translateY(-50%)',
                          fontSize:10, fontWeight:700,
                          color: p > 40 ? '#fff' : col,
                          whiteSpace:'nowrap', pointerEvents:'none',
                          zIndex:6,
                        }}>
                          {p > 0 ? `${p}%` : `${fmtD(w.scheduledStart)} → ${fmtD(w.scheduledEnd)}`}
                        </div>
                      )}

                      {/* No schedule warning */}
                      {!w.scheduledStart && (
                        <div style={{ padding:'12px 16px',
                          fontSize:11, color:'#6C757D',
                          fontStyle:'italic' }}>
                          No schedule set
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <div style={{ width:80, flexShrink:0,
                      padding:'0 8px', textAlign:'center' }}>
                      <span style={{
                        background: bgCol, color: col,
                        padding:'2px 6px', borderRadius:8,
                        fontSize:9, fontWeight:700,
                        display:'inline-block',
                      }}>
                        {w.status.replace('_',' ')}
                      </span>
                      <div style={{ fontSize:9, color:'#6C757D', marginTop:2 }}>
                        {parseFloat(w.plannedQty||0).toLocaleString()} {w.uom}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Today legend */}
          {isToday && (
            <div style={{ padding:'6px 14px', background:'#FFF5F5',
              fontSize:11, color:'#DC3545', fontWeight:600 }}>
              <span style={{ background:'#DC3545', color:'#fff',
                padding:'1px 6px', borderRadius:4,
                marginRight:6, fontSize:10 }}>TODAY</span>
              {new Date().toLocaleDateString('en-IN', {
                weekday:'long', day:'2-digit', month:'long', year:'numeric'
              })}
            </div>
          )}
        </div>
      )}

      {/* Machine Load Summary */}
      {loads.length > 0 && (
        <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
          borderRadius:8, padding:'16px 20px' }}>
          <div style={{ fontWeight:800, fontSize:13,
            color:'#714B67', marginBottom:14,
            fontFamily:'Syne,sans-serif' }}>
            ⚙️ Work Center Load (Active WOs)
          </div>
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',
            gap:10 }}>
            {loads.map(m => {
              const maxHrs = Math.max(...loads.map(l => l.hours), 1)
              const pctLoad = Math.min(100, (m.hours / maxHrs) * 100)
              const overload = pctLoad > 85
              return (
                <div key={m.wc} style={{ background: overload ? '#FFF5F5' : '#F8F9FA',
                  borderRadius:8, padding:'10px 14px',
                  border:`1.5px solid ${overload ? '#F5C6CB' : '#E0D5E0'}` }}>
                  <div style={{ fontWeight:700, fontSize:12,
                    color: overload ? '#DC3545' : '#1A1A2E',
                    marginBottom:6 }}>
                    {m.wc}
                    {overload && <span style={{ fontSize:9, marginLeft:6,
                      background:'#F8D7DA', color:'#721C24',
                      padding:'1px 5px', borderRadius:4 }}>HIGH LOAD</span>}
                  </div>
                  <div style={{ height:6, background:'#E0D5E0',
                    borderRadius:3, overflow:'hidden', marginBottom:4 }}>
                    <div style={{
                      height:'100%', width:`${pctLoad}%`,
                      background: overload ? '#DC3545' : '#714B67',
                      borderRadius:3, transition:'width .3s',
                    }} />
                  </div>
                  <div style={{ display:'flex',
                    justifyContent:'space-between', fontSize:10 }}>
                    <span style={{ color:'#6C757D' }}>{m.wos} WO(s)</span>
                    <span style={{ fontWeight:700,
                      color: overload ? '#DC3545' : '#714B67',
                      fontFamily:'DM Mono,monospace' }}>
                      {m.hours.toFixed(0)}h
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty machine load */}
      {!loading && loads.length === 0 && (
        <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
          borderRadius:8, padding:'20px', textAlign:'center', color:'#6C757D',
          fontSize:12 }}>
          No work center load data — operations not assigned to WOs yet.
        </div>
      )}
    </div>
  )
}
