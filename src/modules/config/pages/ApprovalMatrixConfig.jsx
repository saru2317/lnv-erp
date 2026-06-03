// ═══════════════════════════════════════════════════════════════════
// LNV ERP — Config / ApprovalMatrixConfig.jsx
// UNIFIED approval matrix — replaces old static ApprovalConfig
// Covers: PR, PO, SO, Invoice, PV, GRN, DC, Price List, Increment,
//         HR Policy, Credit Note, Quotation, Leave, Salary Revision
// DB-backed + amount slabs + configurable levels + any role/user
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const fmtAmt = n => n == null ? '∞ No limit' : n === 0 ? '₹0' : '₹' + Number(n).toLocaleString('en-IN')

// ── All doc types across modules ─────────────────────────────────
const DOC_TYPES = [
  // SD
  { value:'INVOICE',       label:'Sales Invoice',         module:'SD', icon:'🧾', color:'#714B67' },
  { value:'SO',            label:'Sales Order',           module:'SD', icon:'📋', color:'#5B2C6F' },
  { value:'QUOTATION',     label:'Quotation',             module:'SD', icon:'💬', color:'#7D3C98' },
  { value:'CREDIT_NOTE',   label:'Credit Note/Discount',  module:'SD', icon:'📉', color:'#922B21' },
  { value:'PRICE_LIST',    label:'Price List/Price Book',  module:'SD', icon:'💲', color:'#1A5276' },
  // MM
  { value:'PR',            label:'Purchase Indent',       module:'MM', icon:'📝', color:'#1F618D' },
  { value:'PO',            label:'Purchase Order',        module:'MM', icon:'📦', color:'#196F3D' },
  { value:'GRN',           label:'Goods Receipt (GRN)',   module:'MM', icon:'🏭', color:'#117A65' },
  { value:'DC',            label:'Delivery Challan',      module:'SD', icon:'🚚', color:'#0E6655' },
  // FI
  { value:'PV',            label:'Payment Voucher',       module:'FI', icon:'💰', color:'#784212' },
  { value:'JV',            label:'Journal Entry',         module:'FI', icon:'📒', color:'#6E2F1A' },
  { value:'SALARY_REV',    label:'Salary Revision',       module:'HCM',icon:'💵', color:'#1A5276' },
  // HCM
  { value:'INCREMENT',     label:'Increment Policy',      module:'HCM',icon:'📈', color:'#117864' },
  { value:'HR_POLICY',     label:'HR Policy',             module:'HCM',icon:'📜', color:'#1F618D' },
  { value:'LEAVE',         label:'Leave Request',         module:'HCM',icon:'🏖',  color:'#2E86C1' },
  { value:'RECRUITMENT',   label:'Recruitment/Hiring',    module:'HCM',icon:'👤', color:'#2874A6' },
  // PP/QM
  { value:'WO',            label:'Work Order',            module:'PP', icon:'⚙️',  color:'#6C3483' },
  { value:'NCR',           label:'NCR/Non-Conformance',   module:'QM', icon:'⚠️',  color:'#B7950B' },
]

const MODULE_GROUPS = {
  SD:  { label:'Sales & Distribution', color:'#714B67' },
  MM:  { label:'Purchase & Materials', color:'#196F3D' },
  FI:  { label:'Finance',              color:'#784212' },
  HCM: { label:'HR & Payroll',         color:'#1F618D' },
  PP:  { label:'Production',           color:'#6C3483' },
  QM:  { label:'Quality',              color:'#B7950B' },
}

const ROLES = [
  { value:'ADMIN',      label:'Admin / MD',           dept:'Management' },
  { value:'MANAGER',    label:'General Manager',       dept:'Management' },
  { value:'ACCOUNTS',   label:'Accounts / Finance',    dept:'Finance'    },
  { value:'SALES',      label:'Sales Manager',         dept:'Sales'      },
  { value:'HR',         label:'HR Manager',            dept:'HR'         },
  { value:'OPERATIONS', label:'Operations Manager',    dept:'Operations' },
  { value:'PRODUCTION', label:'Production Manager',    dept:'Production' },
]

// ── Default workflows (pre-seeded view for companies with no DB rules yet) ──
const DEFAULT_WORKFLOWS = [
  {
    id:'DEFAULT-PR', docType:'PR', description:'Purchase Indent Approval',
    amtFrom:0, amtTo:null, isDefault:true,
    levels:[
      { level:1, roleName:'Dept HOD',        roles:['MANAGER','OPERATIONS'], action:'Review & Forward' },
      { level:2, roleName:'Purchase Manager', roles:['OPERATIONS'],           action:'Review & Approve' },
      { level:3, roleName:'General Manager',  roles:['MANAGER'],              action:'Final Approve'    },
    ]
  },
  {
    id:'DEFAULT-PO', docType:'PO', description:'Purchase Order Approval',
    amtFrom:0, amtTo:null, isDefault:true,
    levels:[
      { level:1, roleName:'Purchase Manager', roles:['OPERATIONS'],  action:'Review & Approve' },
      { level:2, roleName:'General Manager',  roles:['MANAGER'],     action:'Approve'          },
      { level:3, roleName:'MD',               roles:['ADMIN'],       action:'Final Approve (>5L)' },
    ]
  },
  {
    id:'DEFAULT-SO', docType:'SO', description:'Sales Order Approval',
    amtFrom:0, amtTo:null, isDefault:true,
    levels:[
      { level:1, roleName:'Sales Manager', roles:['SALES','MANAGER'], action:'Review & Approve' },
      { level:2, roleName:'GM / MD',       roles:['MANAGER','ADMIN'], action:'Final Approve'    },
    ]
  },
  {
    id:'DEFAULT-INVOICE', docType:'INVOICE', description:'Sales Invoice Approval',
    amtFrom:0, amtTo:null, isDefault:true,
    levels:[
      { level:1, roleName:'Finance Head',  roles:['ACCOUNTS','MANAGER'], action:'Verify'        },
      { level:2, roleName:'GM / MD',       roles:['MANAGER','ADMIN'],    action:'Final Approve' },
    ]
  },
  {
    id:'DEFAULT-PV', docType:'PV', description:'Payment Voucher Approval',
    amtFrom:0, amtTo:null, isDefault:true,
    levels:[
      { level:1, roleName:'Accounts Head', roles:['ACCOUNTS'],        action:'Verify & Forward'  },
      { level:2, roleName:'GM',            roles:['MANAGER'],         action:'Approve'            },
      { level:3, roleName:'MD',            roles:['ADMIN'],           action:'Final Approve (>5L)'},
    ]
  },
  {
    id:'DEFAULT-INCREMENT', docType:'INCREMENT', description:'Increment Policy Approval',
    amtFrom:0, amtTo:null, isDefault:true,
    levels:[
      { level:1, roleName:'HR Manager',   roles:['HR'],     action:'Review' },
      { level:2, roleName:'MD',           roles:['ADMIN'],  action:'Approve' },
    ]
  },
  {
    id:'DEFAULT-PRICE_LIST', docType:'PRICE_LIST', description:'Price List Approval',
    amtFrom:0, amtTo:null, isDefault:true,
    levels:[
      { level:1, roleName:'Sales Manager', roles:['SALES','MANAGER'], action:'Review' },
      { level:2, roleName:'MD',            roles:['ADMIN'],           action:'Approve' },
    ]
  },
  {
    id:'DEFAULT-CREDIT_NOTE', docType:'CREDIT_NOTE', description:'Credit Note / Discount',
    amtFrom:0, amtTo:null, isDefault:true,
    levels:[
      { level:1, roleName:'Sales Manager', roles:['SALES','MANAGER'], action:'Approve'          },
      { level:2, roleName:'GM / MD',       roles:['MANAGER','ADMIN'], action:'Final Approve >1L' },
    ]
  },
  {
    id:'DEFAULT-HR_POLICY', docType:'HR_POLICY', description:'HR Policy Approval',
    amtFrom:0, amtTo:null, isDefault:true,
    levels:[
      { level:1, roleName:'HR Manager', roles:['HR'],    action:'Draft & Submit' },
      { level:2, roleName:'MD',         roles:['ADMIN'], action:'Approve'        },
    ]
  },
  {
    id:'DEFAULT-LEAVE', docType:'LEAVE', description:'Leave Request Approval',
    amtFrom:0, amtTo:null, isDefault:true,
    levels:[
      { level:1, roleName:'Dept HOD',   roles:['MANAGER','OPERATIONS','HR'], action:'Approve' },
    ]
  },
]

const BLANK_LEVEL  = { roleName:'', roles:[], action:'Approve', specificUserId:null }
const BLANK_RULE   = { docType:'INVOICE', description:'', amtFrom:0, amtTo:'', levels:[{ ...BLANK_LEVEL }] }

const inp = { padding:'7px 10px', border:'1.5px solid #DDD', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const lbl = { fontSize:10, fontWeight:700, color:'#6C757D', display:'block',
  marginBottom:3, textTransform:'uppercase' }

const docMeta = (type) => DOC_TYPES.find(d => d.value === type) || { label:type, color:'#6C757D', icon:'📄', module:'—' }
const roleLabel = (r)  => ROLES.find(ro => ro.value === r)?.label || r

export default function ApprovalMatrixConfig() {
  const [dbRules,   setDbRules]   = useState([])
  const [users,     setUsers]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [moduleTab, setModuleTab] = useState('ALL')
  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState(BLANK_RULE)
  const [saving,    setSaving]    = useState(false)
  const [expanded,  setExpanded]  = useState(null)

  useEffect(() => { loadRules(); loadUsers() }, [])

  const loadRules = () => {
    setLoading(true)
    fetch(`${BASE}/approval-matrix`, { headers:hdr2() })
      .then(r => r.json())
      .then(d => setDbRules(d.data || []))
      .catch(() => {}) // backend may not have run db push yet — show defaults
      .finally(() => setLoading(false))
  }

  const loadUsers = () => {
    fetch(`${BASE}/users`, { headers:hdr2() })
      .then(r => r.json())
      .then(d => setUsers(d.data || d || []))
      .catch(() => {})
  }

  // Merge: DB rules override defaults for same docType
  const allRules = (() => {
    const dbTypes = new Set(dbRules.map(r => r.docType))
    const defaults = DEFAULT_WORKFLOWS.filter(d => !dbTypes.has(d.docType))
    return [...dbRules, ...defaults].sort((a, b) => {
      const ma = docMeta(a.docType).module
      const mb = docMeta(b.docType).module
      return ma.localeCompare(mb) || a.docType.localeCompare(b.docType)
    })
  })()

  const filtered = moduleTab === 'ALL' ? allRules
    : allRules.filter(r => docMeta(r.docType).module === moduleTab)

  // Group by module
  const grouped = filtered.reduce((acc, rule) => {
    const mod = docMeta(rule.docType).module
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(rule)
    return acc
  }, {})

  const sf = (k,v) => setForm(f => ({ ...f, [k]:v }))
  const addLevel = () => setForm(f => ({ ...f, levels:[...f.levels, { ...BLANK_LEVEL }] }))
  const delLevel = (i) => setForm(f => ({ ...f, levels:f.levels.filter((_,idx)=>idx!==i) }))
  const updLevel = (i,k,v) => setForm(f => ({ ...f, levels:f.levels.map((l,idx)=>idx===i?{...l,[k]:v}:l) }))
  const toggleRole = (i, role) => {
    const cur = form.levels[i].roles || []
    updLevel(i, 'roles', cur.includes(role) ? cur.filter(r=>r!==role) : [...cur, role])
  }

  const openNew  = (docType='') => {
    setForm({ ...BLANK_RULE, docType, levels:[{ ...BLANK_LEVEL }] })
    setModal('new')
  }

  const openEdit = (rule) => {
    if (rule.isDefault) {
      // Editing a default — create a new DB rule based on it
      const levels = Array.isArray(rule.levels) ? rule.levels : JSON.parse(rule.levels||'[]')
      setForm({ docType:rule.docType, description:rule.description||'', amtFrom:rule.amtFrom||0, amtTo:rule.amtTo||'', levels })
      setModal('from-default')
      toast('This is a default rule — saving will create a custom DB rule for your company', { icon:'ℹ️' })
    } else {
      const levels = Array.isArray(rule.levels) ? rule.levels : JSON.parse(rule.levels||'[]')
      setForm({ ...rule, levels, amtTo: rule.amtTo || '' })
      setModal(rule)
    }
  }

  const save = async () => {
    if (!form.docType) return toast.error('Select document type')
    if (!form.levels?.length) return toast.error('Add at least one level')
    if (form.levels.some(l => !l.roleName || !l.roles?.length))
      return toast.error('Each level needs a name and at least one role')

    setSaving(true)
    try {
      const payload = {
        docType:     form.docType,
        description: form.description || null,
        amtFrom:     parseFloat(form.amtFrom||0),
        amtTo:       form.amtTo!==''&&form.amtTo!=null ? parseFloat(form.amtTo) : null,
        levels:      form.levels.map((l,i) => ({ ...l, level:i+1 })),
        isActive:    true,
      }

      const isEdit = modal && modal !== 'new' && modal !== 'from-default'
      const url    = isEdit ? `${BASE}/approval-matrix/${modal.id}` : `${BASE}/approval-matrix`
      const method = isEdit ? 'PUT' : 'POST'

      const res  = await fetch(url, { method, headers:hdr(), body:JSON.stringify(payload) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success(data.message || 'Saved!')
      setModal(null); loadRules()
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const remove = async (rule) => {
    if (rule.isDefault) return toast.error('Default rules cannot be deleted — customize them first')
    if (!window.confirm('Remove this approval rule?')) return
    try {
      await fetch(`${BASE}/approval-matrix/${rule.id}`, { method:'DELETE', headers:hdr() })
      toast.success('Rule removed')
      loadRules()
    } catch(e) { toast.error(e.message) }
  }

  const seedDefaults = async () => {
    if (!window.confirm(`Seed all ${DEFAULT_WORKFLOWS.length} default workflows to DB? This makes them editable.`)) return
    setSaving(true)
    let count = 0
    for (const wf of DEFAULT_WORKFLOWS) {
      try {
        const payload = {
          docType: wf.docType, description: wf.description,
          amtFrom: 0, amtTo: null,
          levels: wf.levels.map((l,i) => ({ ...l, level:i+1 })),
          isActive: true,
        }
        await fetch(`${BASE}/approval-matrix`, { method:'POST', headers:hdr(), body:JSON.stringify(payload) })
        count++
      } catch {}
    }
    toast.success(`${count} workflows seeded to DB`)
    setSaving(false)
    loadRules()
  }

  // ── Rule Card ────────────────────────────────────────────────
  const RuleCard = ({ rule }) => {
    const dm     = docMeta(rule.docType)
    const levels = Array.isArray(rule.levels) ? rule.levels : (() => { try { return JSON.parse(rule.levels||'[]') } catch { return [] } })()
    const isExp  = expanded === (rule.id || rule.docType)
    const toggle = () => setExpanded(isExp ? null : (rule.id || rule.docType))

    return (
      <div style={{ border:`1px solid ${dm.color}30`, borderRadius:8, marginBottom:8,
        overflow:'hidden', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>

        {/* Card Header */}
        <div onClick={toggle} style={{ display:'flex', alignItems:'center', gap:12,
          padding:'11px 14px', cursor:'pointer',
          background: isExp ? `${dm.color}08` : '#fff',
          borderBottom: isExp ? `1px solid ${dm.color}20` : 'none' }}>

          {/* Color stripe */}
          <div style={{ width:4, height:36, borderRadius:2, background:dm.color, flexShrink:0 }} />

          <span style={{ fontSize:18 }}>{dm.icon}</span>

          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#2D3748' }}>
              {dm.label}
              {rule.isDefault && (
                <span style={{ marginLeft:8, fontSize:9, background:'#FFF3CD', color:'#856404',
                  border:'1px solid #FFEAA7', padding:'1px 6px', borderRadius:3, fontWeight:600 }}>
                  DEFAULT
                </span>
              )}
            </div>
            <div style={{ fontSize:11, color:'#6C757D', marginTop:1 }}>
              {rule.description || `${levels.length}-level approval`}
              {rule.amtFrom != null && (
                <span style={{ marginLeft:8, fontFamily:'DM Mono,monospace', fontSize:10 }}>
                  · {fmtAmt(rule.amtFrom)} – {fmtAmt(rule.amtTo)}
                </span>
              )}
            </div>
          </div>

          {/* Level pills */}
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            {levels.map((l,i) => (
              <React.Fragment key={i}>
                <div style={{ background:`${dm.color}15`, color:dm.color, border:`1px solid ${dm.color}40`,
                  padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>
                  L{l.level||i+1}: {l.roleName}
                </div>
                {i < levels.length-1 && <span style={{ color:'#CCC' }}>→</span>}
              </React.Fragment>
            ))}
            <span style={{ color:'#28A745', marginLeft:4 }}>→ ✓</span>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:6 }} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>openEdit(rule)}
              style={{ padding:'4px 12px', background:`${dm.color}15`, color:dm.color,
                border:`1px solid ${dm.color}40`, borderRadius:5, fontSize:11,
                fontWeight:700, cursor:'pointer' }}>
              {rule.isDefault ? '✏️ Customize' : '✏️ Edit'}
            </button>
            {!rule.isDefault && (
              <button onClick={()=>remove(rule)}
                style={{ padding:'4px 10px', background:'#FFF5F5', color:'#DC3545',
                  border:'1px solid #F5C6CB', borderRadius:5, fontSize:11, cursor:'pointer' }}>
                ✕
              </button>
            )}
          </div>

          <span style={{ color:'#CCC', fontSize:12 }}>{isExp ? '▲' : '▼'}</span>
        </div>

        {/* Expanded Detail */}
        {isExp && (
          <div style={{ padding:'14px 16px', background:'#FAFAFA' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'#E2E3E5',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:700, color:'#6C757D' }}>S</div>
              <div style={{ fontSize:11, fontWeight:600, color:'#6C757D' }}>Submitted</div>

              {levels.map((l, i) => {
                const lv = l.level || i+1
                return (
                  <React.Fragment key={i}>
                    <div style={{ color:'#CCC' }}>→</div>
                    <div style={{ background:`${dm.color}12`, border:`1px solid ${dm.color}30`,
                      borderRadius:6, padding:'6px 12px', minWidth:140 }}>
                      <div style={{ fontSize:11, fontWeight:800, color:dm.color }}>
                        L{lv} — {l.roleName}
                      </div>
                      <div style={{ fontSize:10, color:'#6C757D', marginTop:2 }}>
                        {(l.roles||[]).map(r=>roleLabel(r)).join(' / ')}
                      </div>
                      <div style={{ fontSize:10, color:'#856404', marginTop:1 }}>
                        {l.action || 'Approve'}
                      </div>
                    </div>
                  </React.Fragment>
                )
              })}

              <div style={{ color:'#CCC' }}>→</div>
              <div style={{ background:'#D4EDDA', border:'1px solid #C3E6CB',
                borderRadius:6, padding:'6px 12px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#155724' }}>✓ Approved</div>
                <div style={{ fontSize:10, color:'#155724' }}>Document proceeds</div>
              </div>

              <div style={{ color:'#CCC' }}>|</div>
              <div style={{ background:'#F8D7DA', border:'1px solid #F5C6CB',
                borderRadius:6, padding:'6px 12px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#721C24' }}>✗ Rejected</div>
                <div style={{ fontSize:10, color:'#721C24' }}>Back to creator</div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Edit Modal ───────────────────────────────────────────────
  const EditModal = () => {
    if (!modal) return null
    const dm = docMeta(form.docType)
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
        zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
        <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:700,
          maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

          <div style={{ background:`linear-gradient(135deg,${dm.color},${dm.color}CC)`, color:'#fff',
            padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center',
            position:'sticky', top:0, zIndex:1 }}>
            <div style={{ fontWeight:800, fontSize:14 }}>
              {modal==='new' ? '+ New Approval Rule' : modal==='from-default' ? '✏️ Customize Default Rule' : `Edit — ${dm.label}`}
            </div>
            <button onClick={()=>setModal(null)}
              style={{ background:'transparent', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>✕</button>
          </div>

          <div style={{ padding:20 }}>

            {/* Doc Type */}
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Document Type *</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {DOC_TYPES.map(dt => (
                  <button key={dt.value} onClick={()=>sf('docType',dt.value)}
                    style={{ padding:'5px 12px', borderRadius:6, fontSize:11, fontWeight:600,
                      cursor:'pointer', border:`1.5px solid ${dt.color}`,
                      background: form.docType===dt.value ? dt.color : '#fff',
                      color:       form.docType===dt.value ? '#fff'   : dt.color }}>
                    {dt.icon} {dt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description + Amount */}
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Rule Description</label>
              <input style={inp} value={form.description||''} onChange={e=>sf('description',e.target.value)}
                placeholder="e.g. Invoice above ₹5L needs Finance Head + MD approval" />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div>
                <label style={lbl}>Amount From (₹)</label>
                <input type="number" style={inp} value={form.amtFrom||0} min={0}
                  onChange={e=>sf('amtFrom',e.target.value)} placeholder="0" />
              </div>
              <div>
                <label style={lbl}>Amount To (₹) — blank = unlimited</label>
                <input type="number" style={inp} value={form.amtTo||''} min={0}
                  onChange={e=>sf('amtTo',e.target.value)} placeholder="∞ unlimited" />
              </div>
            </div>

            {/* Levels */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <label style={{ ...lbl, marginBottom:0 }}>Approval Levels *</label>
              <button onClick={addLevel}
                style={{ padding:'4px 14px', background:dm.color, color:'#fff',
                  border:'none', borderRadius:5, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                + Add Level
              </button>
            </div>

            {form.levels.map((lv, i) => (
              <div key={i} style={{ border:'1.5px solid #E0D5E0', borderRadius:8,
                padding:'12px 14px', marginBottom:10, background:'#FAFAFA' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:dm.color }}>
                    Level {i+1} Approver
                  </div>
                  {form.levels.length > 1 && (
                    <button onClick={()=>delLevel(i)}
                      style={{ background:'#F8D7DA', color:'#721C24', border:'none',
                        borderRadius:4, padding:'2px 8px', cursor:'pointer', fontSize:11 }}>
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                  <div>
                    <label style={lbl}>Level Title / Role Name</label>
                    <input style={inp} value={lv.roleName||''}
                      onChange={e=>updLevel(i,'roleName',e.target.value)}
                      placeholder="e.g. Finance Head, GM, MD, HOD..." />
                  </div>
                  <div>
                    <label style={lbl}>Action Label</label>
                    <input style={inp} value={lv.action||'Approve'}
                      onChange={e=>updLevel(i,'action',e.target.value)}
                      placeholder="e.g. Review & Forward, Final Approve..." />
                  </div>
                </div>

                <div style={{ marginBottom:10 }}>
                  <label style={lbl}>Who can approve? (select system roles)</label>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {ROLES.map(role => {
                      const sel = (lv.roles||[]).includes(role.value)
                      return (
                        <button key={role.value} onClick={()=>toggleRole(i,role.value)}
                          style={{ padding:'4px 12px', borderRadius:14, fontSize:11,
                            fontWeight:600, cursor:'pointer', border:'1.5px solid',
                            borderColor: sel ? dm.color : '#DDD',
                            background:  sel ? dm.color : '#fff',
                            color:       sel ? '#fff'   : '#6C757D' }}>
                          {role.label}
                        </button>
                      )
                    })}
                  </div>
                  {!(lv.roles||[]).length && (
                    <div style={{ fontSize:10, color:'#DC3545', marginTop:3 }}>⚠ Select at least one role</div>
                  )}
                </div>

                <div>
                  <label style={lbl}>Specific Person (optional — blank = any user with above role)</label>
                  <select style={inp} value={lv.specificUserId||''}
                    onChange={e=>updLevel(i,'specificUserId',e.target.value||null)}>
                    <option value="">-- Any user with selected role --</option>
                    {users.filter(u=>u.isActive).map(u=>(
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.role}{u.designation?` (${u.designation})`:''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {/* Flow preview */}
            {form.levels.length > 0 && (
              <div style={{ background:`${dm.color}08`, border:`1px solid ${dm.color}20`,
                borderRadius:6, padding:'10px 14px', marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:700, color:dm.color,
                  textTransform:'uppercase', marginBottom:8 }}>Approval Flow Preview</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  <span style={{ background:'#E2E3E5', padding:'3px 8px', borderRadius:4, fontSize:11 }}>Submit</span>
                  {form.levels.map((lv,i)=>(
                    <React.Fragment key={i}>
                      <span style={{ color:'#CCC' }}>→</span>
                      <span style={{ background:`${dm.color}15`, color:dm.color,
                        border:`1px solid ${dm.color}40`, padding:'3px 10px', borderRadius:4,
                        fontSize:11, fontWeight:700 }}>
                        L{i+1}: {lv.roleName||'?'}
                      </span>
                    </React.Fragment>
                  ))}
                  <span style={{ color:'#CCC' }}>→</span>
                  <span style={{ background:'#D4EDDA', color:'#155724',
                    padding:'3px 10px', borderRadius:4, fontSize:11, fontWeight:700 }}>✓ Approved</span>
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end',
              borderTop:'1px solid #F0F0F0', paddingTop:14 }}>
              <button onClick={()=>setModal(null)}
                style={{ padding:'8px 20px', background:'#fff', border:'1px solid #DDD',
                  borderRadius:6, fontSize:13, cursor:'pointer', color:'#6C757D' }}>Cancel</button>
              <button onClick={save} disabled={saving}
                style={{ padding:'8px 24px', background:dm.color, color:'#fff',
                  border:'none', borderRadius:6, fontWeight:700, fontSize:13,
                  cursor:'pointer', opacity:saving?0.6:1 }}>
                {saving ? '⏳ Saving...' : '✓ Save Rule'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const modules = ['ALL', ...Object.keys(MODULE_GROUPS)]

  return (
    <div style={{ maxWidth:1200, margin:'0 auto' }}>

      {/* Page Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ margin:0, color:'#714B67', fontSize:18, fontWeight:800 }}>
            🔐 Approval Matrix
          </h2>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'#6C757D' }}>
            Configure who approves which document — per doc type, amount slab, role or specific person.
            Default rules shown until customized.
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={seedDefaults} disabled={saving}
            style={{ padding:'8px 16px', background:'#fff', border:'1.5px solid #714B67',
              color:'#714B67', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer' }}>
            📥 Seed Defaults to DB
          </button>
          <button onClick={()=>openNew()}
            style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
              border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
            + Custom Rule
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background:'#FFF8E1', border:'1px solid #F5C518', borderRadius:6,
        padding:'10px 14px', marginBottom:14, fontSize:12, color:'#856404',
        display:'flex', gap:8, alignItems:'flex-start' }}>
        <span style={{ fontSize:16 }}>💡</span>
        <div>
          <strong>DEFAULT rules</strong> are built-in templates based on standard Indian SME practices (PR → HOD → GM, Invoice → Finance → MD, etc.).
          Click <strong>Customize</strong> to save them to your DB and edit. <strong>Custom rules</strong> (DB-backed) override defaults for that doc type.
        </div>
      </div>

      {/* Module Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {modules.map(mod => {
          const mg = MODULE_GROUPS[mod]
          return (
            <button key={mod} onClick={()=>setModuleTab(mod)}
              style={{ padding:'5px 14px', borderRadius:16, fontSize:11, fontWeight:700,
                cursor:'pointer', border:'none',
                background: moduleTab===mod ? (mg?.color||'#714B67') : '#F0F0F0',
                color:       moduleTab===mod ? '#fff' : '#6C757D' }}>
              {mod==='ALL' ? 'All Modules' : `${mg?.label} (${allRules.filter(r=>docMeta(r.docType).module===mod).length})`}
            </button>
          )
        })}
        <span style={{ marginLeft:'auto', fontSize:11, color:'#6C757D', alignSelf:'center' }}>
          {allRules.filter(r=>!r.isDefault).length} custom · {allRules.filter(r=>r.isDefault).length} default
        </span>
      </div>

      {/* Rules grouped by module */}
      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>Loading...</div>
      ) : (
        Object.entries(grouped).map(([mod, rules]) => {
          const mg = MODULE_GROUPS[mod] || { label:mod, color:'#6C757D' }
          return (
            <div key={mod} style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ height:2, flex:1, background:`${mg.color}30` }} />
                <span style={{ fontSize:11, fontWeight:800, color:mg.color,
                  textTransform:'uppercase', letterSpacing:'1px' }}>
                  {mg.label}
                </span>
                <button onClick={()=>openNew(DOC_TYPES.find(d=>d.module===mod)?.value||'')}
                  style={{ padding:'2px 10px', background:`${mg.color}15`, color:mg.color,
                    border:`1px solid ${mg.color}40`, borderRadius:10, fontSize:10,
                    fontWeight:700, cursor:'pointer' }}>
                  + Add {mg.label} Rule
                </button>
                <div style={{ height:2, flex:1, background:`${mg.color}30` }} />
              </div>
              {rules.map(r => <RuleCard key={r.id||r.docType} rule={r} />)}
            </div>
          )
        })
      )}

      <EditModal />
    </div>
  )
}
