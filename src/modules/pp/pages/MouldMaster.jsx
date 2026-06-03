import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })

// ── Constants from NPR MouldForm ──────────────────────────────────
const MACHINES     = ['50T','75T','110T','150T','180T','250T','350T','450T','550T','650T','850T','1000T']
const CATEGORIES   = ['2-Plate','3-Plate','Hot Runner','Stack Mould']
const RUNNERS      = ['Cold Runner','Hot Runner','Sub Gate','Pin Gate']
const GATE_TYPES   = ['Pin Gate','Fan Gate','Edge Gate','Submarine','Banana Gate','Tunnel Gate']
const EJECTION     = ['Ejector Pins','Stripper Plate','Sleeve','Air Ejection','Blade']
const COOLING      = ['Straight','Baffle','Spiral','Bubbler','Conformal']
const MATERIALS    = ['P20','H13','D2','Mild Steel','EN31','Stainless Steel','Aluminum','Beryllium Copper']
const MOULD_STATUS = ['Active','PM Due','Under Maintenance','Retired']

const BLANK = {
  mouldId:'', mouldName:'', itemCode:'', itemName:'', partNo:'',
  cavity:1, mouldMaker:'', location:'',
  purchaseDate:'', purchaseCost:'',
  // Mould Design Parameters (from NPR)
  category:'2-Plate',
  runnerType:'Cold Runner', runnerWt:'', runnerWtPart:'', shotWt:'',
  machines:[],           // multi-select array
  gateType:'', ejectionType:'', coolingSystem:'',
  insertMat:'', housingMat:'', movingMat:'',
  // Cycle time breakdown
  t1:'', t2:'', t3:'', t4:'',
  // Dimensions & life
  mouldLength:'', mouldWidth:'', mouldHeight:'', mouldWeight:'',
  designedLife:500000, currentShots:0,
  pmInterval:50000, warningAt:45000,
  material:'P20',   // primary mould material
  status:'Active', remarks:''
}

const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:3, textTransform:'uppercase' }
const SHdr = ({t,c='#714B67'}) => (
  <div style={{ background:c, padding:'7px 14px', marginBottom:0 }}>
    <span style={{ color:'#fff', fontSize:12, fontWeight:700, fontFamily:'Syne,sans-serif' }}>{t}</span>
  </div>
)

export default function MouldMaster() {
  const [moulds,    setMoulds]    = useState([])
  const [items,     setItems]     = useState([])  // Item Master for FG/SFG dropdown
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editId,    setEditId]    = useState(null)
  const [form,      setForm]      = useState(BLANK)
  const [saving,    setSaving]    = useState(false)
  const [calcQty,   setCalcQty]   = useState({})
  const [showMaint, setShowMaint] = useState(null)
  const [maintForm, setMaintForm] = useState({ workDone:'', techName:'', cost:'', remarks:'' })
  const [showLogs,  setShowLogs]  = useState(null)
  const [maintLogs, setMaintLogs] = useState([])
  const [search,    setSearch]    = useState('')
  const [activeTab, setActiveTab] = useState('design')
  const [inserts,   setInserts]   = useState([]) // inserts for current mould being edited
  const [insertForm,setInsertForm]= useState({ insertId:'', insertName:'', itemCode:'',
    itemName:'', cavityOverride:'', material:'P20', designedLife:300000,
    pmInterval:25000, warningAt:22000, status:'Active', remarks:'' })
  const [savingInsert, setSavingInsert] = useState(false)
  const [showInsertForm, setShowInsertForm] = useState(false)

  const set  = (k,v) => setForm(f => ({ ...f, [k]:v }))
  const mset = (k,v) => setMaintForm(f => ({ ...f, [k]:v }))
  const iset = (k,v) => setInsertForm(f => ({ ...f, [k]:v }))

  // Cycle time auto-calc
  const totalCyc = (parseFloat(form.t1)||0) + (parseFloat(form.t2)||0) +
                   (parseFloat(form.t3)||0) + (parseFloat(form.t4)||0)
  const mouldSize = form.mouldLength && form.mouldWidth && form.mouldHeight
    ? `${form.mouldLength} × ${form.mouldWidth} × ${form.mouldHeight} mm` : ''

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rM, rI] = await Promise.all([
        fetch(`${BASE}/pp/moulds`,    { headers: hdr2() }),
        fetch(`${BASE}/mdm/items`, { headers: hdr2() }),
      ])
      const [dM, dI] = await Promise.all([rM.json(), rI.json()])
      setMoulds(dM.data || [])
      const allItems = dI.data || []
      // Filter by itemType field — FG (Finished Goods) and SFG (Semi Finished)
      setItems(allItems.filter(i => ['FG','SFG'].includes((i.itemType||'').toUpperCase())))
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Multi-machine toggle
  const toggleMachine = (m) => {
    setForm(f => ({
      ...f,
      machines: f.machines.includes(m)
        ? f.machines.filter(x => x !== m)
        : [...f.machines, m]
    }))
  }

  // Item select auto-fill
  const onItemSelect = (code) => {
    const item = items.find(i => (i.code||i.itemCode) === code)
    setForm(f => ({
      ...f,
      itemCode: code,
      itemName: item?.name || item?.itemName || ''
    }))
  }

  const save = async () => {
    if (!form.mouldId)   return toast.error('Mould ID required')
    if (!form.mouldName) return toast.error('Mould Name required')
    if (!form.cavity)    return toast.error('Cavity count required')
    setSaving(true)
    try {
      // Only send fields that exist in MouldMaster schema
      const payload = {
        mouldId:      form.mouldId,
        mouldName:    form.mouldName,
        partNo:       form.partNo       || null,
        itemCode:     form.itemCode     || null,
        itemName:     form.itemName     || null,
        cavity:       parseInt(form.cavity      || 1),
        mouldMaker:   form.mouldMaker   || null,
        location:     form.location     || null,
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : null,
        purchaseCost: form.purchaseCost ? parseFloat(form.purchaseCost) : null,
        designedLife: parseInt(form.designedLife || 500000),
        currentShots: parseInt(form.currentShots || 0),
        pmInterval:   parseInt(form.pmInterval   || 50000),
        warningAt:    parseInt(form.warningAt    || 45000),
        mouldLength:  form.mouldLength  ? parseFloat(form.mouldLength)  : null,
        mouldWidth:   form.mouldWidth   ? parseFloat(form.mouldWidth)   : null,
        mouldHeight:  form.mouldHeight  ? parseFloat(form.mouldHeight)  : null,
        mouldWeight:  form.mouldWeight  ? parseFloat(form.mouldWeight)  : null,
        status:       form.status       || 'Active',
        // All extra design params stored in remarks as JSON
        remarks: JSON.stringify({
          category:     form.category,
          runnerType:   form.runnerType,
          runnerWt:     form.runnerWt,
          runnerWtPart: form.runnerWtPart,
          shotWt:       form.shotWt,
          machines:     form.machines,
          gateType:     form.gateType,
          ejectionType: form.ejectionType,
          coolingSystem:form.coolingSystem,
          insertMat:    form.insertMat,
          housingMat:   form.housingMat,
          movingMat:    form.movingMat,
          t1: form.t1, t2: form.t2, t3: form.t3, t4: form.t4,
          totalCyc, mouldSize,
          remarks:      form.remarks,
        })
      }
      const url    = editId ? `${BASE}/pp/moulds/${editId}` : `${BASE}/pp/moulds`
      const method = editId ? 'PATCH' : 'POST'
      const r      = await fetch(url, { method, headers: hdr(), body: JSON.stringify(payload) })
      const d      = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(d.message)
      setShowForm(false); setEditId(null); setForm(BLANK); setActiveTab('design')
      load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleEdit = m => {
    // Parse remarks JSON if available
    let extra = {}
    try { extra = JSON.parse(m.remarks || '{}') } catch { extra = {} }
    setForm({
      ...BLANK, ...m,
      ...extra,
      machines: extra.machines || [],
      purchaseDate: m.purchaseDate ? m.purchaseDate.split('T')[0] : '',
      purchaseCost: m.purchaseCost || '',
    })
    setEditId(m.id); setShowForm(true); setActiveTab('design')
    // Load inserts for this mould
    fetch(`${BASE}/pp/moulds/${m.mouldId}/inserts`, { headers: hdr2() })
      .then(r=>r.json()).then(d=>setInserts(d.data||[])).catch(()=>{})
    window.scrollTo(0, 0)
  }

  const saveInsert = async () => {
    if (!insertForm.insertId) return toast.error('Insert ID required')
    if (!insertForm.itemCode) return toast.error('Select part for this insert')
    const editingMouldId = moulds.find(m => m.id === editId)?.mouldId
    if (!editingMouldId) return toast.error('Save mould first before adding inserts')
    setSavingInsert(true)
    try {
      const item = items.find(i => (i.code||i.itemCode) === insertForm.itemCode)
      const payload = {
        ...insertForm,
        itemName:       item?.name || item?.itemName || insertForm.itemName,
        cavityOverride: insertForm.cavityOverride ? parseInt(insertForm.cavityOverride) : null,
        designedLife:   parseInt(insertForm.designedLife || 300000),
        pmInterval:     parseInt(insertForm.pmInterval   || 25000),
        warningAt:      parseInt(insertForm.warningAt    || 22000),
      }
      const r = await fetch(`${BASE}/pp/moulds/${editingMouldId}/inserts`, {
        method:'POST', headers:hdr(), body:JSON.stringify(payload)
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(d.message)
      setInserts(prev => [...prev, d.data])
      setShowInsertForm(false)
      setInsertForm({ insertId:'', insertName:'', itemCode:'', itemName:'',
        cavityOverride:'', material:'P20', designedLife:300000,
        pmInterval:25000, warningAt:22000, status:'Active', remarks:'' })
    } catch(e) { toast.error(e.message) }
    finally { setSavingInsert(false) }
  }

  const loadInsert = async (insertId, machine) => {
    try {
      const r = await fetch(`${BASE}/pp/moulds/inserts/${insertId}/load`, {
        method:'POST', headers:hdr(), body:JSON.stringify({ machine })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(d.message)
      setInserts(prev => prev.map(i => i.insertId===insertId ? {...i, currentMachine:machine, status:'Loaded'} : i))
    } catch(e) { toast.error(e.message) }
  }

  const unloadInsert = async (insertId) => {
    try {
      const r = await fetch(`${BASE}/pp/moulds/inserts/${insertId}/unload`, {
        method:'POST', headers:hdr()
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(d.message)
      setInserts(prev => prev.map(i => i.insertId===insertId ? {...i, currentMachine:null, status:'Active'} : i))
    } catch(e) { toast.error(e.message) }
  }

  const postMaintenance = async () => {
    if (!maintForm.workDone) return toast.error('Work done required')
    try {
      const r = await fetch(`${BASE}/pp/moulds/${showMaint}/maintenance`, {
        method:'POST', headers:hdr(), body:JSON.stringify(maintForm)
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(d.message)
      setShowMaint(null); setMaintForm({ workDone:'', techName:'', cost:'', remarks:'' })
      load()
    } catch (e) { toast.error(e.message) }
  }

  const loadLogs = async (mouldId) => {
    try {
      const r = await fetch(`${BASE}/pp/moulds/${mouldId}/logs`, { headers: hdr2() })
      const d = await r.json()
      setMaintLogs(d.data || [])
      setShowLogs(mouldId)
    } catch { toast.error('Failed to load logs') }
  }

  const lifePct   = m => Math.min(100, Math.round(((m.currentShots||0) / (m.designedLife||500000)) * 100))
  const pmPct     = m => Math.min(100, Math.round(((m.currentShots - m.lastResetShots) / (m.pmInterval||50000)) * 100))
  const lifeColor = p => p > 90 ? '#DC3545' : p > 70 ? '#E67E22' : '#28A745'
  const statusStyle = s => ({
    'Active':            { bg:'#D4EDDA', c:'#155724' },
    'PM Due':            { bg:'#FFF3CD', c:'#856404' },
    'Under Maintenance': { bg:'#D1ECF1', c:'#0C5460' },
    'Retired':           { bg:'#F8D7DA', c:'#721C24' },
  }[s] || { bg:'#E9ECEF', c:'#495057' })

  const filtered = moulds.filter(m =>
    !search ||
    m.mouldId?.toLowerCase().includes(search.toLowerCase()) ||
    m.mouldName?.toLowerCase().includes(search.toLowerCase()) ||
    m.itemName?.toLowerCase().includes(search.toLowerCase())
  )

  // Tabs for form
  const TABS = [
    { id:'design',    label:'Design Parameters' },
    { id:'cycle',     label:'Cycle Time' },
    { id:'dimensions',label:'Dimensions & Life' },
    { id:'machines',  label:'Machines' },
    { id:'inserts',   label:'Inserts / Parts' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:100, background:'#F8F4F8',
        borderBottom:'2px solid #E0D5E0', boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            Mould / Cavity Master
            <small>Shot life · PM alerts · Cycle time · Machine allocation</small>
          </div>
          <div className="lv-acts">
            <input placeholder="Search mould, item..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding:'6px 10px', border:'1px solid #E0D5E0', borderRadius:5, fontSize:12, width:200 }} />
            <button className="btn btn-s sd-bsm" onClick={load}>↻</button>
            <button className="btn btn-p sd-bsm"
              onClick={() => { setForm(BLANK); setEditId(null); setShowForm(true); setActiveTab('design') }}>
              + New Mould
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:12 }}>
        {[
          { l:'Total Moulds',   v: moulds.length,                                          c:'#714B67', bg:'#EDE0EA' },
          { l:'Active',         v: moulds.filter(m=>m.status==='Active').length,            c:'#155724', bg:'#D4EDDA' },
          { l:'PM Due',         v: moulds.filter(m=>m.status==='PM Due'||m.pmDue).length,  c:'#856404', bg:'#FFF3CD' },
          { l:'Under Maint.',   v: moulds.filter(m=>m.status==='Under Maintenance').length, c:'#0C5460', bg:'#D1ECF1' },
          { l:'Total Cavities', v: moulds.reduce((s,m)=>s+parseInt(m.cavity||1),0),         c:'#1A5276', bg:'#EBF5FB' },
        ].map(k => (
          <div key={k.l} style={{ background:k.bg, borderRadius:8, padding:'10px 14px', border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, fontWeight:700, color:k.c, textTransform:'uppercase' }}>{k.l}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.c, fontFamily:'Syne,sans-serif' }}>
              {loading ? '...' : k.v}
            </div>
          </div>
        ))}
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <div style={{ border:'2px solid #714B67', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
          <SHdr t={editId ? 'Edit Mould' : 'New Mould'} />

          {/* Basic info — always visible */}
          <div style={{ padding:16, background:'#fff', borderBottom:'1px solid #E0D5E0' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={lbl}>Mould ID *</label>
                <input
                  style={{ ...inp, fontFamily:'DM Mono,monospace', fontWeight:700,
                    background: editId ? '#F8F9FA' : '#fff' }}
                  value={form.mouldId}
                  onChange={e => set('mouldId', e.target.value.toUpperCase())}
                  placeholder="e.g. MLD-001"
                  readOnly={!!editId} />
              </div>
              <div>
                <label style={lbl}>Mould Name *</label>
                <input style={inp} value={form.mouldName}
                  onChange={e=>set('mouldName',e.target.value)}
                  placeholder="Chair Bottom Bush Mould" />
              </div>
              <div>
                <label style={lbl}>Part No.</label>
                <input style={inp} value={form.partNo}
                  onChange={e=>set('partNo',e.target.value)} placeholder="PT-001" />
              </div>
              <div>
                <label style={lbl}>Cavity Count *</label>
                <input style={{ ...inp, fontWeight:800, fontSize:14, color:'#714B67' }}
                  type="number" min="1" value={form.cavity}
                  onChange={e=>set('cavity',e.target.value)} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr', gap:12 }}>
              <div>
                <label style={lbl}>Item Code (FG/SFG)</label>
                <select style={{ ...inp, cursor:'pointer' }}
                  value={form.itemCode} onChange={e=>onItemSelect(e.target.value)}>
                  <option value="">-- Select Item --</option>
                  {items.map(i => (
                    <option key={i.code||i.itemCode} value={i.code||i.itemCode}>
                      {i.code||i.itemCode} — {i.name||i.itemName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Item Name (auto)</label>
                <input style={{ ...inp, background:'#F8F9FA' }}
                  value={form.itemName} readOnly />
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select style={{ ...inp, cursor:'pointer' }} value={form.status}
                  onChange={e=>set('status',e.target.value)}>
                  {MOULD_STATUS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', background:'#F8F4F8', borderBottom:'1px solid #E0D5E0' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ padding:'8px 18px', fontSize:12, fontWeight:700, border:'none',
                  borderBottom: activeTab===t.id ? '3px solid #714B67' : '3px solid transparent',
                  background:'transparent', cursor:'pointer',
                  color: activeTab===t.id ? '#714B67' : '#6C757D' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Design Parameters */}
          {activeTab === 'design' && (
            <div style={{ padding:16, background:'#fff' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
                <div>
                  <label style={lbl}>Category</label>
                  <select style={{ ...inp, cursor:'pointer' }} value={form.category}
                    onChange={e=>set('category',e.target.value)}>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Runner Type</label>
                  <select style={{ ...inp, cursor:'pointer' }} value={form.runnerType}
                    onChange={e=>set('runnerType',e.target.value)}>
                    {RUNNERS.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Gate Type</label>
                  <select style={{ ...inp, cursor:'pointer' }} value={form.gateType}
                    onChange={e=>set('gateType',e.target.value)}>
                    <option value="">Select...</option>
                    {GATE_TYPES.map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Ejection Type</label>
                  <select style={{ ...inp, cursor:'pointer' }} value={form.ejectionType}
                    onChange={e=>set('ejectionType',e.target.value)}>
                    <option value="">Select...</option>
                    {EJECTION.map(e=><option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
                <div>
                  <label style={lbl}>Cooling System</label>
                  <select style={{ ...inp, cursor:'pointer' }} value={form.coolingSystem}
                    onChange={e=>set('coolingSystem',e.target.value)}>
                    <option value="">Select...</option>
                    {COOLING.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Runner Wt (gm)</label>
                  <input type="number" style={inp} value={form.runnerWt}
                    onChange={e=>set('runnerWt',e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={lbl}>Runner Wt / Part (gm)</label>
                  <input type="number" style={inp} value={form.runnerWtPart}
                    onChange={e=>set('runnerWtPart',e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={lbl}>Shot Weight (gm)</label>
                  <input type="number" style={inp} value={form.shotWt}
                    onChange={e=>set('shotWt',e.target.value)} placeholder="0" />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                <div>
                  <label style={lbl}>Insert Material</label>
                  <select style={{ ...inp, cursor:'pointer' }} value={form.insertMat}
                    onChange={e=>set('insertMat',e.target.value)}>
                    <option value="">Select...</option>
                    {MATERIALS.map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Housing Material</label>
                  <select style={{ ...inp, cursor:'pointer' }} value={form.housingMat}
                    onChange={e=>set('housingMat',e.target.value)}>
                    <option value="">Select...</option>
                    {MATERIALS.map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Moving Parts Material</label>
                  <select style={{ ...inp, cursor:'pointer' }} value={form.movingMat}
                    onChange={e=>set('movingMat',e.target.value)}>
                    <option value="">Select...</option>
                    {MATERIALS.map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Cycle Time */}
          {activeTab === 'cycle' && (
            <div style={{ padding:16, background:'#fff' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
                {[['t1','T1 — Filling (sec)'],['t2','T2 — Cooling (sec)'],
                  ['t3','T3 — Ejection (sec)'],['t4','T4 — Other (sec)']].map(([k,l])=>(
                  <div key={k}>
                    <label style={lbl}>{l}</label>
                    <input type="number" style={inp} value={form[k]}
                      onChange={e=>set(k,e.target.value)} placeholder="0" />
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>Total Cycle Time (AUTO)</label>
                  <div style={{ padding:'8px 12px', background:'#EBF5FB', borderRadius:5,
                    fontWeight:800, fontSize:16, color:'#1A5276', border:'1.5px solid #AED6F1',
                    fontFamily:'DM Mono,monospace' }}>
                    {totalCyc > 0 ? `${totalCyc} sec` : '— sec'}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Output / Hour (with cavity)</label>
                  <div style={{ padding:'8px 12px', background:'#D4EDDA', borderRadius:5,
                    fontWeight:800, fontSize:16, color:'#155724', border:'1.5px solid #A9DFBF',
                    fontFamily:'DM Mono,monospace' }}>
                    {totalCyc > 0
                      ? `${Math.floor(3600/totalCyc * parseInt(form.cavity||1)).toLocaleString('en-IN')} pcs`
                      : '—'}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Output / 8h Shift</label>
                  <div style={{ padding:'8px 12px', background:'#D4EDDA', borderRadius:5,
                    fontWeight:800, fontSize:16, color:'#155724', border:'1.5px solid #A9DFBF',
                    fontFamily:'DM Mono,monospace' }}>
                    {totalCyc > 0
                      ? `${Math.floor(28800/totalCyc * parseInt(form.cavity||1)).toLocaleString('en-IN')} pcs`
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Dimensions & Life */}
          {activeTab === 'dimensions' && (
            <div style={{ padding:16, background:'#fff' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
                <div>
                  <label style={lbl}>Length (mm)</label>
                  <input type="number" style={inp} value={form.mouldLength}
                    onChange={e=>set('mouldLength',e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={lbl}>Width (mm)</label>
                  <input type="number" style={inp} value={form.mouldWidth}
                    onChange={e=>set('mouldWidth',e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={lbl}>Height (mm)</label>
                  <input type="number" style={inp} value={form.mouldHeight}
                    onChange={e=>set('mouldHeight',e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={lbl}>Mould Size (AUTO)</label>
                  <input style={{ ...inp, background:'#F8F9FA', fontWeight:700 }}
                    value={mouldSize} readOnly />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
                <div>
                  <label style={lbl}>Weight (kg)</label>
                  <input type="number" style={inp} value={form.mouldWeight}
                    onChange={e=>set('mouldWeight',e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={lbl}>Mould Maker</label>
                  <input style={inp} value={form.mouldMaker}
                    onChange={e=>set('mouldMaker',e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Purchase Date</label>
                  <input type="date" style={inp} value={form.purchaseDate}
                    onChange={e=>set('purchaseDate',e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Purchase Cost (Rs.)</label>
                  <input type="number" style={inp} value={form.purchaseCost}
                    onChange={e=>set('purchaseCost',e.target.value)} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                <div>
                  <label style={lbl}>Designed Life (shots)</label>
                  <input type="number" style={inp} value={form.designedLife}
                    onChange={e=>set('designedLife',e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Current Shots</label>
                  <input type="number" style={{ ...inp, background:'#F8F9FA' }}
                    value={form.currentShots}
                    onChange={e=>set('currentShots',e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>PM Interval (shots)</label>
                  <input type="number" style={inp} value={form.pmInterval}
                    onChange={e=>set('pmInterval',e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>PM Warning At</label>
                  <input type="number" style={inp} value={form.warningAt}
                    onChange={e=>set('warningAt',e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Machines */}
          {activeTab === 'machines' && (
            <div style={{ padding:16, background:'#fff' }}>
              <div style={{ fontSize:12, color:'#6C757D', marginBottom:12 }}>
                Select all machines this mould can run on (based on mould size vs platen size):
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
                {MACHINES.map(m => (
                  <button key={m} onClick={() => toggleMachine(m)}
                    style={{
                      padding:'6px 16px', fontSize:12, fontWeight:700, borderRadius:6,
                      cursor:'pointer', border:'2px solid',
                      borderColor: form.machines.includes(m) ? '#714B67' : '#E0D5E0',
                      background:  form.machines.includes(m) ? '#714B67' : '#fff',
                      color:       form.machines.includes(m) ? '#fff'    : '#6C757D',
                    }}>
                    {m} {form.machines.includes(m) ? '✓' : ''}
                  </button>
                ))}
              </div>
              {form.machines.length > 0 && (
                <div style={{ padding:'10px 14px', background:'#EBF5FB', borderRadius:6,
                  fontSize:12, color:'#1A5276', fontWeight:600 }}>
                  Selected: {form.machines.join(', ')}
                  {totalCyc > 0 && (
                    <div style={{ marginTop:8 }}>
                      Output / shift ({totalCyc}s cycle, {form.cavity} cavity):
                      <strong style={{ marginLeft:4, color:'#155724' }}>
                        {Math.floor(28800/totalCyc*parseInt(form.cavity||1)).toLocaleString('en-IN')} pcs
                      </strong>
                    </div>
                  )}
                </div>
              )}
              <div style={{ marginTop:16 }}>
                <label style={lbl}>Remarks</label>
                <input style={inp} value={form.remarks}
                  onChange={e=>set('remarks',e.target.value)}
                  placeholder="Any special notes..." />
              </div>
            </div>
          )}

          {/* Tab: Inserts / Parts */}
          {activeTab === 'inserts' && (
            <div style={{ padding:16, background:'#fff' }}>
              {!editId ? (
                <div style={{ padding:30, textAlign:'center', color:'#856404',
                  background:'#FFF3CD', borderRadius:8, fontSize:13 }}>
                  ⚠️ Save the mould first, then add inserts.
                </div>
              ) : (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:14 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:'#714B67' }}>
                        Insert / Core Set Management
                      </div>
                      <div style={{ fontSize:11, color:'#6C757D', marginTop:2 }}>
                        One mould base → multiple inserts → multiple parts.
                        Shot life tracked independently per insert.
                      </div>
                    </div>
                    <button className="btn btn-p sd-bsm"
                      onClick={() => setShowInsertForm(true)}>
                      + Add Insert
                    </button>
                  </div>

                  {/* Add Insert Form */}
                  {showInsertForm && (
                    <div style={{ border:'1.5px solid #714B67', borderRadius:8,
                      overflow:'hidden', marginBottom:14 }}>
                      <div style={{ background:'#714B67', padding:'7px 14px' }}>
                        <span style={{ color:'#fff', fontWeight:700, fontSize:12 }}>New Insert</span>
                      </div>
                      <div style={{ padding:14, background:'#FBF8FB' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr 1fr', gap:10, marginBottom:10 }}>
                          <div>
                            <label style={lbl}>Insert ID *</label>
                            <input style={{ ...inp, fontFamily:'DM Mono,monospace', fontWeight:700 }}
                              value={insertForm.insertId}
                              onChange={e=>iset('insertId',e.target.value.toUpperCase())}
                              placeholder="INS-001-A" />
                          </div>
                          <div>
                            <label style={lbl}>Insert Name</label>
                            <input style={inp} value={insertForm.insertName}
                              onChange={e=>iset('insertName',e.target.value)}
                              placeholder="Core Set A" />
                          </div>
                          <div>
                            <label style={lbl}>Part (FG/SFG) *</label>
                            <select style={{ ...inp, cursor:'pointer' }}
                              value={insertForm.itemCode}
                              onChange={e=>{
                                const item = items.find(i=>(i.code||i.itemCode)===e.target.value)
                                iset('itemCode', e.target.value)
                                iset('itemName', item?.name||item?.itemName||'')
                              }}>
                              <option value="">-- Select Part --</option>
                              {items.map(i=>(
                                <option key={i.code||i.itemCode} value={i.code||i.itemCode}>
                                  {i.code||i.itemCode} — {i.name||i.itemName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>Cavity Override</label>
                            <input type="number" style={inp}
                              value={insertForm.cavityOverride}
                              onChange={e=>iset('cavityOverride',e.target.value)}
                              placeholder="Leave blank = mould cavity" />
                          </div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:10 }}>
                          <div>
                            <label style={lbl}>Insert Material</label>
                            <select style={{ ...inp, cursor:'pointer' }}
                              value={insertForm.material}
                              onChange={e=>iset('material',e.target.value)}>
                              {['P20','H13','D2','EN31','Mild Steel','Stainless Steel'].map(m=>(
                                <option key={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>Designed Life (shots)</label>
                            <input type="number" style={inp}
                              value={insertForm.designedLife}
                              onChange={e=>iset('designedLife',e.target.value)} />
                          </div>
                          <div>
                            <label style={lbl}>PM Interval (shots)</label>
                            <input type="number" style={inp}
                              value={insertForm.pmInterval}
                              onChange={e=>iset('pmInterval',e.target.value)} />
                          </div>
                          <div>
                            <label style={lbl}>PM Warning At</label>
                            <input type="number" style={inp}
                              value={insertForm.warningAt}
                              onChange={e=>iset('warningAt',e.target.value)} />
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button className="btn btn-p sd-bsm"
                            disabled={savingInsert} onClick={saveInsert}>
                            {savingInsert ? '⏳' : 'Save Insert'}
                          </button>
                          <button className="btn btn-s sd-bsm"
                            onClick={() => setShowInsertForm(false)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inserts Table */}
                  {inserts.length === 0 ? (
                    <div style={{ padding:40, textAlign:'center', color:'#6C757D',
                      background:'#F8F9FA', borderRadius:8, border:'2px dashed #E0D5E0' }}>
                      <div style={{ fontSize:32, marginBottom:8 }}>🔩</div>
                      <div style={{ fontWeight:700 }}>No inserts added yet</div>
                      <div style={{ fontSize:12, marginTop:4 }}>
                        Add inserts to track which parts this mould base can produce
                      </div>
                    </div>
                  ) : (
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead>
                        <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
                          {['Insert ID','Insert Name','Part Code','Part Name','Cavity',
                            'Material','Life Used','PM Status','Loaded On','Actions'].map(h=>(
                            <th key={h} style={{ padding:'7px 10px', fontSize:10, fontWeight:700,
                              color:'#6C757D', textAlign:'left', textTransform:'uppercase',
                              whiteSpace:'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {inserts.map((ins, i) => {
                          const lifePct = Math.min(100, Math.round((ins.currentShots/ins.designedLife)*100))
                          const pmPct   = Math.min(100, Math.round(((ins.currentShots-ins.lastResetShots)/ins.pmInterval)*100))
                          const lc      = lifePct>90?'#DC3545':lifePct>70?'#E67E22':'#28A745'
                          const pc      = pmPct>90?'#DC3545':pmPct>70?'#E67E22':'#28A745'
                          const parentMould = moulds.find(m=>m.id===editId)
                          const compatMachines = (() => {
                            try { return JSON.parse(parentMould?.remarks||'{}').machines||[] } catch { return [] }
                          })()
                          return (
                            <tr key={ins.id} style={{ borderBottom:'1px solid #F0EEF0',
                              background: i%2===0?'#fff':'#FDFBFD' }}>
                              <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace',
                                fontWeight:700, color:'#714B67' }}>{ins.insertId}</td>
                              <td style={{ padding:'8px 10px', color:'#6C757D' }}>
                                {ins.insertName||'—'}
                              </td>
                              <td style={{ padding:'8px 10px', fontFamily:'DM Mono,monospace',
                                fontSize:11, color:'#1A5276' }}>{ins.itemCode||'—'}</td>
                              <td style={{ padding:'8px 10px', fontWeight:600 }}>
                                {ins.itemName||'—'}
                              </td>
                              <td style={{ padding:'8px 10px', textAlign:'center',
                                fontWeight:800, color:'#714B67' }}>
                                {ins.cavityOverride || parentMould?.cavity || '—'}
                              </td>
                              <td style={{ padding:'8px 10px', fontSize:11 }}>{ins.material||'—'}</td>
                              <td style={{ padding:'8px 10px', minWidth:100 }}>
                                <div style={{ fontSize:11, fontWeight:700, color:lc, marginBottom:3 }}>
                                  {ins.currentShots?.toLocaleString('en-IN')} / {ins.designedLife?.toLocaleString('en-IN')} ({lifePct}%)
                                </div>
                                <div style={{ height:4, background:'#E0E0E0', borderRadius:2, overflow:'hidden' }}>
                                  <div style={{ height:'100%', width:`${lifePct}%`, background:lc }} />
                                </div>
                              </td>
                              <td style={{ padding:'8px 10px', minWidth:100 }}>
                                <div style={{ fontSize:11, fontWeight:700, color:pc }}>
                                  PM: {pmPct}%
                                </div>
                                <div style={{ height:4, background:'#E0E0E0', borderRadius:2, overflow:'hidden', marginTop:2 }}>
                                  <div style={{ height:'100%', width:`${pmPct}%`, background:pc }} />
                                </div>
                                {ins.pmDue && (
                                  <div style={{ fontSize:9, color:'#DC3545', fontWeight:700, marginTop:2 }}>
                                    ⚠️ PM Due!
                                  </div>
                                )}
                              </td>
                              <td style={{ padding:'8px 10px' }}>
                                {ins.currentMachine ? (
                                  <div>
                                    <span style={{ padding:'2px 8px', borderRadius:8,
                                      background:'#D4EDDA', color:'#155724',
                                      fontSize:10, fontWeight:700 }}>
                                      ✅ {ins.currentMachine}
                                    </span>
                                    <button onClick={() => unloadInsert(ins.insertId)}
                                      style={{ display:'block', marginTop:4, fontSize:10,
                                        color:'#DC3545', background:'none', border:'none',
                                        cursor:'pointer', fontWeight:700 }}>
                                      Unload
                                    </button>
                                  </div>
                                ) : (
                                  <select
                                    style={{ fontSize:11, padding:'3px 6px',
                                      border:'1px solid #E0D5E0', borderRadius:4,
                                      cursor:'pointer' }}
                                    defaultValue=""
                                    onChange={e => {
                                      if (e.target.value) loadInsert(ins.insertId, e.target.value)
                                    }}>
                                    <option value="">Load on...</option>
                                    {compatMachines.map(m=>(
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td style={{ padding:'8px 10px' }}>
                                <span style={{ padding:'2px 8px', borderRadius:8,
                                  fontSize:10, fontWeight:700,
                                  background: ins.status==='Loaded'?'#D4EDDA'
                                    :ins.status==='PM Due'?'#FFF3CD'
                                    :ins.status==='Under Maintenance'?'#D1ECF1':'#E9ECEF',
                                  color: ins.status==='Loaded'?'#155724'
                                    :ins.status==='PM Due'?'#856404'
                                    :ins.status==='Under Maintenance'?'#0C5460':'#495057'
                                }}>{ins.status}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          )}

          {/* Save/Cancel */}
          <div style={{ padding:'12px 16px', background:'#F8F4F8',
            borderTop:'1px solid #E0D5E0', display:'flex', gap:8 }}>
            <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
              {saving ? '⏳ Saving...' : editId ? 'Update Mould' : 'Save Mould'}
            </button>
            <button className="btn btn-s sd-bsm"
              onClick={() => { setShowForm(false); setEditId(null); setForm(BLANK) }}>
              Cancel
            </button>
            {form.cavity > 0 && totalCyc > 0 && (
              <div style={{ marginLeft:'auto', fontSize:11, color:'#1A5276',
                alignSelf:'center', fontWeight:700 }}>
                Cavity {form.cavity} · {totalCyc}s cycle →
                <strong style={{ marginLeft:4 }}>
                  {Math.floor(28800/totalCyc*parseInt(form.cavity||1)).toLocaleString('en-IN')} pcs/shift
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaint && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
          zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:10, width:480, padding:24,
            boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>
            <h3 style={{ margin:'0 0 16px', color:'#714B67', fontFamily:'Syne,sans-serif' }}>
              Log PM — {showMaint}
            </h3>
            <div style={{ display:'grid', gap:12 }}>
              <div>
                <label style={lbl}>Work Done *</label>
                <input style={inp} value={maintForm.workDone}
                  onChange={e=>mset('workDone',e.target.value)}
                  placeholder="Polishing / Core repair / Cooling channel cleaning..." />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>Technician</label>
                  <input style={inp} value={maintForm.techName}
                    onChange={e=>mset('techName',e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Cost (Rs.)</label>
                  <input type="number" style={inp} value={maintForm.cost}
                    onChange={e=>mset('cost',e.target.value)} />
                </div>
              </div>
              <div>
                <label style={lbl}>Remarks</label>
                <input style={inp} value={maintForm.remarks}
                  onChange={e=>mset('remarks',e.target.value)} />
              </div>
              <div style={{ background:'#FFF3CD', padding:'8px 12px', borderRadius:6,
                fontSize:11, color:'#856404' }}>
                ⚠️ This resets PM shot counter → status back to Active.
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button className="btn btn-p sd-bsm" onClick={postMaintenance}>Post PM</button>
              <button className="btn btn-s sd-bsm" onClick={() => setShowMaint(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Log Modal */}
      {showLogs && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
          zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:10, width:680, maxHeight:'80vh',
            overflow:'auto', padding:24, boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <h3 style={{ margin:0, color:'#714B67', fontFamily:'Syne,sans-serif' }}>
                Maintenance History — {showLogs}
              </h3>
              <button className="btn btn-s sd-bsm" onClick={() => setShowLogs(null)}>Close</button>
            </div>
            {maintLogs.length === 0 ? (
              <div style={{ textAlign:'center', color:'#6C757D', padding:40 }}>No records yet</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#F8F4F8', borderBottom:'2px solid #E0D5E0' }}>
                    {['Date','Shots At Service','Work Done','Tech','Next Due (shots)','Cost'].map(h=>(
                      <th key={h} style={{ padding:'7px 10px', fontSize:10, fontWeight:700,
                        color:'#6C757D', textAlign:'left', textTransform:'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {maintLogs.map((l,i)=>(
                    <tr key={l.id} style={{ borderBottom:'1px solid #F0EEF0',
                      background:i%2===0?'#fff':'#FDFBFD' }}>
                      <td style={{ padding:'7px 10px', fontFamily:'DM Mono,monospace' }}>
                        {new Date(l.logDate).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding:'7px 10px', fontFamily:'DM Mono,monospace',
                        fontWeight:700, color:'#714B67' }}>
                        {l.shotsAtService?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding:'7px 10px', fontWeight:600 }}>{l.workDone}</td>
                      <td style={{ padding:'7px 10px', color:'#6C757D' }}>{l.techName||'—'}</td>
                      <td style={{ padding:'7px 10px', fontFamily:'DM Mono,monospace', color:'#1A5276' }}>
                        {l.nextDueShots?.toLocaleString('en-IN')||'—'}
                      </td>
                      <td style={{ padding:'7px 10px', fontFamily:'DM Mono,monospace', color:'#155724' }}>
                        {l.cost ? `₹${parseFloat(l.cost).toLocaleString('en-IN')}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Mould Cards */}
      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D' }}>Loading moulds...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🔧</div>
          <div style={{ fontWeight:700 }}>
            {search ? 'No moulds match search' : 'No moulds configured'}
          </div>
          {!search && (
            <button className="btn btn-p sd-bsm" style={{ marginTop:12 }}
              onClick={() => { setForm(BLANK); setShowForm(true) }}>
              + Add First Mould
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:12 }}>
          {filtered.map(m => {
            const lp  = lifePct(m)
            const pp  = pmPct(m)
            const lc  = lifeColor(lp)
            const pc  = lifeColor(pp)
            const ss  = statusStyle(m.status)
            const qty = calcQty[m.id] || ''
            const shots4qty = qty && m.cavity > 0
              ? Math.ceil(parseInt(qty) / parseInt(m.cavity)) : 0

            // Parse stored params
            let extra = {}
            try { extra = JSON.parse(m.remarks || '{}') } catch {}

            return (
              <div key={m.id} style={{ border:'1.5px solid #E0D5E0',
                borderRadius:8, overflow:'hidden', background:'#fff' }}>

                {/* Header */}
                <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)',
                  padding:'10px 14px', display:'flex', justifyContent:'space-between',
                  alignItems:'start' }}>
                  <div>
                    <div style={{ color:'#fff', fontWeight:800, fontSize:13,
                      fontFamily:'Syne,sans-serif' }}>{m.mouldName}</div>
                    <div style={{ color:'rgba(255,255,255,.7)', fontSize:11,
                      fontFamily:'DM Mono,monospace', marginTop:2 }}>
                      {m.mouldId} · {extra.category||'—'} · Cavity {m.cavity}
                    </div>
                    {m.itemName && (
                      <div style={{ color:'rgba(255,255,255,.6)', fontSize:10, marginTop:2 }}>
                        FG: {m.itemName}
                      </div>
                    )}
                  </div>
                  <span style={{ padding:'3px 10px', borderRadius:10, fontSize:10,
                    fontWeight:700, background:ss.bg, color:ss.c, whiteSpace:'nowrap' }}>
                    {m.status}
                  </span>
                </div>

                <div style={{ padding:14 }}>
                  {/* Specs grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
                    gap:6, marginBottom:10 }}>
                    {[
                      ['Runner',   extra.runnerType?.split(' ')[0]||'—', '#714B67'],
                      ['Gate',     extra.gateType?.split(' ')[0]||'—',   '#1A5276'],
                      ['Ejection', extra.ejectionType?.split(' ')[0]||'—','#856404'],
                      ['Cooling',  extra.coolingSystem?.split(' ')[0]||'—','#0C5460'],
                    ].map(([l,v,c])=>(
                      <div key={l} style={{ textAlign:'center', padding:'5px 4px',
                        background:'#F8F4F8', borderRadius:6 }}>
                        <div style={{ fontSize:9, color:'#6C757D', marginBottom:1 }}>{l}</div>
                        <div style={{ fontWeight:700, fontSize:11, color:c }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Cycle time summary */}
                  {(extra.totalCyc > 0) && (
                    <div style={{ background:'#EBF5FB', padding:'7px 12px', borderRadius:6,
                      marginBottom:10, display:'flex', justifyContent:'space-between',
                      fontSize:12, color:'#1A5276' }}>
                      <span><strong>Cycle:</strong> {extra.totalCyc}s</span>
                      <span><strong>Shot Wt:</strong> {extra.shotWt||'—'}g</span>
                      <span><strong>Output/shift:</strong> {Math.floor(28800/extra.totalCyc*m.cavity).toLocaleString('en-IN')} pcs</span>
                    </div>
                  )}

                  {/* Machines + Inserts summary */}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                    {extra.machines?.map(mc => (
                      <span key={mc} style={{ padding:'2px 8px', borderRadius:8,
                        fontSize:10, fontWeight:700, background:'#EDE0EA', color:'#714B67' }}>
                        {mc}
                      </span>
                    ))}
                  </div>
                  {/* Inserts badge */}
                  <div style={{ fontSize:11, color:'#1A5276', fontWeight:600,
                    marginBottom:8, cursor:'pointer' }}
                    onClick={() => handleEdit(m)}>
                    🔩 Click Edit → Inserts tab to manage parts &amp; inserts
                  </div>

                  {/* Shot Life bar */}
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      fontSize:11, marginBottom:3 }}>
                      <span style={{ fontWeight:700 }}>Total Shot Life</span>
                      <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:lc }}>
                        {(m.currentShots||0).toLocaleString('en-IN')} / {(m.designedLife||500000).toLocaleString('en-IN')} ({lp}%)
                      </span>
                    </div>
                    <div style={{ height:5, background:'#E0E0E0', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${lp}%`, background:lc, borderRadius:3 }} />
                    </div>
                  </div>

                  {/* PM bar */}
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      fontSize:11, marginBottom:3 }}>
                      <span style={{ fontWeight:700 }}>PM Since Service</span>
                      <span style={{ fontFamily:'DM Mono,monospace', fontWeight:700, color:pc }}>
                        {((m.currentShots||0)-(m.lastResetShots||0)).toLocaleString('en-IN')} / {(m.pmInterval||50000).toLocaleString('en-IN')} ({pp}%)
                      </span>
                    </div>
                    <div style={{ height:5, background:'#E0E0E0', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pp}%`, background:pc, borderRadius:3 }} />
                    </div>
                    {pp >= 100 && (
                      <div style={{ fontSize:10, color:'#DC3545', fontWeight:700, marginTop:2 }}>
                        ⛔ PM Overdue!
                      </div>
                    )}
                  </div>

                  {/* Shot Calculator */}
                  <div style={{ background:'#F8F9FA', padding:'8px 12px',
                    borderRadius:6, marginBottom:10, border:'1px solid #E0D5E0' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#1A5276', marginBottom:5 }}>
                      Shot Calculator
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <input type="number" placeholder="Job qty (pcs)"
                        value={qty}
                        onChange={e=>setCalcQty(c=>({...c,[m.id]:e.target.value}))}
                        style={{ flex:1, padding:'5px 8px', border:'1px solid #E0D5E0',
                          borderRadius:4, fontSize:11 }} />
                    </div>
                    {shots4qty > 0 && (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)',
                        gap:6, marginTop:6 }}>
                        {[
                          ['Shots',     shots4qty.toLocaleString('en-IN'),    '#1A5276'],
                          ['Output',    (shots4qty*m.cavity).toLocaleString('en-IN')+' pcs', '#155724'],
                          ['Life After',`${Math.min(100,Math.round(((m.currentShots+shots4qty)/m.designedLife)*100))}%`, lc],
                        ].map(([l,v,c])=>(
                          <div key={l} style={{ textAlign:'center', padding:'5px',
                            background:'#fff', borderRadius:4, border:'1px solid #E0D5E0' }}>
                            <div style={{ fontWeight:800, fontSize:13, color:c }}>{v}</div>
                            <div style={{ fontSize:9, color:'#6C757D' }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <button className="btn btn-s sd-bsm" onClick={() => handleEdit(m)}>
                      Edit
                    </button>
                    <button onClick={() => setShowMaint(m.mouldId)}
                      style={{ padding:'4px 10px', fontSize:11, fontWeight:700,
                        background: m.pmDue ? '#FFF3CD' : '#F8F4F8',
                        color: m.pmDue ? '#856404' : '#495057',
                        border:`1px solid ${m.pmDue?'#FFE69C':'#E0D5E0'}`,
                        borderRadius:5, cursor:'pointer' }}>
                      🔧 Log PM
                    </button>
                    <button onClick={() => loadLogs(m.mouldId)}
                      style={{ padding:'4px 10px', fontSize:11, fontWeight:700,
                        background:'#EBF5FB', color:'#1A5276',
                        border:'1px solid #AED6F1', borderRadius:5, cursor:'pointer' }}>
                      📋 History
                    </button>
                    {m.maintenanceLogs?.[0] && (
                      <span style={{ marginLeft:'auto', fontSize:10, color:'#6C757D', alignSelf:'center' }}>
                        Last PM: {new Date(m.maintenanceLogs[0].logDate).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
