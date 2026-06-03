import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE   = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok    = () => localStorage.getItem('lnv_token')
const hdr2   = () => ({ Authorization: `Bearer ${tok()}` })
const hdrJ   = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` })
const api    = (path) => fetch(`${BASE}${path}`, { headers: hdr2() }).then(r => r.json())

// Generic inspection params — used when no quality checksheet found for item
const GENERIC_PARAMS = [
  { param: 'Visual Inspection',       spec: 'No cracks, scratches, deformity', unit: 'Pass/Fail', limit_lo: 1, limit_hi: 1, isText: true },
  { param: 'Quantity Verification',   spec: 'As per PO/DC',                    unit: 'Pass/Fail', limit_lo: 1, limit_hi: 1, isText: true },
  { param: 'Dimensional Check',       spec: 'Within ± tolerance',              unit: 'Pass/Fail', limit_lo: 1, limit_hi: 1, isText: true },
  { param: 'Surface Finish',          spec: 'No flash, sink marks',            unit: 'Pass/Fail', limit_lo: 1, limit_hi: 1, isText: true },
  { param: 'Color / Appearance',      spec: 'As per approved sample',          unit: 'Pass/Fail', limit_lo: 1, limit_hi: 1, isText: true },
  { param: 'Labelling / Marking',     spec: 'Correct label, legible',          unit: 'Pass/Fail', limit_lo: 1, limit_hi: 1, isText: true },
  { param: 'Packaging Condition',     spec: 'Sealed, no damage',               unit: 'Pass/Fail', limit_lo: 1, limit_hi: 1, isText: true },
]

const SOURCES = ['MM — Incoming GRN', 'PP — Production WO', 'SD — Pre-shipment']

export default function InspectionNew() {
  const nav       = useNavigate()
  const { id }      = useParams()
  const [searchParams] = useSearchParams()
  const preWoId    = searchParams.get('woId')
  const preWoNo    = searchParams.get('woNo')
  const preItemCode= searchParams.get('itemCode')
  const preItemName= searchParams.get('itemName')
  const preLotQty  = searchParams.get('qty')

  // ── State ─────────────────────────────────────────
  const [lotNo,       setLotNo]       = useState('Auto-generated')
  const [source,      setSource]      = useState('MM — Incoming GRN')
  const [grns,        setGRNs]        = useState([])
  const [wos,         setWOs]         = useState([])   // for PP source
  const [selGRN,      setSelGRN]      = useState(null)
  const [selLineIdx,  setSelLineIdx]  = useState(0)   // which GRN line being inspected
  const [inspectors,  setInspectors]  = useState([])
  const [checksheets, setChecksheets] = useState([])
  const [tests,       setTests]       = useState([])
  const [remarks,     setRemarks]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saved,        setSaved]       = useState(false)
  const [savedLotNo,   setSavedLotNo]  = useState('')
  const [inspectedLines, setInspectedLines] = useState({}) // { lineIdx: lotNo }
  const [showNext,     setShowNext]    = useState(-1)  // index of next uninspected line

  const [hdr, setHdr] = useState({
    inspDate:    new Date().toISOString().split('T')[0],
    inspector:   '',
    refType:     '',
    refNo:       '',
    refId:       '',
    vendorName:  '',
    vendorCode:  '',
    itemCode:    '',
    itemName:    '',
    lotQty:      '',
    unit:        'Nos',
    batchNo:     '',
    qualityPlan: '',
    acceptedQty: '',
    rejectedQty: '',
  })

  // ── On mount ───────────────────────────────────────
  useEffect(() => {
    // Lot number
    api('/qm/inspection/next-no')
      .then(d => setLotNo(d.lotNo || 'QIL-AUTO'))
      .catch(() => {})

    // Pending GRNs
    api('/qm/pending-grns')
      .then(d => setGRNs(d.data || []))
      .catch(() => {})

    // Inspectors
    api('/qm/inspectors')
      .then(d => setInspectors(d.data || []))
      .catch(() => {})

    // Quality checksheets
    api('/qm/checksheets')
      .then(d => setChecksheets(d.data || []))
      .catch(() => {})

    // PP Work Orders — for PP source inspection
    // Fetch WOs and inspection lots together
    Promise.all([
      fetch(`${BASE}/pp/wo?_t=${Date.now()}`, { headers: hdr2() }).then(r=>r.json()),
      fetch(`${BASE}/qm/inspection?_t=${Date.now()}`, { headers: hdr2() }).then(r=>r.json()).catch(()=>({data:[]})),
    ]).then(([woD, insD]) => {
      const all  = woD.data  || []
      const lots = insD.data || []
      // Get WO nos that have ACCEPTED inspection and full qty inspected
      const inspectedWOs = new Set(
        lots
          .filter(l => l.result === 'PASS' || l.result === 'ACCEPTED')
          .map(l => l.refNo)
      )
      // Show WOs with producedQty > 0 that still need inspection
      // (can re-inspect partial — show if uninspected qty remains)
      setWOs(all.filter(w =>
        parseFloat(w.producedQty||0) > 0
      ))
    }).catch(() => {})

    // If editing existing inspection
    if (id) {
      api(`/qm/inspection/${id}`)
        .then(d => {
          if (!d.data) return
          const ins = d.data
          setHdr(p => ({
            ...p,
            inspDate:    ins.inspDate?.split('T')[0] || p.inspDate,
            inspector:   ins.inspector   || '',
            refType:     ins.refType     || '',
            refNo:       ins.refNo       || '',
            refId:       String(ins.refId || ''),
            vendorName:  ins.vendorName  || '',
            vendorCode:  ins.vendorCode  || '',
            itemCode:    ins.itemCode    || '',
            itemName:    ins.itemName    || '',
            lotQty:      String(ins.lotQty || ''),
            unit:        ins.unit        || 'Nos',
            batchNo:     ins.batchNo     || '',
            qualityPlan: ins.qualityPlan || '',
            acceptedQty: String(ins.passQty || ''),
            rejectedQty: String(ins.failQty || ''),
          }))
          setLotNo(ins.lotNo || lotNo)
          setRemarks(ins.remarks || '')
          if (ins.tests?.length) {
            setTests(ins.tests.map((t, i) => ({
              id: i, param: t.paramName, spec: t.spec || '',
              unit: t.unit || '', result: t.result || '',
              limit_lo: parseFloat(t.limit_lo || 0),
              limit_hi: parseFloat(t.limit_hi || 9999),
              isText: t.isText || false,
              status: t.status || 'PENDING',
            })))
          }
          setSource('MM — Incoming GRN')
        })
        .catch(() => {})
    } else {
      // Start with empty — user must select GRN to load checksheet
      setTests([])
    }
  }, [id])

  // ── Load GRN ──────────────────────────────────────
  // Auto-fill from URL params when wos are loaded
  useEffect(() => {
    if (!preWoId && !preWoNo) return
    // Set source to PP
    setSource('PP — Production WO')
    // Pre-fill header
    setHdr(p => ({
      ...p,
      refId:    preWoId    || '',
      refNo:    preWoNo    || '',
      itemCode: preItemCode|| '',
      itemName: decodeURIComponent(preItemName||''),
      lotQty:   preLotQty  || '',
      unit:     'Nos',
    }))
    // Auto-load QP if itemCode available
    if (preItemCode) {
      fetch(`${BASE}/qm/quality-plan?itemCode=${encodeURIComponent(preItemCode)}`,
        { headers: hdr2() })
        .then(r=>r.json())
        .then(d => {
          const plans = d.data || []
          const matched = plans.find(p => p.itemCode === preItemCode) || plans[0]
          if (matched) {
            setHdr(p => ({...p, qualityPlan: matched.planNo}))
            const ops = Array.isArray(matched.operations)
              ? matched.operations : JSON.parse(matched.operations||'[]')
            const params = ops.flatMap(op =>
              (op.chars||[]).map(ch => ({
                param: ch.shortText, spec: '',
                unit: ch.uom||'Pass/Fail',
                result: '', status: 'PENDING',
              }))
            )
            if (params.length > 0) setTests(params)
          }
        }).catch(()=>{})
    }
  }, [preWoId, preWoNo, wos.length]) // trigger when wos loaded

  // Manual load quality plan
  const loadQualityPlan = async () => {
    const itemCode = hdr.itemCode
    const itemName = hdr.itemName
    if (!itemCode && !itemName) return toast.error('Select a WO or item first')
    try {
      // Try direct quality-plan endpoint first (most reliable)
      const r1 = await fetch(
        `${BASE}/qm/quality-plan?itemCode=${encodeURIComponent(itemCode||'')}`,
        { headers: hdr2() }
      )
      const d1 = await r1.json()
      const plans = d1.data || []

      // Find best match
      let matched = plans.find(p => p.itemCode === itemCode)
        || plans.find(p => (p.material||'').toLowerCase().includes((itemName||'').toLowerCase().slice(0,10)))
        || plans[0]

      if (matched) {
        const ops = Array.isArray(matched.operations)
          ? matched.operations
          : JSON.parse(matched.operations||'[]')
        const params = ops.flatMap(op =>
          (op.chars||[]).map(ch => ({
            param:    ch.shortText,
            spec:     `${ch.lowerLimit||''}${ch.lowerLimit&&ch.upperLimit?' – ':''}${ch.upperLimit||''}`,
            unit:     ch.uom || 'Pass/Fail',
            limit_lo: ch.lowerLimit ? parseFloat(ch.lowerLimit) : null,
            limit_hi: ch.upperLimit ? parseFloat(ch.upperLimit) : null,
            isText:   ch.category === 'Qualitative',
            result:   '',
            status:   'PENDING',
          }))
        )
        setHdr(p => ({...p, qualityPlan: matched.planNo}))
        if (params.length > 0) {
          setTests(params)
          toast.success(`✅ ${matched.planNo} loaded — ${params.length} test parameters`)
        } else {
          toast(`${matched.planNo} found but no characteristics. Add them in Quality Plans.`, {icon:'⚠️'})
        }
        return
      }

      // Fallback: checksheets endpoint
      const r2 = await fetch(
        `${BASE}/qm/checksheets?itemCode=${encodeURIComponent(itemCode||'')}&itemName=${encodeURIComponent(itemName||'')}`,
        { headers: hdr2() }
      )
      const d2 = await r2.json()
      if (d2.matched) {
        setHdr(p => ({...p, qualityPlan: d2.matched.planNo || d2.matched.name || ''}))
        const params = (d2.matched.parameters||[]).map(p => ({...p,result:'',status:'PENDING'}))
        if (params.length > 0) {
          setTests(params)
          toast.success(`Quality Plan loaded — ${params.length} params`)
        }
      } else {
        toast.error('No Quality Plan found for this item. Create one in Quality → Planning → Quality Plans')
      }
    } catch(e) { toast.error(`Failed: ${e.message}`) }
  }

  const loadGRN = (grnId) => {
    const g = grns.find(g => g.id === parseInt(grnId))
    if (!g) return
    setSelGRN(g)
    setSelLineIdx(0)
    loadGRNLine(g, 0)
    toast.success(`GRN ${g.grnNo} loaded — ${g.lines?.length || 0} item(s)`)
  }

  const loadGRNLine = (g, lineIdx) => {
    const line = g?.lines?.[lineIdx]
    if (!line) return
    setHdr(p => ({
      ...p,
      refType:    'GRN',
      refNo:      g.grnNo,
      refId:      String(g.id),
      vendorName: g.vendorName || '',
      vendorCode: g.vendorCode || '',
      itemCode:   line.itemCode || '',
      itemName:   line.itemName || '',
      lotQty:     String(parseFloat(line.receivedQty || 0)),
      unit:       line.uom || line.unit || 'Nos',
      batchNo:    line.batchNo || '',
      // Default: all accepted, none rejected
      acceptedQty: String(parseFloat(line.receivedQty || 0)),
      rejectedQty: '0',
    }))

    // Load checksheet for this item
    loadChecksheet(line.itemCode, line.itemName)
  }

  const loadChecksheet = (itemCode, itemName) => {
    if (!itemCode && !itemName) {
      setTests(GENERIC_PARAMS.map((t, i) => ({ ...t, id: i, result: '' })))
      return
    }

    api(`/qm/checksheets?itemCode=${encodeURIComponent(itemCode||'')}&itemName=${encodeURIComponent(itemName||'')}`)
      .then(d => {
        const matched = d.matched
        if (matched?.parameters?.length) {
          // Use checksheet parameters
          const params = Array.isArray(matched.parameters)
            ? matched.parameters
            : JSON.parse(matched.parameters || '[]')
          setTests(params.map((p, i) => ({
            id: i,
            param:    p.param    || p.paramName || p.name || '',
            spec:     p.spec     || p.specification || '',
            unit:     p.unit     || '',
            result:   '',
            limit_lo: parseFloat(p.limit_lo || p.limitLo || 0),
            limit_hi: parseFloat(p.limit_hi || p.limitHi || 9999),
            isText:   p.isText   || false,
          })))
          setHdr(p => ({ ...p, qualityPlan: matched.code + ' · ' + matched.name }))
          toast(`Quality checksheet loaded: ${matched.name}`, { icon: '📋' })
        } else {
          // No checksheet found — leave empty, user creates Q plan first
          setTests([])
          setHdr(p => ({ ...p, qualityPlan: '' }))
          toast('No quality plan found for this item. Add one in Quality Plans.', { icon: '⚠️' })
        }
      })
      .catch(() => {
        setTests([])
      })
  }

  // ── Test result logic ──────────────────────────────
  const updTest  = (id, val) =>
    setTests(prev => prev.map(t => t.id === id ? { ...t, result: val } : t))

  const getStatus = (t) => {
    if (!t.result) return null
    if (t.isText) return ['pass','ok','yes','good','acceptable','✓'].includes(
      t.result.toLowerCase().trim()) ? 'pass' : 'fail'
    const v = parseFloat(t.result)
    if (isNaN(v)) return null
    return v >= t.limit_lo && v <= t.limit_hi ? 'pass' : 'fail'
  }

  const allTested   = tests.length > 0 && tests.every(t => t.result !== '')
  const failCount   = tests.filter(t => getStatus(t) === 'fail').length
  const passCount   = tests.filter(t => getStatus(t) === 'pass').length
  const overallResult = allTested
    ? failCount === 0 ? 'PASS' : failCount <= 1 ? 'REVIEW' : 'FAIL'
    : 'PENDING'

  // ── Save ──────────────────────────────────────────
  const save = async () => {
    if (!hdr.itemName)  return toast.error('Select a GRN line to inspect!')
    if (!hdr.inspDate)  return toast.error('Inspection date required!')
    // Validate accepted + rejected <= lot qty
    const lotQtyN   = parseFloat(hdr.lotQty   || 0)
    const acceptedN = parseFloat(hdr.acceptedQty || lotQtyN)
    const rejectedN = parseFloat(hdr.rejectedQty || 0)
    if (lotQtyN > 0 && (acceptedN + rejectedN) > lotQtyN) {
      return toast.error(`Accepted (${acceptedN}) + Rejected (${rejectedN}) exceeds Lot Qty (${lotQtyN} ${hdr.unit})`)
    }
    setSaving(true)
    try {
      const lotQty = parseFloat(hdr.lotQty || 0)
      const sampleQty = Math.ceil(lotQty * 0.05)
      const passQty = hdr.acceptedQty ? parseFloat(hdr.acceptedQty) : lotQty * passCount / Math.max(tests.length, 1)
      const failQty = hdr.rejectedQty ? parseFloat(hdr.rejectedQty) : lotQty * failCount / Math.max(tests.length, 1)

      const payload = {
        ...hdr,
        source:     source.split(' ')[0],
        refId:      hdr.refId ? parseInt(hdr.refId) : null,
        lotQty,
        sampleQty,
        passQty,
        failQty,
        yieldPct:   lotQty > 0 ? Math.round((passQty / lotQty) * 100) : 0,
        result:     overallResult,
        status:     'CLOSED',
        remarks,
        inspector:  hdr.inspector,
        tests: tests.map(t => ({
          paramName: t.param,
          spec:      t.spec,
          unit:      t.unit,
          limit_lo:  t.limit_lo,
          limit_hi:  t.limit_hi,
          isText:    t.isText || false,
          result:    t.result,
          status:    getStatus(t) === 'pass' ? 'PASS'
                   : getStatus(t) === 'fail' ? 'FAIL' : 'PENDING',
        }))
      }

      const url    = id ? `${BASE}/qm/inspection/${id}` : `${BASE}/qm/inspection`
      const method = id ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: hdrJ(), body: JSON.stringify(payload) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error)

      const savedLot = data.data?.lotNo || lotNo

      // PP Source + PASS/ACCEPTED/PARTIAL → post FG to stock automatically
      if (source.startsWith('PP') && (overallResult === 'PASS' || overallResult === 'ACCEPTED' || overallResult === 'PARTIAL_ACCEPT')) {
        const passQtyFG = parseFloat(hdr.acceptedQty || hdr.lotQty || 0)
        if (passQtyFG > 0) {
          try {
            await fetch(`${BASE}/wm/goods-receipt`, {
              method: 'POST',
              headers: hdrJ(),
              body: JSON.stringify({
                grnNo:       `FG-QC-${savedLot}`,
                woNo:        hdr.refNo,
                movType:     '131 — FG Receipt from Production',
                recLocation: 'FG-STORE',
                receivedBy:  hdr.inspector,
                remarks:     `FG receipt after QC inspection ${savedLot} — WO ${hdr.refNo}`,
                lines: [{
                  itemCode: hdr.itemCode,
                  itemName: hdr.itemName,
                  recQty:   passQtyFG,
                  uom:      hdr.unit || 'Nos',
                  batchNo:  `BATCH-${hdr.refNo}`,
                }]
              })
            })
            toast.success(`✅ ${passQtyFG} ${hdr.unit} posted to FG Store after QC pass!`)
          } catch (e) {
            toast.error(`FG posting failed: ${e.message}`)
          }
        }
      }

      // Track this line as inspected
      const updatedInspected = { ...inspectedLines, [selLineIdx]: savedLot }
      setInspectedLines(updatedInspected)

      const totalLines = selGRN?.lines?.length || 1
      const doneCount  = Object.keys(updatedInspected).length
      const allDone    = doneCount >= totalLines

      // Update GRN status
      if (hdr.refId && hdr.refType === 'GRN') {
        const grnStatus = allDone
          ? (overallResult === 'PASS' ? 'ACCEPTED' : overallResult === 'FAIL' ? 'REJECTED' : 'PARTIAL_ACCEPT')
          : 'QC_PENDING'
        await fetch(`${BASE}/mm/grn/${hdr.refId}/status`,
          { method: 'PATCH', headers: hdrJ(),
            body: JSON.stringify({ status: grnStatus }) })
          .catch(() => {})
      }

      if (!allDone && selGRN) {
        // Find next uninspected line
        const nextIdx = selGRN.lines.findIndex((_, i) => updatedInspected[i] === undefined)
        toast.success(`✅ ${savedLot} saved! Switching to next item...`)
        // Stay on form — auto-switch to next item
        setTimeout(() => {
          setTests([])
          setSelLineIdx(nextIdx)
          loadGRNLine(selGRN, nextIdx)
          setHdr(p => ({ ...p, acceptedQty: '', rejectedQty: '' }))
          setRemarks('')
        }, 800)
        return
      }

      // All items done
      setSavedLotNo(savedLot)
      toast.success(data.message || `All ${totalLines} item(s) inspected!`)
      setSaved(true)
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ── Saved screen ──────────────────────────────────
  if (saved) {
    const icon  = overallResult === 'PASS' ? '✅' : overallResult === 'REVIEW' ? '⚠️' : '❌'
    const color = overallResult === 'PASS' ? '#155724' : overallResult === 'REVIEW' ? '#856404' : '#721C24'
    const bg    = overallResult === 'PASS' ? '#D4EDDA' : overallResult === 'REVIEW' ? '#FFF3CD' : '#F8D7DA'
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
        padding:'60px 20px', gap:16 }}>
        <div style={{ fontSize:56 }}>{icon}</div>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color }}>
          {savedLotNo} — {overallResult}
        </div>
        <div style={{ fontSize:13, color:'#6C757D', textAlign:'center' }}>
          <strong>{hdr.itemName}</strong> · {hdr.lotQty} {hdr.unit} inspected<br/>
          {passCount} parameters passed · {failCount} failed
          {hdr.vendorName && <> · Vendor: {hdr.vendorName}</>}
        </div>
        <div style={{ display:'flex', gap:12, padding:'12px 20px',
          background: bg, borderRadius:8, marginTop:8, fontSize:13, color }}>
          Accepted: <strong>{hdr.acceptedQty || hdr.lotQty} {hdr.unit}</strong>
          &nbsp;|&nbsp;
          Rejected: <strong>{hdr.rejectedQty || 0} {hdr.unit}</strong>
        </div>
        {/* Show inspected items summary */}
        {Object.keys(inspectedLines).length > 0 && selGRN && (
          <div style={{ background:'#F8F9FA', borderRadius:8, padding:'10px 16px',
            fontSize:12, color:'#495057', marginTop:4 }}>
            <strong>Inspected so far:</strong>
            {selGRN.lines?.map((line, idx) => (
              <div key={idx} style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
                <span>{inspectedLines[idx] ? '✅' : '⏳'}</span>
                <span>{line.itemName}</span>
                {inspectedLines[idx] && (
                  <span style={{ color:'#6C757D', fontFamily:'DM Mono,monospace' }}>
                    → {inspectedLines[idx]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Inspect next item button */}
        {showNext >= 0 && selGRN?.lines?.[showNext] && (
          <button className="btn btn-p sd-bsm"
            style={{ background:'#714B67' }}
            onClick={() => {
              setSaved(false)
              setSelLineIdx(showNext)
              loadGRNLine(selGRN, showNext)
              setTests([])
            }}>
            ▶ Inspect Next: {selGRN.lines[showNext]?.itemName}
          </button>
        )}

        {(overallResult === 'FAIL' || overallResult === 'REVIEW') && (
          <button className="btn btn-p sd-bsm"
            onClick={() => nav('/qm/ncr/new')}>
            🚨 Raise NCR
          </button>
        )}
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-s sd-bsm"
            onClick={() => nav('/qm/inspection')}>
            ← Inspection List
          </button>
          <button className="btn btn-s sd-bsm"
            onClick={() => {
              setSaved(false)
              setTests([])
              setSelGRN(null)
              setInspectedLines({})
              setShowNext(false)
              setHdr(p => ({ ...p, refId:'', refNo:'', itemName:'', itemCode:'',
                lotQty:'', vendorName:'', acceptedQty:'', rejectedQty:'' }))
            }}>
            + New Inspection
          </button>
        </div>
      </div>
    )
  }

  const curLine = selGRN?.lines?.[selLineIdx]

  return (
    <div>
      {/* Header bar */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          New Inspection Lot <small>QA01 · Inspection Recording</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm"
            onClick={() => nav('/qm/inspection')}>Cancel</button>
          <button className="btn btn-p sd-bsm"
            disabled={saving} onClick={save}>
            {saving ? '⏳ Saving...' : '💾 Save & Result'}
          </button>
        </div>
      </div>

      {/* ── Inspection Header ── */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📋 Inspection Header</div>
        <div className="fi-form-sec-body">
          {/* Row 1 */}
          <div className="fi-form-row">
            <div className="fi-form-grp">
              <label>Lot No.</label>
              <input className="fi-form-ctrl" value={lotNo} readOnly
                style={{ background:'#F8F9FA', fontFamily:'DM Mono,monospace',
                  fontWeight:700 }} />
            </div>
            <div className="fi-form-grp">
              <label>Inspection Date <span>*</span></label>
              <input type="date" className="fi-form-ctrl"
                value={hdr.inspDate}
                onChange={e => setHdr(p => ({ ...p, inspDate: e.target.value }))} />
            </div>
            <div className="fi-form-grp">
              <label>Inspector</label>
              {inspectors.length > 0 ? (
                <select className="fi-form-ctrl"
                  value={hdr.inspector}
                  onChange={e => setHdr(p => ({ ...p, inspector: e.target.value }))}>
                  <option value="">-- Select Inspector --</option>
                  {inspectors.map(ins => (
                    <option key={ins.id} value={ins.name}>{ins.label}</option>
                  ))}
                </select>
              ) : (
                <input className="fi-form-ctrl"
                  value={hdr.inspector}
                  onChange={e => setHdr(p => ({ ...p, inspector: e.target.value }))}
                  placeholder="Inspector name" />
              )}
            </div>
          </div>

          {/* Row 2 */}
          <div className="fi-form-row">
            <div className="fi-form-grp">
              <label>Source <span>*</span></label>
              <select className="fi-form-ctrl"
                value={source}
                onChange={e => setSource(e.target.value)}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="fi-form-grp">
              <label>Reference GRN <span>*</span></label>
              {source.startsWith('MM') ? (
                <select className="fi-form-ctrl"
                  value={hdr.refId}
                  onChange={e => { if (e.target.value) loadGRN(e.target.value) }}>
                  <option value="">-- Select GRN --</option>
                  {grns.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.grnNo} · {g.vendorName} · {g.lines?.length || 0} item(s)
                    </option>
                  ))}
                </select>
              ) : source.startsWith('PP') ? (
                <select className="fi-form-ctrl"
                  value={hdr.refId}
                  onChange={async e => {
                    const wo = wos.find(w => String(w.id) === e.target.value)
                    if (!wo) return
                    // lotQty = producedQty (editable — user can adjust for this batch)
                    const produced = parseFloat(wo.producedQty||0)
                    setHdr(p => ({
                      ...p,
                      refId:    String(wo.id),
                      refNo:    wo.woNo,
                      itemCode: wo.itemCode || '',
                      itemName: wo.itemName || '',
                      lotQty:   String(produced),
                      unit:     wo.uom || 'Nos',
                    }))
                    // Auto-load Quality Plan for this item
                    if (wo.itemCode || wo.itemName) {
                      try {
                        const r = await fetch(
                          `${BASE}/qm/checksheets?itemCode=${encodeURIComponent(wo.itemCode||'')}&itemName=${encodeURIComponent(wo.itemName||'')}`,
                          { headers: hdr2() }
                        )
                        const d = await r.json()
                        if (d.matched) {
                          setHdr(p => ({...p, qualityPlan: d.matched.planNo || d.matched.name || ''}))
                          const params = d.matched.parameters || []
                          if (params.length > 0) {
                            setTests(params.map(p => ({ ...p, result:'', status:'PENDING' })))
                          }
                        }
                      } catch {}
                    }
                  }}>
                  <option value="">-- Select Work Order --</option>
                  {wos.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.woNo} · {w.itemName} · {parseFloat(w.producedQty||0)} {w.uom} produced
                    </option>
                  ))}
                </select>
              ) : (
                <input className="fi-form-ctrl"
                  value={hdr.refNo}
                  onChange={e => setHdr(p => ({ ...p, refNo: e.target.value }))}
                  placeholder="WO / DO number" />
              )}
            </div>

            <div className="fi-form-grp">
              <label>Quality Plan</label>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <input className="fi-form-ctrl"
                  value={hdr.qualityPlan}
                  onChange={e => setHdr(p => ({ ...p, qualityPlan: e.target.value }))}
                  placeholder="Auto-loaded from checksheet"
                  style={{ background:'#F8F9FA', fontSize:11, flex:1 }} />
                <button type="button"
                  onClick={loadQualityPlan}
                  style={{padding:'5px 10px',fontSize:11,fontWeight:700,
                    background:'#714B67',color:'#fff',border:'none',
                    borderRadius:5,cursor:'pointer',whiteSpace:'nowrap'}}>
                  🔍 Load QP
                </button>
              </div>
            </div>
          </div>

          {/* GRN line selector (when GRN has multiple items) */}
          {selGRN?.lines?.length > 1 && (
            <div className="fi-form-row">
              <div className="fi-form-grp" style={{ gridColumn:'1 / -1' }}>
                <label>Select Item to Inspect</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {selGRN.lines.map((line, idx) => {
                    const isDone    = !!inspectedLines[idx]
                    const isCurrent = selLineIdx === idx
                    return (
                      <button key={idx}
                        onClick={() => {
                          if (isDone) return // can't re-inspect
                          setSelLineIdx(idx)
                          loadGRNLine(selGRN, idx)
                        }}
                        style={{
                          padding:'6px 14px', borderRadius:6, fontSize:12,
                          cursor: isDone ? 'not-allowed' : 'pointer',
                          fontWeight: isCurrent ? 700 : 400,
                          background: isDone    ? '#D4EDDA'
                                    : isCurrent ? '#714B67' : '#F8F4F8',
                          color:      isDone    ? '#155724'
                                    : isCurrent ? '#fff'    : '#714B67',
                          border: `1.5px solid ${
                            isDone    ? '#C3E6CB'
                          : isCurrent ? '#714B67' : '#E0D5E0'}`,
                          opacity: isDone ? 0.85 : 1,
                        }}>
                        {isDone ? '✅' : isCurrent ? '🔬' : '⏳'} {idx + 1}. {line.itemName}
                        <span style={{ marginLeft:6, opacity:.7, fontSize:10 }}>
                          {isDone
                            ? inspectedLines[idx]
                            : `${parseFloat(line.receivedQty||0)} ${line.uom||'Nos'}`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Row 3 — Item details (auto-filled from GRN) */}
          <div className="fi-form-row" style={{
            background:'#F8F4F8', border:'1px solid #E0D5E0',
            borderRadius:8, padding:'10px 14px', margin:'4px 0' }}>
            <div className="fi-form-grp">
              <label>Item / Material</label>
              <input className="fi-form-ctrl"
                value={hdr.itemName}
                onChange={e => setHdr(p => ({ ...p, itemName: e.target.value }))}
                placeholder="Item name (auto-filled from GRN)"
                style={{ fontWeight:600 }} />
            </div>
            <div className="fi-form-grp">
              <label>Vendor</label>
              <input className="fi-form-ctrl"
                value={hdr.vendorName} readOnly
                style={{ background:'#F8F9FA', color:'#6C757D' }} />
            </div>
            <div className="fi-form-grp">
              <label>Lot Qty & UOM
                <span style={{fontSize:10,color:'#856404',fontWeight:400,marginLeft:6}}>
                  (Enter qty being inspected in this batch)
                </span>
              </label>
              <div style={{ display:'flex', gap:8 }}>
                <input type="number" className="fi-form-ctrl" style={{ flex:2 }}
                  value={hdr.lotQty}
                  onChange={e => setHdr(p => ({ ...p, lotQty: e.target.value }))} />
                <input className="fi-form-ctrl" style={{ flex:1,
                  background:'#F1F8E9', color:'#2E7D32', fontWeight:700,
                  textAlign:'center' }}
                  value={hdr.unit} readOnly />
              </div>
              {source.startsWith('PP') && hdr.lotQty && (
                <div style={{fontSize:10,color:'#6C757D',marginTop:3}}>
                  ℹ️ Adjust qty if not all produced pcs go for QC at once
                </div>
              )}
            </div>
          </div>

          {/* Row 4 — Accepted/Rejected Qty with validation */}
          {(() => {
            const lotQtyN   = parseFloat(hdr.lotQty || 0)
            const acceptedN = parseFloat(hdr.acceptedQty || 0)
            const rejectedN = parseFloat(hdr.rejectedQty || 0)
            const totalN    = acceptedN + rejectedN
            const overLimit = totalN > lotQtyN && lotQtyN > 0
            const notFull   = totalN < lotQtyN && lotQtyN > 0 && hdr.acceptedQty !== '' && hdr.rejectedQty !== ''
            return (
              <div>
                <div className="fi-form-row">
                  <div className="fi-form-grp">
                    <label>Sample Size (5% AQL)</label>
                    <input className="fi-form-ctrl" readOnly
                      style={{ background:'#F8F9FA', color:'#6C757D' }}
                      value={hdr.lotQty
                        ? `${Math.ceil(parseFloat(hdr.lotQty) * 0.05)} ${hdr.unit} (5%)`
                        : '—'} />
                  </div>

                  <div className="fi-form-grp">
                    <label>
                      Accepted Qty
                      <span style={{ fontSize:10, color:'#6C757D', marginLeft:6 }}>
                        max: {hdr.lotQty || 0} {hdr.unit}
                      </span>
                    </label>
                    <input type="number" className="fi-form-ctrl"
                      min={0} max={lotQtyN}
                      value={hdr.acceptedQty}
                      placeholder={hdr.lotQty || '0'}
                      style={{ borderColor: parseFloat(hdr.acceptedQty) > lotQtyN ? '#DC3545' : '#28A745',
                               background:  parseFloat(hdr.acceptedQty) > lotQtyN ? '#FFF5F5' : '#fff' }}
                      onChange={e => {
                        const val = parseFloat(e.target.value || 0)
                        // Auto-calc rejected = lotQty - accepted (can't go negative)
                        const autoReject = Math.max(0, lotQtyN - val)
                        setHdr(p => ({
                          ...p,
                          acceptedQty: e.target.value,
                          rejectedQty: String(autoReject),
                        }))
                      }} />
                  </div>

                  <div className="fi-form-grp">
                    <label>
                      Rejected Qty
                      <span style={{ fontSize:10, color:'#6C757D', marginLeft:6 }}>
                        max: {hdr.lotQty || 0} {hdr.unit}
                      </span>
                    </label>
                    <input type="number" className="fi-form-ctrl"
                      min={0} max={lotQtyN}
                      value={hdr.rejectedQty}
                      placeholder="0"
                      style={{ borderColor: rejectedN > lotQtyN ? '#DC3545' : '#856404',
                               background:  rejectedN > lotQtyN ? '#FFF5F5' : '#fff' }}
                      onChange={e => {
                        const val = parseFloat(e.target.value || 0)
                        // Auto-calc accepted = lotQty - rejected
                        const autoAccept = Math.max(0, lotQtyN - val)
                        setHdr(p => ({
                          ...p,
                          rejectedQty: e.target.value,
                          acceptedQty: String(autoAccept),
                        }))
                      }} />
                  </div>
                </div>

                {/* Validation messages */}
                {overLimit && (
                  <div style={{ margin:'4px 0 8px', padding:'6px 12px',
                    background:'#F8D7DA', border:'1px solid #F5C6CB',
                    borderRadius:5, fontSize:12, color:'#721C24',
                    display:'flex', alignItems:'center', gap:8 }}>
                    ❌ <strong>Over limit!</strong> Accepted ({acceptedN}) + Rejected ({rejectedN}) = {totalN}
                    &nbsp;exceeds Lot Qty ({lotQtyN} {hdr.unit})
                  </div>
                )}
                {notFull && !overLimit && (
                  <div style={{ margin:'4px 0 8px', padding:'6px 12px',
                    background:'#FFF3CD', border:'1px solid #FFE69C',
                    borderRadius:5, fontSize:12, color:'#856404',
                    display:'flex', alignItems:'center', gap:8 }}>
                    ⚠️ Accepted ({acceptedN}) + Rejected ({rejectedN}) = {totalN}
                    &nbsp;— {lotQtyN - totalN} {hdr.unit} unaccounted
                  </div>
                )}
                {!overLimit && !notFull && hdr.acceptedQty && (
                  <div style={{ margin:'4px 0 8px', padding:'6px 12px',
                    background:'#D4EDDA', border:'1px solid #C3E6CB',
                    borderRadius:5, fontSize:12, color:'#155724' }}>
                    ✅ {acceptedN} {hdr.unit} accepted + {rejectedN} {hdr.unit} rejected = {totalN} {hdr.unit} (matches lot qty)
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── Test Parameters ── */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr" style={{ display:'flex',
          justifyContent:'space-between', alignItems:'center' }}>
          <span>🔬 Test Parameters — {hdr.itemName || 'Select item'}</span>
          <button onClick={() => setTests(p => [...p, {
            id: Date.now(), param:'', spec:'', unit:'Pass/Fail',
            result:'', limit_lo:0, limit_hi:9999, isText:true
          }])} style={{ padding:'3px 12px', fontSize:11,
            background:'#fff', border:'1px solid #C3E6CB',
            borderRadius:4, cursor:'pointer', color:'#155724' }}>
            + Add Row
          </button>
        </div>

        {tests.length === 0 ? (
          <div style={{ padding:30, textAlign:'center', color:'#6C757D',
            background:'#FFFBF0', border:'1px solid #FFE69C',
            borderRadius:6, margin:12 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
            <div style={{ fontWeight:700, fontSize:13, color:'#856404',
              marginBottom:4 }}>
              No Quality Plan found for this item
            </div>
            <div style={{ fontSize:12, color:'#6C757D' }}>
              Go to <strong>Quality → Planning → Quality Plans</strong> to create a checksheet for this part,
              then re-open this inspection.
            </div>
            <div style={{ marginTop:10 }}>
              <button onClick={() => setTests([{
                id: Date.now(), param:'', spec:'', unit:'Pass/Fail',
                result:'', limit_lo:0, limit_hi:9999, isText:true
              }])}
                style={{ padding:'5px 14px', fontSize:11, cursor:'pointer',
                  background:'#fff', border:'1px solid #dee2e6',
                  borderRadius:4, color:'#495057' }}>
                + Add manual test row
              </button>
            </div>
          </div>
        ) : (
          <table className="fi-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Test Parameter</th>
                <th>Specification</th>
                <th>Unit</th>
                <th>Result</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t, i) => {
                const st = getStatus(t)
                return (
                  <tr key={t.id}
                    className={st === 'pass' ? 'test-row-pass' : st === 'fail' ? 'test-row-fail' : ''}>
                    <td style={{ fontSize:11, fontWeight:700, color:'#6C757D' }}>{i + 1}</td>
                    <td>
                      <input value={t.param}
                        onChange={e => updTest(t.id, undefined) || setTests(prev =>
                          prev.map(tt => tt.id === t.id ? { ...tt, param: e.target.value } : tt))}
                        style={{ border:'none', background:'transparent',
                          fontWeight:600, width:'100%', outline:'none' }} />
                    </td>
                    <td style={{ fontFamily:'DM Mono,monospace', fontSize:12,
                      color:'var(--odoo-blue)' }}>
                      {t.spec}
                    </td>
                    <td style={{ fontSize:11, color:'#6C757D' }}>{t.unit}</td>
                    <td>
                      {t.isText ? (
                        <select
                          value={t.result}
                          onChange={e => updTest(t.id, e.target.value)}
                          style={{
                            width: 110, padding:'4px 6px',
                            border: `2px solid ${st === 'pass' ? '#28A745' : st === 'fail' ? '#DC3545' : '#dee2e6'}`,
                            borderRadius: 5, fontSize: 12, fontWeight: 600,
                            background: st === 'pass' ? '#F0FFF8' : st === 'fail' ? '#FFF5F5' : '#fff',
                          }}>
                          <option value="">-- Select --</option>
                          <option value="pass">✅ Pass</option>
                          <option value="fail">❌ Fail</option>
                        </select>
                      ) : (
                        <input type="number"
                          value={t.result}
                          placeholder="Enter result"
                          onChange={e => updTest(t.id, e.target.value)}
                          style={{
                            width: 110, padding:'5px 8px',
                            border: `2px solid ${st === 'pass' ? '#28A745' : st === 'fail' ? '#DC3545' : '#dee2e6'}`,
                            borderRadius: 5, fontSize: 13, fontWeight: 600,
                            background: st === 'pass' ? '#F0FFF8' : st === 'fail' ? '#FFF5F5' : '#fff',
                            fontFamily: 'DM Mono,monospace',
                          }} />
                      )}
                    </td>
                    <td>
                      {st === 'pass' && <span className="badge badge-pass">Pass</span>}
                      {st === 'fail' && <span className="badge badge-fail">Fail</span>}
                      {!st && <span style={{ fontSize:11, color:'#6C757D' }}>— Pending</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Live result banner */}
        {allTested && (
          <div style={{
            margin:'14px', padding:'12px 16px', borderRadius:6,
            display:'flex', alignItems:'center', gap:12,
            background: overallResult === 'PASS' ? '#EAF9F6'
              : overallResult === 'REVIEW' ? '#FEF5E7' : '#FDEDEC',
            border: `1px solid ${overallResult === 'PASS' ? '#A2DED0'
              : overallResult === 'REVIEW' ? '#FAD7A0' : '#F5B7B1'}`
          }}>
            <span style={{ fontSize:28 }}>
              {overallResult === 'PASS' ? '✅' : overallResult === 'REVIEW' ? '⚠️' : '❌'}
            </span>
            <div>
              <div style={{ fontWeight:700, fontSize:14,
                color: overallResult === 'PASS' ? '#155724'
                  : overallResult === 'REVIEW' ? '#856404' : '#721C24' }}>
                Overall Result: {overallResult}
              </div>
              <div style={{ fontSize:12, color:'#6C757D', marginTop:2 }}>
                {passCount} tests passed · {failCount} failed
                {failCount > 0 && ' — NCR recommended'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Remarks */}
      <div className="fi-form-sec">
        <div className="fi-form-sec-hdr">📝 Remarks</div>
        <div className="fi-form-sec-body">
          <textarea className="fi-form-ctrl" rows={3}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Inspection remarks, visual observations, deviation notes..." />
        </div>
      </div>

      {/* Footer */}
      <div className="fi-form-acts">
        <button className="btn btn-s sd-bsm"
          onClick={() => nav('/qm/inspection')}>Cancel</button>
        <button className="btn btn-p sd-bsm"
          disabled={saving} onClick={save}>
          {saving ? '⏳ Saving...' : '💾 Save & Result'}
        </button>
      </div>
    </div>
  )
}
