import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:0 })
const fmtL = n => { const v=Number(n||0); return v>=100000?'₹'+(v/100000).toFixed(1)+'L':fmtC(v) }

export default function WMDashboard() {
  const nav = useNavigate()
  const [stock,     setStock]     = useState([])
  const [movements, setMovements] = useState([])
  const [gates,     setGates]     = useState([])
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sR, mR, gR] = await Promise.all([
        fetch(`${BASE}/wm/stock`,                      { headers: hdr2() }),
        fetch(`${BASE}/wm/movement`,                   { headers: hdr2() }),
        fetch(`${BASE}/wm/gate-entry?status=Inside`,   { headers: hdr2() }).catch(() => ({ json: () => ({ data:[] }) })),
      ])
      const [sD, mD, gD] = await Promise.all([sR.json(), mR.json(), gR.json()])
      setStock(sD.data     || [])
      setMovements((mD.data || []).slice(0, 6))
      setGates(gD.data     || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── KPIs ────────────────────────────────────────────────────────
  const totalItems  = stock.length
  const stockValue  = stock.reduce((s, i) => s + parseFloat(i.value||0), 0)
  const reorderList = stock.filter(i => i.status === 'LOW' || i.status === 'ZERO')
  const criticalList= stock.filter(i => i.status === 'ZERO')
  const openGates   = gates.length

  const mvtColor = d => d==='IN'?'#155724':d==='OUT'?'#DC3545':'#714B67'
  const mvtIcon  = d => d==='IN'?'↓':d==='OUT'?'↑':'⇄'

  return (
    <div>
      {/* Header */}
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">
          WM Dashboard <small>Warehouse Overview</small>
        </div>
        <div className="wm-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>↻</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/grn/new')}>📦 GRN</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/goods-issue')}>📤 Issue</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/wm/transfer')}>⇄ Transfer</button>
        </div>
      </div>

      {/* Critical Alert */}
      {!loading && criticalList.length > 0 && (
        <div className="wm-alert danger">
          🔴 <strong>{criticalList.length} material(s)</strong> at zero stock — immediate purchase required!{' '}
          <span onClick={() => nav('/wm/reorder')}
            style={{ cursor:'pointer', textDecoration:'underline', fontWeight:700 }}>
            View Reorder Alerts →
          </span>
        </div>
      )}
      {!loading && reorderList.length > 0 && criticalList.length === 0 && (
        <div className="wm-alert warn">
          ⚠️ <strong>{reorderList.length} material(s)</strong> below reorder level.{' '}
          <span onClick={() => nav('/wm/reorder')}
            style={{ cursor:'pointer', textDecoration:'underline', fontWeight:700 }}>
            View →
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="wm-kpi-grid">
        {[
          { cls:'purple', lb:'Total SKUs',      val: loading?'...':totalItems,       sub:'Active materials' },
          { cls:'green',  lb:'Stock Value',     val: loading?'...':fmtL(stockValue), sub:'Current valuation' },
          { cls:'orange', lb:'Reorder Alerts',  val: loading?'...':reorderList.length, sub:'Below min level' },
          { cls:'red',    lb:'Vehicles Inside', val: loading?'...':openGates,        sub:'At gate right now' },
        ].map(k => (
          <div key={k.lb} className={`wm-kpi-card ${k.cls}`}>
            <div className="wm-kpi-label">{k.lb}</div>
            <div className="wm-kpi-value">{k.val}</div>
            <div className="wm-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="wm-panel-grid">
        {/* Recent Movements */}
        <div className="wm-panel">
          <div className="wm-panel-hdr">
            <h3>📋 Recent Stock Movements</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/movement')}>View All</button>
          </div>
          <div className="wm-mvt-list">
            {loading ? (
              <div style={{ padding:20, textAlign:'center', color:'#6C757D' }}>⏳ Loading...</div>
            ) : movements.length === 0 ? (
              <div style={{ padding:20, textAlign:'center', color:'#6C757D', fontSize:12 }}>
                No movements yet
              </div>
            ) : movements.map((m, i) => (
              <div key={i} className="wm-mvt-item">
                <div style={{ background: mvtColor(m.direction),
                  color:'#fff', width:28, height:28, borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:14, fontWeight:700, flexShrink:0 }}>
                  {mvtIcon(m.direction)}
                </div>
                <div className="wm-mvt-info">
                  <div className="wm-mvt-title" style={{ fontSize:12, fontWeight:700 }}>
                    {m.refNo} — {m.itemName}
                  </div>
                  <div className="wm-mvt-sub" style={{ fontSize:10, color:'#6C757D' }}>
                    {m.refType} · {m.movType} ·{' '}
                    {new Date(m.transDate||m.createdAt).toLocaleDateString('en-IN')}
                  </div>
                  {(m.fromLocation || m.toLocation) && (
                    <div style={{ fontSize:10, color:'#714B67' }}>
                      {m.fromLocation && `${m.fromLocation} → `}{m.toLocation}
                    </div>
                  )}
                </div>
                <div style={{ color: mvtColor(m.direction), fontWeight:700,
                  fontFamily:'DM Mono,monospace', fontSize:12 }}>
                  {m.direction === 'OUT' ? '-' : '+'}{parseFloat(m.qty||0).toFixed(2)}
                  {' '}{m.uom}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reorder Alerts */}
        <div className="wm-panel">
          <div className="wm-panel-hdr">
            <h3>⚠️ Reorder Alerts</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/reorder')}>View All</button>
          </div>
          <div className="wm-panel-body">
            {loading ? (
              <div style={{ padding:20, textAlign:'center', color:'#6C757D' }}>⏳</div>
            ) : reorderList.length === 0 ? (
              <div style={{ padding:20, textAlign:'center',
                color:'#155724', fontSize:12, fontWeight:700,
                background:'#D4EDDA', borderRadius:8 }}>
                ✅ All stocks above reorder level!
              </div>
            ) : reorderList.map(s => {
              const pct   = s.reorderQty > 0
                ? Math.min(100, Math.round((s.balanceQty/s.reorderQty)*100)) : 0
              const color = s.status==='ZERO' ? '#DC3545'
                          : s.status==='LOW'  ? '#856404' : '#155724'
              return (
                <div key={s.itemCode||s.itemName} className="wm-sbar-wrap">
                  <div className="wm-sbar-info">
                    <span style={{ fontSize:12, fontWeight:600 }}>
                      {s.itemName}
                    </span>
                    <span style={{ padding:'1px 6px', borderRadius:8,
                      fontSize:10, fontWeight:700,
                      background:color+'22', color }}>
                      {s.status}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:'#6C757D', marginBottom:4 }}>
                    Stock: {parseFloat(s.balanceQty||0).toFixed(2)} {s.uom} / 
                    Min: {parseFloat(s.reorderQty||0).toFixed(0)} {s.uom}
                  </div>
                  <div className="wm-sbar-bg">
                    <div className="wm-sbar-fill" style={{ width:`${pct}%`, background:color }} />
                  </div>
                </div>
              )
            })}
            {reorderList.length > 0 && (
              <button className="btn btn-s sd-bsm"
                style={{ width:'100%', marginTop:10 }}
                onClick={() => nav('/mm/po/new')}>
                🛒 Create Reorder POs
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stock Summary */}
      {!loading && stock.length > 0 && (
        <div className="wm-panel">
          <div className="wm-panel-hdr">
            <h3>📦 Stock Summary by Location</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/wm/stock')}>View Full Stock</button>
          </div>
          <div className="wm-panel-body">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {['RM-STORE','SHOP-FLOOR','FG-STORE'].map(loc => {
                // Calculate stock per location
                const locItems = stock.filter(s =>
                  s.byLocation && (s.byLocation[loc]||0) > 0
                )
                const locValue = locItems.reduce((sum, s) =>
                  sum + ((s.byLocation?.[loc]||0) * parseFloat(s.stdCost||0)), 0)
                const locLabel = loc==='RM-STORE'?'Raw Material Store'
                  :loc==='SHOP-FLOOR'?'Shop Floor':loc==='FG-STORE'?'FG Store':loc
                const locColor = loc==='RM-STORE'?'#1A5276'
                  :loc==='SHOP-FLOOR'?'#856404':'#155724'
                const locBg    = loc==='RM-STORE'?'#EBF5FB'
                  :loc==='SHOP-FLOOR'?'#FFF3CD':'#D4EDDA'
                return (
                  <div key={loc} style={{ background:locBg, borderRadius:8,
                    padding:'12px 14px', border:`1px solid ${locColor}22` }}>
                    <div style={{ fontSize:11, fontWeight:700,
                      color:locColor, marginBottom:4 }}>{locLabel}</div>
                    <div style={{ fontSize:20, fontWeight:800,
                      color:locColor, fontFamily:'Syne,sans-serif' }}>
                      {locItems.length} SKUs
                    </div>
                    <div style={{ fontSize:11, color:locColor, marginTop:2 }}>
                      {fmtL(locValue)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="wm-panel">
        <div className="wm-panel-hdr"><h3>⚡ Quick Actions</h3></div>
        <div className="wm-panel-body" style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[
            ['🚛 Gate Entry',    '/wm/gate-entry'],
            ['📦 Record GRN',    '/wm/grn/new'],
            ['📤 Goods Issue',   '/wm/goods-issue'],
            ['⇄ Transfer',       '/wm/transfer'],
            ['📊 Stock List',    '/wm/stock'],
            ['📋 Movement Log',  '/wm/movement'],
            ['⚠️ Reorder List',  '/wm/reorder'],
            ['🔢 Physical Count','/wm/physical'],
          ].map(([l,p]) => (
            <button key={l} className="btn btn-s sd-bsm" onClick={() => nav(p)}>{l}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
