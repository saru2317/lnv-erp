import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

// ── Industry Subtypes — self-contained, no cross-module import ────────────────
// To change default industry: update ACTIVE_INDUSTRY_KEY below
const ACTIVE_INDUSTRY_KEY = 'injection_moulding'  // ← change this for each client

const INDUSTRY_SUBTYPES = [
  { key:'surface_treatment', name:'Surface Treatment',   color:'#714B67',
    processes:['Inward Inspection','Pre-Treatment / Degreasing','Rinsing','Phosphating','Powder Coating','Curing / Oven','DFT / QC Check','Outward / Dispatch'],
    defaultSequence:['Inward Inspection','Pre-Treatment / Degreasing','Phosphating','Powder Coating','Curing / Oven','DFT / QC Check','Outward / Dispatch'] },
  { key:'heat_treatment',    name:'Heat Treatment',       color:'#C0392B',
    processes:['Job Receipt & Check','Furnace Loading','Hardening / Heating','Quenching','Tempering','Hardness Testing','Shot Blasting / Cleaning','Final Dispatch'],
    defaultSequence:['Job Receipt & Check','Furnace Loading','Hardening / Heating','Quenching','Tempering','Hardness Testing','Final Dispatch'] },
  { key:'cnc_jobwork',       name:'CNC Job Work',         color:'#1A5276',
    processes:['Drawing Receipt','Material Issue','Machine Setting','Turning','Milling','Drilling','Deburring','Inspection','Dispatch'],
    defaultSequence:['Drawing Receipt','Material Issue','Machine Setting','Turning','Inspection','Dispatch'] },
  { key:'textile_proc',      name:'Textile Processing',   color:'#76448A',
    processes:['Grey Fabric Receipt','Scouring','Bleaching','Dyeing','Washing','Drying','Finishing','Quality Check','Dispatch'],
    defaultSequence:['Grey Fabric Receipt','Scouring','Dyeing','Drying','Finishing','Quality Check','Dispatch'] },
  { key:'forging_finish',    name:'Forging / Casting',    color:'#784212',
    processes:['Incoming Inspection','Shot Blasting','Trimming','Machining','Heat Treatment','Dimensional Check','Dispatch'],
    defaultSequence:['Incoming Inspection','Shot Blasting','Trimming','Dimensional Check','Dispatch'] },
  { key:'electroplating',    name:'Electroplating',       color:'#1F618D',
    processes:['Job Receipt','Pre-Treatment','Acid Cleaning / Activation','Plating','Post Rinse','Drying','Thickness / QC Check','Dispatch'],
    defaultSequence:['Job Receipt','Pre-Treatment','Activation','Plating','Rinse','Drying','QC','Dispatch'] },
  { key:'assembly_jobwork',  name:'Assembly Job Work',    color:'#117A65',
    processes:['Parts Incoming Check','Sub-Assembly','Main Assembly','Electrical / Functional Test','Final Inspection','Packing & Labelling'],
    defaultSequence:['Parts Incoming Check','Sub-Assembly','Main Assembly','Final Inspection','Packing & Labelling'] },
  { key:'printing',          name:'Printing',             color:'#1B4F72',
    processes:['Pre-Press / Artwork','Plate / Cylinder Making','Substrate Setup','Printing Run','Lamination / Coating','Die Cutting / Slitting','Inspection & Packing'],
    defaultSequence:['Pre-Press / Artwork','Plate Making','Printing Run','Die Cutting','Inspection & Packing'] },
  { key:'injection_moulding',name:'Injection Moulding',   color:'#1A5276',
    processes:['Material Drying','Mould Setup','Trial Shot','Production Run','Inline QC','Degating / Trimming','Final Inspection','Packing'],
    defaultSequence:['Material Drying','Mould Setup','Trial Shot','Production Run','Inline QC','Final Inspection','Packing'] },
  { key:'fabrication',       name:'Fabrication',          color:'#4D5656',
    processes:['Drawing Issue','Material Issue','Cutting / Laser','Forming / Bending','Welding','Grinding / Finishing','Dimensional / NDT','Dispatch'],
    defaultSequence:['Drawing Issue','Material Issue','Cutting','Welding','Inspection','Dispatch'] },
  { key:'blow_moulding',     name:'Blow Moulding',        color:'#117A65',
    processes:['Material Preparation','Mould Setup','Extrusion / Preform','Blow / Stretch','Trimming / Deflashing','Leak / Quality Test','Packing'],
    defaultSequence:['Material Preparation','Mould Setup','Extrusion / Preform','Blow / Stretch','Trimming / Deflashing','QC Test','Packing'] },
  { key:'rubber_moulding',   name:'Rubber Moulding',      color:'#4A235A',
    processes:['Compound Preparation','Preform / Slug Prep','Moulding / Curing','Deflashing','Post Cure (if req)','Inspection','Packing'],
    defaultSequence:['Compound Preparation','Preform / Slug Prep','Moulding / Curing','Deflashing','Inspection','Packing'] },
]

// ── Work Centers — Injection Moulding ────────────────────────────────────────
const WORK_CENTERS = [
  { id:'WC-001', name:'Material Dryer',       process:'Material Drying',       capacity:200, status:'Active',            operator:'Rajan K.'   },
  { id:'WC-002', name:'IMM-150T',             process:'Mould Setup',           capacity:1,   status:'Active',            operator:'Murugan S.' },
  { id:'WC-003', name:'IMM-150T',             process:'Trial Shot',            capacity:1,   status:'Active',            operator:'Murugan S.' },
  { id:'WC-004', name:'IMM-150T',             process:'Production Run',        capacity:1,   status:'Active',            operator:'Arun M.'    },
  { id:'WC-005', name:'IMM-200T',             process:'Production Run',        capacity:1,   status:'Active',            operator:'Karthik P.' },
  { id:'WC-006', name:'IMM-80T',              process:'Production Run',        capacity:1,   status:'Under Maintenance', operator:'—'          },
  { id:'WC-007', name:'QC Station',           process:'Inline QC',             capacity:0,   status:'Active',            operator:'Inspector'  },
  { id:'WC-008', name:'Trimming Station',     process:'Degating / Trimming',   capacity:500, status:'Active',            operator:'Priya D.'   },
  { id:'WC-009', name:'Final Inspection Bay', process:'Final Inspection',      capacity:0,   status:'Active',            operator:'QC Head'    },
  { id:'WC-010', name:'Packing Station',      process:'Packing',               capacity:500, status:'Active',            operator:'Store'      },
]


const BASE_URL  = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken  = () => localStorage.getItem('lnv_token')
const authHdrs  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const CONTROL_KEYS = [
  { key:'PP01', label:'PP01 — Internal Processing' },
  { key:'PP02', label:'PP02 — External Processing (Sub-contract)' },
  { key:'PP03', label:'PP03 — Inspection Operation' },
  { key:'PP04', label:'PP04 — Rework Operation' },
]

const BLANK_OP = {
  opNo:'', ctrlKey:'PP01', wcId:'', opName:'',
  setupTime:'0', machineTime:'0', laborTime:'0',
  stdValue:'1', remarks:''
  // unit is now GLOBAL — set in header, applies to all ops
}

const BLANK_HDR = {
  routingNo:'', itemCode:'', itemName:'', plant:'MAIN',
  usage:'1', status:'active', baseQty:'1', uom:'Nos',
  timeUnit:'MIN',  // ← GLOBAL unit for all operations (MIN/SEC/HR)
  industryKey: ACTIVE_INDUSTRY_KEY
}

// ── Auto generate op numbers ──────────────────────────────
const autoOpNo = (idx) => String((idx + 1) * 10).padStart(4, '0')

// ── Operation Form Row ────────────────────────────────────
function OpRow({ op, idx, items, onUpdate, onDelete, processList, wcList, procList }) {
  return (
    <tr style={{ borderBottom:'1px solid #F0EEF0' }}>
      {/* Op No */}
      <td style={{ padding:'5px 8px', width:60, textAlign:'center',
        fontFamily:'DM Mono,monospace', fontWeight:700, color:'#714B67', fontSize:12 }}>
        {autoOpNo(idx)}
      </td>
      {/* Control Key */}
      <td style={{ padding:'4px 6px', width:80 }}>
        <select
          value={op.ctrlKey}
          onChange={e => onUpdate(idx,'ctrlKey',e.target.value)}
          title={CONTROL_KEYS.find(c=>c.key===op.ctrlKey)?.label}
          style={{
            ...selStyle,
            background:
              op.ctrlKey==='PP01' ? '#D4EDDA' :
              op.ctrlKey==='PP02' ? '#FFF3CD' :
              op.ctrlKey==='PP03' ? '#D1ECF1' : '#F8D7DA',
            color:
              op.ctrlKey==='PP01' ? '#155724' :
              op.ctrlKey==='PP02' ? '#856404' :
              op.ctrlKey==='PP03' ? '#0C5460' : '#721C24',
            fontWeight: 700,
          }}>
          {CONTROL_KEYS.map(c => <option key={c.key} value={c.key}>{c.key} — {
            c.key==='PP01'?'Internal':c.key==='PP02'?'External':c.key==='PP03'?'Inspection':'Rework'
          }</option>)}
        </select>
      </td>
      {/* Work Center */}
      <td style={{ padding:'4px 6px', width:160 }}>
        <select style={selStyle} value={op.wcId}
          onChange={e => {
            const wc = wcList.find(w => w.id === e.target.value || w.wcId === e.target.value)
            onUpdate(idx, 'wcId', e.target.value)
            if (wc?.process) {
              // Auto-fill process from WC mapping — always override
              onUpdate(idx, 'opName', wc.process)
              // Auto-fill MHR if available
              if (parseFloat(wc.mhr) > 0) onUpdate(idx, 'mhr', String(wc.mhr))
            }
          }}>
          <option value=''>-- Work Center --</option>
          {wcList.map(w => (
            <option key={w.id||w.wcId} value={w.id||w.wcId}>
              {w.id||w.wcId} — {w.name}
            </option>
          ))}
        </select>
      </td>
      {/* Operation / Process — filtered by selected WC */}
      <td style={{ padding:'4px 6px', minWidth:200 }}>
        {(() => {
          // Filter processes: if WC selected → show only that WC's process + blank
          const selWC = wcList.find(w => w.id===op.wcId || w.wcId===op.wcId)
          const filteredProcs = selWC?.process
            ? [selWC.process]              // WC has ONE mapped process — show only that
            : processList                  // No WC selected — show all
          return (
            <select style={{
              ...selStyle,
              background: op.opName ? '#F0F8F0' : '#fff',
              color: op.opName ? '#155724' : '#6C757D',
              fontWeight: op.opName ? 700 : 400,
            }}
              value={op.opName}
              onChange={e => {
                const name = e.target.value
                const proc = procList?.find(p => p.name === name)
                onUpdate(idx, 'opName', name)
                if (proc) {
                  onUpdate(idx, 'processId',   proc.id)
                  onUpdate(idx, 'processCode', proc.code)
                  if (!op.wcId) onUpdate(idx, 'wcId', proc.wcId || '')
                  onUpdate(idx, 'ctrlKey',     proc.controlKey || 'PP01')
                  onUpdate(idx, 'setupTime',   String(+proc.stdSetup   || 0))
                  onUpdate(idx, 'machineTime', String(+proc.stdMachine || 0))
                  onUpdate(idx, 'laborTime',   String(+proc.stdLabor   || 0))
                }
              }}>
              <option value=''>-- {selWC ? selWC.process||'Process' : 'Select Process'} --</option>
              {filteredProcs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )
        })()}
      </td>
      {/* Setup Time */}
      <td style={{ padding:'4px 6px', width:75 }}>
        <input style={inpStyle} type='number' value={op.setupTime}
          onChange={e => onUpdate(idx,'setupTime',e.target.value)}
          placeholder="0" min="0" />
      </td>
      {/* Machine Time */}
      <td style={{ padding:'4px 6px', width:75 }}>
        <input style={inpStyle} type='number' value={op.machineTime}
          onChange={e => onUpdate(idx,'machineTime',e.target.value)}
          placeholder="0" min="0" />
      </td>
      {/* Labor Time */}
      <td style={{ padding:'4px 6px', width:75 }}>
        <input style={inpStyle} type='number' value={op.laborTime}
          onChange={e => onUpdate(idx,'laborTime',e.target.value)}
          placeholder="0" min="0" />
      </td>
      {/* Unit — now global from header, shown as read-only label */}
      <td style={{ padding:'4px 6px', width:55, textAlign:'center' }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#714B67',
          background:'#F8F4F8', padding:'4px 8px', borderRadius:4, display:'inline-block' }}>
          {op.unit||'MIN'}
        </span>
      </td>
      {/* Std Value */}
      <td style={{ padding:'4px 6px', width:70 }}>
        <input style={inpStyle} type='number' value={op.stdValue}
          onChange={e => onUpdate(idx,'stdValue',e.target.value)}
          placeholder="1" min="0" />
      </td>
      {/* Remarks */}
      <td style={{ padding:'4px 6px', minWidth:120 }}>
        <input style={inpStyle} value={op.remarks}
          onChange={e => onUpdate(idx,'remarks',e.target.value)}
          placeholder="Note" />
      </td>
      {/* Delete */}
      <td style={{ padding:'4px 6px', width:28, textAlign:'center' }}>
        <span onClick={() => onDelete(idx)}
          style={{ cursor:'pointer', color:'#DC3545', fontSize:16, fontWeight:700 }}>✕</span>
      </td>
    </tr>
  )
}

const inpStyle = {
  padding:'6px 8px', border:'1px solid #E0D5E0', borderRadius:4,
  fontSize:11, width:'100%', outline:'none', boxSizing:'border-box',
  fontFamily:'DM Sans,sans-serif'
}
const selStyle = { ...inpStyle, cursor:'pointer' }
const lbl = { fontSize:11, fontWeight:600, color:'#6C757D', display:'block', marginBottom:3 }

// ── Routing Form Modal ────────────────────────────────────
function RoutingForm({ routing, items, wcListFromDB, procList, onSave, onCancel }) {
  const isEdit = !!routing?.id
  const [hdr,  setHdr]  = useState(() => {
    if (routing) return routing
    return { ...BLANK_HDR, routingNo: `RT-${Date.now().toString().slice(-5)}` }
  })
  const [ops,  setOps]  = useState(routing?.operations || [])
  const [saving,setSaving] = useState(false)

  // Use DB work centers if available, fall back to local
  const wcList = (wcListFromDB && wcListFromDB.length > 0) ? wcListFromDB : WORK_CENTERS
  const processList   = procList && procList.length > 0
    ? procList.map(p => p.name)  // ALL 12 from DB
    : (industryData?.processes || [])  // fallback if DB empty

  // Get process details for auto-fill times
  const getProcessDetails = (name) => procList.find(p => p.name === name)

  // Auto populate operations from industry stages
  const autoFillFromIndustry = () => {
    const stages = industryData?.defaultSequence || industryData?.processes || []
    const newOps = stages.map((stage, i) => {
      const wc = wcList.find(w => w.process === stage || w.process?.toLowerCase() === stage.toLowerCase())
      const proc = procList?.find(p => p.name === stage)
      return {
        ...BLANK_OP,
        opName:      stage,
        processId:   proc?.id    || '',
        processCode: proc?.code  || '',
        wcId:        proc?.wcId  || wc?.id || '',
        ctrlKey:     proc?.controlKey || 'PP01',  // PP03 for inspection, PP04 for rework
        setupTime:   proc ? String(+proc.stdSetup)   : '0',
        machineTime: proc ? String(+proc.stdMachine) : '30',
        laborTime:   proc ? String(+proc.stdLabor)   : '15',
        unit:        proc?.unit  || 'MIN',
        _id:         Date.now() + i
      }
    })
    setOps(newOps)
    toast.success(`${stages.length} operations auto-filled from ${industryData?.name}!`)
  }

  const addOp = () => setOps(o => [...o, { ...BLANK_OP, unit: hdr.timeUnit||'MIN', _id: Date.now() }])
  const delOp    = (idx) => setOps(o => o.filter((_, i) => i !== idx))
  const updateOp = (idx, key, val) => setOps(o => o.map((r, i) => i===idx ? {...r,[key]:val} : r))

  const genRoutingNo = () => {
    const code = hdr.itemCode ? hdr.itemCode : `${Date.now().toString().slice(-5)}`
    setHdr(h => ({...h, routingNo: `RT-${code}`}))
  }

  // Total std time
  const totalMachineTime = ops.reduce((s, o) => s + (parseFloat(o.machineTime)||0) + (parseFloat(o.setupTime)||0), 0)

  const save = async () => {
    if (!hdr.routingNo) return toast.error('Routing No required!')
    if (ops.length === 0) return toast.error('Add at least one operation!')
    const invalid = ops.find(o => !o.opName)
    if (invalid) return toast.error('All operations need a Process name!')
    setSaving(true)
    try {
      // Store as JSON in routing table for now
      const payload = {
        ...hdr,
        operations: ops.map((o, i) => ({
          opNo:        autoOpNo(i),
          ctrlKey:     o.ctrlKey,
          wcId:        o.wcId,
          opName:      o.opName,
          setupTime:   parseFloat(o.setupTime)   || 0,
          machineTime: parseFloat(o.machineTime) || 0,
          laborTime:   parseFloat(o.laborTime)   || 0,
          mhr:         parseFloat(o.mhr)         || 0,
          unit:        o.unit    || hdr.timeUnit || 'MIN',
          stdValue:    parseFloat(o.stdValue)    || 1,
          remarks:     o.remarks || '',
        }))
      }
      toast.success(`Routing ${isEdit?'updated':'created'} successfully!`)
      onSave(payload)
    } catch(err) {
      toast.error('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:'98%', maxWidth:1400,
        maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700 }}>
              {isEdit ? `Edit Routing — ${routing.routingNo}` : 'New Routing / Process Master'}
            </h3>
            <p style={{ color:'rgba(255,255,255,.6)', margin:'2px 0 0', fontSize:11 }}>
              SAP: CA01 / CA03 — Manufacturing Routing with Work Centers and Time Standards
            </p>
          </div>
          <span onClick={onCancel} style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:20 }}>

          {/* Routing Header */}
          <div style={{ background:'#F8F4F8', border:'1px solid #E0D5E0',
            borderRadius:8, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
              textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
              📋 Routing Header
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px 16px' }}>
              {/* Routing No */}
              <div>
                <label style={lbl}>Routing No *</label>
                <div style={{ display:'flex', gap:4 }}>
                  <input style={{ ...inpStyle, fontFamily:'DM Mono,monospace', flex:1 }}
                    value={hdr.routingNo}
                    onChange={e => setHdr(h => ({...h, routingNo: e.target.value}))}
                    placeholder="RT-001" />
                  <button onClick={genRoutingNo}
                    style={{ padding:'6px 8px', background:'#714B67', color:'#fff',
                      border:'none', borderRadius:4, fontSize:11, cursor:'pointer' }}>
                    Auto
                  </button>
                </div>
              </div>
              {/* Industry Type — driven by _configData.js COMPANY.industry */}
              <div>
                <label style={lbl}>Industry Type</label>
                <select style={{ ...selStyle, fontWeight:600, color: INDUSTRY_SUBTYPES.find(i=>i.key===hdr.industryKey)?.color || '#714B67' }}
                  value={hdr.industryKey}
                  onChange={e => setHdr(h => ({...h, industryKey: e.target.value}))}>
                  {INDUSTRY_SUBTYPES.map(i => (
                    <option key={i.key} value={i.key}>{i.name}</option>
                  ))}
                </select>
              </div>
              {/* Item Code */}
              <div>
                <label style={lbl}>Item Code (FG / SFG)</label>
                <select style={selStyle} value={hdr.itemCode}
                  onChange={e => {
                    const found = items.find(i => i.code === e.target.value)
                    setHdr(h => ({...h, itemCode: e.target.value, itemName: found?.name || ''}))
                  }}>
                  <option value=''>-- Select Item ({items.length} loaded) --</option>
                  {items.map(i => <option key={i.id} value={i.code}>{i.code} — {i.name}</option>)}
                </select>
              </div>
              {/* Item Name */}
              <div style={{ gridColumn:'span 2' }}>
                <label style={lbl}>Item / Process Name</label>
                <input style={{ ...inpStyle, background: hdr.itemCode ? '#F8F7FA' : '#fff' }}
                  value={hdr.itemName}
                  onChange={e => setHdr(h => ({...h, itemName: e.target.value}))}
                  placeholder="e.g. PP Cap 20ml — Moulding Process"
                  readOnly={!!hdr.itemCode} />
              </div>
              {/* Plant */}
              <div>
                <label style={lbl}>Plant</label>
                <select style={selStyle} value={hdr.plant}
                  onChange={e => setHdr(h => ({...h, plant: e.target.value}))}>
                  <option>MAIN</option><option>PLANT2</option><option>STORE</option>
                </select>
              </div>
              {/* Usage */}
              <div>
                <label style={lbl}>Usage</label>
                <select style={selStyle} value={hdr.usage}
                  onChange={e => setHdr(h => ({...h, usage: e.target.value}))}>
                  <option value='1'>1 — Production</option>
                  <option value='3'>3 — Universal</option>
                  <option value='5'>5 — Sales</option>
                  <option value='6'>6 — Engineering</option>
                </select>
              </div>
              {/* Base Qty */}
              <div>
                <label style={lbl}>Base Qty</label>
                <input style={inpStyle} type='number' value={hdr.baseQty}
                  onChange={e => setHdr(h => ({...h, baseQty: e.target.value}))}
                  placeholder="1" />
              </div>
              {/* UOM */}
              <div>
                <label style={lbl}>Base UOM</label>
                <select style={selStyle} value={hdr.uom}
                  onChange={e => setHdr(h => ({...h, uom: e.target.value}))}>
                  {['Nos','Kg','Ltr','Mtr','Set','Roll','Box'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              {/* Global Time Unit — applies to ALL operations */}
              <div>
                <label style={lbl}>
                  ⏱️ Time Unit <span style={{fontWeight:400,color:'#6C757D'}}>(all ops)</span>
                </label>
                <select style={{...selStyle, fontWeight:700, color:'#714B67', background:'#F8F4F8'}}
                  value={hdr.timeUnit||'MIN'}
                  onChange={e => {
                    setHdr(h => ({...h, timeUnit: e.target.value}))
                    // Apply to all existing ops too
                    setOps(o => o.map(op => ({...op, unit: e.target.value})))
                  }}>
                  <option value='MIN'>MIN — Minutes</option>
                  <option value='SEC'>SEC — Seconds</option>
                  <option value='HR'>HR — Hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Operations Section */}
          <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden' }}>
            <div style={{ background:'#F8F4F8', padding:'10px 16px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#714B67',
                  textTransform:'uppercase', letterSpacing:.5 }}>
                  ⚙️ Operations ({ops.length})
                </span>
                {totalMachineTime > 0 && (
                  <span style={{ fontSize:11, color:'#6C757D' }}>
                    Total Std Time: <strong style={{ color:'#714B67' }}>{totalMachineTime} {hdr.timeUnit||'MIN'}</strong>
                    &nbsp;({hdr.timeUnit==='SEC'?(totalMachineTime/60).toFixed(0)+' min':hdr.timeUnit==='HR'?(totalMachineTime*60).toFixed(0)+' min':(totalMachineTime/60).toFixed(1)+' hrs'})
                  </span>
                )}
                {/* Legend */}
                <div style={{ display:'flex', gap:5 }}>
                  {[['PP01','Internal','#D4EDDA','#155724'],['PP02','External','#FFF3CD','#856404'],
                    ['PP03','Inspection','#D1ECF1','#0C5460'],['PP04','Rework','#F8D7DA','#721C24']
                  ].map(([k,l,bg,c]) => (
                    <span key={k} style={{ padding:'2px 7px', borderRadius:10, fontSize:10,
                      fontWeight:700, background:bg, color:c }}>{k}={l}</span>
                  ))}
                </div>
                {/* Control Key Legend */}
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  {[
                    { key:'PP01', label:'Internal',   color:'#D4EDDA', text:'#155724' },
                    { key:'PP02', label:'External',   color:'#FFF3CD', text:'#856404' },
                    { key:'PP03', label:'Inspection', color:'#D1ECF1', text:'#0C5460' },
                    { key:'PP04', label:'Rework',     color:'#F8D7DA', text:'#721C24' },
                  ].map(c => (
                    <span key={c.key} style={{ padding:'2px 8px', borderRadius:10,
                      fontSize:10, fontWeight:700, background:c.color, color:c.text }}>
                      {c.key} = {c.label}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={autoFillFromIndustry}
                  style={{ padding:'6px 14px', background:'#00A09D', color:'#fff',
                    border:'none', borderRadius:5, fontSize:11, fontWeight:700,
                    cursor:'pointer' }}>
                  ⚡ Auto-fill from {industryData?.name || 'Industry'}
                </button>
                <button onClick={addOp}
                  style={{ padding:'6px 14px', background:'#28A745', color:'#fff',
                    border:'none', borderRadius:5, fontSize:12, fontWeight:700,
                    cursor:'pointer' }}>
                  + Add Operation
                </button>
              </div>
            </div>

            {/* Operations Table */}
            <div style={{ maxHeight:380, overflowY:'auto', overflowX:'auto' }}>
              <table style={{ width:'100%', minWidth:1100, borderCollapse:'collapse' }}>
                <thead style={{ position:'sticky', top:0, background:'#F0EEF0', zIndex:5 }}>
                  <tr>
                    {[
                      {l:'Op No', w:60}, {l:'Ctrl Key', w:80}, {l:'Work Center', w:160},
                      {l:'Operation / Process', w:200},
                      {l:`Setup (${hdr.timeUnit||'MIN'})`, w:80},
                      {l:`Machine (${hdr.timeUnit||'MIN'})`, w:95},
                      {l:`Labor (${hdr.timeUnit||'MIN'})`, w:80},
                      {l:'Unit', w:55}, {l:'Std Val', w:70},
                      {l:'Remarks', w:120}, {l:'', w:28}
                    ].map(h => (
                      <th key={h.l} style={{ padding:'8px 8px', fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'center', verticalAlign:'middle',
                        textTransform:'uppercase', letterSpacing:.4,
                        borderBottom:'1px solid #E0D5E0', width:h.w, whiteSpace:'nowrap' }}>
                        {h.l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ops.map((op, idx) => (
                    <OpRow key={op._id || op.opNo || idx}
                      op={op} idx={idx}
                      processList={processList}
                      wcList={wcList}
                      procList={procList}
                      onUpdate={updateOp}
                      onDelete={delOp}
                    />
                  ))}
                  {ops.length === 0 && (
                    <tr><td colSpan={11} style={{ padding:24, textAlign:'center',
                      color:'#6C757D', fontSize:12 }}>
                      No operations — click "⚡ Auto-fill from Industry" or "+ Add Operation"
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary bar */}
            {ops.length > 0 && (
              <div style={{ padding:'8px 16px', background:'#F8F7FA',
                borderTop:'1px solid #E0D5E0', display:'flex', gap:24, flexWrap:'wrap',
                fontSize:11, color:'#6C757D' }}>
                <span>Operations: <strong style={{ color:'#714B67' }}>{ops.length}</strong></span>
                <span>Internal (PP01): <strong>{ops.filter(o=>o.ctrlKey==='PP01').length}</strong></span>
                <span>External (PP02): <strong>{ops.filter(o=>o.ctrlKey==='PP02').length}</strong></span>
                <span>Inspection (PP03): <strong>{ops.filter(o=>o.ctrlKey==='PP03').length}</strong></span>
                <span>Total Setup: <strong>{ops.reduce((s,o)=>s+(parseFloat(o.setupTime)||0),0)} {hdr.timeUnit||'MIN'}</strong></span>
                <span>Total Machine: <strong>{ops.reduce((s,o)=>s+(parseFloat(o.machineTime)||0),0)} {hdr.timeUnit||'MIN'}</strong></span>
                <span>Total Labor: <strong>{ops.reduce((s,o)=>s+(parseFloat(o.laborTime)||0),0)} {hdr.timeUnit||'MIN'}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          background:'#F8F7FA' }}>
          <span style={{ fontSize:11, color:'#6C757D' }}>
            {ops.length > 0 && `⏱️ Total Std Time: ${totalMachineTime} ${hdr.timeUnit||'MIN'} (${hdr.timeUnit==='SEC'?(totalMachineTime/60).toFixed(1)+' min':hdr.timeUnit==='HR'?(totalMachineTime*60).toFixed(0)+' min':(totalMachineTime/60).toFixed(1)+' hrs'})`}
          </span>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onCancel}
              style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
                border:'1.5px solid #E0D5E0', borderRadius:6, fontSize:13,
                cursor:'pointer' }}>Cancel</button>
            <button onClick={save} disabled={saving}
              style={{ padding:'8px 24px',
                background: saving ? '#9E7D96' : '#714B67',
                color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:700,
                cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '⏳ Saving...' : (isEdit ? '💾 Update Routing' : '💾 Create Routing')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── View Routing Detail ───────────────────────────────────
function RoutingDetail({ routing, onClose, onEdit }) {
  const ops = routing.operations || []
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:'85%', maxWidth:1000,
        maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif', fontSize:16 }}>
              {routing.routingNo}
            </h3>
            <p style={{ color:'rgba(255,255,255,.7)', margin:'2px 0 0', fontSize:11 }}>
              {routing.itemName || '—'} &nbsp;|&nbsp;
              Plant: {routing.plant} &nbsp;|&nbsp;
              {ops.length} Operations &nbsp;|&nbsp;
              Std Time: {ops.reduce((s,o)=>s+(parseFloat(o.machineTime)||0)+(parseFloat(o.setupTime)||0),0)} {routing.timeUnit||'MIN'}
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onEdit}
              style={{ padding:'6px 14px', background:'rgba(255,255,255,.2)',
                color:'#fff', border:'1px solid rgba(255,255,255,.4)',
                borderRadius:5, fontSize:12, cursor:'pointer' }}>✏️ Edit</button>
            <span onClick={onClose}
              style={{ color:'#fff', cursor:'pointer', fontSize:20, padding:4 }}>✕</span>
          </div>
        </div>

        {/* Info bar */}
        <div style={{ padding:'10px 20px', background:'#F8F4F8',
          display:'flex', gap:24, fontSize:12, borderBottom:'1px solid #E0D5E0', flexWrap:'wrap' }}>
          <span>Plant: <strong>{routing.plant || 'MAIN'}</strong></span>
          <span>Usage: <strong>{routing.usage || '1'}</strong></span>
          <span>Base Qty: <strong>{routing.baseQty || 1} {routing.uom || 'Nos'}</strong></span>
          <span>Industry: <strong>{INDUSTRY_SUBTYPES.find(i=>i.key===routing.industryKey)?.name || '—'}</strong></span>
          <span>Status: <strong style={{ color:'#155724' }}>Active</strong></span>
        </div>

        {/* Operations */}
        <div style={{ overflowY:'auto', flex:1, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#714B67',
            textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>
            ⚙️ Operation Overview
          </div>
          <div style={{ maxHeight:'none', overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
              <thead style={{ background:'#F8F4F8' }}>
                <tr>
                  {['Op No','Ctrl Key','Work Center','Operation / Process',
                    `Setup (${routing.timeUnit||'MIN'})`,
                    `Machine (${routing.timeUnit||'MIN'})`,
                    `Labor (${routing.timeUnit||'MIN'})`,
                    'Unit','Remarks'].map(h => (
                    <th key={h} style={{ padding:'8px 12px', fontSize:10, fontWeight:700,
                      color:'#6C757D', textAlign:'left', textTransform:'uppercase',
                      letterSpacing:.4, borderBottom:'2px solid #E0D5E0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ops.map((op, i) => {
                  const wc = (wcListFromDB||WORK_CENTERS).find(w => w.id===op.wcId || w.wcId===op.wcId)
                  const ck = CONTROL_KEYS.find(c => c.key === op.ctrlKey)
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid #F0EEF0',
                      background: i%2===0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding:'10px 12px', fontFamily:'DM Mono,monospace',
                        fontWeight:700, color:'#714B67', fontSize:12 }}>{op.opNo}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10,
                          fontWeight:700,
                          background: op.ctrlKey==='PP01'?'#D4EDDA':op.ctrlKey==='PP02'?'#FFF3CD':op.ctrlKey==='PP03'?'#D1ECF1':'#F8D7DA',
                          color: op.ctrlKey==='PP01'?'#155724':op.ctrlKey==='PP02'?'#856404':op.ctrlKey==='PP03'?'#0C5460':'#721C24'
                        }}>{op.ctrlKey}</span>
                      </td>
                      <td style={{ padding:'10px 12px', fontSize:11, color:'#495057' }}>
                        {wc ? `${wc.id} — ${wc.name}` : op.wcId || '—'}
                      </td>
                      <td style={{ padding:'10px 12px', fontWeight:600, fontSize:12 }}>{op.opName}</td>
                      <td style={{ padding:'10px 12px', fontSize:11, textAlign:'center' }}>{op.setupTime || 0}</td>
                      <td style={{ padding:'10px 12px', fontSize:11, textAlign:'center',
                        fontWeight:600, color:'#714B67' }}>{op.machineTime || 0}</td>
                      <td style={{ padding:'10px 12px', fontSize:11, textAlign:'center' }}>{op.laborTime || 0}</td>
                      <td style={{ padding:'10px 12px', fontSize:11, color:'#6C757D' }}>{op.unit || 'MIN'}</td>
                      <td style={{ padding:'10px 12px', fontSize:11, color:'#6C757D',
                        fontStyle: op.remarks?'normal':'italic' }}>{op.remarks || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN LIST ─────────────────────────────────────────────
export default function RoutingMaster() {
  const [routings,  setRoutings]  = useState([])
  const [items,     setItems]     = useState([])
  const [wcList,    setWcList]    = useState(WORK_CENTERS) // start with local, replace from API
  const [loading,   setLoading]   = useState(false)
  const [search,    setSearch]    = useState('')
  const [indFilter, setIndFilter] = useState('All')
  const [showForm,   setShowForm]  = useState(false)
  const [editRt,     setEditRt]    = useState(null)
  const [viewRt,     setViewRt]    = useState(null)
  const [procList,   setProcList]  = useState([])

  // Load process master from backend
  const fetchProcesses = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/process`, { headers: authHdrs() })
      const data = await res.json()
      setProcList(data.data || [])
    } catch(err) { console.log('Process fetch error') }
  }

  // Load items — try multiple endpoints, filter FG+SFG
  const fetchItems = async () => {
    const endpoints = [
      `${BASE_URL}/mdm/items`, `${BASE_URL}/mdm/item`,
      `${BASE_URL}/items`,     `${BASE_URL}/item`,
    ]
    const RM_PREFIXES = ['RM','SP','PKG','PK','CHM','OIL','CON','RAW','MAT']
    const RM_CATS     = ['raw','consumable','packing','spare','chemical','paint','oil']
    for (const url of endpoints) {
      try {
        const res  = await fetch(url, { headers: authHdrs() })
        if (!res.ok) continue
        const data = await res.json()
        const all  = Array.isArray(data) ? data : (data.data || data.items || [])
        if (all.length > 0) {
          const isNotRM = it => {
            const code = (it.code||'').toUpperCase()
            const cat  = (it.category||'').toLowerCase()
            return !RM_PREFIXES.some(p=>code.startsWith(p+'-')||code.startsWith(p+'_'))
                && !RM_CATS.some(c=>cat.includes(c))
          }
          const fg = all.filter(isNotRM)
          setItems(fg.length > 0 ? fg : all)
          return
        }
      } catch { continue }
    }
  }

  useEffect(() => {
    fetchItems()
    fetchProcesses()
    fetchWCs()
    fetchRoutings()
  }, [])

  // Fetch Work Centers from DB — replaces local WORK_CENTERS constant
  const fetchWCs = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/pp/work-centers`, { headers: authHdrs() })
      const data = await res.json()
      const list = data.data || []
      if (list.length > 0) setWcList(list)  // use DB data; keep local WORK_CENTERS as fallback
    } catch {}
  }

  const fetchRoutings = async () => {
    try {
      setLoading(true)
      const res  = await fetch(`${BASE_URL}/pp/routing-master`, { headers: authHdrs() })
      const data = await res.json()
      if (res.ok) setRoutings(data.data || [])
    } catch(err) { console.log('Routing fetch error') }
    finally { setLoading(false) }
  }

  const saveRouting = async (payload) => {
    try {
      const url    = editRt?.id ? `${BASE_URL}/pp/routing-master/${editRt.id}` : `${BASE_URL}/pp/routing-master`
      const method = editRt?.id ? 'PATCH' : 'POST'
      const res    = await fetch(url, { method, headers: authHdrs(), body: JSON.stringify(payload) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(`Routing ${editRt ? 'updated' : 'created'}!`)
      setShowForm(false); setEditRt(null)
      fetchRoutings()
    } catch(err) {
      toast.error('Error: ' + err.message)
    }
  }

  const saveRoutingOld = (payload) => {
  }

  const deactivate = async (id) => {
    if (!confirm('Deactivate this Routing?')) return
    await fetch(`${BASE_URL}/pp/routing-master/${id}`, { method:'DELETE', headers: authHdrs() })
    toast.success('Routing deactivated!')
    fetchRoutings()
  }

  const filtered = routings.filter(r =>
    (indFilter === 'All' || r.industryKey === indFilter) &&
    (r.routingNo?.toLowerCase().includes(search.toLowerCase()) ||
     r.itemName?.toLowerCase().includes(search.toLowerCase()) ||
     r.itemCode?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Routing / Process Master
          <small>SAP: CA01/CA03 · {routings.length} Routings</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p" onClick={() => { setEditRt(null); setShowForm(true) }}>
            + New Routing
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:'8px 12px', background:'#E6F7F7', border:'1px solid #00A09D',
        borderRadius:6, marginBottom:14, fontSize:12, color:'#005A58' }}>
        <strong>Routing / Process Master</strong> — Define manufacturing operations with Work Centers,
        Control Keys (PP01-PP04) and Time Standards (Setup · Machine · Labor).
        Operations auto-fill from industry configuration.
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total Routings', value: routings.length,                                color:'#714B67', bg:'#EDE0EA' },
          { label:'PP01 Internal',  value: routings.reduce((s,r)=>s+(r.operations||[]).filter(o=>o.ctrlKey==='PP01').length,0), color:'#155724', bg:'#D4EDDA' },
          { label:'PP02 External',  value: routings.reduce((s,r)=>s+(r.operations||[]).filter(o=>o.ctrlKey==='PP02').length,0), color:'#856404', bg:'#FFF3CD' },
          { label:'PP03 Inspection',value: routings.reduce((s,r)=>s+(r.operations||[]).filter(o=>o.ctrlKey==='PP03').length,0), color:'#0C5460', bg:'#D1ECF1' },
          { label:'Total Ops',      value: routings.reduce((s,r)=>s+(r.operations||[]).length,0), color:'#4A235A', bg:'#F4ECF7' },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, borderRadius:8,
            padding:'12px 16px', border:`1px solid ${k.color}22` }}>
            <div style={{ fontSize:11, color:k.color, fontWeight:600,
              textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color,
              fontFamily:'Syne,sans-serif', lineHeight:1.2 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center', flexWrap:'wrap' }}>
        <input placeholder="🔍 Search Routing No, Item Code or Name..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:'7px 12px', border:'1px solid var(--odoo-border)',
            borderRadius:6, fontSize:12, outline:'none', width:320 }} />
        {/* Industry filter hidden - LNV is single industry */}
        <span style={{ fontSize:11, color:'var(--odoo-gray)', marginLeft:'auto' }}>
          {filtered.length} of {routings.length} routings
        </span>
      </div>

      {/* Table */}
      <div style={{ maxHeight:'calc(100vh - 380px)', overflowY:'auto', overflowX:'auto',
        border:'1px solid var(--odoo-border)', borderRadius:6 }}>
        <table className="fi-data-table" style={{ width:'100%', minWidth:900 }}>
          <thead style={{ position:'sticky', top:0, background:'#F8F4F8', zIndex:10 }}>
            <tr>
              <th>Routing No</th>
              <th>Item / Process</th>
              <th>Plant</th>
              <th>Operations</th>
              <th>Std Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rt, i) => {
              const ops = rt.operations || []
              const totalTime = ops.reduce((s,o)=>s+(parseFloat(o.machineTime)||0)+(parseFloat(o.setupTime)||0),0)
              const ind = INDUSTRY_SUBTYPES.find(x => x.key === rt.industryKey)
              return (
                <tr key={rt.id || rt.routingNo}
                  style={{ background:i%2===0?'#fff':'#FAFAFA' }}>
                  <td style={{ fontFamily:'DM Mono,monospace', fontWeight:700,
                    color:'var(--odoo-purple)', fontSize:12, cursor:'pointer' }}
                    onClick={() => setViewRt(rt)}>
                    {rt.routingNo}
                  </td>
                  <td style={{ fontWeight:600, fontSize:12 }}>{rt.itemName || '—'}</td>
                  <td style={{ fontSize:11, color:'#6C757D' }}>{rt.plant || 'MAIN'}</td>
                  <td style={{ fontSize:12, textAlign:'center' }}>
                    <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11,
                      background:'#D1ECF1', color:'#0C5460', fontWeight:600 }}>
                      {ops.length} ops
                    </span>
                  </td>
                  <td style={{ fontSize:11, color:'#714B67', fontWeight:600 }}>
                    {totalTime > 0 ? `${totalTime} ${rt.timeUnit||'MIN'}` : '—'}
                  </td>
                  <td>
                    <span style={{ padding:'2px 8px', borderRadius:8, fontSize:10,
                      fontWeight:600, background:'#D4EDDA', color:'#155724' }}>Active</span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => setViewRt(rt)}
                        style={{ padding:'3px 8px', fontSize:10, fontWeight:600, borderRadius:4,
                          border:'1px solid #00A09D', background:'#E6F7F7',
                          color:'#005A58', cursor:'pointer' }}>View</button>
                      <button onClick={() => { setEditRt(rt); setShowForm(true) }}
                        style={{ padding:'3px 8px', fontSize:10, fontWeight:600, borderRadius:4,
                          border:'1px solid var(--odoo-purple)', background:'var(--odoo-purple-lt)',
                          color:'var(--odoo-purple)', cursor:'pointer' }}>Edit</button>
                      <button onClick={() => deactivate(rt.id)}
                        style={{ padding:'3px 8px', fontSize:10, fontWeight:600, borderRadius:4,
                          border:'1px solid #6C757D', background:'#F8F9FA',
                          color:'#6C757D', cursor:'pointer' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding:40, textAlign:'center',
                color:'#6C757D', fontSize:13 }}>
                {routings.length === 0
                  ? '⚙️ No routings yet — click "+ New Routing" to create one'
                  : 'No routings match your filter'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <RoutingForm
          routing={editRt}
          items={items}
          wcListFromDB={wcList}
          procList={procList}
          onSave={saveRouting}
          onCancel={() => { setShowForm(false); setEditRt(null) }}
        />
      )}

      {/* Detail View */}
      {viewRt && (
        <RoutingDetail
          routing={viewRt}
          onClose={() => setViewRt(null)}
          onEdit={() => { setEditRt(viewRt); setViewRt(null); setShowForm(true) }}
        />
      )}
    </div>
  )
}
