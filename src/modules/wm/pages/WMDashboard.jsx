import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:0})
const fmtL = n => { const v=Number(n||0); return v>=100000?'₹'+(v/100000).toFixed(1)+'L':fmtC(v) }

export default function WMDashboard() {
  const nav = useNavigate()
  const [stats,    setStats]   = useState({})
  const [movements,setMovements]= useState([])
  const [reorder,  setReorder] = useState([])
  const [loading,  setLoading] = useState(true)

  useEffect(()=>{
    const h = { headers:{ Authorization:`Bearer ${getToken()}` } }
    Promise.all([
      fetch(`${BASE_URL}/wm/dashboard`, h).then(r=>r.json()),
      fetch(`${BASE_URL}/wm/movements?`, h).then(r=>r.json()),
      fetch(`${BASE_URL}/wm/reorder`, h).then(r=>r.json()),
    ]).then(([d,m,r])=>{
      setStats(d)
      setMovements((m.data||[]).slice(0,5))
      setReorder((r.data||[]).slice(0,4))
    }).catch(()=>{})
    .finally(()=>setLoading(false))
  },[])

  const mvtColor = t => t==='IN'?'#155724':t==='OUT'?'#DC3545':'#714B67'
  const mvtIcon  = t => t==='IN'?'↓':t==='OUT'?'↑':t==='TRANSFER'?'⇄':'~'

  return (
    <div>
      <div className="wm-lv-hdr">
        <div className="wm-lv-title">
          WM Dashboard <small>Warehouse Overview</small>
        </div>
        <div className="wm-lv-actions">
          <button className="btn btn-s sd-bsm"
            onClick={()=>nav('/wm/grn/new')}>
            📦 GRN
          </button>
          <button className="btn btn-s sd-bsm"
            onClick={()=>nav('/wm/goods-issue')}>
            📤 Issue
          </button>
          <button className="btn btn-p sd-bsm"
            onClick={()=>nav('/wm/transfer')}>
            ⇄ Transfer
          </button>
        </div>
      </div>

      {(reorder.filter(r=>r.status==='CRITICAL'||r.status==='ZERO')).length>0 && (
        <div className="wm-alert danger">
          🔴 <strong>
            {reorder.filter(r=>['CRITICAL','ZERO'].includes(r.status)).length} materials
          </strong> are below critical level — immediate purchase required!{' '}
          <span onClick={()=>nav('/wm/reorder')}
            style={{ cursor:'pointer', textDecoration:'underline',
              fontWeight:700 }}>
            View Reorder Alerts →
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="wm-kpi-grid">
        {[
          { cls:'purple', lb:'Total Items',
            val: loading?'...' : stats.totalItems||0,
            sub:'Active materials' },
          { cls:'green',  lb:'Stock Value',
            val: loading?'...' : fmtL(stats.stockValue||0),
            sub:'Current valuation' },
          { cls:'orange', lb:'Reorder Alerts',
            val: loading?'...' : reorder.length,
            sub:'Below min level' },
          { cls:'red',    lb:'Vehicles Inside',
            val: loading?'...' : stats.openGates||0,
            sub:'At gate right now' },
        ].map(k=>(
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
            <button className="btn btn-s sd-bsm"
              onClick={()=>nav('/wm/movement')}>
              View All
            </button>
          </div>
          <div className="wm-mvt-list">
            {loading ? (
              <div style={{ padding:20, textAlign:'center',
                color:'#6C757D' }}>⏳ Loading...</div>
            ) : movements.length===0 ? (
              <div style={{ padding:20, textAlign:'center',
                color:'#6C757D', fontSize:12 }}>
                No movements yet
              </div>
            ) : movements.map((m,i)=>(
              <div key={i} className="wm-mvt-item">
                <div className="wm-mvt-dot"
                  style={{ background:mvtColor(m.movement),
                    color:'#fff', width:28, height:28,
                    borderRadius:'50%', display:'flex',
                    alignItems:'center', justifyContent:'center',
                    fontSize:14, fontWeight:700,
                    flexShrink:0 }}>
                  {mvtIcon(m.movement)}
                </div>
                <div className="wm-mvt-info">
                  <div className="wm-mvt-title">
                    {m.refNo} — {m.item?.itemName}
                  </div>
                  <div className="wm-mvt-sub">
                    {m.refType} ·{' '}
                    {new Date(m.date||m.createdAt)
                      .toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div className="wm-mvt-qty"
                  style={{ color:mvtColor(m.movement),
                    fontWeight:700,
                    fontFamily:'DM Mono,monospace' }}>
                  {m.movement==='OUT'?'-':'+'}
                  {parseFloat(m.qtyIn||0)+parseFloat(m.qtyOut||0)}
                  {' '}{m.item?.uom||''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reorder Alerts */}
        <div className="wm-panel">
          <div className="wm-panel-hdr">
            <h3>⚠️ Reorder Alerts</h3>
            <button className="btn btn-s sd-bsm"
              onClick={()=>nav('/wm/reorder')}>
              View All
            </button>
          </div>
          <div className="wm-panel-body">
            {loading ? (
              <div style={{ padding:20, textAlign:'center',
                color:'#6C757D' }}>⏳</div>
            ) : reorder.length===0 ? (
              <div style={{ padding:20, textAlign:'center',
                color:'#155724', fontSize:12 }}>
                ✅ All stocks above reorder level!
              </div>
            ) : reorder.map(s=>{
              const pct = s.reorderQty>0
                ? Math.min(100,Math.round(
                    s.currentQty/s.reorderQty*100))
                : 0
              const color = s.status==='CRITICAL'||s.status==='ZERO'
                ?'#DC3545':s.status==='LOW'?'#856404':'#155724'
              return (
                <div key={s.itemCode}
                  className="wm-sbar-wrap">
                  <div className="wm-sbar-info">
                    <span style={{ fontSize:12,
                      fontWeight:600 }}>
                      {s.itemName}
                    </span>
                    <span style={{ padding:'1px 6px',
                      borderRadius:8, fontSize:10,
                      fontWeight:700,
                      background:color+'22', color }}>
                      {s.status}
                    </span>
                  </div>
                  <div style={{ fontSize:11,
                    color:'#6C757D', marginBottom:4 }}>
                    {s.currentQty} {s.uom} / Min: {s.reorderQty} {s.uom}
                  </div>
                  <div className="wm-sbar-bg">
                    <div className="wm-sbar-fill"
                      style={{ width:`${pct}%`,
                        background:color }}>
                    </div>
                  </div>
                </div>
              )
            })}
            {reorder.length>0 && (
              <button className="btn btn-s sd-bsm"
                style={{ width:'100%', marginTop:10 }}
                onClick={()=>nav('/mm/po/new')}>
                🛒 Create Reorder POs
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="wm-panel">
        <div className="wm-panel-hdr">
          <h3>⚡ Quick Actions</h3>
        </div>
        <div className="wm-panel-body"
          style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[
            ['🚛 Gate Entry',   '/wm/gate-entry'],
            ['📦 Record GRN',   '/wm/grn/new'],
            ['📤 Goods Issue',  '/wm/goods-issue'],
            ['⇄ Transfer',      '/wm/transfer'],
            ['📊 Stock List',   '/wm/stock'],
            ['🔢 Physical Count','/wm/physical'],
            ['⚠️ Reorder List', '/wm/reorder'],
            ['📋 Movement Log', '/wm/movement'],
          ].map(([l,p])=>(
            <button key={l} className="btn btn-s sd-bsm"
              onClick={()=>nav(p)}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
