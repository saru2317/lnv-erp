import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${tok()}` })
const fmtN = n => Number(n||0).toLocaleString('en-IN')

export default function PPDashboard() {
  const nav = useNavigate()
  const [wos,      setWOs]      = useState([])
  const [wcs,      setWCs]      = useState([])
  const [entries,  setEntries]  = useState([])
  const [mrpData,  setMrpData]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const now = new Date()
  const monthLabel = now.toLocaleString('en-IN', { month:'long', year:'numeric' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const today = now.toISOString().split('T')[0]
      const [woR, wcR, peR] = await Promise.all([
        fetch(`${BASE}/pp/wo`, { headers:hdr2() }).then(r=>r.json()),
        fetch(`${BASE}/pp/work-centers`, { headers:hdr2() }).then(r=>r.json()),
        fetch(`${BASE}/pp/production-entry?date=${today}`, { headers:hdr2() }).then(r=>r.json()).catch(()=>({data:[]})),
      ])
      setWOs(woR.data || [])
      setWCs(wcR.data || [])
      setEntries(peR.data || [])

      // Load MRP from localStorage
      try {
        const cached = localStorage.getItem('lnv_mrp_results')
        if (cached) {
          const { results } = JSON.parse(cached)
          setMrpData(results || [])
        }
      } catch {}
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Derived KPIs ────────────────────────────────────────────────
  const activeWOs    = wos.filter(w => ['RELEASED','IN_PROGRESS','DRAFT'].includes(w.status))
  const inProgress   = wos.filter(w => w.status === 'IN_PROGRESS')
  const released     = wos.filter(w => w.status === 'RELEASED')
  const completed    = wos.filter(w => w.status === 'COMPLETED')
  const draft        = wos.filter(w => w.status === 'DRAFT')

  // Overdue WOs — scheduledEnd < today and not completed
  const today = now.toISOString().split('T')[0]
  const overdueWOs = activeWOs.filter(w =>
    w.scheduledEnd && new Date(w.scheduledEnd) < now
  )

  // Avg efficiency from today's entries
  const avgEff = entries.length > 0
    ? Math.round(entries.reduce((s,e) => s + parseFloat(e.efficiency||0), 0) / entries.length)
    : 0

  // Machine utilization
  const runningWCs = wcs.filter(wc =>
    inProgress.some(wo =>
      (wo.operations||[]).some(op =>
        op.workCenter === wc.wcId || op.workCenter === wc.name
      )
    )
  ).length

  const avgUtil = wcs.length > 0
    ? Math.round((runningWCs / wcs.length) * 100) : 0

  // MRP shortage count
  const shortages = mrpData.filter(r => r.status === 'SHORT' || parseFloat(r.stillNeeded||0) > 0).length

  // Today's production summary
  const todayGood     = entries.reduce((s,e) => s + parseInt(e.goodQty||0), 0)
  const todayRejected = entries.reduce((s,e) => s + parseInt(e.rejectedQty||0), 0)

  // Status color helpers
  const woStatusStyle = s => ({
    'IN_PROGRESS': { bg:'#FFF3CD', c:'#856404', label:'In Progress' },
    'RELEASED':    { bg:'#D1ECF1', c:'#0C5460', label:'Released'    },
    'DRAFT':       { bg:'#E9ECEF', c:'#495057', label:'Draft'       },
    'COMPLETED':   { bg:'#D4EDDA', c:'#155724', label:'Completed'   },
    'ON_HOLD':     { bg:'#F8D7DA', c:'#721C24', label:'On Hold'     },
  }[s] || { bg:'#E9ECEF', c:'#495057', label: s })

  // WC live status
  const wcStatus = (wc) => {
    if (wc.status === 'Under Maintenance') return { label:'Maintenance', c:'#DC3545', bg:'#F8D7DA' }
    const running = inProgress.some(wo =>
      (wo.operations||[]).some(op =>
        op.workCenter === wc.wcId || op.workCenter === wc.name
      )
    )
    return running
      ? { label:'Running', c:'#E67E22', bg:'#FFF3CD' }
      : { label:'Free',    c:'#155724', bg:'#D4EDDA' }
  }

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          PP Dashboard
          <small>Production Overview · {monthLabel}</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>↻</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/gantt')}>📅 Gantt</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/mrp')}>🔄 MRP Run</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/pp/wo/new')}>+ Work Order</button>
        </div>
      </div>

      {/* Alerts */}
      {!loading && (overdueWOs.length > 0 || shortages > 0) && (
        <div style={{ background:'#FFF3CD', border:'1px solid #FFE69C',
          borderRadius:6, padding:'8px 14px', marginBottom:12,
          fontSize:12, color:'#856404', display:'flex', gap:16, flexWrap:'wrap' }}>
          ⚠️
          {overdueWOs.length > 0 && (
            <span>
              <strong>{overdueWOs.length} WO(s)</strong> overdue —&nbsp;
              <span style={{ textDecoration:'underline', cursor:'pointer' }}
                onClick={() => nav('/pp/wo')}>View →</span>
            </span>
          )}
          {shortages > 0 && (
            <span>
              <strong>{shortages} material(s)</strong> short in MRP —&nbsp;
              <span style={{ textDecoration:'underline', cursor:'pointer' }}
                onClick={() => nav('/pp/mrp/results')}>MRP Results →</span>
            </span>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="pp-kpi-grid">
        {[
          { cls:'purple', l:'Active Work Orders',    v: loading?'...':activeWOs.length,
            s:`${draft.length} draft · ${released.length} released · ${inProgress.length} running` },
          { cls:'green',  l:'Completed (All Time)',  v: loading?'...':completed.length,
            s: avgEff > 0 ? `Today avg efficiency: ${avgEff}%` : 'No entries today' },
          { cls:'orange', l:'Machine Utilization',   v: loading?'...':`${avgUtil}%`,
            s:`${runningWCs} running · ${wcs.length - runningWCs} free` },
          { cls:'red',    l:'MRP Shortages',         v: loading?'...':shortages,
            s: shortages > 0 ? 'Materials need purchasing' : '✅ All covered' },
        ].map(k => (
          <div key={k.l} className={`pp-kpi-card ${k.cls}`}>
            <div className="pp-kpi-label">{k.l}</div>
            <div className="pp-kpi-value">{k.v}</div>
            <div className="pp-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      {/* Today's Production Banner */}
      {entries.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
          gap:10, marginBottom:14 }}>
          {[
            { l:"Today's Good Qty",  v: fmtN(todayGood),     c:'#155724', bg:'#D4EDDA' },
            { l:'Rejected',          v: fmtN(todayRejected),  c:'#DC3545', bg:'#F8D7DA' },
            { l:'Avg Efficiency',    v: `${avgEff}%`,          c: avgEff>=85?'#155724':'#856404',
              bg: avgEff>=85?'#D4EDDA':'#FFF3CD' },
            { l:'Entries Today',     v: entries.length,        c:'#1A5276', bg:'#EBF5FB' },
          ].map(k => (
            <div key={k.l} style={{ background:k.bg, borderRadius:8,
              padding:'10px 14px', border:`1px solid ${k.c}22` }}>
              <div style={{ fontSize:10, fontWeight:700, color:k.c,
                textTransform:'uppercase' }}>{k.l}</div>
              <div style={{ fontSize:20, fontWeight:800, color:k.c,
                fontFamily:'Syne,sans-serif' }}>{k.v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="fi-panel-grid">

        {/* Active Work Orders */}
        <div>
          <div style={{ marginBottom:10, display:'flex',
            alignItems:'center', justifyContent:'space-between' }}>
            <h3 style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700 }}>
              Active Work Orders
            </h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/wo')}>
              View All
            </button>
          </div>

          {loading ? (
            <div style={{ padding:30, textAlign:'center', color:'#6C757D' }}>Loading...</div>
          ) : activeWOs.length === 0 ? (
            <div style={{ padding:30, textAlign:'center', color:'#6C757D',
              background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
              No active work orders
              <button className="btn btn-p sd-bsm" style={{ display:'block', margin:'10px auto 0' }}
                onClick={() => nav('/pp/wo/new')}>+ Create WO</button>
            </div>
          ) : (
            activeWOs.slice(0,5).map(wo => {
              const ss  = woStatusStyle(wo.status)
              const pct = wo.plannedQty > 0
                ? Math.min(100, Math.round((parseFloat(wo.producedQty||0) / parseFloat(wo.plannedQty)) * 100))
                : 0
              const pclr = wo.status==='IN_PROGRESS' ? '#E67E22'
                         : wo.status==='RELEASED'    ? '#1A5276' : '#6C757D'
              const isOverdue = wo.scheduledEnd && new Date(wo.scheduledEnd) < now

              return (
                <div key={wo.id}
                  onClick={() => nav(`/pp/wo/${wo.id}`)}
                  style={{ background:'#fff', border:`1.5px solid ${isOverdue?'#DC3545':'#E0D5E0'}`,
                    borderRadius:8, padding:'10px 14px', marginBottom:10,
                    cursor:'pointer', transition:'box-shadow .2s',
                    boxShadow: isOverdue ? '0 0 0 2px #F8D7DA' : 'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'start', marginBottom:6 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:13,
                        fontFamily:'DM Mono,monospace', color:'#714B67' }}>
                        {wo.woNo}
                        {isOverdue && (
                          <span style={{ marginLeft:6, fontSize:10,
                            color:'#DC3545', fontWeight:700 }}>⚠️ OVERDUE</span>
                        )}
                      </div>
                      <div style={{ fontSize:12, fontWeight:600,
                        color:'#495057', marginTop:2 }}>
                        {wo.itemName}
                      </div>
                    </div>
                    <span style={{ padding:'3px 8px', borderRadius:8,
                      fontSize:10, fontWeight:700,
                      background:ss.bg, color:ss.c, whiteSpace:'nowrap' }}>
                      {ss.label}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:16, fontSize:11,
                    color:'#6C757D', marginBottom:8 }}>
                    <span>Qty: <strong style={{ color:'#495057' }}>
                      {fmtN(wo.plannedQty)}
                    </strong></span>
                    {wo.scheduledEnd && (
                      <span>Due: <strong style={{ color: isOverdue?'#DC3545':'#495057' }}>
                        {new Date(wo.scheduledEnd).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                      </strong></span>
                    )}
                    {wo.producedQty > 0 && (
                      <span>Done: <strong style={{ color:'#155724' }}>
                        {fmtN(wo.producedQty)}
                      </strong></span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div style={{ background:'#F0EEF0', borderRadius:3,
                    height:5, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%',
                      borderRadius:3, background:pclr,
                      transition:'width .4s' }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    fontSize:10, marginTop:3, color:'#6C757D' }}>
                    <span style={{ color:pclr, fontWeight:700 }}>{pct}% complete</span>
                    <span>Produced: {fmtN(wo.producedQty||0)} / {fmtN(wo.plannedQty)}</span>
                  </div>
                </div>
              )
            })
          )}
          {activeWOs.length > 5 && (
            <div style={{ textAlign:'center', fontSize:12, color:'#714B67',
              cursor:'pointer', marginTop:4 }}
              onClick={() => nav('/pp/wo')}>
              +{activeWOs.length-5} more WOs → View All
            </div>
          )}
        </div>

        {/* Machine Status */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3>⚙️ Machine Status</h3>
            <button className="btn btn-s sd-bsm"
              onClick={() => nav('/pp/wc-board')}>Live Board</button>
          </div>
          <div className="fi-panel-body">
            {loading ? (
              <div style={{ textAlign:'center', color:'#6C757D', padding:20 }}>Loading...</div>
            ) : wcs.length === 0 ? (
              <div style={{ textAlign:'center', color:'#6C757D', padding:20 }}>
                No machines configured
              </div>
            ) : wcs.map(wc => {
              const ws  = wcStatus(wc)
              const wo  = inProgress.find(w =>
                (w.operations||[]).some(op =>
                  op.workCenter === wc.wcId || op.workCenter === wc.name
                )
              )
              const entry = entries.find(e =>
                e.wcId === wc.wcId || e.machineName === wc.wcId
              )
              const util = entry ? Math.round(parseFloat(entry.efficiency||0)) : 0
              const uc   = util>=85?'#155724':util>=60?'#E67E22':'#6C757D'

              return (
                <div key={wc.id} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    marginBottom:4, fontSize:12 }}>
                    <span style={{ fontWeight:700 }}>{wc.wcId} — {wc.name}</span>
                    <span style={{ padding:'2px 8px', borderRadius:8,
                      fontSize:10, fontWeight:700,
                      background:ws.bg, color:ws.c }}>
                      {ws.label}
                    </span>
                  </div>
                  <div style={{ background:'#F0EEF0', borderRadius:3,
                    height:5, overflow:'hidden' }}>
                    <div style={{ width:`${util}%`, height:'100%',
                      borderRadius:3, background:uc }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    fontSize:10, marginTop:2, color:'#6C757D' }}>
                    <span>{util}% efficiency</span>
                    <span style={{ fontFamily:'DM Mono,monospace',
                      color:'#714B67', fontWeight:600 }}>
                      {wo ? wo.woNo : '—'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="fi-panel" style={{ marginTop:14 }}>
        <div className="fi-panel-hdr"><h3>⚡ Quick Actions</h3></div>
        <div className="fi-panel-body" style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[
            { l:'+ Work Order',       to:'/pp/wo/new',        cls:'btn btn-p sd-bsm' },
            { l:'Production Entry',   to:'/pp/entry',         cls:'btn btn-s sd-bsm' },
            { l:'📅 Gantt View',       to:'/pp/gantt',         cls:'btn btn-s sd-bsm' },
            { l:'🔄 MRP Run',          to:'/pp/mrp',           cls:'btn btn-s sd-bsm' },
            { l:'📊 MRP Results',      to:'/pp/mrp/results',   cls:'btn btn-s sd-bsm' },
            { l:'📐 Create BOM',       to:'/pp/bom/new',       cls:'btn btn-s sd-bsm' },
            { l:'📈 Capacity Plan',    to:'/pp/capacity',      cls:'btn btn-s sd-bsm' },
            { l:'⚙️ WC Board',         to:'/pp/wc-board',      cls:'btn btn-s sd-bsm' },
            { l:'🔩 Mould Master',     to:'/pp/mould-master',  cls:'btn btn-s sd-bsm' },
            { l:'📋 Production Report',to:'/pp/report',        cls:'btn btn-s sd-bsm' },
          ].map(a => (
            <button key={a.l} className={a.cls} onClick={() => nav(a.to)}>{a.l}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
