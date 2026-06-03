import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE   = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok    = () => localStorage.getItem('lnv_token')
const hdr    = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2   = () => ({ Authorization:`Bearer ${tok()}` })
const fmtQ   = (n,u) => `${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:3})} ${u||'Nos'}`

// ═══════════════════════════════════════════════════════════════
// MRP Run — Material Requirements Planning
// SAP: MD01 / MD04 — Demand vs Stock → Generate Production Plans
// ═══════════════════════════════════════════════════════════════
export default function MRPRun() {
  const nav = useNavigate()

  const [loading,  setLoading]  = useState(true)
  const [running,  setRunning]  = useState(false)
  const [salesOrders, setSOs]   = useState([])
  const [stockMap,    setStock] = useState({}) // itemCode/Name → balanceQty
  const [plans,       setPlans] = useState([]) // existing production plans
  const [mrpResult,   setMRP]   = useState([]) // calculated demand rows
  const [selected,    setSelected] = useState({}) // rowKey → bool (selected for plan creation)
  const [creating,    setCreating] = useState(false)
  const [ranAt,       setRanAt]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [soRes, stRes, plRes] = await Promise.all([
        // Sales Orders — open/confirmed
        fetch(`${BASE}/sd/orders`, { headers: hdr2() })  // fetch all, filter client-side
          .then(r => r.json()).catch(() => ({ data: [] })),
        // Current FG stock
        fetch(`${BASE}/wm/stock`, { headers: hdr2() })
          .then(r => r.json()).catch(() => ({ data: [] })),
        // Existing production plans
        fetch(`${BASE}/pp/plan`, { headers: hdr2() })
          .then(r => r.json()).catch(() => ({ data: [] })),
      ])

      const sos    = soRes.data  || soRes  || []
      const stocks = stRes.data  || []
      const plans  = plRes.data  || []

      // Include CONFIRMED, DRAFT, OPEN — any SO with demand
      const activeSOs = (sos||[]).filter(so => {
        const st = (so.status||'').toUpperCase()
        return ['CONFIRMED','PROCESSING','OPEN','DRAFT','PENDING'].includes(st)
      })
      setSOs(activeSOs)
      setPlans(plans)

      // Build stock map by itemCode and itemName
      const sm = {}
      stocks.forEach(s => {
        if (s.itemCode) sm[s.itemCode] = parseFloat(s.balanceQty || 0)
        if (s.itemName) sm[s.itemName] = parseFloat(s.balanceQty || 0)
      })
      setStock(sm)

    } catch(e) {
      toast.error('Failed to load MRP data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Run MRP ───────────────────────────────────────────────────
  const runMRP = async () => {
    setRunning(true)
    try {
      // Option 1: Call backend MRP run
      const res = await fetch(`${BASE}/pp/mrp/run`, {
        method: 'POST', headers: hdr(),
        body: JSON.stringify({ soIds: salesOrders.map(s => s.id) })
      }).catch(() => null)

      let backendResult = null
      if (res?.ok) {
        const d = await res.json()
        backendResult = d.data || d.items || null
      }

      // Option 2: Calculate client-side from SO lines vs stock
      const demandMap = {} // itemCode/Name → { demand, confirmed, soRefs }

      salesOrders.forEach(so => {
        // Read lines from JSON field (lineItems) OR relational lines[]
        let soLines = []
        if (so.lineItems) {
          try {
            const parsed = typeof so.lineItems === 'string' ? JSON.parse(so.lineItems) : so.lineItems
            if (Array.isArray(parsed) && parsed.length > 0) soLines = parsed
          } catch {}
        }
        if (!soLines.length) soLines = so.lines || so.items || []
        soLines.forEach(line => {
          const key  = line.itemCode || line.itemName || line.description || ''
          if (!key) return
          if (!demandMap[key]) {
            demandMap[key] = {
              itemCode:  line.itemCode || '',
              itemName:  line.itemName || line.description || '',
              uom:       line.uom     || line.unit || 'Nos',
              demand:    0,
              soRefs:    [],
            }
          }
          demandMap[key].demand += parseFloat(line.qty || line.quantity || 0)
          demandMap[key].soRefs.push(so.soNo || so.orderNo || so.id)
        })
      })

      // Use backend result if available, otherwise client-side
      const rows = backendResult || Object.values(demandMap)

      // Enrich each row with stock and plan info
      const enriched = rows.map(row => {
        const key      = row.itemCode || row.itemName
        const stock    = stockMap[key] ||
                         stockMap[row.itemCode] ||
                         stockMap[(row.itemName||'').toLowerCase().trim()] ||
                         stockMap[row.itemName] || 0
        const demand   = parseFloat(row.demand || row.requiredQty || 0)
        const required = Math.max(0, demand - stock)

        // Check if plan already exists
        const existingPlan = plans.find(p =>
          p.itemCode === row.itemCode ||
          p.itemName?.toLowerCase() === row.itemName?.toLowerCase()
        )

        return {
          ...row,
          stock,
          demand,
          required,
          existingPlan,
          status: required <= 0   ? 'COVERED'
                : existingPlan    ? 'PLAN_EXISTS'
                : 'PLAN_NEEDED',
        }
      }).filter(r => r.demand > 0) // only show items with demand

      setMRP(enriched)
      setRanAt(new Date())
      // Save results for MRPList page to read
      localStorage.setItem('lnv_mrp_results', JSON.stringify({
        results: enriched,
        ranAt:   new Date().toISOString(),
        soCount: salesOrders.length,
      }))

      // Pre-select all items that need plans
      const sel = {}
      enriched.forEach((r, i) => {
        if (r.status === 'PLAN_NEEDED') sel[i] = true
      })
      setSelected(sel)

      toast.success(`MRP complete — ${enriched.length} demand item(s) found`)
    } catch(e) {
      toast.error('MRP run failed: ' + e.message)
    } finally {
      setRunning(false)
    }
  }

  // ── Create Production Plans ───────────────────────────────────
  const createPlans = async () => {
    const toCreate = mrpResult.filter((_, i) => selected[i] && _.status === 'PLAN_NEEDED')
    if (!toCreate.length) return toast.error('Select at least one item to plan!')

    setCreating(true)
    let created = 0
    try {
      for (const row of toCreate) {
        const noRes = await fetch(`${BASE}/pp/plan/next-no`, { headers: hdr2() })
        const { planNo } = await noRes.json()

        const res = await fetch(`${BASE}/pp/plan`, {
          method: 'POST', headers: hdr(),
          body: JSON.stringify({
            planNo,
            itemCode:   row.itemCode   || '',
            itemName:   row.itemName   || '',
            uom:        row.uom        || 'Nos',
            plannedQty: row.required,
            startDate:  new Date().toISOString().split('T')[0],
            endDate:    new Date(Date.now()+7*864e5).toISOString().split('T')[0],
            priority:   'Normal',
            soNo:       (row.soRefs||[]).join(', '),
            planMonth:  `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`,
            remarks:    `MRP Auto-generated — Demand: ${row.demand} ${row.uom}, Stock: ${row.stock} ${row.uom}`,
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        created++
      }
      toast.success(`✅ ${created} Production Plan(s) created from MRP!`)
      nav('/pp/plan')
    } catch(e) {
      toast.error(e.message)
    } finally {
      setCreating(false)
    }
  }

  const allSelected  = mrpResult.filter((_,i)=>_.status==='PLAN_NEEDED').every((_,idx)=>selected[idx])
  const someSelected = Object.values(selected).some(Boolean)
  const needCount    = mrpResult.filter(r => r.status==='PLAN_NEEDED').length
  const coveredCount = mrpResult.filter(r => r.status==='COVERED').length
  const planCount    = mrpResult.filter(r => r.status==='PLAN_EXISTS').length

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          MRP Run
          <small>MD01 · Material Requirements Planning — SO Demand → Production Plans</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/plan')}>
            ← Production Plan
          </button>
          {mrpResult.length > 0 && someSelected && (
            <button className="btn btn-s sd-bsm"
              onClick={createPlans} disabled={creating}>
              {creating ? '⏳ Creating...' : `📋 Create Plans (${Object.values(selected).filter(Boolean).length})`}
            </button>
          )}
          <button className="btn btn-p sd-bsm"
            onClick={runMRP} disabled={running || loading}>
            {running ? '⏳ Running MRP...' : '▶ Run MRP'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{ background:'#EBF5FB', border:'1px solid #AED6F1',
        borderRadius:6, padding:'10px 16px', marginBottom:14,
        fontSize:12, color:'#1A5276' }}>
        <strong>How MRP works:</strong> Reads all confirmed Sales Orders →
        checks current FG stock → calculates shortfall →
        auto-creates Production Plans for items that need to be produced.
        Same as SAP <strong>MD01 / MD04</strong>.
      </div>

      {/* Input Section */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📥 MRP Inputs</div>
        <div className="fi-form-sec-body">
          <div style={{ display:'grid',
            gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div style={{ background:'#F8F9FA', borderRadius:8,
              padding:'12px 16px', textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:800,
                color:'#1A5276', fontFamily:'DM Mono,monospace' }}>
                {salesOrders.length}
              </div>
              <div style={{ fontSize:11, fontWeight:700,
                color:'#6C757D', textTransform:'uppercase' }}>
                Open Sales Orders
              </div>
            </div>
            <div style={{ background:'#F8F9FA', borderRadius:8,
              padding:'12px 16px', textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:800,
                color:'#155724', fontFamily:'DM Mono,monospace' }}>
                {Object.keys(stockMap).length}
              </div>
              <div style={{ fontSize:11, fontWeight:700,
                color:'#6C757D', textTransform:'uppercase' }}>
                FG Stock Items
              </div>
            </div>
            <div style={{ background:'#F8F9FA', borderRadius:8,
              padding:'12px 16px', textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:800,
                color:'#856404', fontFamily:'DM Mono,monospace' }}>
                {plans.length}
              </div>
              <div style={{ fontSize:11, fontWeight:700,
                color:'#6C757D', textTransform:'uppercase' }}>
                Existing Plans
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding:20, textAlign:'center',
              color:'#6C757D', marginTop:12 }}>
              Loading data...
            </div>
          ) : salesOrders.length === 0 ? (
            <div style={{ background:'#FFF3CD', border:'1px solid #FFE69C',
              borderRadius:6, padding:'12px 16px', marginTop:12,
              fontSize:12, color:'#856404', display:'flex',
              alignItems:'center', gap:8 }}>
              ⚠️ <div>
                <strong>No open Sales Orders found.</strong>
                <br/>Create Sales Orders in the SD module first, then run MRP.
                &nbsp;<button style={{ background:'none', border:'none',
                  color:'#1A5276', cursor:'pointer', fontWeight:700,
                  textDecoration:'underline' }}
                  onClick={() => nav('/sd/orders/new')}>
                  Create Sales Order →
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop:12, fontSize:12,
              color:'#155724', fontWeight:600 }}>
              ✅ {salesOrders.length} Sales Order(s) loaded.
              Click <strong>Run MRP</strong> to calculate demand.
            </div>
          )}
        </div>
      </div>

      {/* MRP Results */}
      {mrpResult.length > 0 && (
        <>
          {/* Summary */}
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(3,1fr)',
            gap:10, marginBottom:14 }}>
            {[
              ['✅ Covered by Stock', coveredCount, '#D4EDDA', '#155724'],
              ['📋 Plan Exists',      planCount,    '#FFF3CD', '#856404'],
              ['🔴 Plan Needed',      needCount,    '#F8D7DA', '#721C24'],
            ].map(([l,v,bg,c]) => (
              <div key={l} style={{ background:bg, borderRadius:8,
                padding:'12px 16px', textAlign:'center',
                border:`1px solid ${c}30` }}>
                <div style={{ fontSize:24, fontWeight:800,
                  color:c, fontFamily:'DM Mono,monospace' }}>{v}</div>
                <div style={{ fontSize:11, fontWeight:700, color:c }}>{l}</div>
              </div>
            ))}
          </div>

          {ranAt && (
            <div style={{ fontSize:11, color:'#6C757D',
              marginBottom:8, textAlign:'right' }}>
              Last run: {ranAt.toLocaleString('en-IN')}
            </div>
          )}

          {/* Results Table */}
          <div style={{ border:'1.5px solid #E0D5E0', borderRadius:8,
            overflow:'hidden', marginBottom:14 }}>
            <div style={{ background:'#1A5276', padding:'8px 14px',
              display:'flex', justifyContent:'space-between',
              alignItems:'center' }}>
              <span style={{ color:'#fff', fontWeight:700, fontSize:13 }}>
                📊 MRP Results — Select items to create Production Plans
              </span>
              {needCount > 0 && (
                <label style={{ color:'#fff', fontSize:11,
                  display:'flex', alignItems:'center', gap:6,
                  cursor:'pointer' }}>
                  <input type="checkbox"
                    checked={allSelected}
                    onChange={e => {
                      const sel = {}
                      mrpResult.forEach((r,i) => {
                        if (r.status === 'PLAN_NEEDED') sel[i] = e.target.checked
                      })
                      setSelected(sel)
                    }} />
                  Select all that need plans
                </label>
              )}
            </div>

            <table className="fi-data-table">
              <thead>
                <tr>
                  <th style={{ width:36 }}></th>
                  <th>Item</th>
                  <th style={{ textAlign:'right' }}>SO Demand</th>
                  <th style={{ textAlign:'right' }}>FG Stock</th>
                  <th style={{ textAlign:'right' }}>Required to Produce</th>
                  <th>SO References</th>
                  <th style={{ textAlign:'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {mrpResult.map((row, i) => {
                  const bg = row.status === 'COVERED'     ? '#F0FFF8'
                           : row.status === 'PLAN_EXISTS' ? '#FFFBF0'
                           : '#FFF5F5'
                  return (
                    <tr key={i} style={{ background:bg }}>
                      <td style={{ textAlign:'center', padding:'6px 8px' }}>
                        {row.status === 'PLAN_NEEDED' ? (
                          <input type="checkbox"
                            checked={!!selected[i]}
                            onChange={e => setSelected(prev => ({
                              ...prev, [i]: e.target.checked
                            }))} />
                        ) : (
                          <span style={{ fontSize:14 }}>
                            {row.status === 'COVERED' ? '✅' : '📋'}
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight:600 }}>
                        {row.itemName}
                        {row.itemCode && (
                          <span style={{ fontSize:10, color:'#6C757D',
                            marginLeft:6, fontFamily:'DM Mono,monospace' }}>
                            {row.itemCode}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign:'right',
                        fontFamily:'DM Mono,monospace', fontWeight:700,
                        color:'#1A5276' }}>
                        {fmtQ(row.demand, row.uom)}
                      </td>
                      <td style={{ textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        color: row.stock >= row.demand ? '#155724' : '#DC3545',
                        fontWeight:700 }}>
                        {fmtQ(row.stock, row.uom)}
                      </td>
                      <td style={{ textAlign:'right',
                        fontFamily:'DM Mono,monospace',
                        fontWeight:800,
                        color: row.required <= 0 ? '#155724' : '#DC3545',
                        fontSize:14 }}>
                        {row.required <= 0
                          ? '— Covered'
                          : fmtQ(row.required, row.uom)}
                      </td>
                      <td style={{ fontSize:11, color:'#6C757D' }}>
                        {(row.soRefs||[]).join(', ') || '—'}
                      </td>
                      <td style={{ textAlign:'center' }}>
                        {row.status === 'COVERED' && (
                          <span style={{ background:'#D4EDDA',
                            color:'#155724', padding:'2px 8px',
                            borderRadius:10, fontSize:10,
                            fontWeight:700 }}>Stock OK</span>
                        )}
                        {row.status === 'PLAN_EXISTS' && (
                          <span style={{ background:'#FFF3CD',
                            color:'#856404', padding:'2px 8px',
                            borderRadius:10, fontSize:10,
                            fontWeight:700 }}>
                            Plan: {row.existingPlan?.planNo}
                          </span>
                        )}
                        {row.status === 'PLAN_NEEDED' && (
                          <span style={{ background:'#F8D7DA',
                            color:'#721C24', padding:'2px 8px',
                            borderRadius:10, fontSize:10,
                            fontWeight:700 }}>Plan Needed</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Create Plans CTA */}
          {needCount > 0 && (
            <div style={{ background:'#EBF5FB', border:'1px solid #AED6F1',
              borderRadius:8, padding:'14px 16px',
              display:'flex', justifyContent:'space-between',
              alignItems:'center' }}>
              <div style={{ fontSize:12, color:'#1A5276' }}>
                <strong>{Object.values(selected).filter(Boolean).length} item(s) selected</strong>
                &nbsp;→ Production Plans will be created with demand qty
                and linked to their Sales Orders.
              </div>
              <button className="btn btn-p sd-bsm"
                onClick={createPlans} disabled={creating || !someSelected}>
                {creating
                  ? '⏳ Creating Plans...'
                  : `📋 Create ${Object.values(selected).filter(Boolean).length} Production Plan(s)`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state - before running */}
      {mrpResult.length === 0 && !loading && !running && (
        <div style={{ textAlign:'center', padding:'60px 20px',
          color:'#6C757D' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔄</div>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>
            MRP not yet run
          </div>
          <div style={{ fontSize:12, marginBottom:16, color:'#6C757D' }}>
            Click <strong>▶ Run MRP</strong> to analyze Sales Order demand
            against current stock and generate Production Plans automatically.
          </div>
          <button className="btn btn-p sd-bsm" onClick={runMRP}>
            ▶ Run MRP Now
          </button>
        </div>
      )}
    </div>
  )
}
