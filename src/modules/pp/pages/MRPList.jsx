import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtN = (n,d=2) => Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:d})
const fmtD = s => s ? new Date(s).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'
const PAGE_SIZE = 20

export default function MRPList() {
  const nav = useNavigate()
  const [results,  setResults]  = useState([])
  const [filter,   setFilter]   = useState('All')
  const [ranAt,    setRanAt]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [raising,  setRaising]  = useState(null)

  // Coverage expand — inline row
  const [expanded,  setExpanded]  = useState(null)   // itemCode|itemName of expanded row
  const [coverage,  setCoverage]  = useState({})     // key → { rows, finalBalance }
  const [covLoading,setCovLoading]= useState(null)   // which row is loading

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    // Reset coverage cache on every load so per-WO needs are recalculated
    setCoverage({})
    setExpanded(null)
    try {
      const cached = localStorage.getItem('lnv_mrp_results')
      if (cached && !forceRefresh) {
        const { results: r, ranAt: ra } = JSON.parse(cached)
        setResults(r || []); setRanAt(ra)
        setLoading(false); return
      }
      // Clear stale cache before fresh fetch
      localStorage.removeItem('lnv_mrp_results')
      const res  = await fetch(`${BASE}/pp/mrp/run`, { method:'POST', headers: hdr() })
      const data = await res.json()
      const rows = data.data || []
      setResults(rows)
      setRanAt(new Date().toISOString())
      // Save fresh results to cache
      localStorage.setItem('lnv_mrp_results', JSON.stringify({
        results: rows, ranAt: new Date().toISOString()
      }))
    } catch { toast.error('Run MRP first') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const raisePO = async (row) => {
    if (raising) return
    setRaising(row.itemCode || row.itemName)
    try {
      await fetch(`${BASE}/mm/purchase-requisitions`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({
          itemCode: row.itemCode, itemName: row.itemName,
          requestedQty: parseFloat(row.shortage), uom: row.uom||'Nos',
          remarks: `MRP Auto-PR — ${fmtN(row.shortage)} ${row.uom} needed for ${(row.wos||[]).join(', ')}`,
          priority:'Normal', source:'MRP',
        })
      })
      toast.success(`PR raised for ${row.itemName}!`)
    } catch {
      toast(`Raise PO: ${row.itemName} — Buy ${fmtN(row.shortage)} ${row.uom}`, {icon:'📋',duration:5000})
    }
    finally { setRaising(null) }
  }

  // ── INLINE COVERAGE EXPAND ──────────────────────────────────────────────────
  const loadCoverage = useCallback(async (rm) => {
    const key = rm.itemCode || rm.itemName
    if (expanded === key) { setExpanded(null); return }

    if (coverage[key]) { setExpanded(key); return }

    setCovLoading(key)
    try {
      const [woRes, poRes] = await Promise.all([
        fetch(`${BASE}/pp/wo`, { headers: hdr2() }).then(r=>r.json()),
        fetch(`${BASE}/mm/po`, { headers: hdr2() }).then(r=>r.json()).catch(()=>({data:[]})),
      ])

      const allWOs  = woRes.data || []
      const openPOs = poRes.data || []

      // WOs for this RM (from rm.wos array)
      const rmWOs = allWOs
        .filter(wo => (rm.wos||[]).includes(wo.woNo))
        .sort((a,b) => new Date(a.scheduledStart||'2099') - new Date(b.scheduledStart||'2099'))

      // Pipeline POs for this RM
      const pipeline = []
      openPOs.forEach(po => {
        const lines = po.items || (typeof po.lines==='string' ? JSON.parse(po.lines||'[]') : po.lines||[])
        lines.forEach(l => {
          if (!l) return
          const match = l.itemCode === rm.itemCode ||
            (rm.itemCode && l.itemCode?.includes(rm.itemCode)) ||
            (l.itemName||'').toLowerCase().includes((rm.itemName||'').toLowerCase().slice(0,6))
          if (match) pipeline.push({
            poNo: po.poNo,
            qty:  parseFloat(l.pendingQty||l.qty||0),
            date: po.deliveryDate || po.expectedDate || null
          })
        })
      })

      // Fetch materialIssues per WO — source of truth for per-WO RM need
      // DB has correctly scaled bomQty (fixed: comp.qty/baseQty × plannedQty)
      const issueMap = {} // woNo → total need qty for this RM
      await Promise.all(
        rmWOs.map(async wo => {
          try {
            const r = await fetch(`${BASE}/pp/material-issues?woId=${wo.id}`, { headers: hdr2() })
            const d = await r.json()
            const issues = d.data || []
            const rmNameLower = (rm.itemName||'').toLowerCase().trim()
            const matching = issues.filter(iss =>
              (rm.itemCode && iss.itemCode === rm.itemCode) ||
              (iss.itemName||'').toLowerCase().trim() === rmNameLower
            )
            // Sum all matching rows (WO may have duplicate BOM lines for same material)
            issueMap[wo.woNo] = matching.reduce((s, iss) => s + parseFloat(iss.bomQty||0), 0)
          } catch { issueMap[wo.woNo] = 0 }
        })
      )

      // Running balance
      let balance = parseFloat(rm.stock || 0)
      const woCount = rmWOs.length || 1
      const rows = []

      for (const wo of rmWOs) {
        // Priority: 1) live materialIssues from DB  2) woDetails from MRP  3) equal split
        const dbNeed = issueMap[wo.woNo] || 0
        const wd     = (rm.woDetails||[]).find(d => d.woNo === wo.woNo)
        const need   = dbNeed > 0  ? dbNeed
                     : wd          ? parseFloat(wd.needed||0)
                     : parseFloat(rm.totalNeeded||0) / woCount

        const before = balance
        balance     -= need
        const after  = balance
        const short  = after < 0 ? Math.abs(after) : 0

        // Pipeline check: does any PO arrive before this WO's delivery date?
        const soDate = wo.scheduledEnd ? new Date(wo.scheduledEnd) : null
        const covPOs = short > 0 && soDate
          ? pipeline.filter(p => p.date && new Date(p.date) <= soDate)
          : []
        const pipeQty     = covPOs.reduce((s,p)=>s+p.qty,0)
        const pipeCovered = pipeQty >= short

        rows.push({
          woNo:     wo.woNo,
          woItem:   wo.itemName,
          woQty:    parseFloat(wo.plannedQty||0),
          soDate:   wo.scheduledEnd,
          need,
          before:   Math.max(0, before),
          after:    Math.max(0, after),
          short,
          pipeCovered,
          pipeInfo: covPOs.map(p=>`${p.poNo} +${fmtN(p.qty)} ${rm.uom} by ${fmtD(p.date)}`).join(' · '),
          status:   short===0 ? 'OK' : pipeCovered ? 'Pipeline' : 'Short'
        })
      }

      setCoverage(prev => ({ ...prev, [key]: { rows, pipeline, finalBalance: balance } }))
      setExpanded(key)
    } catch(e) { toast.error('Coverage load failed') }
    finally { setCovLoading(null) }
  }, [expanded, coverage])

  // ───────────────────────────────────────────────────────────────────────────

  const filtered = results.filter(r => {
    const st = (r.status||'').toUpperCase()
    if (filter==='All')   return true
    if (filter==='Short') return r.shortage > 0 || st==='SHORT'
    if (filter==='OK')    return r.shortage <= 0
    return true
  })

  const shortCount = results.filter(r=>r.shortage>0).length
  const okCount    = results.filter(r=>r.shortage<=0).length
  const grandTotal = results.reduce((s,r)=>s+parseFloat(r.totalNeeded||0),0)

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">MRP Results <small>MD04 · Material Requirements</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={()=>load(true)}>↻ Re-run MRP</button>
          <button className="btn btn-s sd-bsm"
            onClick={()=>{ localStorage.removeItem('lnv_mrp_results'); nav('/pp/mrp') }}>
            🔄 Fresh Run
          </button>
          {shortCount>0 && (
            <button className="btn btn-p sd-bsm"
              style={{background:'#DC3545',borderColor:'#DC3545'}}
              onClick={()=>filtered.filter(r=>r.shortage>0).forEach(r=>raisePO(r))}>
              🛒 Raise All POs ({shortCount})
            </button>
          )}
        </div>
      </div>

      {/* Info bar */}
      {ranAt && (
        <div style={{background:'#E8F4FD',border:'1px solid #AED6F1',borderRadius:6,
          padding:'8px 16px',marginBottom:12,fontSize:12,color:'#1A5276'}}>
          <strong>How MRP works:</strong> Total needed across all Work Orders − Current stock = Shortage to Buy.
          &nbsp;&nbsp;🕐 Last run: <strong>{new Date(ranAt).toLocaleString('en-IN')}</strong>
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <em>Click <strong>📊 Coverage</strong> on any row to see WO-wise running balance</em>
        </div>
      )}

      {shortCount>0 && (
        <div style={{background:'#F8D7DA',border:'1px solid #F5C6CB',borderRadius:6,
          padding:'8px 16px',marginBottom:12,fontSize:12,color:'#721C24',fontWeight:600}}>
          ⚠️ {shortCount} material(s) are SHORT — raise POs immediately!
        </div>
      )}

      {/* Filter chips */}
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        {[['All',results.length,'#714B67'],['Short',shortCount,'#DC3545'],['OK',okCount,'#155724']].map(([l,v,c])=>(
          <button key={l} onClick={()=>setFilter(l)}
            style={{padding:'6px 16px',borderRadius:14,fontSize:11,fontWeight:700,
              cursor:'pointer',border:`1.5px solid ${c}`,
              background:filter===l?c:'#F8F4F8',color:filter===l?'#fff':c}}>
            {l} ({v})
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>
          <div style={{fontSize:32}}>⏳</div>Loading MRP results...
        </div>
      ) : results.length===0 ? (
        <div style={{padding:40,textAlign:'center',color:'#6C757D',
          background:'#fff',border:'1.5px solid #E0D5E0',borderRadius:8}}>
          <div style={{fontSize:40,marginBottom:12}}>📊</div>
          No results — run MRP first
          <br/><button className="btn btn-p" style={{marginTop:12}} onClick={()=>nav('/pp/mrp')}>▶ Run MRP</button>
        </div>
      ) : (
        <div style={{background:'#fff',border:'1.5px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
          <table className="fi-data-table">
            <thead>
              <tr>
                <th>Raw Material</th>
                <th style={{textAlign:'right'}}>Total Needed<br/><small style={{fontWeight:400,color:'#999'}}>All WOs</small></th>
                <th style={{textAlign:'right'}}>Already Issued<br/><small style={{fontWeight:400,color:'#999'}}>To production</small></th>
                <th style={{textAlign:'right'}}>Still Needed<br/><small style={{fontWeight:400,color:'#999'}}>Net req.</small></th>
                <th style={{textAlign:'right'}}>In Store<br/><small style={{fontWeight:400,color:'#999'}}>Current</small></th>
                <th style={{textAlign:'right'}}>Stock After<br/><small style={{fontWeight:400,color:'#999'}}>All WOs run</small></th>
                <th style={{textAlign:'right',color:'#DC3545'}}>BUY THIS MUCH<br/><small style={{fontWeight:400,color:'#999'}}>PO qty</small></th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r,i) => {
                const isShort  = r.shortage > 0
                const isRaising= raising===(r.itemCode||r.itemName)
                const key      = r.itemCode||r.itemName
                const isExpand = expanded===key
                const isLoading= covLoading===key

                return (
                  <React.Fragment key={key||i}>
                    {/* ── Main row ── */}
                    <tr style={{background:isShort?'#FFF5F5':i%2===0?'#fff':'#FAFAFA',
                      borderLeft:isExpand?'4px solid #1A5276':'4px solid transparent'}}>
                      <td>
                        <strong style={{fontSize:12}}>{r.itemName}</strong>
                        {r.itemCode && <div style={{fontSize:10,color:'#714B67',fontFamily:'DM Mono,monospace'}}>{r.itemCode}</div>}
                        <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>
                          {(r.wos||[]).length} WO(s): {(r.wos||[]).join(', ')}
                        </div>
                      </td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700}}>
                        {fmtN(r.totalNeeded)} {r.uom}
                      </td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',color:'#6C757D'}}>
                        {fmtN(r.alreadyIssued)} {r.uom}
                      </td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#856404'}}>
                        {fmtN(r.netNeeded)} {r.uom}
                      </td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,
                        color:r.stock>=r.netNeeded?'#155724':'#DC3545'}}>
                        {fmtN(r.stock)} {r.uom}
                      </td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:700,
                        color:r.remaining>0?'#155724':'#DC3545'}}>
                        {r.remaining>0?`${fmtN(r.remaining)} ${r.uom}`:'—'}
                      </td>
                      <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:13,
                        color:r.shortage>0?'#DC3545':'#155724'}}>
                        {r.shortage>0?`🛒 ${fmtN(r.shortage)} ${r.uom}`:'✅ No need'}
                      </td>
                      <td>
                        <span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700,
                          background:isShort?'#F8D7DA':'#D4EDDA',color:isShort?'#721C24':'#155724'}}>
                          {isShort?'⚠ Short':'✅ OK'}
                        </span>
                      </td>
                      <td>
                        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                          {r.shortage>0 && (
                            <button disabled={isRaising} onClick={()=>raisePO(r)}
                              style={{padding:'3px 8px',fontSize:11,fontWeight:700,borderRadius:4,
                                border:'none',background:'#DC3545',color:'#fff',
                                cursor:'pointer',opacity:isRaising?.6:1}}>
                              {isRaising?'⏳':'🛒 PO'}
                            </button>
                          )}
                          <button onClick={()=>loadCoverage(r)} disabled={!!isLoading}
                            style={{padding:'3px 10px',fontSize:11,fontWeight:700,borderRadius:4,
                              border:'1.5px solid #1A5276',
                              background:isExpand?'#1A5276':'#fff',
                              color:isExpand?'#fff':'#1A5276',cursor:'pointer',
                              opacity:isLoading?.7:1}}>
                            {isLoading?'⏳':'📊'} {isExpand?'Hide':'Coverage'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── Inline Coverage Expand Row ── */}
                    {isExpand && coverage[key] && (() => {
                      const cov = coverage[key]
                      return (
                        <tr>
                          <td colSpan={9} style={{padding:0,background:'#F0F7FF',
                            borderTop:'2px solid #1A5276',borderBottom:'2px solid #1A5276'}}>
                            <div style={{padding:'14px 20px'}}>

                              {/* Coverage header */}
                              <div style={{display:'flex',justifyContent:'space-between',
                                alignItems:'center',marginBottom:10,flexWrap:'wrap',gap:8}}>
                                <div style={{fontWeight:700,fontSize:13,color:'#1A5276'}}>
                                  📊 Coverage Plan — {r.itemName}
                                </div>
                                <div style={{display:'flex',gap:16,fontSize:12}}>
                                  <span>Opening Stock: <strong style={{color:'#1A5276',
                                    fontFamily:'DM Mono,monospace'}}>{fmtN(r.stock)} {r.uom}</strong></span>
                                  {cov.pipeline?.length>0 && (
                                    <span style={{color:'#856404'}}>
                                      🚛 Pipeline PO: +{fmtN(cov.pipeline.reduce((s,p)=>s+p.qty,0))} {r.uom}
                                    </span>
                                  )}
                                  <span style={{color:'#6C757D',fontStyle:'italic',fontSize:11}}>
                                    Green = covered · Yellow = pipeline covers · Red = buy now
                                  </span>
                                </div>
                              </div>

                              {cov.rows.length===0 ? (
                                <div style={{padding:20,textAlign:'center',color:'#6C757D',fontSize:12}}>
                                  No Work Orders found for this material.
                                </div>
                              ) : (
                                <table style={{width:'100%',borderCollapse:'collapse',
                                  background:'#fff',borderRadius:8,overflow:'hidden',
                                  border:'1px solid #AED6F1'}}>
                                  <thead>
                                    <tr style={{background:'#1A5276',color:'#fff'}}>
                                      {['Work Order','FG Item','Delivery Date','Need ↓',
                                        'Balance Before','Balance After','Shortfall',
                                        'Pipeline PO','Status'].map(h=>(
                                        <th key={h} style={{padding:'8px 12px',fontSize:11,
                                          textAlign:['Need ↓','Balance Before','Balance After','Shortfall'].includes(h)?'right':'left',
                                          fontWeight:700}}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cov.rows.map((row, ri) => {
                                      const bg = row.status==='OK'?'#fff'
                                               : row.status==='Pipeline'?'#FFFBF0':'#FFF5F5'
                                      const daysAway = row.soDate
                                        ? Math.ceil((new Date(row.soDate)-new Date())/86400000) : null

                                      return (
                                        <tr key={ri}
                                          style={{background:ri%2===0?bg:(bg==='#fff'?'#FAFAFA':bg),
                                            borderLeft:`4px solid ${row.status==='OK'?'#28A745':row.status==='Pipeline'?'#FFC107':'#DC3545'}`}}>
                                          <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',
                                            fontSize:12,fontWeight:700,color:'#714B67'}}>
                                            {row.woNo}
                                          </td>
                                          <td style={{padding:'9px 12px',fontSize:12}}>
                                            {row.woItem}
                                            <div style={{fontSize:10,color:'#6C757D'}}>
                                              Qty: {fmtN(row.woQty)} pcs
                                            </div>
                                          </td>
                                          <td style={{padding:'9px 12px',fontSize:12}}>
                                            {fmtD(row.soDate)}
                                            {daysAway!=null && (
                                              <div style={{fontSize:10,
                                                color:daysAway<7?'#DC3545':daysAway<30?'#856404':'#6C757D'}}>
                                                {daysAway} days away
                                              </div>
                                            )}
                                          </td>
                                          <td style={{padding:'9px 12px',textAlign:'right',
                                            fontFamily:'DM Mono,monospace',fontWeight:700,color:'#856404'}}>
                                            ↓ {fmtN(row.need)} {r.uom}
                                          </td>
                                          <td style={{padding:'9px 12px',textAlign:'right',
                                            fontFamily:'DM Mono,monospace',color:'#6C757D'}}>
                                            {fmtN(row.before)} {r.uom}
                                          </td>
                                          <td style={{padding:'9px 12px',textAlign:'right',
                                            fontFamily:'DM Mono,monospace',fontWeight:700,
                                            color:row.after>0?'#155724':'#DC3545'}}>
                                            {fmtN(row.after)} {r.uom}
                                          </td>
                                          <td style={{padding:'9px 12px',textAlign:'right',
                                            fontFamily:'DM Mono,monospace',fontWeight:700,color:'#DC3545'}}>
                                            {row.short>0?`${fmtN(row.short)} ${r.uom}`:'—'}
                                          </td>
                                          <td style={{padding:'9px 12px',fontSize:11,
                                            color:row.pipeCovered?'#856404':row.short>0?'#DC3545':'#6C757D'}}>
                                            {row.pipeCovered?`🚛 ${row.pipeInfo}`
                                            :row.short>0?'❌ Raise PO':'—'}
                                          </td>
                                          <td style={{padding:'9px 12px',textAlign:'center'}}>
                                            <span style={{display:'inline-block',
                                              padding:'5px 12px',borderRadius:8,
                                              fontWeight:800,fontSize:12,minWidth:80,
                                              background:row.status==='OK'?'#28A745'
                                                :row.status==='Pipeline'?'#FFC107':'#DC3545',
                                              color:row.status==='Pipeline'?'#000':'#fff'}}>
                                              {row.status==='OK'?'✅ OK'
                                              :row.status==='Pipeline'?'🚛 Pipeline'
                                              :'❌ SHORT'}
                                            </span>
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                  <tfoot>
                                    <tr style={{background:'#1A5276',color:'#fff',fontWeight:700}}>
                                      <td colSpan={5} style={{padding:'9px 12px',fontSize:12}}>
                                        Final Balance after all Work Orders
                                      </td>
                                      <td style={{padding:'9px 12px',textAlign:'right',
                                        fontFamily:'DM Mono,monospace',fontSize:14}}>
                                        {fmtN(Math.max(0,cov.finalBalance))} {r.uom}
                                      </td>
                                      <td style={{padding:'9px 12px',textAlign:'right',
                                        fontFamily:'DM Mono,monospace',fontSize:12,
                                        color:r.shortage>0?'#FFCCCC':'#CCFFCC'}}>
                                        {r.shortage>0?`Buy ${fmtN(r.shortage)} ${r.uom}`:'✅ No purchase needed'}
                                      </td>
                                      <td colSpan={2} style={{padding:'9px 12px',fontSize:12,
                                        color:cov.finalBalance>=0?'#CCFFCC':'#FFCCCC'}}>
                                        {cov.finalBalance>=0
                                          ?`✅ All ${cov.rows.length} WO(s) covered from current stock`
                                          :`⚠️ Raise PO — short by ${fmtN(Math.abs(cov.finalBalance))} ${r.uom}`}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })()}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>

          {/* Pagination footer */}
          {results.length>0 && (
            <div style={{padding:'10px 16px',background:'#F8F4F8',fontSize:12,
              color:'#6C757D',display:'flex',justifyContent:'space-between'}}>
              <span>{filtered.length} material(s) shown</span>
              <span>{shortCount>0?`${shortCount} need purchase`:'All covered ✅'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
