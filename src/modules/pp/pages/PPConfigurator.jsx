import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })

// ── All 15 industries from _ppConfig.js logic ─────────────────────
const INDUSTRIES = {
  surface_treatment: {
    name:'Surface Treatment / Coating', color:'#714B67', light:'#EDE0EA',
    desc:'Powder · CED · Chrome · Anodize', prodType:'batch', seqType:'sequence',
    defaultProcesses:[
      { id:'s1',name:'Inward Inspection',         machine:'INWARD',   isQC:false, isOptional:false, fields:['DC No.','Customer','Item','Qty Received','Condition','Received By'] },
      { id:'s2',name:'Pre-Treatment / Degreasing',machine:'TANK-01',  isQC:false, isOptional:false, fields:['Chemical Used','Concentration %','Temp (°C)','Duration (min)','Batch No.','Operator'] },
      { id:'s3',name:'Rinsing',                   machine:'RINSE-01', isQC:false, isOptional:true,  fields:['Water Temp (°C)','Duration (min)','pH Value','Operator'] },
      { id:'s4',name:'Phosphating',               machine:'TANK-02',  isQC:false, isOptional:false, fields:['Chemical','Concentration %','Temp (°C)','Duration (min)','Coating Wt (g/m²)','Operator'] },
      { id:'s5',name:'Powder Coating',            machine:'BOOTH-01', isQC:false, isOptional:false, fields:['Powder Brand','Color Code','Voltage (kV)','Thickness Target (µm)','Qty Coated','Operator'] },
      { id:'s6',name:'Curing / Oven',             machine:'OVEN-01',  isQC:false, isOptional:false, fields:['Temp (°C)','Duration (min)','Oven ID','Qty In','Qty Out','Operator'] },
      { id:'s7',name:'DFT / QC Check',            machine:'QC',       isQC:true,  isOptional:false, fields:['DFT Actual (µm)','DFT Target (µm)','Adhesion Test','Impact Test','Pass Qty','Fail Qty','Inspector'] },
      { id:'s8',name:'Outward / Dispatch',        machine:'DISPATCH', isQC:false, isOptional:false, fields:['Qty Dispatched','Vehicle No.','DC No. (Out)','Remarks','Dispatched By'] },
    ]
  },
  heat_treatment: {
    name:'Heat Treatment', color:'#C0392B', light:'#FDEDEC',
    desc:'Hardening · Annealing · Tempering', prodType:'batch', seqType:'sequence',
    defaultProcesses:[
      { id:'s1',name:'Job Receipt & Check',    machine:'INWARD',    isQC:false, isOptional:false, fields:['Job Card No.','Material Grade','Qty (Kg)','Drawing No.','Required HRC','Received By'] },
      { id:'s2',name:'Furnace Loading',        machine:'FURNACE-01',isQC:false, isOptional:false, fields:['Furnace ID','Load Qty (Kg)','Fixture Used','Loading Pattern','Loaded By'] },
      { id:'s3',name:'Hardening / Heating',   machine:'FURNACE-01',isQC:false, isOptional:false, fields:['Set Temp (°C)','Actual Temp (°C)','Soak Time (min)','Atmosphere','Technician'] },
      { id:'s4',name:'Quenching',             machine:'QUENCH-01', isQC:false, isOptional:false, fields:['Quench Medium','Quench Temp (°C)','Duration (sec)','Agitation','Operator'] },
      { id:'s5',name:'Tempering',             machine:'TEMP-01',   isQC:false, isOptional:false, fields:['Set Temp (°C)','Actual Temp (°C)','Soak Time (min)','Cooling Method','Operator'] },
      { id:'s6',name:'Hardness Testing',      machine:'HRC-TESTER',isQC:true,  isOptional:false, fields:['HRC Reading 1','HRC Reading 2','HRC Reading 3','Average HRC','Required HRC','Pass/Fail','Inspector'] },
      { id:'s7',name:'Shot Blasting',         machine:'BLAST-01',  isQC:false, isOptional:true,  fields:['Media Type','Pressure (bar)','Duration (min)','Surface Profile','Operator'] },
      { id:'s8',name:'Final Dispatch',        machine:'DISPATCH',  isQC:false, isOptional:false, fields:['Qty Dispatched','HRC Report No.','Dispatch DC','Remarks'] },
    ]
  },
  injection_moulding: {
    name:'Injection Moulding', color:'#1A5276', light:'#D6EAF8',
    desc:'Thermoplastic · Auto Components', prodType:'mould', seqType:'sequence',
    defaultProcesses:[
      { id:'s1',name:'Material Drying',    machine:'DRYER-01',isQC:false, isOptional:false, fields:['Material Grade','Lot No.','Dryer Temp (°C)','Drying Time (hrs)','Moisture % Before','Moisture % After','Operator'] },
      { id:'s2',name:'Mould Setup',        machine:'IMM-01',  isQC:false, isOptional:false, fields:['Mould ID','Cavity Count','Machine Tonnage','Mould Temp (°C)','Purging Done','Setup By'] },
      { id:'s3',name:'Trial Shot',         machine:'IMM-01',  isQC:true,  isOptional:false, fields:['Shot No.','Barrel Temp Z1 (°C)','Barrel Temp Z2 (°C)','Injection Pressure (bar)','Cooling Time (sec)','Shot Weight (g)','Short Shot?','Flash?','Approved By'] },
      { id:'s4',name:'Production Run',     machine:'IMM-01',  isQC:false, isOptional:false, fields:['Start Shot No.','End Shot No.','Shots Fired','Cycle Time (sec)','Barrel Temp (°C)','Shot Weight (g)','Operator','Shift'], shotCounter:true },
      { id:'s5',name:'Inline QC',          machine:'QC',      isQC:true,  isOptional:false, fields:['Sample Size','Dimension A (mm)','Dimension B (mm)','Weight (g)','Flash Check','Pass Qty','Fail Qty','QC Operator'] },
      { id:'s6',name:'Degating / Trimming',machine:'TRIM-01', isQC:false, isOptional:true,  fields:['Qty In','Gate Removed','Flash Trimmed','Qty Out','Rejection','Operator'] },
      { id:'s7',name:'Final Inspection',  machine:'QC',      isQC:true,  isOptional:false, fields:['Total Qty','Pass Qty','Fail Qty','Defect Type','Inspector','Approved By'] },
      { id:'s8',name:'Packing',            machine:'PACK',    isQC:false, isOptional:false, fields:['Qty Packed','Bag/Box Count','Label Applied','Mfg Date','Packer'] },
    ]
  },
  electroplating: {
    name:'Electroplating', color:'#1F618D', light:'#EBF5FB',
    desc:'Nickel · Zinc · Chrome · Gold', prodType:'batch', seqType:'sequence',
    defaultProcesses:[
      { id:'s1',name:'Job Receipt',                machine:'INWARD',       isQC:false, isOptional:false, fields:['Job Card No.','Part Name','Material','Qty','Customer DC No.','Received By'] },
      { id:'s2',name:'Pre-Treatment',              machine:'TANK-01',      isQC:false, isOptional:false, fields:['Process','Chemical','Concentration %','Temp (°C)','Duration (min)','Batch No.'] },
      { id:'s3',name:'Acid Cleaning / Activation', machine:'TANK-02',      isQC:false, isOptional:false, fields:['Acid Type','Concentration %','Duration (sec)','Temperature (°C)','Operator'] },
      { id:'s4',name:'Plating',                    machine:'PLATING-TANK', isQC:false, isOptional:false, fields:['Plating Type','Current (A)','Voltage (V)','Time (min)','Bath Temp (°C)','Part Area (dm²)','Calculated Thickness (µm)','Required Thickness (µm)'], amperHourCalc:true },
      { id:'s5',name:'Post Rinse',                 machine:'RINSE-01',     isQC:false, isOptional:false, fields:['Rinse Type','Water Temp (°C)','Duration (min)','pH','Operator'] },
      { id:'s6',name:'Drying',                     machine:'DRYER-01',     isQC:false, isOptional:false, fields:['Drying Method','Temp (°C)','Duration (min)','Qty Dried','Operator'] },
      { id:'s7',name:'Thickness / QC Check',       machine:'QC',           isQC:true,  isOptional:false, fields:['Thickness Actual (µm)','Thickness Required (µm)','Adhesion Test','Salt Spray (hrs)','Pass Qty','Fail Qty','Inspector'] },
      { id:'s8',name:'Dispatch',                   machine:'DISPATCH',     isQC:false, isOptional:false, fields:['Qty Dispatched','Test Report No.','DC No.','Dispatched By'] },
    ]
  },
  textile: {
    name:'Textile / Spinning', color:'#76448A', light:'#F4ECF7',
    desc:'Spinning · Weaving · Knitting', prodType:'continuous', seqType:'sequence',
    defaultProcesses:[
      { id:'s1',name:'Mixing & Blowroom',  machine:'BLW-01', isQC:false, isOptional:false, fields:['Input Qty (Kg)','Output Qty (Kg)','Waste (Kg)','Moisture %','Neps Count','Operator','Shift','Remarks'] },
      { id:'s2',name:'Carding',            machine:'CD-01',  isQC:false, isOptional:false, fields:['Sliver Weight (g/m)','Can No.','Cylinder Speed (RPM)','Flat Speed','Waste %','Operator'] },
      { id:'s3',name:'Drawing',            machine:'DR-01',  isQC:false, isOptional:false, fields:['Input Slivers','Output Qty (Kg)','Draft','Delivery Speed','Hank','Operator'] },
      { id:'s4',name:'Ring Spinning',      machine:'SPG-01', isQC:false, isOptional:false, fields:['Count (Ne)','TPI','Spindle Speed','Breakage Rate','Output (Kg)','Waste (Kg)','Operator','Shift'] },
      { id:'s5',name:'Winding / Autoconer',machine:'WND-01', isQC:false, isOptional:false, fields:['Cone Weight (g)','Drum Speed','Efficiency %','Splices/hr','Output (Cones)','Operator'] },
      { id:'s6',name:'QC / Testing',       machine:'QC',     isQC:true,  isOptional:false, fields:['Count (Ne)','CSP','Unevenness U%','Neps/km','TPI','Pass/Fail','Inspector'] },
      { id:'s7',name:'Packing & Dispatch', machine:'PACK',   isQC:false, isOptional:false, fields:['Packing Type','Bale Weight (Kg)','No. of Bales','Net Weight','Gross Weight','Operator'] },
    ]
  },
  fabrication: {
    name:'Fabrication / Sheet Metal', color:'#4D5656', light:'#EAECEE',
    desc:'Laser · Welding · Sheet Metal', prodType:'discrete', seqType:'non_sequence',
    defaultProcesses:[
      { id:'s1',name:'Drawing Issue',       machine:'DESIGN',  isQC:false, isOptional:false, fields:['Drawing No.','Rev No.','Part Name','Material Spec','Issued By','Date'] },
      { id:'s2',name:'Material Issue',      machine:'STORE',   isQC:false, isOptional:false, fields:['Material Code','Heat No.','Size (mm)','Qty Issued (Kg)','Mill Certificate No.','Store Keeper'] },
      { id:'s3',name:'Cutting / Laser',     machine:'LASER-01',isQC:false, isOptional:false, fields:['Machine','Program No.','Qty Cut','Scrap (Kg)','Cut Quality','Operator'] },
      { id:'s4',name:'Forming / Bending',   machine:'PRESS-01',isQC:false, isOptional:true,  fields:['Bend Angle','Tonnage','Back Gauge (mm)','Qty Formed','Rejection','Operator'] },
      { id:'s5',name:'Welding',             machine:'WLD-01',  isQC:false, isOptional:true,  fields:['Weld Process','WPS No.','Welder ID','Weld Length (mm)','NDT Required','Distortion'] },
      { id:'s6',name:'Grinding / Finishing',machine:'GRD-01',  isQC:false, isOptional:true,  fields:['Process','Surface Finish (Ra)','Qty Done','Rejection','Operator'] },
      { id:'s7',name:'Dimensional / NDT',   machine:'QC',      isQC:true,  isOptional:false, fields:['Drawing No.','Critical Dimensions','Pass Qty','Fail Qty','NDT Result','Inspector'] },
      { id:'s8',name:'Dispatch',            machine:'DISPATCH',isQC:false, isOptional:false, fields:['Qty Dispatched','Test Certificate','MTC No.','DC No.','Dispatched By'] },
    ]
  },
  assembly: {
    name:'Assembly Job Work', color:'#117A65', light:'#D5F5E3',
    desc:'Mechanical · Electronic · Kitting', prodType:'discrete', seqType:'sequence',
    defaultProcesses:[
      { id:'s1',name:'Parts Incoming Check',        machine:'STORE',  isQC:false, isOptional:false, fields:['BOM Ref','Part Name','Part No.','Required Qty','Received Qty','Shortage','Store Keeper'] },
      { id:'s2',name:'Sub-Assembly',                machine:'ASSY-01',isQC:false, isOptional:true,  fields:['Sub-Assembly Name','Parts Used','Qty Assembled','Torque (Nm)','Rejection','Operator'] },
      { id:'s3',name:'Main Assembly',               machine:'ASSY-02',isQC:false, isOptional:false, fields:['Assembly Level','Qty Assembled','Torque Points','Rejection','Assembler','Shift'] },
      { id:'s4',name:'Functional Test',             machine:'TEST-01',isQC:true,  isOptional:false, fields:['Test Type','Voltage (V)','Current (A)','Pass Criteria','Pass Qty','Fail Qty','Tester'] },
      { id:'s5',name:'Final Inspection',            machine:'QC',     isQC:true,  isOptional:false, fields:['Visual Check','Dimensional Check','Functional Check','Pass Qty','Fail Qty','Inspector'] },
      { id:'s6',name:'Packing & Labelling',         machine:'PACK',   isQC:false, isOptional:false, fields:['Pack Type','Qty Packed','Label Applied','Serial No. Range','Packer'] },
    ]
  },
  manufacturing: {
    name:'General Manufacturing', color:'#1A5276', light:'#D6EAF8',
    desc:'Metal · Machining · Assembly', prodType:'discrete', seqType:'non_sequence',
    defaultProcesses:[
      { id:'s1',name:'Raw Material Issue',  machine:'STORE',   isQC:false, isOptional:false, fields:['Material Code','Description','Qty Issued','Heat No.','Batch No.','Store Keeper'] },
      { id:'s2',name:'Cutting / Shearing',  machine:'CUT-01',  isQC:false, isOptional:true,  fields:['Material','Size (mm)','Qty Cut','Scrap (Kg)','Operator','Machine'] },
      { id:'s3',name:'Machining / Drilling',machine:'MCH-01',  isQC:false, isOptional:true,  fields:['Operation','Tool Used','RPM','Feed Rate','Qty Machined','Rejection','Operator'] },
      { id:'s4',name:'Welding / Joining',   machine:'WLD-01',  isQC:false, isOptional:true,  fields:['Weld Type','Current (A)','Voltage (V)','Qty Welded','Welder ID'] },
      { id:'s5',name:'Assembly',            machine:'ASSY-01', isQC:false, isOptional:false, fields:['Assembly Level','Parts Used','Qty Assembled','Torque (Nm)','Rejection','Assembler'] },
      { id:'s6',name:'Final Inspection',    machine:'QC',      isQC:true,  isOptional:false, fields:['Inspection Type','Pass Qty','Fail Qty','Deviation','NCR No.','Inspector'] },
    ]
  },
  rubber_moulding: { name:'Rubber Moulding',    color:'#4A235A', light:'#F4ECF7', desc:'Compression · Transfer · Extrusion', prodType:'mould', seqType:'sequence', defaultProcesses:[] },
  blow_moulding:   { name:'Blow Moulding',       color:'#117A65', light:'#D5F5E3', desc:'Bottles · Cans · Hollow Containers', prodType:'mould', seqType:'sequence', defaultProcesses:[] },
  printing:        { name:'Printing Industries', color:'#1B4F72', light:'#D6EAF8', desc:'Label · Packaging · Barcode · Offset', prodType:'discrete', seqType:'sequence', defaultProcesses:[] },
  chemical:        { name:'Chemical / Coating',  color:'#196F3D', light:'#E9F7EF', desc:'Paint · Coating · Chemical Process', prodType:'batch', seqType:'sequence', defaultProcesses:[] },
  food:            { name:'Food Processing',      color:'#784212', light:'#FEF5E7', desc:'Processing · Packaging · FMCG', prodType:'batch', seqType:'sequence', defaultProcesses:[] },
  pharma:          { name:'Pharma / Medicine',    color:'#6C3483', light:'#F4ECF7', desc:'Tablets · Capsules · Liquid', prodType:'batch', seqType:'sequence', defaultProcesses:[] },
  forging_casting: { name:'Forging / Casting',   color:'#784212', light:'#FEF5E7', desc:'Shot blast · Deburr · Trim', prodType:'batch', seqType:'sequence', defaultProcesses:[] },
}

const BIZ_TYPES = [
  { key:'mfg',     label:'Own Product Manufacturing',  icon:'🏭', desc:'Buy RM → Manufacture → Sell FG. BOM-based with inventory costing.' },
  { key:'jobwork', label:'Job Work / Processing',       icon:'🔧', desc:'Customer sends material. You process and charge for service.' },
  { key:'hybrid',  label:'Hybrid (Both)',               icon:'⚡', desc:'Both own manufacturing AND job work processing.' },
]
const RM_METHODS = [
  { key:'push',   label:'Push — Issue on WO Release',      desc:'Materials pre-allocated when WO is released. Best for short cycle, batch.' },
  { key:'pull',   label:'Pull — Backflush on Completion',  desc:'Materials auto-consumed on WO completion based on BOM. Best for high-volume, moulding.' },
  { key:'manual', label:'Manual — Operator Issues',        desc:'Operator raises material request during production. Best for job work, custom.' },
]
const SEQ_TYPES = [
  { key:'sequence',     label:'Sequence (Forced)',         desc:'Each stage must complete before next unlocks. Surface treatment, Heat treatment.' },
  { key:'non_sequence', label:'Non-Sequence (Free)',       desc:'All operations visible. Operator picks any. Fabrication, Machining.' },
  { key:'semi_sequence',label:'Semi-Sequence (Hybrid)',    desc:'Some stages forced, some parallel. Pharma, Assembly.' },
]

const inp  = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl  = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

// ── Drag & Drop hook ──────────────────────────────────────────────
function useDragDrop(items, setItems) {
  const dragIdx = useRef(null)
  const onDragStart = (i) => { dragIdx.current = i }
  const onDragOver  = (e) => e.preventDefault()
  const onDrop      = (i) => {
    if (dragIdx.current === null || dragIdx.current === i) return
    const next = [...items]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(i, 0, moved)
    dragIdx.current = null
    setItems(next.map((p, idx) => ({ ...p, sortOrder: idx })))
  }
  return { onDragStart, onDragOver, onDrop }
}

// ─────────────────── MAIN ────────────────────────────────────────
export default function PPConfigurator() {
  const nav = useNavigate()
  const [step,       setStep]      = useState(1)   // wizard step 1-4
  const [configId,   setConfigId]  = useState(null)
  const [saving,     setSaving]    = useState(false)
  const [loading,    setLoading]   = useState(true)

  // Config state
  const [bizType,    setBizType]   = useState('mfg')
  const [indKey,     setIndKey]    = useState('manufacturing')
  const [rmMethod,   setRmMethod]  = useState('push')
  const [seqType,    setSeqType]   = useState('sequence')
  const [chargeBy,   setChargeBy]  = useState('Per Piece')
  const [processes,  setProcesses] = useState([])
  const [workCenters,setWC]        = useState([])

  // MO (Manufacturing Order) config
  const [moEnabled,    setMoEnabled]    = useState(false)
  const [moAutoFromSO, setMoAutoFromSO] = useState(false)
  const [moAutoWO,     setMoAutoWO]     = useState(true)

  // New process form
  const [newProc, setNewProc] = useState({ name:'', machine:'', fields:[], isQC:false, isOptional:false })
  const [newField, setNewField] = useState('')
  const [editProcIdx, setEditProcIdx] = useState(null)

  const dragDrop = useDragDrop(processes, setProcesses)

  const ind = INDUSTRIES[indKey] || INDUSTRIES.manufacturing

  // Load existing config
  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/pp/config`, { headers: hdr2() })
      const data = await res.json()
      if (data.data) {
        const cfg = data.data
        setConfigId(cfg.id)
        setBizType(cfg.bizType      || 'mfg')
        setIndKey(cfg.industryKey   || 'manufacturing')
        setRmMethod(cfg.rmMethod    || 'push')
        setSeqType(cfg.sequenceType || 'sequence')
        setChargeBy(cfg.chargeBy    || 'Per Piece')
        const procs = Array.isArray(cfg.processes) ? cfg.processes : JSON.parse(cfg.processes || '[]')
        setProcesses(procs)
        const wcs = Array.isArray(cfg.workCenters) ? cfg.workCenters : JSON.parse(cfg.workCenters || '[]')
        setWC(wcs)
        setMoEnabled(cfg.moEnabled    || false)
        setMoAutoFromSO(cfg.moAutoFromSO || false)
        setMoAutoWO(cfg.moAutoWO !== false)
      }
    } catch {}
    finally { setLoading(false) }
  }, [])
  useEffect(() => { loadConfig() }, [loadConfig])

  // Load defaults when industry changes
  const loadIndustryDefaults = () => {
    const defaults = ind.defaultProcesses || []
    setProcesses(defaults.map((p, i) => ({ ...p, sortOrder: i })))
    setSeqType(ind.seqType || 'sequence')
    toast.success(`Defaults loaded for ${ind.name}`)
  }

  // Process CRUD
  const addProcess = () => {
    if (!newProc.name) return toast.error('Process name required')
    const fields = newProc.fields.filter(f => f.trim())
    if (editProcIdx !== null) {
      setProcesses(p => p.map((x, i) => i === editProcIdx ? { ...newProc, fields, sortOrder: i } : x))
      setEditProcIdx(null)
    } else {
      setProcesses(p => [...p, { ...newProc, fields, id:`custom-${Date.now()}`, sortOrder: p.length }])
    }
    setNewProc({ name:'', machine:'', fields:[], isQC:false, isOptional:false })
    setNewField('')
  }
  const editProcess = (idx) => {
    setNewProc({ ...processes[idx] })
    setEditProcIdx(idx)
  }
  const delProcess  = (idx) => setProcesses(p => p.filter((_,i) => i !== idx).map((x,i) => ({...x,sortOrder:i})))
  const addField    = () => { if (newField.trim()) { setNewProc(p => ({...p, fields:[...p.fields, newField.trim()]})); setNewField('') } }
  const delField    = (i) => setNewProc(p => ({...p, fields: p.fields.filter((_,j) => j !== i)}))

  // Work center add
  const [newWC, setNewWC] = useState({ id:'', name:'', process:'', capacity:'', unit:'Pcs/shift', shift:'General' })
  const addWC  = () => {
    if (!newWC.name) return toast.error('Work center name required')
    setWC(w => [...w, { ...newWC, id: `WC-${Date.now()}` }])
    setNewWC({ id:'', name:'', process:'', capacity:'', unit:'Pcs/shift', shift:'General' })
  }

  // Save config
  const save = async () => {
    if (!processes.length) return toast.error('Add at least one process/stage')
    setSaving(true)
    try {
      const payload = {
        bizType, industryKey: indKey, industryName: ind.name,
        prodType: ind.prodType, sequenceType: seqType,
        rmMethod, chargeBy, processes, workCenters,
        moEnabled, moAutoFromSO, moAutoWO,
        industrySettings: {
          mouldConcept: ind.prodType === 'mould',
          batchConcept: ind.prodType === 'batch',
          shotCounter:  processes.some(p => p.shotCounter),
          amperHourCalc:processes.some(p => p.amperHourCalc),
        }
      }
      const url    = configId ? `${BASE_URL}/pp/config/${configId}` : `${BASE_URL}/pp/config`
      const method = configId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: hdr(), body: JSON.stringify(payload) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      if (!configId) setConfigId(data.data?.id)
      toast.success('PP Configuration saved! Production module is now configured.')
      // Navigate to Production Plan after config saved
      setTimeout(() => nav('/pp/plan'), 1200)
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const StepBtn = ({ n, label }) => (
    <div onClick={() => setStep(n)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:8, cursor:'pointer',
      background: step===n ? '#714B67' : step>n ? '#D4EDDA' : '#F8F9FA',
      color: step===n ? '#fff' : step>n ? '#155724' : '#6C757D', fontWeight:700, fontSize:12 }}>
      <span style={{ width:22, height:22, borderRadius:'50%', background: step===n?'rgba(255,255,255,.3)':step>n?'#155724':'#E0D5E0',
        color: step===n?'#fff':step>n?'#fff':'#6C757D', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>
        {step > n ? '✓' : n}
      </span>
      {label}
    </div>
  )

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading PP Configuration...</div>

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          PP Configurator
          <small> LNV Super Admin — Production Module Setup</small>
        </div>
        <div className="fi-lv-actions">
          <span style={{fontSize:11,color:'#6C757D',marginRight:8}}>
            {configId ? `Config #${configId} — Active` : 'New Configuration'}
          </span>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/pp')}>Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving ? 'Saving...' : 'Save & Activate Config'}
          </button>
        </div>
      </div>

      {/* Super admin notice */}
      <div style={{background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:6,padding:'8px 14px',marginBottom:14,fontSize:12,color:'#856404',display:'flex',gap:8,alignItems:'center'}}>
        <strong>LNV ERP Super Admin Tool</strong> — This configuration drives the entire production module for this client installation. Changes affect all operators immediately.
      </div>

      {/* Step wizard */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <StepBtn n={1} label="Business Type" />
        <span style={{color:'#CCC',alignSelf:'center'}}>›</span>
        <StepBtn n={2} label="Industry & Method" />
        <span style={{color:'#CCC',alignSelf:'center'}}>›</span>
        <StepBtn n={3} label="Processes (Drag-Drop)" />
        <span style={{color:'#CCC',alignSelf:'center'}}>›</span>
        <StepBtn n={4} label="Work Centers" />
      </div>

      {/* ── STEP 1: Business Type ── */}
      {step === 1 && (
        <div>
          <div style={{fontWeight:700,color:'#714B67',marginBottom:14,fontSize:14}}>
            Step 1 — What is this client's business model?
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {BIZ_TYPES.map(b => (
              <div key={b.key} onClick={() => setBizType(b.key)} style={{
                border: `2px solid ${bizType===b.key?'#714B67':'#E0D5E0'}`,
                background: bizType===b.key ? '#FDF8FC' : '#fff',
                borderRadius:10, padding:20, cursor:'pointer', transition:'all .15s'
              }}>
                <div style={{fontSize:28,marginBottom:10}}>{b.icon}</div>
                <div style={{fontWeight:800,color:'#1C1C1C',marginBottom:6,fontSize:14}}>{b.label}</div>
                <div style={{fontSize:12,color:'#6C757D'}}>{b.desc}</div>
                {bizType===b.key && <div style={{marginTop:10,color:'#714B67',fontWeight:700,fontSize:12}}>✓ Selected</div>}
              </div>
            ))}
          </div>
          {/* ── MO TOGGLE — right after biz type cards ── */}
          <div style={{marginTop:20,padding:20,border:'2px solid #E0D5E0',borderRadius:10,background:'#fff'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <div style={{fontSize:20}}>🏭</div>
                  <div>
                    <div style={{fontWeight:800,fontSize:14,color:'#333'}}>Enable Manufacturing Order (MO) Concept</div>
                    <div style={{fontSize:12,color:'#6C757D',marginTop:2}}>
                      Odoo-style MO flow: <strong>Sales Order → Manufacturing Order → Work Orders → Production Entry</strong>
                    </div>
                  </div>
                </div>
                <div style={{fontSize:12,color:'#6C757D',lineHeight:1.7,maxWidth:600}}>
                  When enabled, the system creates a Manufacturing Order (MO) for each product.
                  The MO auto-explodes the BOM for materials and auto-generates Work Orders from the Routing.
                  Best for <strong>discrete manufacturing, assembly, machining</strong> where multiple operations
                  per product need to be tracked independently.
                </div>
                {moEnabled && (
                  <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:10}}>
                    <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13}}>
                      <input type="checkbox" checked={moAutoFromSO} onChange={e=>setMoAutoFromSO(e.target.checked)}
                        style={{accentColor:'#714B67',width:15,height:15}}/>
                      <div>
                        <strong>Auto-create MO when Sales Order is confirmed</strong>
                        <div style={{fontSize:11,color:'#6C757D'}}>SO confirmed → MO created automatically (no manual step)</div>
                      </div>
                    </label>
                    <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13}}>
                      <input type="checkbox" checked={moAutoWO} onChange={e=>setMoAutoWO(e.target.checked)}
                        style={{accentColor:'#714B67',width:15,height:15}}/>
                      <div>
                        <strong>Auto-create Work Orders from Routing on MO Confirm</strong>
                        <div style={{fontSize:11,color:'#6C757D'}}>MO confirmed → WOs auto-generated per routing operation</div>
                      </div>
                    </label>
                  </div>
                )}
                {moEnabled && (
                  <div style={{marginTop:12,padding:'10px 14px',background:'#D1ECF1',border:'1px solid #B8DAFF',borderRadius:6,fontSize:12,color:'#0C5460'}}>
                    <strong>MO Flow enabled:</strong> SO → MO (BOM explodes) → WOs auto-created per routing →
                    Production Entry → WO Complete → MO Done → FG to stock
                  </div>
                )}
                {!moEnabled && (
                  <div style={{marginTop:12,padding:'10px 14px',background:'#F8F9FA',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,color:'#6C757D'}}>
                    <strong>Current flow (MO disabled):</strong> Production Plan → Create WO manually → Production Entry
                  </div>
                )}
              </div>
              {/* Toggle switch */}
              <div style={{flexShrink:0,marginLeft:20,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                <div onClick={()=>setMoEnabled(m=>!m)} style={{
                  width:52,height:28,borderRadius:14,cursor:'pointer',transition:'background .2s',
                  background:moEnabled?'#714B67':'#CCC',
                  display:'flex',alignItems:'center',padding:'0 3px',
                }}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:'#fff',transition:'transform .2s',
                    transform:moEnabled?'translateX(24px)':'translateX(0)',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:moEnabled?'#714B67':'#6C757D'}}>
                  {moEnabled?'ON':'OFF'}
                </span>
              </div>
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',marginTop:20}}>
            <button className="btn btn-p sd-bsm" onClick={() => setStep(2)}>Next: Industry →</button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Industry & Method ── */}
      {step === 2 && (
        <div>
          <div style={{fontWeight:700,color:'#714B67',marginBottom:14,fontSize:14}}>
            Step 2 — Industry type, sequence and RM method
          </div>

          {/* Industry grid */}
          <div style={{fontWeight:700,color:'#333',marginBottom:8,fontSize:12}}>Select Industry:</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
            {Object.entries(INDUSTRIES).map(([key, i]) => (
              <div key={key} onClick={() => { setIndKey(key); setSeqType(i.seqType) }} style={{
                border: `2px solid ${indKey===key ? i.color : '#E0D5E0'}`,
                background: indKey===key ? i.light : '#fff',
                borderRadius:8, padding:'10px 14px', cursor:'pointer', transition:'all .15s'
              }}>
                <div style={{fontWeight:700,color:indKey===key?i.color:'#333',fontSize:12,marginBottom:2}}>{i.name}</div>
                <div style={{fontSize:10,color:'#6C757D'}}>{i.desc}</div>
                {indKey===key && <div style={{marginTop:4,fontSize:10,fontWeight:800,color:i.color}}>✓ Selected</div>}
              </div>
            ))}
          </div>

          {/* Sequence type */}
          <div style={{fontWeight:700,color:'#333',marginBottom:8,fontSize:12}}>Sequence Type:</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
            {SEQ_TYPES.map(s => (
              <div key={s.key} onClick={() => setSeqType(s.key)} style={{
                border: `2px solid ${seqType===s.key?'#714B67':'#E0D5E0'}`,
                background: seqType===s.key ? '#FDF8FC' : '#fff',
                borderRadius:8, padding:'12px 14px', cursor:'pointer'
              }}>
                <div style={{fontWeight:700,color:'#333',fontSize:12,marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:11,color:'#6C757D'}}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* RM Method */}
          <div style={{fontWeight:700,color:'#333',marginBottom:8,fontSize:12}}>Raw Material Consumption:</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
            {RM_METHODS.map(r => (
              <div key={r.key} onClick={() => setRmMethod(r.key)} style={{
                border: `2px solid ${rmMethod===r.key?'#714B67':'#E0D5E0'}`,
                background: rmMethod===r.key ? '#FDF8FC' : '#fff',
                borderRadius:8, padding:'12px 14px', cursor:'pointer'
              }}>
                <div style={{fontWeight:700,color:'#333',fontSize:12,marginBottom:4}}>{r.label}</div>
                <div style={{fontSize:11,color:'#6C757D'}}>{r.desc}</div>
              </div>
            ))}
          </div>

          {/* Charge by (for job work) */}
          {(bizType === 'jobwork' || bizType === 'hybrid') && (
            <div style={{marginBottom:20}}>
              <label style={lbl}>Charge By (Job Work)</label>
              <select style={{...inp,width:200,cursor:'pointer'}} value={chargeBy} onChange={e=>setChargeBy(e.target.value)}>
                {['Per Piece','Per Kg','Per Batch','Per Meter','Per Hour','Per Sqft','Per Litre','Per Set'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
            <button className="btn btn-s sd-bsm" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-p sd-bsm" onClick={() => setStep(3)}>Next: Processes →</button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Processes (Drag-Drop) ── */}
      {step === 3 && (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={{fontWeight:700,color:'#714B67',fontSize:14}}>
              Step 3 — Configure production stages (drag to reorder)
              <span style={{fontWeight:400,fontSize:12,color:'#6C757D',marginLeft:8}}>
                {processes.length} stages · {ind.name}
              </span>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-s sd-bsm" onClick={loadIndustryDefaults}>Load Defaults</button>
            </div>
          </div>

          {/* Drag-drop process list */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 400px',gap:14}}>
            {/* Left: process list */}
            <div>
              {processes.length === 0 ? (
                <div style={{padding:40,textAlign:'center',color:'#999',border:'2px dashed #E0D5E0',borderRadius:8,fontSize:13}}>
                  No stages yet — click "Load Defaults" or add manually
                </div>
              ) : (
                <div>
                  {processes.map((p, i) => (
                    <div key={p.id || i}
                      draggable
                      onDragStart={() => dragDrop.onDragStart(i)}
                      onDragOver={dragDrop.onDragOver}
                      onDrop={() => dragDrop.onDrop(i)}
                      style={{
                        display:'flex', alignItems:'center', gap:10,
                        padding:'10px 14px', marginBottom:6, borderRadius:8,
                        border:'1.5px solid #E0D5E0', background:'#fff',
                        cursor:'grab', userSelect:'none',
                        boxShadow:'0 1px 3px rgba(0,0,0,.06)'
                      }}>
                      {/* Drag handle */}
                      <span style={{color:'#CCC',fontSize:16,cursor:'grab',flexShrink:0}}>⠿</span>
                      {/* Stage number */}
                      <span style={{background:'#714B67',color:'#fff',borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:800,flexShrink:0,fontFamily:'DM Mono,monospace'}}>
                        {String(i+1).padStart(2,'0')}
                      </span>
                      {/* Name */}
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13}}>{p.name}</div>
                        <div style={{fontSize:10,color:'#6C757D',marginTop:1}}>
                          {p.machine && <span style={{marginRight:8}}>Machine: {p.machine}</span>}
                          <span style={{marginRight:8}}>{p.fields?.length || 0} fields</span>
                          {p.isQC      && <span style={{background:'#D1ECF1',color:'#0C5460',padding:'1px 5px',borderRadius:3,fontSize:9,fontWeight:700,marginRight:4}}>QC</span>}
                          {p.isOptional && <span style={{background:'#FFF3CD',color:'#856404',padding:'1px 5px',borderRadius:3,fontSize:9,fontWeight:700,marginRight:4}}>OPT</span>}
                          {p.shotCounter && <span style={{background:'#EDE0EA',color:'#714B67',padding:'1px 5px',borderRadius:3,fontSize:9,fontWeight:700,marginRight:4}}>SHOT</span>}
                          {p.amperHourCalc && <span style={{background:'#CCE5FF',color:'#004085',padding:'1px 5px',borderRadius:3,fontSize:9,fontWeight:700}}>A·H</span>}
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{display:'flex',gap:4,flexShrink:0}}>
                        <button className="btn-xs" onClick={() => editProcess(i)}>Edit</button>
                        <button className="btn-xs" style={{color:'var(--odoo-red)'}} onClick={() => delProcess(i)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: add/edit process form */}
            <div style={{background:'#F8F4F8',borderRadius:8,padding:16,border:'1px solid #E0D5E0'}}>
              <div style={{fontWeight:800,color:'#714B67',fontSize:12,textTransform:'uppercase',marginBottom:12}}>
                {editProcIdx !== null ? 'Edit Stage' : 'Add New Stage'}
              </div>

              <div style={{marginBottom:10}}>
                <label style={lbl}>Stage Name *</label>
                <input style={inp} value={newProc.name} onChange={e=>setNewProc(p=>({...p,name:e.target.value}))} placeholder="e.g. Powder Coating" />
              </div>
              <div style={{marginBottom:10}}>
                <label style={lbl}>Machine / Work Center</label>
                <input style={inp} value={newProc.machine} onChange={e=>setNewProc(p=>({...p,machine:e.target.value}))} placeholder="e.g. BOOTH-01" />
              </div>

              {/* Field builder */}
              <div style={{marginBottom:10}}>
                <label style={lbl}>Data Fields ({newProc.fields?.length || 0} added)</label>
                <div style={{display:'flex',gap:6,marginBottom:6}}>
                  <input style={{...inp,flex:1}} value={newField} onChange={e=>setNewField(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&addField()} placeholder="e.g. Temp (°C)" />
                  <button onClick={addField} style={{padding:'4px 12px',background:'#714B67',color:'#fff',border:'none',borderRadius:4,fontSize:11,cursor:'pointer',fontWeight:700,whiteSpace:'nowrap'}}>+ Add</button>
                </div>
                <div style={{maxHeight:120,overflowY:'auto'}}>
                  {(newProc.fields||[]).map((f,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 8px',background:'#fff',borderRadius:4,marginBottom:3,fontSize:12,border:'1px solid #E0D5E0'}}>
                      <span>{f}</span>
                      <button onClick={()=>delField(i)} style={{background:'none',border:'none',color:'#DC3545',cursor:'pointer',fontSize:13}}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div style={{display:'flex',gap:14,marginBottom:12,flexWrap:'wrap'}}>
                {[['isQC','QC Stage'],['isOptional','Optional'],['shotCounter','Shot Counter'],['amperHourCalc','Amp·Hr Calc']].map(([k,label])=>(
                  <label key={k} style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',fontSize:12}}>
                    <input type="checkbox" checked={!!newProc[k]} onChange={e=>setNewProc(p=>({...p,[k]:e.target.checked}))} style={{accentColor:'#714B67'}}/>
                    {label}
                  </label>
                ))}
              </div>

              <div style={{display:'flex',gap:8}}>
                {editProcIdx !== null && (
                  <button onClick={() => {setEditProcIdx(null);setNewProc({name:'',machine:'',fields:[],isQC:false,isOptional:false})}}
                    style={{flex:1,padding:'8px',background:'#fff',color:'#6C757D',border:'1.5px solid #E0D5E0',borderRadius:5,fontSize:12,cursor:'pointer'}}>
                    Cancel
                  </button>
                )}
                <button onClick={addProcess} style={{flex:2,padding:'8px',background:'#714B67',color:'#fff',border:'none',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  {editProcIdx !== null ? 'Update Stage' : '+ Add Stage'}
                </button>
              </div>
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
            <button className="btn btn-s sd-bsm" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-p sd-bsm" onClick={() => setStep(4)}>Next: Work Centers →</button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Work Centers ── */}
      {step === 4 && (
        <div>
          <div style={{fontWeight:700,color:'#714B67',fontSize:14,marginBottom:14}}>
            Step 4 — Define Work Centers / Machines
          </div>

          {/* Add WC form */}
          <div style={{background:'#F8F4F8',borderRadius:8,padding:16,marginBottom:14,border:'1px solid #E0D5E0'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 100px 120px',gap:10,marginBottom:8}}>
              {[['name','Work Center Name *','e.g. Powder Coat Booth 1'],['process','Linked Process','e.g. Powder Coating'],['capacity','Capacity','500'],['unit','Unit','Pcs/shift']].map(([k,l,ph])=>(
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  {k === 'unit' ? (
                    <select style={{...inp,cursor:'pointer'}} value={newWC[k]} onChange={e=>setNewWC(w=>({...w,[k]:e.target.value}))}>
                      {['Pcs/shift','Pcs/batch','Kg/shift','Kg/batch','Hrs/shift','Jobs/day'].map(u=><option key={u}>{u}</option>)}
                    </select>
                  ) : (
                    <input style={inp} value={newWC[k]} onChange={e=>setNewWC(w=>({...w,[k]:e.target.value}))} placeholder={ph}/>
                  )}
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10,alignItems:'flex-end'}}>
              <div>
                <label style={lbl}>Shift</label>
                <select style={{...inp,cursor:'pointer'}} value={newWC.shift} onChange={e=>setNewWC(w=>({...w,shift:e.target.value}))}>
                  {['General','Morning','Evening','Night','24x7'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={addWC} style={{padding:'8px 20px',background:'#714B67',color:'#fff',border:'none',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Add WC</button>
            </div>
          </div>

          {/* WC table */}
          <table className="fi-data-table">
            <thead><tr>
              <th>Work Center</th><th>Process</th><th>Capacity</th><th>Shift</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {workCenters.length === 0 ? (
                <tr><td colSpan={5} style={{padding:30,textAlign:'center',color:'#999'}}>No work centers yet — add above</td></tr>
              ) : workCenters.map((wc, i) => (
                <tr key={wc.id}>
                  <td style={{fontWeight:700}}>{wc.name}</td>
                  <td>{wc.process || '—'}</td>
                  <td style={{fontFamily:'DM Mono,monospace'}}>{wc.capacity} {wc.unit}</td>
                  <td>{wc.shift}</td>
                  <td>
                    <button className="btn-xs" style={{color:'var(--odoo-red)'}} onClick={() => setWC(w => w.filter((_,j)=>j!==i))}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Config summary */}
          <div style={{background:'#F8F4F8',borderRadius:8,padding:16,marginTop:16,border:'2px solid #714B67'}}>
            <div style={{fontWeight:800,color:'#714B67',fontSize:13,marginBottom:12}}>Configuration Summary</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,fontSize:12}}>
              {[
                ['Business Type',  BIZ_TYPES.find(b=>b.key===bizType)?.label],
                ['Industry',       ind.name],
                ['Production Type',ind.prodType],
                ['Sequence',       SEQ_TYPES.find(s=>s.key===seqType)?.label],
                ['RM Method',      RM_METHODS.find(r=>r.key===rmMethod)?.label],
                ['Stages',         `${processes.length} stages configured`],
                ['Work Centers',   `${workCenters.length} defined`],
                ['QC Stages',      `${processes.filter(p=>p.isQC).length} QC checkpoints`],
                ['Charge By',      bizType!=='mfg'?chargeBy:'N/A (Own Mfg)'],
                ['MO Concept',     moEnabled?'Enabled (Odoo MO flow)':'Disabled (WO-based)'],
                ['Auto MO from SO',moEnabled&&moAutoFromSO?'Yes — auto on SO confirm':'No — manual'],
                ['Auto WO from MO',moEnabled&&moAutoWO?'Yes — auto from routing':'No — manual'],
              ].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #E0D5E0'}}>
                  <span style={{color:'#6C757D'}}>{l}:</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
            <button className="btn btn-s sd-bsm" onClick={() => setStep(3)}>← Back</button>
            <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
              {saving ? 'Saving...' : '✓ Save & Activate Configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
