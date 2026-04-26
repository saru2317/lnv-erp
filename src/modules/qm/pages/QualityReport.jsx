import React, { useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function QualityReport() {
  const [lots,    setLots]    = useState([])
  const [ncrs,    setNCRs]    = useState([])
  const [capas,   setCAPAs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [period,  setPeriod]  = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rL, rN, rC] = await Promise.all([
        fetch(`${BASE_URL}/qm/inspection`, { headers: hdr2() }),
        fetch(`${BASE_URL}/qm/ncr`,        { headers: hdr2() }),
        fetch(`${BASE_URL}/qm/capa`,       { headers: hdr2() }),
      ])
      const [dL, dN, dC] = await Promise.all([rL.json(), rN.json(), rC.json()])
      setLots(dL.data  || [])
      setNCRs(dN.data  || [])
      setCAPAs(dC.data || [])
    } catch { toast.error('Failed to load quality report') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  // Filter by period
  const filterByPeriod = items => {
    if (period === 'All') return items
    const now = new Date()
    const cutoff = new Date()
    if (period === 'This Month') { cutoff.setDate(1); cutoff.setHours(0,0,0,0) }
    else if (period === 'Last 3 Months') cutoff.setMonth(now.getMonth() - 3)
    else if (period === 'Last 6 Months') cutoff.setMonth(now.getMonth() - 6)
    return items.filter(i => new Date(i.createdAt || i.inspDate || i.date) >= cutoff)
  }

  const filtLots = filterByPeriod(lots)
  const filtNcrs = filterByPeriod(ncrs)

  // Product-wise summary
  const productSummary = useMemo(() => {
    const map = {}
    filtLots.forEach(l => {
      const key = l.itemName || 'Unknown'
      if (!map[key]) map[key] = { prod:key, lots:0, qty:0, pass:0, fail:0, ncrs:0, certs:0 }
      map[key].lots++
      map[key].qty    += parseFloat(l.lotQty || 0)
      map[key].pass   += parseFloat(l.passQty || 0)
      map[key].fail   += parseFloat(l.failQty || 0)
      if (l.result === 'PASS') map[key].certs++
    })
    filtNcrs.forEach(n => {
      const key = n.itemName || 'Unknown'
      if (map[key]) map[key].ncrs++
    })
    return Object.values(map).map(r => ({
      ...r,
      yield: r.qty > 0 ? ((r.pass / r.qty) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.lots - a.lots)
  }, [filtLots, filtNcrs])

  // Defect type from NCRs
  const defectSummary = useMemo(() => {
    const map = {}
    filtNcrs.forEach(n => {
      // Extract defect type from description
      const key = n.description?.split(' ')[0]?.slice(0, 20) || 'Other'
      if (!map[key]) map[key] = { type: key, cnt: 0 }
      map[key].cnt++
    })
    const total = Object.values(map).reduce((a, v) => a + v.cnt, 0)
    return Object.values(map)
      .map(d => ({ ...d, pct: total > 0 ? Math.round((d.cnt / total) * 100) : 0 }))
      .sort((a, b) => b.cnt - a.cnt)
      .slice(0, 6)
  }, [filtNcrs])

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const map = {}
    filtLots.forEach(l => {
      const m = new Date(l.inspDate || l.createdAt).getMonth()
      const k = MONTHS[m].slice(0, 3)
      if (!map[k]) map[k] = { month: k, lots: 0, pass: 0, ncrs: 0 }
      map[k].lots++
      if (l.result === 'PASS') map[k].pass++
    })
    filtNcrs.forEach(n => {
      const m = new Date(n.date || n.createdAt).getMonth()
      const k = MONTHS[m].slice(0, 3)
      if (map[k]) map[k].ncrs++
    })
    return Object.values(map)
  }, [filtLots, filtNcrs])

  // Overall KPIs
  const totalLots  = filtLots.length
  const totalPass  = filtLots.filter(l => l.result === 'PASS').length
  const totalFail  = filtLots.filter(l => l.result === 'FAIL').length
  const totalNcrs  = filtNcrs.length
  const overallYield = totalLots > 0 ? ((totalPass / totalLots) * 100).toFixed(1) : 0
  const openCapas  = capas.filter(c => c.status !== 'Closed').length

  const COLORS = ['var(--odoo-red)','var(--odoo-orange)','var(--odoo-blue)','var(--odoo-purple)','#28A745','#6C757D']

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Quality Report <small>QM Analytics &amp; Summary</small></div>
        <div className="fi-lv-actions">
          <select className="sd-search" value={period} onChange={e => setPeriod(e.target.value)} style={{ width: 160 }}>
            {['This Month','Last 3 Months','Last 6 Months','All'].map(p => <option key={p}>{p}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm">Export PDF</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6C757D' }}>Loading quality data...</div>
      ) : (
        <>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              ['Insp. Lots',  totalLots,      '#EDE0EA','#714B67'],
              ['Passed',      totalPass,      '#D4EDDA','#155724'],
              ['Failed',      totalFail,      '#F8D7DA','#721C24'],
              ['Overall Yield',`${overallYield}%`,'#D1ECF1','#0C5460'],
              ['NCRs Raised', totalNcrs,      '#FFF3CD','#856404'],
              ['Open CAPAs',  openCapas,      '#F8D7DA','#721C24'],
            ].map(([l, v, bg, c]) => (
              <div key={l} style={{ background: bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: c, fontFamily: 'DM Mono,monospace' }}>{v}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: c, opacity: .8 }}>{l}</div>
              </div>
            ))}
          </div>

          {totalLots === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #E0D5E0', borderRadius: 8, padding: 60, textAlign: 'center', color: '#6C757D' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>No quality data for selected period</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Create inspection lots in Inspection Register to see reports here.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

              {/* Product summary table */}
              <div style={{ border: '1px solid #E0D5E0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg,#714B67,#4A3050)', padding: '8px 14px' }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'Syne,sans-serif' }}>Product-wise Summary</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F8F4F8', borderBottom: '2px solid #E0D5E0' }}>
                      {['Product','Lots','Qty','Pass%','NCRs','Certs'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', fontSize: 10, fontWeight: 700, color: '#6C757D', textAlign: h==='Product'?'left':'center', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productSummary.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F0EEF0' }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{r.prod}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontFamily: 'DM Mono,monospace', fontWeight: 700 }}>{r.lots}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontFamily: 'DM Mono,monospace' }}>{r.qty.toFixed(0)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: parseFloat(r.yield) >= 98 ? '#155724' : parseFloat(r.yield) >= 90 ? '#856404' : '#DC3545' }}>{r.yield}%</span>
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontFamily: 'DM Mono,monospace', color: r.ncrs > 0 ? '#DC3545' : '#155724', fontWeight: 700 }}>{r.ncrs}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', fontFamily: 'DM Mono,monospace', color: '#714B67', fontWeight: 700 }}>{r.certs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Defect analysis */}
              <div style={{ border: '1px solid #E0D5E0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg,#714B67,#4A3050)', padding: '8px 14px' }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'Syne,sans-serif' }}>Defect Analysis — Top Issues</span>
                </div>
                <div style={{ padding: 14 }}>
                  {defectSummary.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', padding: 30, fontSize: 12 }}>No NCR defect data</div>
                  ) : defectSummary.map((d, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{d.type}</span>
                        <span style={{ fontFamily: 'DM Mono,monospace', fontWeight: 700, color: COLORS[i] }}>{d.cnt} ({d.pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: '#E0D5E0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${d.pct}%`, background: COLORS[i], borderRadius: 4, transition: 'width .5s' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Monthly trend */}
          {monthlyTrend.length > 0 && (
            <div style={{ border: '1px solid #E0D5E0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,#714B67,#4A3050)', padding: '8px 14px' }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'Syne,sans-serif' }}>Monthly Trend</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8F4F8', borderBottom: '2px solid #E0D5E0' }}>
                    {['Month','Lots Inspected','Passed','NCRs Raised','Pass Rate'].map(h => (
                      <th key={h} style={{ padding: '7px 14px', fontSize: 10, fontWeight: 700, color: '#6C757D', textAlign: 'center', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyTrend.map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F0EEF0' }}>
                      <td style={{ padding: '8px 14px', fontWeight: 700, textAlign: 'center' }}>{m.month}</td>
                      <td style={{ padding: '8px 14px', textAlign: 'center', fontFamily: 'DM Mono,monospace', fontWeight: 700 }}>{m.lots}</td>
                      <td style={{ padding: '8px 14px', textAlign: 'center', fontFamily: 'DM Mono,monospace', color: '#155724', fontWeight: 700 }}>{m.pass}</td>
                      <td style={{ padding: '8px 14px', textAlign: 'center', fontFamily: 'DM Mono,monospace', color: m.ncrs > 0 ? '#DC3545' : '#155724', fontWeight: 700 }}>{m.ncrs}</td>
                      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: m.lots > 0 && (m.pass/m.lots)*100 >= 95 ? '#155724' : '#856404' }}>
                          {m.lots > 0 ? ((m.pass/m.lots)*100).toFixed(1) : 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
