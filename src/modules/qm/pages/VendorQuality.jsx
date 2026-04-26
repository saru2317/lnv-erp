import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })

const GRADE_STYLE = {
  'A+': ['#D4EDDA','#155724'],
  'A':  ['#D4EDDA','#155724'],
  'B':  ['#FFF3CD','#856404'],
  'C':  ['#F8D7DA','#721C24'],
  'D':  ['#F8D7DA','#721C24'],
}

export default function VendorQuality() {
  const [vendors,  setVendors]  = useState([])
  const [ncrs,     setNCRs]     = useState([])
  const [grns,     setGRNs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [sel,      setSel]      = useState(null)
  const [period,   setPeriod]   = useState('All Time')
  const [search,   setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rV, rN, rG] = await Promise.all([
        fetch(`${BASE_URL}/mdm/vendor`,   { headers: hdr2() }),
        fetch(`${BASE_URL}/qm/ncr`,       { headers: hdr2() }),
        fetch(`${BASE_URL}/wm/grn`,       { headers: hdr2() }),
      ])
      const [dV, dN, dG] = await Promise.all([rV.json(), rN.json(), rG.json()])
      const vendorList = dV.data || []
      const ncrList    = dN.data || []
      const grnList    = dG.data || []
      setNCRs(ncrList)
      setGRNs(grnList)

      // Build vendor quality ratings from real data
      const ratings = vendorList.map(v => {
        const vName   = v.name || v.companyName || ''
        const vNcrs   = ncrList.filter(n => n.vendorName === vName || n.vendorCode === v.code)
        const vGrns   = grnList.filter(g => g.vendorName === vName || g.vendorCode === v.code)
        const lots    = vGrns.length
        const critNcr = vNcrs.filter(n => n.severity === 'Critical').length
        const majNcr  = vNcrs.filter(n => n.severity === 'Major').length
        const minNcr  = vNcrs.filter(n => n.severity === 'Minor').length
        const totalNcr= vNcrs.length
        // Rating formula: 100 - (Critical×15 + Major×8 + Minor×3) / max(lots,1) × 100
        const deduct  = lots > 0 ? ((critNcr * 15 + majNcr * 8 + minNcr * 3) / lots) : 0
        const rating  = Math.max(0, Math.min(100, 100 - deduct)).toFixed(1)
        const grade   = parseFloat(rating) >= 95 ? 'A+' : parseFloat(rating) >= 85 ? 'A' : parseFloat(rating) >= 75 ? 'B' : parseFloat(rating) >= 60 ? 'C' : 'D'
        const pass    = Math.max(0, lots - Math.ceil(totalNcr * 0.5))

        return {
          id:       v.id,
          code:     v.code,
          name:     vName,
          material: v.vendorCategory || '—',
          lots,
          pass,
          ncrs:     totalNcr,
          critNcr,
          majNcr,
          minNcr,
          rating:   parseFloat(rating),
          grade,
          ncrDetails: vNcrs,
          grnDetails: vGrns,
        }
      }).filter(v => v.lots > 0 || v.ncrs > 0)

      // If no real data — show message but no dummy
      setVendors(ratings)
    } catch (e) { toast.error('Failed to load vendor quality data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = vendors.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.material.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.rating - b.rating)

  const selVendor = sel ? vendors.find(v => v.id === sel) : null

  // Summary stats
  const excellent = vendors.filter(v => v.rating >= 90).length
  const warning   = vendors.filter(v => v.rating >= 70 && v.rating < 90).length
  const critical  = vendors.filter(v => v.rating < 70).length
  const avgRating = vendors.length ? (vendors.reduce((a, v) => a + v.rating, 0) / vendors.length).toFixed(1) : 0

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Vendor Quality Rating <small>Supplier Performance Analysis</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder="Search vendor..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
          <select className="sd-search" value={period} onChange={e => setPeriod(e.target.value)} style={{ width: 140 }}>
            {['This Month', 'Last 3 Months', 'Last 6 Months', 'All Time'].map(p => <option key={p}>{p}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-s sd-bsm">Export</button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          ['Avg Rating',  `${avgRating}%`, '#EDE0EA', '#714B67'],
          ['Excellent (≥90)', excellent,  '#D4EDDA', '#155724'],
          ['Warning (70-90)', warning,    '#FFF3CD', '#856404'],
          ['Critical (<70)', critical,    '#F8D7DA', '#721C24'],
        ].map(([l, v, bg, c]) => (
          <div key={l} style={{ background: bg, borderRadius: 8, padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: 'DM Mono,monospace' }}>{v}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: c, opacity: .8 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 340px' : '1fr', gap: 14 }}>
        {/* Main table */}
        <div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6C757D' }}>Loading vendor quality data...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #E0D5E0', borderRadius: 8, padding: 40, textAlign: 'center', color: '#6C757D' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <div style={{ fontWeight: 700 }}>No vendor quality data yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Quality ratings are calculated automatically from GRN receipts and NCR records.</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Add GRN receipts in Warehouse → GRN module to start tracking.</div>
            </div>
          ) : (
            <table className="fi-data-table">
              <thead><tr>
                <th>Rank</th><th>Vendor</th><th>Category</th>
                <th style={{ textAlign: 'center' }}>Lots</th>
                <th style={{ textAlign: 'center' }}>Pass</th>
                <th style={{ textAlign: 'center' }}>NCRs</th>
                <th style={{ textAlign: 'center' }}>Critical</th>
                <th style={{ textAlign: 'right' }}>Rating</th>
                <th style={{ textAlign: 'center' }}>Grade</th>
                <th>Action</th>
              </tr></thead>
              <tbody>
                {filtered.map((v, i) => {
                  const [gbg, gtx] = GRADE_STYLE[v.grade] || ['#EEE', '#333']
                  const isRed = v.rating < 70
                  return (
                    <tr key={v.id} style={{ cursor: 'pointer', background: sel === v.id ? '#EDE0EA' : isRed ? '#FFF9F9' : 'inherit' }}
                      onClick={() => setSel(sel === v.id ? null : v.id)}>
                      <td style={{ fontFamily: 'DM Mono,monospace', fontWeight: 700, color: '#6C757D', textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ fontWeight: 700 }}>{v.name}</td>
                      <td style={{ fontSize: 12, color: '#6C757D' }}>{v.material}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'DM Mono,monospace', fontWeight: 700 }}>{v.lots}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'DM Mono,monospace', fontWeight: 700, color: '#155724' }}>{v.pass}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'DM Mono,monospace', fontWeight: 700, color: v.ncrs > 0 ? '#DC3545' : '#155724' }}>{v.ncrs}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'DM Mono,monospace', fontWeight: 700, color: v.critNcr > 0 ? '#DC3545' : '#6C757D' }}>{v.critNcr || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <div style={{ width: 60, height: 6, background: '#E0D5E0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${v.rating}%`, background: v.rating >= 90 ? '#28A745' : v.rating >= 70 ? '#FFC107' : '#DC3545', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontFamily: 'DM Mono,monospace', fontWeight: 700, fontSize: 13 }}>{v.rating}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ background: gbg, color: gtx, padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 800 }}>{v.grade}</span>
                      </td>
                      <td>
                        <button className="btn-xs" onClick={e => { e.stopPropagation(); setSel(sel === v.id ? null : v.id) }}>
                          {sel === v.id ? 'Close' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selVendor && (
          <div style={{ background: '#fff', border: '1px solid #E0D5E0', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#714B67,#4A3050)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontFamily: 'Syne,sans-serif', fontSize: 14 }}>{selVendor.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{selVendor.material}</div>
              </div>
              <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: 18 }}>&#x2715;</button>
            </div>
            <div style={{ padding: 14 }}>
              {/* Rating circle */}
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'DM Mono,monospace', color: selVendor.rating >= 90 ? '#28A745' : selVendor.rating >= 70 ? '#FFC107' : '#DC3545' }}>
                  {selVendor.rating}%
                </div>
                <div style={{ fontSize: 12, color: '#6C757D' }}>Quality Rating</div>
              </div>
              {/* Stats */}
              {[
                ['Total Lots Received', selVendor.lots],
                ['Lots Passed',         selVendor.pass],
                ['NCRs Raised',         selVendor.ncrs],
                ['Critical NCRs',       selVendor.critNcr],
                ['Major NCRs',          selVendor.majNcr],
                ['Minor NCRs',          selVendor.minNcr],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F0EEF0', fontSize: 12 }}>
                  <span style={{ color: '#6C757D' }}>{l}</span>
                  <strong style={{ fontFamily: 'DM Mono,monospace' }}>{v}</strong>
                </div>
              ))}
              {/* NCR list */}
              {selVendor.ncrDetails.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#714B67', marginBottom: 6, textTransform: 'uppercase' }}>Recent NCRs</div>
                  {selVendor.ncrDetails.slice(0, 5).map(n => (
                    <div key={n.id} style={{ padding: '5px 8px', borderRadius: 4, marginBottom: 4, fontSize: 11, background: n.severity === 'Critical' ? '#FFF5F5' : '#F8F9FA', border: '1px solid #E0D5E0' }}>
                      <div style={{ fontWeight: 700, color: '#714B67', fontFamily: 'DM Mono,monospace' }}>{n.ncrNo}</div>
                      <div style={{ color: '#333' }}>{n.description?.slice(0, 60)}...</div>
                      <div style={{ color: n.severity === 'Critical' ? '#DC3545' : n.severity === 'Major' ? '#856404' : '#6C757D', fontWeight: 700 }}>{n.severity}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
