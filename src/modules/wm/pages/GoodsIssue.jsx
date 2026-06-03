import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })
const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057',
  display:'block', marginBottom:3, textTransform:'uppercase' }

export default function GoodsIssue() {
  const nav = useNavigate()
  const [items,   setItems]   = useState([])
  const [wos,     setWOs]     = useState([])   // Work Orders
  const [saving,  setSaving]  = useState(false)
  const [giNo,    setGiNo]    = useState('Auto-generated')
  const [lines,   setLines]   = useState([
    { itemCode:'', itemName:'', availQty:0, qty:1, uom:'Nos', remarks:'' }
  ])
  const [form, setForm] = useState({
    issueTo: 'Production Floor',
    fromLocation: 'RM-STORE',   // source location
    movType: '201 — GI for Production Order',
    reference: '',
    issueDate: new Date().toISOString().split('T')[0],
    issuedBy: JSON.parse(localStorage.getItem('lnv_user')||'{}')?.name||'Admin'
  })

  useEffect(()=>{
    fetch(`${BASE_URL}/wm/stock?location=${form?.fromLocation||'RM-STORE'}`, { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setItems(d.data||[])).catch(()=>{})
    fetch(`${BASE_URL}/wm/gi/next-no`, { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setGiNo(d.giNo||'GI-AUTO')).catch(()=>{})
    // Load open Work Orders
    fetch(`${BASE_URL}/pp/wo?status=RELEASED,IN_PROGRESS,DRAFT`,
      { headers:authHdrs2() })
      .then(r=>r.json()).then(d=>setWOs(d.data||d||[])).catch(()=>{})
  },[])

  // When WO selected — auto-fill reference and load BOM materials as issue lines
  const onWOChange = async (woNo) => {
    setForm(f => ({ ...f, reference: woNo }))
    if (!woNo) return
    try {
      const wo = wos.find(w => w.woNo === woNo)
      if (!wo) return
      // Load material issues for this WO (has correct bomQty scaled to plannedQty)
      const issRes = await fetch(
        `${BASE_URL}/pp/material-issues?woId=${wo.id}`,
        { headers: authHdrs2() })
      const issData = await issRes.json()
      const issItems = (issData.data || []).filter(i => !i.isByProduct)
      if (issItems.length > 0) {
        const newLines = issItems.map(iss => {
          const stockItem = items.find(it =>
            (iss.itemCode && it.itemCode === iss.itemCode) ||
            it.itemName?.toLowerCase() === (iss.itemName||'').toLowerCase()
          )
          const reqQty      = parseFloat(parseFloat(iss.bomQty    || 0).toFixed(3))
          const alreadyIssued = parseFloat(parseFloat(iss.issuedQty || 0).toFixed(3))
          const remaining   = parseFloat(Math.max(0, reqQty - alreadyIssued).toFixed(3))
          return {
            itemCode:    iss.itemCode || stockItem?.itemCode || '',
            itemName:    iss.itemName || stockItem?.itemName || '',
            availQty:    parseFloat(stockItem?.balanceQty || 0),
            bomQty:      reqQty,         // total required by BOM
            issuedQty:   alreadyIssued,  // already issued in previous GIs
            remaining:   remaining,      // bomQty - issuedQty
            qty:         remaining,      // default issue qty = remaining
            issueId:     iss.id,         // materialIssue id for update
            uom:         iss.uom || stockItem?.uom || 'Nos',
            remarks:     `For WO: ${woNo}`,
            autoLoaded:  true,
            fullyIssued: remaining <= 0
          }
        })
        setLines(newLines)
        toast.success(`${issItems.length} material(s) loaded from WO`)
      } else {
        // No material issues — try BOM explosion fallback
        const bomRes = await fetch(`${BASE_URL}/pp/bom?itemCode=${wo.itemCode||''}`, { headers: authHdrs2() })
        const bomData = await bomRes.json()
        const bom = (bomData.data||[])[0]
        if (bom?.lines?.length) {
          const newLines = bom.lines.filter(l=>!l.isByProduct).map(comp => {
            const stockItem = items.find(it =>
              it.itemCode === comp.itemCode ||
              it.itemName?.toLowerCase() === (comp.itemName||'').toLowerCase()
            )
            const needed = (parseFloat(comp.qty||0) / parseFloat(bom.baseQty||1)) * parseFloat(wo.plannedQty||1)
            return {
              itemCode: comp.itemCode || stockItem?.itemCode || '',
              itemName: comp.itemName || '',
              availQty: parseFloat(stockItem?.balanceQty || 0),
              qty:      parseFloat(needed.toFixed(3)),
              uom:      comp.uom || stockItem?.uom || 'Nos',
              remarks:  `For WO: ${woNo}`
            }
          })
          setLines(newLines)
          toast.success(`${newLines.length} BOM material(s) loaded`)
        }
      }
    } catch { /* BOM not available — manual entry */ }
  }

  const onItemChange = (i, code) => {
    const item = items.find(it=>it.itemCode===code||it.itemName===code)
    setLines(prev=>prev.map((l,idx)=>idx!==i?l:{
      ...l,
      itemCode: item?.itemCode||code,
      itemName: item?.itemName||'',
      availQty: parseFloat(item?.balanceQty||0),
      uom:      item?.uom||'Nos'
    }))
  }

  // Find available qty for a material by itemCode or itemName
  const getAvailQty = (itemCode, itemName) => {
    const found = items.find(it =>
      (itemCode && it.itemCode === itemCode) ||
      (itemName && it.itemName?.toLowerCase() === itemName?.toLowerCase())
    )
    return parseFloat(found?.balanceQty || 0)
  }

  const addLine = () => setLines(p=>[...p,
    { itemCode:'', itemName:'', availQty:0, qty:1, uom:'Nos', remarks:'', autoLoaded:false }])
  const delLine = i => setLines(p=>p.filter((_,idx)=>idx!==i))

  const post = async () => {
    const validLines = lines.filter(l=>l.itemCode && parseFloat(l.qty||0)>0 && !l.fullyIssued)
    if (!validLines.length) return toast.error('All materials fully issued or no qty entered!')
    // Check available qty
    for (const l of validLines) {
      if (parseFloat(l.qty) > parseFloat(l.availQty||0))
        return toast.error(`${l.itemName}: Issue qty (${l.qty}) exceeds available stock (${l.availQty})!`)
    }
    // Check excess — lines where qty > remaining need approval flag
    const hasExcess = validLines.some(l =>
      l.autoLoaded && parseFloat(l.qty) > parseFloat(l.remaining||0) && parseFloat(l.remaining||0) > 0
    )
    if (hasExcess) {
      const confirm = window.confirm(
        '⚠️ Some lines exceed the required BOM qty (Excess Issue).\n\nThis will be flagged for approval. Proceed?'
      )
      if (!confirm) return
    }
    setSaving(true)
    try {
      const linesWithFlags = validLines.map(l => ({
        ...l,
        isExcess: l.autoLoaded && parseFloat(l.qty) > parseFloat(l.remaining||0) && parseFloat(l.remaining||0) > 0,
        excessQty: l.autoLoaded ? Math.max(0, parseFloat(l.qty) - parseFloat(l.remaining||0)) : 0
      }))
      const res  = await fetch(`${BASE_URL}/wm/gi`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify({ ...form, lines:linesWithFlags })})
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      nav('/wm/movement')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const sHdr = title => (
    <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)',
      padding:'8px 16px' }}>
      <span style={{ color:'#fff', fontSize:13, fontWeight:700,
        fontFamily:'Syne,sans-serif' }}>{title}</span>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column',
      height:'100%', overflow:'hidden' }}>
      {/* Sticky Header */}
      <div style={{ flexShrink:0, position:'sticky', top:0, zIndex:100,
        background:'#F8F4F8', borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Goods Issue
            <small style={{ fontFamily:'DM Mono,monospace',
              color:'#714B67', marginLeft:8 }}>{giNo}</small>
            <small>MIGO · Issue to Production / Sales</small>
          </div>
          <div className="lv-acts">
            {/* Flow steps */}
            <div style={{ display:'flex', gap:0, marginRight:8 }}>
              {['Issue Entry','Stock Reduced','Cost Booked'].map((s,i)=>(
                <div key={s} style={{ display:'flex', alignItems:'center' }}>
                  <span style={{ padding:'3px 10px', fontSize:10, fontWeight:700,
                    background:i===0?'#714B67':'#D4EDDA',
                    color:i===0?'#fff':'#155724',
                    borderRadius:i===0?'10px 0 0 10px':i===2?'0 10px 10px 0':'0' }}>
                    {s}
                  </span>
                  {i<2 && <span style={{ color:'#6C757D' }}>›</span>}
                </div>
              ))}
            </div>
            <button className="btn btn-s sd-bsm"
              onClick={()=>nav('/wm/stock')}>✕ Cancel</button>
            <button className="btn btn-p sd-bsm"
              disabled={saving} onClick={post}>
              {saving?'⏳ Posting...':'📤 Post Goods Issue'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'14px 0',
        paddingBottom:40 }}>
        {/* Issue Details */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden', marginBottom:14 }}>
          {sHdr('📋 Issue Details')}
          <div style={{ padding:16, background:'#fff' }}>
            <div style={{ display:'grid',
              gridTemplateColumns:'1fr 1fr 1fr', gap:12,
              marginBottom:12 }}>
              <div>
                <label style={lbl}>GI Number</label>
                <input style={{ ...inp, background:'#F8F4F8',
                  color:'#714B67', fontWeight:700,
                  fontFamily:'DM Mono,monospace' }}
                  value={giNo} readOnly />
              </div>
              <div>
                <label style={lbl}>Issue Date *</label>
                <input type="date" style={inp}
                  value={form.issueDate}
                  onChange={e=>setForm(f=>({...f,issueDate:e.target.value}))} />
              </div>
              <div>
                <label style={lbl}>Movement Type</label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={form.movType}
                  onChange={e=>setForm(f=>({...f,movType:e.target.value}))}>
                  {['201 — GI for Production Order',
                    '261 — GI for Sales Order',
                    '551 — Scrapping',
                    '901 — Sample Issue'].map(m=>(
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display:'grid',
              gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <div>
                <label style={lbl}>From Location</label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={form.fromLocation}
                  onChange={e=>setForm(f=>({...f,fromLocation:e.target.value}))}>
                  {['RM-STORE','SHOP-FLOOR','FG-STORE','QC-HOLD'].map(l=>(
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Issue To</label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={form.issueTo}
                  onChange={e=>{
                    const loc = e.target.value === 'Production Floor' ? 'SHOP-FLOOR'
                              : e.target.value === 'Sales / Dispatch'  ? 'FG-STORE'
                              : e.target.value
                    setForm(f=>({...f, issueTo:e.target.value}))
                  }}>
                  {['Production Floor','Sales / Dispatch',
                    'QC Lab','Admin','Maintenance'].map(l=>(
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Work Order Reference *</label>
                {wos.length > 0 ? (
                  <select style={{ ...inp, cursor:'pointer' }}
                    value={form.reference}
                    onChange={e => onWOChange(e.target.value)}>
                    <option value="">-- Select Work Order --</option>
                    {wos.map(wo => (
                      <option key={wo.id} value={wo.woNo}>
                        {wo.woNo} · {wo.itemName} · Qty: {parseFloat(wo.plannedQty||0).toLocaleString()} {wo.uom}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input style={inp} value={form.reference}
                    placeholder="WO-2026-001 (no open WOs found)"
                    onChange={e=>setForm(f=>({...f,reference:e.target.value}))} />
                )}
                {form.reference && (
                  <div style={{ fontSize:10, color:'#155724', marginTop:3,
                    fontFamily:'DM Mono,monospace' }}>
                    ✅ {form.reference} selected — BOM materials auto-loaded
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>Issued By</label>
                <input style={{ ...inp, background:'#F8F9FA' }}
                  value={form.issuedBy} readOnly />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
          overflow:'hidden' }}>
          {sHdr('📦 Items to Issue')}
          <div style={{ padding:'10px 16px', background:'#fff',
            display:'flex', justifyContent:'flex-end' }}>
            <button onClick={addLine}
              style={{ padding:'4px 14px', background:'#714B67',
                color:'#fff', border:'none', borderRadius:5,
                fontSize:11, cursor:'pointer', fontWeight:600 }}>
              + Add Item
            </button>
          </div>
          <div style={{ overflowX:'auto', background:'#fff' }}>
            <table style={{ width:'100%', borderCollapse:'collapse',
              fontSize:12 }}>
              <thead style={{ background:'#F8F4F8' }}>
                <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                  {['#','Material','Available','Required','Already Issued','Remaining','Issue Qty','UOM','Remarks',''].map(h=>(
                    <th key={h} style={{ padding:'7px 10px', fontSize:10,
                      fontWeight:700, color:'#6C757D', textAlign:'left',
                      textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((l,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #F0EEF0' }}>
                    <td style={{ padding:'6px 10px', color:'#6C757D',
                      fontWeight:700, textAlign:'center' }}>{i+1}</td>
                    <td style={{ padding:'4px 6px', minWidth:200 }}>
                      {l.autoLoaded ? (
                        // Auto-loaded from WO — show as read-only text
                        <div style={{ padding:'5px 8px', background:'#F0F8FF',
                          border:'1px solid #AED6F1', borderRadius:4,
                          fontSize:11, fontWeight:600, color:'#1A5276' }}>
                          <div style={{ fontFamily:'DM Mono,monospace', fontSize:10,
                            color:'#6C757D' }}>{l.itemCode}</div>
                          {l.itemName}
                        </div>
                      ) : (
                        <select style={{ width:'100%', padding:'5px 6px',
                          border:'1px solid #E0D5E0', borderRadius:4,
                          fontSize:11, cursor:'pointer' }}
                          value={l.itemCode}
                          onChange={e=>onItemChange(i,e.target.value)}>
                          <option value="">-- Select Item --</option>
                          {items.map(it=>(
                            <option key={it.itemCode||it.itemName} value={it.itemCode||it.itemName}>
                              {it.itemCode ? `${it.itemCode} — ` : ''}{it.itemName}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td style={{ padding:'6px 10px', textAlign:'right',
                      fontWeight:700,
                      color:parseFloat(l.availQty||0)<=0?'#DC3545':'#155724',
                      fontFamily:'DM Mono,monospace' }}>
                      {parseFloat(l.availQty||0).toFixed(3)} {l.uom}
                    </td>
                    {/* Required (BOM qty) */}
                    <td style={{ padding:'6px 10px', textAlign:'right',
                      fontFamily:'DM Mono,monospace', fontWeight:700,
                      color:'#1A5276', background:'#EBF5FB' }}>
                      {l.autoLoaded
                        ? <>{parseFloat(l.bomQty||0).toFixed(3)} <span style={{fontSize:10,color:'#6C757D'}}>{l.uom}</span></>
                        : <span style={{color:'#6C757D'}}>—</span>}
                    </td>
                    {/* Already Issued */}
                    <td style={{ padding:'6px 10px', textAlign:'right',
                      fontFamily:'DM Mono,monospace', fontWeight:700,
                      color: l.issuedQty > 0 ? '#856404' : '#6C757D',
                      background: l.issuedQty > 0 ? '#FFFBF0' : 'transparent' }}>
                      {l.autoLoaded
                        ? <>{parseFloat(l.issuedQty||0).toFixed(3)} <span style={{fontSize:10,color:'#6C757D'}}>{l.uom}</span></>
                        : <span style={{color:'#6C757D'}}>—</span>}
                    </td>
                    {/* Remaining */}
                    <td style={{ padding:'6px 10px', textAlign:'right',
                      fontFamily:'DM Mono,monospace', fontWeight:800,
                      color: l.fullyIssued ? '#155724' : '#DC3545',
                      background: l.fullyIssued ? '#D4EDDA' : '#FFF5F5' }}>
                      {l.autoLoaded
                        ? l.fullyIssued
                          ? <span style={{fontSize:11}}>✅ Fully Issued</span>
                          : <>{parseFloat(l.remaining||0).toFixed(3)} <span style={{fontSize:10,color:'#6C757D'}}>{l.uom}</span></>
                        : <span style={{color:'#6C757D'}}>—</span>}
                    </td>
                    <td style={{ padding:'4px 6px', width:100 }}>
                      {l.fullyIssued ? (
                        <div style={{ padding:'5px 8px', background:'#D4EDDA',
                          borderRadius:4, fontSize:10, fontWeight:700,
                          color:'#155724', textAlign:'center' }}>
                          ✅ Fully Issued
                        </div>
                      ) : (
                        <>
                          <input type="number" min={0}
                            style={{ width:'100%', padding:'5px 6px',
                              border:`1.5px solid ${
                                parseFloat(l.qty) > parseFloat(l.availQty||0) ? '#DC3545'
                                : parseFloat(l.qty) > parseFloat(l.remaining||l.bomQty||0) ? '#FFC107'
                                : '#28A745'}`,
                              borderRadius:4, fontSize:11, textAlign:'right',
                              fontFamily:'DM Mono,monospace', boxSizing:'border-box',
                              background: parseFloat(l.qty) > parseFloat(l.availQty||0) ? '#FFF5F5'
                                : parseFloat(l.qty) > parseFloat(l.remaining||l.bomQty||0) ? '#FFFBF0'
                                : '#F0FFF8' }}
                            value={l.qty}
                            onChange={e=>setLines(prev=>prev.map((x,idx)=>
                              idx===i?{...x,qty:e.target.value}:x))} />
                          {/* Excess warning */}
                          {parseFloat(l.qty) > parseFloat(l.remaining||0) && parseFloat(l.remaining||0) > 0 && (
                            <div style={{ fontSize:9, color:'#856404', marginTop:2, fontWeight:700 }}>
                              ⚠️ Excess: +{(parseFloat(l.qty)-parseFloat(l.remaining||0)).toFixed(3)} — needs approval
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td style={{ padding:'6px 10px',
                      textAlign:'center' }}>{l.uom}</td>
                    <td style={{ padding:'4px 6px', minWidth:120 }}>
                      <input style={{ width:'100%', padding:'5px 6px',
                        border:'1px solid #E0D5E0', borderRadius:4,
                        fontSize:11, boxSizing:'border-box' }}
                        placeholder="Notes..."
                        value={l.remarks}
                        onChange={e=>setLines(prev=>prev.map((x,idx)=>
                          idx===i?{...x,remarks:e.target.value}:x))} />
                    </td>
                    <td style={{ padding:'4px 6px', textAlign:'center' }}>
                      {lines.length>1 && (
                        <button onClick={()=>delLine(i)}
                          style={{ background:'#DC3545', color:'#fff',
                            border:'none', borderRadius:4, padding:'2px 7px',
                            cursor:'pointer', fontSize:11 }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
