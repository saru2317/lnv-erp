import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const OP_STATUS_STYLE = {
  PENDING:     { bg:'#F8F9FA', border:'#E0D5E0', dot:'#CCC',     label:'Pending'     },
  IN_PROGRESS: { bg:'#FFF3E0', border:'#FFC107', dot:'#FFC107',  label:'In Progress' },
  COMPLETED:   { bg:'#E8F5E9', border:'#28A745', dot:'#28A745',  label:'Completed'   },
  SKIPPED:     { bg:'#F5F5F5', border:'#DDD',    dot:'#999',     label:'Skipped'     },
}

// ── Special calculators ───────────────────────────────────────────
function calcShotOutput(plannedQty, cavity) {
  if (!cavity || cavity <= 0) return null
  return { shots: Math.ceil(plannedQty / cavity), output: Math.ceil(plannedQty / cavity) * cavity }
}
function calcPlatingThickness(currentA, timeMin, areaDm2) {
  if (!areaDm2 || areaDm2 <= 0) return '0.00'
  return ((parseFloat(currentA) * parseFloat(timeMin) * 0.0195) / parseFloat(areaDm2)).toFixed(2)
}

// ── Field renderer ────────────────────────────────────────────────
function FieldInput({ field, value, onChange, readOnly }) {
  // Auto-detect type from field name
  const name = field.toLowerCase()
  const isTemp    = name.includes('temp') || name.includes('°c') || name.includes('°f')
  const isNum     = name.includes('qty') || name.includes('count') || name.includes('pressure') ||
                    name.includes('voltage') || name.includes('current') || name.includes('speed') ||
                    name.includes('rpm') || name.includes('time') || name.includes('duration') ||
                    name.includes('weight') || name.includes('thickness') || name.includes('%') ||
                    name.includes('shots') || name.includes('cycle') || name.includes('area') ||
                    name.includes('reading') || name.includes('hrc') || name.includes('dft')
  const isBool    = name.includes('pass/fail') || name.includes('approved') || name.includes('done') || name.includes('check')
  const isArea    = name.includes('area') || name.includes('sqft') || name.includes('dm²')

  if (isBool) return (
    <select style={{...inp,cursor:'pointer'}} value={value||''} onChange={e=>onChange(e.target.value)} disabled={readOnly}>
      <option value="">-- Select --</option>
      <option value="Pass">Pass</option>
      <option value="Fail">Fail</option>
      <option value="NA">N/A</option>
    </select>
  )
  if (isNum) return (
    <input type="number" step="0.01" style={{...inp,background:readOnly?'#F0FFF4':'#fff',fontFamily:'DM Mono,monospace',fontWeight:700}}
      value={value||''} onChange={e=>onChange(e.target.value)} placeholder="0" readOnly={readOnly}/>
  )
  return (
    <input style={inp} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={field} readOnly={readOnly}/>
  )
}

export default function ProductionEntry() {
  const nav  = useNavigate()
  const [params] = useSearchParams()
  const woIdParam = params.get('woId')

  const [config,    setConfig]    = useState(null)   // PPConfig from DB
  const [wos,       setWos]       = useState([])     // open WOs
  const [selWoId,   setSelWoId]   = useState(woIdParam || '')
  const [wo,        setWo]        = useState(null)   // selected WO detail
  const [ops,       setOps]       = useState([])     // WO operations
  const [curOp,     setCurOp]     = useState(0)      // current operation index
  const [values,    setValues]    = useState({})     // { opIdx: { fieldName: value } }
  const [qtys,      setQtys]      = useState({})     // { opIdx: { qtyIn, qtyOut, qtyRejected } }
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [shift,     setShift]     = useState('General')

  // Mould shot counter
  const [shotsFired, setShotsFired] = useState(0)
  const shotTimer = useRef(null)

  // Load config + WOs
  const loadBase = useCallback(async () => {
    setLoading(true)
    try {
      const [rC, rW] = await Promise.all([
        fetch(`${BASE_URL}/pp/config`, { headers: hdr2() }),
        fetch(`${BASE_URL}/pp/wo?status=RELEASED,IN_PROGRESS`, { headers: hdr2() }),
      ])
      const [dC, dW] = await Promise.all([rC.json(), rW.json()])
      setConfig(dC.data)
      setWos(dW.data || [])

      if (woIdParam) loadWO(woIdParam, dC.data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [woIdParam])
  useEffect(() => { loadBase() }, [loadBase])

  // Load selected WO detail
  const loadWO = async (id, cfg) => {
    try {
      const res  = await fetch(`${BASE_URL}/pp/wo/${id}`, { headers: hdr2() })
      const data = await res.json()
      if (!data.data) return
      const woData = data.data
      setWo(woData)

      // Build operations from WO ops or from config processes
      const woOps = woData.operations?.length
        ? woData.operations.sort((a,b) => a.opNo - b.opNo)
        : (cfg || config)?.processes?.map((p,i) => ({
            id:        null,
            opNo:      (i+1)*10,
            opName:    p.name,
            workCenter:p.machine || '',
            status:    'PENDING',
            fieldDefs: p.fields || [],
            isQC:      p.isQC || false,
            isOptional:p.isOptional || false,
            shotCounter:p.shotCounter || false,
            amperHourCalc:p.amperHourCalc || false,
          })) || []

      setOps(woOps)

      // Find first non-completed op
      const firstPending = woOps.findIndex(o => o.status !== 'COMPLETED' && o.status !== 'SKIPPED')
      setCurOp(firstPending >= 0 ? firstPending : 0)

    } catch (e) { toast.error('Failed to load WO') }
  }

  const fSet = (opIdx, field, val) =>
    setValues(v => ({ ...v, [opIdx]: { ...(v[opIdx]||{}), [field]: val } }))

  const qSet = (opIdx, k, val) =>
    setQtys(q => ({ ...q, [opIdx]: { ...(q[opIdx]||{}), [k]: val } }))

  const getVal = (opIdx, field) => values[opIdx]?.[field] || ''
  const getQty = (opIdx, k)    => qtys[opIdx]?.[k]    || ''

  // Electroplating auto-calc
  const handlePlatingField = (opIdx, field, val) => {
    fSet(opIdx, field, val)
    const d = { ...(values[opIdx]||{}), [field]: val }
    if (d['Current (A)'] && d['Time (min)'] && d['Part Area (dm²)']) {
      const thickness = calcPlatingThickness(d['Current (A)'], d['Time (min)'], d['Part Area (dm²)'])
      fSet(opIdx, 'Calculated Thickness (µm)', thickness)
    }
  }

  // Save current operation entry
  const saveOp = async (opIdx, markDone = true) => {
    if (!wo) return toast.error('Select a Work Order first')
    const op = ops[opIdx]
    const qty = qtys[opIdx] || {}
    if (!qty.qtyOut && markDone) return toast.error('Enter Qty Out before completing')

    setSaving(true)
    try {
      // Save production log
      const logRes = await fetch(`${BASE_URL}/pp/production-log`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({
          woId:        parseInt(wo.id),
          opNo:        op.opNo,
          opName:      op.opName,
          shift,
          logDate:     new Date().toISOString(),
          entryData:   values[opIdx] || {},
          qtyIn:       parseFloat(qty.qtyIn || 0),
          qtyOut:      parseFloat(qty.qtyOut || 0),
          qtyRejected: parseFloat(qty.qtyRejected || 0),
          qtyScrap:    parseFloat(qty.qtyScrap || 0),
          isQCStage:   op.isQC || false,
          qcResult:    op.isQC ? (qty.qcResult || 'PASS') : null,
          shotsFired:  op.shotCounter ? shotsFired : null,
          cavityCount: wo.cavityCount || null,
          operator:    JSON.parse(localStorage.getItem('lnv_user')||'{}')?.name || 'Operator',
          remarks:     qty.remarks || '',
          createdBy:   JSON.parse(localStorage.getItem('lnv_user')||'{}')?.name,
        })
      })
      const logData = await logRes.json()
      if (!logRes.ok) throw new Error(logData.error)

      // Update op status in state
      if (markDone) {
        setOps(o => o.map((x, i) => i === opIdx ? { ...x, status:'COMPLETED' } : x))
        toast.success(`${op.opName} completed!`)

        // Auto-advance to next op (if sequence mode)
        const isSeq = config?.sequenceType === 'sequence' || config?.sequenceType === 'semi_sequence'
        if (isSeq && opIdx < ops.length - 1) {
          setCurOp(opIdx + 1)
          setOps(o => o.map((x, i) => i === opIdx+1 ? { ...x, status:'IN_PROGRESS' } : x))
        }
      } else {
        toast.success('Entry saved')
      }
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // Complete WO
  const completeWO = async () => {
    if (!wo) return
    const totalOut  = Object.values(qtys).reduce((a,q) => a + parseFloat(q.qtyOut||0), 0)
    const totalRej  = Object.values(qtys).reduce((a,q) => a + parseFloat(q.qtyRejected||0), 0)
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/pp/wo/${wo.id}/complete`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ producedQty: totalOut, rejectedQty: totalRej, scrapQty: 0 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`WO ${wo.woNo} completed! ${totalOut} produced.`)
      nav('/pp/wo')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // UI helpers
  const isSequence    = config?.sequenceType === 'sequence'
  const isMould       = config?.prodType === 'mould' || wo?.prodType === 'mould'
  const isBatch       = config?.prodType === 'batch'
  const isContinuous  = config?.prodType === 'continuous'
  const allDone       = ops.every(o => o.status === 'COMPLETED' || o.status === 'SKIPPED')
  const shotInfo      = isMould && wo?.cavityCount && wo?.plannedQty
    ? calcShotOutput(parseFloat(wo.plannedQty), parseInt(wo.cavityCount)) : null

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading Production Entry...</div>

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Production Entry
          {config && <small style={{background:'#EDE0EA',color:'#714B67',padding:'2px 8px',borderRadius:4,marginLeft:8}}>{config.industryName}</small>}
          {wo && <small style={{fontFamily:'DM Mono,monospace',color:'#714B67',marginLeft:8}}>{wo.woNo}</small>}
        </div>
        <div className="fi-lv-actions">
          <select style={{...inp,width:160,cursor:'pointer'}} value={shift} onChange={e=>setShift(e.target.value)}>
            {['General','Morning (6-2)','Afternoon (2-10)','Night (10-6)'].map(s=><option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/pp/wo')}>Back</button>
          {allDone && wo && (
            <button className="btn btn-p sd-bsm" disabled={saving} onClick={completeWO} style={{background:'#28A745',border:'none'}}>
              Complete WO
            </button>
          )}
        </div>
      </div>

      {/* WO Selector */}
      <div style={{border:'1px solid #E0D5E0',borderRadius:8,padding:16,background:'#fff',marginBottom:14}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:12}}>
          <div>
            <label style={lbl}>Work Order *</label>
            <select style={{...inp,cursor:'pointer'}} value={selWoId}
              onChange={e => { setSelWoId(e.target.value); if(e.target.value) loadWO(e.target.value, config) }}>
              <option value="">-- Select Released WO --</option>
              {wos.map(w => <option key={w.id} value={w.id}>{w.woNo} · {w.itemName}</option>)}
            </select>
          </div>
          {wo && <>
            <div>
              <label style={lbl}>Item</label>
              <input style={{...inp,background:'#F8F9FA'}} value={wo.itemName} readOnly/>
            </div>
            <div>
              <label style={lbl}>Planned Qty</label>
              <input style={{...inp,background:'#F8F9FA',fontFamily:'DM Mono,monospace',fontWeight:700}} value={`${parseFloat(wo.plannedQty)} ${wo.uom}`} readOnly/>
            </div>
            <div>
              <label style={lbl}>Produced So Far</label>
              <input style={{...inp,background:'#F8F9FA',color:'#155724',fontFamily:'DM Mono,monospace',fontWeight:700}} value={`${parseFloat(wo.producedQty||0)} ${wo.uom}`} readOnly/>
            </div>
          </>}
        </div>

        {/* Mould info */}
        {wo && isMould && shotInfo && (
          <div style={{display:'flex',gap:14,marginTop:12,padding:'10px 14px',background:'#EDE0EA',borderRadius:6,fontSize:12}}>
            <div><span style={{color:'#6C757D'}}>Mould:</span> <strong>{wo.mouldId||'—'}</strong></div>
            <div><span style={{color:'#6C757D'}}>Cavities:</span> <strong>{wo.cavityCount}</strong></div>
            <div><span style={{color:'#6C757D'}}>Shots Needed:</span> <strong style={{color:'#714B67',fontFamily:'DM Mono,monospace'}}>{shotInfo.shots}</strong></div>
            <div><span style={{color:'#6C757D'}}>Max Output:</span> <strong style={{fontFamily:'DM Mono,monospace'}}>{shotInfo.output}</strong></div>
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
              <span style={{color:'#6C757D'}}>Shots Fired:</span>
              <strong style={{fontFamily:'DM Mono,monospace',fontSize:16,color:'#714B67'}}>{shotsFired}</strong>
              <button onClick={()=>setShotsFired(s=>s+1)} style={{padding:'4px 12px',background:'#714B67',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontWeight:700,fontSize:12}}>+1 Shot</button>
              <button onClick={()=>setShotsFired(0)} style={{padding:'4px 10px',background:'#E0D5E0',color:'#714B67',border:'none',borderRadius:4,cursor:'pointer',fontSize:11}}>Reset</button>
            </div>
          </div>
        )}
      </div>

      {/* No WO selected */}
      {!wo && (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8,background:'#fff'}}>
          <div style={{fontSize:48,marginBottom:12}}>⚙️</div>
          <div style={{fontWeight:700,fontSize:16,color:'#333'}}>Select a Work Order to start production entry</div>
          <div style={{fontSize:12,marginTop:6}}>Only Released and In-Progress WOs are shown</div>
          {wos.length === 0 && (
            <button className="btn btn-p sd-bsm" style={{marginTop:14}} onClick={()=>nav('/pp/wo/new')}>
              Create New Work Order
            </button>
          )}
        </div>
      )}

      {/* Production stages */}
      {wo && ops.length > 0 && (
        <div style={{display:'grid', gridTemplateColumns: isSequence ? '220px 1fr' : '1fr', gap:14}}>

          {/* Left: stage navigator (sequence mode) */}
          {isSequence && (
            <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
              <div style={{background:'linear-gradient(135deg,#714B67,#4A3050)',padding:'8px 14px'}}>
                <span style={{color:'#fff',fontSize:12,fontWeight:700}}>Stages — {config.sequenceType === 'sequence' ? 'Forced Order' : 'Semi-Sequence'}</span>
              </div>
              {ops.map((op, i) => {
                const st = OP_STATUS_STYLE[op.status] || OP_STATUS_STYLE.PENDING
                const isLocked = isSequence && i > 0 && ops[i-1].status !== 'COMPLETED' && ops[i-1].status !== 'SKIPPED'
                return (
                  <div key={i} onClick={() => !isLocked && setCurOp(i)} style={{
                    padding:'10px 14px', cursor: isLocked ? 'not-allowed' : 'pointer',
                    background: curOp === i ? st.bg : '#fff',
                    borderLeft: `3px solid ${curOp===i ? st.border : 'transparent'}`,
                    borderBottom: '1px solid #F0EEF0',
                    opacity: isLocked ? .45 : 1,
                  }}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{width:8,height:8,borderRadius:'50%',background:st.dot,flexShrink:0}}/>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:'#333'}}>{op.opName}</div>
                        <div style={{fontSize:10,color:'#6C757D',marginTop:1}}>
                          {isLocked ? '🔒 Locked' : st.label}
                          {op.isQC && <span style={{marginLeft:4,background:'#D1ECF1',color:'#0C5460',padding:'1px 4px',borderRadius:3,fontSize:9,fontWeight:700}}>QC</span>}
                          {op.isOptional && <span style={{marginLeft:4,background:'#FFF3CD',color:'#856404',padding:'1px 4px',borderRadius:3,fontSize:9,fontWeight:700}}>OPT</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Overall progress */}
              <div style={{padding:'10px 14px',borderTop:'2px solid #E0D5E0',background:'#F8F4F8'}}>
                <div style={{fontSize:10,fontWeight:700,color:'#714B67',marginBottom:4}}>
                  OVERALL PROGRESS
                </div>
                <div style={{height:6,background:'#E0D5E0',borderRadius:3,overflow:'hidden',marginBottom:4}}>
                  <div style={{height:'100%',borderRadius:3,transition:'width .3s',background:'#28A745',
                    width:`${Math.round((ops.filter(o=>o.status==='COMPLETED').length/ops.length)*100)}%`}}/>
                </div>
                <div style={{fontSize:11,color:'#6C757D'}}>
                  {ops.filter(o=>o.status==='COMPLETED').length}/{ops.length} stages done
                </div>
              </div>
            </div>
          )}

          {/* Right / Main: entry form */}
          <div>
            {/* Non-sequence: tab selector */}
            {!isSequence && (
              <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
                {ops.map((op, i) => {
                  const st = OP_STATUS_STYLE[op.status] || OP_STATUS_STYLE.PENDING
                  return (
                    <div key={i} onClick={()=>setCurOp(i)} style={{
                      padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:700,
                      background: curOp===i ? '#714B67' : st.bg,
                      color:      curOp===i ? '#fff'    : '#333',
                      border:     `1.5px solid ${curOp===i?'#714B67':st.border}`,
                    }}>
                      {op.opName}
                      {op.status==='COMPLETED'&&<span style={{marginLeft:4}}>✓</span>}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Current operation form */}
            {ops[curOp] && (() => {
              const op = ops[curOp]
              const st = OP_STATUS_STYLE[op.status] || OP_STATUS_STYLE.PENDING
              const isDone = op.status === 'COMPLETED'
              const fields = Array.isArray(op.fieldDefs) ? op.fieldDefs : []

              return (
                <div style={{border:`2px solid ${st.border}`,borderRadius:8,overflow:'hidden'}}>
                  {/* Op header */}
                  <div style={{background:`linear-gradient(135deg,#714B67,#4A3050)`,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{color:'#fff',fontWeight:800,fontFamily:'Syne,sans-serif',fontSize:15}}>
                        Stage {curOp+1}/{ops.length}: {op.opName}
                      </div>
                      <div style={{color:'rgba(255,255,255,.7)',fontSize:11,marginTop:2}}>
                        {op.workCenter && `Work Center: ${op.workCenter}`}
                        {op.isQC && <span style={{marginLeft:8,background:'rgba(255,255,255,.2)',padding:'1px 6px',borderRadius:3,fontSize:10,fontWeight:700}}>QC CHECKPOINT</span>}
                      </div>
                    </div>
                    <span style={{background:st.dot,color:'#fff',padding:'4px 12px',borderRadius:10,fontSize:11,fontWeight:700}}>{st.label}</span>
                  </div>

                  <div style={{padding:16,background:'#fff'}}>

                    {/* QC check inputs */}
                    {op.isQC && !isDone && (
                      <div style={{background:'#D1ECF1',border:'1px solid #B8DAFF',borderRadius:6,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#0C5460'}}>
                        QC Stage — Enter actual measurements. Pass/Fail must be recorded.
                      </div>
                    )}

                    {/* Dynamic fields from config */}
                    {fields.length > 0 ? (
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
                        {fields.map(field => {
                          // Special: electroplating auto-calc
                          const isPlatingField = op.amperHourCalc && ['Current (A)','Time (min)','Part Area (dm²)'].includes(field)
                          const isAutoCalc     = op.amperHourCalc && field === 'Calculated Thickness (µm)'
                          return (
                            <div key={field}>
                              <label style={{...lbl, color: isAutoCalc?'#28A745':isDone?'#6C757D':'#495057'}}>
                                {field}
                                {isAutoCalc && <span style={{marginLeft:4,fontSize:9,background:'#D4EDDA',color:'#155724',padding:'1px 4px',borderRadius:3}}>AUTO</span>}
                              </label>
                              <FieldInput
                                field={field}
                                value={getVal(curOp, field)}
                                onChange={v => isPlatingField ? handlePlatingField(curOp, field, v) : fSet(curOp, field, v)}
                                readOnly={isDone || isAutoCalc}
                              />
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div style={{color:'#999',fontSize:12,fontStyle:'italic',marginBottom:12}}>
                        No specific fields configured for this stage.
                      </div>
                    )}

                    {/* Quantity block — always present */}
                    <div style={{borderTop:'2px solid #E0D5E0',paddingTop:14}}>
                      <div style={{fontSize:12,fontWeight:800,color:'#714B67',marginBottom:10,textTransform:'uppercase'}}>
                        Quantity Tracking
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12}}>
                        {[
                          ['qtyIn',       'Qty In'],
                          ['qtyOut',      'Qty Out *'],
                          ['qtyRejected', 'Qty Rejected'],
                          ['qtyScrap',    'Qty Scrap'],
                        ].map(([k,label]) => (
                          <div key={k}>
                            <label style={{...lbl,color:k==='qtyOut'?'#714B67':'#495057'}}>{label}</label>
                            <input type="number" step="0.001"
                              style={{...inp, background:isDone?'#F8F9FA':'#fff',
                                fontFamily:'DM Mono,monospace',fontWeight:700,
                                borderColor:k==='qtyOut'?'#714B67':'#E0D5E0',
                                color:k==='qtyRejected'&&parseFloat(getQty(curOp,k))>0?'#DC3545':
                                      k==='qtyOut'?'#155724':'#333'}}
                              value={getQty(curOp,k)} onChange={e=>qSet(curOp,k,e.target.value)}
                              placeholder="0" readOnly={isDone}/>
                          </div>
                        ))}
                      </div>

                      {/* QC result for QC stages */}
                      {op.isQC && (
                        <div style={{marginTop:12,display:'flex',gap:12,alignItems:'center'}}>
                          <div>
                            <label style={lbl}>QC Result *</label>
                            <div style={{display:'flex',gap:8}}>
                              {['PASS','FAIL','PARTIAL'].map(r=>(
                                <button key={r} onClick={()=>qSet(curOp,'qcResult',r)} disabled={isDone}
                                  style={{padding:'6px 16px',border:`2px solid ${getQty(curOp,'qcResult')===r?
                                    r==='PASS'?'#28A745':r==='FAIL'?'#DC3545':'#FFC107':'#E0D5E0'}`,
                                    background:getQty(curOp,'qcResult')===r?
                                    r==='PASS'?'#D4EDDA':r==='FAIL'?'#F8D7DA':'#FFF3CD':'#fff',
                                    color:r==='PASS'?'#155724':r==='FAIL'?'#721C24':'#856404',
                                    borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                                  {r}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Remarks */}
                      <div style={{marginTop:12}}>
                        <label style={lbl}>Remarks</label>
                        <input style={inp} value={getQty(curOp,'remarks')||''} onChange={e=>qSet(curOp,'remarks',e.target.value)}
                          placeholder="Any observations, deviations, issues..." readOnly={isDone}/>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {!isDone && (
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:16,borderTop:'1px solid #E0D5E0',paddingTop:12}}>
                        <div style={{display:'flex',gap:8}}>
                          {op.isOptional && (
                            <button className="btn btn-s sd-bsm"
                              onClick={()=>{setOps(o=>o.map((x,i)=>i===curOp?{...x,status:'SKIPPED'}:x));setCurOp(c=>Math.min(c+1,ops.length-1))}}>
                              Skip (Optional)
                            </button>
                          )}
                          <button className="btn btn-s sd-bsm" disabled={saving} onClick={()=>saveOp(curOp,false)}>
                            Save Draft
                          </button>
                        </div>
                        <div style={{display:'flex',gap:8}}>
                          {curOp > 0 && !isSequence && (
                            <button className="btn btn-s sd-bsm" onClick={()=>setCurOp(c=>c-1)}>← Prev</button>
                          )}
                          <button className="btn btn-p sd-bsm" disabled={saving} onClick={()=>saveOp(curOp,true)}
                            style={{minWidth:160}}>
                            {saving ? 'Saving...' : `✓ Complete: ${op.opName}`}
                          </button>
                        </div>
                      </div>
                    )}

                    {isDone && (
                      <div style={{marginTop:12,padding:'10px 14px',background:'#D4EDDA',borderRadius:6,fontSize:12,color:'#155724',fontWeight:700,textAlign:'center'}}>
                        ✓ Stage Completed — Qty Out: {getQty(curOp,'qtyOut')||'0'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Complete WO button when all done */}
            {allDone && (
              <div style={{marginTop:16,padding:20,background:'#D4EDDA',border:'2px solid #C3E6CB',borderRadius:8,textAlign:'center'}}>
                <div style={{fontSize:36,marginBottom:8}}>🎉</div>
                <div style={{fontWeight:800,fontSize:16,color:'#155724',fontFamily:'Syne,sans-serif'}}>All Stages Completed!</div>
                <div style={{fontSize:13,color:'#155724',marginBottom:14}}>
                  Total Produced: <strong>{Object.values(qtys).reduce((a,q)=>a+parseFloat(q.qtyOut||0),0)}</strong> {wo.uom}
                  {' '} · Rejected: <strong>{Object.values(qtys).reduce((a,q)=>a+parseFloat(q.qtyRejected||0),0)}</strong>
                </div>
                <button className="btn btn-p sd-bsm" disabled={saving} onClick={completeWO}
                  style={{background:'#28A745',border:'none',padding:'10px 30px',fontSize:14}}>
                  {saving?'Completing...':'Complete Work Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
