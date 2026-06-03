import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE   = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok    = () => localStorage.getItem('lnv_token')
const hdr    = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2   = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC   = n  => `₹${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const fmtQ   = (n,u) => `${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:3})} ${u||''}`

export default function WOComplete() {
  const nav   = useNavigate()
  const { id: paramId } = useParams()
  const [params]        = useSearchParams()
  const woId = paramId || params.get('woId')

  const [wo,       setWO]      = useState(null)
  const [wos,      setWOs]     = useState([])  // WO picker when no ID
  const [loading,  setLoading] = useState(true)
  const [saving,   setSaving]  = useState(false)
  const [closed,   setClosed]  = useState(false)
  const submitting = React.useRef(false) // prevent double submit

  // Final qty inputs
  const [producedQty,  setProducedQty]  = useState('')
  const [rejectedQty,  setRejectedQty]  = useState('')
  const [scrapQty,     setScrapQty]     = useState('0')
  const [closingRemarks, setClosingRemarks] = useState('')
  const [closeType, setCloseType] = useState('partial') // partial | final | short

  useEffect(() => {
    if (!woId) {
      // No WO ID — load eligible WOs for selection
      fetch(`${BASE}/pp/wo?status=IN_PROGRESS,RELEASED&_t=${Date.now()}`, { headers: hdr2() })
        .then(r => r.json())
        .then(d => setWOs(d.data || []))
        .catch(() => {})
        .finally(() => setLoading(false))
      return
    }
    fetch(`${BASE}/pp/wo/${woId}?_t=${Date.now()}`, { headers: hdr2() })
      .then(r => r.json())
      .then(async d => {
        const w = d.data
        if (!w) return toast.error('WO not found')
        setWO(w)

        // Fetch already posted FG qty — check both movement logs and goods receipts
        let alreadyPosted = 0
        try {
          // Method 1: PP_GR movement logs with sourceRef = woNo
          const grRes = await fetch(
            `${BASE}/wm/movement?refType=PP_GR&sourceRef=${encodeURIComponent(w.woNo)}`,
            { headers: hdr2() }
          )
          const grData = await grRes.json()
          const woGRs  = (grData.data||[]).filter(m => m.direction === 'IN')
          alreadyPosted = woGRs.reduce((s,m) => s + parseFloat(m.qty||0), 0)

          // Method 2: fallback — check all PP_GR and match by remarks/woNo
          if (alreadyPosted === 0) {
            const allGRRes = await fetch(`${BASE}/wm/movement?refType=PP_GR`, { headers: hdr2() })
            const allGRData = await allGRRes.json()
            const matched = (allGRData.data||[]).filter(m =>
              m.direction === 'IN' && (
                (m.sourceRef||'').includes(w.woNo) ||
                (m.remarks||'').includes(w.woNo)
              )
            )
            alreadyPosted = matched.reduce((s,m) => s + parseFloat(m.qty||0), 0)
          }
        } catch {}

        const totalProduced = parseFloat(w.producedQty || 0)
        const waitingToPost = Math.max(0, totalProduced - alreadyPosted)

        setProducedQty(String(waitingToPost > 0 ? waitingToPost : totalProduced))
        setRejectedQty('0')
      })
      .catch(() => toast.error('Failed to load WO'))
      .finally(() => setLoading(false))
  }, [woId])

  if (loading) return (
    <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>
      Loading Work Order...
    </div>
  )

  if (!wo) return (
    <div>
      <div style={{ position:'sticky', top:0, zIndex:100, background:'#F8F4F8',
        borderBottom:'2px solid #E0D5E0', boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">Close Work Order <small>Select WO to close</small></div>
          <div className="lv-acts">
            <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/wo')}>← WO List</button>
          </div>
        </div>
      </div>
      <div style={{ padding:20 }}>
        {loading ? (
          <div style={{ textAlign:'center', color:'#6C757D', padding:40 }}>Loading work orders...</div>
        ) : wos.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'#6C757D',
            background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
            <div style={{ fontWeight:700 }}>No work orders ready to close</div>
            <div style={{ fontSize:12, marginTop:4 }}>
              WOs must be IN_PROGRESS or RELEASED to close
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:13, color:'#6C757D', marginBottom:14 }}>
              Select a Work Order to close and post FG to stock:
            </div>
            <div style={{ display:'grid', gap:10 }}>
              {wos.map(w => {
                const pct = parseFloat(w.plannedQty||0) > 0
                  ? Math.min(100, Math.round((parseFloat(w.producedQty||0)/parseFloat(w.plannedQty))*100)) : 0
                const ss = w.status === 'IN_PROGRESS'
                  ? { bg:'#FFF3CD', c:'#856404', label:'In Progress' }
                  : { bg:'#D1ECF1', c:'#0C5460', label:'Released' }
                return (
                  <div key={w.id}
                    onClick={() => nav(`/pp/complete/${w.id}`)}
                    style={{ background:'#fff', border:'1.5px solid #E0D5E0',
                      borderRadius:8, padding:'14px 18px', cursor:'pointer',
                      display:'grid', gridTemplateColumns:'1fr auto',
                      gap:12, alignItems:'center',
                      ':hover':{ borderColor:'#714B67' } }}>
                    <div>
                      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:6 }}>
                        <span style={{ fontFamily:'DM Mono,monospace', fontWeight:800,
                          fontSize:13, color:'#714B67' }}>{w.woNo}</span>
                        <span style={{ padding:'2px 8px', borderRadius:8, fontSize:10,
                          fontWeight:700, background:ss.bg, color:ss.c }}>{ss.label}</span>
                      </div>
                      <div style={{ fontWeight:600, fontSize:12, marginBottom:6 }}>{w.itemName}</div>
                      <div style={{ fontSize:11, color:'#6C757D', marginBottom:6 }}>
                        Planned: {parseFloat(w.plannedQty||0).toLocaleString('en-IN')} {w.uom} ·
                        Produced: {parseFloat(w.producedQty||0).toLocaleString('en-IN')} {w.uom}
                        {w.scheduledEnd && ` · Due: ${new Date(w.scheduledEnd).toLocaleDateString('en-IN')}`}
                      </div>
                      <div style={{ background:'#E0E0E0', borderRadius:3, height:4, overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', borderRadius:3,
                          background: pct>=100?'#28A745':pct>=80?'#E67E22':'#1A5276' }} />
                      </div>
                      <div style={{ fontSize:10, color:'#6C757D', marginTop:2 }}>{pct}% complete</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <button className="btn btn-p sd-bsm">
                        Close WO →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )

  // ── Cost calculations from actual data ───────────────────────
  // Consolidate duplicate material issue rows (same itemCode)
  const matIssuesRaw = wo.materialIssues || []
  const matIssueMap  = {}
  matIssuesRaw.forEach(m => {
    const key = m.itemCode || m.itemName
    if (!matIssueMap[key]) {
      matIssueMap[key] = { ...m, bomQty: 0, issuedQty: 0 }
    }
    matIssueMap[key].bomQty    += parseFloat(m.bomQty    || 0)
    matIssueMap[key].issuedQty += parseFloat(m.issuedQty || 0)
    // Use best unitCost available
    if (!matIssueMap[key].unitCost && m.unitCost)
      matIssueMap[key].unitCost = m.unitCost
  })
  const matIssues = Object.values(matIssueMap)
  const operations   = wo.operations     || []
  const prodLogs     = wo.productionLogs || []

  const plannedQty   = parseFloat(wo.plannedQty  || 0)
  const prevProduced = parseFloat(wo.producedQty || 0)
  const prevRejected = parseFloat(wo.rejectedQty || 0)
  const totalProduced= parseFloat(producedQty || 0)
  const totalRejected= parseFloat(rejectedQty || 0)
  const totalScrap   = parseFloat(scrapQty    || 0)
  const yieldPct     = plannedQty > 0 ? ((totalProduced / plannedQty) * 100).toFixed(1) : 0

  // Cost ratio — what fraction of WO we're closing now
  const costRatio = plannedQty > 0 ? totalProduced / plannedQty : 1

  // Planned cost — prorated to qty being posted (not full WO)
  const plannedMatCost = matIssues.reduce((s, m) =>
    s + parseFloat(m.bomQty || 0) * parseFloat(m.unitCost || 0) * costRatio, 0)

  // Actual material cost — prorated issued qty for this batch
  // If issuedQty > 0 use actual, else prorate from bomQty
  const actualMatCost  = matIssues.reduce((s, m) => {
    const issued = parseFloat(m.issuedQty || 0)
    const bomProrated = parseFloat(m.bomQty || 0) * costRatio
    const qty = issued > 0 ? Math.min(issued, bomProrated * 1.2) : bomProrated
    return s + qty * parseFloat(m.unitCost || 0)
  }, 0)

  // Machine hour cost from operations
  const plannedMHRCost = operations.reduce((s, op) => {
    const hrs = (parseFloat(op.runTime || 0) / 60) * totalProduced
    return s + hrs * parseFloat(op.mhr || 0)
  }, 0)
  const actualMHRCost  = operations.reduce((s, op) => {
    const hrs = (parseFloat(op.runTime || 0) / 60) * totalProduced
    return s + hrs * parseFloat(op.mhr || 0)
  }, 0)

  const plannedTotal = plannedMatCost + plannedMHRCost
  const actualTotal  = actualMatCost  + actualMHRCost
  const variance     = actualTotal - plannedTotal
  const variancePct  = plannedTotal > 0 ? ((variance / plannedTotal) * 100).toFixed(1) : 0

  // ── Close WO ─────────────────────────────────────────────────
  const closeWO = async () => {
    if (submitting.current) return // prevent double submit
    if (!producedQty || parseFloat(producedQty) < 0) return toast.error('Enter qty to post!')
    if (parseFloat(producedQty) > plannedQty * 1.2)
      return toast.error(`Qty exceeds 120% of planned (${plannedQty})`)
    if (closeType === 'final' && parseFloat(producedQty) + prevProduced < plannedQty) {
      const ok = window.confirm(
        `Short close: Only ${parseFloat(producedQty)+prevProduced} of ${plannedQty} ${wo.uom} produced.\nVariance of ${plannedQty - parseFloat(producedQty) - prevProduced} ${wo.uom} will be written off. Proceed?`
      )
      if (!ok) return
    }

    // Final confirmation
    const confirmMsg = closeType === 'partial'
      ? `Post ${producedQty} ${wo.uom} to QC and FG Stock? (WO stays open)`
      : closeType === 'final'
      ? `Final close WO-${wo.woNo}? This cannot be undone.`
      : `Short close with variance? This cannot be undone.`

    if (!window.confirm(confirmMsg)) return

    submitting.current = true
    setSaving(true)
    try {
      // Update producedQty on WO
      const newProduced = parseFloat(producedQty) + prevProduced
      const newRejected = parseFloat(rejectedQty || 0) + prevRejected

      if (closeType === 'final' || closeType === 'short') {
        const res = await fetch(`${BASE}/pp/wo/${woId}/complete`, {
          method: 'POST', headers: hdr(),
          body: JSON.stringify({
            producedQty: newProduced,
            rejectedQty: newRejected,
            scrapQty:    parseFloat(scrapQty || 0),
            closeType,
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
      } else {
        await fetch(`${BASE}/pp/wo/${woId}`, {
          method: 'PUT', headers: hdr(),
          body: JSON.stringify({
            producedQty: newProduced,
            rejectedQty: newRejected,
            status: 'IN_PROGRESS',
          })
        })
      }

      toast.success(`✅ WO updated. Navigating to QC Inspection for FG quality check...`)
      setClosed(true)
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false); submitting.current = false }
  }

  // ── Success screen ────────────────────────────────────────────
  if (closed) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      padding:'60px 20px', gap:16 }}>
      <div style={{ fontSize:56 }}>✅</div>
      <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800,
        color:'#856404' }}>
        {wo.woNo} — Ready for QC Inspection
      </div>
      <div style={{ fontSize:13, color:'#6C757D', textAlign:'center', lineHeight:1.8 }}>
        <strong>{fmtQ(totalProduced, wo.uom)}</strong> {wo.itemName} produced
        &nbsp;·&nbsp; Rejected: {fmtQ(totalRejected, wo.uom)}
        &nbsp;·&nbsp; Yield: <strong>{yieldPct}%</strong>
      </div>
      <div style={{ padding:'12px 20px', background:'#FFF3CD', borderRadius:8,
        fontSize:13, color:'#856404', fontWeight:600, textAlign:'center',
        border:'1px solid #FFE69C' }}>
        ⚠️ FG stock not yet posted — Complete QC Inspection first.<br/>
        FG will be posted to stock automatically after QC PASS.
      </div>
      <div style={{ padding:'10px 20px', background:'#D4EDDA',
        borderRadius:8, fontSize:13, color:'#155724', fontWeight:600 }}>
        Actual Cost: {fmtC(actualTotal)} &nbsp;|&nbsp;
        Variance: <span style={{ color: variance > 0 ? '#DC3545' : '#155724' }}>
          {variance > 0 ? '+' : ''}{fmtC(variance)} ({variancePct}%)
        </span>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/wo')}>← Work Orders</button>
        <button className="btn btn-p sd-bsm"
          onClick={() => nav(`/qm/inspection/new?woId=${woId}&woNo=${wo.woNo}&itemCode=${wo.itemCode||''}&itemName=${encodeURIComponent(wo.itemName||'')}&qty=${totalProduced}`)}>
          🔬 Start QC Inspection →
        </button>
      </div>
    </div>
  )

  // ── Main screen ───────────────────────────────────────────────
  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Close Work Order
          <small>{wo.woNo} · {wo.itemName} · Final Settlement</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/wo')}>← Back</button>
          <button className="btn btn-p sd-bsm"
            disabled={saving} onClick={closeWO}>
            {saving ? '⏳ Posting...'
            : closeType === 'partial' ? '📦 Post to FG (Keep Open)'
            : closeType === 'final'   ? '✅ Final Close'
            : '⚠️ Short Close'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div style={{ background:'#D4EDDA', border:'1px solid #C3E6CB',
        borderRadius:6, padding:'8px 16px', marginBottom:14,
        fontSize:12, color:'#155724', display:'flex',
        alignItems:'center', gap:8 }}>
        <strong>Ready for Final Settlement</strong> — All production entries complete.
        Enter final produced/rejected qty and close the WO.
      </div>

      {/* WO Summary */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📋 WO Summary — {wo.woNo}</div>
        <div className="fi-form-sec-body">
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:16 }}>
            {[
              ['Work Order', wo.woNo],
              ['Product',    wo.itemName],
              ['WO Type',    wo.woType || 'MTS'],
              ['Planned Qty', fmtQ(plannedQty, wo.uom)],
              ['Produced So Far', fmtQ(prevProduced, wo.uom)],
              ['Status',     wo.status?.replace('_',' ')],
            ].map(([l,v]) => (
              <div key={l} style={{ background:'#F8F9FA', borderRadius:6,
                padding:'10px 12px', textAlign:'center' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#6C757D',
                  textTransform:'uppercase', marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:13, fontWeight:700,
                  fontFamily: l==='Work Order'||l==='Planned Qty'
                    ? 'DM Mono,monospace' : 'inherit',
                  color:'#1A1A2E' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final Qty Entry */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📦 Final Production Quantities</div>
        <div className="fi-form-sec-body">
          <div style={{ display:'grid',
            gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12,
            marginBottom:12 }}>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                Produced Qty * ({wo.uom})
              </label>
              <input type="number" min={0} max={plannedQty * 1.2}
                value={producedQty}
                onChange={e => setProducedQty(e.target.value)}
                style={{ padding:'8px 10px', border:'2px solid #28A745',
                  borderRadius:5, fontSize:14, fontWeight:700,
                  width:'100%', boxSizing:'border-box',
                  fontFamily:'DM Mono,monospace',
                  background:'#F0FFF8', outline:'none' }} />
              <div style={{ fontSize:10, color:'#6C757D', marginTop:3 }}>
                WO Planned: {fmtQ(plannedQty, wo.uom)} ·
                Total Produced: {fmtQ(prevProduced, wo.uom)} ·
                <span style={{color:'#856404',fontWeight:700}}>
                  Remaining to produce: {fmtQ(Math.max(0,plannedQty-prevProduced), wo.uom)}
                </span>
              </div>
              <div style={{ fontSize:10, color:'#1A5276', marginTop:2, fontWeight:600 }}>
                ℹ️ Enter only the qty to post NOW (produced since last FG posting)
              </div>
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                Rejected Qty ({wo.uom})
              </label>
              <input type="number" min={0}
                value={rejectedQty}
                onChange={e => setRejectedQty(e.target.value)}
                style={{ padding:'8px 10px', border:'2px solid #DC3545',
                  borderRadius:5, fontSize:14, fontWeight:700,
                  width:'100%', boxSizing:'border-box',
                  fontFamily:'DM Mono,monospace',
                  background:'#FFF5F5', outline:'none' }} />
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                Scrap Qty ({wo.uom})
              </label>
              <input type="number" min={0}
                value={scrapQty}
                onChange={e => setScrapQty(e.target.value)}
                style={{ padding:'8px 10px', border:'1.5px solid #E0D5E0',
                  borderRadius:5, fontSize:14, fontWeight:700,
                  width:'100%', boxSizing:'border-box',
                  fontFamily:'DM Mono,monospace', outline:'none' }} />
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                display:'block', marginBottom:4, textTransform:'uppercase' }}>
                Yield %
              </label>
              <div style={{ padding:'8px 10px', border:'1.5px solid #E0D5E0',
                borderRadius:5, fontSize:18, fontWeight:800,
                fontFamily:'DM Mono,monospace',
                color: parseFloat(yieldPct) >= 95 ? '#155724'
                     : parseFloat(yieldPct) >= 80 ? '#856404' : '#DC3545',
                background:'#F8F9FA' }}>
                {yieldPct}%
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize:10, fontWeight:700, color:'#495057',
              display:'block', marginBottom:4, textTransform:'uppercase' }}>
              Closing Remarks
            </label>
            <input style={{ padding:'8px 10px', border:'1.5px solid #E0D5E0',
              borderRadius:5, fontSize:12, width:'100%',
              boxSizing:'border-box', outline:'none' }}
              value={closingRemarks}
              onChange={e => setClosingRemarks(e.target.value)}
              placeholder="Any special notes for this WO closure..." />
          </div>

          {/* Close Type Selector */}
          <div style={{ marginTop:16 }}>
            <label style={{ fontSize:10, fontWeight:700, color:'#495057',
              display:'block', marginBottom:8, textTransform:'uppercase' }}>
              Close Type *
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              {[
                { k:'partial', icon:'📦', label:'Partial Delivery',
                  desc:`Post ${parseFloat(producedQty)||0} ${wo.uom} to FG. WO stays OPEN for balance ${Math.max(0,plannedQty-(parseFloat(producedQty)||0)-prevProduced).toFixed(0)} ${wo.uom}.`,
                  c:'#1A5276', bg:'#EBF5FB' },
                { k:'final',   icon:'✅', label:'Final Close',
                  desc:`Post & CLOSE WO completely. Total: ${parseFloat(producedQty||0)+prevProduced} ${wo.uom} of ${plannedQty} planned.`,
                  c:'#155724', bg:'#D4EDDA' },
                { k:'short',   icon:'⚠️', label:'Short Close',
                  desc:`Close WO with less than planned. Variance of ${Math.max(0,plannedQty-(parseFloat(producedQty)||0)-prevProduced).toFixed(0)} ${wo.uom} written off.`,
                  c:'#856404', bg:'#FFF3CD' },
              ].map(t => (
                <div key={t.k} onClick={() => setCloseType(t.k)}
                  style={{ padding:'12px 14px', borderRadius:8, cursor:'pointer',
                    background: closeType===t.k ? t.bg : '#F8F9FA',
                    border: `2px solid ${closeType===t.k ? t.c : '#E0D5E0'}`,
                    transition:'all .2s' }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{t.icon}</div>
                  <div style={{ fontWeight:800, fontSize:12, color:t.c, marginBottom:4 }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize:11, color:'#6C757D', lineHeight:1.4 }}>
                    {t.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Analysis */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">💰 Cost Analysis (Planned vs Actual)</div>
        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(4,1fr)',
          gap:12, padding:'14px 16px' }}>
          {[
            ['Planned Cost',   plannedTotal, '#1A5276',  '#EBF5FB'  ],
            ['Actual Cost',    actualTotal,  '#856404',  '#FFF3CD'  ],
            ['Variance',       Math.abs(variance),
              variance > 0 ? '#DC3545' : '#155724',
              variance > 0 ? '#F8D7DA' : '#D4EDDA' ],
            ['Efficiency',     null,         '#714B67',  '#EDE0EA'  ],
          ].map(([l,v,c,bg]) => (
            <div key={l} style={{ background:bg, borderRadius:8,
              padding:'14px 16px', textAlign:'center',
              border:`1px solid ${c}30` }}>
              <div style={{ fontSize:11, color:'#6C757D',
                fontWeight:700, textTransform:'uppercase',
                marginBottom:6 }}>{l}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800,
                fontSize:18, color:c }}>
                {l === 'Variance'
                  ? `${variance > 0 ? '+' : '-'}${fmtC(v)} (${variancePct}%)`
                  : l === 'Efficiency'
                  ? `${yieldPct}%`
                  : fmtC(v)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📊 Cost Breakdown</div>
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>Cost Element</th>
              <th style={{ textAlign:'right' }}>Planned (₹)</th>
              <th style={{ textAlign:'right' }}>Actual (₹)</th>
              <th style={{ textAlign:'right' }}>Variance (₹)</th>
              <th style={{ textAlign:'center' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const rows = [
                ['Raw Material / BOM', plannedMatCost, actualMatCost],
                ['Machine Hour (MHR)', plannedMHRCost, actualMHRCost],
              ]
              const totalP = rows.reduce((s,[,p]) => s+p, 0)
              const totalA = rows.reduce((s,[,,a]) => s+a, 0)
              return [...rows,
                ['Total', totalP, totalA]
              ].map(([l,p,a], i) => {
                const v   = a - p
                const pct = p > 0 ? ((v/p)*100).toFixed(1) : '—'
                const isTotal = i === rows.length
                return (
                  <tr key={l} style={ isTotal
                    ? { fontWeight:800, background:'#F8F9FA',
                        borderTop:'2px solid #E0D5E0' }
                    : {} }>
                    <td>{l}</td>
                    <td style={{ textAlign:'right',
                      fontFamily:'DM Mono,monospace' }}>{fmtC(p)}</td>
                    <td style={{ textAlign:'right',
                      fontFamily:'DM Mono,monospace' }}>{fmtC(a)}</td>
                    <td style={{ textAlign:'right', fontWeight:700,
                      fontFamily:'DM Mono,monospace',
                      color: v > 0 ? '#DC3545' : '#155724' }}>
                      {v > 0 ? '+' : ''}{fmtC(v)}
                    </td>
                    <td style={{ textAlign:'center',
                      color: v > 0 ? '#856404' : '#155724',
                      fontSize:11 }}>
                      {typeof pct === 'string' && pct !== '—' ? `${pct}%` : pct}
                    </td>
                  </tr>
                )
              })
            })()}
          </tbody>
        </table>
      </div>

      {/* Material Issues */}
      {matIssues.length > 0 && (
        <div className="fi-form-sec">
          <div className="fi-form-sec-hdr">📦 Material Consumption</div>
          <table className="fi-data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign:'center' }}>BOM Qty</th>
                <th style={{ textAlign:'center' }}>Issued Qty</th>
                <th style={{ textAlign:'center' }}>UOM</th>
                <th style={{ textAlign:'right' }}>Unit Cost</th>
                <th style={{ textAlign:'right' }}>Total Cost</th>
                <th style={{ textAlign:'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {matIssues.map((m,i) => {
                // Prorate BOM qty to what's being posted this batch
                const fullBomQty    = parseFloat(m.bomQty||0)
                const proratedBomQty= parseFloat((fullBomQty * costRatio).toFixed(3))
                const issuedQty     = parseFloat(m.issuedQty||0)
                // Actual consumption = issued if available, else prorated BOM
                const actualQty     = issuedQty > 0
                  ? Math.min(issuedQty, proratedBomQty * 1.5) // cap at 150% of prorated
                  : proratedBomQty
                const totalCost     = actualQty * parseFloat(m.unitCost||0)
                return (
                <tr key={i}>
                  <td style={{ fontWeight:600 }}>
                    {m.itemName}
                    {m.itemCode && <span style={{ fontSize:10,
                      color:'#6C757D', marginLeft:6,
                      fontFamily:'DM Mono,monospace' }}>
                      {m.itemCode}
                    </span>}
                  </td>
                  <td style={{ textAlign:'center', fontFamily:'DM Mono,monospace' }}>
                    <div style={{fontWeight:700}}>{proratedBomQty}</div>
                    <div style={{fontSize:9,color:'#6C757D'}}>
                      ({fullBomQty} total WO)
                    </div>
                  </td>
                  <td style={{ textAlign:'center',
                    fontFamily:'DM Mono,monospace', fontWeight:700,
                    color: issuedQty > 0 ? '#155724' : '#856404' }}>
                    {issuedQty > 0 ? issuedQty : '—'}
                  </td>
                  <td style={{ textAlign:'center', color:'#6C757D', fontSize:11 }}>
                    {m.uom}
                  </td>
                  <td style={{ textAlign:'right', fontFamily:'DM Mono,monospace' }}>
                    {fmtC(m.unitCost||0)}
                  </td>
                  <td style={{ textAlign:'right',
                    fontFamily:'DM Mono,monospace', fontWeight:700 }}>
                    {fmtC(totalCost)}
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <span style={{
                      background: m.status==='ISSUED'||m.status==='BACKFLUSHED'
                        ? '#D4EDDA' : '#FFF3CD',
                      color: m.status==='ISSUED'||m.status==='BACKFLUSHED'
                        ? '#155724' : '#856404',
                      padding:'2px 8px', borderRadius:10,
                      fontSize:10, fontWeight:700
                    }}>{m.status}</span>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* FI Auto Journal preview */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📒 Auto FI Journals on Closure</div>
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>Account</th>
              <th style={{ textAlign:'right' }}>Dr</th>
              <th style={{ textAlign:'right' }}>Cr</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1400 · Finished Goods Inventory</td>
              <td style={{ textAlign:'right', color:'#155724',
                fontFamily:'DM Mono,monospace', fontWeight:700 }}>
                {fmtC(actualTotal)}
              </td>
              <td style={{ textAlign:'right', color:'#6C757D' }}>—</td>
              <td style={{ fontSize:11, color:'#6C757D' }}>
                FG stock posting — {fmtQ(totalProduced, wo.uom)} {wo.itemName}
                {closeType === 'partial' && (
                  <span style={{marginLeft:6,color:'#856404',fontSize:10}}>
                    ({(costRatio*100).toFixed(1)}% of WO)
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <td>6110 · COGM — Manufacturing Cost</td>
              <td style={{ textAlign:'right', color:'#6C757D' }}>—</td>
              <td style={{ textAlign:'right', color:'#DC3545',
                fontFamily:'DM Mono,monospace', fontWeight:700 }}>
                {fmtC(plannedTotal)}
              </td>
              <td style={{ fontSize:11, color:'#6C757D' }}>Standard cost transfer</td>
            </tr>
            {variance !== 0 && (
              <tr>
                <td>6800 · Production Variance</td>
                <td style={{ textAlign:'right', color: variance > 0 ? '#DC3545' : '#6C757D',
                  fontFamily:'DM Mono,monospace', fontWeight:700 }}>
                  {variance > 0 ? fmtC(variance) : '—'}
                </td>
                <td style={{ textAlign:'right', color: variance < 0 ? '#155724' : '#6C757D',
                  fontFamily:'DM Mono,monospace', fontWeight:700 }}>
                  {variance < 0 ? fmtC(Math.abs(variance)) : '—'}
                </td>
                <td style={{ fontSize:11, color:'#6C757D' }}>
                  {variance > 0 ? 'Over-absorption' : 'Under-absorption'} variance
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm" onClick={() => nav('/pp/wo')}>← Back</button>
        <button className="btn btn-p sd-bsm"
          disabled={saving} onClick={closeWO}>
          {saving ? '⏳ Posting...'
            : closeType === 'partial' ? `📦 Post ${parseFloat(producedQty)||0} ${wo.uom} to FG (Keep WO Open)`
            : closeType === 'final'   ? '✅ Final Close & Post FG to Stock'
            : '⚠️ Short Close WO'}
        </button>
      </div>
    </div>
  )
}
