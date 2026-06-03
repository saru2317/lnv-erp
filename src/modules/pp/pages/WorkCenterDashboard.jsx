import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${tok()}` })

export default function WorkCenterDashboard() {
  const nav = useNavigate()
  const [wcs,      setWCs]      = useState([])
  const [wos,      setWOs]      = useState([])
  const [entries,  setEntries]  = useState([]) // today's production entries
  const [moulds,   setMoulds]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('All')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const [wcR, woR, peR, mR] = await Promise.all([
        fetch(`${BASE}/pp/work-centers`, { headers:hdr2() }).then(r=>r.json()),
        fetch(`${BASE}/pp/wo?status=RELEASED,IN_PROGRESS`, { headers:hdr2() }).then(r=>r.json()),
        fetch(`${BASE}/pp/production-entry?date=${today}`, { headers:hdr2() }).then(r=>r.json()).catch(()=>({data:[]})),
        fetch(`${BASE}/pp/moulds`, { headers:hdr2() }).then(r=>r.json()).catch(()=>({data:[]})),
      ])
      setWCs(wcR.data || [])
      setWOs(woR.data || [])
      setEntries(peR.data || [])
      setMoulds(mR.data || [])
      setLastRefresh(new Date())
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    // Auto-refresh every 2 minutes
    const t = setInterval(load, 120000)
    return () => clearInterval(t)
  }, [load])

  // ── Derive WC status from live data ────────────────────────────────────────
  const enrichWC = (wc) => {
    // Running WO on this WC = WO with status IN_PROGRESS whose operation workCenter = wc.wcId
    const runningWO = wos.find(wo =>
      wo.status === 'IN_PROGRESS' &&
      (wo.operations||[]).some(op =>
        op.workCenter === wc.wcId || op.workCenter === wc.name
      )
    )

    // Today's production entry for this WC
    const todayEntry = entries.find(e =>
      e.wcId === wc.wcId || e.machineName === wc.wcId || e.machineName === wc.name
    )

    // Queued WOs = RELEASED WOs for this WC not yet IN_PROGRESS
    const queuedWOs = wos.filter(wo =>
      wo.status === 'RELEASED' &&
      (wo.operations||[]).some(op =>
        op.workCenter === wc.wcId || op.workCenter === wc.name
      )
    )

    // Mould loaded on this WC
    const loadedMould = moulds.find(m => {
      try {
        const extra = JSON.parse(m.remarks||'{}')
        return (extra.machines||[]).includes(wc.wcId) ||
               m.location === wc.wcId || m.location === wc.name
      } catch { return false }
    })

    // Utilization from today's entry
    const utilization = todayEntry
      ? Math.round(parseFloat(todayEntry.efficiency || 0))
      : runningWO ? 100 : 0

    // Status
    const liveStatus = wc.status === 'Under Maintenance' ? 'Maintenance'
      : runningWO ? 'Running'
      : wc.status === 'Active' ? 'Free'
      : wc.status

    return { ...wc, runningWO, todayEntry, queuedWOs, loadedMould, utilization, liveStatus }
  }

  const enriched = wcs.map(enrichWC)

  // Filter
  const filtered = enriched.filter(wc => {
    if (filter === 'All')         return true
    if (filter === 'Running')     return wc.liveStatus === 'Running'
    if (filter === 'Free')        return wc.liveStatus === 'Free'
    if (filter === 'Maintenance') return wc.liveStatus === 'Maintenance'
    return true
  })

  // KPIs
  const totalRunning = enriched.filter(w => w.liveStatus === 'Running').length
  const totalFree    = enriched.filter(w => w.liveStatus === 'Free').length
  const totalMaint   = enriched.filter(w => w.liveStatus === 'Maintenance').length
  const avgUtil      = enriched.length > 0
    ? Math.round(enriched.reduce((s,w) => s+w.utilization, 0) / enriched.length) : 0

  const statusColor = s => ({
    'Running':     '#E67E22',
    'Free':        '#28A745',
    'Maintenance': '#DC3545',
  }[s] || '#6C757D')

  const statusBg = s => ({
    'Running':     '#FFF3CD',
    'Free':        '#D4EDDA',
    'Maintenance': '#F8D7DA',
  }[s] || '#E9ECEF')

  return (
    <div>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:100, background:'#F8F4F8',
        borderBottom:'2px solid #E0D5E0', boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Work Center Board
            <small>CR01 · Live status — auto-refresh 2min</small>
            <small style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'#856404', marginLeft:8 }}>
              Last: {lastRefresh.toLocaleTimeString('en-IN')}
            </small>
          </div>
          <div className="lv-acts">
            <div style={{ display:'flex', gap:4, background:'#F0EEF0',
              padding:3, borderRadius:6 }}>
              {['All','Running','Free','Maintenance'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding:'5px 12px', borderRadius:4, border:'none',
                    fontSize:11, fontWeight:700, cursor:'pointer',
                    background: filter===f ? '#714B67' : 'transparent',
                    color:      filter===f ? '#fff'    : '#6C757D' }}>
                  {f}
                </button>
              ))}
            </div>
            <button className="btn btn-s sd-bsm" onClick={load}>
              {loading ? '⏳' : '↻'} Refresh
            </button>
            <button className="btn btn-p sd-bsm"
              onClick={() => nav('/pp/entry')}>
              + Production Entry
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:14 }}>
        {[
          { l:'Total Machines', v: wcs.length,    c:'#714B67', bg:'#EDE0EA' },
          { l:'Running',        v: totalRunning,   c:'#E67E22', bg:'#FFF3CD' },
          { l:'Free',           v: totalFree,      c:'#155724', bg:'#D4EDDA' },
          { l:'Maintenance',    v: totalMaint,     c:'#DC3545', bg:'#F8D7DA' },
          { l:'Avg Utilization',v:`${avgUtil}%`,   c: avgUtil>85?'#DC3545':avgUtil>60?'#856404':'#155724',
            bg: avgUtil>85?'#F8D7DA':avgUtil>60?'#FFF3CD':'#D4EDDA' },
        ].map(k => (
          <div key={k.l} style={{ background:k.bg, borderRadius:8,
            padding:'10px 14px', border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, fontWeight:700, color:k.c, textTransform:'uppercase' }}>{k.l}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.c, fontFamily:'Syne,sans-serif' }}>
              {loading ? '...' : k.v}
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>
          Loading work center data...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>⚙️</div>
          <div style={{ fontWeight:700 }}>No work centers found</div>
        </div>
      ) : (
        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12 }}>
          {filtered.map(wc => {
            const sc = statusColor(wc.liveStatus)
            const sb = statusBg(wc.liveStatus)
            const uc = wc.utilization >= 90 ? '#DC3545'
                     : wc.utilization >= 70 ? '#E67E22' : '#28A745'

            return (
              <div key={wc.id} style={{ background:'#fff', borderRadius:10,
                overflow:'hidden', border:`2px solid ${sc}`,
                boxShadow:`0 0 0 3px ${sc}22` }}>

                {/* Status stripe */}
                <div style={{ height:4, background:sc }} />

                <div style={{ padding:'12px 14px' }}>
                  {/* WC Header */}
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:13,
                        fontFamily:'Syne,sans-serif' }}>{wc.name}</div>
                      <div style={{ fontSize:10, color:'#6C757D',
                        fontFamily:'DM Mono,monospace', marginTop:2 }}>
                        {wc.wcId} · {wc.machineType||wc.category||'Machine'}
                      </div>
                      <div style={{ fontSize:10, color:'#6C757D', marginTop:1 }}>
                        {wc.shiftHrs||8}h/shift · {wc.shift||1} shift(s)/day
                      </div>
                    </div>
                    <span style={{ padding:'4px 10px', borderRadius:10,
                      fontSize:11, fontWeight:800,
                      background:sb, color:sc, whiteSpace:'nowrap' }}>
                      {wc.liveStatus === 'Running' ? '⚙️' :
                       wc.liveStatus === 'Free'    ? '🟢' : '🔴'} {wc.liveStatus}
                    </span>
                  </div>

                  {/* Utilization bar */}
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      fontSize:11, marginBottom:3 }}>
                      <span style={{ color:'#6C757D', fontWeight:600 }}>Today's Utilization</span>
                      <strong style={{ color:uc }}>{wc.utilization}%</strong>
                    </div>
                    <div style={{ background:'#E0E0E0', borderRadius:3, height:6, overflow:'hidden' }}>
                      <div style={{ width:`${Math.min(wc.utilization,100)}%`,
                        height:'100%', borderRadius:3, background:uc,
                        transition:'width .4s' }} />
                    </div>
                  </div>

                  {/* Running WO */}
                  {wc.runningWO ? (
                    <div style={{ padding:'8px 12px', background:'#FFF3CD',
                      borderRadius:8, marginBottom:10,
                      border:'1px solid #FFE69C' }}>
                      <div style={{ fontSize:10, fontWeight:800,
                        color:'#856404', marginBottom:4 }}>
                        ⚙️ CURRENT JOB
                      </div>
                      <div style={{ fontFamily:'DM Mono,monospace', fontWeight:800,
                        fontSize:13, color:'#714B67' }}>
                        {wc.runningWO.woNo}
                      </div>
                      <div style={{ fontSize:11, color:'#495057', marginTop:2 }}>
                        {wc.runningWO.itemName}
                      </div>
                      <div style={{ display:'flex', gap:12, marginTop:6,
                        fontSize:11, color:'#856404' }}>
                        <span>Planned: <strong>
                          {parseFloat(wc.runningWO.plannedQty||0).toLocaleString('en-IN')}
                        </strong></span>
                        <span>Done: <strong style={{ color:'#155724' }}>
                          {parseFloat(wc.runningWO.producedQty||0).toLocaleString('en-IN')}
                        </strong></span>
                        <span>Rem: <strong style={{ color:'#DC3545' }}>
                          {Math.max(0,parseFloat(wc.runningWO.plannedQty||0)-parseFloat(wc.runningWO.producedQty||0)).toLocaleString('en-IN')}
                        </strong></span>
                      </div>
                      {/* Progress bar for WO completion */}
                      {wc.runningWO.plannedQty > 0 && (
                        <div style={{ marginTop:6 }}>
                          <div style={{ background:'#E0E0E0', borderRadius:3,
                            height:4, overflow:'hidden' }}>
                            <div style={{
                              width:`${Math.min(100, (parseFloat(wc.runningWO.producedQty||0)/parseFloat(wc.runningWO.plannedQty))*100)}%`,
                              height:'100%', borderRadius:3, background:'#28A745'
                            }} />
                          </div>
                        </div>
                      )}
                      <button onClick={() => nav('/pp/entry')}
                        style={{ marginTop:8, padding:'4px 10px', fontSize:10,
                          fontWeight:700, background:'#714B67', color:'#fff',
                          border:'none', borderRadius:5, cursor:'pointer' }}>
                        + Entry
                      </button>
                    </div>
                  ) : wc.liveStatus === 'Free' ? (
                    <div style={{ padding:'10px', background:'#D4EDDA',
                      borderRadius:8, marginBottom:10, textAlign:'center',
                      border:'1px solid #A9DFBF' }}>
                      <div style={{ fontSize:12, fontWeight:800, color:'#155724' }}>
                        🟢 AVAILABLE
                      </div>
                      <div style={{ fontSize:10, color:'#155724', marginTop:2 }}>
                        Ready for next job
                      </div>
                    </div>
                  ) : wc.liveStatus === 'Maintenance' ? (
                    <div style={{ padding:'10px', background:'#F8D7DA',
                      borderRadius:8, marginBottom:10, textAlign:'center',
                      border:'1px solid #F5C6CB' }}>
                      <div style={{ fontSize:12, fontWeight:800, color:'#721C24' }}>
                        🔴 UNDER MAINTENANCE
                      </div>
                    </div>
                  ) : null}

                  {/* Today's production summary */}
                  {wc.todayEntry && (
                    <div style={{ padding:'8px 10px', background:'#EBF5FB',
                      borderRadius:6, marginBottom:10, border:'1px solid #AED6F1' }}>
                      <div style={{ fontSize:10, fontWeight:700,
                        color:'#1A5276', marginBottom:4 }}>
                        📊 TODAY'S SHIFT
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                        gap:6, fontSize:11 }}>
                        {[
                          ['Good', wc.todayEntry.goodQty||0, '#155724'],
                          ['Rejected', wc.todayEntry.rejectedQty||0, '#DC3545'],
                          ['Efficiency', `${Math.round(wc.todayEntry.efficiency||0)}%`,
                            parseFloat(wc.todayEntry.efficiency||0)>=85?'#155724':'#856404'],
                        ].map(([l,v,c]) => (
                          <div key={l} style={{ textAlign:'center', padding:'4px',
                            background:'#fff', borderRadius:4 }}>
                            <div style={{ fontWeight:800, color:c, fontSize:13 }}>
                              {typeof v === 'number' ? v.toLocaleString('en-IN') : v}
                            </div>
                            <div style={{ fontSize:9, color:'#6C757D' }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Loaded Mould */}
                  {wc.loadedMould && (
                    <div style={{ padding:'7px 10px', background:'#F8F4F8',
                      borderRadius:6, marginBottom:10,
                      border:'1px solid #E0D5E0', fontSize:11 }}>
                      <span style={{ fontWeight:700, color:'#714B67' }}>
                        🔩 {wc.loadedMould.mouldId}
                      </span>
                      <span style={{ color:'#6C757D', marginLeft:6 }}>
                        {wc.loadedMould.mouldName} · Cav {wc.loadedMould.cavity}
                      </span>
                      {wc.loadedMould.status === 'PM Due' && (
                        <span style={{ marginLeft:6, fontSize:10, fontWeight:700,
                          color:'#856404' }}>⚠️ PM Due</span>
                      )}
                    </div>
                  )}

                  {/* Queue */}
                  {wc.queuedWOs.length > 0 && (
                    <div style={{ padding:'7px 10px', background:'#F8F9FA',
                      borderRadius:6, border:'1px solid #E0D5E0' }}>
                      <div style={{ fontSize:10, fontWeight:700,
                        color:'#6C757D', marginBottom:4 }}>
                        QUEUE ({wc.queuedWOs.length})
                      </div>
                      {wc.queuedWOs.slice(0,3).map(wo => (
                        <div key={wo.id}
                          style={{ fontSize:11, padding:'2px 0',
                            borderBottom:'1px solid #F0EEF0',
                            display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontFamily:'DM Mono,monospace',
                            fontWeight:700, color:'#714B67' }}>{wo.woNo}</span>
                          <span style={{ color:'#6C757D' }}>
                            {parseFloat(wo.plannedQty||0).toLocaleString('en-IN')} pcs
                          </span>
                        </div>
                      ))}
                      {wc.queuedWOs.length > 3 && (
                        <div style={{ fontSize:10, color:'#6C757D', marginTop:3 }}>
                          +{wc.queuedWOs.length-3} more in queue
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
