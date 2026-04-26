import React, { useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { SEG_TYPE, assembleCode, resolveSegment } from '@utils/itemCodeGenerator'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')

// ─── Constants ────────────────────────────────────────────────────
const SEG_TYPES = [
  { value: 'FIXED',      label: 'Fixed Value',      hint: 'Always same value (e.g. type code)',        color: '#EDE0EA', text: '#714B67' },
  { value: 'DROPDOWN',   label: 'Dropdown (Options)',hint: 'User selects from configured options',      color: '#D4EDDA', text: '#155724' },
  { value: 'AUTO_INC',   label: 'Auto Increment',   hint: 'System auto-increments per prefix',         color: '#D1ECF1', text: '#0C5460' },
  { value: 'YEAR',       label: 'Year',             hint: 'Current year (length 2=26, 4=2026)',         color: '#FFF3CD', text: '#856404' },
  { value: 'MONTH',      label: 'Month',            hint: 'Current month 01-12',                       color: '#FFF3CD', text: '#856404' },
  { value: 'USER_INPUT', label: 'User Input',       hint: 'Free text, max length enforced',            color: '#F8D7DA', text: '#721C24' },
  { value: 'COMPUTED',   label: 'Computed Formula', hint: 'Formula-based (e.g. GEN_SEQ for Polymer)',  color: '#CCE5FF', text: '#004085' },
]

const FORMULAS  = ['GEN_SEQ', 'YEAR2', 'YEAR4', 'MONTH2']
const SEPARATORS = [
  { value: ' ',  label: 'Space ( )' },
  { value: '-',  label: 'Dash (-)' },
  { value: '/',  label: 'Slash (/)' },
  { value: '',   label: 'None (no separator)' },
]

const EMPTY_SEG = {
  pos: 1, label: '', type: 'DROPDOWN',
  value: '', length: 3, padChar: '0',
  required: true, hint: '', formula: ''
}

// Default seed configs for common types
const SEED_CONFIGS = {
  PY: {
    configName: 'PY — Polymer / Plastic Components',
    separator: ' ', exampleCode: 'PY BH 6001 T028 001',
    segments: [
      { pos:1, label:'TYPE',    type:'FIXED',    value:'PY', length:2, required:true,  hint:'Item Type — auto' },
      { pos:2, label:'CLASS',   type:'DROPDOWN', value:'',   length:2, required:true,  hint:'Product class e.g. BH' },
      { pos:3, label:'S-CLASS', type:'COMPUTED', formula:'GEN_SEQ', length:4, padChar:'0', required:true, hint:'Generation × 1000 + seq' },
      { pos:4, label:'VARIANT', type:'DROPDOWN', value:'',   length:4, required:true,  hint:'Main body variant e.g. T028' },
      { pos:5, label:'RUNNING', type:'AUTO_INC', value:'',   length:3, padChar:'0', required:true, hint:'Auto' },
    ],
    options: {
      2: [{ optCode:'BH',optLabel:'Bobbin Holder' },{ optCode:'PC',optLabel:'Pump Controller' },{ optCode:'SF',optLabel:'Spindle Flyer' },{ optCode:'RG',optLabel:'Ring Rail' }],
      4: [{ optCode:'T028',optLabel:'Main Body T028' },{ optCode:'T030',optLabel:'Main Body T030' },{ optCode:'T032',optLabel:'Main Body T032' },{ optCode:'T036',optLabel:'Main Body T036' }],
    }
  },
  FG: {
    configName: 'FG — Finished Goods',
    separator: '-', exampleCode: 'FG-BH-0001',
    segments: [
      { pos:1, label:'TYPE',  type:'FIXED',    value:'FG', length:2, required:true,  hint:'Item Type — auto' },
      { pos:2, label:'GROUP', type:'DROPDOWN', value:'',   length:3, required:true,  hint:'Product group' },
      { pos:3, label:'SEQ',   type:'AUTO_INC', value:'',   length:4, padChar:'0', required:true, hint:'Auto running' },
    ],
    options: { 2: [] }
  },
  RM: {
    configName: 'RM — Raw Material',
    separator: '-', exampleCode: 'RM-COT-26-0001',
    segments: [
      { pos:1, label:'TYPE',    type:'FIXED',    value:'RM', length:2, required:true,  hint:'Item Type — auto' },
      { pos:2, label:'SUBTYPE', type:'DROPDOWN', value:'',   length:3, required:true,  hint:'Material subtype e.g. COT' },
      { pos:3, label:'YEAR',    type:'YEAR',     value:'',   length:2, required:false, hint:'Last 2 digits of year' },
      { pos:4, label:'SEQ',     type:'AUTO_INC', value:'',   length:4, padChar:'0', required:true, hint:'Auto running' },
    ],
    options: { 2: [{ optCode:'COT',optLabel:'Cotton' },{ optCode:'CHM',optLabel:'Chemical' },{ optCode:'DYE',optLabel:'Dyes' }] }
  },
  CN: {
    configName: 'CN — Consumables',
    separator: '-', exampleCode: 'CN-MNT-0001',
    segments: [
      { pos:1, label:'TYPE',  type:'FIXED',    value:'CN', length:2, required:true, hint:'Item Type — auto' },
      { pos:2, label:'CAT',   type:'DROPDOWN', value:'',   length:3, required:true, hint:'Consumable category' },
      { pos:3, label:'SEQ',   type:'AUTO_INC', value:'',   length:4, padChar:'0', required:true, hint:'Auto running' },
    ],
    options: { 2: [{ optCode:'MNT',optLabel:'Maintenance' },{ optCode:'OFF',optLabel:'Office' },{ optCode:'PKG',optLabel:'Packing' }] }
  },
  MI: {
    configName: 'MI — Maintenance Item',
    separator: '-', exampleCode: 'MI-ELC-0001',
    segments: [
      { pos:1, label:'TYPE', type:'FIXED',    value:'MI', length:2, required:true, hint:'Item Type — auto' },
      { pos:2, label:'CAT',  type:'DROPDOWN', value:'',   length:3, required:true, hint:'Maint. category' },
      { pos:3, label:'SEQ',  type:'AUTO_INC', value:'',   length:4, padChar:'0', required:true, hint:'Auto running' },
    ],
    options: { 2: [{ optCode:'ELC',optLabel:'Electrical' },{ optCode:'MCH',optLabel:'Mechanical' },{ optCode:'PLM',optLabel:'Plumbing' }] }
  },
}

// ─── CSS ─────────────────────────────────────────────────────────
if (!document.getElementById('iccm-css')) {
  const s = document.createElement('style')
  s.id = 'iccm-css'
  s.textContent = `
    .iccm-row:hover { background: #FBF7FA !important; cursor:pointer; }
    .seg-row { display:grid; grid-template-columns:40px 1fr 160px 70px 60px 60px 80px 80px 36px; gap:6px; align-items:center; padding:6px 8px; border-radius:6px; background:#fff; border:1px solid #E0D5E0; margin-bottom:6px; }
    .seg-row:hover { border-color:#714B67; }
    .seg-inp { padding:5px 8px; border:1px solid #E0D5E0; border-radius:4px; font-size:12px; font-family:DM Sans,sans-serif; outline:none; width:100%; box-sizing:border-box; }
    .seg-inp:focus { border-color:#714B67; }
  `
  document.head.appendChild(s)
}

const LBL  = { fontSize:11, fontWeight:700, color:'#6C757D', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }
const TH   = { padding:'9px 14px', fontSize:11, fontWeight:700, color:'#6C757D', textAlign:'left', textTransform:'uppercase', letterSpacing:.5 }

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function ItemCodeConfigMaster() {
  const [view,     setView]    = useState('list')  // 'list' | 'form'
  const [configs,  setConfigs] = useState([])
  const [types,    setTypes]   = useState([])      // all ItemTypes from DB
  const [loading,  setLoading] = useState(true)
  const [saving,   setSaving]  = useState(false)

  // Form state
  const [form,     setForm]    = useState({ itemTypeCode:'', configName:'', description:'', separator:' ', exampleCode:'', isActive:true, segments:[] })
  const [editId,   setEditId]  = useState(null)

  // Options editor (per segment pos)
  const [optSeg,   setOptSeg]  = useState(null)    // which segment pos is being edited
  const [options,  setOptions] = useState({})       // { [pos]: [{optCode, optLabel, isActive}] }
  const [newOpt,   setNewOpt]  = useState({ optCode:'', optLabel:'' })

  // ── Load ────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rC, rT] = await Promise.all([
        fetch(`${BASE_URL}/mdm/item-code-config`,  { headers:{Authorization:`Bearer ${getToken()}`} }),
        fetch(`${BASE_URL}/mdm/item-type`,          { headers:{Authorization:`Bearer ${getToken()}`} }),
      ])
      const [dC, dT] = await Promise.all([rC.json(), rT.json()])
      setConfigs(dC.data || [])
      setTypes(dT.data   || [])
    } catch(e) { toast.error(e.message) }
    finally    { setLoading(false) }
  }, [])
  useEffect(() => { loadAll() }, [loadAll])

  // ── Open new / edit ─────────────────────────────────────────────
  const openNew = () => {
    setForm({ itemTypeCode:'', configName:'', description:'', separator:' ', exampleCode:'', isActive:true, segments:[] })
    setOptions({}); setEditId(null); setOptSeg(null); setView('form')
  }

  const openEdit = (cfg) => {
    setForm({ ...cfg, segments: cfg.segments || [] })
    // Build options map from segmentOptions array
    const opts = {}
    ;(cfg.segmentOptions || []).forEach(o => {
      if (!opts[o.segmentPos]) opts[o.segmentPos] = []
      opts[o.segmentPos].push(o)
    })
    setOptions(opts); setEditId(cfg.id); setOptSeg(null); setView('form')
  }

  // ── Load seed config for a type ─────────────────────────────────
  const applySeed = (typeCode) => {
    const seed = SEED_CONFIGS[typeCode]
    if (!seed) return
    const t = types.find(t => t.code === typeCode)
    setForm(f => ({
      ...f,
      itemTypeCode: typeCode,
      configName:   seed.configName,
      separator:    seed.separator,
      exampleCode:  seed.exampleCode,
      segments:     seed.segments,
    }))
    setOptions(seed.options || {})
    toast.success(`Seed config loaded for ${typeCode}`)
  }

  // ── Segment CRUD ────────────────────────────────────────────────
  const fSet = k => v => setForm(f => ({ ...f, [k]: v }))

  const addSegment = () => {
    const maxPos = form.segments.length ? Math.max(...form.segments.map(s=>s.pos)) : 0
    setForm(f => ({ ...f, segments: [...f.segments, { ...EMPTY_SEG, pos: maxPos+1 }] }))
  }
  const delSegment = pos =>
    setForm(f => ({ ...f, segments: f.segments.filter(s=>s.pos!==pos).map((s,i)=>({...s,pos:i+1})) }))
  const updateSeg = (pos, key, val) =>
    setForm(f => ({ ...f, segments: f.segments.map(s => s.pos===pos ? {...s,[key]:val} : s) }))
  const moveSeg = (pos, dir) => {
    const segs = [...form.segments]
    const idx  = segs.findIndex(s=>s.pos===pos)
    const swap = idx + dir
    if (swap<0 || swap>=segs.length) return
    ;[segs[idx], segs[swap]] = [segs[swap], segs[idx]]
    segs.forEach((s,i) => s.pos = i+1)
    setForm(f => ({ ...f, segments: segs }))
  }

  // ── Options CRUD ─────────────────────────────────────────────────
  const addOption = () => {
    if (!newOpt.optCode || !newOpt.optLabel) return toast.error('Code and Label required')
    setOptions(prev => ({
      ...prev,
      [optSeg]: [...(prev[optSeg]||[]), { ...newOpt, optCode: newOpt.optCode.toUpperCase(), isActive:true }]
    }))
    setNewOpt({ optCode:'', optLabel:'' })
  }
  const delOption = (pos, idx) =>
    setOptions(prev => ({ ...prev, [pos]: prev[pos].filter((_,i)=>i!==idx) }))
  const toggleOption = (pos, idx) =>
    setOptions(prev => ({ ...prev, [pos]: prev[pos].map((o,i)=>i===idx?{...o,isActive:!o.isActive}:o) }))

  // ── Save ────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.itemTypeCode) return toast.error('Select Item Type')
    if (!form.segments.length) return toast.error('Add at least one segment')
    setSaving(true)
    try {
      const payload = {
        ...form,
        segmentOptions: Object.entries(options).flatMap(([pos, opts]) =>
          (opts||[]).map((o,i) => ({ segmentPos: parseInt(pos), ...o, sortOrder: i }))
        )
      }
      const url    = editId ? `${BASE_URL}/mdm/item-code-config/${editId}` : `${BASE_URL}/mdm/item-code-config`
      const method = editId ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method, headers:{'Content-Type':'application/json', Authorization:`Bearer ${getToken()}`},
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error||'Save failed')
      toast.success(editId?'Config updated':'Config created')
      setView('list'); loadAll()
    } catch(e) { toast.error(e.message) }
    finally    { setSaving(false) }
  }

  // ── Live preview of generated code ─────────────────────────────
  const previewCode = useMemo(() => {
    const parts = (form.segments||[]).map(s => {
      switch(s.type) {
        case 'FIXED':    return s.value || `[${s.label}]`
        case 'DROPDOWN': return options[s.pos]?.[0]?.optCode || `[${s.label}]`
        case 'AUTO_INC': return '0'.repeat(s.length||3)
        case 'YEAR':     return s.length===4?'2026':'26'
        case 'MONTH':    return '04'
        case 'COMPUTED': return s.formula==='GEN_SEQ'?'6001':`[${s.formula}]`
        case 'USER_INPUT': return `[${s.label}]`
        default: return `[${s.label}]`
      }
    })
    return parts.filter(Boolean).join(form.separator||' ')
  }, [form.segments, form.separator, options])

  // ── Which types already have configs ───────────────────────────
  const configuredTypeCodes = new Set(configs.map(c=>c.itemTypeCode))
  const availableTypes = types.filter(t => !configuredTypeCodes.has(t.code) || t.code === form.itemTypeCode)
  const hasSeed = (code) => !!SEED_CONFIGS[code]

  // ─────────────────── LIST VIEW ───────────────────────────────────
  if (view==='list') return (
    <div style={{padding:20,background:'#F8F7FA',minHeight:'100%'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,color:'#1C1C1C',margin:0}}>
            Item Code Configuration
          </h2>
          <p style={{fontSize:12,color:'#6C757D',margin:'3px 0 0'}}>
            Admin &rsaquo; Item Code Config &nbsp;|&nbsp;
            <strong>{configs.length}</strong> configs &middot;
            <strong style={{color:'#714B67'}}> {types.length - configs.length}</strong> types unconfigured
          </p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={loadAll} style={{padding:'7px 14px',background:'#fff',color:'#714B67',border:'1.5px solid #714B67',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>Refresh</button>
          <button onClick={openNew} style={{padding:'8px 18px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer'}}>+ New Config</button>
        </div>
      </div>

      {/* Info strip */}
      <div style={{background:'#EDE0EA',borderRadius:6,padding:'8px 14px',marginBottom:14,fontSize:11,color:'#714B67',lineHeight:1.8}}>
        <strong>How it works:</strong> Admin creates one config per Item Type (PY, FG, RM, CN, MI...).
        Each config defines the code structure — Fixed prefix, Dropdown segments, Auto-increment, Year, etc.
        When creating items, the system reads this config and auto-generates the item code.
        Seed configs available for common types.
      </div>

      {/* Unconfigured types warning */}
      {types.filter(t=>!configuredTypeCodes.has(t.code)).length > 0 && (
        <div style={{background:'#FFF3CD',border:'1px solid #FFEEBA',borderRadius:6,padding:'8px 14px',marginBottom:12,fontSize:12,color:'#856404',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <strong>Unconfigured types:</strong>
          {types.filter(t=>!configuredTypeCodes.has(t.code)).map(t=>(
            <span key={t.code} style={{background:'#fff',border:'1px solid #FFEEBA',padding:'2px 8px',borderRadius:4,fontFamily:'DM Mono,monospace',fontWeight:700}}>{t.code}</span>
          ))}
          <span style={{color:'#856404'}}>— Items of these types will have manual code entry</span>
        </div>
      )}

      {/* Config cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:14}}>
        {loading
          ? <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading...</div>
          : configs.map(cfg => (
          <div key={cfg.id} style={{background:'#fff',borderRadius:8,border:'1.5px solid #E0D5E0',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)',cursor:'pointer'}}
            onClick={()=>openEdit(cfg)}>

            {/* Card header */}
            <div style={{background:'#714B67',padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:16,fontWeight:800,color:'#fff'}}>{cfg.itemTypeCode}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.75)',marginTop:2}}>{cfg.configName}</div>
              </div>
              <span style={{background:cfg.isActive?'#D4EDDA':'#F8D7DA',color:cfg.isActive?'#155724':'#721C24',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                {cfg.isActive?'Active':'Inactive'}
              </span>
            </div>

            {/* Card body */}
            <div style={{padding:'12px 16px'}}>
              {/* Segment pills */}
              <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:10}}>
                {(cfg.segments||[]).map(s => {
                  const st = SEG_TYPES.find(t=>t.value===s.type)||SEG_TYPES[0]
                  return (
                    <div key={s.pos} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                      <span style={{background:st.color,color:st.text,padding:'3px 8px',borderRadius:'4px 4px 0 0',fontSize:11,fontWeight:700,fontFamily:'DM Mono,monospace'}}>{s.label}</span>
                      <span style={{fontSize:9,color:'#999',marginTop:1}}>{s.type}</span>
                    </div>
                  )
                })}
              </div>

              {/* Example code */}
              <div style={{background:'#1C1C1C',borderRadius:5,padding:'6px 12px',fontFamily:'DM Mono,monospace',fontSize:13,fontWeight:700,color:'#A3D977',letterSpacing:1.5}}>
                {cfg.exampleCode || '—'}
              </div>

              <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:11,color:'#6C757D'}}>
                <span>{(cfg.segments||[]).length} segments</span>
                <span>Sep: "{cfg.separator==='' ? 'none' : cfg.separator}"</span>
                <span>{(cfg.segmentOptions||[]).length} options configured</span>
              </div>
            </div>
          </div>
        ))}

        {/* Add new card */}
        <div onClick={openNew} style={{background:'#fff',borderRadius:8,border:'2px dashed #E0D5E0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:160,cursor:'pointer',color:'#714B67',gap:8}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#714B67';e.currentTarget.style.background='#FDF8FC'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#E0D5E0';e.currentTarget.style.background='#fff'}}>
          <div style={{fontSize:32}}>+</div>
          <div style={{fontWeight:700,fontSize:13}}>New Config</div>
          <div style={{fontSize:11,color:'#999'}}>Configure for FG, RM, CN, MI...</div>
        </div>
      </div>
    </div>
  )

  // ─────────────────── FORM VIEW ────────────────────────────────────
  const selType = types.find(t=>t.code===form.itemTypeCode)

  return (
    <div style={{padding:20,background:'#F8F7FA',minHeight:'100%'}}>
      {/* Form header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,color:'#1C1C1C',margin:0}}>
            {editId?`Edit Config — ${form.itemTypeCode}`:'New Item Code Config'}
          </h2>
          <p style={{fontSize:12,color:'#6C757D',margin:'3px 0 0'}}>
            {selType?`${selType.name} (${selType.category||'—'})`:'Select an Item Type to configure'}
          </p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setView('list')} style={{padding:'7px 14px',background:'#fff',color:'#6C757D',border:'1.5px solid #E0D5E0',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>&#8592; Back</button>
          <button onClick={save} disabled={saving} style={{padding:'8px 18px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer',opacity:saving?.7:1}}>
            {saving?'Saving...':'Save Config'}
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>

        {/* ── Left: Basic Config ── */}
        <div style={{background:'#fff',borderRadius:8,border:'1px solid #E0D5E0',padding:20}}>
          <div style={{fontSize:12,fontWeight:800,color:'#714B67',textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid #714B67',paddingBottom:4,marginBottom:14}}>Basic Configuration</div>

          {/* Item Type selector */}
          <div style={{marginBottom:12}}>
            <label style={LBL}>Item Type *</label>
            <div style={{display:'flex',gap:8}}>
              <select value={form.itemTypeCode}
                onChange={e => setForm(f=>({...f,itemTypeCode:e.target.value,configName:types.find(t=>t.code===e.target.value)?.name||''}))}
                style={{flex:1,padding:'8px 10px',border:'1.5px solid #E0D5E0',borderRadius:5,fontSize:13,fontFamily:'DM Sans,sans-serif',outline:'none',cursor:'pointer'}}>
                <option value=''>— Select Item Type —</option>
                {availableTypes.map(t=>(
                  <option key={t.code} value={t.code}>{t.code} — {t.name} {hasSeed(t.code)?'★':''}</option>
                ))}
              </select>
              {hasSeed(form.itemTypeCode) && (
                <button onClick={()=>applySeed(form.itemTypeCode)}
                  style={{padding:'8px 12px',background:'#FFF3CD',color:'#856404',border:'1.5px solid #FFEEBA',borderRadius:5,fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
                  Load Seed ★
                </button>
              )}
            </div>
            {hasSeed(form.itemTypeCode) && (
              <div style={{fontSize:10,color:'#856404',marginTop:3}}>★ Seed config available — click to load pre-configured structure</div>
            )}
          </div>

          <div style={{marginBottom:12}}>
            <label style={LBL}>Config Name</label>
            <input value={form.configName} onChange={e=>fSet('configName')(e.target.value)}
              style={{width:'100%',padding:'8px 10px',border:'1.5px solid #E0D5E0',borderRadius:5,fontSize:13,fontFamily:'DM Sans,sans-serif',outline:'none',boxSizing:'border-box'}}
              placeholder="e.g. PY — Polymer Codification" />
          </div>

          <div style={{marginBottom:12}}>
            <label style={LBL}>Description</label>
            <textarea value={form.description||''} onChange={e=>fSet('description')(e.target.value)}
              rows={2} style={{width:'100%',padding:'8px 10px',border:'1.5px solid #E0D5E0',borderRadius:5,fontSize:13,fontFamily:'DM Sans,sans-serif',outline:'none',boxSizing:'border-box',resize:'vertical'}}
              placeholder="Optional notes about this codification" />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={LBL}>Separator</label>
              <select value={form.separator} onChange={e=>fSet('separator')(e.target.value)}
                style={{width:'100%',padding:'8px 10px',border:'1.5px solid #E0D5E0',borderRadius:5,fontSize:13,fontFamily:'DM Sans,sans-serif',outline:'none',cursor:'pointer'}}>
                {SEPARATORS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Example Code (reference)</label>
              <input value={form.exampleCode||''} onChange={e=>fSet('exampleCode')(e.target.value)}
                style={{width:'100%',padding:'8px 10px',border:'1.5px solid #E0D5E0',borderRadius:5,fontSize:13,fontFamily:'DM Mono,monospace',outline:'none',boxSizing:'border-box'}}
                placeholder="e.g. PY BH 6001 T028 001" />
            </div>
          </div>

          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input type='checkbox' checked={form.isActive} onChange={e=>fSet('isActive')(e.target.checked)} style={{accentColor:'#714B67',width:15,height:15}}/>
            <span style={{fontSize:13}}>Active — used in Item Master code generation</span>
          </label>

          {/* Live preview */}
          <div style={{marginTop:16,padding:'12px 16px',background:'#1C1C1C',borderRadius:6}}>
            <div style={{fontSize:10,color:'#888',marginBottom:4}}>LIVE PREVIEW</div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:16,fontWeight:800,color:'#A3D977',letterSpacing:2}}>
              {previewCode || <span style={{color:'#555'}}>Add segments to preview</span>}
            </div>
          </div>
        </div>

        {/* ── Right: Segments ── */}
        <div style={{background:'#fff',borderRadius:8,border:'1px solid #E0D5E0',padding:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:800,color:'#714B67',textTransform:'uppercase',letterSpacing:.5,borderBottom:'2px solid #714B67',paddingBottom:4,flex:1}}>
              Segments ({form.segments.length})
            </div>
            <button onClick={addSegment} style={{marginLeft:12,padding:'5px 12px',background:'#714B67',color:'#fff',border:'none',borderRadius:4,fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Add</button>
          </div>

          {/* Column headers */}
          <div style={{display:'grid',gridTemplateColumns:'40px 1fr 160px 70px 60px 60px 80px 80px 36px',gap:6,padding:'0 8px 6px',fontSize:10,fontWeight:700,color:'#999',textTransform:'uppercase'}}>
            <span>Pos</span><span>Label</span><span>Type</span><span>Length</span><span>Pad</span><span>Req</span><span>Fixed Val</span><span>Formula</span><span></span>
          </div>

          {form.segments.length===0
            ? <div style={{padding:'30px 0',textAlign:'center',color:'#999',fontSize:13}}>No segments — click + Add to define code structure</div>
            : form.segments.map((s,idx)=>{
              const st = SEG_TYPES.find(t=>t.value===s.type)
              return (
                <div key={s.pos} className="seg-row" style={{borderLeft:`3px solid ${st?.color||'#E0D5E0'}`}}>
                  {/* Position */}
                  <div style={{display:'flex',flexDirection:'column',gap:2}}>
                    <span style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:800,color:'#714B67',textAlign:'center'}}>C{s.pos}</span>
                    <div style={{display:'flex',gap:1,justifyContent:'center'}}>
                      <button onClick={()=>moveSeg(s.pos,-1)} style={{fontSize:8,padding:'1px 3px',border:'1px solid #E0D5E0',borderRadius:2,cursor:'pointer',background:'#fff',lineHeight:1}}>▲</button>
                      <button onClick={()=>moveSeg(s.pos,+1)} style={{fontSize:8,padding:'1px 3px',border:'1px solid #E0D5E0',borderRadius:2,cursor:'pointer',background:'#fff',lineHeight:1}}>▼</button>
                    </div>
                  </div>

                  {/* Label */}
                  <input className="seg-inp" value={s.label} onChange={e=>updateSeg(s.pos,'label',e.target.value)} placeholder="Label"/>

                  {/* Type */}
                  <select className="seg-inp" value={s.type} onChange={e=>updateSeg(s.pos,'type',e.target.value)}>
                    {SEG_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>

                  {/* Length */}
                  <input className="seg-inp" type="number" min={1} max={10} value={s.length||''} onChange={e=>updateSeg(s.pos,'length',parseInt(e.target.value)||0)} style={{textAlign:'center'}} placeholder="Len"/>

                  {/* Pad char */}
                  <input className="seg-inp" value={s.padChar||''} onChange={e=>updateSeg(s.pos,'padChar',e.target.value.slice(0,1))} style={{textAlign:'center'}} placeholder="Pad" maxLength={1}/>

                  {/* Required */}
                  <div style={{textAlign:'center'}}>
                    <input type='checkbox' checked={!!s.required} onChange={e=>updateSeg(s.pos,'required',e.target.checked)} style={{accentColor:'#714B67',width:14,height:14}}/>
                  </div>

                  {/* Fixed value / Options button */}
                  <div>
                    {s.type==='FIXED' && (
                      <input className="seg-inp" value={s.value||''} onChange={e=>updateSeg(s.pos,'value',e.target.value)} placeholder="Value" style={{fontFamily:'DM Mono,monospace',fontWeight:700}}/>
                    )}
                    {s.type==='DROPDOWN' && (
                      <button onClick={()=>setOptSeg(optSeg===s.pos?null:s.pos)}
                        style={{width:'100%',padding:'4px 6px',background:optSeg===s.pos?'#714B67':'#EDE0EA',color:optSeg===s.pos?'#fff':'#714B67',border:'none',borderRadius:4,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                        Opts ({(options[s.pos]||[]).length})
                      </button>
                    )}
                  </div>

                  {/* Formula (for COMPUTED) */}
                  <div>
                    {s.type==='COMPUTED' && (
                      <select className="seg-inp" value={s.formula||''} onChange={e=>updateSeg(s.pos,'formula',e.target.value)}>
                        <option value=''>Select</option>
                        {FORMULAS.map(f=><option key={f}>{f}</option>)}
                      </select>
                    )}
                  </div>

                  {/* Delete */}
                  <button onClick={()=>delSegment(s.pos)} style={{background:'none',border:'none',color:'#D9534F',cursor:'pointer',fontSize:16,padding:'0 4px'}}>&#x2715;</button>
                </div>
              )
            })
          }

          {/* Segment type legend */}
          <div style={{marginTop:12,display:'flex',flexWrap:'wrap',gap:4}}>
            {SEG_TYPES.map(t=>(
              <span key={t.value} style={{background:t.color,color:t.text,padding:'2px 6px',borderRadius:4,fontSize:9,fontWeight:700}}>{t.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Dropdown Options Editor ── */}
      {optSeg!==null && (
        <div style={{background:'#fff',borderRadius:8,border:'1.5px solid #714B67',padding:20,marginTop:14}}>
          <div style={{fontSize:12,fontWeight:800,color:'#714B67',textTransform:'uppercase',letterSpacing:.5,marginBottom:12}}>
            Dropdown Options — C{optSeg} ({form.segments.find(s=>s.pos===optSeg)?.label})
            <button onClick={()=>setOptSeg(null)} style={{float:'right',background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#999'}}>&#x2715;</button>
          </div>

          {/* Add option */}
          <div style={{display:'flex',gap:10,marginBottom:12}}>
            <div style={{flex:'0 0 120px'}}>
              <label style={LBL}>Option Code *</label>
              <input value={newOpt.optCode} onChange={e=>setNewOpt(o=>({...o,optCode:e.target.value.toUpperCase()}))} maxLength={10}
                style={{width:'100%',padding:'7px 10px',border:'1.5px solid #E0D5E0',borderRadius:5,fontSize:13,fontFamily:'DM Mono,monospace',fontWeight:700,outline:'none'}}
                placeholder="BH" />
            </div>
            <div style={{flex:1}}>
              <label style={LBL}>Option Label *</label>
              <input value={newOpt.optLabel} onChange={e=>setNewOpt(o=>({...o,optLabel:e.target.value}))}
                style={{width:'100%',padding:'7px 10px',border:'1.5px solid #E0D5E0',borderRadius:5,fontSize:13,fontFamily:'DM Sans,sans-serif',outline:'none'}}
                placeholder="e.g. Bobbin Holder" />
            </div>
            <div style={{display:'flex',alignItems:'flex-end'}}>
              <button onClick={addOption} style={{padding:'8px 18px',background:'#714B67',color:'#fff',border:'none',borderRadius:5,fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add</button>
            </div>
          </div>

          {/* Options list */}
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#F8F4F8'}}>
                <th style={TH}>Code</th><th style={TH}>Label</th><th style={TH}>Status</th><th style={TH}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(options[optSeg]||[]).length===0
                ? <tr><td colSpan={4} style={{padding:'20px',textAlign:'center',color:'#999'}}>No options yet</td></tr>
                : (options[optSeg]||[]).map((o,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #F0EEF0'}}>
                  <td style={{padding:'8px 14px',fontFamily:'DM Mono,monospace',fontWeight:800,color:'#714B67'}}>{o.optCode}</td>
                  <td style={{padding:'8px 14px'}}>{o.optLabel}</td>
                  <td style={{padding:'8px 14px'}}>
                    <span style={{background:o.isActive?'#D4EDDA':'#F8D7DA',color:o.isActive?'#155724':'#721C24',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,cursor:'pointer'}}
                      onClick={()=>toggleOption(optSeg,i)}>
                      {o.isActive?'Active':'Inactive'}
                    </span>
                  </td>
                  <td style={{padding:'8px 14px'}}>
                    <button onClick={()=>delOption(optSeg,i)} style={{background:'none',border:'none',color:'#D9534F',cursor:'pointer',fontSize:14}}>&#x2715;</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
