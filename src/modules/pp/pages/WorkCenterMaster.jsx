import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

// ── Constants ─────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const authHdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('lnv_token')}` })

// ── Seed data — shown when DB is empty (Injection Moulding default) ──────────
const SEED_WCS = [
  { id:1,  _isSeed:true, wcId:'WC-001', name:'Material Dryer',       machineId:'DRYER-01', machineType:'Dryer',      category:'Production', process:'Material Drying',      capacity:200, capacityUnit:'Kg/batch',   shift:'General (8 hrs)', status:'Active',             location:'Bay A', operator:'Rajan K.',   mhr:85.50  },
  { id:2,  _isSeed:true, wcId:'WC-002', name:'IMM-150T',              machineId:'IMM-150T', machineType:'IMM',         category:'Production', process:'Mould Setup',          capacity:1,   capacityUnit:'Shots/shift', shift:'General (8 hrs)', status:'Active',             location:'Bay B', operator:'Murugan S.', mhr:320.00 },
  { id:3,  _isSeed:true, wcId:'WC-003', name:'IMM-150T',              machineId:'IMM-150T', machineType:'IMM',         category:'Production', process:'Trial Shot',           capacity:1,   capacityUnit:'Shots/shift', shift:'General (8 hrs)', status:'Active',             location:'Bay B', operator:'Murugan S.', mhr:320.00 },
  { id:4,  _isSeed:true, wcId:'WC-004', name:'IMM-150T',              machineId:'IMM-150T', machineType:'IMM',         category:'Production', process:'Production Run',        capacity:1,   capacityUnit:'Shots/shift', shift:'General (8 hrs)', status:'Active',             location:'Bay B', operator:'Arun M.',    mhr:320.00 },
  { id:5,  _isSeed:true, wcId:'WC-005', name:'IMM-200T',              machineId:'IMM-200T', machineType:'IMM',         category:'Production', process:'Production Run',        capacity:1,   capacityUnit:'Shots/shift', shift:'General (8 hrs)', status:'Active',             location:'Bay C', operator:'Karthik P.', mhr:420.00 },
  { id:6,  _isSeed:true, wcId:'WC-006', name:'IMM-80T',               machineId:'IMM-80T',  machineType:'IMM',         category:'Production', process:'Production Run',        capacity:1,   capacityUnit:'Shots/shift', shift:'General (8 hrs)', status:'Under Maintenance',  location:'Bay D', operator:'—',          mhr:220.00 },
  { id:7,  _isSeed:true, wcId:'WC-007', name:'QC Station',            machineId:'QC-01',    machineType:'QC Station',  category:'Quality',    process:'Inline QC',            capacity:0,   capacityUnit:'Nos/hr',      shift:'General (8 hrs)', status:'Active',             location:'QC Lab', operator:'Inspector', mhr:120.00 },
  { id:8,  _isSeed:true, wcId:'WC-008', name:'Trimming Station',      machineId:'TRIM-01',  machineType:'Trimming',    category:'Production', process:'Degating / Trimming',  capacity:500, capacityUnit:'Nos/shift',   shift:'General (8 hrs)', status:'Active',             location:'Bay E', operator:'Priya D.',   mhr:95.00  },
  { id:9,  _isSeed:true, wcId:'WC-009', name:'Final Inspection Bay',  machineId:'FI-01',    machineType:'QC Station',  category:'Quality',    process:'Final Inspection',     capacity:0,   capacityUnit:'Nos/hr',      shift:'General (8 hrs)', status:'Active',             location:'QC Lab', operator:'QC Head',  mhr:110.00 },
  { id:10, _isSeed:true, wcId:'WC-010', name:'Packing Station',       machineId:'PACK-01',  machineType:'Packing',     category:'Logistics',  process:'Packing',              capacity:500, capacityUnit:'Nos/shift',   shift:'General (8 hrs)', status:'Active',             location:'Bay F', operator:'Store',      mhr:75.00  },
]

const PROCESS_TYPES = [
  'Material Drying', 'Mould Setup', 'Trial Shot', 'Production Run',
  'Inline QC', 'Degating / Trimming', 'Final Inspection', 'Packing',
  // Other industries
  'Pre-Treatment / Degreasing', 'Phosphating', 'Powder Coating', 'Curing / Oven',
  'Hardening / Heating', 'Quenching', 'Tempering', 'Hardness Testing',
  'Turning', 'Milling', 'Drilling', 'Welding', 'Cutting / Laser',
  'Inspection', 'Dispatch', 'Assembly', 'Other',
]

const MACHINE_TYPES = ['IMM', 'BMM', 'Dryer', 'QC Station', 'Trimming', 'Packing', 'Furnace', 'CNC', 'Press', 'Other']
const SHIFT_OPTS    = ['General (8 hrs)', 'Double Shift (16 hrs)', 'Triple Shift (24 hrs)', 'Custom']
const STATUS_OPTS   = ['Active', 'Inactive', 'Under Maintenance', 'Setup']
const WC_CATEGORIES = ['Production', 'Quality', 'Logistics', 'Utility']

// ── MHR Industry Templates ────────────────────────────────────────────────────
const MHR_TEMPLATES = {
  injection_moulding: {
    label: 'Injection Moulding',
    powerKW: 22, powerTariff: 8.5, shiftHrs: 8, workingDays: 26,
    depreciation: 1200, maintenance: 300, overhead: 500,
    operators: 1, operatorWage: 18000,
    notes: 'Based on 150T IMM. Adjust kW for machine tonnage.',
  },
  heat_treatment: {
    label: 'Heat Treatment',
    powerKW: 80, powerTariff: 8.5, shiftHrs: 8, workingDays: 26,
    depreciation: 2000, maintenance: 600, overhead: 800,
    operators: 2, operatorWage: 20000,
    notes: 'Based on 500 Kg/batch furnace.',
  },
  surface_treatment: {
    label: 'Surface Treatment',
    powerKW: 15, powerTariff: 8.5, shiftHrs: 8, workingDays: 26,
    depreciation: 800, maintenance: 200, overhead: 400,
    operators: 1, operatorWage: 16000,
    notes: 'Tank-based batch process.',
  },
  cnc_jobwork: {
    label: 'CNC Job Work',
    powerKW: 11, powerTariff: 8.5, shiftHrs: 8, workingDays: 26,
    depreciation: 1500, maintenance: 400, overhead: 600,
    operators: 1, operatorWage: 22000,
    notes: 'Based on standard CNC turning centre.',
  },
  fabrication: {
    label: 'Fabrication',
    powerKW: 30, powerTariff: 8.5, shiftHrs: 8, workingDays: 26,
    depreciation: 1000, maintenance: 350, overhead: 450,
    operators: 2, operatorWage: 18000,
    notes: 'Welding + laser cutting combination.',
  },
}

// ── MHR Calculator helper ─────────────────────────────────────────────────────
function calcMHR(f) {
  const monthlyHrs  = parseFloat(f.shiftHrs || 8) * parseFloat(f.workingDays || 26)
  const powerCost   = parseFloat(f.powerKW || 0) * parseFloat(f.shiftHrs || 8) * parseFloat(f.powerTariff || 8.5) * parseFloat(f.workingDays || 26)
  const laborCost   = parseFloat(f.operators || 1) * parseFloat(f.operatorWage || 0)
  const depr        = parseFloat(f.depreciation || 0)
  const maint       = parseFloat(f.maintenance || 0)
  const ovhd        = parseFloat(f.overhead || 0)
  const totalMonthly = powerCost + laborCost + depr + maint + ovhd
  const mhr          = monthlyHrs > 0 ? totalMonthly / monthlyHrs : 0
  return { monthlyHrs, powerCost, laborCost, totalMonthly, mhr: mhr.toFixed(2) }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inp = {
  width: '100%', padding: '7px 10px', fontSize: 12,
  border: '1px solid #E0D5E0', borderRadius: 5, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'DM Sans,sans-serif',
}
const sel  = { ...inp, cursor: 'pointer' }
const lbl  = { fontSize: 10, fontWeight: 700, color: '#495057', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 }
const INR  = v => '₹' + parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

const STATUS_CFG = {
  Active:             { bg: '#D4EDDA', c: '#155724' },
  Inactive:           { bg: '#F5F5F5', c: '#666'    },
  'Under Maintenance':{ bg: '#FFF3CD', c: '#856404' },
  Setup:              { bg: '#D1ECF1', c: '#0C5460' },
}

// ── Blank form ────────────────────────────────────────────────────────────────
const BLANK = {
  wcId: '', name: '', machineId: '', machineType: 'IMM',
  process: 'Production Run', category: 'Production',
  capacity: '', capacityUnit: 'Shots/shift', shift: 'General (8 hrs)',
  customShiftHrs: '', status: 'Active', location: '', operator: '', remarks: '',
  // MHR fields
  powerKW: '', powerTariff: '8.5', shiftHrs: '8', workingDays: '26',
  depreciation: '', maintenance: '', overhead: '',
  operators: '1', operatorWage: '', mhr: '',
  industryTemplate: 'injection_moulding',
}

// ══════════════════════════════════════════════════════════════════════════════
// FORM MODAL
// ══════════════════════════════════════════════════════════════════════════════
function WCForm({ wc, allWCs, onSave, onCancel }) {
  const isEdit = !!wc?.id
  const [tab,    setTab]    = useState('basic')
  const [form,   setForm]   = useState(() => wc ? { ...BLANK, ...wc } : { ...BLANK })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Auto-generate WC ID
  const genId = () => {
    const next = allWCs.length + 1
    set('wcId', `WC-${String(next).padStart(3, '0')}`)
  }

  // Load MHR template
  const loadTemplate = (key) => {
    const t = MHR_TEMPLATES[key]
    if (!t) return
    setForm(f => ({
      ...f,
      industryTemplate: key,
      powerKW:       String(t.powerKW),
      powerTariff:   String(t.powerTariff),
      shiftHrs:      String(t.shiftHrs),
      workingDays:   String(t.workingDays),
      depreciation:  String(t.depreciation),
      maintenance:   String(t.maintenance),
      overhead:      String(t.overhead),
      operators:     String(t.operators),
      operatorWage:  String(t.operatorWage),
    }))
    toast.success(`${t.label} template loaded!`)
  }

  const mhrCalc = calcMHR(form)

  // Auto-save calculated MHR into form
  useEffect(() => {
    setForm(f => ({ ...f, mhr: mhrCalc.mhr }))
  }, [form.powerKW, form.powerTariff, form.shiftHrs, form.workingDays,
      form.depreciation, form.maintenance, form.overhead,
      form.operators, form.operatorWage])

  const save = async () => {
    if (!form.wcId)  return toast.error('WC ID is required')
    if (!form.name)  return toast.error('Work Center Name is required')
    if (!form.process) return toast.error('Process is required')
    setSaving(true)
    try {
      onSave({ ...form, mhr: mhrCalc.mhr })
      toast.success(`Work Center ${form.wcId} ${isEdit ? 'updated' : 'created'}!`)
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const TABS = [
    { key: 'basic', label: '📋 Basic Info' },
    { key: 'mhr',   label: '💰 MHR Calculation' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: 10, width: '96%', maxWidth: 900, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>

        {/* Header */}
        <div style={{ background: '#1A5276', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#fff', margin: 0, fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700 }}>
              {isEdit ? `Edit Work Center — ${wc.wcId}` : 'New Work Center'}
            </h3>
            <p style={{ color: 'rgba(255,255,255,.6)', margin: '2px 0 0', fontSize: 11 }}>
              SAP: CR01 / CR02 — Work Center Master with MHR Calculation
            </p>
          </div>
          <span onClick={onCancel} style={{ color: '#fff', cursor: 'pointer', fontSize: 20 }}>✕</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #E0D5E0', background: '#F8F9FA' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: tab === t.key ? '#1A5276' : '#6C757D',
                borderBottom: tab === t.key ? '2px solid #1A5276' : '2px solid transparent',
                marginBottom: -2 }}>
              {t.label}
            </button>
          ))}
          {/* MHR Badge */}
          {parseFloat(form.mhr) > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#6C757D' }}>Calculated MHR:</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#155724', fontFamily: 'DM Mono,monospace' }}>
                ₹{parseFloat(form.mhr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/hr
              </span>
            </div>
          )}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>

          {/* ── BASIC INFO TAB ── */}
          {tab === 'basic' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Left Column */}
              <div>
                <div style={{ background: '#F8F4F8', border: '1px solid #E0D5E0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1A5276', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 12 }}>🏭 Identity</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
                    <div>
                      <label style={lbl}>WC ID *</label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input style={{ ...inp, fontFamily: 'DM Mono,monospace', flex: 1 }} value={form.wcId}
                          onChange={e => set('wcId', e.target.value)} placeholder="WC-001" />
                        <button onClick={genId} style={{ padding: '6px 8px', background: '#1A5276', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>Auto</button>
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Machine ID</label>
                      <input style={{ ...inp, fontFamily: 'DM Mono,monospace' }} value={form.machineId}
                        onChange={e => set('machineId', e.target.value)} placeholder="IMM-150T" />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={lbl}>Work Center Name *</label>
                      <input style={inp} value={form.name}
                        onChange={e => set('name', e.target.value)} placeholder="e.g. Injection Moulding Machine 150T" />
                    </div>
                    <div>
                      <label style={lbl}>Machine Type</label>
                      <select style={sel} value={form.machineType} onChange={e => set('machineType', e.target.value)}>
                        {MACHINE_TYPES.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Category</label>
                      <select style={sel} value={form.category} onChange={e => set('category', e.target.value)}>
                        {WC_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F8F9FA', border: '1px solid #E0D5E0', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1A5276', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 12 }}>📍 Location & Status</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
                    <div>
                      <label style={lbl}>Location / Bay</label>
                      <input style={inp} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Bay A - Shop Floor" />
                    </div>
                    <div>
                      <label style={lbl}>Status</label>
                      <select style={{ ...sel, background: STATUS_CFG[form.status]?.bg, color: STATUS_CFG[form.status]?.c, fontWeight: 700 }}
                        value={form.status} onChange={e => set('status', e.target.value)}>
                        {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Default Operator</label>
                      <input style={inp} value={form.operator} onChange={e => set('operator', e.target.value)} placeholder="Operator Name" />
                    </div>
                    <div>
                      <label style={lbl}>Shift</label>
                      <select style={sel} value={form.shift} onChange={e => set('shift', e.target.value)}>
                        {SHIFT_OPTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={lbl}>Remarks</label>
                      <input style={inp} value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Notes about this work center" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div style={{ background: '#EBF5FB', border: '1px solid #AED6F1', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1A5276', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 12 }}>⚙️ Process & Capacity</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={lbl}>Process Type *</label>
                      <select style={sel} value={form.process} onChange={e => set('process', e.target.value)}>
                        {PROCESS_TYPES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Capacity</label>
                      <input style={inp} type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="0" min="0" />
                    </div>
                    <div>
                      <label style={lbl}>Capacity Unit</label>
                      <select style={sel} value={form.capacityUnit} onChange={e => set('capacityUnit', e.target.value)}>
                        {['Shots/shift','Pieces/shift','Kg/batch','Kg/shift','Nos/hr','Meters/hr','Litre/hr'].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* MHR Preview card */}
                <div style={{ background: parseFloat(form.mhr) > 0 ? '#D4EDDA' : '#F8F9FA', border: `1px solid ${parseFloat(form.mhr) > 0 ? '#28A745' : '#E0D5E0'}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#155724', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 10 }}>💰 MHR Summary</div>
                  {parseFloat(form.mhr) > 0 ? (
                    <>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#155724', fontFamily: 'DM Mono,monospace', marginBottom: 4 }}>
                        ₹{parseFloat(form.mhr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/hr
                      </div>
                      <div style={{ fontSize: 11, color: '#155724', marginBottom: 8 }}>Machine Hour Rate (calculated)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11, color: '#495057' }}>
                        <span>Monthly Hours: <strong>{mhrCalc.monthlyHrs} hrs</strong></span>
                        <span>Power Cost: <strong>{INR(mhrCalc.powerCost)}</strong></span>
                        <span>Labor Cost: <strong>{INR(mhrCalc.laborCost)}</strong></span>
                        <span>Total/Month: <strong>{INR(mhrCalc.totalMonthly)}</strong></span>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: '#6C757D', fontSize: 12 }}>
                      Fill MHR fields in the <strong>"💰 MHR Calculation"</strong> tab to auto-calculate rate.
                      <br /><br />
                      <button onClick={() => setTab('mhr')}
                        style={{ padding: '6px 14px', background: '#1A5276', color: '#fff', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
                        → Go to MHR Tab
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── MHR CALCULATION TAB ── */}
          {tab === 'mhr' && (
            <div>
              {/* Template Loader */}
              <div style={{ background: '#FFF3CD', border: '1px solid #FFC107', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#856404', marginBottom: 8 }}>
                  ⚡ Load Industry Standard Template
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {Object.entries(MHR_TEMPLATES).map(([key, t]) => (
                    <button key={key} onClick={() => loadTemplate(key)}
                      style={{ padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 5, cursor: 'pointer',
                        background: form.industryTemplate === key ? '#856404' : '#fff',
                        color: form.industryTemplate === key ? '#fff' : '#856404',
                        border: '1.5px solid #856404' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {MHR_TEMPLATES[form.industryTemplate] && (
                  <div style={{ fontSize: 11, color: '#856404', marginTop: 6 }}>
                    💡 {MHR_TEMPLATES[form.industryTemplate].notes}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Left — Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Power */}
                  <div style={{ background: '#EBF5FB', border: '1px solid #AED6F1', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1A5276', marginBottom: 10 }}>⚡ Power Cost</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 10px' }}>
                      <div>
                        <label style={lbl}>Machine kW</label>
                        <input style={inp} type="number" value={form.powerKW} onChange={e => set('powerKW', e.target.value)} placeholder="22" />
                      </div>
                      <div>
                        <label style={lbl}>Tariff (₹/kWh)</label>
                        <input style={inp} type="number" value={form.powerTariff} onChange={e => set('powerTariff', e.target.value)} placeholder="8.5" step="0.1" />
                      </div>
                      <div>
                        <label style={lbl}>Shift Hours</label>
                        <input style={inp} type="number" value={form.shiftHrs} onChange={e => set('shiftHrs', e.target.value)} placeholder="8" />
                      </div>
                      <div>
                        <label style={lbl}>Working Days/Month</label>
                        <input style={inp} type="number" value={form.workingDays} onChange={e => set('workingDays', e.target.value)} placeholder="26" />
                      </div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ background: '#D6EAF8', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#1A5276', width: '100%' }}>
                          Monthly Power Cost: <span style={{ fontFamily: 'DM Mono,monospace' }}>{INR(mhrCalc.powerCost)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Labor */}
                  <div style={{ background: '#D5F5E3', border: '1px solid #A9DFBF', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#196F3D', marginBottom: 10 }}>👷 Labour Cost</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px' }}>
                      <div>
                        <label style={lbl}>No. of Operators</label>
                        <input style={inp} type="number" value={form.operators} onChange={e => set('operators', e.target.value)} placeholder="1" min="0" />
                      </div>
                      <div>
                        <label style={lbl}>Operator Wage/Month (₹)</label>
                        <input style={inp} type="number" value={form.operatorWage} onChange={e => set('operatorWage', e.target.value)} placeholder="18000" />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ background: '#A9DFBF', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: '#196F3D' }}>
                          Monthly Labour Cost: <span style={{ fontFamily: 'DM Mono,monospace' }}>{INR(mhrCalc.laborCost)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other Costs */}
                  <div style={{ background: '#F8F4F8', border: '1px solid #E0D5E0', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#714B67', marginBottom: 10 }}>🏭 Other Monthly Costs (₹)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 10px' }}>
                      <div>
                        <label style={lbl}>Depreciation</label>
                        <input style={inp} type="number" value={form.depreciation} onChange={e => set('depreciation', e.target.value)} placeholder="1200" />
                      </div>
                      <div>
                        <label style={lbl}>Maintenance</label>
                        <input style={inp} type="number" value={form.maintenance} onChange={e => set('maintenance', e.target.value)} placeholder="300" />
                      </div>
                      <div>
                        <label style={lbl}>Overhead</label>
                        <input style={inp} type="number" value={form.overhead} onChange={e => set('overhead', e.target.value)} placeholder="500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right — Summary */}
                <div>
                  <div style={{ background: '#1A5276', borderRadius: 10, padding: 20, color: '#fff', position: 'sticky', top: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, opacity: .7, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 16 }}>
                      MHR Calculation Summary
                    </div>

                    {/* Breakdown table */}
                    {[
                      { label: 'Power Cost / Month',       val: mhrCalc.powerCost,   color: '#AED6F1' },
                      { label: 'Labour Cost / Month',      val: mhrCalc.laborCost,   color: '#A9DFBF' },
                      { label: 'Depreciation / Month',     val: parseFloat(form.depreciation || 0), color: '#F9E79F' },
                      { label: 'Maintenance / Month',      val: parseFloat(form.maintenance  || 0), color: '#F9E79F' },
                      { label: 'Overhead / Month',         val: parseFloat(form.overhead     || 0), color: '#F9E79F' },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.1)', fontSize: 12 }}>
                        <span style={{ color: 'rgba(255,255,255,.75)' }}>{r.label}</span>
                        <span style={{ fontFamily: 'DM Mono,monospace', fontWeight: 700, color: r.color }}>₹{r.val.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                      </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', marginTop: 4, borderTop: '2px solid rgba(255,255,255,.3)', fontSize: 13 }}>
                      <span style={{ fontWeight: 700 }}>Total / Month</span>
                      <span style={{ fontFamily: 'DM Mono,monospace', fontWeight: 800, color: '#F9E79F', fontSize: 15 }}>{INR(mhrCalc.totalMonthly)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
                      <span style={{ opacity: .75 }}>Working Hours / Month</span>
                      <span style={{ fontFamily: 'DM Mono,monospace', fontWeight: 700 }}>{mhrCalc.monthlyHrs} hrs</span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 8, padding: 16, marginTop: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, opacity: .7, marginBottom: 4 }}>MACHINE HOUR RATE (MHR)</div>
                      <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'DM Mono,monospace', color: '#F9E79F', lineHeight: 1 }}>
                        ₹{parseFloat(mhrCalc.mhr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>per machine hour</div>
                    </div>

                    <div style={{ marginTop: 12, fontSize: 11, opacity: .6, lineHeight: 1.5 }}>
                      Formula: Total Monthly Cost ÷ Monthly Hours<br />
                      Used in: Job Costing · Work Order Valuation · Routing Time × MHR
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E0D5E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA' }}>
          <span style={{ fontSize: 11, color: '#6C757D' }}>
            {parseFloat(form.mhr) > 0 ? `✅ MHR: ₹${parseFloat(form.mhr).toFixed(2)}/hr  |  Monthly: ${INR(mhrCalc.totalMonthly)}` : '⚠️ MHR not calculated — go to MHR tab'}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} style={{ padding: '8px 20px', background: '#fff', color: '#6C757D', border: '1.5px solid #E0D5E0', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={save} disabled={saving}
              style={{ padding: '8px 24px', background: saving ? '#6C757D' : '#1A5276', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '⏳ Saving...' : isEdit ? '💾 Update Work Center' : '💾 Create Work Center'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN LIST PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function WorkCenterMaster() {
  const [wcs,      setWcs]      = useState([])
  const [loading,  setLoading]  = useState(false)
  const [search,   setSearch]   = useState('')
  const [statFilt, setStatFilt] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editWC,   setEditWC]   = useState(null)

  // ── API calls ───────────────────────────────────────────────────────────────
  const fetchWCs = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/pp/work-centers`, { headers: authHdrs() })
      const data = await res.json()
      if (res.ok) setWcs(data.data?.length ? data.data : SEED_WCS)
      else setWcs(SEED_WCS)
    } catch { setWcs(SEED_WCS) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchWCs() }, [])

  const saveWC = async (payload) => {
    try {
      // SEED records have numeric ids 1-10 but don't exist in DB
      // Detect: if editing and id <= 20, try PATCH first, fallback to POST (create)
      const isSeedRecord = editWC && (!editWC._dbId) && parseInt(editWC.id) <= 20

      let url, method
      if (editWC && editWC._dbId) {
        // Real DB record — PATCH
        url    = `${BASE_URL}/pp/work-centers/${editWC._dbId}`
        method = 'PATCH'
      } else if (editWC && !isSeedRecord) {
        // Real DB record by id
        url    = `${BASE_URL}/pp/work-centers/${editWC.id}`
        method = 'PATCH'
      } else {
        // New record OR seed record → POST (create)
        url    = `${BASE_URL}/pp/work-centers`
        method = 'POST'
      }

      const { _isSeed, customShiftHrs, _dbId, ...cleanPayload } = payload
      const res  = await fetch(url, { method, headers: authHdrs(), body: JSON.stringify(cleanPayload) })
      const data = await res.json()

      if (!res.ok) {
        // If PATCH failed (record not in DB), try POST
        if (method === 'PATCH') {
          const res2  = await fetch(`${BASE_URL}/pp/work-centers`, {
            method: 'POST', headers: authHdrs(), body: JSON.stringify(payload)
          })
          const data2 = await res2.json()
          if (!res2.ok) throw new Error(data2.error || 'Save failed')
          toast.success(`✅ Work Center ${payload.wcId} created in database!`)
        } else {
          throw new Error(data.error || 'Save failed')
        }
      } else {
        toast.success(`✅ Work Center ${payload.wcId} saved!`)
      }

      setShowForm(false); setEditWC(null)
      fetchWCs()  // Always refresh from DB after save
    } catch (e) {
      toast.error(`Save failed: ${e.message}`)
      // Do NOT silently update local state — user must know save failed
    }
  }

  const deleteWC = async (wc) => {
    if (!confirm(`Delete ${wc.wcId} — ${wc.name}? This cannot be undone.`)) return
    try {
      if (wc.id && parseInt(wc.id) > 20) {
        // Real DB record
        const res = await fetch(`${BASE_URL}/pp/work-centers/${wc.id}`, { method: 'DELETE', headers: authHdrs() })
        if (!res.ok) throw new Error('Delete failed')
        toast.success(`Work Center ${wc.wcId} deleted from database`)
      } else {
        toast('This is demo data — not in database yet', { icon: 'ℹ️' })
      }
      setWcs(w => w.filter(x => x.id !== wc.id))
      fetchWCs()
    } catch (e) {
      toast.error(e.message)
    }
  }

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = wcs.filter(w =>
    (statFilt === 'All' || w.status === statFilt) &&
    (w.wcId?.toLowerCase().includes(search.toLowerCase()) ||
     w.name?.toLowerCase().includes(search.toLowerCase()) ||
     w.process?.toLowerCase().includes(search.toLowerCase()) ||
     w.machineId?.toLowerCase().includes(search.toLowerCase()))
  )

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = [
    { label: 'Total Work Centers', value: wcs.length,                                          bg: '#EBF5FB', c: '#1A5276' },
    { label: 'Active',             value: wcs.filter(w => w.status === 'Active').length,        bg: '#D4EDDA', c: '#155724' },
    { label: 'Under Maintenance',  value: wcs.filter(w => w.status === 'Under Maintenance').length, bg: '#FFF3CD', c: '#856404' },
    { label: 'Avg MHR',
      value: (() => {
        const withMHR = wcs.filter(w => parseFloat(w.mhr) > 0)
        if (!withMHR.length) return '—'
        const avg = withMHR.reduce((s, w) => s + parseFloat(w.mhr), 0) / withMHR.length
        return `₹${avg.toFixed(0)}/hr`
      })(),
      bg: '#F4ECF7', c: '#6C3483' },
    { label: 'With MHR Configured', value: wcs.filter(w => parseFloat(w.mhr) > 0).length,     bg: '#D5F5E3', c: '#196F3D' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Work Center Master
          <small>SAP: CR01/CR02 · {wcs.length} Work Centers</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p" onClick={() => { setEditWC(null); setShowForm(true) }}>
            + New Work Center
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div style={{ padding: '8px 12px', background: '#EBF5FB', border: '1px solid #AED6F1', borderRadius: 6, marginBottom: 8, fontSize: 12, color: '#1A5276' }}>
        <strong>Work Center Master</strong> — Define machines, stations and MHR (Machine Hour Rate) for production costing. MHR is used in Work Orders for job cost calculation.
      </div>

      {/* Seed data warning — shown when DB is empty */}
      {wcs.some(w=>w._isSeed) && (
        <div style={{ padding:'10px 14px', background:'#FFF3CD', border:'1px solid #FFC107', borderRadius:6, marginBottom:14, fontSize:12, color:'#856404', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>⚠️ <strong>Demo data showing</strong> — Not saved to DB yet. Click <strong>"💾 Save All to DB"</strong> to create all 10 work centers at once.</span>
          <button onClick={async () => {
            let created = 0
            for (const wc of SEED_WCS) {
              try {
                const { _isSeed, id, ...payload } = wc
                const res = await fetch(`${BASE_URL}/pp/work-centers`, { method:'POST', headers:authHdrs(), body:JSON.stringify(payload) })
                if (res.ok) created++
              } catch {}
            }
            if (created > 0) { toast.success(`✅ ${created} Work Centers saved to database!`); fetchWCs() }
            else toast.error('Failed to save — check backend')
          }} style={{ padding:'6px 16px', background:'#856404', color:'#fff', border:'none', borderRadius:5, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', marginLeft:16 }}>
            💾 Save All to DB
          </button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: 8, padding: '12px 16px', border: `1px solid ${k.c}22` }}>
            <div style={{ fontSize: 11, color: k.c, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.c, fontFamily: 'Syne,sans-serif', lineHeight: 1.3 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input placeholder="🔍 Search WC ID, Name, Machine or Process..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid var(--odoo-border)', borderRadius: 6, fontSize: 12, outline: 'none', width: 340 }} />
        {['All', ...STATUS_OPTS].map(s => (
          <button key={s} onClick={() => setStatFilt(s)}
            style={{ padding: '5px 12px', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: statFilt === s ? '#1A5276' : '#F8F9FA',
              color: statFilt === s ? '#fff' : '#6C757D',
              border: `1px solid ${statFilt === s ? '#1A5276' : '#DEE2E6'}` }}>
            {s}
          </button>
        ))}
        <span style={{ fontSize: 11, color: 'var(--odoo-gray)', marginLeft: 'auto' }}>
          {filtered.length} of {wcs.length} work centers
        </span>
      </div>

      {/* Table */}
      <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto', border: '1px solid var(--odoo-border)', borderRadius: 6 }}>
        <table className="fi-data-table" style={{ width: '100%', minWidth: 1000 }}>
          <thead style={{ position: 'sticky', top: 0, background: '#F8F9FA', zIndex: 10 }}>
            <tr>
              <th>WC ID</th>
              <th>Machine ID</th>
              <th>Work Center Name</th>
              <th>Process</th>
              <th>Capacity</th>
              <th>Shift</th>
              <th>MHR (₹/hr)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#6C757D' }}>Loading...</td></tr>
            )}
            {!loading && filtered.map((w, i) => {
              const sc = STATUS_CFG[w.status] || STATUS_CFG.Active
              const hasMHR = parseFloat(w.mhr) > 0
              return (
                <tr key={w.id || w.wcId} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ fontFamily: 'DM Mono,monospace', fontWeight: 700, color: '#1A5276', fontSize: 12 }}>{w.wcId}</td>
                  <td style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#6C757D' }}>{w.machineId || '—'}</td>
                  <td style={{ fontWeight: 600, fontSize: 12 }}>{w.name}</td>
                  <td style={{ fontSize: 11 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, background: '#EBF5FB', color: '#1A5276', fontSize: 10, fontWeight: 600 }}>{w.process}</span>
                  </td>
                  <td style={{ fontSize: 11, color: '#495057' }}>{w.capacity ? `${w.capacity} ${w.capacityUnit || ''}` : '—'}</td>
                  <td style={{ fontSize: 11, color: '#6C757D' }}>{w.shift || '—'}</td>
                  <td>
                    {hasMHR ? (
                      <span style={{ fontFamily: 'DM Mono,monospace', fontWeight: 800, fontSize: 13, color: '#155724' }}>
                        ₹{parseFloat(w.mhr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#DC3545', fontWeight: 600 }}>Not set</span>
                    )}
                  </td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.c }}>{w.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditWC(w); setShowForm(true) }}
                        style={{ padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 4, border: '1px solid #1A5276', background: '#EBF5FB', color: '#1A5276', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => deleteWC(w)}
                        style={{ padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 4, border: '1px solid #DC3545', background: '#F8D7DA', color: '#721C24', cursor: 'pointer' }}>Del</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 50, textAlign: 'center', color: '#6C757D', fontSize: 13 }}>
                {wcs.length === 0 ? '🏭 No Work Centers yet — click "+ New Work Center" to add one' : 'No work centers match your filter'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <WCForm
          wc={editWC}
          allWCs={wcs}
          onSave={saveWC}
          onCancel={() => { setShowForm(false); setEditWC(null) }}
        />
      )}
    </div>
  )
}
