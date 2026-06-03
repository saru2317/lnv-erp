import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${tok()}` })

export default function QMDashboard() {
  const nav = useNavigate()
  const [lots,    setLots]    = useState([])
  const [ncrs,    setNCRs]    = useState([])
  const [capas,   setCAPAs]   = useState([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const monthLabel = now.toLocaleString('en-IN', { month:'long', year:'numeric' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rL, rN, rC] = await Promise.all([
        fetch(`${BASE}/qm/inspection`, { headers: hdr2() }),
        fetch(`${BASE}/qm/ncr`,        { headers: hdr2() }),
        fetch(`${BASE}/qm/capa`,       { headers: hdr2() }),
      ])
      const [dL, dN, dC] = await Promise.all([rL.json(), rN.json(), rC.json()])
      setLots(dL.data  || [])
      setNCRs(dN.data  || [])
      setCAPAs(dC.data || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── KPIs ────────────────────────────────────────────────────────
  const totalLots  = lots.length
  const passLots   = lots.filter(l => l.result === 'PASS').length
  const passRate   = totalLots > 0 ? ((passLots/totalLots)*100).toFixed(1) : 0
  const totalRej   = lots.reduce((s,l) => s + parseFloat(l.failQty||0), 0)
  const openNCRs   = ncrs.filter(n => n.status === 'OPEN' || n.status === 'WIP').length
  const openCAPAs  = capas.filter(c => c.status !== 'CLOSED' && c.status !== 'Closed').length

  // Product-wise yield
  const productMap = {}
  lots.forEach(l => {
    const key = l.itemName || 'Unknown'
    if (!productMap[key]) productMap[key] = { prod:key, lots:0, pass:0, qty:0 }
    productMap[key].lots++
    productMap[key].qty  += parseFloat(l.lotQty||0)
    productMap[key].pass += parseFloat(l.passQty||0)
  })
  const productYields = Object.values(productMap)
    .map(p => ({ ...p, yield: p.qty>0 ? ((p.pass/p.qty)*100).toFixed(1) : 100 }))
    .sort((a,b) => b.lots - a.lots).slice(0, 4)

  const recentLots = [...lots].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,5)
  const openNCRList = ncrs.filter(n => n.status==='OPEN'||n.status==='WIP').slice(0,3)

  const yc = y => parseFloat(y)>=98 ? '#155724' : parseFloat(y)>=95 ? '#856404' : '#DC3545'
  const yb = y => parseFloat(y)>=98 ? 'var(--odoo-green)' : parseFloat(y)>=95 ? 'var(--odoo-orange)' : 'var(--odoo-red)'
  const rb = r => r==='PASS'?'badge-pass':r==='FAIL'?'badge-fail':'badge-review'
  const sl = r => r==='PASS'?' Pass':r==='FAIL'?' Fail':' Review'
  const sc = s => s==='Critical'?'#F5B7B1':s==='Major'?'#FAD7A0':'#E9ECEF'
  const sb = s => s==='Critical'?'#FFF5F5':s==='Major'?'#FFFBF0':'#F8F9FA'

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          QM Dashboard <small>Quality Overview · {monthLabel}</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>↻</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/report')}>Quality Report</button>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/inspection/new')}>+ New Inspection</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="qm-kpi-grid">
        {[
          { cls:'green',  l:'Overall Pass Rate',   v: loading?'...': `${passRate}%`,
            s: `${totalLots} lots inspected` },
          { cls:'red',    l:'Total Rejections',    v: loading?'...': totalRej.toFixed(0),
            s: totalLots>0 ? `${((totalRej/(lots.reduce((s,l)=>s+parseFloat(l.lotQty||0),0)||1))*100).toFixed(2)}% rejection rate` : '—' },
          { cls:'orange', l:'Open NCRs',           v: loading?'...': openNCRs,
            s: 'Pending closure' },
          { cls:'blue',   l:'Open CAPAs',          v: loading?'...': openCAPAs,
            s: 'Action pending' },
        ].map(k => (
          <div key={k.l} className={`qm-kpi-card ${k.cls}`}>
            <div className="qm-kpi-label">{k.l}</div>
            <div className="qm-kpi-value">{k.v}</div>
            <div className="qm-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="fi-panel-grid">
        {/* Recent Inspections */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3>Recent Inspection Lots</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/inspection')}>View All</button>
          </div>
          <div style={{ padding:0 }}>
            {loading ? (
              <div style={{ padding:30, textAlign:'center', color:'#6C757D' }}>Loading...</div>
            ) : recentLots.length === 0 ? (
              <div style={{ padding:30, textAlign:'center', color:'#6C757D' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>🔬</div>
                No inspection lots yet
                <button className="btn btn-p sd-bsm"
                  style={{ display:'block', margin:'10px auto 0' }}
                  onClick={() => nav('/qm/inspection/new')}>
                  + New Inspection
                </button>
              </div>
            ) : (
              <table className="fi-data-table" style={{ margin:0 }}>
                <thead>
                  <tr>
                    <th>Lot No.</th><th>Material</th><th>Yield %</th>
                    <th>NCR</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLots.map(l => {
                    const yld = parseFloat(l.yieldPct || (l.lotQty>0?(l.passQty/l.lotQty*100):0) || 0)
                    return (
                      <tr key={l.id} style={{ cursor:'pointer' }}
                        onClick={() => nav(`/qm/inspection/${l.id}`)}>
                        <td>
                          <strong style={{ fontFamily:'DM Mono,monospace', fontSize:12,
                            color:'var(--odoo-purple)' }}>{l.lotNo}</strong>
                          <div style={{ fontSize:10, color:'var(--odoo-gray)' }}>
                            {new Date(l.inspDate||l.createdAt).toLocaleDateString('en-IN')} · {parseFloat(l.lotQty||0)} {l.unit}
                          </div>
                        </td>
                        <td style={{ fontSize:12 }}>{l.itemName}</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div className="yield-bar" style={{ width:60 }}>
                              <div className="yield-fill" style={{ width:`${yld}%`, background:yb(yld) }} />
                            </div>
                            <span style={{ fontSize:11, fontWeight:700, color:yb(yld) }}>
                              {yld.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td style={{ fontFamily:'DM Mono,monospace', fontSize:11,
                          color: l.ncrNo ? 'var(--odoo-red)' : 'var(--odoo-gray)',
                          fontWeight: l.ncrNo ? 700 : 400 }}>
                          {l.ncrNo || '—'}
                        </td>
                        <td><span className={`badge ${rb(l.result)}`}>{sl(l.result)}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Open NCRs */}
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3>Open NCRs</h3>
            <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/ncr')}>View All</button>
          </div>
          <div className="fi-panel-body">
            {loading ? (
              <div style={{ textAlign:'center', color:'#6C757D', padding:20 }}>Loading...</div>
            ) : openNCRList.length === 0 ? (
              <div style={{ textAlign:'center', color:'#155724', padding:20,
                background:'#D4EDDA', borderRadius:8, fontSize:12, fontWeight:700 }}>
                ✅ No open NCRs — All clear!
              </div>
            ) : (
              openNCRList.map(n => (
                <div key={n.id}
                  style={{ padding:10, borderRadius:6, marginBottom:8,
                    background:sb(n.severity), border:`1px solid ${sc(n.severity)}`,
                    cursor:'pointer' }}
                  onClick={() => nav(`/qm/ncr/${n.id}`)}>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:4 }}>
                    <strong style={{ fontFamily:'DM Mono,monospace', fontSize:12,
                      color:'var(--odoo-purple)' }}>{n.ncrNo}</strong>
                    <span className={`badge ${n.severity==='Critical'?'badge-critical':n.severity==='Major'?'badge-open':'badge-wip'}`}>
                      {n.severity}
                    </span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600 }}>{n.itemName}</div>
                  <div style={{ fontSize:11, color:'var(--odoo-gray)', marginTop:2 }}>{n.description?.slice(0,60)}</div>
                  <div style={{ fontSize:10, color:'var(--odoo-gray)', marginTop:3 }}>
                    Raised: {new Date(n.date||n.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
              ))
            )}
            <button className="btn btn-p sd-bsm"
              style={{ width:'100%', marginTop:4 }}
              onClick={() => nav('/qm/ncr/new')}>
              + Raise New NCR
            </button>
          </div>
        </div>
      </div>

      {/* Product Yield */}
      {productYields.length > 0 && (
        <div className="fi-panel">
          <div className="fi-panel-hdr">
            <h3>Yield by Product</h3>
          </div>
          <div className="fi-panel-body">
            <div style={{ display:'grid',
              gridTemplateColumns:`repeat(${Math.min(productYields.length,4)},1fr)`,
              gap:14 }}>
              {productYields.map(p => (
                <div key={p.prod} style={{ background:'#F8F9FA', borderRadius:8,
                  padding:14, textAlign:'center' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#333',
                    marginBottom:8 }}>{p.prod}</div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:24,
                    fontWeight:800, color:yc(p.yield) }}>{p.yield}%</div>
                  <div className="yield-bar" style={{ margin:'8px 0 4px' }}>
                    <div className="yield-fill"
                      style={{ width:`${p.yield}%`, background:yb(p.yield) }} />
                  </div>
                  <div style={{ fontSize:11, color:'var(--odoo-gray)' }}>
                    {p.lots} lots · {parseFloat(p.qty).toFixed(0)} {lots.find(l=>l.itemName===p.prod)?.unit||'Nos'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="fi-panel">
        <div className="fi-panel-hdr"><h3>Quick Actions</h3></div>
        <div className="fi-panel-body" style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button className="btn btn-p sd-bsm" onClick={() => nav('/qm/inspection/new')}>+ New Inspection</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/ncr/new')}>Raise NCR</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/capa/new')}>New CAPA</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/plan')}>Quality Plans</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/vendor')}>Vendor Rating</button>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/report')}>Quality Report</button>
        </div>
      </div>
    </div>
  )
}
