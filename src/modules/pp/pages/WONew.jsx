import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0]
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().split('T')[0] }

// ── Styles ────────────────────────────────────────────────────────────────────
const inp  = { width:'100%', padding:'7px 10px', fontSize:12, border:'1.5px solid #D0D7DE', borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const sel  = { ...inp, cursor:'pointer' }
const lbl  = { fontSize:10, fontWeight:700, color:'#444', display:'block', marginBottom:3, textTransform:'uppercase', letterSpacing:.5 }
const card = { background:'#fff', border:'1.5px solid #E0D5E0', borderRadius:8, padding:16, marginBottom:14 }
const hdr  = { fontSize:11, fontWeight:800, color:'#1A5276', textTransform:'uppercase', letterSpacing:.6, marginBottom:12, paddingBottom:8, borderBottom:'2px solid #EBF5FB', display:'flex', alignItems:'center', gap:6 }

const WO_TYPES = [
  { key:'MTO', label:'Make to Order',       icon:'📋', desc:'Produce for specific Sales Order / Customer',  color:'#1A5276', bg:'#EBF5FB' },
  { key:'MTS', label:'Make to Stock',       icon:'📦', desc:'Produce for finished goods stock / warehouse', color:'#155724', bg:'#D4EDDA' },
  { key:'JW',  label:'Job Work',            icon:'🔧', desc:'Customer material — process and return',        color:'#6C3483', bg:'#F4ECF7' },
  { key:'MRP', label:'MRP Planned',         icon:'🔄', desc:'Generated from MRP run — system planned',      color:'#856404', bg:'#FFF3CD' },
]

const PRIORITIES = ['Critical','High','Normal','Low']
const RM_METHODS = [
  { key:'push',     label:'Push — Auto issue on WO release'  },
  { key:'pull',     label:'Pull — Manual issue per operation' },
  { key:'backflush',label:'Backflush — Issue on WO complete'  },
]

// ══════════════════════════════════════════════════════════════════════════════
export default function WONew() {
  const navigate     = useNavigate()
  const [params]     = useSearchParams()

  // ── Pre-filled from Production Plan ──────────────────────────────────────
  const planId   = params.get('planId')   || ''
  const soNo     = params.get('soNo')     || ''
  const itemCode = params.get('itemCode') || ''
  const itemName = decodeURIComponent(params.get('itemName') || '')
  const qty      = params.get('qty')      || ''
  const uom      = params.get('uom')      || 'Nos'

  // ── State ─────────────────────────────────────────────────────────────────
  const [woNo,     setWoNo]     = useState('Auto')
  const [woType,   setWoType]   = useState(soNo ? 'MTO' : 'MTS')
  const [tab,      setTab]      = useState('header') // header | operations | materials | summary
  const [saving,   setSaving]   = useState(false)

  // Header
  const [form, setForm] = useState({
    itemCode, itemName, plannedQty: qty, uom,
    soNo, planId, priority:'Normal', rmMethod:'push',
    scheduledStart: today(), scheduledEnd: addDays(today(), 3),
    plant:'MAIN', warehouse:'FG-STORE',
    customerName:'', dcNo:'', mouldId:'', remarks:'',
    routingId:'', routingNo:'',
  })

  // Operations (from routing or manual)
  const [operations, setOperations] = useState([])

  // Materials (from BOM)
  const [materials, setMaterials] = useState([])

  // Master data
  const [routings,  setRoutings]  = useState([])
  const [workCenters, setWCs]     = useState([])
  const [items,     setItems]     = useState([])
  const [boms,      setBoms]      = useState([])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Load master data ──────────────────────────────────────────────────────
  useEffect(() => {
    // WO number
    fetch(`${BASE_URL}/pp/wo/next-no`, { headers: authHdrs() })
      .then(r=>r.json()).then(d=>setWoNo(d.woNo||'WO-AUTO')).catch(()=>{})

    // Routings — then auto-match by itemCode from URL params
    fetch(`${BASE_URL}/pp/routing-master`, { headers: authHdrs() })
      .then(r=>r.json()).then(d => {
        const list = d.data || []
        setRoutings(list)
        // Auto-find routing for this item
        if (itemCode && list.length) {
          const match = list.find(r =>
            r.itemCode?.toLowerCase() === itemCode.toLowerCase() ||
            r.itemName?.toLowerCase().includes(itemCode.toLowerCase())
          )
          if (match?.operations?.length) {
            setForm(f => ({ ...f, routingNo: match.routingNo, routingId: match.id }))
            setOperations(match.operations.map((op, i) => ({
              opNo:       op.opNo || (i+1)*10,
              opName:     op.opName || '',
              workCenter: op.workCenter || '',
              machine:    op.machine || '',
              setupTime:  op.setupTime || 0,
              runTime:    op.runTime || 0,
              mhr:        op.mhr || 0,
              status:     'PENDING',
              controlKey: op.controlKey || 'PP01',
            })))
            toast.success(`✅ Routing ${match.routingNo} auto-loaded — ${match.operations.length} operations`)
          }
        }
      }).catch(()=>{})

    // Work Centers
    fetch(`${BASE_URL}/pp/work-centers`, { headers: authHdrs() })
      .then(r=>r.json()).then(d=>setWCs(d.data||[])).catch(()=>{})

    // Items
    fetch(`${BASE_URL}/mdm/item`, { headers: authHdrs() })
      .then(r=>r.json()).then(d=>setItems(d.data||[])).catch(()=>{})
  }, [])

  // ── Load BOM when itemCode changes ────────────────────────────────────────
  useEffect(() => {
    if (!form.itemCode) return
    fetch(`${BASE_URL}/mdm/bom?itemCode=${form.itemCode}`, { headers: authHdrs() })
      .then(r=>r.json())
      .then(d => {
        const bom = d.data?.[0]
        if (bom?.components?.length) {
          setMaterials(bom.components.map(c => ({
            itemCode:  c.itemCode || '',
            itemName:  c.itemName || '',
            reqQty:    parseFloat(c.qty || 0) * parseFloat(form.plannedQty || 1),
            uom:       c.uom || 'Nos',
            stdCost:   c.stdCost || 0,
            issuedQty: 0,
            status:    'RESERVED',
          })))
        }
      }).catch(() => {})
  }, [form.itemCode])

  // ── Load operations from routing ──────────────────────────────────────────
  const loadRouting = (routingNo) => {
    const rt = routings.find(r => r.routingNo === routingNo)
    set('routingNo', routingNo)
    set('routingId', rt?.id || '')
    if (rt?.operations?.length) {
      setOperations(rt.operations.map((op, i) => ({
        opNo:       op.opNo || (i+1)*10,
        opName:     op.opName || '',
        workCenter: op.workCenter || '',
        machine:    op.machine || '',
        setupTime:  op.setupTime || 0,
        runTime:    op.runTime || 0,
        mhr:        op.mhr || 0,
        status:     'PENDING',
        controlKey: op.controlKey || 'PP01',
      })))
      toast.success(`${rt.operations.length} operations loaded from ${routingNo}`)
    }
  }

  // ── Add blank operation row ───────────────────────────────────────────────
  const addOp = () => setOperations(ops => [...ops, {
    opNo: (ops.length + 1) * 10, opName:'', workCenter:'', machine:'',
    setupTime:0, runTime:0, mhr:0, status:'PENDING', controlKey:'PP01',
  }])

  const setOp = (i, k, v) => setOperations(ops => {
    const updated = [...ops]
    updated[i] = { ...updated[i], [k]: v }
    // Auto-fill machine name when WC selected
    if (k === 'workCenter') {
      const wc = workCenters.find(w => w.wcId === v)
      if (wc) { updated[i].machine = wc.name; updated[i].mhr = parseFloat(wc.mhr||0) }
    }
    return updated
  })

  const delOp = i => setOperations(ops => ops.filter((_,idx) => idx !== i))

  // ── Add blank material row ────────────────────────────────────────────────
  const addMat = () => setMaterials(m => [...m, { itemCode:'', itemName:'', reqQty:0, uom:'Nos', stdCost:0, issuedQty:0, status:'RESERVED' }])
  const setMat = (i, k, v) => setMaterials(m => { const u=[...m]; u[i]={...u[i],[k]:v}; return u })
  const delMat = i => setMaterials(m => m.filter((_,idx) => idx !== i))

  // ── Calculated values ─────────────────────────────────────────────────────
  const totalMachineTime = operations.reduce((s,o) => s + parseFloat(o.setupTime||0) + parseFloat(o.runTime||0) * parseFloat(form.plannedQty||1), 0)
  const totalMHRCost     = operations.reduce((s,o) => s + (parseFloat(o.mhr||0) * (parseFloat(o.runTime||0)/60) * parseFloat(form.plannedQty||1)), 0)
  const totalMatCost     = materials.reduce((s,m) => s + parseFloat(m.stdCost||0) * parseFloat(m.reqQty||0), 0)

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.itemName)    { toast.error('Item name required'); return false }
    if (!form.plannedQty)  { toast.error('Planned quantity required'); return false }
    if (operations.length === 0) { toast.error('Add at least one operation'); return false }
    if (operations.some(o => !o.opName)) { toast.error('All operations must have a name'); return false }
    return true
  }

  // ── Save WO ───────────────────────────────────────────────────────────────
  const saveWO = async (releaseNow = false) => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        woNo,
        woType,
        plannedQty:    parseFloat(form.plannedQty||0),
        scheduledStart: form.scheduledStart ? new Date(form.scheduledStart).toISOString() : null,
        scheduledEnd:   form.scheduledEnd   ? new Date(form.scheduledEnd).toISOString()   : null,
        status:        releaseNow ? 'RELEASED' : 'DRAFT',
        operations,
        bomComponents: materials,
      }

      const res  = await fetch(`${BASE_URL}/pp/wo`, { method:'POST', headers: authHdrs(), body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')

      // If release now — call release endpoint
      if (releaseNow && data.data?.id) {
        await fetch(`${BASE_URL}/pp/wo/${data.data.id}/release`, { method:'POST', headers: authHdrs() })
      }

      // Update plan status
      if (planId) {
        await fetch(`${BASE_URL}/pp/plan/${planId}`, {
          method:'PUT', headers: authHdrs(),
          body: JSON.stringify({ status: releaseNow ? 'Released' : 'WO Created' })
        }).catch(()=>{})
      }

      toast.success(`✅ ${data.data?.woNo} ${releaseNow ? 'created & released!' : 'saved as Draft'}`)
      navigate('/pp/wo')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ── Tab Nav ───────────────────────────────────────────────────────────────
  const TABS = [
    { key:'header',     label:'📋 WO Header'    },
    { key:'operations', label:`⚙️ Operations (${operations.length})` },
    { key:'materials',  label:`📦 Materials (${materials.length})`   },
    { key:'summary',    label:'📊 Summary'      },
  ]

  const tabBtn = (key) => ({
    padding:'9px 20px', border:'none', background:'none', cursor:'pointer',
    fontSize:12, fontWeight:700,
    color:      tab===key ? '#1A5276' : '#6C757D',
    borderBottom: tab===key ? '2px solid #1A5276' : '2px solid transparent',
    marginBottom:-2,
  })

  return (
    <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:13 }}>

      {/* ── Page Header ── */}
      <div className="fi-lv-hdr" style={{ marginBottom:14 }}>
        <div className="fi-lv-title">
          Create Work Order
          <small>SAP: CO01 — {woNo}{planId ? ` · Plan: PLAN-${String(planId).padStart(4,'0')}` : ''}{soNo ? ` · SO: ${soNo}` : ''}</small>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate(-1)}
            style={{ padding:'7px 16px', background:'#fff', border:'1.5px solid #DEE2E6', borderRadius:6, fontSize:12, cursor:'pointer', color:'#6C757D' }}>
            ← Back to Plan
          </button>
          <button onClick={() => saveWO(false)} disabled={saving}
            style={{ padding:'7px 18px', background:'#6C757D', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
            💾 Save as Draft
          </button>
          <button onClick={() => saveWO(true)} disabled={saving}
            style={{ padding:'7px 20px', background:'#155724', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            🚀 Create & Release to Floor
          </button>
        </div>
      </div>

      {/* ── WO Type Selector ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        {WO_TYPES.map(t => (
          <div key={t.key} onClick={() => setWoType(t.key)}
            style={{ padding:'12px 16px', borderRadius:8, cursor:'pointer', transition:'all .15s',
              border: woType===t.key ? `2px solid ${t.color}` : '2px solid #E0D5E0',
              background: woType===t.key ? t.bg : '#fff' }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{t.icon}</div>
            <div style={{ fontWeight:800, fontSize:12, color: woType===t.key ? t.color : '#333' }}>{t.label}</div>
            <div style={{ fontSize:10, color:'#6C757D', marginTop:2, lineHeight:1.4 }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display:'flex', borderBottom:'2px solid #E0D5E0', background:'#F8F9FA', borderRadius:'6px 6px 0 0', marginBottom:0 }}>
        {TABS.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={tabBtn(t.key)}>{t.label}</button>)}
      </div>

      <div style={{ background:'#fff', border:'1.5px solid #E0D5E0', borderTop:'none', borderRadius:'0 0 8px 8px', padding:20 }}>

        {/* ══ TAB 1 — WO HEADER ══ */}
        {tab === 'header' && (
          <div>

            {/* Plan / SO Reference Banner */}
            {(planId || soNo) && (
              <div style={{ background:'#EBF5FB', border:'1.5px solid #AED6F1', borderRadius:7, padding:'10px 16px', marginBottom:16, display:'flex', gap:24, alignItems:'center' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#1A5276' }}>📋 Creating WO from Production Plan</span>
                {planId && <span style={{ fontSize:11, color:'#1A5276' }}>Plan ID: <strong>{planId}</strong></span>}
                {soNo   && <span style={{ fontSize:11, color:'#1A5276' }}>Sales Order: <strong style={{ fontFamily:'DM Mono,monospace' }}>{soNo}</strong></span>}
              </div>
            )}

            {/* Row 1 — Item */}
            <div style={{ ...card }}>
              <div style={hdr}>📦 Item & Quantity</div>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'10px 14px' }}>
                <div>
                  <label style={lbl}>Item Name *</label>
                  <input style={inp} value={form.itemName} onChange={e=>set('itemName',e.target.value)} placeholder="Item to produce" />
                </div>
                <div>
                  <label style={lbl}>Item Code</label>
                  <input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={form.itemCode} onChange={e=>set('itemCode',e.target.value)} placeholder="ITEM-001" />
                </div>
                <div>
                  <label style={lbl}>Planned Qty *</label>
                  <input style={{ ...inp, fontWeight:700, fontSize:14 }} type="number" value={form.plannedQty} onChange={e=>set('plannedQty',e.target.value)} placeholder="0" min="1" />
                </div>
                <div>
                  <label style={lbl}>UOM</label>
                  <select style={sel} value={form.uom} onChange={e=>set('uom',e.target.value)}>
                    {['Nos','Kg','Metre','Litre','Set','Box'].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2 — Schedule */}
            <div style={card}>
              <div style={hdr}>📅 Schedule & Priority</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px 14px' }}>
                <div>
                  <label style={lbl}>Scheduled Start *</label>
                  <input style={inp} type="date" value={form.scheduledStart} onChange={e=>set('scheduledStart',e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Scheduled End *</label>
                  <input style={inp} type="date" value={form.scheduledEnd} onChange={e=>set('scheduledEnd',e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Priority</label>
                  <select style={sel} value={form.priority} onChange={e=>set('priority',e.target.value)}>
                    {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Plant</label>
                  <input style={inp} value={form.plant} onChange={e=>set('plant',e.target.value)} placeholder="MAIN" />
                </div>
              </div>
            </div>

            {/* Row 3 — Type-specific fields */}
            <div style={card}>
              <div style={hdr}>
                {WO_TYPES.find(t=>t.key===woType)?.icon} {WO_TYPES.find(t=>t.key===woType)?.label} — Reference
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px 14px' }}>
                {(woType==='MTO' || woType==='MRP') && (
                  <div>
                    <label style={lbl}>Sales Order No.</label>
                    <input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={form.soNo} onChange={e=>set('soNo',e.target.value)} placeholder="SO-2026-001" />
                  </div>
                )}
                {woType==='JW' && (
                  <>
                    <div>
                      <label style={lbl}>Customer Name</label>
                      <input style={inp} value={form.customerName} onChange={e=>set('customerName',e.target.value)} placeholder="Customer who sent material" />
                    </div>
                    <div>
                      <label style={lbl}>DC / Challan No.</label>
                      <input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={form.dcNo} onChange={e=>set('dcNo',e.target.value)} placeholder="DC-2026-001" />
                    </div>
                    <div>
                      <label style={lbl}>Mould / Tool No.</label>
                      <input style={{ ...inp, fontFamily:'DM Mono,monospace' }} value={form.mouldId} onChange={e=>set('mouldId',e.target.value)} placeholder="MLD-001" />
                    </div>
                  </>
                )}
                {woType==='MTS' && (
                  <div>
                    <label style={lbl}>Target Warehouse</label>
                    <input style={inp} value={form.warehouse} onChange={e=>set('warehouse',e.target.value)} placeholder="FG-STORE" />
                  </div>
                )}
                <div>
                  <label style={lbl}>Material Issue Method</label>
                  <select style={sel} value={form.rmMethod} onChange={e=>set('rmMethod',e.target.value)}>
                    {RM_METHODS.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Remarks</label>
                  <input style={inp} value={form.remarks} onChange={e=>set('remarks',e.target.value)} placeholder="Special instructions..." />
                </div>
              </div>
            </div>

            {/* Routing selector */}
            <div style={card}>
              <div style={hdr}>🗺️ Routing — Auto-matched from Item Code</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'10px 14px', alignItems:'flex-end' }}>
                <div>
                  <label style={lbl}>Routing</label>
                  <select style={sel} value={form.routingNo} onChange={e=>loadRouting(e.target.value)}>
                    <option value="">— Select Routing —</option>
                    {routings.map(r=>(
                      <option key={r.id} value={r.routingNo}>{r.routingNo} — {r.itemName||r.itemCode}</option>
                    ))}
                  </select>
                </div>
                <div style={{ paddingTop:20 }}>
                  {operations.length > 0
                    ? <span style={{ fontSize:12, color:'#155724', fontWeight:700 }}>✅ {operations.length} operations auto-loaded from <strong>{form.routingNo}</strong></span>
                    : <span style={{ fontSize:12, color:'#856404' }}>⚠️ No routing matched for <strong>{itemCode}</strong> — create one in PP Setup → Routing Master</span>
                  }
                </div>
                <button onClick={() => setTab('operations')}
                  style={{ padding:'8px 16px', background:'#1A5276', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                  → Go to Operations
                </button>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button onClick={() => setTab('operations')}
                style={{ padding:'9px 24px', background:'#1A5276', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Next → Operations ⚙️
              </button>
            </div>
          </div>
        )}

        {/* ══ TAB 2 — OPERATIONS ══ */}
        {tab === 'operations' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:12, color:'#6C757D' }}>
                Define the production sequence. Each operation maps to a Work Center / Machine.
              </div>
              <button onClick={addOp}
                style={{ padding:'7px 16px', background:'#1A5276', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                + Add Operation
              </button>
            </div>

            {operations.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, border:'2px dashed #E0D5E0', borderRadius:8, color:'#6C757D' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>⚙️</div>
                <div style={{ fontWeight:700 }}>No routing found for <span style={{ fontFamily:'DM Mono,monospace', color:'#1A5276' }}>{itemCode || 'this item'}</span></div>
                <div style={{ fontSize:12, marginTop:4, marginBottom:14, color:'#6C757D' }}>
                  Go to <strong>Routing Master (PP Setup)</strong> and create a routing for this item first.<br/>
                  Or add operations manually below for a one-time WO.
                </div>
                <button onClick={addOp} style={{ padding:'8px 20px', background:'#1A5276', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  + Add Operation Manually
                </button>
              </div>
            ) : (
              <div style={{ border:'1.5px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead style={{ background:'#1A5276', color:'#fff' }}>
                    <tr>
                      <th style={{ padding:'8px 12px', textAlign:'left', width:60 }}>Op No</th>
                      <th style={{ padding:'8px 12px', textAlign:'left' }}>Operation Name</th>
                      <th style={{ padding:'8px 12px', textAlign:'left', width:160 }}>Work Center</th>
                      <th style={{ padding:'8px 12px', textAlign:'left', width:130 }}>Machine</th>
                      <th style={{ padding:'8px 12px', textAlign:'center', width:90 }}>Setup (min)</th>
                      <th style={{ padding:'8px 12px', textAlign:'center', width:90 }}>Run (min/pc)</th>
                      <th style={{ padding:'8px 12px', textAlign:'center', width:90 }}>MHR (₹/hr)</th>
                      <th style={{ padding:'8px 12px', textAlign:'center', width:40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {operations.map((op,i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #F0F0F0', background: i%2===0?'#fff':'#FAFAFA' }}>
                        <td style={{ padding:'6px 12px' }}>
                          <input style={{ ...inp, textAlign:'center', fontFamily:'DM Mono,monospace', fontWeight:700 }}
                            value={op.opNo} onChange={e=>setOp(i,'opNo',e.target.value)} />
                        </td>
                        <td style={{ padding:'6px 12px' }}>
                          <input style={inp} value={op.opName} onChange={e=>setOp(i,'opName',e.target.value)} placeholder="e.g. Material Drying" />
                        </td>
                        <td style={{ padding:'6px 12px' }}>
                          <select style={sel} value={op.workCenter} onChange={e=>setOp(i,'workCenter',e.target.value)}>
                            <option value="">— Select —</option>
                            {workCenters.map(w=><option key={w.id} value={w.wcId}>{w.wcId}</option>)}
                          </select>
                        </td>
                        <td style={{ padding:'6px 12px' }}>
                          <input style={{ ...inp, fontSize:11 }} value={op.machine} onChange={e=>setOp(i,'machine',e.target.value)} placeholder="Machine ID" />
                        </td>
                        <td style={{ padding:'6px 12px' }}>
                          <input style={{ ...inp, textAlign:'center' }} type="number" value={op.setupTime} onChange={e=>setOp(i,'setupTime',e.target.value)} placeholder="0" min="0" />
                        </td>
                        <td style={{ padding:'6px 12px' }}>
                          <input style={{ ...inp, textAlign:'center' }} type="number" value={op.runTime} onChange={e=>setOp(i,'runTime',e.target.value)} placeholder="0" min="0" step="0.1" />
                        </td>
                        <td style={{ padding:'6px 12px' }}>
                          <input style={{ ...inp, textAlign:'center', color:'#155724', fontWeight:700 }} type="number" value={op.mhr} onChange={e=>setOp(i,'mhr',e.target.value)} placeholder="0" min="0" />
                        </td>
                        <td style={{ padding:'6px 12px', textAlign:'center' }}>
                          <button onClick={()=>delOp(i)}
                            style={{ padding:'4px 8px', background:'#F8D7DA', color:'#721C24', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ background:'#F8F9FA', borderTop:'2px solid #E0D5E0' }}>
                    <tr>
                      <td colSpan={4} style={{ padding:'8px 12px', fontWeight:700, fontSize:11, color:'#1A5276' }}>
                        Total Machine Time (for {form.plannedQty||0} pcs)
                      </td>
                      <td colSpan={2} style={{ padding:'8px 12px', textAlign:'center', fontWeight:800, fontFamily:'DM Mono,monospace', color:'#1A5276' }}>
                        {totalMachineTime.toFixed(0)} min
                      </td>
                      <td style={{ padding:'8px 12px', textAlign:'center', fontWeight:800, color:'#155724', fontFamily:'DM Mono,monospace' }}>
                        ₹{totalMHRCost.toFixed(0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:14 }}>
              <button onClick={() => setTab('header')}
                style={{ padding:'8px 20px', background:'#fff', border:'1.5px solid #DEE2E6', borderRadius:6, fontSize:12, cursor:'pointer' }}>← Back</button>
              <button onClick={() => setTab('materials')}
                style={{ padding:'9px 24px', background:'#1A5276', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Next → Materials 📦
              </button>
            </div>
          </div>
        )}

        {/* ══ TAB 3 — MATERIALS ══ */}
        {tab === 'materials' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:12, color:'#6C757D' }}>
                {materials.length > 0
                  ? `✅ ${materials.length} components auto-loaded from BOM for ${form.itemCode}`
                  : 'No BOM found — add materials manually or leave empty for Job Work'}
              </div>
              <button onClick={addMat}
                style={{ padding:'7px 16px', background:'#1A5276', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                + Add Material
              </button>
            </div>

            {materials.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, border:'2px dashed #E0D5E0', borderRadius:8, color:'#6C757D' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📦</div>
                <div style={{ fontWeight:700 }}>No materials</div>
                <div style={{ fontSize:12, marginTop:4 }}>
                  {form.itemCode ? 'No BOM found for this item.' : 'Enter item code in Header tab to auto-load BOM.'}
                  {woType==='JW' && ' Job Work — customer provides material, leave empty.'}
                </div>
              </div>
            ) : (
              <div style={{ border:'1.5px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead style={{ background:'#1A5276', color:'#fff' }}>
                    <tr>
                      <th style={{ padding:'8px 12px', textAlign:'left' }}>Item Code</th>
                      <th style={{ padding:'8px 12px', textAlign:'left' }}>Item Name</th>
                      <th style={{ padding:'8px 12px', textAlign:'center', width:100 }}>Req. Qty</th>
                      <th style={{ padding:'8px 12px', textAlign:'center', width:80 }}>UOM</th>
                      <th style={{ padding:'8px 12px', textAlign:'center', width:100 }}>Std Cost (₹)</th>
                      <th style={{ padding:'8px 12px', textAlign:'center', width:110 }}>Total Cost (₹)</th>
                      <th style={{ padding:'8px 12px', textAlign:'center', width:40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m,i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #F0F0F0', background:i%2===0?'#fff':'#FAFAFA' }}>
                        <td style={{ padding:'6px 12px' }}>
                          <input style={{ ...inp, fontFamily:'DM Mono,monospace', fontSize:11 }} value={m.itemCode} onChange={e=>setMat(i,'itemCode',e.target.value)} placeholder="RM-001" />
                        </td>
                        <td style={{ padding:'6px 12px' }}>
                          <input style={inp} value={m.itemName} onChange={e=>setMat(i,'itemName',e.target.value)} placeholder="Raw material name" />
                        </td>
                        <td style={{ padding:'6px 12px' }}>
                          <input style={{ ...inp, textAlign:'center', fontWeight:700 }} type="number" value={m.reqQty} onChange={e=>setMat(i,'reqQty',e.target.value)} placeholder="0" min="0" step="0.01" />
                        </td>
                        <td style={{ padding:'6px 12px' }}>
                          <select style={sel} value={m.uom} onChange={e=>setMat(i,'uom',e.target.value)}>
                            {['Nos','Kg','Metre','Litre','Set'].map(u=><option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td style={{ padding:'6px 12px' }}>
                          <input style={{ ...inp, textAlign:'center' }} type="number" value={m.stdCost} onChange={e=>setMat(i,'stdCost',e.target.value)} placeholder="0" min="0" step="0.01" />
                        </td>
                        <td style={{ padding:'6px 12px', textAlign:'center', fontWeight:700, color:'#155724', fontFamily:'DM Mono,monospace' }}>
                          ₹{(parseFloat(m.stdCost||0)*parseFloat(m.reqQty||0)).toLocaleString('en-IN',{minimumFractionDigits:2})}
                        </td>
                        <td style={{ padding:'6px 12px', textAlign:'center' }}>
                          <button onClick={()=>delMat(i)}
                            style={{ padding:'4px 8px', background:'#F8D7DA', color:'#721C24', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ background:'#F8F9FA', borderTop:'2px solid #E0D5E0' }}>
                    <tr>
                      <td colSpan={5} style={{ padding:'8px 12px', fontWeight:700, fontSize:11, color:'#1A5276' }}>Total Material Cost</td>
                      <td style={{ padding:'8px 12px', textAlign:'center', fontWeight:800, color:'#155724', fontFamily:'DM Mono,monospace', fontSize:13 }}>
                        ₹{totalMatCost.toLocaleString('en-IN',{minimumFractionDigits:2})}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:14 }}>
              <button onClick={() => setTab('operations')}
                style={{ padding:'8px 20px', background:'#fff', border:'1.5px solid #DEE2E6', borderRadius:6, fontSize:12, cursor:'pointer' }}>← Back</button>
              <button onClick={() => setTab('summary')}
                style={{ padding:'9px 24px', background:'#1A5276', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Review Summary 📊 →
              </button>
            </div>
          </div>
        )}

        {/* ══ TAB 4 — SUMMARY ══ */}
        {tab === 'summary' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

              {/* WO Details */}
              <div style={card}>
                <div style={hdr}>📋 Work Order Summary</div>
                {[
                  ['WO Number',     woNo,                         true  ],
                  ['WO Type',       WO_TYPES.find(t=>t.key===woType)?.label, false],
                  ['Item',          form.itemName,                false ],
                  ['Item Code',     form.itemCode,                true  ],
                  ['Planned Qty',   `${form.plannedQty} ${form.uom}`, false],
                  ['Start Date',    form.scheduledStart,          false ],
                  ['End Date',      form.scheduledEnd,            false ],
                  ['Priority',      form.priority,                false ],
                  ['Material Issue',RM_METHODS.find(m=>m.key===form.rmMethod)?.label?.split('—')[0], false],
                  soNo && ['Sales Order', soNo, true],
                  form.customerName && ['Customer', form.customerName, false],
                  form.dcNo && ['DC No.', form.dcNo, true],
                ].filter(Boolean).map(([l,v,mono]) => v && (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F0F0F0', fontSize:12 }}>
                    <span style={{ color:'#6C757D' }}>{l}</span>
                    <span style={{ fontWeight:600, fontFamily:mono?'DM Mono,monospace':'inherit' }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Cost Summary */}
              <div>
                <div style={{ ...card, background:'#1A5276', border:'none' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.7)', textTransform:'uppercase', letterSpacing:.5, marginBottom:14 }}>💰 Estimated WO Cost</div>
                  {[
                    { label:'Material Cost',      val: totalMatCost,    c:'#A9DFBF' },
                    { label:'Machine Hour Cost',  val: totalMHRCost,    c:'#AED6F1' },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,.1)', fontSize:12 }}>
                      <span style={{ color:'rgba(255,255,255,.7)' }}>{r.label}</span>
                      <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:r.c }}>₹{r.val.toLocaleString('en-IN',{minimumFractionDigits:2})}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', marginTop:4, borderTop:'2px solid rgba(255,255,255,.3)' }}>
                    <span style={{ fontWeight:700, color:'#fff' }}>Total Estimated Cost</span>
                    <span style={{ fontFamily:'DM Mono,monospace', fontWeight:800, color:'#F9E79F', fontSize:16 }}>
                      ₹{(totalMatCost+totalMHRCost).toLocaleString('en-IN',{minimumFractionDigits:2})}
                    </span>
                  </div>
                  <div style={{ marginTop:10, fontSize:11, color:'rgba(255,255,255,.5)' }}>
                    {operations.length} operations · {materials.length} materials · {totalMachineTime.toFixed(0)} min total machine time
                  </div>
                </div>

                {/* Operations preview */}
                <div style={card}>
                  <div style={hdr}>⚙️ Operations Sequence</div>
                  {operations.length === 0 ? (
                    <div style={{ color:'#DC3545', fontSize:11, fontWeight:700 }}>⚠️ No operations added — go back and add operations</div>
                  ) : operations.map((op,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid #F0F0F0', fontSize:11 }}>
                      <span style={{ background:'#1A5276', color:'#fff', padding:'2px 6px', borderRadius:4, fontFamily:'DM Mono,monospace', fontWeight:700, fontSize:10 }}>{op.opNo}</span>
                      <span style={{ flex:1, fontWeight:600 }}>{op.opName}</span>
                      <span style={{ color:'#6C757D' }}>{op.workCenter||'—'}</span>
                      <span style={{ color:'#1A5276', fontFamily:'DM Mono,monospace' }}>{op.runTime}min/pc</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Final Action Buttons */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, background:'#F8F9FA', borderRadius:8, border:'1.5px solid #E0D5E0' }}>
              <button onClick={() => setTab('materials')}
                style={{ padding:'8px 20px', background:'#fff', border:'1.5px solid #DEE2E6', borderRadius:6, fontSize:12, cursor:'pointer' }}>← Back</button>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => saveWO(false)} disabled={saving}
                  style={{ padding:'10px 24px', background:'#6C757D', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  💾 Save as Draft
                </button>
                <button onClick={() => saveWO(true)} disabled={saving}
                  style={{ padding:'10px 28px', background:'#155724', color:'#fff', border:'none', borderRadius:6, fontSize:14, fontWeight:800, cursor:'pointer' }}>
                  🚀 Create & Release to Production Floor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
