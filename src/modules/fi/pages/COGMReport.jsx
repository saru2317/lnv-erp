import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr2 = () => ({ Authorization: `Bearer ${tok()}` })
const fmtC = n  => '₹' + Number(n||0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })
const fmtQ = (n,u) => `${Number(n||0).toLocaleString('en-IN', { maximumFractionDigits:3 })} ${u||''}`
const fmtD = s  => s ? new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'
const pct  = (a,b) => b > 0 ? ((a/b)*100).toFixed(1)+'%' : '—'

export default function COGMReport() {
  const [wos,     setWOs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [sel,     setSel]     = useState(null)
  const [selDetail, setSelDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const today  = new Date().toISOString().split('T')[0]
  const first  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(first)
  const [dateTo,   setDateTo]   = useState(today)
  const [search,   setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(
        `${BASE}/pp/wo?status=COMPLETED,CLOSED`,
        { headers: hdr2() }
      )
      const data = await res.json()
      setWOs(data.data || [])
    } catch {
      toast.error('Failed to load Work Orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Load WO detail for drill-down
  const loadDetail = async (wo) => {
    setSel(wo)
    setLoadingDetail(true)
    setSelDetail(null)
    try {
      const res  = await fetch(`${BASE}/pp/wo/${wo.id}`, { headers: hdr2() })
      const data = await res.json()
      setSelDetail(data.data || null)
    } catch {
      toast.error('Failed to load WO detail')
    } finally {
      setLoadingDetail(false)
    }
  }

  // Filter by date range
  const filtered = wos.filter(w => {
    const dt   = new Date(w.actualEnd || w.completedAt || w.updatedAt || w.createdAt)
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null
    const to   = dateTo   ? new Date(dateTo   + 'T23:59:59') : null
    const matchDate = (!from || dt >= from) && (!to || dt <= to)
    const matchSrch = !search ||
      w.woNo?.toLowerCase().includes(search.toLowerCase()) ||
      w.itemName?.toLowerCase().includes(search.toLowerCase())
    return matchDate && matchSrch
  })

  // Cost calculations from WO data — uses actual schema fields
  const calcCosts = (w) => {
    const matIssues  = w.materialIssues || []
    const operations = w.operations     || []
    const produced   = parseFloat(w.producedQty || 0)

    // Material cost: sum from material issues (totalCost field)
    const matCost = matIssues.reduce((s, m) =>
      s + parseFloat(m.totalCost || (parseFloat(m.issuedQty||0) * parseFloat(m.unitCost||0)) || 0), 0)
      || parseFloat(w.actualRMCost || 0)

    // MHR cost from operations (runTime in mins × mhr rate)
    const mhrCost = operations.reduce((s, op) => {
      const hrs = parseFloat(op.runTime || 0) / 60
      return s + hrs * parseFloat(op.mhr || op.mhrRate || 0)
    }, 0) || parseFloat(w.labourCost || 0)

    const overhead     = parseFloat(w.overheadCost || 0)
    const totalActual  = parseFloat(w.totalCost || 0) || (matCost + mhrCost + overhead)
    const totalPlanned = parseFloat(w.plannedRMCost || 0)
    const unitCost     = produced > 0 ? totalActual / produced : 0
    const variance     = totalActual - totalPlanned

    return { matCost, mhrCost, overhead, totalActual, totalPlanned, unitCost, variance }
  }

  // Totals across all filtered WOs
  const totals = filtered.reduce((acc, w) => {
    const c = calcCosts(w)
    return {
      matCost:     acc.matCost     + c.matCost,
      mhrCost:     acc.mhrCost     + c.mhrCost,
      totalActual: acc.totalActual + c.totalActual,
      totalPlanned:acc.totalPlanned+ c.totalPlanned,
      produced:    acc.produced    + parseFloat(w.producedQty || 0),
    }
  }, { matCost:0, mhrCost:0, totalActual:0, totalPlanned:0, produced:0 })

  // Export to Excel
  const exportExcel = () => {
    const rows = [
      ['WO No.','Product','Status','Planned Qty','Produced Qty','UOM',
       'Material Cost','MHR Cost','Total COGM','Unit Cost','Planned Cost','Variance'],
      ...filtered.map(w => {
        const c = calcCosts(w)
        return [
          w.woNo, w.itemName, w.status,
          w.plannedQty, w.producedQty, w.uom,
          c.matCost, c.mhrCost, c.totalActual,
          c.unitCost.toFixed(2), c.totalPlanned,
          c.variance
        ]
      }),
      [], // blank row
      ['','','TOTAL','','',
       '',totals.matCost,'',totals.totalActual,'',totals.totalPlanned,
       totals.totalActual - totals.totalPlanned]
    ]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch:14 },{ wch:30 },{ wch:12 },{ wch:12 },{ wch:12 },
      { wch:8 },{ wch:16 },{ wch:14 },{ wch:16 },{ wch:14 },{ wch:16 },{ wch:14 }]
    XLSX.utils.book_append_sheet(wb, ws, 'COGM Report')
    XLSX.writeFile(wb, `COGM_Report_${dateFrom}_to_${dateTo}.xlsx`)
    toast.success('Exported!')
  }

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          COGM Report
          <small>Cost of Goods Manufactured · from PP Work Orders</small>
        </div>
        <div className="fi-lv-actions">
          <input type="date" className="fi-filter-select"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)} />
          <input type="date" className="fi-filter-select"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)} />
          <button className="btn btn-s sd-bsm" onClick={load}>↻</button>
          <button className="btn btn-s sd-bsm" onClick={exportExcel}>⬇️ Export</button>
          <button className="btn btn-p sd-bsm" onClick={async () => {
            if (!window.confirm('Backfill COGM JVs for all completed WOs? This posts auto-journals for WOs that were completed before this feature was added.')) return
            try {
              toast.loading('Processing...', { id:'cogm-bf' })
              const r = await fetch(`${BASE}/pp/wo/backfill-cogm`, {
                method:'POST', headers:{ ...hdr2(), 'Content-Type':'application/json' }
              })
              const d = await r.json()
              toast.dismiss('cogm-bf')
              if (d.error) { toast.error(d.error); return }
              toast.success(d.message)
              load()
            } catch(e) { toast.dismiss('cogm-bf'); toast.error(e.message) }
          }}>⚙️ Recalculate All</button>
        </div>
      </div>

      {/* Info banner */}
      <div className="fi-alert info">
        ℹ COGM data auto-captured from PP Work Orders. Each closed WO posts a JE to
        <strong> 5001 · COGM — Manufacturing Cost</strong>.
        Variance posted to <strong>5011 · Production Variance</strong>.
      </div>

      {/* KPI Cards */}
      <div className="fi-kpi-grid">
        {[
          { cls:'purple', l:'Total COGM',         v: fmtC(totals.totalActual),  s:`${filtered.length} work orders` },
          { cls:'orange', l:'Direct Material',     v: fmtC(totals.matCost),      s: pct(totals.matCost, totals.totalActual) + ' of COGM' },
          { cls:'blue',   l:'Machine Hours (MHR)', v: fmtC(totals.mhrCost),      s: pct(totals.mhrCost, totals.totalActual) + ' of COGM' },
          { cls:'green',  l:'Planned vs Actual',   v: fmtC(Math.abs(totals.totalActual - totals.totalPlanned)),
            s: (totals.totalActual - totals.totalPlanned) > 0 ? '▲ Over budget' : '▼ Under budget' },
        ].map(k => (
          <div key={k.l} className={`fi-kpi-card ${k.cls}`}>
            <div className="fi-kpi-label">{k.l}</div>
            <div className="fi-kpi-value">{k.v}</div>
            <div className="fi-kpi-sub">{k.s}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom:10 }}>
        <input className="fi-search"
          placeholder="Search WO No., product..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width:280 }} />
      </div>

      {/* Table */}
      <table className="fi-data-table">
        <thead>
          <tr>
            <th>Work Order</th>
            <th>Product</th>
            <th style={{ textAlign:'right' }}>Produced</th>
            <th style={{ textAlign:'right' }}>Material Cost</th>
            <th style={{ textAlign:'right' }}>MHR Cost</th>
            <th style={{ textAlign:'right' }}>Total COGM</th>
            <th style={{ textAlign:'right' }}>Unit Cost</th>
            <th style={{ textAlign:'right' }}>Variance</th>
            <th>Closed</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={11} style={{ padding:30, textAlign:'center', color:'#6C757D' }}>
              Loading...
            </td></tr>
          ) : filtered.length === 0 ? (
            <tr><td colSpan={11} style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📊</div>
              No completed work orders found for selected period.
            </td></tr>
          ) : filtered.map(w => {
            const c   = calcCosts(w)
            const over = c.variance > 0
            return (
              <tr key={w.id}
                style={{ cursor:'pointer' }}
                onClick={() => loadDetail(w)}>
                <td>
                  <strong style={{ fontFamily:'DM Mono,monospace',
                    fontSize:12, color:'var(--odoo-purple)' }}>
                    {w.woNo}
                  </strong>
                </td>
                <td>
                  <strong style={{ fontSize:12 }}>{w.itemName}</strong>
                  {w.itemCode && (
                    <div style={{ fontSize:10, color:'#6C757D',
                      fontFamily:'DM Mono,monospace' }}>
                      {w.itemCode}
                    </div>
                  )}
                </td>
                <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                  fontSize:12 }}>
                  {fmtQ(w.producedQty, w.uom)}
                </td>
                <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                  fontSize:12 }}>
                  {fmtC(c.matCost)}
                </td>
                <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                  fontSize:12, color:'var(--odoo-blue)' }}>
                  {fmtC(c.mhrCost)}
                </td>
                <td style={{ textAlign:'right', fontWeight:700,
                  fontFamily:'Syne,sans-serif',
                  color:'var(--odoo-purple)' }}>
                  {fmtC(c.totalActual)}
                </td>
                <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace',
                  fontSize:12, color:'var(--odoo-green)' }}>
                  {c.unitCost > 0 ? fmtC(c.unitCost) + `/${w.uom||'Nos'}` : '—'}
                </td>
                <td style={{ textAlign:'right', fontWeight:700,
                  color: over ? '#DC3545' : '#155724' }}>
                  {c.variance !== 0
                    ? `${over?'+':''}${fmtC(Math.abs(c.variance))}`
                    : '—'}
                </td>
                <td style={{ fontSize:11, color:'#6C757D' }}>
                  {fmtD(w.actualEnd || w.updatedAt)}
                </td>
                <td>
                  <span className="badge badge-posted">
                    {w.status}
                  </span>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn-xs"
                    onClick={() => loadDetail(w)}>
                    Drill ▼
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
        {filtered.length > 0 && (
          <tfoot>
            <tr style={{ background:'#EDE0EA', fontWeight:700 }}>
              <td colSpan={3} style={{ padding:'8px 12px' }}>
                Total — {filtered.length} WOs
              </td>
              <td style={{ textAlign:'right', padding:'8px 12px',
                fontFamily:'DM Mono,monospace' }}>
                {fmtC(totals.matCost)}
              </td>
              <td style={{ textAlign:'right', padding:'8px 12px',
                fontFamily:'DM Mono,monospace' }}>
                {fmtC(totals.mhrCost)}
              </td>
              <td style={{ textAlign:'right', padding:'8px 12px',
                fontFamily:'Syne,sans-serif', fontWeight:800,
                color:'var(--odoo-purple)', fontSize:14 }}>
                {fmtC(totals.totalActual)}
              </td>
              <td colSpan={5} />
            </tr>
          </tfoot>
        )}
      </table>

      {/* Drill-down Modal */}
      {sel && (
        <div className="fi-modal-overlay" onClick={() => { setSel(null); setSelDetail(null) }}>
          <div className="fi-modal-box"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth:700 }}>
            <div className="fi-modal-hdr">
              <h3>{sel.woNo} — Cost Drill-Down</h3>
              <span className="fi-modal-close"
                onClick={() => { setSel(null); setSelDetail(null) }}>✕</span>
            </div>
            <div className="fi-modal-body">
              {/* WO Summary */}
              <div style={{ background:'#F8F9FA', padding:'10px 14px',
                borderRadius:6, marginBottom:16,
                display:'flex', gap:16, flexWrap:'wrap', fontSize:12 }}>
                <span><strong>Product:</strong> {sel.itemName}</span>
                <span><strong>Planned:</strong> {fmtQ(sel.plannedQty, sel.uom)}</span>
                <span><strong>Produced:</strong> {fmtQ(sel.producedQty, sel.uom)}</span>
                <span><strong>Rejected:</strong> {fmtQ(sel.rejectedQty, sel.uom)}</span>
              </div>

              {loadingDetail ? (
                <div style={{ padding:20, textAlign:'center', color:'#6C757D' }}>
                  Loading detail...
                </div>
              ) : selDetail ? (
                <>
                  {/* Material Consumption */}
                  {selDetail.materialIssues?.length > 0 && (
                    <>
                      <div style={{ fontWeight:700, fontSize:12,
                        color:'#714B67', marginBottom:6 }}>
                        📦 Material Consumption
                      </div>
                      <table className="fi-data-table" style={{ marginBottom:16 }}>
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th style={{ textAlign:'right' }}>BOM Qty</th>
                            <th style={{ textAlign:'right' }}>Issued Qty</th>
                            <th>UOM</th>
                            <th style={{ textAlign:'right' }}>Unit Cost</th>
                            <th style={{ textAlign:'right' }}>Total Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selDetail.materialIssues.map((m, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight:600 }}>
                                {m.itemName}
                                {m.itemCode && (
                                  <span style={{ fontSize:10, color:'#6C757D',
                                    marginLeft:6, fontFamily:'DM Mono,monospace' }}>
                                    {m.itemCode}
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign:'right',
                                fontFamily:'DM Mono,monospace' }}>
                                {m.bomQty || '—'}
                              </td>
                              <td style={{ textAlign:'right',
                                fontFamily:'DM Mono,monospace',
                                fontWeight:700 }}>
                                {m.issuedQty || m.bomQty || '—'}
                              </td>
                              <td style={{ fontSize:11, color:'#6C757D' }}>
                                {m.uom}
                              </td>
                              <td style={{ textAlign:'right',
                                fontFamily:'DM Mono,monospace' }}>
                                {fmtC(m.unitCost || 0)}
                              </td>
                              <td style={{ textAlign:'right',
                                fontFamily:'DM Mono,monospace',
                                fontWeight:700 }}>
                                {fmtC((m.issuedQty||m.bomQty||0) * (m.unitCost||0))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {/* Cost Summary */}
                  {(() => {
                    const c = calcCosts(selDetail)
                    const total = c.totalActual
                    return (
                      <table className="fi-data-table" style={{ marginBottom:16 }}>
                        <thead>
                          <tr>
                            <th>Cost Component</th>
                            <th>GL Account</th>
                            <th style={{ textAlign:'right' }}>Amount</th>
                            <th style={{ textAlign:'right' }}>% of Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Direct Material</td>
                            <td style={{ fontFamily:'DM Mono,monospace',
                              fontSize:11, color:'#714B67' }}>
                              5001 · COGM — Raw Material
                            </td>
                            <td style={{ textAlign:'right',
                              fontFamily:'DM Mono,monospace' }}>
                              {fmtC(c.matCost)}
                            </td>
                            <td style={{ textAlign:'right', fontSize:11,
                              color:'#6C757D' }}>
                              {pct(c.matCost, total)}
                            </td>
                          </tr>
                          <tr>
                            <td>Machine Hour (MHR)</td>
                            <td style={{ fontFamily:'DM Mono,monospace',
                              fontSize:11, color:'#714B67' }}>
                              5004 · Machine Running Charges
                            </td>
                            <td style={{ textAlign:'right',
                              fontFamily:'DM Mono,monospace',
                              color:'var(--odoo-blue)' }}>
                              {fmtC(c.mhrCost)}
                            </td>
                            <td style={{ textAlign:'right', fontSize:11,
                              color:'#6C757D' }}>
                              {pct(c.mhrCost, total)}
                            </td>
                          </tr>
                          {c.variance !== 0 && (
                            <tr>
                              <td>Production Variance</td>
                              <td style={{ fontFamily:'DM Mono,monospace',
                                fontSize:11, color:'#714B67' }}>
                                5011 · Production Variance
                              </td>
                              <td style={{ textAlign:'right',
                                fontFamily:'DM Mono,monospace',
                                color: c.variance > 0 ? '#DC3545' : '#155724',
                                fontWeight:700 }}>
                                {c.variance > 0 ? '+' : ''}{fmtC(c.variance)}
                              </td>
                              <td style={{ textAlign:'right', fontSize:11,
                                color: c.variance > 0 ? '#DC3545' : '#155724' }}>
                                {pct(Math.abs(c.variance), total)}
                              </td>
                            </tr>
                          )}
                          <tr style={{ background:'#EDE0EA', fontWeight:700 }}>
                            <td colSpan={2}>Total COGM</td>
                            <td style={{ textAlign:'right',
                              fontFamily:'Syne,sans-serif',
                              color:'var(--odoo-purple)', fontSize:14 }}>
                              {fmtC(total)}
                            </td>
                            <td style={{ textAlign:'right' }}>100%</td>
                          </tr>
                          <tr style={{ background:'#F8F4F8' }}>
                            <td colSpan={2} style={{ color:'#714B67', fontWeight:600 }}>
                              Unit Cost ({selDetail.uom})
                            </td>
                            <td style={{ textAlign:'right',
                              fontFamily:'DM Mono,monospace',
                              color:'var(--odoo-green)', fontWeight:700 }}>
                              {fmtC(c.unitCost)}/{selDetail.uom}
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    )
                  })()}
                </>
              ) : (
                <div style={{ padding:20, textAlign:'center', color:'#6C757D' }}>
                  No detailed data available
                </div>
              )}

              <div className="fi-alert info" style={{ fontSize:12 }}>
                Auto-posted as JE when Work Order closed.
                View in <strong>Day Book</strong> — Source: PP
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
